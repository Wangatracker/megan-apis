import type { Express, Request, Response } from "express";

const WAIFU_API = "https://api.waifu.im";
const WAIFU_KEY = "GhX6asqI4zIpSarEh9eW4BpP3cssBypUl8FAzdjiT4";

async function fetchWaifu(params: Record<string, string> = {}) {
  const url = new URL(`${WAIFU_API}/images`);
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
  return res.json();
}

export function registerWaifuRoutes(app: Express): void {

  // Random SFW image
  app.get("/api/anime/waifu/random", async (req: Request, res: Response) => {
    try {
      const data = await fetchWaifu({ IsNsfw: "False" });
      const image = data.items?.[0];
      if (!image) return res.status(404).json({ success: false, error: "No image found" });
      
      res.json({
        success: true,
        provider: "Waifu.im",
        data: {
          id: image.id,
          url: image.url,
          width: image.width,
          height: image.height,
          isNsfw: image.isNsfw,
          isAnimated: image.isAnimated,
          dominantColor: image.dominantColor,
          source: image.source,
          tags: (image.tags || []).map((t: any) => t.name),
          artists: (image.artists || []).map((a: any) => a.name),
        },
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Search by tag
  app.get("/api/anime/waifu/search", async (req: Request, res: Response) => {
    try {
      const tag = (req.query.tag || req.query.q) as string;
      if (!tag) return res.status(400).json({ success: false, error: "Parameter 'tag' required" });
      
      const data = await fetchWaifu({ IncludedTags: tag, IsNsfw: "False" });
      const images = data.items || [];
      
      res.json({
        success: true,
        provider: "Waifu.im",
        query: tag,
        count: images.length,
        data: images.map((image: any) => ({
          id: image.id,
          url: image.url,
          width: image.width,
          height: image.height,
          isNsfw: image.isNsfw,
          isAnimated: image.isAnimated,
          dominantColor: image.dominantColor,
          source: image.source,
          tags: (image.tags || []).map((t: any) => t.name),
          artists: (image.artists || []).map((a: any) => a.name),
        })),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // List available tags
  app.get("/api/anime/waifu/tags", async (req: Request, res: Response) => {
    try {
      const res = await fetch(`${WAIFU_API}/tags`, {
        headers: {
          "X-Api-Key": WAIFU_KEY,
          "Accept": "application/json",
          "User-Agent": "MeganAPIs/1.0",
        },
      });
      if (!res.ok) throw new Error(`Waifu.im returned ${res.status}`);
      const data = await res.json();
      
      res.json({
        success: true,
        provider: "Waifu.im",
        count: data.length,
        data: data.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          isNsfw: tag.isNsfw,
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
      
      const data = await fetchWaifu(params);
      const images = (data.items || []).slice(0, n);
      
      res.json({
        success: true,
        provider: "Waifu.im",
        count: images.length,
        data: images.map((image: any) => ({
          id: image.id,
          url: image.url,
          width: image.width,
          height: image.height,
          isNsfw: image.isNsfw,
          isAnimated: image.isAnimated,
          dominantColor: image.dominantColor,
          source: image.source,
          tags: (image.tags || []).map((t: any) => t.name),
          artists: (image.artists || []).map((a: any) => a.name),
        })),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // NSFW images (separate endpoint for content safety)
  app.get("/api/anime/waifu/nsfw", async (req: Request, res: Response) => {
    try {
      const tag = req.query.tag as string;
      const params: Record<string, string> = { IsNsfw: "True" };
      if (tag) params.IncludedTags = tag;
      
      const data = await fetchWaifu(params);
      const image = data.items?.[0];
      if (!image) return res.status(404).json({ success: false, error: "No image found" });
      
      res.json({
        success: true,
        provider: "Waifu.im",
        data: {
          id: image.id,
          url: image.url,
          width: image.width,
          height: image.height,
          isNsfw: image.isNsfw,
          isAnimated: image.isAnimated,
          dominantColor: image.dominantColor,
          source: image.source,
          tags: (image.tags || []).map((t: any) => t.name),
          artists: (image.artists || []).map((a: any) => a.name),
        },
      });
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
