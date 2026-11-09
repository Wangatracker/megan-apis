import type { Express, Request, Response } from "express";

// ============================================
// MEGAN SCRAPERS PROXY
// ============================================
// Proxies /api/{scraper}/{action} -> megan-scrapers.onrender.com/scrape/{scraper}
//
// Two route patterns:
//   1. New clean routes: GET /api/yts/search?q=matrix
//   2. Legacy alias:     GET /api/scrapers/yts?action=search&q=matrix
//
// Both work. New routes are the recommended API. Legacy preserved for compat.

const SCRAPERS_BASE = process.env.SCRAPERS_BASE || "https://megan-scrapers.onrender.com";

const SCRAPERS: Record<string, string> = {
  yts: "YTS movie torrents",
  nyaa: "Nyaa anime torrents",
  itunes: "iTunes music search",
  deezer: "Deezer music search",
  net9ja: "Net9ja Nollywood movies",
  sportybet: "SportyBet live sports odds",
};

// Fetch with retry for cold-start 502/503
async function robustFetch(target: string, retries = 2): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(target, {
        headers: { "User-Agent": "Megan-APIs/3.7.1" },
        signal: AbortSignal.timeout(60000),
      });
      if ((res.status === 502 || res.status === 503) && i < retries) {
        lastErr = new Error(`HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return res;
    } catch (e: any) {
      lastErr = e;
      if (i < retries) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}

// Core proxy helper: fetch from scraper service and pipe response
async function proxyToScraper(
  scraper: string,
  params: Record<string, any>,
  res: Response,
): Promise<void> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const target = `${SCRAPERS_BASE}/scrape/${scraper}${qs.toString() ? "?" + qs.toString() : ""}`;

  try {
    const upstream = await robustFetch(target);
    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";
    res.status(upstream.status).set("Content-Type", contentType).send(text);
  } catch (e: any) {
    res.status(502).json({
      success: false,
      error: e.message || "Scraper service unavailable",
      hint: "The Render service may be cold-starting. Retry in 30s.",
      scraper,
    });
  }
}

export function registerScrapersRoutes(app: Express): void {

  // ============================================
  // YTS — movies
  // ============================================
  app.get("/api/yts/search", async (req: Request, res: Response) => {
    await proxyToScraper("yts", { action: "search", q: req.query.q || req.query.query, limit: req.query.limit, page: req.query.page, quality: req.query.quality, rating: req.query.rating, genre: req.query.genre, sort_by: req.query.sort_by }, res);
  });

  app.get("/api/yts/latest", async (req: Request, res: Response) => {
    await proxyToScraper("yts", { action: "latest", limit: req.query.limit, page: req.query.page }, res);
  });

  app.get("/api/yts/movie/:id", async (req: Request, res: Response) => {
    await proxyToScraper("yts", { action: "movie", id: req.params.id }, res);
  });

  // ============================================
  // NYAA — anime torrents
  // ============================================
  app.get("/api/nyaa/search", async (req: Request, res: Response) => {
    await proxyToScraper("nyaa", { action: "search", q: req.query.q || req.query.query, category: req.query.category, filter: req.query.filter }, res);
  });

  app.get("/api/nyaa/latest", async (req: Request, res: Response) => {
    await proxyToScraper("nyaa", { action: "latest", category: req.query.category, filter: req.query.filter }, res);
  });

  // ============================================
  // DEEZER — music
  // ============================================
  app.get("/api/deezer/search", async (req: Request, res: Response) => {
    await proxyToScraper("deezer", { action: "search", q: req.query.q || req.query.query, limit: req.query.limit }, res);
  });

  app.get("/api/deezer/track/:id", async (req: Request, res: Response) => {
    await proxyToScraper("deezer", { action: "track", id: req.params.id }, res);
  });

  app.get("/api/deezer/album/:id", async (req: Request, res: Response) => {
    await proxyToScraper("deezer", { action: "album", id: req.params.id }, res);
  });

  app.get("/api/deezer/artist/:id", async (req: Request, res: Response) => {
    await proxyToScraper("deezer", { action: "artist", id: req.params.id }, res);
  });

  app.get("/api/deezer/artist-search", async (req: Request, res: Response) => {
    await proxyToScraper("deezer", { action: "artist-search", q: req.query.q || req.query.query, limit: req.query.limit }, res);
  });

  // ============================================
  // ITUNES — music
  // ============================================
  app.get("/api/itunes/search", async (req: Request, res: Response) => {
    await proxyToScraper("itunes", { action: "search", q: req.query.q || req.query.query, limit: req.query.limit, country: req.query.country }, res);
  });

  app.get("/api/itunes/albums", async (req: Request, res: Response) => {
    await proxyToScraper("itunes", { action: "albums", q: req.query.q || req.query.query, limit: req.query.limit, country: req.query.country }, res);
  });

  app.get("/api/itunes/artists", async (req: Request, res: Response) => {
    await proxyToScraper("itunes", { action: "artists", q: req.query.q || req.query.query, limit: req.query.limit, country: req.query.country }, res);
  });

  app.get("/api/itunes/song/:id", async (req: Request, res: Response) => {
    await proxyToScraper("itunes", { action: "song", id: req.params.id }, res);
  });

  // ============================================
  // NET9JA — Nollywood
  // ============================================
  app.get("/api/net9ja/home", async (req: Request, res: Response) => {
    await proxyToScraper("net9ja", { action: "home", limit: req.query.limit, page: req.query.page }, res);
  });

  app.get("/api/net9ja/search", async (req: Request, res: Response) => {
    await proxyToScraper("net9ja", { action: "search", q: req.query.q || req.query.query, limit: req.query.limit, page: req.query.page }, res);
  });

  app.get("/api/net9ja/movies", async (req: Request, res: Response) => {
    await proxyToScraper("net9ja", { action: "movies", limit: req.query.limit, page: req.query.page }, res);
  });

  app.get("/api/net9ja/series", async (req: Request, res: Response) => {
    await proxyToScraper("net9ja", { action: "series", limit: req.query.limit, page: req.query.page }, res);
  });

  app.get("/api/net9ja/post/:slug", async (req: Request, res: Response) => {
    await proxyToScraper("net9ja", { action: "post", slug: req.params.slug }, res);
  });

  app.get("/api/net9ja/resolve/:slug", async (req: Request, res: Response) => {
    await proxyToScraper("net9ja", { action: "resolve", slug: req.params.slug }, res);
  });

  // ============================================
  // SPORTYBET — sports odds
  // ============================================
  app.get("/api/sportybet/sports", async (req: Request, res: Response) => {
    await proxyToScraper("sportybet", { action: "sports", region: req.query.region }, res);
  });

  app.get("/api/sportybet/live", async (req: Request, res: Response) => {
    await proxyToScraper("sportybet", { action: "live", region: req.query.region, sportId: req.query.sportId || req.query.sport, limit: req.query.limit }, res);
  });

  app.get("/api/sportybet/prematch", async (req: Request, res: Response) => {
    await proxyToScraper("sportybet", { action: "prematch", region: req.query.region, sportId: req.query.sportId || req.query.sport, limit: req.query.limit }, res);
  });

  app.get("/api/sportybet/event/:id", async (req: Request, res: Response) => {
    await proxyToScraper("sportybet", { action: "event", eventId: req.params.id, region: req.query.region, sportId: req.query.sportId }, res);
  });

  // ============================================
  // LEGACY ALIASES — /api/scrapers/:name
  // ============================================
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

  app.get("/api/scrapers/:name", async (req: Request, res: Response) => {
    const name = String(req.params.name);
    if (!SCRAPERS[name]) {
      return res.status(404).json({
        success: false,
        error: "Unknown scraper: " + name,
        available: Object.keys(SCRAPERS),
      });
    }
    await proxyToScraper(name, req.query as Record<string, any>, res);
  });

  console.log("Scrapers Proxy Routes Registered:");
  console.log("  YTS:      /api/yts/{search,latest,movie/:id}");
  console.log("  Nyaa:     /api/nyaa/{search,latest}");
  console.log("  Deezer:   /api/deezer/{search,track/:id,album/:id,artist/:id,artist-search}");
  console.log("  iTunes:   /api/itunes/{search,albums,artists,song/:id}");
  console.log("  Net9ja:   /api/net9ja/{home,search,movies,series,post/:slug,resolve/:slug}");
  console.log("  SportyBet:/api/sportybet/{sports,live,prematch,event/:id}");
  console.log("  Legacy:   /api/scrapers/:name?action=...");
}
