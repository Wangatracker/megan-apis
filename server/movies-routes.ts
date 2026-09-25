import type { Express, Request, Response } from "express";
import { tmdb, posterUrl, backdropUrl, profileUrl } from "../lib/tmdb/client";
import { resolveStream, getDownloads, getSubtitles, getServers } from "../lib/movies/cinejoy";
import { getHomepage } from "../lib/movies/home";
import { parseSlug, buildSlug } from "../lib/movies/slugs";

// ─── SANITIZER ────────────────────────────────────────────────────────────
// Never expose internal errors to users.
function publicError(res: Response, status = 500, msg = "Service temporarily unavailable") {
  return res.status(status).json({ success: false, error: msg });
}

function normalizeItem(item: any) {
  const title = item.title || item.name || "Untitled";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? parseInt(date.slice(0, 4), 10) : null;
  const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
  return {
    id: item.id,
    slug: buildSlug(item.id, title, year),
    title,
    year,
    release_date: date || null,
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
    poster: posterUrl(item.poster_path, "w342"),
    type: mediaType,
  };
}

function normalizeCast(credits: any) {
  const cast = (credits?.cast || []).slice(0, 20).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    photo: profileUrl(c.profile_path),
  }));
  return cast;
}

export function registerMoviesRoutes(app: Express): void {
  // ─── HOMEPAGE ────────────────────────────────────────────────────────────
  app.get("/api/v2/movies/home", async (_req: Request, res: Response) => {
    try {
      const data = await getHomepage();
      return res.json(data);
    } catch (e: any) {
      console.error("[movies/home]", e.message);
      return publicError(res, 500, "Couldn't load homepage");
    }
  });

  // ─── SEARCH ──────────────────────────────────────────────────────────────
  app.get("/api/v2/movies/search", async (req: Request, res: Response) => {
    const q = (req.query.q as string || "").trim();
    if (!q) return res.json({ success: true, results: [] });
    try {
      const data = await tmdb.search(q);
      const results = (data?.results || [])
        .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
        .map(normalizeItem);
      return res.json({ success: true, query: q, results });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── BROWSE ──────────────────────────────────────────────────────────────
  app.get("/api/v2/movies/browse", async (req: Request, res: Response) => {
    const type = (req.query.type as string) === "tv" ? "tv" : "movie";
    const genre = req.query.genre as string | undefined;
    const year = req.query.year as string | undefined;
    const sort = (req.query.sort as string) || "popularity.desc";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const params: Record<string, string> = {
      sort_by: sort,
      page: String(page),
    };
    if (genre) params.with_genres = genre;
    if (year) params[type === "movie" ? "primary_release_year" : "first_air_date_year"] = year;

    try {
      const data = await tmdb.discover(type, params);
      const results = (data?.results || []).map(normalizeItem);
      return res.json({
        success: true,
        type,
        page,
        total_pages: data?.total_pages || 1,
        results,
      });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── GENRES ──────────────────────────────────────────────────────────────
  app.get("/api/v2/movies/genres", async (req: Request, res: Response) => {
    const type = (req.query.type as string) === "tv" ? "tv" : "movie";
    try {
      const data = await tmdb.genres(type);
      return res.json({ success: true, type, genres: data?.genres || [] });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── MOVIE DETAIL ────────────────────────────────────────────────────────
  app.get("/api/v2/movies/movie/:slug", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    if (!id) return publicError(res, 400, "Invalid movie id");

    try {
      const m = await tmdb.movie(id) as any;
      if (!m || !m.id) return publicError(res, 404, "Movie not found");

      const title = m.title || "Untitled";
      const year = m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : null;

      return res.json({
        success: true,
        movie: {
          id: m.id,
          slug: buildSlug(m.id, title, year),
          title,
          tagline: m.tagline,
          overview: m.overview,
          year,
          runtime: m.runtime,
          rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
          votes: m.vote_count,
          genres: (m.genres || []).map((g: any) => g.name),
          poster: posterUrl(m.poster_path, "w500"),
          backdrop: backdropUrl(m.backdrop_path, "w1280"),
          imdb_id: m.imdb_id || m.external_ids?.imdb_id,
          cast: normalizeCast(m.credits),
          similar: (m.similar?.results || []).slice(0, 12).map(normalizeItem),
        },
      });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── TV DETAIL ───────────────────────────────────────────────────────────
  app.get("/api/v2/movies/tv/:slug", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    if (!id) return publicError(res, 400, "Invalid show id");

    try {
      const t = await tmdb.tv(id) as any;
      if (!t || !t.id) return publicError(res, 404, "Show not found");

      const title = t.name || "Untitled";
      const year = t.first_air_date ? parseInt(t.first_air_date.slice(0, 4), 10) : null;

      return res.json({
        success: true,
        show: {
          id: t.id,
          slug: buildSlug(t.id, title, year),
          title,
          tagline: t.tagline,
          overview: t.overview,
          year,
          rating: t.vote_average ? Math.round(t.vote_average * 10) / 10 : null,
          votes: t.vote_count,
          genres: (t.genres || []).map((g: any) => g.name),
          poster: posterUrl(t.poster_path, "w500"),
          backdrop: backdropUrl(t.backdrop_path, "w1280"),
          imdb_id: t.external_ids?.imdb_id,
          seasons: (t.seasons || [])
            .filter((s: any) => s.season_number > 0)
            .map((s: any) => ({
              season: s.season_number,
              name: s.name,
              episodes: s.episode_count,
              year: s.air_date ? parseInt(s.air_date.slice(0, 4), 10) : null,
              poster: posterUrl(s.poster_path, "w342"),
            })),
          cast: normalizeCast(t.credits),
          similar: (t.similar?.results || []).slice(0, 12).map(normalizeItem),
        },
      });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── TV SEASON ───────────────────────────────────────────────────────────
  app.get("/api/v2/movies/tv/:slug/season/:n", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    const seasonNum = parseInt(String(req.params.n));
    if (!id || isNaN(seasonNum)) return publicError(res, 400, "Invalid params");

    try {
      const s = await tmdb.season(id, seasonNum) as any;
      if (!s || !s.id) return publicError(res, 404, "Season not found");

      const episodes = (s.episodes || []).map((e: any) => ({
        episode: e.episode_number,
        title: e.name,
        overview: e.overview,
        runtime: e.runtime,
        air_date: e.air_date,
        rating: e.vote_average ? Math.round(e.vote_average * 10) / 10 : null,
        still: e.still_path ? `https://image.tmdb.org/t/p/w300${e.still_path}` : "",
      }));

      return res.json({
        success: true,
        show_id: id,
        season: seasonNum,
        name: s.name,
        overview: s.overview,
        episodes,
      });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── STREAMS ─────────────────────────────────────────────────────────────
  app.get("/api/v2/movies/movie/:slug/streams", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    if (!id) return publicError(res, 400, "Invalid movie id");

    try {
      const streams = await resolveStream({ tmdbId: id, type: "movie" });
      if (!streams.length) return res.json({ success: false, error: "Stream temporarily unavailable" });
      return res.json({ success: true, streams });
    } catch (e: any) {
      return publicError(res);
    }
  });

  app.get("/api/v2/movies/tv/:slug/season/:n/episode/:m/streams", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    const s = parseInt(String(req.params.n));
    const e = parseInt(String(req.params.m));
    if (!id || isNaN(s) || isNaN(e)) return publicError(res, 400, "Invalid params");

    try {
      const streams = await resolveStream({ tmdbId: id, type: "tv", season: s, episode: e });
      if (!streams.length) return res.json({ success: false, error: "Stream temporarily unavailable" });
      return res.json({ success: true, streams });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── DOWNLOADS ───────────────────────────────────────────────────────────
  app.get("/api/v2/movies/movie/:slug/downloads", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    if (!id) return publicError(res, 400, "Invalid movie id");

    try {
      const downloads = await getDownloads({ tmdbId: id, type: "movie" });
      return res.json({ success: true, downloads });
    } catch (e: any) {
      return publicError(res);
    }
  });

  app.get("/api/v2/movies/tv/:slug/season/:n/episode/:m/downloads", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    const s = parseInt(String(req.params.n));
    const e = parseInt(String(req.params.m));
    if (!id || isNaN(s) || isNaN(e)) return publicError(res, 400, "Invalid params");

    try {
      const downloads = await getDownloads({ tmdbId: id, type: "tv", season: s, episode: e });
      return res.json({ success: true, downloads });
    } catch (err: any) {
      return publicError(res);
    }
  });

  // ─── SUBTITLES ───────────────────────────────────────────────────────────
  app.get("/api/v2/movies/movie/:slug/subs", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    if (!id) return publicError(res, 400, "Invalid movie id");
    try {
      const subs = await getSubtitles({ tmdbId: id, type: "movie" });
      return res.json({ success: true, subtitles: subs });
    } catch { return publicError(res); }
  });

  app.get("/api/v2/movies/tv/:slug/season/:n/episode/:m/subs", async (req: Request, res: Response) => {
    const id = parseSlug(String(req.params.slug));
    const s = parseInt(String(req.params.n));
    const e = parseInt(String(req.params.m));
    if (!id || isNaN(s) || isNaN(e)) return publicError(res, 400, "Invalid params");
    try {
      const subs = await getSubtitles({ tmdbId: id, type: "tv", season: s, episode: e });
      return res.json({ success: true, subtitles: subs });
    } catch { return publicError(res); }
  });

  // ─── SINGLE-ROW ENDPOINTS ────────────────────────────────────────────────
  // Simple list endpoints. All paginate internally and return the same shape.

  async function rowHandler(type: "movie" | "tv", source: string, req: Request, res: Response) {
    try {
      let data: any = null;
      switch (source) {
        case "trending": data = await tmdb.trending(type); break;
        case "popular": data = await tmdb.popular(type); break;
        case "top-rated": data = await tmdb.topRated(type); break;
        case "now-playing": data = await tmdb.nowPlaying(); break;
        case "upcoming": data = await tmdb.upcoming(); break;
        case "on-the-air": data = await tmdb.onTheAir(); break;
        case "airing-today": data = await tmdb.airingToday(); break;
      }
      const results = (data?.results || []).map(normalizeItem);
      return res.json({ success: true, type, source, results });
    } catch (e: any) {
      console.error(`[movies/${source}]`, e.message);
      return publicError(res);
    }
  }

  app.get("/api/v2/movies/trending", async (req: Request, res: Response) => {
    const type = (req.query.type as string) === "tv" ? "tv" : "movie";
    return rowHandler(type, "trending", req, res);
  });

  app.get("/api/v2/movies/popular", async (req: Request, res: Response) => {
    const type = (req.query.type as string) === "tv" ? "tv" : "movie";
    return rowHandler(type, "popular", req, res);
  });

  app.get("/api/v2/movies/top-rated", async (req: Request, res: Response) => {
    const type = (req.query.type as string) === "tv" ? "tv" : "movie";
    return rowHandler(type, "top-rated", req, res);
  });

  app.get("/api/v2/movies/now-playing", async (_req: Request, res: Response) => {
    return rowHandler("movie", "now-playing", _req, res);
  });

  // Upcoming movies — filters out anything already released
  app.get("/api/v2/movies/upcoming", async (req: Request, res: Response) => {
    try {
      const data = await tmdb.discover("movie", {
        sort_by: "primary_release_date.asc",
        "primary_release_date.gte": new Date().toISOString().slice(0, 10),
        "vote_count.gte": "5",
      });
      const results = (data?.results || [])
        .map(normalizeItem)
        .filter((m: any) => {
          if (!m.release_date) return false;
          return new Date(m.release_date).getTime() >= Date.now() - 86400000; // today or future
        })
        .slice(0, 20);
      return res.json({ success: true, type: "movie", source: "upcoming", results });
    } catch (e: any) {
      console.error("[movies/upcoming]", e.message);
      return publicError(res);
    }
  });

  app.get("/api/v2/movies/on-the-air", async (_req: Request, res: Response) => {
    return rowHandler("tv", "on-the-air", _req, res);
  });

  app.get("/api/v2/movies/airing-today", async (_req: Request, res: Response) => {
    return rowHandler("tv", "airing-today", _req, res);
  });

  // ─── GENRE SHORTCUTS ─────────────────────────────────────────────────────
  // Clean URLs like /api/v2/movies/comedy → /discover?with_genres=35

  const GENRE_MAP: Record<string, { movie: number; tv: number }> = {
    "action": { movie: 28, tv: 10759 },
    "comedy": { movie: 35, tv: 35 },
    "sci-fi": { movie: 878, tv: 10765 },
    "scifi": { movie: 878, tv: 10765 },
    "horror": { movie: 27, tv: 9648 },
    "drama": { movie: 18, tv: 18 },
    "romance": { movie: 10749, tv: 10749 },
    "thriller": { movie: 53, tv: 80 },
    "animation": { movie: 16, tv: 16 },
    "documentary": { movie: 99, tv: 99 },
    "family": { movie: 10751, tv: 10751 },
    "fantasy": { movie: 14, tv: 10765 },
    "mystery": { movie: 9648, tv: 9648 },
    "crime": { movie: 80, tv: 80 },
    "adventure": { movie: 12, tv: 10759 },
    "war": { movie: 10752, tv: 10768 },
    "western": { movie: 37, tv: 37 },
    "musical": { movie: 10402, tv: 10402 },
    "history": { movie: 36, tv: 10768 },
  };

  app.get("/api/v2/movies/:genre", async (req: Request, res: Response, next) => {
    const genreSlug = String(req.params.genre).toLowerCase();
    const entry = GENRE_MAP[genreSlug];
    if (!entry) return next(); // fall through to other routes

    const type = (req.query.type as string) === "tv" ? "tv" : "movie";
    const genreId = entry[type];
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    try {
      const data = await tmdb.discover(type, {
        with_genres: String(genreId),
        sort_by: "popularity.desc",
        page: String(page),
      });
      const results = (data?.results || []).map(normalizeItem);
      return res.json({
        success: true,
        type,
        genre: genreSlug,
        genre_id: genreId,
        page,
        total_pages: data?.total_pages || 1,
        results,
      });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── RECOMMENDED ─────────────────────────────────────────────────────────
  // Based on a specific title: /api/v2/movies/recommended?type=movie&id=550
  app.get("/api/v2/movies/recommended", async (req: Request, res: Response) => {
    const type = (req.query.type as string) === "tv" ? "tv" : "movie";
    const idRaw = req.query.id as string;
    if (!idRaw) return publicError(res, 400, "id required");

    const id = parseSlug(idRaw);
    if (!id) return publicError(res, 400, "Invalid id");

    try {
      let data: any;
      if (type === "movie") data = await tmdb.movie(id) as any;
      else data = await tmdb.tv(id) as any;

      const results = ((data as any)?.recommendations?.results || [])
        .slice(0, 20)
        .map(normalizeItem);
      return res.json({ success: true, type, based_on: id, results });
    } catch (e: any) {
      return publicError(res);
    }
  });

  // ─── HOME BANNERS ────────────────────────────────────────────────────────
  // 6 rotating hero banners. Type: "mixed" (default), "movie", or "tv"
  app.get("/api/v2/movies/banners", async (req: Request, res: Response) => {
    const type = (req.query.type as string) || "mixed";
    try {
      const banners = await buildBanners(type as any);
      return res.json({ success: true, type, count: banners.length, banners });
    } catch (e: any) {
      console.error("[movies/banners] ERROR:", e.message);
      console.error("[movies/banners] STACK:", e.stack);
      // Return real error in dev for debugging
      return res.status(500).json({ success: false, error: e.message, stack: e.stack?.split("\n").slice(0, 5) });
    }
  });

  console.log("✅ Megan Movies Routes Registered:");
  console.log("  GET /api/v2/movies/home");
  console.log("  GET /api/v2/movies/search?q=");
  console.log("  GET /api/v2/movies/browse?type=&genre=&year=&sort=&page=");
  console.log("  GET /api/v2/movies/genres?type=");
  console.log("  GET /api/v2/movies/movie/:slug");
  console.log("  GET /api/v2/movies/tv/:slug");
  console.log("  GET /api/v2/movies/tv/:slug/season/:n");
  console.log("  GET /api/v2/movies/movie/:slug/streams");
  console.log("  GET /api/v2/movies/movie/:slug/downloads");
  console.log("  GET /api/v2/movies/tv/:slug/season/:n/episode/:m/streams");
  console.log("  GET /api/v2/movies/tv/:slug/season/:n/episode/:m/downloads");
  console.log("  GET /api/v2/movies/trending?type=movie|tv");
  console.log("  GET /api/v2/movies/popular?type=movie|tv");
  console.log("  GET /api/v2/movies/top-rated?type=movie|tv");
  console.log("  GET /api/v2/movies/now-playing");
  console.log("  GET /api/v2/movies/upcoming");
  console.log("  GET /api/v2/movies/on-the-air");
  console.log("  GET /api/v2/movies/airing-today");
  console.log("  GET /api/v2/movies/:genre (action|comedy|sci-fi|horror|drama|...)");
  console.log("  GET /api/v2/movies/recommended?type=&id=");
}
