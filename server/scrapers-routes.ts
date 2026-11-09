import type { Express, Request, Response } from "express";

// Megan Scrapers Proxy
// Forwards /api/scrapers/:name/* -> megan-scrapers.onrender.com/scrape/:name
// Keeps our scrapers behind the main API so they show up in /categories.

const SCRAPERS_BASE = process.env.SCRAPERS_BASE || "https://megan-scrapers.onrender.com";

const SCRAPERS = {
  yts:       "YTS movie torrents",
  nyaa:      "Nyaa anime torrents",
  itunes:    "iTunes music search",
  deezer:    "Deezer music search",
  net9ja:    "Net9ja Nollywood movies",
  sportybet: "SportyBet live sports odds",
} as const;

type ScraperName = keyof typeof SCRAPERS;

export function registerScrapersRoutes(app: Express): void {

  // List available scrapers
  app.get("/api/scrapers", (_req: Request, res: Response) => {
    res.json({
      success: true,
      provider: "Megan Scrapers",
      scrapers: Object.entries(SCRAPERS).map(([name, description]) => ({
        name,
        description,
        endpoint: "/api/scrapers/" + name,
      })),
    });
  });

  // Proxy any /api/scrapers/:name call to the Render service
  app.get("/api/scrapers/:name", async (req: Request, res: Response) => {
    const name = req.params.name as ScraperName;

    if (!SCRAPERS[name]) {
      return res.status(404).json({
        success: false,
        error: "Unknown scraper: " + name,
        available: Object.keys(SCRAPERS),
      });
    }

    // Forward all query parameters
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    const target = SCRAPERS_BASE + "/scrape/" + name + (qs ? "?" + qs : "");

    try {
      const upstream = await fetch(target, {
        headers: { "User-Agent": "Megan-APIs/3.7.1" },
        signal: AbortSignal.timeout(45000),
      });

      const text = await upstream.text();
      const contentType = upstream.headers.get("content-type") || "application/json";

      res.status(upstream.status).set("Content-Type", contentType).send(text);
    } catch (e: any) {
      return res.status(502).json({
        success: false,
        error: e.message || "Scraper service unavailable",
        hint: "The Render service may be cold-starting. Retry in 30s.",
        upstream: target,
      });
    }
  });

  console.log("Scrapers Proxy Routes Registered:");
  for (const name of Object.keys(SCRAPERS)) {
    console.log("  GET /api/scrapers/" + name);
  }
}
