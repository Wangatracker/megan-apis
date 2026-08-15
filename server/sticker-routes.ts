import type { Express, Request, Response } from "express";
import { buildSuccessResponse, buildErrorResponse } from "./response-builder";
import axios from "axios";

// ─── STICKERLY DETAIL ─────────────────────────────────────────────────────

async function stickerlyDetail(url: string) {
  const match = url.match(/\/s\/([^\/\?#]+)/);
  if (!match) throw new Error("Invalid Sticker.ly URL");

  try {
    const { data } = await axios.get(
      `https://api.sticker.ly/v4/stickerPack/${match[1]}?needRelation=true`,
      {
        headers: {
          "user-agent": "androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)",
          "content-type": "application/json",
          "accept-encoding": "gzip",
        },
        timeout: 30000,
      }
    );

    return {
      name: data.result.name,
      author: {
        name: data.result.user.displayName,
        username: data.result.user.userName,
        bio: data.result.user.bio,
        followers: data.result.user.followerCount,
        following: data.result.user.followingCount,
        isPrivate: data.result.user.isPrivate,
        avatar: data.result.user.profileUrl,
        website: data.result.user.website,
        url: data.result.user.shareUrl,
      },
      stickers: data.result.stickers.map((stick: any) => ({
        fileName: stick.fileName,
        isAnimated: stick.isAnimated,
        imageUrl: `${data.result.resourceUrlPrefix}${stick.fileName}`,
      })),
      stickerCount: data.result.stickers.length,
      viewCount: data.result.viewCount,
      exportCount: data.result.exportCount,
      isPaid: data.result.isPaid,
      isAnimated: data.result.isAnimated,
      thumbnailUrl: `${data.result.resourceUrlPrefix}${data.result.stickers[data.result.trayIndex].fileName}`,
      url: data.result.shareUrl,
    };
  } catch (error: any) {
    console.error("Stickerly Detail Error:", error.message);
    throw new Error("Failed to get sticker pack details");
  }
}

// ─── STICKERLY SEARCH ─────────────────────────────────────────────────────

async function stickerlySearch(query: string) {
  try {
    const { data } = await axios.post(
      "https://api.sticker.ly/v4/stickerPack/smartSearch",
      {
        keyword: query,
        enabledKeywordSearch: true,
        filter: {
          extendSearchResult: false,
          sortBy: "RECOMMENDED",
          languages: ["ALL"],
          minStickerCount: 5,
          searchBy: "ALL",
          stickerType: "ALL",
        },
      },
      {
        headers: {
          "user-agent": "androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)",
          "content-type": "application/json",
          "accept-encoding": "gzip",
        },
        timeout: 30000,
      }
    );

    if (!data.result || !data.result.stickerPacks) return [];

    return data.result.stickerPacks.map((pack: any) => ({
      name: pack.name,
      author: pack.authorName,
      stickerCount: pack.resourceFiles.length,
      viewCount: pack.viewCount,
      exportCount: pack.exportCount,
      isPaid: pack.isPaid,
      isAnimated: pack.isAnimated,
      thumbnailUrl: `${pack.resourceUrlPrefix}${pack.resourceFiles[pack.trayIndex]}`,
      url: pack.shareUrl,
    }));
  } catch (error: any) {
    console.error("Stickerly Search Error:", error.message);
    throw new Error("Failed to search sticker packs");
  }
}

// ─── REGISTER ROUTES ───────────────────────────────────────────────────────

export function registerStickerRoutes(app: Express): void {
  // Stickerly Detail GET
  app.get("/api/v2/sticker/stickerly-detail", async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json(buildErrorResponse(req, "Sticker", "sticker", "Parameter 'url' required", "BAD_REQUEST"));
    if (!url.startsWith("https://sticker.ly/s/")) {
      return res.status(400).json({ status: false, error: "Invalid Sticker.ly URL format. Expected: https://sticker.ly/s/..." });
    }

    try {
      const result = await stickerlyDetail(url.trim());
      return res.json(buildSuccessResponse(req, "Sticker", "sticker", { provider: "Stickerly", result }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Stickerly Detail POST
  app.post("/api/v2/sticker/stickerly-detail", async (req: Request, res: Response) => {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ status: false, error: "URL is required in request body" });
    if (!url.startsWith("https://sticker.ly/s/")) {
      return res.status(400).json({ status: false, error: "Invalid Sticker.ly URL format" });
    }

    try {
      const result = await stickerlyDetail(url.trim());
      return res.json(buildSuccessResponse(req, "Sticker", "sticker", { provider: "Stickerly", result }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Stickerly Search GET
  app.get("/api/v2/sticker/stickerly-search", async (req: Request, res: Response) => {
    const query = req.query.query as string;
    if (!query) return res.status(400).json({ status: false, error: "Parameter 'query' required" });
    if (query.trim().length === 0) return res.status(400).json({ status: false, error: "Query must be non-empty" });

    try {
      const result = await stickerlySearch(query.trim());
      if (result.length === 0) {
        return res.status(404).json({ status: false, error: "No sticker packs found" });
      }
      return res.json(buildSuccessResponse(req, "Sticker", "sticker", { provider: "Stickerly", total: result.length, results: result }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Stickerly Search POST
  app.post("/api/v2/sticker/stickerly-search", async (req: Request, res: Response) => {
    const { query } = req.body || {};
    if (!query) return res.status(400).json({ status: false, error: "Query is required in request body" });
    if (query.trim().length === 0) return res.status(400).json({ status: false, error: "Query must be non-empty" });

    try {
      const result = await stickerlySearch(query.trim());
      if (result.length === 0) {
        return res.status(404).json({ status: false, error: "No sticker packs found" });
      }
      return res.json(buildSuccessResponse(req, "Sticker", "sticker", { provider: "Stickerly", total: result.length, results: result }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ Sticker Routes Registered:");
  console.log("  GET /api/v2/sticker/stickerly-detail?url=...");
  console.log("  POST /api/v2/sticker/stickerly-detail");
  console.log("  GET /api/v2/sticker/stickerly-search?query=...");
  console.log("  POST /api/v2/sticker/stickerly-search");
}
