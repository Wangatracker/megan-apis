// ─── MEGAN MOVIES HOMEPAGE ─────────────────────────────────────────────────
// Builds all rows in parallel. Everything is cached in KV.

import { tmdb, posterUrl } from "../tmdb/client";
import { buildSlug } from "./slugs";
import { mediaKv } from "../../server/kv-client";

const ROWS = [
  { key: "trending-movies", title: "🔥 Trending Movies", type: "movie", source: "trending" },
  { key: "new-movies", title: "🆕 New on Megan Movies", type: "movie", source: "now_playing" },
  { key: "popular-movies", title: "🎯 Popular Movies", type: "movie", source: "popular" },
  { key: "top-rated-movies", title: "⭐ Top Rated Movies", type: "movie", source: "top_rated" },
  { key: "trending-tv", title: "🔥 Trending TV Shows", type: "tv", source: "trending" },
  { key: "airing-today", title: "📅 Airing Today", type: "tv", source: "airing_today" },
  { key: "popular-tv", title: "🎯 Popular TV Shows", type: "tv", source: "popular" },
  { key: "top-rated-tv", title: "⭐ Top Rated TV Shows", type: "tv", source: "top_rated" },
  { key: "action-movies", title: "🎬 Action Movies", type: "movie", source: "genre", genre: 28 },
  { key: "comedy-movies", title: "😂 Comedy Movies", type: "movie", source: "genre", genre: 35 },
  { key: "scifi-movies", title: "🚀 Sci-Fi Movies", type: "movie", source: "genre", genre: 878 },
  { key: "horror-movies", title: "👻 Horror Movies", type: "movie", source: "genre", genre: 27 },
  { key: "action-tv", title: "🎭 Action & Adventure TV", type: "tv", source: "genre", genre: 10759 },
  { key: "crime-tv", title: "🕵️ Crime TV", type: "tv", source: "genre", genre: 80 },
  { key: "drama-tv", title: "🎬 Drama TV", type: "tv", source: "genre", genre: 18 },
  { key: "on-the-air", title: "📺 On The Air", type: "tv", source: "on_the_air" },
  { key: "upcoming-movies", title: "📅 Upcoming Movies", type: "movie", source: "upcoming" },
  { key: "best-megan", title: "🏆 Best on Megan", type: "movie", source: "best" },
];

function normalizeItem(item: any): any {
  const title = item.title || item.name || "Untitled";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? parseInt(date.slice(0, 4), 10) : null;
  const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
  return {
    id: item.id,
    slug: buildSlug(item.id, title, year),
    title,
    year,
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
    poster: posterUrl(item.poster_path, "w342"),
    type: mediaType,
  };
}

async function fetchRow(row: any) {
  try {
    let data: any = null;
    switch (row.source) {
      case "trending": data = await tmdb.trending(row.type as any); break;
      case "popular": data = await tmdb.popular(row.type as any); break;
      case "top_rated": data = await tmdb.topRated(row.type as any); break;
      case "now_playing": data = await tmdb.nowPlaying(); break;
      case "upcoming": data = await tmdb.upcoming(); break;
      case "on_the_air": data = await tmdb.onTheAir(); break;
      case "airing_today": data = await tmdb.airingToday(); break;
      case "genre":
        data = await tmdb.discover(row.type as any, {
          with_genres: String(row.genre),
          sort_by: "popularity.desc",
        });
        break;
      case "best":
        data = await tmdb.topRated("movie");
        break;
    }
    const items = (data?.results || []).slice(0, 20).map(normalizeItem).filter((i: any) => i.poster);
    return { key: row.key, title: row.title, type: row.type, items };
  } catch (e: any) {
    console.error(`[movies home] row ${row.key} failed:`, e.message);
    return { key: row.key, title: row.title, type: row.type, items: [] };
  }
}

export async function getHomepage() {
  const cacheKey = "movies:home:v1";
  if (mediaKv.configured()) {
    const hit = await mediaKv.get<any>(cacheKey);
    if (hit) return hit;
  }

  const rows = await Promise.all(ROWS.map(fetchRow));

  const payload = {
    branding: { name: "Megan Movies", tagline: "Powered by Megan Tech" },
    updated_at: new Date().toISOString(),
    rows: rows.filter((r) => r.items.length > 0),
  };

  if (mediaKv.configured()) {
    await mediaKv.put(cacheKey, payload);
  }
  return payload;
}
