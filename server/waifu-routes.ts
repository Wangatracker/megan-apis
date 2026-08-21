import type { Express, Request, Response } from "express";

const WAIFU_API = "https://api.waifu.im";
const WAIFU_KEY = "GhX6asqI4zIpSarEh9eW4BpP3cssBypUl8FAzdjiT4";

async function fetchWaifu(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${WAIFU_API}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  
  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": WAIFU_KEY,
      "Accept": "application/json",
      "User-Agent": "MeganAPIs/1.0",
    },
  });
  
  if (!res.ok) throw new Error(`Waifu.im returned ${res.status}`);
  const data = await res.json();
  return data;
}

function formatImage(image: any) {
  return {
    id: image.id,
    url: image.url,
    width: image.width,
    height: image.height,
    isNsfw: image.isNsfw,
    isAnimated: image.isAnimated,
    dominantColor: image.dominantColor,
    source: image.source,
    extension: image.extension,
    byteSize: image.byteSize,
    tags: (image.tags || []).map((t: any) => t.name),
    artists: (image.artists || []).map((a: any) => a.name),
    uploadedAt: image.uploadedAt,
  };
}

export function registerWaifuRoutes(app: Express): void {

  // Random SFW image
  app.get("/api/anime/waifu/random", async (req: Request, res: Response) => {
    try {
      const data = await fetchWaifu("/images", { IsNsfw: "False" });
      const items = data.items || [];
      const image = items[0];
      if (!image) return res.status(404).json({ success: false, error: "No image found" });
      res.json({ success: true, provider: "Waifu.im", data: formatImage(image) });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Search by tag
  app.get("/api/anime/waifu/search", async (req: Request, res: Response) => {
    try {
      const tag = (req.query.tag || req.query.q) as string;
      if (!tag) return res.status(400).json({ success: false, error: "Parameter 'tag' required" });
      const data = await fetchWaifu("/images", { IncludedTags: tag, IsNsfw: "False" });
      const items = data.items || [];
      res.json({
        success: true,
        provider: "Waifu.im",
        query: tag,
        count: items.length,
        data: items.map(formatImage),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // List available tags
  app.get("/api/anime/waifu/tags", async (req: Request, res: Response) => {
    try {
      const data = await fetchWaifu("/tags");
      const items = data.items || [];
      res.json({
        success: true,
        provider: "Waifu.im",
        count: items.length,
        data: items.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          isNsfw: tag.isNsfw,
          imageCount: tag.imageCount,
        })),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Multiple images
  app.get("/api/anime/waifu/multiple", async (req: Request, res: Response) => {
    try {
      const n = Math.min(parseInt(req.query.n as string) || 10, 30);
      const tag = req.query.tag as string;
      const params: Record<string, string> = { IsNsfw: "False" };
      if (tag) params.IncludedTags = tag;
      
      const data = await fetchWaifu("/images", params);
      const items = (data.items || []).slice(0, n);
      res.json({
        success: true,
        provider: "Waifu.im",
        count: items.length,
        data: items.map(formatImage),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // NSFW images
  app.get("/api/anime/waifu/nsfw", async (req: Request, res: Response) => {
    try {
      const tag = req.query.tag as string;
      const params: Record<string, string> = { IsNsfw: "True" };
      if (tag) params.IncludedTags = tag;
      
      const data = await fetchWaifu("/images", params);
      const items = data.items || [];
      const image = items[0];
      if (!image) return res.status(404).json({ success: false, error: "No image found" });
      res.json({ success: true, provider: "Waifu.im", data: formatImage(image) });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ Waifu Routes Registered:");
  console.log("  GET /api/anime/waifu/random - Random SFW image");
  console.log("  GET /api/anime/waifu/search?tag= - Search by tag");
  console.log("  GET /api/anime/waifu/tags - List tags");
  console.log("  GET /api/anime/waifu/multiple?n= - Batch fetch");
  console.log("  GET /api/anime/waifu/nsfw - NSFW images");
}
