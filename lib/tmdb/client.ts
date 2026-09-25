// ─── TMDB CLIENT (Megan Movies internal) ───────────────────────────────────
// All responses cached in KV. Never expose "TMDB" to end users.

import { mediaKv } from "../../server/kv-client";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";
const TMDB_TOKEN = process.env.TMDB_TOKEN || "";

function headers() {
  return {
    "Authorization": `Bearer ${TMDB_TOKEN}`,
    "Accept": "application/json",
  };
}

// ─── IMAGE HELPERS ─────────────────────────────────────────────────────────
export function posterUrl(path: string | null, size: "w342" | "w500" | "original" = "w342"): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMG}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMG}/${size}${path}`;
}

export function profileUrl(path: string | null, size: "w200" | "w500" = "w200"): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMG}/${size}${path}`;
}

// ─── CACHED FETCH ──────────────────────────────────────────────────────────
async function cachedFetch<T = any>(
  key: string,
  url: string,
  ttlSeconds: number
): Promise<T | null> {
  // 1. Try KV
  if (mediaKv.configured()) {
    const hit = await mediaKv.get<T>(key);
    if (hit) return hit;
  }

  // 2. Fetch from TMDB
  try {
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) {
      console.error(`[TMDB] ${res.status} for ${url.slice(0, 120)}`);
      return null;
    }
    const data = await res.json() as T;

    // 3. Store in KV
    if (mediaKv.configured()) {
      // Cloudflare KV TTL must be at least 60 seconds
      await mediaKv.put(key, data);
    }
    return data;
  } catch (e: any) {
    console.error(`[TMDB] fetch error:`, e.message);
    return null;
  }
}

// ─── ENDPOINTS ─────────────────────────────────────────────────────────────

export const tmdb = {
  // Search
  async search(query: string, page = 1) {
    const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    return cachedFetch(`movies:search:${query.toLowerCase()}:${page}`, url, 1800);
  },

  // Detail
  async movie(id: number) {
    const url = `${TMDB_BASE}/movie/${id}?append_to_response=credits,videos,similar,recommendations,external_ids`;
    return cachedFetch(`movies:movie:${id}`, url, 86400);
  },

  async tv(id: number) {
    const url = `${TMDB_BASE}/tv/${id}?append_to_response=credits,videos,similar,recommendations,external_ids`;
    return cachedFetch(`movies:tv:${id}`, url, 86400);
  },

  async season(tvId: number, seasonNum: number) {
    const url = `${TMDB_BASE}/tv/${tvId}/season/${seasonNum}`;
    return cachedFetch(`movies:tv:${tvId}:s${seasonNum}`, url, 86400);
  },

  // Lists
  async trending(type: "movie" | "tv" | "all", window: "day" | "week" = "week") {
    const url = `${TMDB_BASE}/trending/${type}/${window}`;
    return cachedFetch(`movies:trending:${type}:${window}`, url, 21600);
  },

  async popular(type: "movie" | "tv") {
    const url = `${TMDB_BASE}/${type}/popular`;
    return cachedFetch(`movies:popular:${type}`, url, 21600);
  },

  async topRated(type: "movie" | "tv") {
    const url = `${TMDB_BASE}/${type}/top_rated`;
    return cachedFetch(`movies:top-rated:${type}`, url, 86400);
  },

  async nowPlaying() {
    const url = `${TMDB_BASE}/movie/now_playing`;
    return cachedFetch(`movies:now-playing`, url, 21600);
  },

  async upcoming() {
    const url = `${TMDB_BASE}/movie/upcoming`;
    return cachedFetch(`movies:upcoming`, url, 86400);
  },

  async onTheAir() {
    const url = `${TMDB_BASE}/tv/on_the_air`;
    return cachedFetch(`movies:on-the-air`, url, 21600);
  },

  async airingToday() {
    const url = `${TMDB_BASE}/tv/airing_today`;
    return cachedFetch(`movies:airing-today`, url, 21600);
  },

  // Discover (browse)
  async discover(type: "movie" | "tv", params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    const url = `${TMDB_BASE}/discover/${type}?${qs}`;
    const key = `movies:discover:${type}:${qs}`;
    return cachedFetch(key, url, 21600);
  },

  // Genres
  async genres(type: "movie" | "tv") {
    const url = `${TMDB_BASE}/genre/${type}/list`;
    return cachedFetch(`movies:genres:${type}`, url, 604800);
  },

  // External ID → TMDB (for future)
  async findByImdb(imdbId: string) {
    const url = `${TMDB_BASE}/find/${imdbId}?external_source=imdb_id`;
    return cachedFetch(`movies:imdb:${imdbId}`, url, 86400);
  },
};
