// ─── DOER TOOLS ──────────────────────────────────────────────────────────
// A whitelist of actions Doer (the action agent) can execute on behalf of
// the user. Every tool calls a REAL endpoint on this same server using the
// global admin key. No re-imports, no coupling.

const SELF_BASE = process.env.SELF_BASE_URL || "https://apis.megan.qzz.io";
const ADMIN_KEY = process.env.ADMIN_KEY || "megan_admin_master";

interface ToolDef {
  kind: "read" | "action";   // read = auto-runs, action = returns card for user to confirm
  description: string;
  params: Record<string, string>;    // name → type hint
  endpoint: string;                  // e.g. "/api/download/tiktok"
  method: "GET" | "POST";
  // Optional transform: turn Doer's args into query/body
  build?: (args: any) => { query?: Record<string, string>; body?: any };
}

export const DOER_TOOLS: Record<string, ToolDef> = {
  search_endpoints: {
    kind: "read",
    description: "Find Megan API endpoints matching a query. Returns matching endpoint paths, methods, and descriptions.",
    params: { q: "string (search query)" },
    endpoint: "/api/endpoints/search",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query || "" } }),
  },
  search_movies: {
    kind: "read",
    description: "Search TMDB for movies by title. Returns titles, years, ratings, and posters.",
    params: { q: "string (movie title)" },
    endpoint: "/api/tmdb/search/movies",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query || "" } }),
  },
  search_tv: {
    kind: "read",
    description: "Search TMDB for TV shows by title.",
    params: { q: "string (TV show title)" },
    endpoint: "/api/tmdb/search/tv",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.query || "" } }),
  },
  translate_text: {
    kind: "read",
    description: "Translate text between languages using Google Translate.",
    params: { text: "string", target: "string (lang code, e.g. es, fr, sw)", source: "string (optional, default auto)" },
    endpoint: "/api/v2/tools/translate",
    method: "GET",
    build: (a) => ({ query: { text: a.text, target: a.target || a.to || "en", source: a.source || "auto" } }),
  },
  get_crypto_price: {
    kind: "read",
    description: "Get the current price of a cryptocurrency in USD and KES.",
    params: { coin: "string (e.g. bitcoin, ethereum)" },
    endpoint: "/api/crypto/price",
    method: "GET",
    build: (a) => ({ query: { coin: a.coin || "bitcoin" } }),
  },
  download_tiktok: {
    kind: "action",
    description: "Download a TikTok video without watermark. Returns direct MP4 URL and metadata.",
    params: { url: "string (TikTok video URL)" },
    endpoint: "/api/download/tiktok",
    method: "GET",
    build: (a) => ({ query: { url: a.url } }),
  },
  download_youtube_audio: {
    kind: "action",
    description: "Extract audio from a YouTube video as MP3. Accepts URL or search query.",
    params: { q: "string (YouTube URL or search query)" },
    endpoint: "/api/download/yta",
    method: "GET",
    build: (a) => ({ query: { q: a.q || a.url || a.query } }),
  },
  generate_image: {
    kind: "action",
    description: "Generate an AI image from a text prompt using FLUX.",
    params: { prompt: "string (image prompt)", width: "number (optional, default 512)", height: "number (optional, default 512)" },
    endpoint: "/api/ai/image/flux",
    method: "GET",
    build: (a) => ({ query: { prompt: a.prompt, width: String(a.width || 512), height: String(a.height || 512) } }),
  },
  shorten_url: {
    kind: "read",
    description: "Shorten a long URL using TinyURL.",
    params: { url: "string" },
    endpoint: "/api/short/tinyurl",
    method: "GET",
    build: (a) => ({ query: { url: a.url } }),
  },
};

// ─── EXECUTE A TOOL ──────────────────────────────────────────────────────
export async function runDoerTool(
  name: string,
  args: any
): Promise<{ ok: boolean; status: number; data: any; endpoint: string; method: string }> {
  const tool = DOER_TOOLS[name];
  if (!tool) {
    return { ok: false, status: 404, data: { error: `Unknown tool: ${name}` }, endpoint: name, method: "?" };
  }

  const built = tool.build ? tool.build(args || {}) : { query: {} };
  const query = built.query || {};
  const qs = new URLSearchParams({ ...query, api_key: ADMIN_KEY }).toString();
  const url = `${SELF_BASE}${tool.endpoint}?${qs}`;

  try {
    const res = await fetch(url, {
      method: tool.method,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Source": "doer",
      },
      signal: AbortSignal.timeout(30000),
    });
    const data: any = await res.json().catch(() => ({ raw: "non-json response" }));
    return { ok: res.ok, status: res.status, data, endpoint: tool.endpoint, method: tool.method };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e.message }, endpoint: tool.endpoint, method: tool.method };
  }
}

// ─── TOOL CATALOG (fed to Doer's prompt) ─────────────────────────────────
export function formatToolsForDoer(): string {
  const lines: string[] = [];
  for (const [name, t] of Object.entries(DOER_TOOLS)) {
    const p = Object.entries(t.params).map(([k, v]) => `${k}: ${v}`).join(", ");
    lines.push(`- ${name} [${t.kind}] — ${t.description}\n    params: { ${p} }`);
  }
  return lines.join("\n");
}

export function isKnownTool(name: string): boolean {
  return !!DOER_TOOLS[name];
}
