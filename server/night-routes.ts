import type { Express, Request, Response } from "express";
import axios from "axios";

// ============================================================
// MEGAN APIs V2 — NIGHT API INTEGRATION
// Creator: Tracker Wanga
// Powered by NIGHT API
//
// Environment variable:
// NIGHT_API_KEY=your_night_api_key
// ============================================================

const NIGHT_BASE = "https://api.night-api.com";

const NIGHT_KEY = process.env.NIGHT_API_KEY || "";

const NIGHT_TIMEOUT = 20000;

const nightClient = axios.create({
  baseURL: NIGHT_BASE,
  timeout: NIGHT_TIMEOUT,
  headers: {
    authorization: NIGHT_KEY,
    Accept: "application/json",
  },
});

// ============================================================
// SUPPORTED CATEGORIES
// ============================================================

const ANIMALS = [
  "dog",
  "cat",
  "fox",
  "giraffe",
  "kangaroo",
  "lion",
  "quokka",
  "wolf",
  "lezard",
  "leopard",
  "singes",
  "paon",
  "hamster",
] as const;

const SFW_TYPES = [
  "coffee",
  "food",
  "holo",
  "kanna",
] as const;

const NSFW_TYPES = [
  "anal",
  "ass",
  "boobs",
  "gonewild",
  "hanal",
  "hass",
  "hboobs",
  "hentai",
  "hkitsune",
  "hmidriff",
  "hneko",
  "hthigh",
  "neko",
  "paizuri",
  "pgif",
  "pussy",
  "tentacle",
  "thigh",
  "yaoi",
] as const;

const JOKE_TYPES = [
  "global",
  "dev",
  "dark",
  "limit",
  "beauf",
  "blondes",
] as const;

const GAME_TYPES = [
  "garrysmod",
  "minecraft",
  "fivem",
] as const;

// ============================================================
// HELPERS
// ============================================================

function getParam(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
}

function validNumber(value: string): boolean {
  return /^\d+$/.test(value);
}

function validHost(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 253 &&
    /^[a-zA-Z0-9.:[\]-]+$/.test(value)
  );
}

function nightError(
  res: Response,
  error: unknown,
  fallback = "NIGHT API request failed",
) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    // Don't leak credentials, request headers, or internal details.
    return res.status(
      status && status >= 400 && status < 500 ? status : 502,
    ).json({
      success: false,
      provider: "NIGHT API",
      error:
        status === 401 || status === 403
          ? "NIGHT API authentication failed. Check NIGHT_API_KEY."
          : status === 404
            ? "The requested NIGHT API resource was not found."
            : error.code === "ECONNABORTED"
              ? "NIGHT API request timed out."
              : fallback,
      upstreamStatus: status || undefined,
    });
  }

  return res.status(502).json({
    success: false,
    provider: "NIGHT API",
    error: fallback,
  });
}

async function nightGet(
  path: string,
  params?: Record<string, unknown>,
) {
  const response = await nightClient.get(path, { params });
  return response.data;
}

function requireNightKey(res: Response): boolean {
  if (NIGHT_KEY) {
    return true;
  }

  res.status(503).json({
    success: false,
    error: "NIGHT API is not configured on this server.",
    hint: "Set NIGHT_API_KEY in the server environment.",
  });

  return false;
}

function requireAdultConfirmation(req: Request, res: Response): boolean {
  const confirmed = getParam(req.query.adult);

  if (confirmed !== "true") {
    res.status(400).json({
      success: false,
      error: "Adult-content confirmation is required.",
      hint: "Use ?adult=true only when the requesting application is intended for adults.",
    });

    return false;
  }

  return true;
}

// ============================================================
// ROUTES
// ============================================================

export function registerNightRoutes(app: Express): void {

  // ----------------------------------------------------------
  // 1. NIGHT API INFORMATION
  // ----------------------------------------------------------

  app.get("/api/v2/night", (_req: Request, res: Response) => {
    return res.json({
      success: true,
      name: "Megan APIs — NIGHT API Integration",
      version: "2.0",
      creator: "Tracker Wanga",
      provider: "NIGHT API",
      categories: {
        animals: ANIMALS,
        sfw: SFW_TYPES,
        nsfw: NSFW_TYPES,
        jokes: JOKE_TYPES,
        games: GAME_TYPES,
      },
      endpoints: {
        animals: "/api/v2/night/animals/:type",
        animalById: "/api/v2/night/animals/:type/:id",
        sfw: "/api/v2/night/sfw",
        sfwCategory: "/api/v2/night/sfw/:type",
        nsfw: "/api/v2/night/nsfw?adult=true",
        nsfwCategory: "/api/v2/night/nsfw/:type?adult=true",
        jokes: "/api/v2/night/jokes",
        jokesCategory: "/api/v2/night/jokes/category/:type",
        jokesById: "/api/v2/night/jokes/id/:id",
        ipInfo: "/api/v2/night/ipinfo/:ip",
        minecraft: "/api/v2/night/games/minecraft/:host",
        fivem: "/api/v2/night/games/fivem/:host",
        garrysmod: "/api/v2/night/games/garrysmod/:host",
        qrcode: "/api/v2/night/qrcode",
        qrcodeReader: "/api/v2/night/qrcode/reader",
        captcha: "/api/v2/night/captcha",
      },
      authentication: "Use your Megan APIs API key.",
    });
  });

  // ----------------------------------------------------------
  // 2. ANIMALS
  //
  // GET /api/v2/night/animals/dog
  // GET /api/v2/night/animals/cat/5
  // ----------------------------------------------------------

  app.get(
    "/api/v2/night/animals/:type/:id",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const type = getParam(req.params.type).toLowerCase();
      const id = getParam(req.params.id);

      if (!(ANIMALS as readonly string[]).includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Unsupported animal.",
          supported: ANIMALS,
        });
      }

      if (!validNumber(id) || Number(id) < 1) {
        return res.status(400).json({
          success: false,
          error: "Animal ID must be a positive integer.",
        });
      }

      try {
        const data = await nightGet(
          `/images/animals/${type}/${encodeURIComponent(id)}`,
        );

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "animals",
          animal: type,
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  app.get(
    "/api/v2/night/animals/:type",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const type = getParam(req.params.type).toLowerCase();

      if (!(ANIMALS as readonly string[]).includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Unsupported animal.",
          supported: ANIMALS,
        });
      }

      try {
        const data = await nightGet(`/images/animals/${type}`);

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "animals",
          animal: type,
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ----------------------------------------------------------
  // 3. SFW IMAGES
  //
  // GET /api/v2/night/sfw
  // GET /api/v2/night/sfw/holo
  // ----------------------------------------------------------

  app.get(
    "/api/v2/night/sfw/:type",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const type = getParam(req.params.type).toLowerCase();

      if (!(SFW_TYPES as readonly string[]).includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Unsupported SFW category.",
          supported: SFW_TYPES,
        });
      }

      try {
        const data = await nightGet(
          `/images/sfw/${encodeURIComponent(type)}`,
        );

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "sfw",
          type,
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  app.get(
    "/api/v2/night/sfw",
    async (_req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      try {
        const data = await nightGet("/images/sfw");

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "sfw",
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ----------------------------------------------------------
  // 4. NSFW IMAGES
  //
  // GET /api/v2/night/nsfw?adult=true
  // GET /api/v2/night/nsfw/hentai?adult=true
  //
  // Only expose this through an adult-enabled application.
  // Megan's own authentication and age-access controls should
  // also be enforced by the surrounding API middleware.
  // ----------------------------------------------------------

  app.get(
    "/api/v2/night/nsfw/:type",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;
      if (!requireAdultConfirmation(req, res)) return;

      const type = getParam(req.params.type).toLowerCase();

      if (!(NSFW_TYPES as readonly string[]).includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Unsupported NSFW category.",
          supported: NSFW_TYPES,
        });
      }

      try {
        const data = await nightGet(
          `/images/nsfw/${encodeURIComponent(type)}`,
        );

        res.setHeader("Cache-Control", "private, max-age=60");

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "nsfw",
          type,
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  app.get(
    "/api/v2/night/nsfw",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;
      if (!requireAdultConfirmation(req, res)) return;

      try {
        const data = await nightGet("/images/nsfw");

        res.setHeader("Cache-Control", "private, max-age=60");

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "nsfw",
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ----------------------------------------------------------
  // 5. JOKES
  //
  // GET /api/v2/night/jokes
  // GET /api/v2/night/jokes?disallow=dark,limit
  // GET /api/v2/night/jokes/category/dev
  // GET /api/v2/night/jokes/id/44
  //
  // NIGHT API jokes are documented as French-language content.
  // ----------------------------------------------------------

  app.get(
    "/api/v2/night/jokes/category/:type",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const type = getParam(req.params.type).toLowerCase();

      if (!(JOKE_TYPES as readonly string[]).includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Unsupported joke category.",
          supported: JOKE_TYPES,
        });
      }

      try {
        const data = await nightGet(
          `/jokes/${encodeURIComponent(type)}`,
        );

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "jokes",
          type,
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  app.get(
    "/api/v2/night/jokes/id/:id",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const id = getParam(req.params.id);

      if (!validNumber(id) || Number(id) < 1 || Number(id) > 900) {
        return res.status(400).json({
          success: false,
          error: "Joke ID must be between 1 and 900.",
        });
      }

      try {
        const data = await nightGet(
          `/jokes/${encodeURIComponent(id)}`,
        );

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "jokes",
          id: Number(id),
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  app.get(
    "/api/v2/night/jokes",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const rawDisallow = getParam(req.query.disallow);

      const allowedDisallow = rawDisallow
        ? rawDisallow
            .split(",")
            .map((item) => item.trim().toLowerCase())
        : [];

      const invalid = allowedDisallow.filter(
        (item) => !(JOKE_TYPES as readonly string[]).includes(item),
      );

      if (invalid.length) {
        return res.status(400).json({
          success: false,
          error: "One or more disallowed joke categories are invalid.",
          invalid,
          supported: JOKE_TYPES,
        });
      }

      try {
        const data = await nightGet("/jokes", {
          ...(allowedDisallow.length
            ? { disallow: allowedDisallow.join(",") }
            : {}),
        });

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "jokes",
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ----------------------------------------------------------
  // 6. IP INFORMATION
  //
  // GET /api/v2/night/ipinfo/8.8.8.8
  // ----------------------------------------------------------

  app.get(
    "/api/v2/night/ipinfo/:ip",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const ip = getParam(req.params.ip);

      // Accept IPv4 or IPv6 characters only.
      if (
        !ip ||
        ip.length > 45 ||
        !/^[0-9a-fA-F:.]+$/.test(ip)
      ) {
        return res.status(400).json({
          success: false,
          error: "Provide a valid IPv4 or IPv6 address.",
        });
      }

      try {
        const data = await nightGet(
          `/general/ipinfo/${encodeURIComponent(ip)}`,
        );

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "ipinfo",
          data,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ----------------------------------------------------------
  // 7. GAME SERVER LOOKUPS
  //
  // GET /api/v2/night/games/minecraft/mc.example.com
  // GET /api/v2/night/games/fivem/play.example.com
  // GET /api/v2/night/games/garrysmod/208.103.169.58
  // ----------------------------------------------------------

  for (const game of GAME_TYPES) {
    app.get(
      `/api/v2/night/games/${game}/:host`,
      async (req: Request, res: Response) => {
        if (!requireNightKey(res)) return;

        const host = getParam(req.params.host);

        if (!validHost(host)) {
          return res.status(400).json({
            success: false,
            error: "Invalid game server address.",
          });
        }

        try {
          const data = await nightGet(
            `/game/${game}/${encodeURIComponent(host)}`,
          );

          return res.json({
            success: true,
            provider: "NIGHT API",
            category: "games",
            game,
            host,
            data,
          });
        } catch (error) {
          return nightError(res, error, "Game server lookup failed");
        }
      },
    );
  }

  // ----------------------------------------------------------
  // 8. QR CODE GENERATOR
  //
  // GET /api/v2/night/qrcode?text=https%3A%2F%2Fexample.com
  //
  // NIGHT API documents a GET request with a request body.
  // ----------------------------------------------------------

  app.get(
    "/api/v2/night/qrcode",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const text = getParam(req.query.text);

      if (!text) {
        return res.status(400).json({
          success: false,
          error: "The text parameter is required.",
        });
      }

      if (text.length > 2000) {
        return res.status(400).json({
          success: false,
          error: "Text must not exceed 2000 characters.",
        });
      }

      const sizeValue = getParam(req.query.size) || "500";
      const size = Number(sizeValue);

      if (!Number.isInteger(size) || size < 100 || size > 2000) {
        return res.status(400).json({
          success: false,
          error: "Size must be an integer between 100 and 2000.",
        });
      }

      try {
        const response = await nightClient.request({
          method: "GET",
          url: "/images/qrcode",
          data: {
            text,
            size,
          },
        });

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "qrcode",
          data: response.data,
        });
      } catch (error) {
        return nightError(res, error, "QR code generation failed");
      }
    },
  );

  // ----------------------------------------------------------
  // 9. QR CODE READER
  //
  // POST /api/v2/night/qrcode/reader
  //
  // JSON body:
  // { "image": "https://example.com/qrcode.png" }
  //
  // The image may also be supplied as a data URL if supported
  // by the upstream API. Limit incoming payload size in the
  // Express application configuration.
  // ----------------------------------------------------------

  app.post(
    "/api/v2/night/qrcode/reader",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const image = req.body?.image;

      if (
        typeof image !== "string" ||
        image.trim().length === 0 ||
        image.length > 5_000_000
      ) {
        return res.status(400).json({
          success: false,
          error: "Provide a valid QR image URL or supported image data.",
        });
      }

      try {
        const response = await nightClient.request({
          method: "GET",
          url: "/images/qrcode/reader",
          data: {
            image,
          },
        });

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "qrcode-reader",
          data: response.data,
        });
      } catch (error) {
        return nightError(res, error, "QR code reading failed");
      }
    },
  );

  // ----------------------------------------------------------
  // 10. CAPTCHA
  //
  // GET /api/v2/night/captcha?size=6
  // ----------------------------------------------------------

  app.get(
    "/api/v2/night/captcha",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const sizeValue = getParam(req.query.size) || "6";
      const size = Number(sizeValue);

      if (!Number.isInteger(size) || size < 4 || size > 10) {
        return res.status(400).json({
          success: false,
          error: "CAPTCHA size must be an integer between 4 and 10.",
        });
      }

      try {
        const response = await nightClient.request({
          method: "GET",
          url: "/images/captcha",
          data: {
            codeSize: size,
          },
        });

        return res.json({
          success: true,
          provider: "NIGHT API",
          category: "captcha",
          data: response.data,
        });
      } catch (error) {
        return nightError(res, error, "CAPTCHA generation failed");
      }
    },
  );

  console.log("✅ Megan APIs V2 — NIGHT API routes registered");
  console.log("   GET  /api/v2/night");
  console.log("   GET  /api/v2/night/animals/:type");
  console.log("   GET  /api/v2/night/animals/:type/:id");
  console.log("   GET  /api/v2/night/sfw");
  console.log("   GET  /api/v2/night/sfw/:type");
  console.log("   GET  /api/v2/night/nsfw?adult=true");
  console.log("   GET  /api/v2/night/nsfw/:type?adult=true");
  console.log("   GET  /api/v2/night/jokes");
  console.log("   GET  /api/v2/night/jokes/category/:type");
  console.log("   GET  /api/v2/night/jokes/id/:id");
  console.log("   GET  /api/v2/night/ipinfo/:ip");
  console.log("   GET  /api/v2/night/games/:game/:host");
  console.log("   GET  /api/v2/night/qrcode");
  console.log("   POST /api/v2/night/qrcode/reader");
  console.log("   GET  /api/v2/night/captcha");
}
