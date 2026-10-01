// ─── SPORTS ROUTES ────────────────────────────────────────────────────────
// Proxy /api/sports/* to the megan-sports Cloudflare Worker.
// The worker handles: matches, streams, leagues, teams, World Cup, news.

import type { Express, Request, Response } from "express";

const SPORTS_WORKER = process.env.SPORTS_WORKER_URL || "https://megan-sports.trackerwanga254.workers.dev";

// Path mapping: our public /api/sports/* paths → worker /api/v2/* paths
function mapPath(publicPath: string): string {
  const p = publicPath.replace(/^\/api\/sports/, "");
  if (p === "" || p === "/") return "/api/v2/status";

  // Direct v2 passthrough
  if (p.startsWith("/v2/")) {
    return `/api/v2${p.slice(3)}`;
  }

  // Legacy /api/sports/* → v1 worker endpoints
  return `/api${p}`;
}

export function registerSportsRoutes(app: Express): void {
  // Catch-all for /api/sports/*
  app.all("/api/sports/*", async (req: Request, res: Response) => {
    try {
      const workerPath = mapPath(req.originalUrl.split("?")[0]);
      const query = req.originalUrl.includes("?") ? "?" + req.originalUrl.split("?")[1] : "";
      const url = `${SPORTS_WORKER}${workerPath}${query}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Megan-API-Proxy/1.0",
          "Accept": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = response.headers.get("content-type") || "application/json";
      const body = await response.text();

      res.status(response.status)
        .set("Content-Type", contentType)
        .set("Cache-Control", "public, max-age=10")
        .send(body);
    } catch (e: any) {
      console.error("[Sports Proxy] Error:", e.message);
      res.status(502).json({
        success: false,
        error: "Sports worker unavailable",
        message: e.message,
        hint: "The megan-sports worker may be down. Try again in a moment.",
      });
    }
  });

  // Base endpoint
  app.get("/api/sports", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${SPORTS_WORKER}/api/v2/status`);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ success: false, error: e.message });
    }
  });

  console.log("✅ Sports Proxy Routes Registered:");
  console.log("  GET  /api/sports                      → /api/v2/status");
  console.log("  GET  /api/sports/*                    → proxied to megan-sports worker");
  console.log("  ALL  /api/sports/v2/*                 → /api/v2/* (rich v2 endpoints)");
  console.log("       /api/sports/live                  → /api/live");
  console.log("       /api/sports/matches/live          → /api/matches/live");
  console.log("       /api/sports/matches/today         → /api/matches/today");
  console.log("       /api/sports/match/:id/streams     → /api/match/:id/streams");
  console.log("       /api/sports/v2/leagues            → /api/v2/leagues");
  console.log("       /api/sports/v2/worldcup/teams     → /api/v2/worldcup/teams");
  console.log("       /api/sports/v2/providers          → /api/v2/providers");
  console.log("  Worker: " + SPORTS_WORKER);
}
