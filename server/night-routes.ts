import type { Express, Request, Response } from "express";
import axios from "axios";

// ============================================================
// MEGAN APIs V2 — NIGHT API INTEGRATION
// Creator: Tracker Wanga
// Powered by NIGHT API + Megan AI
//
// Required environment variable:
// NIGHT_API_KEY=your_night_api_key
//
// Translation provider:
// POST https://apis.megan.qzz.io/api/ai/translate
// API key: megan_admin_master
// ============================================================

const NIGHT_BASE = "https://api.night-api.com";
const NIGHT_KEY = process.env.NIGHT_API_KEY || "";
const NIGHT_TIMEOUT = 20000;

const MEGAN_TRANSLATE_URL =
  "https://apis.megan.qzz.io/api/ai/translate";

const MEGAN_TRANSLATE_KEY = "megan_admin_master";

const nightClient = axios.create({
  baseURL: NIGHT_BASE,
  timeout: NIGHT_TIMEOUT,
  headers: {
    authorization: NIGHT_KEY,
    Accept: "application/json",
  },
});

const translator = axios.create({
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ============================================================
// CATEGORIES
// ============================================================

const ANIMALS = [
  "dog", "cat", "fox", "giraffe", "kangaroo", "lion",
  "quokka", "wolf", "lezard", "leopard", "singes",
  "paon", "hamster",
] as const;

const SFW_TYPES = [
  "coffee", "food", "holo", "kanna",
] as const;

const NSFW_TYPES = [
  "anal", "ass", "boobs", "gonewild", "hanal", "hass",
  "hboobs", "hentai", "hkitsune", "hmidriff", "hneko",
  "hthigh", "neko", "paizuri", "pgif", "pussy",
  "tentacle", "thigh", "yaoi",
] as const;

const JOKE_TYPES = [
  "global", "dev", "dark", "limit", "beauf", "blondes",
] as const;

const GAME_TYPES = [
  "garrysmod", "minecraft", "fivem",
] as const;

// ============================================================
// HELPERS
// ============================================================

function getParam(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
}

function validNumber(value: string): boolean {
  return /^\d+$/.test(value);
}

function validHost(value: string): boolean {
  return value.length > 0 &&
    value.length <= 253 &&
    /^[a-zA-Z0-9.:[\]-]+$/.test(value);
}

function requireNightKey(res: Response): boolean {
  if (NIGHT_KEY) return true;

  res.status(503).json({
    success: false,
    error: "NIGHT API is not configured on this server.",
    hint: "Set NIGHT_API_KEY in the server environment.",
  });

  return false;
}

function requireAdultConfirmation(
  req: Request,
  res: Response,
): boolean {
  if (getParam(req.query.adult) === "true") return true;

  res.status(400).json({
    success: false,
    error: "Adult-content confirmation is required.",
    hint: "Use adult=true only in an adult-enabled application with appropriate age and access controls.",
  });

  return false;
}

function nightError(
  res: Response,
  error: unknown,
  fallback = "NIGHT API request failed",
) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

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
): Promise<any> {
  const response = await nightClient.get(path, { params });
  return response.data;
}

function sendNightData(
  res: Response,
  category: string,
  data: unknown,
  extra: Record<string, unknown> = {},
) {
  return res.json({
    success: true,
    provider: "NIGHT API",
    category,
    ...extra,
    data,
  });
}

// ============================================================
// MEGAN AI TRANSLATION + CACHE
//
// Provider:
// POST https://apis.megan.qzz.io/api/ai/translate
//
// Query:
// ?api_key=megan_admin_master
//
// JSON body:
// {
//   "text": "Bonjour",
//   "from": "fr",
//   "to": "en"
// }
//
// Expected translation:
// response.data.data.translated
//
// Translations are cached for six hours.
// ============================================================

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const translationCache = new Map<string, CacheEntry>();

const TRANSLATION_TTL = 6 * 60 * 60 * 1000;
const MAX_TRANSLATION_CACHE = 1000;

function cacheTranslation(key: string, value: string): void {
  // Remove the oldest cache entry when the cache is full.
  if (translationCache.size >= MAX_TRANSLATION_CACHE) {
    const oldestKey = translationCache.keys().next().value;

    if (oldestKey !== undefined) {
      translationCache.delete(oldestKey);
    }
  }

  translationCache.set(key, {
    value,
    expiresAt: Date.now() + TRANSLATION_TTL,
  });
}

async function translateText(
  text: string,
  target: "en" | "fr",
): Promise<string> {
  const original = text.trim();

  if (!original || target === "fr") {
    return original;
  }

  const cacheKey = `${target}:${original}`;
  const cached = translationCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (cached) {
    translationCache.delete(cacheKey);
  }

  // Use Megan AI's existing translation endpoint.
  const response = await translator.post(
    MEGAN_TRANSLATE_URL,
    {
      text: original,
      from: "fr",
      to: target,
    },
    {
      params: {
        api_key: MEGAN_TRANSLATE_KEY,
      },
    },
  );

  const body = response.data;

  // Megan APIs returns the translation inside data.translated.
  const translated = body?.data?.translated;

  if (
    body?.status?.success === false ||
    typeof translated !== "string" ||
    !translated.trim()
  ) {
    throw new Error(
      "Megan AI returned an invalid or unsuccessful translation.",
    );
  }

  const result = translated.trim();

  cacheTranslation(cacheKey, result);

  return result;
}

// ============================================================
// JOKE RESPONSE PARSING
// ============================================================

function findJokeStrings(data: any): {
  joke?: string;
  answer?: string;
} {
  if (!data || typeof data !== "object") {
    return {};
  }

  const joke =
    typeof data.blague === "string" ? data.blague :
    typeof data.joke === "string" ? data.joke :
    typeof data.question === "string" ? data.question :
    undefined;

  const answer =
    typeof data.reponse === "string" ? data.reponse :
    typeof data.answer === "string" ? data.answer :
    typeof data.response === "string" ? data.response :
    undefined;

  return { joke, answer };
}

async function translateJokeData(
  data: any,
  lang: "en" | "fr",
): Promise<any> {
  if (lang === "fr") {
    return data;
  }

  const fields = findJokeStrings(data);

  if (!fields.joke && !fields.answer) {
    throw new Error(
      "The joke response format is not recognized for translation.",
    );
  }

  const result = { ...data };

  if (fields.joke) {
    const translated = await translateText(fields.joke, "en");

    if (typeof result.blague === "string") {
      result.blague = translated;
    } else if (typeof result.joke === "string") {
      result.joke = translated;
    } else if (typeof result.question === "string") {
      result.question = translated;
    }
  }

  if (fields.answer) {
    const translated = await translateText(fields.answer, "en");

    if (typeof result.reponse === "string") {
      result.reponse = translated;
    } else if (typeof result.answer === "string") {
      result.answer = translated;
    } else if (typeof result.response === "string") {
      result.response = translated;
    }
  }

  return result;
}

function getJokeLanguage(
  req: Request,
  res: Response,
): "en" | "fr" | null {
  const lang = (
    getParam(req.query.lang) || "en"
  ).toLowerCase();

  if (lang !== "en" && lang !== "fr") {
    res.status(400).json({
      success: false,
      error: "Unsupported language.",
      supported: ["en", "fr"],
    });

    return null;
  }

  return lang;
}

// ============================================================
// SHARED JOKE HANDLER
// ============================================================

async function sendJoke(
  req: Request,
  res: Response,
  path: string,
  params?: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  if (!requireNightKey(res)) return;

  const lang = getJokeLanguage(req, res);

  if (!lang) return;

  try {
    const data = await nightGet(path, params);

    // Return original French without making a translation request.
    if (lang === "fr") {
      return sendNightData(res, "jokes", data, {
        ...extra,
        language: "fr",
      });
    }

    try {
      const translated = await translateJokeData(data, "en");

      return sendNightData(res, "jokes", translated, {
        ...extra,
        language: "en",
      });
    } catch (error) {
      // Log a safe diagnostic without exposing API keys.
      console.error(
        "[NIGHT API] Megan AI joke translation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      return res.status(502).json({
        success: false,
        provider: "NIGHT API + Megan AI",
        category: "jokes",
        language: "en",
        error: "English joke translation failed.",
        hint: "Try again later or request lang=fr for the original joke.",
      });
    }
  } catch (error) {
    return nightError(res, error, "Joke request failed");
  }
}

// ============================================================
// ENDPOINT CATALOGUE
// ============================================================

export function registerNightRoutes(app: Express): void {
  app.get("/api/v2/night", (_req: Request, res: Response) => {
    const endpoints: Record<string, string> = {
      animals: "/api/v2/night/animals",
      sfw: "/api/v2/night/sfw",
      nsfw: "/api/v2/night/nsfw",
      jokes: "/api/v2/night/jokes",
      games: "/api/v2/night/games",
      ipinfo: "/api/v2/night/ipinfo/:ip",
      qrcode: "/api/v2/night/qrcode",
      qrcodeReader: "/api/v2/night/qrcode/reader",
      captcha: "/api/v2/night/captcha",
    };

    for (const animal of ANIMALS) {
      endpoints[`animal_${animal}`] =
        `/api/v2/night/animals/${animal}`;
    }

    for (const type of SFW_TYPES) {
      endpoints[`sfw_${type}`] =
        `/api/v2/night/sfw/${type}`;
    }

    for (const type of NSFW_TYPES) {
      endpoints[`nsfw_${type}`] =
        `/api/v2/night/nsfw/${type}?adult=true`;
    }

    for (const type of JOKE_TYPES) {
      endpoints[`jokes_${type}`] =
        `/api/v2/night/jokes/${type}?lang=en`;
    }

    for (const game of GAME_TYPES) {
      endpoints[`game_${game}`] =
        `/api/v2/night/games/${game}/:host`;
    }

    return res.json({
      success: true,
      name: "Megan APIs — NIGHT API Integration",
      version: "2.2.0",
      creator: "Tracker Wanga",
      provider: "NIGHT API + Megan AI",
      categories: {
        animals: ANIMALS,
        sfw: SFW_TYPES,
        nsfw: NSFW_TYPES,
        jokes: JOKE_TYPES,
        games: GAME_TYPES,
      },
      endpoints,
      examples: {
        dog: "/api/v2/night/animals/dog",
        giraffe: "/api/v2/night/animals/giraffe",
        holo: "/api/v2/night/sfw/holo",
        anal: "/api/v2/night/nsfw/anal?adult=true",
        boobs: "/api/v2/night/nsfw/boobs?adult=true",
        devJokes: "/api/v2/night/jokes/dev?lang=en",
        frenchJokes: "/api/v2/night/jokes/dev?lang=fr",
        jokeById: "/api/v2/night/jokes/id/44?lang=en",
        ipInfo: "/api/v2/night/ipinfo/8.8.8.8",
        minecraft: "/api/v2/night/games/minecraft/mc.example.com",
      },
      authentication: "Use your Megan APIs API key.",
      notes: [
        "Each category has its own dedicated endpoint.",
        "Jokes default to English and support lang=en or lang=fr.",
        "English jokes are translated using Megan AI.",
        "Successful translations are cached in memory for six hours.",
        "NSFW endpoints require adult=true and appropriate access controls.",
      ],
    });
  });

  // ==========================================================
  // ANIMALS
  // GET /api/v2/night/animals/dog
  // GET /api/v2/night/animals/cat/5
  // ==========================================================

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

        return sendNightData(res, "animals", data, {
          animal: type,
          id: Number(id),
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

        return sendNightData(res, "animals", data, {
          animal: type,
        });
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ==========================================================
  // SFW — DEDICATED CATEGORY ENDPOINTS
  // ==========================================================

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
        const data = await nightGet(`/images/sfw/${type}`);

        return sendNightData(res, "sfw", data, { type });
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
        return sendNightData(
          res,
          "sfw",
          await nightGet("/images/sfw"),
        );
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ==========================================================
  // NSFW — DEDICATED CATEGORY ENDPOINTS
  // Example: /api/v2/night/nsfw/anal?adult=true
  // ==========================================================

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
        const data = await nightGet(`/images/nsfw/${type}`);

        res.setHeader("Cache-Control", "private, max-age=60");

        return sendNightData(res, "nsfw", data, { type });
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

        return sendNightData(res, "nsfw", data);
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ==========================================================
  // JOKES — DEDICATED CATEGORY ENDPOINTS
  //
  // /api/v2/night/jokes/global?lang=en
  // /api/v2/night/jokes/dev?lang=fr
  // /api/v2/night/jokes/id/44?lang=en
  // ==========================================================

  app.get(
    "/api/v2/night/jokes/id/:id",
    async (req: Request, res: Response) => {
      const id = getParam(req.params.id);

      if (!validNumber(id) || Number(id) < 1 || Number(id) > 900) {
        return res.status(400).json({
          success: false,
          error: "Joke ID must be between 1 and 900.",
        });
      }

      return sendJoke(
        req,
        res,
        `/jokes/${encodeURIComponent(id)}`,
        undefined,
        { id: Number(id) },
      );
    },
  );

  app.get(
    "/api/v2/night/jokes/:type",
    async (req: Request, res: Response) => {
      const type = getParam(req.params.type).toLowerCase();

      if (!(JOKE_TYPES as readonly string[]).includes(type)) {
        return res.status(400).json({
          success: false,
          error: "Unsupported joke category.",
          supported: JOKE_TYPES,
        });
      }

      return sendJoke(
        req,
        res,
        `/jokes/${encodeURIComponent(type)}`,
        undefined,
        { type },
      );
    },
  );

  app.get(
    "/api/v2/night/jokes",
    async (req: Request, res: Response) => {
      const rawDisallow = getParam(req.query.disallow);

      const disallow = rawDisallow
        ? rawDisallow
            .split(",")
            .map((item) => item.trim().toLowerCase())
        : [];

      const invalid = disallow.filter(
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

      return sendJoke(
        req,
        res,
        "/jokes",
        disallow.length
          ? { disallow: disallow.join(",") }
          : undefined,
      );
    },
  );

  // ==========================================================
  // IP INFORMATION
  // ==========================================================

  app.get(
    "/api/v2/night/ipinfo/:ip",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const ip = getParam(req.params.ip);

      if (!ip || ip.length > 45 || !/^[0-9a-fA-F:.]+$/.test(ip)) {
        return res.status(400).json({
          success: false,
          error: "Provide a valid IPv4 or IPv6 address.",
        });
      }

      try {
        const data = await nightGet(
          `/general/ipinfo/${encodeURIComponent(ip)}`,
        );

        return sendNightData(res, "ipinfo", data);
      } catch (error) {
        return nightError(res, error);
      }
    },
  );

  // ==========================================================
  // GAME SERVER LOOKUPS
  // ==========================================================

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

          return sendNightData(res, "games", data, {
            game,
            host,
          });
        } catch (error) {
          return nightError(
            res,
            error,
            "Game server lookup failed",
          );
        }
      },
    );
  }

  // ==========================================================
  // QR CODE GENERATOR
  // ==========================================================

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

      const size = Number(
        getParam(req.query.size) || "500",
      );

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
          data: { text, size },
        });

        return sendNightData(
          res,
          "qrcode",
          response.data,
        );
      } catch (error) {
        return nightError(
          res,
          error,
          "QR code generation failed",
        );
      }
    },
  );

  // ==========================================================
  // QR CODE READER
  // ==========================================================

  app.post(
    "/api/v2/night/qrcode/reader",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const image = req.body?.image;

      if (
        typeof image !== "string" ||
        !image.trim() ||
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
          data: { image },
        });

        return sendNightData(
          res,
          "qrcode-reader",
          response.data,
        );
      } catch (error) {
        return nightError(
          res,
          error,
          "QR code reading failed",
        );
      }
    },
  );

  // ==========================================================
  // CAPTCHA
  // ==========================================================

  app.get(
    "/api/v2/night/captcha",
    async (req: Request, res: Response) => {
      if (!requireNightKey(res)) return;

      const size = Number(
        getParam(req.query.size) || "6",
      );

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
          data: { codeSize: size },
        });

        return sendNightData(
          res,
          "captcha",
          response.data,
        );
      } catch (error) {
        return nightError(
          res,
          error,
          "CAPTCHA generation failed",
        );
      }
    },
  );

  console.log("✅ Megan APIs V2 — NIGHT API routes registered");
  console.log(`   Animals: ${ANIMALS.length} categories`);
  console.log(`   SFW: ${SFW_TYPES.length} categories`);
  console.log(`   NSFW: ${NSFW_TYPES.length} categories`);
  console.log(`   Jokes: ${JOKE_TYPES.length} categories`);
  console.log(`   Games: ${GAME_TYPES.length} categories`);
  console.log("   Translation: Megan AI");
  console.log("   Translation cache: 6 hours");
  console.log("   GET  /api/v2/night");
  console.log("   GET  /api/v2/night/animals/:type");
  console.log("   GET  /api/v2/night/sfw/:type");
  console.log("   GET  /api/v2/night/nsfw/:type");
  console.log("   GET  /api/v2/night/jokes/:type");
  console.log("   GET  /api/v2/night/jokes/id/:id");
  console.log("   GET  /api/v2/night/ipinfo/:ip");
  console.log("   GET  /api/v2/night/games/:game/:host");
  console.log("   GET  /api/v2/night/qrcode");
  console.log("   POST /api/v2/night/qrcode/reader");
  console.log("   GET  /api/v2/night/captcha");
}
