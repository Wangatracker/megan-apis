// ─── MEGAN SPORTS ROUTES ─────────────────────────────────────────────────
// Explicit routes that call the megan-sports Cloudflare Worker.
// No catch-all proxy — every endpoint is declared here.

import type { Express, Request, Response } from "express";

const SPORTS_WORKER = process.env.SPORTS_WORKER_URL || "https://megan-sports.trackerwanga254.workers.dev";

// ─── In-memory cache ────────────────────────────────────────────────────
const cache = new Map<string, { data: any; expires: number }>();

async function callWorker(path: string, ttlMs: number = 10_000): Promise<any> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${SPORTS_WORKER}${path}`, {
      headers: { "Accept": "application/json", "User-Agent": "Megan-API/1.0" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Worker responded ${res.status}`);
    const data = await res.json();
    cache.set(path, { data, expires: Date.now() + ttlMs });
    if (cache.size > 200) {
      const now = Date.now();
      for (const [k, v] of cache) if (v.expires < now) cache.delete(k);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function registerSportsRoutes(app: Express): void {
  const creatorTag = "Megan APIs v3.7.0 | Tracker Wanga | Megan Tech";

  // ─── Helper wrapper ──────────────────────────────────────────────────
  const send = (req: Request, res: Response, path: string, ttl: number, category = "Sports", categoryId = "sports") =>
    callWorker(path, ttl)
      .then((data) => {
        const result = data?.data ?? data;
        return res.json({
          success: true,
          creator: creatorTag,
          category,
          categoryId,
          result,
        });
      })
      .catch((e: any) => {
        console.error(`[Sports] ${path} failed:`, e.message);
        return res.status(502).json({
          success: false,
          creator: creatorTag,
          error: e.message || "Sports worker unavailable",
        });
      });

  // ═══════════════════════════════════════════════════════════════════
  // MATCHES (15)
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/sports/v2/matches/live", (req, res) => send(req, res, "/api/v2/matches/live", 10_000));
  app.get("/api/sports/v2/matches/live/football", (req, res) => send(req, res, "/api/v2/matches/live/football", 10_000));
  app.get("/api/sports/v2/matches/live/nba", (req, res) => send(req, res, "/api/v2/matches/live/nba", 10_000));
  app.get("/api/sports/v2/matches/live/nfl", (req, res) => send(req, res, "/api/v2/matches/live/nfl", 10_000));
  app.get("/api/sports/v2/matches/live/basketball", (req, res) => send(req, res, "/api/v2/matches/live/basketball", 10_000));
  app.get("/api/sports/v2/matches/live/tennis", (req, res) => send(req, res, "/api/v2/matches/live/tennis", 10_000));
  app.get("/api/sports/v2/matches/live/cricket", (req, res) => send(req, res, "/api/v2/matches/live/cricket", 10_000));
  app.get("/api/sports/v2/matches/live/baseball", (req, res) => send(req, res, "/api/v2/matches/live/baseball", 10_000));
  app.get("/api/sports/v2/matches/live/hockey", (req, res) => send(req, res, "/api/v2/matches/live/hockey", 10_000));
  app.get("/api/sports/v2/matches/live/rugby", (req, res) => send(req, res, "/api/v2/matches/live/rugby", 10_000));
  app.get("/api/sports/v2/matches/live/f1", (req, res) => send(req, res, "/api/v2/matches/live/f1", 10_000));

  app.get("/api/sports/v2/matches", (req, res) => send(req, res, "/api/v2/matches", 10_000));
  app.get("/api/sports/v2/matches/today", (req, res) => send(req, res, "/api/v2/matches/today", 10_000));
  app.get("/api/sports/v2/matches/tomorrow", (req, res) => send(req, res, "/api/v2/matches/tomorrow", 180_000));
  app.get("/api/sports/v2/matches/upcoming", (req, res) => send(req, res, "/api/v2/matches/upcoming", 180_000));

  app.get("/api/sports/v2/matches/search", (req, res) => {
    const q = String(req.query.q || "");
    if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" });
    return send(req, res, `/api/v2/matches/search?q=${encodeURIComponent(q)}`, 10_000);
  });

  app.get("/api/sports/v2/matches/league/:league", (req, res) =>
    send(req, res, `/api/v2/matches/league/${encodeURIComponent(req.params.league)}`, 10_000));

  app.get("/api/sports/v2/match/:id", (req, res) =>
    send(req, res, `/api/v2/match/${encodeURIComponent(req.params.id)}`, 10_000));

  app.get("/api/sports/v2/match/:id/streams", (req, res) =>
    send(req, res, `/api/v2/match/${encodeURIComponent(req.params.id)}/streams`, 30_000));

  app.get("/api/sports/v2/match/:id/stats", (req, res) =>
    send(req, res, `/api/v2/match/${encodeURIComponent(req.params.id)}/stats`, 60_000));

  // ═══════════════════════════════════════════════════════════════════
  // LEAGUES (6)
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/sports/v2/leagues", (req, res) => send(req, res, "/api/v2/leagues", 86_400_000));
  app.get("/api/sports/v2/leagues/:id", (req, res) =>
    send(req, res, `/api/v2/leagues/${encodeURIComponent(req.params.id)}`, 86_400_000));
  app.get("/api/sports/v2/leagues/:id/standings", (req, res) =>
    send(req, res, `/api/v2/leagues/${encodeURIComponent(req.params.id)}/standings`, 21_600_000));
  app.get("/api/sports/v2/leagues/:id/fixtures", (req, res) =>
    send(req, res, `/api/v2/leagues/${encodeURIComponent(req.params.id)}/fixtures`, 180_000));
  app.get("/api/sports/v2/leagues/:id/results", (req, res) =>
    send(req, res, `/api/v2/leagues/${encodeURIComponent(req.params.id)}/results`, 21_600_000));

  // ═══════════════════════════════════════════════════════════════════
  // TEAMS (4)
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/sports/v2/teams/search", (req, res) => {
    const q = String(req.query.q || "");
    if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" });
    return send(req, res, `/api/v2/teams/search?q=${encodeURIComponent(q)}`, 86_400_000);
  });
  app.get("/api/sports/v2/teams/:id", (req, res) =>
    send(req, res, `/api/v2/teams/${encodeURIComponent(req.params.id)}`, 86_400_000));
  app.get("/api/sports/v2/teams/:id/squad", (req, res) =>
    send(req, res, `/api/v2/teams/${encodeURIComponent(req.params.id)}/squad`, 86_400_000));
  app.get("/api/sports/v2/teams/:id/fixtures", (req, res) =>
    send(req, res, `/api/v2/teams/${encodeURIComponent(req.params.id)}/fixtures`, 180_000));

  // ═══════════════════════════════════════════════════════════════════
  // SPORTS CATALOG (11)
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/sports/v2/sports", (req, res) => send(req, res, "/api/v2/sports", 86_400_000));
  app.get("/api/sports/v2/sports/football", (req, res) => send(req, res, "/api/v2/sports/football", 10_000));
  app.get("/api/sports/v2/sports/basketball", (req, res) => send(req, res, "/api/v2/sports/basketball", 60_000));
  app.get("/api/sports/v2/sports/tennis", (req, res) => send(req, res, "/api/v2/sports/tennis", 60_000));
  app.get("/api/sports/v2/sports/cricket", (req, res) => send(req, res, "/api/v2/sports/cricket", 60_000));
  app.get("/api/sports/v2/sports/f1", (req, res) => send(req, res, "/api/v2/sports/f1", 60_000));
  app.get("/api/sports/v2/sports/nba", (req, res) => send(req, res, "/api/v2/sports/nba", 60_000));
  app.get("/api/sports/v2/sports/nfl", (req, res) => send(req, res, "/api/v2/sports/nfl", 60_000));
  app.get("/api/sports/v2/sports/baseball", (req, res) => send(req, res, "/api/v2/sports/baseball", 60_000));
  app.get("/api/sports/v2/sports/hockey", (req, res) => send(req, res, "/api/v2/sports/hockey", 60_000));
  app.get("/api/sports/v2/sports/rugby", (req, res) => send(req, res, "/api/v2/sports/rugby", 60_000));

  app.get("/api/sports/v2/providers", (req, res) => send(req, res, "/api/v2/providers", 60_000));
  app.get("/api/sports/v2/status", (req, res) => send(req, res, "/api/v2/status", 10_000));

  // ═══════════════════════════════════════════════════════════════════
  // NEWS + HIGHLIGHTS (4)
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/sports/v2/news", (req, res) => send(req, res, "/api/v2/news", 300_000));
  app.get("/api/sports/v2/news/search", (req, res) => {
    const q = String(req.query.q || "");
    if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" });
    return send(req, res, `/api/v2/news/search?q=${encodeURIComponent(q)}`, 300_000);
  });
  app.get("/api/sports/v2/news/:id", (req, res) =>
    send(req, res, `/api/v2/news/${encodeURIComponent(req.params.id)}`, 300_000));
  app.get("/api/sports/v2/highlights", (req, res) => send(req, res, "/api/v2/highlights", 3_600_000));

  // ═══════════════════════════════════════════════════════════════════
  // WORLD CUP (5)
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/sports/v2/worldcup/teams", (req, res) => send(req, res, "/api/v2/worldcup/teams", 86_400_000));
  app.get("/api/sports/v2/worldcup/teams/:slug", (req, res) =>
    send(req, res, `/api/v2/worldcup/teams/${encodeURIComponent(req.params.slug)}`, 86_400_000));
  app.get("/api/sports/v2/worldcup/superstars", (req, res) => send(req, res, "/api/v2/worldcup/superstars", 86_400_000));
  app.get("/api/sports/v2/worldcup/superstars/:slug", (req, res) =>
    send(req, res, `/api/v2/worldcup/superstars/${encodeURIComponent(req.params.slug)}`, 86_400_000));
  app.get("/api/sports/v2/worldcup/fixtures", (req, res) => send(req, res, "/api/v2/worldcup/fixtures", 180_000));

  // ═══════════════════════════════════════════════════════════════════
  // BASE — quick overview
  // ═══════════════════════════════════════════════════════════════════
  app.get("/api/sports/v2", (req, res) => send(req, res, "/api/v2/status", 10_000));

  console.log("✅ Megan Sports Routes Registered (40 endpoints):");
  console.log("  GET  /api/sports/v2/matches/live");
  console.log("  GET  /api/sports/v2/matches/today");
  console.log("  GET  /api/sports/v2/match/:id/streams");
  console.log("  GET  /api/sports/v2/leagues/:id/standings");
  console.log("  GET  /api/sports/v2/worldcup/teams");
  console.log("  ... and 35 more under /api/sports/v2/*");
  console.log("  Worker: " + SPORTS_WORKER);
}
