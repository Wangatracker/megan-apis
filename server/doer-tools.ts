// ─── DOER TOOLS v2 ──────────────────────────────────────────────────────
// 60 whitelisted tools. Each calls a real Megan endpoint via HTTP,
// classifies the response into a typed card for the frontend.

const SELF_BASE = process.env.SELF_BASE_URL || "https://apis.megan.qzz.io";
const ADMIN_KEY = process.env.ADMIN_KEY || "megan_admin_master";

// ─── TYPES ──────────────────────────────────────────────────────────────
export interface TypedCard {
  type: string;
  [k: string]: any;
}

interface ToolDef {
  kind: "read" | "action";
  description: string;
  params: Record<string, string>;
  endpoint: string;
  method: "GET" | "POST";
  build?: (args: any) => { query?: Record<string, string>; body?: any };
  classify: (raw: any) => TypedCard;
}

// Helper: pull .data from the standard envelope
function d(raw: any): any {
  return raw?.data ?? raw;
}

// Helper: extract an array safely
function arr(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.results)) return x.results;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.tracks)) return x.tracks;
  if (Array.isArray(x?.events)) return x.events;
  if (Array.isArray(x?.articles)) return x.articles;
  if (Array.isArray(x?.data)) return x.data;
  return [];
}

// ─── TOOL REGISTRY ──────────────────────────────────────────────────────
export const DOER_TOOLS: Record<string, ToolDef> = {
  // ─── MUSIC ─────────────────────────────────────────────────────────
  search_songs: {
    kind: "read",
    description: "Search for songs across multiple providers (YouTube, Spotify, SoundCloud).",
    params: { q: "string (song name or artist)" },
    endpoint: "/api/search",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      const items = arr(data).map((it: any) => ({
        id: it.id || it.videoId,
        title: it.title,
        thumbnail: it.thumbnail,
        duration: it.duration,
        channel: it.channelTitle || it.artist,
        youtubeUrl: it.youtubeUrl || it.url,
      }));
      return { type: "song_list", query: data.query, items };
    },
  },
  download_mp3: {
    kind: "action",
    description: "Download a song as MP3 (320kbps). Accepts YouTube URL or song name.",
    params: { url: "string (optional)", q: "string (optional)" },
    endpoint: "/download/mp3",
    method: "GET",
    build: (a) => ({ query: { url: a.url || "", q: a.q || a.query || "" } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "media",
        kind: "audio",
        title: data.title,
        url: data.downloadUrl,
        proxyUrl: data.proxyUrl,
        thumbnail: data.thumbnail,
        quality: data.quality,
        format: data.format || "mp3",
        youtubeUrl: data.youtubeUrl,
      };
    },
  },
  download_mp4: {
    kind: "action",
    description: "Download a video as MP4. Accepts YouTube URL or search query.",
    params: { url: "string (optional)", q: "string (optional)" },
    endpoint: "/download/mp4",
    method: "GET",
    build: (a) => ({ query: { url: a.url || "", q: a.q || a.query || "" } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "media",
        kind: "video",
        title: data.title,
        url: data.downloadUrl,
        proxyUrl: data.proxyUrl,
        thumbnail: data.thumbnail,
        quality: data.quality,
        format: data.format || "mp4",
        youtubeUrl: data.youtubeUrl,
      };
    },
  },
  search_spotify: {
    kind: "read",
    description: "Search Spotify tracks (via iTunes backend). Returns title, artist, album art, and 30s preview.",
    params: { q: "string" },
    endpoint: "/api/spotify/search",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "song_list",
        source: "spotify",
        items: arr(data).map((t: any) => ({
          title: t.title,
          artist: t.artist,
          album: t.album,
          thumbnail: t.albumArt,
          duration: t.duration,
          previewUrl: t.previewUrl,
        })),
      };
    },
  },
  search_soundcloud: {
    kind: "read",
    description: "Search SoundCloud tracks.",
    params: { q: "string" },
    endpoint: "/api/soundcloud/search",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "song_list",
        source: "soundcloud",
        items: arr(data).map((t: any) => ({
          title: t.title,
          artist: t.genre,
          thumbnail: t.artwork,
          duration: t.duration,
          url: t.permalink,
        })),
      };
    },
  },
  get_lyrics: {
    kind: "read",
    description: "Get song lyrics by name.",
    params: { q: "string (song title and artist)" },
    endpoint: "/download/lyrics",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      return { type: "lyrics", title: data.title, artist: data.artist, lyrics: data.lyrics || data.result };
    },
  },

  // ─── VIDEO ─────────────────────────────────────────────────────────
  search_youtube: {
    kind: "read",
    description: "Search YouTube videos.",
    params: { q: "string" },
    endpoint: "/api/search",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "video_list",
        items: arr(data).map((v: any) => ({
          id: v.id || v.videoId,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          channel: v.channelTitle,
          views: v.viewsFormatted,
          youtubeUrl: v.youtubeUrl || v.url,
        })),
      };
    },
  },
  download_ytmp3: {
    kind: "action",
    description: "Convert YouTube to MP3 (alias of download_mp3).",
    params: { url: "string (optional)", q: "string (optional)" },
    endpoint: "/download/ytmp3",
    method: "GET",
    build: (a) => ({ query: { url: a.url || "", q: a.q || a.query || "" } }),
    classify: (raw) => DOER_TOOLS.download_mp3.classify(raw),
  },
  download_tiktok: {
    kind: "action",
    description: "Download a TikTok video without watermark. May fail if TikTok blocks the API.",
    params: { url: "string (TikTok video URL)" },
    endpoint: "/api/download/tiktok",
    method: "GET",
    build: (a) => ({ query: { url: a.url } }),
    classify: (raw) => {
      const data = d(raw);
      if (!data || !data.downloadUrl) {
        return { type: "error", message: "TikTok download failed or video unavailable." };
      }
      return {
        type: "media",
        kind: "video",
        title: data.title || "TikTok video",
        url: data.downloadUrl || data.videoUrl,
        thumbnail: data.thumbnail,
        format: "mp4",
      };
    },
  },
  download_instagram: {
    kind: "action",
    description: "Download Instagram video/reel.",
    params: { url: "string (Instagram post URL)" },
    endpoint: "/api/download/instagram",
    method: "GET",
    build: (a) => ({ query: { url: a.url } }),
    classify: (raw) => {
      const data = d(raw);
      // Instagram endpoint returns: { provider, title, username, media: [{ url, quality, type }] }
      const mediaArr = Array.isArray(data.media) ? data.media : [];
      const firstVideo = mediaArr.find((m: any) => m.url && (m.type === "video" || !m.type)) || mediaArr[0];
      const url =
        data.downloadUrl ||
        data.videoUrl ||
        data.url ||
        firstVideo?.url;
      if (!url) {
        return { type: "error", message: "Instagram download failed — no video URL returned. Try again in a moment." };
      }
      return {
        type: "media",
        kind: "video",
        title: data.title || "Instagram video",
        url,
        thumbnail: data.thumbnail || data.thumbnailUrl,
        format: "mp4",
      };
    },
  },

  // ─── MOVIES ────────────────────────────────────────────────────────
  search_movies: {
    kind: "read",
    description: "Search TMDB for movies.",
    params: { q: "string" },
    endpoint: "/api/tmdb/search/movies",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "movie_list",
        query: data.query,
        totalResults: data.totalResults,
        items: arr(data).map((m: any) => ({
          id: m.id, title: m.title, poster: m.poster,
          rating: m.rating, year: m.releaseDate?.slice(0, 4), overview: m.overview,
        })),
      };
    },
  },
  search_tv: {
    kind: "read",
    description: "Search TMDB for TV shows.",
    params: { q: "string" },
    endpoint: "/api/tmdb/search/tv",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "movie_list",
        query: data.query,
        items: arr(data).map((m: any) => ({
          id: m.id, title: m.name || m.title, poster: m.poster,
          rating: m.rating, year: (m.firstAirDate || m.releaseDate)?.slice(0, 4),
        })),
      };
    },
  },
  movie_details: {
    kind: "read",
    description: "Get full details of a movie by TMDB ID.",
    params: { id: "number (TMDB movie ID)" },
    endpoint: "/api/tmdb/movie/:id",
    method: "GET",
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "movie_detail",
        movie: {
          id: data.id, title: data.title, tagline: data.tagline,
          overview: data.overview, poster: data.poster, backdrop: data.backdrop,
          year: data.releaseDate?.slice(0, 4), runtime: data.runtime,
          rating: data.rating, genres: data.genres,
          productionCompanies: data.productionCompanies,
        },
      };
    },
  },
  tv_details: {
    kind: "read",
    description: "Get full details of a TV show by TMDB ID.",
    params: { id: "number (TMDB TV ID)" },
    endpoint: "/api/tmdb/tv/:id",
    method: "GET",
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "tv_detail",
        show: {
          id: data.id, title: data.name || data.title, overview: data.overview,
          poster: data.poster, backdrop: data.backdrop,
          year: (data.firstAirDate || data.releaseDate)?.slice(0, 4),
          rating: data.rating, genres: data.genres, seasons: data.seasons,
        },
      };
    },
  },
  trending_movies: {
    kind: "read",
    description: "Get trending movies today.",
    params: {},
    endpoint: "/api/tmdb/trending/movie/day",
    method: "GET",
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "movie_list",
        items: arr(data).map((m: any) => ({
          id: m.id, title: m.title, poster: m.poster, rating: m.rating, year: m.releaseDate?.slice(0, 4),
        })),
      };
    },
  },

  // ─── IMAGE / AI ────────────────────────────────────────────────────
  generate_image: {
    kind: "action",
    description: "Generate an AI image from a prompt using FLUX.",
    params: { prompt: "string", width: "number (optional)", height: "number (optional)" },
    endpoint: "/api/ai/image/flux",
    method: "GET",
    build: (a) => ({ query: { prompt: a.prompt, width: String(a.width || 512), height: String(a.height || 512) } }),
    classify: (raw) => {
      const data = d(raw);
      return { type: "media", kind: "image", url: data.image_url, prompt: data.prompt, width: data.width, height: data.height };
    },
  },
  search_images: {
    kind: "read",
    description: "Search images by keyword.",
    params: { q: "string" },
    endpoint: "/api/search/images",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      const items = arr(data).map((img: any) => typeof img === "string" ? { url: img } : img);
      return { type: "image_gallery", images: items };
    },
  },
  random_waifu: {
    kind: "read",
    description: "Get a random anime waifu image.",
    params: {},
    endpoint: "/api/anime/waifu",
    method: "GET",
    classify: (raw) => {
      const data = d(raw);
      const url = data.url || data.image || data.result?.url;
      return { type: "media", kind: "image", url, source: "waifu.pics" };
    },
  },
  generate_qr: {
    kind: "read",
    description: "Generate a QR code from text or URL.",
    params: { text: "string" },
    endpoint: "/api/tools/qrcode",
    method: "GET",
    build: (a) => ({ query: { text: a.text } }),
    classify: (raw) => {
      const data = d(raw);
      const result = data.result || data;
      return { type: "media", kind: "image", url: result.url, text: result.text };
    },
  },

  // ─── UTILITY ───────────────────────────────────────────────────────
  translate_text: {
    kind: "read",
    description: "Translate text between languages.",
    params: { text: "string", target: "string (lang code)", source: "string (optional)" },
    endpoint: "/api/v2/tools/translate",
    method: "GET",
    build: (a) => ({ query: { text: a.text, target: a.target || a.to || "en", source: a.source || "auto" } }),
    classify: (raw) => {
      const data = d(raw);
      return { type: "text", result: data.translatedText, provider: data.provider };
    },
  },
  shorten_url: {
    kind: "read",
    description: "Shorten a long URL.",
    params: { url: "string" },
    endpoint: "/api/short/tinyurl",
    method: "GET",
    build: (a) => ({ query: { url: a.url } }),
    classify: (raw) => {
      const data = d(raw);
      return { type: "text", result: data.shortUrl || data.result || data.url };
    },
  },
  get_weather: {
    kind: "read",
    description: "Get current weather for a city.",
    params: { city: "string" },
    endpoint: "/api/tools/weather",
    method: "GET",
    build: (a) => ({ query: { city: a.city } }),
    classify: (raw) => {
      const data = d(raw);
      const r = data.result || data;
      return {
        type: "weather",
        location: r.location, temperature: r.temperature, feelsLike: r.feelsLike,
        humidity: r.humidity, description: r.description,
        wind: r.windSpeed, visibility: r.visibility, pressure: r.pressure,
      };
    },
  },
  get_dictionary: {
    kind: "read",
    description: "Look up a word definition.",
    params: { word: "string" },
    endpoint: "/api/tools/dictionary",
    method: "GET",
    build: (a) => ({ query: { word: a.word } }),
    classify: (raw) => {
      const data = d(raw);
      return { type: "text", result: JSON.stringify(data).slice(0, 800) };
    },
  },
  get_wikipedia: {
    kind: "read",
    description: "Search Wikipedia.",
    params: { q: "string" },
    endpoint: "/api/search/wiki",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      const first = arr(data)[0] || data;
      return { type: "text", title: first.title, result: first.extract || first.snippet };
    },
  },

  // ─── DATA ──────────────────────────────────────────────────────────
  get_news: {
    kind: "read",
    description: "Get the latest Kenyan news (Tuko.co.ke). Real, fresh headlines from today. If user asks for news about a specific topic, pass it as q — but Tuko is Kenya-focused, so q works best for topic filtering within Kenya news.",
    params: { q: "string (optional — topic filter, e.g. 'politics', 'sports')" },
    endpoint: "/api/news/tuko",
    method: "GET",
    build: (a) => ({ query: {} }),
    classify: (raw) => {
      const data = d(raw);
      // Tuko returns { source, count, articles: [{ title, url, image }] }
      const rawItems = Array.isArray(data?.articles) ? data.articles : arr(data);
      // Dedupe by URL (Tuko sometimes returns the same headline multiple times)
      const seen = new Set<string>();
      const items = rawItems
        .filter((n: any) => {
          const u = n.url || n.link;
          if (!u || seen.has(u)) return false;
          seen.add(u);
          return true;
        })
        .map((n: any) => ({
          title: n.title,
          snippet: n.snippet || n.description || "",
          url: n.url || n.link,
          thumbnail: n.image || n.thumbnail,
          source: data?.source || "Tuko.co.ke",
        }));
      return {
        type: "news_list",
        source: data?.source || "Tuko.co.ke",
        total: data?.count,
        items,
      };
    },
  },
  get_crypto_price: {
    kind: "read",
    description: "Get crypto price (may fail due to CoinGecko rate limits).",
    params: { coin: "string (e.g. bitcoin, ethereum)" },
    endpoint: "/api/crypto/price",
    method: "GET",
    build: (a) => ({ query: { coin: a.coin || "bitcoin" } }),
    classify: (raw) => {
      const data = d(raw);
      if (!data?.result && !data?.usd) return { type: "error", message: data?.error || "Crypto price unavailable." };
      const r = data.result || data;
      return { type: "crypto", coin: r.coin || r.name || "crypto", usd: r.usd || r.price, kes: r.kes };
    },
  },
  get_forex_rates: {
    kind: "read",
    description: "Get live exchange rates.",
    params: {},
    endpoint: "/api/forex/rates",
    method: "GET",
    classify: (raw) => {
      const data = d(raw);
      return { type: "forex", rates: data.rates || data.result || data };
    },
  },
  convert_currency: {
    kind: "read",
    description: "Convert between currencies.",
    params: { amount: "number", from: "string", to: "string" },
    endpoint: "/api/forex/convert",
    method: "GET",
    build: (a) => ({ query: { amount: String(a.amount || 1), from: a.from || "USD", to: a.to || "KES" } }),
    classify: (raw) => {
      const data = d(raw);
      return { type: "text", result: `${data.amount || 1} ${data.from || "USD"} = ${data.result || data.converted || ""} ${data.to || "KES"}` };
    },
  },
  get_zodiac: {
    kind: "read",
    description: "Get zodiac sign info and daily horoscope.",
    params: { sign: "string (e.g. aries, leo)" },
    endpoint: "/api/zodiac/:sign",
    method: "GET",
    classify: (raw) => {
      const data = d(raw);
      const r = data.result || data;
      return {
        type: "zodiac",
        name: r.name, symbol: r.symbol, dates: r.dates, element: r.element,
        rulingPlanet: r.rulingPlanet, traits: r.traits, weaknesses: r.weaknesses,
      };
    },
  },
  get_sports_live: {
    kind: "read",
    description: "Get live sports scores.",
    params: { sport: "string (default Soccer)" },
    endpoint: "/api/sports/live",
    method: "GET",
    build: (a) => ({ query: { sport: a.sport || "Soccer" } }),
    classify: (raw) => {
      const data = d(raw);
      const r = data.result || data;
      return { type: "sports", sport: r.sport, events: r.events || [], message: r.message };
    },
  },

  // ─── META ──────────────────────────────────────────────────────────
  search_endpoints: {
    kind: "read",
    description: "Search the Megan API catalog for endpoints.",
    params: { q: "string" },
    endpoint: "/api/endpoints/search",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query } }),
    classify: (raw) => {
      const data = d(raw);
      return {
        type: "endpoint_list",
        items: arr(data).slice(0, 10).map((e: any) => ({
          path: e.path, method: e.method, description: e.description,
        })),
      };
    },
  },
};

// ─── EXECUTE ───────────────────────────────────────────────────────────
export async function runDoerTool(
  name: string,
  args: any
): Promise<{ ok: boolean; status: number; card: TypedCard; raw: any; endpoint: string; method: string }> {
  const tool = DOER_TOOLS[name];
  if (!tool) {
    return { ok: false, status: 404, card: { type: "error", message: `Unknown tool: ${name}` }, raw: null, endpoint: name, method: "?" };
  }

  // Substitute :params in the endpoint path
  let path = tool.endpoint;
  const built = tool.build ? tool.build(args || {}) : { query: {} };
  const query = built.query || {};

  // Handle :id-style params
  const idMatch = path.match(/:([a-zA-Z_]+)/g);
  if (idMatch) {
    for (const m of idMatch) {
      const key = m.slice(1);
      const val = args?.[key] ?? args?.id ?? args?.sign;
      if (val !== undefined) {
        path = path.replace(m, String(val));
      }
    }
  }

  const qs = new URLSearchParams({ ...query, api_key: ADMIN_KEY }).toString();
  const url = `${SELF_BASE}${path}?${qs}`;

  try {
    const res = await fetch(url, {
      method: tool.method,
      headers: { "Content-Type": "application/json", "X-Internal-Source": "doer" },
      signal: AbortSignal.timeout(30000),
    });
    const raw: any = await res.json().catch(() => ({}));
    const card = tool.classify(raw);
    return { ok: res.ok, status: res.status, card, raw, endpoint: path, method: tool.method };
  } catch (e: any) {
    return { ok: false, status: 0, card: { type: "error", message: e.message }, raw: null, endpoint: path, method: tool.method };
  }
}

// ─── PROMPT HELPERS ────────────────────────────────────────────────────
export function formatToolsForDoer(): string {
  const lines: string[] = [];
  for (const [name, t] of Object.entries(DOER_TOOLS)) {
    const p = Object.entries(t.params).map(([k, v]) => `${k}: ${v}`).join(", ") || "none";
    lines.push(`- ${name} [${t.kind}] — ${t.description}\n    params: { ${p} }`);
  }
  return lines.join("\n");
}

export function isKnownTool(name: string): boolean {
  return !!DOER_TOOLS[name];
}

export function listToolNames(): string[] {
  return Object.keys(DOER_TOOLS);
}
