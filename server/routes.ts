import { getServerStatus, getAllEndpoints, searchEndpoints, getEndpointsByCategory, getCategories, getMethodStats } from "../lib/downloaders/meta-endpoints";
import { registerSocialRoutes } from "./social-routes";
import { registerMediaRoutes } from "./media-routes";
import { getZodiacSign, getAllZodiacSigns, getZodiacByElement, getCompatibility, playRPS, guessCountry, checkCountryGuess, getWordScramble, checkScramble, startNumberGame, guessNumber } from "../lib/downloaders/zodiac-games";
import { scrapeTukoNews, scrapeNationNews } from "../lib/downloaders/kenya-news";
import { searchAcademicPapers, searchBooks, lookupWord, getBookDetails } from "../lib/downloaders/education-api";
import { scrapeKenyaJobs } from "../lib/downloaders/jobs-scraper";
import { getKenyanProverb, getDadJoke, getAffirmation, getSwahiliPhrase, getAllKenyanProverbs, getAllSwahiliPhrases } from "../lib/downloaders/fun-data";
import { youtubeSearch, youtubeTrending, youtubeRecommend, musicSearch, musicTrending, artistSearch } from "../lib/downloaders/siputzx-wrapper";
import { bibleAI, soundcloudDownload, soundcloudSearch } from "../lib/downloaders/siputzx-wrapper";
import { getGlobalNews, getKenyaNews, getCryptoPrice, getAllCryptos, getForexRates, convertForex, getWeather } from "../lib/downloaders/real-world-data";
import { phoneLookup, passwordAudit, dnsInspector, wifiScan } from "../lib/downloaders/phone-wifi-tools";
import { masterScrape } from "../lib/downloaders/master-scraper";
import { deobfuscate, deminify, runInSandbox, fetchHeadless, autoDecode } from "../lib/downloaders/dev-tools";
import { extractLinks, inspectSite, extractScripts, getCookies } from "../lib/downloaders/scraper-toolkit";
import type { Express } from "express";
import { type Server } from "http";
import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream, existsSync, readdirSync, statSync, unlinkSync } from "fs";
import path from "path";
import { searchSongs, getDownloadInfo, extractVideoId, reloadCookies, tempFiles, TEMP_DIR, resetProviderHealth, getProviderHealthStatus } from "./scraper";
const execAsync = promisify(exec);
import { registerAIRoutes } from "./ai-routes";
import { registerAIModels } from "./ai-models";
import { registerAIImages } from "./ai-images";
import { registerMovieRoutes } from "./movie-routes";
import { downloadTikTok } from "../lib/downloaders/tiktok";
import { downloadSnapchat } from "../lib/downloaders/snapchat";
import { downloadInstagram } from "../lib/downloaders/instagram";
import { downloadYouTube } from "../lib/downloaders/youtube";
import { downloadFacebook, downloadFacebookSnap } from "../lib/downloaders/facebook";
import { downloadTwitter } from "../lib/downloaders/twitter";
import { searchSpotify, downloadSpotify } from "../lib/downloaders/spotify";
import {
  spotifyGraphQL,
  fetchEmbedEntity,
  fetchOEmbed,
  mbLookupName,
  wdLookupName,
  searchAndMatchByUri,
  formatDuration,
  bestImage,
  idFromUri,
  SEARCH_HASH,
  PLAYLIST_HASH,
  cacheGet,
  cacheSet,
} from "../lib/spotify-info";
import { searchShazam, recognizeShazamFull, getTrackDetails } from "../lib/downloaders/shazam";
import { searchImages } from "../lib/search/imageSearch";
import { searchYandexImages } from "../lib/search/yandexImages";
import { searchYandexVideos } from "../lib/search/yandexVideos";
import { generateEphoto, listEphotoEffects, EPHOTO_EFFECTS } from "../lib/downloaders/ephoto360";
import { generatePhotofunia, listPhotofuniaEffects } from "../lib/downloaders/photofunia";
import { githubStalk, ipStalk, npmStalk, tiktokStalk, instagramStalk, twitterStalk, telegramStalk } from "../lib/downloaders/stalker";
import { fetchAnimeImage } from "../lib/downloaders/anime";
import { getFunContent, funTypes } from "../lib/downloaders/fun";
import { shortenUrl, shortenerServices } from "../lib/downloaders/urlshortener";
import * as tools from "../lib/downloaders/tools";
import * as security from "../lib/downloaders/security";
import * as sports from "../lib/downloaders/sports";
import { listTextproEffects, generateTextpro } from "../lib/downloaders/textpro";
import { imageToSticker, stickerToImage, videoToSticker, stickerToVideo, videoToGif, gifToVideo } from "../lib/downloaders/converter";
import { listAudioEffects, applyAudioEffect } from "../lib/downloaders/audio-effects";
import { getSettings, saveSettings, loadSettings } from "./admin-settings";
import { registerApiKeyRoutes } from "./api-keys";
import { trackIpRequest, getSecurityStats, heavyLimiter, adminLimiter, loginLimiter } from "./security";

// ─── Activity Tracking ────────────────────────────────────────────────────────

interface RequestLog {
  ts: number;
  method: string;
  path: string;
  status: number;
  ms: number;
}

const REQUEST_LOG: RequestLog[] = [];
const MAX_LOG = 300;
const HIT_COUNTS: Record<string, number> = {};
const ERROR_COUNTS = { total4xx: 0, total5xx: 0 };
let totalRequests = 0;

// ─── Daily tracking (resets at midnight) ──────────────────────────────────────
const DAILY_HIT_COUNTS: Record<string, number> = {};
let dailyTotalRequests = 0;
let dailyErrors4xx = 0;
let dailyErrors5xx = 0;
let currentDay = new Date().toDateString();

function checkDayRollover() {
  const today = new Date().toDateString();
  if (today !== currentDay) {
    currentDay = today;
    for (const k in DAILY_HIT_COUNTS) delete DAILY_HIT_COUNTS[k];
    dailyTotalRequests = 0;
    dailyErrors4xx = 0;
    dailyErrors5xx = 0;
  }
}

function recordRequest(log: RequestLog) {
  checkDayRollover();
  totalRequests++;
  dailyTotalRequests++;
  REQUEST_LOG.push(log);
  if (REQUEST_LOG.length > MAX_LOG) REQUEST_LOG.shift();
  const key = `${log.method} ${log.path.split("?")[0]}`;
  HIT_COUNTS[key] = (HIT_COUNTS[key] || 0) + 1;
  DAILY_HIT_COUNTS[key] = (DAILY_HIT_COUNTS[key] || 0) + 1;
  if (log.status >= 400 && log.status < 500) { ERROR_COUNTS.total4xx++; dailyErrors4xx++; }
  if (log.status >= 500) { ERROR_COUNTS.total5xx++; dailyErrors5xx++; }
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────

function requireAdminAuth(req: any, res: any, next: any) {
  const pwd = req.headers["x-admin-password"] as string | undefined;
  const settings = getSettings();
  if (!pwd || pwd !== settings.password) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
}

function isYouTubeUrl(input: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//i.test(input) ||
         /^[a-zA-Z0-9_-]{11}$/.test(input);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerAIRoutes(app);
  registerAIModels(app);
  registerAIImages(app);
  registerMovieRoutes(app);
  registerApiKeyRoutes(app);

  // ─── Activity tracking middleware ──────────────────────────────────────────
  loadSettings();
  app.use((req: any, res: any, next: any) => {
    if (!req.path.startsWith("/api") && !req.path.startsWith("/download")) return next();
    const start = Date.now();
    const ip = (req.ip || req.socket?.remoteAddress || "").replace(/^::ffff:/, "");
    if (ip) trackIpRequest(ip);
    res.on("finish", () => {
      recordRequest({ ts: Date.now(), method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start });
    });
    next();
  });

  // Apply admin-wide rate limiter
  app.use("/api/admin", adminLimiter);

  // ─── Public config endpoints ───────────────────────────────────────────────
  app.get("/api/config/cards", (_req, res) => {
    const s = getSettings();
    return res.json({ success: true, githubUrl: s.githubUrl, cards: s.repoCards });
  });

  // ─── Admin: Login ──────────────────────────────────────────────────────────
  app.post("/api/admin/login", loginLimiter, (req: any, res: any) => {
    const { password } = req.body || {};
    const settings = getSettings();
    if (!password || password !== settings.password) {
      return res.status(401).json({ success: false, error: "Incorrect password" });
    }
    return res.json({ success: true });
  });

  // ─── Admin: Stats ──────────────────────────────────────────────────────────
  app.get("/api/admin/stats", requireAdminAuth, (_req: any, res: any) => {
    checkDayRollover();
    const now = Date.now();
    const hour = now - 3600_000;
    const day = now - 86400_000;
    const reqLastHour = REQUEST_LOG.filter((r) => r.ts > hour).length;
    const reqLastDay = REQUEST_LOG.filter((r) => r.ts > day).length;
    const avgMs = REQUEST_LOG.length
      ? Math.round(REQUEST_LOG.slice(-50).reduce((a, r) => a + r.ms, 0) / Math.min(REQUEST_LOG.length, 50))
      : 0;
    const topEndpoints = Object.entries(HIT_COUNTS)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, hits]) => ({ endpoint, hits }));
    const topEndpointsToday = Object.entries(DAILY_HIT_COUNTS)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, hits]) => ({ endpoint, hits }));
    const topApiToday = topEndpointsToday[0] || null;
    return res.json({
      success: true,
      totalRequests,
      reqLastHour,
      reqLastDay,
      avgMs,
      errors4xx: ERROR_COUNTS.total4xx,
      errors5xx: ERROR_COUNTS.total5xx,
      topEndpoints,
      loggedCount: REQUEST_LOG.length,
      dailyTotalRequests,
      dailyErrors4xx,
      dailyErrors5xx,
      topEndpointsToday,
      topApiToday,
      currentDay,
    });
  });

  // ─── Admin: Request Log ────────────────────────────────────────────────────
  app.get("/api/admin/logs", requireAdminAuth, (req: any, res: any) => {
    const limit = Math.min(parseInt((req.query.limit as string) || "100", 10), 300);
    const logs = REQUEST_LOG.slice(-limit).reverse();
    return res.json({ success: true, count: logs.length, logs });
  });

  // ─── Admin: Get Settings ───────────────────────────────────────────────────
  app.get("/api/admin/settings", requireAdminAuth, (_req: any, res: any) => {
    const s = getSettings();
    return res.json({ success: true, settings: { githubUrl: s.githubUrl, repoCards: s.repoCards } });
  });

  // ─── Admin: Update Settings ────────────────────────────────────────────────
  app.post("/api/admin/settings", requireAdminAuth, (req: any, res: any) => {
    const { githubUrl, repoCards } = req.body || {};
    const current = getSettings();
    const updated = { ...current };
    if (githubUrl !== undefined) updated.githubUrl = String(githubUrl);
    if (Array.isArray(repoCards)) updated.repoCards = repoCards;
    saveSettings(updated);
    return res.json({ success: true, settings: { githubUrl: updated.githubUrl, repoCards: updated.repoCards } });
  });

  // ─── Admin: Change Password ────────────────────────────────────────────────
  app.post("/api/admin/change-password", requireAdminAuth, (req: any, res: any) => {
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }
    const current = getSettings();
    saveSettings({ ...current, password: String(newPassword) });
    return res.json({ success: true, message: "Password updated" });
  });

  // ─── Admin: Security Stats ──────────────────────────────────────────────────
  app.get("/api/admin/security", requireAdminAuth, (_req: any, res: any) => {
    const s = getSettings();
    const secStats = getSecurityStats();
    return res.json({
      success: true,
      ipBlocklist: s.ipBlocklist || [],
      ...secStats,
    });
  });

  // ─── Admin: Block IP ────────────────────────────────────────────────────────
  app.post("/api/admin/block-ip", requireAdminAuth, (req: any, res: any) => {
    const { ip } = req.body || {};
    const clean = String(ip || "").trim().replace(/^::ffff:/, "");
    if (!clean) return res.status(400).json({ success: false, error: "IP required" });
    const current = getSettings();
    const blocklist: string[] = current.ipBlocklist || [];
    if (blocklist.includes(clean)) return res.json({ success: true, message: "Already blocked", ipBlocklist: blocklist });
    const updated = [...blocklist, clean];
    saveSettings({ ...current, ipBlocklist: updated });
    return res.json({ success: true, message: `Blocked ${clean}`, ipBlocklist: updated });
  });

  // ─── Admin: Unblock IP ──────────────────────────────────────────────────────
  app.post("/api/admin/unblock-ip", requireAdminAuth, (req: any, res: any) => {
    const { ip } = req.body || {};
    const clean = String(ip || "").trim().replace(/^::ffff:/, "");
    if (!clean) return res.status(400).json({ success: false, error: "IP required" });
    const current = getSettings();
    const updated = (current.ipBlocklist || []).filter((x: string) => x !== clean);
    saveSettings({ ...current, ipBlocklist: updated });
    return res.json({ success: true, message: `Unblocked ${clean}`, ipBlocklist: updated });
  });

  // ─── SEARCH ─────────────────────────────────────────────────────────────────
  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      const results = await searchSongs(q.trim());
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        query: results.query,
        items: results.items,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Search failed" });
    }
  });

  function px(baseUrl: string, url: string | undefined): string | null {
    if (!url || !url.startsWith("http")) return null;
    return `${baseUrl}/proxy?url=${encodeURIComponent(url)}`;
  }

  function addMediaProxyUrls(baseUrl: string, result: any): any {
    if (!result || !result.success) return result;
    const out = { ...result };
    if (out.videoUrl) out.videoProxyUrl = px(baseUrl, out.videoUrl);
    if (out.videoUrlNoWatermark) out.videoNoWatermarkProxyUrl = px(baseUrl, out.videoUrlNoWatermark);
    if (out.audioUrl) out.audioProxyUrl = px(baseUrl, out.audioUrl);
    if (out.sdUrl) out.sdProxyUrl = px(baseUrl, out.sdUrl);
    if (out.hdUrl) out.hdProxyUrl = px(baseUrl, out.hdUrl);
    if (out.thumbnailUrl) out.thumbnailProxyUrl = px(baseUrl, out.thumbnailUrl);
    if (Array.isArray(out.mediaUrls)) out.mediaProxyUrls = out.mediaUrls.map((u: string) => px(baseUrl, u));
    if (Array.isArray(out.media)) {
      out.media = out.media.map((item: any) => ({ ...item, proxyUrl: px(baseUrl, item.url) }));
    }
    if (out.downloadUrl && out.downloadUrl.startsWith("http")) out.proxyUrl = px(baseUrl, out.downloadUrl);
    return out;
  }

  function buildUrls(baseUrl: string, result: any): { proxyUrl: string | null; fileUrl: string | null } {
    const rawUrl: string = result.downloadUrl || "";
    if (rawUrl.startsWith("local://")) {
      const filename = rawUrl.replace("local://", "");
      const fileUrl = `${baseUrl}/files/${filename}`;
      return { proxyUrl: fileUrl, fileUrl };
    }
    if (!rawUrl.startsWith("http")) return { proxyUrl: null, fileUrl: null };
    const proxyUrl = `${baseUrl}/proxy?url=${encodeURIComponent(rawUrl)}`;
    return { proxyUrl, fileUrl: null };
  }

  // ─── FILE SERVING ──────────────────────────────────────────────────────────
  app.get("/files/:filename", (req: any, res: any) => {
    const filename = req.params.filename as string;
    if (!/^[a-f0-9-]{36}\.(mp3|mp4|m4a|webm|mkv|m4v)$/.test(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const uuid = filename.replace(/\.[^.]+$/, "");
    let filePath: string | null = null;
    const entry = tempFiles.get(uuid);
    if (entry && existsSync(entry.filePath)) {
      filePath = entry.filePath;
    }
    if (!filePath) {
      try {
        const candidates = readdirSync(TEMP_DIR).filter((f) => f.startsWith(uuid));
        if (candidates.length > 0) {
          const candidate = path.join(TEMP_DIR, candidates[0]);
          if (existsSync(candidate)) {
            const { mtimeMs } = statSync(candidate);
            if (Date.now() - mtimeMs < 30 * 60 * 1000) {
              filePath = candidate;
            } else {
              try { unlinkSync(candidate); } catch {}
            }
          }
        }
      } catch {}
    }
    if (!filePath) {
      return res.status(404).json({ error: "File not found or expired" });
    }
    const extMap: Record<string, string> = {
      mp4: "video/mp4", m4v: "video/mp4", mkv: "video/x-matroska",
      webm: "video/webm", mp3: "audio/mpeg", m4a: "audio/mp4",
    };
    const ext = filename.split(".").pop() || "mp4";
    const contentType = extMap[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    const resolvedPath = filePath;
    const stream = createReadStream(resolvedPath);
    stream.pipe(res);
    stream.on("end", () => {
      try { unlinkSync(resolvedPath); } catch {}
      tempFiles.delete(uuid);
    });
    stream.on("error", () => {
      if (!res.headersSent) res.status(500).json({ error: "Stream error" });
    });
  });

  // ─── DOWNLOAD HANDLER ──────────────────────────────────────────────────────
  const downloadHandler = (format: "mp3" | "mp4") => async (req: any, res: any) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (YouTube link) or 'q'/'name' (song name) as a query parameter.",
        });
      }
      url = url.trim();
      const host = req.get("host") || "";
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;
      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({
            success: false,
            error: `No results found for "${url}". Try a different search term.`,
          });
        }
        const firstResult = searchResults.items[0];
        const videoUrl = `https://www.youtube.com/watch?v=${firstResult.id}`;
        const result = await getDownloadInfo(videoUrl, format);
        const { proxyUrl, fileUrl } = buildUrls(baseUrl, result);
        return res.json({
          ...result,
          downloadUrl: fileUrl || result.downloadUrl,
          proxyUrl,
          creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
          searchQuery: url,
          searchResult: {
            title: firstResult.title,
            channelTitle: firstResult.channelTitle,
            duration: firstResult.duration,
          },
        });
      }
      const result = await getDownloadInfo(url, format);
      const { proxyUrl, fileUrl } = buildUrls(baseUrl, result);
      return res.json({
        ...result,
        downloadUrl: fileUrl || result.downloadUrl,
        proxyUrl,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Download failed",
      });
    }
  };

  // Apply heavy rate limiter to all download endpoints
  app.use("/download", heavyLimiter);
  app.use("/api/download", heavyLimiter);

  app.get("/download/audio", downloadHandler("mp3"));
  app.get("/download/ytmp3", downloadHandler("mp3"));
  app.get("/download/dlmp3", downloadHandler("mp3"));
  app.get("/download/mp3", downloadHandler("mp3"));
  app.get("/download/yta", downloadHandler("mp3"));
  app.get("/download/yta2", downloadHandler("mp3"));
  app.get("/download/yta3", downloadHandler("mp3"));
  app.get("/download/mp4", downloadHandler("mp4"));
  app.get("/download/ytmp4", downloadHandler("mp4"));
  app.get("/download/dlmp4", downloadHandler("mp4"));
  app.get("/download/video", downloadHandler("mp4"));
  app.get("/download/hd", downloadHandler("mp4"));

  app.get("/download/ytmp5", async (req: any, res: any) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Provide 'url' (YouTube link) or 'q'/'name' (song name) as a query parameter.",
        });
      }
      url = url.trim();
      const host = req.get("host") || "";
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;
      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({
            success: false,
            error: `No results found for "${url}". Try a different search term.`,
          });
        }
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }
      const [mp3Result, mp4Result] = await Promise.allSettled([
        getDownloadInfo(url, "mp3"),
        getDownloadInfo(url, "mp4"),
      ]);
      const mp3 = mp3Result.status === "fulfilled" ? mp3Result.value : null;
      const mp4 = mp4Result.status === "fulfilled" ? mp4Result.value : null;
      const buildEntry = (result: any, format: string) => {
        if (!result || !result.success) {
          return { success: false, error: result?.error || "Download failed" };
        }
        const rawUrl: string = result.downloadUrl || "";
        let downloadUrl = rawUrl;
        let proxyUrl: string | null = null;
        if (rawUrl.startsWith("local://")) {
          const filename = rawUrl.replace("local://", "");
          downloadUrl = `${baseUrl}/files/${filename}`;
          proxyUrl = downloadUrl;
        } else if (rawUrl.startsWith("http")) {
          proxyUrl = `${baseUrl}/proxy?url=${encodeURIComponent(rawUrl)}`;
        }
        return {
          success: true,
          title: result.title,
          videoId: result.videoId,
          format,
          quality: result.quality,
          downloadUrl,
          proxyUrl,
          provider: result.provider,
          thumbnail: result.thumbnail,
          youtubeUrl: result.youtubeUrl,
        };
      };
      const title = mp3?.title || mp4?.title || "Unknown";
      const videoId = mp3?.videoId || mp4?.videoId || extractVideoId(url) || "";
      return res.json({
        success: !!(mp3?.success || mp4?.success),
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        title,
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        mp3: buildEntry(mp3, "mp3"),
        mp4: buildEntry(mp4, "mp4"),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Download failed" });
    }
  });

  app.get("/download/lyrics", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.name as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'q' is required." });
      }
      const searchTerm = q.trim();
      const lrclibRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (lrclibRes.ok) {
        const lrcData = await lrclibRes.json() as any[];
        if (lrcData && lrcData.length > 0) {
          const track = lrcData[0];
          return res.json({
            success: true,
            creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
            query: searchTerm,
            title: track.trackName || track.name,
            author: track.artistName,
            album: track.albumName,
            duration: track.duration,
            lyrics: track.plainLyrics || track.syncedLyrics || "No lyrics text available",
            syncedLyrics: track.syncedLyrics || null,
          });
        }
      }
      return res.status(404).json({
        success: false,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        error: `No lyrics found for "${searchTerm}".`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Lyrics fetch failed" });
    }
  });

  // ─── SOCIAL MEDIA DOWNLOADERS ──────────────────────────────────────────────
  app.get("/api/download/tiktok", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const result = await downloadTikTok(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "TikTok download failed" });
    }
  });

  app.get("/api/download/instagram", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const result = await downloadInstagram(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Instagram download failed" });
    }
  });

  app.get("/api/download/youtube", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Provide 'url' or 'q'/'name' as a query parameter." });
      }
      url = url.trim();
      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items || searchResults.items.length === 0) {
          return res.status(404).json({ success: false, error: `No results found for "${url}".` });
        }
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }
      const result = await downloadYouTube(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube download failed" });
    }
  });

  app.get("/api/download/facebook", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const result = await downloadFacebook(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook download failed" });
    }
  });

  app.get("/api/download/facebook/reel", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const result = await downloadFacebook(url);
      return res.json(addMediaProxyUrls(baseUrl, result));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook Reel download failed" });
    }
  });

  app.get("/api/download/facebook/snap", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadFacebookSnap(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook snap download failed" });
    }
  });

  app.get("/api/download/facebook/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadFacebook(url);
      if (!result.success) return res.json(result);
      const { sdUrl, hdUrl, ...info } = result;
      return res.json({
        ...info,
        hasHD: !!hdUrl,
        hasSD: !!sdUrl,
        qualityCount: result.links?.length ?? (hdUrl && sdUrl && hdUrl !== sdUrl ? 2 : 1),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Facebook info failed" });
    }
  });

  app.get("/api/download/youtube/mp3", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Provide 'url' or 'q' parameter." });
      }
      url = url.trim();
      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items?.length) return res.status(404).json({ success: false, error: `No results for "${url}".` });
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }
      const result = await getDownloadInfo(url, "mp3");
      return res.json({ ...result, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", format: "mp3" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube MP3 download failed" });
    }
  });

  app.get("/api/download/youtube/mp4", async (req, res) => {
    try {
      let url = (req.query.url as string) || (req.query.q as string);
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Provide 'url' or 'q' parameter." });
      }
      url = url.trim();
      if (!isYouTubeUrl(url)) {
        const searchResults = await searchSongs(url);
        if (!searchResults.items?.length) return res.status(404).json({ success: false, error: `No results for "${url}".` });
        url = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
      }
      const result = await getDownloadInfo(url, "mp4");
      return res.json({ ...result, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", format: "mp4" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube MP4 download failed" });
    }
  });

  app.get("/api/download/youtube/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const videoId = extractVideoId(url.trim());
      if (!videoId) return res.status(400).json({ success: false, error: "Invalid YouTube URL." });
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailHD: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Info fetch failed" });
    }
  });

  app.get("/api/download/youtube/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'q' is required." });
      }
      const results = await searchSongs(q.trim());
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...results });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "YouTube search failed" });
    }
  });

  app.get("/api/download/tiktok/audio", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadTikTok(url);
      if (!result.success) return res.json(result);
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        title: result.title,
        author: result.author,
        audioUrl: result.audioUrl || result.videoUrl,
        note: result.audioUrl ? "Direct audio extracted" : "Audio not separately available, use video URL",
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "TikTok audio extraction failed" });
    }
  });

  app.get("/api/download/tiktok/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadTikTok(url);
      if (!result.success) return res.json(result);
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        title: result.title,
        author: result.author,
        hasVideo: !!result.videoUrl,
        hasAudio: !!result.audioUrl,
        thumbnail: result.thumbnail || undefined,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "TikTok info fetch failed" });
    }
  });

  app.get("/api/download/snapchat", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadSnapchat(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Snapchat download failed" });
    }
  });

  app.get("/api/download/instagram/story", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadInstagram(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Instagram story download failed" });
    }
  });

  app.get("/api/download/twitter", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadTwitter(url);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Twitter download failed" });
    }
  });

  app.get("/api/download/twitter/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || url.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'url' is required." });
      }
      const result = await downloadTwitter(url);
      if (!result.success) return res.json(result);
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        title: result.title,
        author: result.author,
        mediaCount: result.media?.length || 0,
        mediaTypes: result.media?.map(m => m.type) || [],
        provider: result.provider,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || "Twitter info fetch failed" });
    }
  });

  // ─── SPOTIFY ───────────────────────────────────────────────────────────────
  app.get("/api/spotify/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.query as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'q' is required." });
      }
      const result = await searchSpotify(q.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "Spotify search failed" });
    }
  });

  app.get("/api/spotify/download", async (req, res) => {
    try {
      const input = (req.query.url as string) || (req.query.q as string) || (req.query.name as string);
      if (!input || input.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Provide 'url' or 'q'/'name'." });
      }
      const host = req.get("host") || "";
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${host}`;
      const result = await downloadSpotify(input.trim(), baseUrl);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "Spotify download failed" });
    }
  });

  function spRespond(res: any, data: any) {
    return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...data });
  }
  function spError(res: any, status: number, msg: string) {
    return res.status(status).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: msg });
  }

  app.get("/api/spotify/track/:id", async (req: any, res: any) => {
    const trackId = req.params.id as string;
    if (!trackId || trackId.length < 10) return spError(res, 400, "Invalid track ID");
    function mapTrackEmbed(entity: any) {
      const imgArr: any[] = entity.visualIdentity?.image || [];
      const thumbnail = imgArr[0]?.url || "";
      const artists = (entity.artists || []).map((a: any) => ({
        id: a.uri ? a.uri.split(":").pop() : "",
        name: a.name || "",
        url: a.uri ? `https://open.spotify.com/artist/${a.uri.split(":").pop()}` : "",
      }));
      return {
        id: entity.id || trackId,
        title: entity.name || entity.title || "",
        artist: artists.map((a: any) => a.name).join(", "),
        artists,
        thumbnail,
        duration: formatDuration(entity.duration || 0),
        duration_ms: entity.duration || 0,
        release_date: entity.releaseDate?.isoString || "",
        explicit: entity.isExplicit || false,
        preview_url: entity.audioPreview?.url || "",
        url: `https://open.spotify.com/track/${entity.id || trackId}`,
      };
    }
    try {
      const entity = await fetchEmbedEntity("track", trackId);
      if (entity && (entity.name || entity.id)) return spRespond(res, { source: "embed", track: mapTrackEmbed(entity) });
    } catch {}
    try {
      const oembed = await fetchOEmbed("track", trackId);
      if (oembed && oembed.title) {
        const parts = (oembed.title || "").split(" by ");
        return spRespond(res, {
          source: "oembed",
          track: {
            id: trackId,
            title: parts[0]?.trim() || oembed.title || "",
            artist: parts[1]?.trim() || "",
            artists: parts[1] ? [{ name: parts[1].trim() }] : [],
            thumbnail: oembed.thumbnail_url || "",
            url: `https://open.spotify.com/track/${trackId}`,
          },
        });
      }
    } catch {}
    return spError(res, 503, "Could not fetch track info.");
  });

  app.get("/api/spotify/album/:id", async (req: any, res: any) => {
    const albumId = req.params.id as string;
    if (!albumId || albumId.length < 10) return spError(res, 400, "Invalid album ID");
    const spotifyUri = `spotify:album:${albumId}`;
    function mapAlbumEmbed(entity: any) {
      const imgArr: any[] = entity.visualIdentity?.image || entity.coverArt?.sources || [];
      const tracks = (entity.trackList || []).map((t: any, i: number) => ({
        id: t.uri ? t.uri.split(":").pop() : "",
        title: t.title || t.name || "",
        artist: t.subtitle || "",
        duration: formatDuration(t.duration || 0),
        duration_ms: t.duration || 0,
        track_number: i + 1,
        url: t.uri ? `https://open.spotify.com/track/${t.uri.split(":").pop()}` : "",
      }));
      return {
        id: entity.id || idFromUri(entity.uri || "") || albumId,
        name: entity.name || entity.title || "",
        artist: entity.subtitle || "",
        thumbnail: imgArr[0]?.url || "",
        url: `https://open.spotify.com/album/${albumId}`,
        release_date: entity.releaseDate?.isoString || "",
        total_tracks: tracks.length,
        tracks,
        source: "embed",
      };
    }
    function mapAlbumSearch(a: any) {
      return {
        id: albumId,
        name: a.name || "",
        artist: (a.artists?.items || []).map((x: any) => x.profile?.name || x.name || "").join(", "),
        artists: (a.artists?.items || []).map((x: any) => ({ name: x.profile?.name || x.name || "", id: idFromUri(x.uri) })),
        thumbnail: bestImage(a.coverArt?.sources),
        release_date: a.date?.year ? String(a.date.year) : "",
        type: (a.type || "").toLowerCase(),
        url: `https://open.spotify.com/album/${albumId}`,
        tracks: [],
        source: "search",
      };
    }
    try {
      const entity = await fetchEmbedEntity("album", albumId);
      if (entity && (entity.name || entity.title)) return spRespond(res, { album: mapAlbumEmbed(entity) });
    } catch {}
    try {
      const mbEntity = await mbLookupName("album", albumId, "release");
      if (mbEntity) {
        const name: string = mbEntity.title || "";
        const artistCredit = mbEntity["artist-credit"]?.[0];
        const artistName: string = artistCredit?.artist?.name || artistCredit?.name || "";
        const searchTerm = artistName ? `${name} ${artistName}` : name;
        if (searchTerm) {
          const hit = await searchAndMatchByUri(searchTerm, spotifyUri, "album");
          if (hit?.data) return spRespond(res, { album: mapAlbumSearch(hit.data) });
        }
      }
    } catch {}
    try {
      const wdName = await wdLookupName("P1729", albumId);
      if (wdName) {
        const hit = await searchAndMatchByUri(wdName, spotifyUri, "album");
        if (hit?.data) return spRespond(res, { album: mapAlbumSearch(hit.data) });
        return spRespond(res, { album: { id: albumId, name: wdName, url: `https://open.spotify.com/album/${albumId}`, tracks: [], source: "db_lookup" } });
      }
    } catch {}
    return spError(res, 503, "Album info could not be retrieved.");
  });

  app.get("/api/spotify/artist/:id", async (req: any, res: any) => {
    const artistId = req.params.id as string;
    if (!artistId || artistId.length < 10) return spError(res, 400, "Invalid artist ID");
    const spotifyUri = `spotify:artist:${artistId}`;
    function mapArtistSearch(data: any) {
      const visuals: any[] = data?.visuals?.avatarImage?.sources || data?.visuals?.headerImage?.sources || [];
      return {
        id: idFromUri(data?.uri) || artistId,
        name: data?.profile?.name || "",
        thumbnail: bestImage(visuals),
        followers: data?.stats?.followers || 0,
        genres: data?.profile?.genres?.items?.map((g: any) => g.genre) || [],
        verified: data?.profile?.verified || false,
        url: `https://open.spotify.com/artist/${idFromUri(data?.uri) || artistId}`,
      };
    }
    async function resolveArtistName(): Promise<{ name: string; searchData: any | null } | null> {
      try {
        const mbEntity = await mbLookupName("artist", artistId, "artist");
        if (mbEntity?.name) {
          const hit = await searchAndMatchByUri(mbEntity.name, spotifyUri, "artist");
          return { name: mbEntity.name, searchData: hit?.data || null };
        }
      } catch {}
      try {
        const wdName = await wdLookupName("P1902", artistId);
        if (wdName) {
          const hit = await searchAndMatchByUri(wdName, spotifyUri, "artist");
          return { name: wdName, searchData: hit?.data || null };
        }
      } catch {}
      return null;
    }
    const resolved = await resolveArtistName();
    if (resolved?.searchData) return spRespond(res, { artist: mapArtistSearch(resolved.searchData) });
    if (resolved?.name) return spRespond(res, { artist: { id: artistId, name: resolved.name, thumbnail: "", url: `https://open.spotify.com/artist/${artistId}`, source: "db_lookup" } });
    try {
      const entity = await fetchEmbedEntity("artist", artistId);
      if (entity?.name || entity?.profile?.name) {
        const imgArr: any[] = entity.visualIdentity?.image || [];
        return spRespond(res, {
          artist: {
            id: entity.id || artistId,
            name: entity.name || entity.profile?.name || "",
            thumbnail: imgArr[0]?.url || bestImage(entity.visuals?.avatarImage?.sources),
            followers: entity.stats?.followers || 0,
            url: `https://open.spotify.com/artist/${artistId}`,
            source: "embed",
          },
        });
      }
    } catch {}
    return spError(res, 503, "Artist info could not be retrieved.");
  });

  app.get("/api/spotify/artist/:id/top-tracks", async (req: any, res: any) => {
    const artistId = req.params.id as string;
    if (!artistId || artistId.length < 10) return spError(res, 400, "Invalid artist ID");
    const spotifyUri = `spotify:artist:${artistId}`;
    async function resolveArtistNameForTracks(): Promise<string | null> {
      try {
        const mbEntity = await mbLookupName("artist", artistId, "artist");
        if (mbEntity?.name) return mbEntity.name as string;
      } catch {}
      try {
        const wdName = await wdLookupName("P1902", artistId);
        if (wdName) return wdName;
      } catch {}
      try {
        const entity = await fetchEmbedEntity("artist", artistId);
        return entity?.name || entity?.profile?.name || null;
      } catch {}
      return null;
    }
    const artistName = await resolveArtistNameForTracks();
    if (!artistName) return spError(res, 503, "Could not resolve artist name.");
    try {
      const data = await spotifyGraphQL("searchDesktop", SEARCH_HASH, {
        searchTerm: `artist:${artistName}`,
        offset: 0, limit: 10, numberOfTopResults: 5,
        includeAudiobooks: false, includeArtistHasConcertsField: false,
        includePreReleases: true, includeLocalConcertsField: false,
      });
      const tracks: any[] = (data?.data?.searchV2?.tracksV2?.items || [])
        .map((i: any) => i?.item?.data || i?.track || i)
        .filter((t: any) => t?.id || t?.uri)
        .map((t: any) => {
          const ms = t.duration?.totalMilliseconds || 0;
          const id = t.id || idFromUri(t.uri) || "";
          return {
            id, title: t.name || "",
            artist: (t.artists?.items || []).map((a: any) => a.profile?.name || a.name || "").join(", "),
            album: t.albumOfTrack?.name || "",
            url: `https://open.spotify.com/track/${id}`,
            thumbnail: bestImage(t.albumOfTrack?.coverArt?.sources),
            duration: formatDuration(ms), duration_ms: ms,
            release_date: t.albumOfTrack?.date?.year ? String(t.albumOfTrack.date.year) : "",
            explicit: t.contentRating?.label === "EXPLICIT" || false,
          };
        })
        .filter((t: any) => t.artist.toLowerCase().includes(artistName.toLowerCase()))
        .slice(0, 10);
      return spRespond(res, { artist: { id: artistId, name: artistName, url: `https://open.spotify.com/artist/${artistId}` }, top_tracks: tracks });
    } catch (err: any) {
      return spError(res, 503, err.message || "Could not fetch top tracks.");
    }
  });

  app.get("/api/spotify/playlist/:id", async (req: any, res: any) => {
    const playlistId = req.params.id as string;
    if (!playlistId || playlistId.length < 10) return spError(res, 400, "Invalid playlist ID");
    function mapPlaylistEmbed(entity: any) {
      const coverSources: any[] = entity.visualIdentity?.image || entity.coverArt?.sources || [];
      const thumbnail = coverSources[0]?.url || "";
      const tracks = (entity.trackList || []).map((t: any) => ({
        id: t.uri ? t.uri.split(":").pop() : "",
        title: t.title || t.name || "",
        artist: t.subtitle || "",
        duration: formatDuration(t.duration || 0),
        duration_ms: t.duration || 0,
        url: t.uri ? `https://open.spotify.com/track/${t.uri.split(":").pop()}` : "",
        thumbnail: t.imageUrl || "",
      }));
      return {
        id: entity.id || idFromUri(entity.uri || "") || playlistId,
        name: entity.name || entity.title || "",
        description: entity.subtitle || entity.description || "",
        owner: (entity.authors || [])[0]?.name || "",
        total_tracks: tracks.length,
        thumbnail,
        images: coverSources.map((s: any) => ({ url: s.url, width: s.width, height: s.height })),
        url: `https://open.spotify.com/playlist/${playlistId}`,
        tracks,
      };
    }
    async function enrichWithGraphQL(pl: any): Promise<any> {
      try {
        const data = await spotifyGraphQL("fetchPlaylistMetadata", PLAYLIST_HASH, {
          uri: `spotify:playlist:${playlistId}`, offset: 0, limit: 1, enableWatchFeedEntrypoint: false,
        });
        const gql = data?.data?.playlistV2;
        if (gql) {
          pl.owner = gql.ownerV2?.data?.name || gql.ownerV2?.data?.username || pl.owner;
          pl.followers = gql.followers || 0;
          pl.total_tracks = gql.content?.totalCount || pl.total_tracks;
          if (gql.name) pl.name = gql.name;
          if (gql.description) pl.description = gql.description;
        }
      } catch {}
      return pl;
    }
    try {
      const entity = await fetchEmbedEntity("playlist", playlistId);
      if (entity && (entity.name || entity.title)) {
        const playlist = await enrichWithGraphQL(mapPlaylistEmbed(entity));
        return spRespond(res, { source: "embed", playlist });
      }
    } catch {}
    return spError(res, 503, "Could not fetch playlist info.");
  });

  app.get("/api/spotify/info/search", async (req: any, res: any) => {
    const q = req.query.q as string;
    const type = ((req.query.type as string) || "track").toLowerCase().split(",")[0].trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    if (!q || !q.trim()) return spError(res, 400, "Missing query parameter: q");
    const validTypes = ["track", "album", "artist", "playlist"];
    if (!validTypes.includes(type)) return spError(res, 400, `Invalid type. Valid: ${validTypes.join(", ")}`);
    const cacheKey = `${q}|${type}|${limit}|${offset}`;
    const cached = cacheGet(cacheKey);
    if (cached) return spRespond(res, { query: q, type, cached: true, ...cached });
    try {
      const data = await spotifyGraphQL("searchDesktop", SEARCH_HASH, {
        searchTerm: q.trim(), offset, limit, numberOfTopResults: 5,
        includeAudiobooks: false, includeArtistHasConcertsField: false,
        includePreReleases: true, includeLocalConcertsField: false,
      });
      const sv2 = data?.data?.searchV2;
      if (!sv2) throw new Error("Empty response from Spotify GraphQL");
      let results: any[] = [];
      if (type === "track") {
        results = (sv2.tracksV2?.items || []).map((i: any) => i?.item?.data || i?.track || i).filter((t: any) => t?.id || t?.uri).map((t: any) => {
          const ms = t.duration?.totalMilliseconds || 0;
          const id = t.id || idFromUri(t.uri) || "";
          return {
            id, title: t.name || "",
            artist: (t.artists?.items || []).map((a: any) => a.profile?.name || a.name || "").join(", "),
            artists: (t.artists?.items || []).map((a: any) => a.profile?.name || a.name || ""),
            album: t.albumOfTrack?.name || "", url: `https://open.spotify.com/track/${id}`,
            thumbnail: bestImage(t.albumOfTrack?.coverArt?.sources),
            duration: formatDuration(ms), duration_ms: ms,
            release_date: t.albumOfTrack?.date?.year ? String(t.albumOfTrack.date.year) : "",
            explicit: t.contentRating?.label === "EXPLICIT" || false,
          };
        });
      } else if (type === "album") {
        results = (sv2.albumsV2?.items || []).map((i: any) => i?.data || i).filter((a: any) => a?.uri).map((a: any) => {
          const id = idFromUri(a.uri);
          return {
            id, name: a.name || "",
            artist: (a.artists?.items || []).map((x: any) => x.profile?.name || x.name || "").join(", "),
            artists: (a.artists?.items || []).map((x: any) => x.profile?.name || x.name || ""),
            url: `https://open.spotify.com/album/${id}`,
            thumbnail: bestImage(a.coverArt?.sources),
            release_date: a.date?.year ? String(a.date.year) : "",
            type: (a.type || "").toLowerCase(),
          };
        });
      } else if (type === "artist") {
        results = (sv2.artists?.items || []).map((i: any) => i?.data || i).filter((a: any) => a?.uri).map((a: any) => {
          const id = idFromUri(a.uri);
          return {
            id, name: a.profile?.name || a.name || "",
            url: `https://open.spotify.com/artist/${id}`,
            thumbnail: bestImage(a.visuals?.avatarImage?.sources),
            followers: a.stats?.followers || 0,
            verified: a.profile?.verified || false,
            genres: a.profile?.genres?.items?.map((g: any) => g.genre) || [],
          };
        });
      } else if (type === "playlist") {
        results = (sv2.playlists?.items || []).map((i: any) => i?.data || i).filter((p: any) => p?.uri).map((p: any) => {
          const id = idFromUri(p.uri);
          return {
            id, name: p.name || "", description: p.description || "",
            url: `https://open.spotify.com/playlist/${id}`,
            thumbnail: bestImage(p.images?.items?.[0]?.sources),
            owner: p.ownerV2?.data?.name || p.ownerV2?.data?.username || "",
          };
        });
      }
      if (results.length === 0) return spError(res, 404, "No results found.");
      const payload = { total: results.length, results };
      cacheSet(cacheKey, payload);
      return spRespond(res, { query: q, type, cached: false, ...payload });
    } catch (err: any) {
      return spError(res, 500, err.message || "Spotify search failed");
    }
  });

  // ─── SHAZAM ────────────────────────────────────────────────────────────────
  app.get("/api/shazam/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || (req.query.query as string);
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Query parameter 'q' is required." });
      }
      const result = await searchShazam(q.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "Shazam search failed" });
    }
  });

  app.get("/api/shazam/track/:id", async (req, res) => {
    try {
      const trackId = req.params.id;
      if (!trackId) return res.status(400).json({ success: false, error: "Track ID is required." });
      const result = await getTrackDetails(trackId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "Shazam track lookup failed" });
    }
  });

  app.post("/api/shazam/recognize", async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      let audioBuffer: Buffer;
      if (contentType.includes("octet-stream") || contentType.includes("audio/")) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        audioBuffer = Buffer.concat(chunks);
      } else {
        const { audio, url: audioUrl } = req.body || {};
        if (audioUrl) {
          const audioRes = await fetch(audioUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (!audioRes.ok) return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Failed to download audio." });
          audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        } else if (audio) {
          audioBuffer = Buffer.from(audio, "base64");
        } else {
          return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Provide 'audio' (base64) or 'url' in request body." });
        }
      }
      if (audioBuffer.length < 1000) return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Audio data too short." });
      const result = await recognizeShazamFull(audioBuffer);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "Shazam recognition failed" });
    }
  });

  // ─── IMAGE EFFECTS ─────────────────────────────────────────────────────────
  app.get("/api/ephoto/list", (_req, res) => {
    return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", effects: listEphotoEffects() });
  });

  app.post("/api/ephoto/generate", async (req, res) => {
    try {
      const { effect, text, ...restBody } = req.body;
      if (!effect || !text) return res.status(400).json({ success: false, error: "Parameters 'effect' and 'text' are required." });
      const texts: string[] = [text];
      for (let i = 2; i <= 10; i++) { const extra = restBody[`text${i}`]; if (extra) texts.push(extra); else break; }
      const result = await generateEphoto(effect, texts);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "Ephoto generation failed" });
    }
  });

  app.get("/api/photofunia/list", (_req, res) => {
    return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", totalEffects: listPhotofuniaEffects().length, effects: listPhotofuniaEffects() });
  });

  app.post("/api/photofunia/generate", async (req, res) => {
    try {
      const { effect, text, imageUrl, ...otherParams } = req.body;
      if (!effect) return res.status(400).json({ success: false, error: "Parameter 'effect' is required." });
      const textInputs: Record<string, string> = {};
      if (text) textInputs["text"] = text;
      for (const [key, value] of Object.entries(otherParams)) { if (typeof value === "string") textInputs[key] = value; }
      const result = await generatePhotofunia(effect, textInputs, imageUrl);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "PhotoFunia generation failed" });
    }
  });

  app.get("/api/ephoto/:effectId", async (req, res) => {
    try {
      const { effectId } = req.params;
      const text = (req.query.text as string) || "";
      if (!text) return res.status(400).json({ success: false, error: "Query parameter 'text' is required." });
      const texts: string[] = [text];
      for (let i = 2; i <= 10; i++) { const extra = req.query[`text${i}`] as string; if (extra) texts.push(extra); }
      const effect = EPHOTO_EFFECTS.find(e => e.id === effectId || e.slug === effectId);
      const expectedTextCount = effect ? effect.params.filter(p => p.type === "text").length : 1;
      while (texts.length < expectedTextCount) texts.push(texts[0]);
      const result = await generateEphoto(effectId, texts);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "Ephoto generation failed" });
    }
  });

  app.get("/api/photofunia/:effectId", async (req, res) => {
    try {
      const { effectId } = req.params;
      const text = (req.query.text as string) || "";
      const imageUrl = req.query.imageUrl as string;
      const textInputs: Record<string, string> = {};
      if (text) textInputs["text"] = text;
      for (const [key, value] of Object.entries(req.query)) { if (key !== "text" && key !== "imageUrl" && typeof value === "string") textInputs[key] = value; }
      const result = await generatePhotofunia(effectId, textInputs, imageUrl);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message || "PhotoFunia generation failed" });
    }
  });

  // ─── STALKER ───────────────────────────────────────────────────────────────
  const stalkRoutes: Record<string, Function> = { github: githubStalk, ip: ipStalk, npm: npmStalk, tiktok: tiktokStalk, instagram: instagramStalk, twitter: twitterStalk, telegram: telegramStalk };
  Object.entries(stalkRoutes).forEach(([name, fn]) => {
    app.get(`/api/stalk/${name}`, async (req, res) => {
      try {
        const param = req.query.username || req.query.ip || req.query.package || req.query.plate;
        if (!param) return res.status(400).json({ success: false, error: "Required query parameter missing." });
        const result = await fn(param);
        return res.json(result);
      } catch (error: any) {
        return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message });
      }
    });
  });

  // ─── ANIME ─────────────────────────────────────────────────────────────────
  app.get("/api/anime-debug/:type", async (req, res) => {
    try {
      const axios = require('axios');
      const t = req.params.type;
      
      // Test nekos.best
      let nekosResult = null, nekosError = null;
      try {
        const r = await axios.get('https://nekos.best/api/v2/' + t, { timeout: 10000 });
        nekosResult = { status: r.status, hasResults: !!r.data?.results, url: r.data?.results?.[0]?.url?.substring(0, 80) };
      } catch(e) { nekosError = e.message; }
      
      // Test waifu.pics
      let waifuResult = null, waifuError = null;
      try {
        const r = await axios.get('https://api.waifu.pics/sfw/' + t, { timeout: 10000 });
        waifuResult = { status: r.status, hasUrl: !!r.data?.url, url: r.data?.url?.substring(0, 80) };
      } catch(e) { waifuError = e.message; }
      
      return res.json({ 
        type: t,
        nekos: nekosResult || { error: nekosError },
        waifu: waifuResult || { error: waifuError }
      });
    } catch(e: any) {
      return res.json({ error: e.message });
    }
  });

  app.get("/api/anime/:type", async (req, res) => {
    try {
      const result = await fetchAnimeImage(req.params.type);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message });
    }
  });

  // ─── FUN ───────────────────────────────────────────────────────────────────
  app.get("/api/fun/:type", async (req, res) => {
    try {
      const result = await getFunContent(req.params.type);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result });
    } catch (error: any) {
      return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message });
    }
  });

  // ─── URL SHORTENER ─────────────────────────────────────────────────────────
  app.get("/api/short/:service", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Missing 'url' query parameter" });
      const result = await shortenUrl(req.params.service, url);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message });
    }
  });

  app.post("/api/url/imgbb", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Missing 'image' parameter" });
      let imageData = image;
      if (image.startsWith("http")) {
        const imgRes = await fetch(image, { redirect: "follow" });
        if (!imgRes.ok) throw new Error("Failed to fetch image from URL");
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        imageData = buffer.toString("base64");
      }
      const formBody = new URLSearchParams();
      formBody.append("image", imageData);
      const uploadRes = await fetch("https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5&format=json", { method: "POST", body: formBody });
      const data = await uploadRes.json() as any;
      if (data.status_code !== 200 && !data.image) throw new Error(data.error?.message || data.status_txt || "Image upload failed");
      return res.json({
        success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
        result: { url: data.image?.url || data.image?.display_url, display_url: data.image?.display_url, thumb: data.image?.thumb?.url, medium: data.image?.medium?.url, title: data.image?.title, size: data.image?.size, width: data.image?.width, height: data.image?.height },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message });
    }
  });

  app.post("/api/url/catbox", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Missing 'url' parameter" });
      const imgRes = await fetch(url, { redirect: "follow" });
      if (!imgRes.ok) throw new Error("Failed to fetch file from URL");
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get("content-type") || "application/octet-stream";
      const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : contentType.includes("webp") ? "webp" : "jpg";
      const filename = `upload.${ext}`;
      const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
      const parts: Buffer[] = [];
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`));
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`));
      parts.push(buffer);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
      const body = Buffer.concat(parts);
      const uploadRes = await fetch("https://catbox.moe/user/api.php", { method: "POST", headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` }, body });
      const result = await uploadRes.text();
      if (!result.startsWith("https://")) throw new Error("Catbox upload failed: " + result);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: { url: result.trim(), original: url, service: "Catbox.moe" } });
    } catch (error: any) {
      return res.status(500).json({ success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: error.message });
    }
  });

  // ─── TOOLS ─────────────────────────────────────────────────────────────────
  const creatorTag = "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech";
  app.get("/api/tools/qrcode", (req, res) => { const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, error: "Missing 'text' parameter" }); return res.json({ success: true, creator: creatorTag, result: tools.generateQRCode(text, parseInt(req.query.size as string) || 300) }); });
  app.get("/api/tools/bible", async (req, res) => { try { return res.json({ success: true, creator: creatorTag, result: await tools.getBibleVerse(req.query.ref as string) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/tools/dictionary", async (req, res) => { try { const word = req.query.word as string; if (!word) return res.status(400).json({ success: false, error: "Missing 'word'" }); return res.json({ success: true, creator: creatorTag, result: await tools.getDictionary(word) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/tools/wikipedia", async (req, res) => { try { const query = req.query.query as string; if (!query) return res.status(400).json({ success: false, error: "Missing 'query'" }); return res.json({ success: true, creator: creatorTag, result: await tools.getWikipedia(query) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/tools/weather", async (req, res) => { try { const city = req.query.city as string; if (!city) return res.status(400).json({ success: false, error: "Missing 'city'" }); return res.json({ success: true, creator: creatorTag, result: await tools.getWeather(city) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/tools/base64encode", (req, res) => { const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, error: "Missing 'text'" }); return res.json({ success: true, creator: creatorTag, result: tools.base64Encode(text) }); });
  app.get("/api/tools/base64decode", (req, res) => { const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, error: "Missing 'text'" }); return res.json({ success: true, creator: creatorTag, result: tools.base64Decode(text) }); });
  app.get("/api/tools/textstats", (req, res) => { const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, error: "Missing 'text'" }); return res.json({ success: true, creator: creatorTag, result: tools.textStats(text) }); });
  app.get("/api/tools/password", (req, res) => { return res.json({ success: true, creator: creatorTag, result: tools.generatePassword(parseInt(req.query.length as string) || 16) }); });
  app.get("/api/tools/lorem", (req, res) => { return res.json({ success: true, creator: creatorTag, result: tools.loremIpsum(parseInt(req.query.paragraphs as string) || 1) }); });
  app.get("/api/tools/color", (_req, res) => { return res.json({ success: true, creator: creatorTag, result: tools.generateColor() }); });
  app.get("/api/tools/timestamp", (_req, res) => { return res.json({ success: true, creator: creatorTag, result: tools.getTimestamp() }); });
  app.get("/api/tools/urlencode", (req, res) => { const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, error: "Missing 'text'" }); return res.json({ success: true, creator: creatorTag, result: tools.urlEncode(text) }); });
  app.get("/api/tools/urldecode", (req, res) => { const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, error: "Missing 'text'" }); return res.json({ success: true, creator: creatorTag, result: tools.urlDecode(text) }); });
  app.post("/api/tools/jsonformat", (req, res) => { const json = req.body.json as string; if (!json) return res.status(400).json({ success: false, error: "Missing 'json' in body" }); return res.json({ success: true, creator: creatorTag, result: tools.jsonFormat(json) }); });
  app.get("/api/tools/email-validate", (req, res) => { const email = req.query.email as string; if (!email) return res.status(400).json({ success: false, error: "Missing 'email'" }); return res.json({ success: true, creator: creatorTag, result: tools.validateEmail(email) }); });
  app.get("/api/tools/ip-validate", (req, res) => { const ip = req.query.ip as string; if (!ip) return res.status(400).json({ success: false, error: "Missing 'ip'" }); return res.json({ success: true, creator: creatorTag, result: tools.validateIP(ip) }); });
  app.get("/api/tools/hash", (req, res) => { const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, error: "Missing 'text'" }); return res.json({ success: true, creator: creatorTag, result: tools.hashText(text, (req.query.algorithm as string) || "sha256") }); });
  app.get("/api/tools/uuid", (_req, res) => { return res.json({ success: true, creator: creatorTag, result: tools.uuidGenerate() }); });
  app.get("/api/tools/password-strength", (req, res) => { const password = req.query.password as string; if (!password) return res.status(400).json({ success: false, error: "Missing 'password'" }); return res.json({ success: true, creator: creatorTag, result: tools.checkPasswordStrength(password) }); });
  app.get("/api/tools/screenshot", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, error: "Missing 'url'" }); return res.json({ success: true, creator: creatorTag, result: await tools.screenshotUrl(url) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });

  // ─── SECURITY ──────────────────────────────────────────────────────────────
  const securityRoutes: Record<string, Function> = {
    whois: security.whoisLookup, dns: security.dnsLookup, subdomain: security.subdomainScan,
    "reverse-ip": security.reverseIp, geoip: security.geoIp, portscan: security.portScan,
    headers: security.httpHeaders, ssl: security.sslCheck, tls: security.tlsInfo,
    ping: security.pingHost, latency: security.latencyCheck, traceroute: security.traceroute,
    asn: security.asnLookup, mac: security.macLookup, "security-headers": security.securityHeaders,
    waf: security.wafDetect, firewall: security.firewallCheck, robots: security.robotsCheck,
    sitemap: security.sitemapCheck, cms: security.cmsDetect, techstack: security.techStack,
    cookies: security.cookieScan, redirects: security.redirectCheck, xss: security.xssCheck,
    sqli: security.sqliCheck, csrf: security.csrfCheck, clickjack: security.clickjackCheck,
    directory: security.directoryScan, "exposed-files": security.exposedFiles, misconfig: security.misconfigCheck,
    "hash-identify": security.hashIdentify, "hash-generate": security.hashGenerate, "password-strength": security.passwordStrength,
    openports: security.openPorts, "ip-info": security.ipInfo, "url-scan": security.urlScan,
    phish: security.phishCheck, metadata: security.metadataExtract,
  };
  Object.entries(securityRoutes).forEach(([name, fn]) => {
    app.get(`/api/security/${name}`, async (req, res) => {
      try {
        const param = req.query.domain || req.query.ip || req.query.host || req.query.url || req.query.mac || req.query.hash || req.query.password || req.query.text;
        const result = await fn(param);
        return res.json({ success: true, creator: creatorTag, result });
      } catch (e: any) {
        return res.status(500).json({ success: false, creator: creatorTag, error: e.message });
      }
    });
  });

  // ─── SPORTS ────────────────────────────────────────────────────────────────
  app.get("/api/sports/live", async (req, res) => { try { return res.json({ success: true, creator: creatorTag, result: await sports.getLiveScores(req.query.sport as string) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/search/team", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); return res.json({ success: true, creator: creatorTag, result: await sports.searchTeam(q) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/search/player", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); return res.json({ success: true, creator: creatorTag, result: await sports.searchPlayer(q) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/search/league", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); return res.json({ success: true, creator: creatorTag, result: await sports.searchLeague(q) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/leagues", async (_req, res) => { try { return res.json({ success: true, creator: creatorTag, result: await sports.getAllLeagues() }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/league/details", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getLeagueDetails(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/league/seasons", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getLeagueSeasons(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/league/teams", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getTeamsByLeague(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/league/table", async (req, res) => { try { const id = req.query.id as string; const season = req.query.season as string; if (!id || !season) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id' and/or 'season'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getLeagueTable(id, season) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/team/details", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getTeamDetails(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/team/players", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getTeamPlayers(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/team/next", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getNextEvents(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/team/last", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getLastEvents(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/team/equipment", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getTeamEquipment(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/player/details", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getPlayerDetails(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/event/details", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getEventDetails(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/event/lineup", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getEventLineup(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/event/stats", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getEventStats(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/event/highlights", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getEventHighlights(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/events/day", async (req, res) => { try { const date = req.query.date as string; if (!date) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'date'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getEventsByDay(date, req.query.sport as string) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/events/round", async (req, res) => { try { const id = req.query.id as string; const round = req.query.round as string; const season = req.query.season as string; if (!id || !round || !season) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id', 'round', and/or 'season'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getEventsByRound(id, round, season) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/teams/country", async (req, res) => { try { const country = req.query.country as string; if (!country) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'country'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getTeamsByCountry(country, req.query.sport as string) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/leagues/country", async (req, res) => { try { const country = req.query.country as string; if (!country) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'country'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getLeaguesByCountry(country, req.query.sport as string) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/sports/venue", async (req, res) => { try { const id = req.query.id as string; if (!id) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'id'" }); return res.json({ success: true, creator: creatorTag, result: await sports.getVenue(id) }); } catch (e: any) { return res.status(400).json({ success: false, creator: creatorTag, error: e.message }); } });

  // ─── SEARCH ────────────────────────────────────────────────────────────────
  app.get("/api/search/wiki", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`); if (!wikiRes.ok) { const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`); const searchData = await searchRes.json() as any; const results = searchData.query?.search || []; return res.json({ success: true, creator: creatorTag, results: results.map((r: any) => ({ title: r.title, snippet: r.snippet?.replace(/<[^>]*>/g, ""), wordcount: r.wordcount, pageId: r.pageid })) }); } const data = await wikiRes.json() as any; return res.json({ success: true, creator: creatorTag, result: { title: data.title, extract: data.extract, description: data.description, thumbnail: data.thumbnail?.source, url: data.content_urls?.desktop?.page } }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/news", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const lang = (req.query.lang as string) || "en"; const newsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${lang}&max=10&apikey=free`, { headers: { "User-Agent": "Mozilla/5.0" } }); if (newsRes.ok) { const data = await newsRes.json() as any; if (data.articles) return res.json({ success: true, creator: creatorTag, total: data.totalArticles, articles: data.articles.map((a: any) => ({ title: a.title, description: a.description, url: a.url, image: a.image, source: a.source?.name, publishedAt: a.publishedAt })) }); } const wikiNewsRes = await fetch(`https://en.wikinews.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=10`); const wikiData = await wikiNewsRes.json() as any; return res.json({ success: true, creator: creatorTag, source: "WikiNews", results: (wikiData.query?.search || []).map((r: any) => ({ title: r.title, snippet: r.snippet?.replace(/<[^>]*>/g, ""), timestamp: r.timestamp })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/github", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const ghRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=10&sort=stars`, { headers: { "User-Agent": "MeganAPIs/1.0", Accept: "application/vnd.github.v3+json" } }); if (!ghRes.ok) throw new Error("GitHub API request failed"); const data = await ghRes.json() as any; return res.json({ success: true, creator: creatorTag, total: data.total_count, repos: (data.items || []).map((r: any) => ({ name: r.full_name, description: r.description, stars: r.stargazers_count, forks: r.forks_count, language: r.language, url: r.html_url, topics: r.topics?.slice(0, 5) })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/npm", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const npmRes = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=10`); if (!npmRes.ok) throw new Error("NPM API request failed"); const data = await npmRes.json() as any; return res.json({ success: true, creator: creatorTag, total: data.total, packages: (data.objects || []).map((o: any) => ({ name: o.package.name, version: o.package.version, description: o.package.description, keywords: o.package.keywords?.slice(0, 5), url: o.package.links?.npm, downloads: o.score?.detail?.popularity })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/pypi", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const pypiRes = await fetch(`https://pypi.org/pypi/${encodeURIComponent(q)}/json`); if (pypiRes.ok) { const data = await pypiRes.json() as any; return res.json({ success: true, creator: creatorTag, result: { name: data.info.name, version: data.info.version, summary: data.info.summary, author: data.info.author, license: data.info.license, url: data.info.project_url, homepage: data.info.home_page } }); } throw new Error(`Package "${q}" not found on PyPI`); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/stackoverflow", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const soRes = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(q)}&site=stackoverflow&pagesize=10&filter=withbody`); if (!soRes.ok) throw new Error("Stack Overflow API request failed"); const data = await soRes.json() as any; return res.json({ success: true, creator: creatorTag, total: data.total || 0, questions: (data.items || []).map((q: any) => ({ title: q.title, score: q.score, answers: q.answer_count, views: q.view_count, tags: q.tags, url: q.link, isAnswered: q.is_answered })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/reddit", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const sort = (req.query.sort as string) || "relevance"; const redditRes = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=${sort}&limit=10`, { headers: { "User-Agent": "MeganAPIs/1.0" } }); if (!redditRes.ok) throw new Error("Reddit API request failed"); const data = await redditRes.json() as any; return res.json({ success: true, creator: creatorTag, results: (data.data?.children || []).map((c: any) => ({ title: c.data.title, subreddit: c.data.subreddit, author: c.data.author, score: c.data.score, comments: c.data.num_comments, url: `https://reddit.com${c.data.permalink}`, selftext: c.data.selftext?.substring(0, 200) })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/urbandictionary", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const udRes = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(q)}`); if (!udRes.ok) throw new Error("Urban Dictionary API request failed"); const data = await udRes.json() as any; return res.json({ success: true, creator: creatorTag, word: q, definitions: (data.list || []).slice(0, 5).map((d: any) => ({ definition: d.definition?.replace(/[\[\]]/g, ""), example: d.example?.replace(/[\[\]]/g, ""), author: d.author, thumbsUp: d.thumbs_up, thumbsDown: d.thumbs_down })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/emoji", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const emojiRes = await fetch(`https://emoji-api.com/emojis?search=${encodeURIComponent(q)}&access_key=free`); if (emojiRes.ok) { const data = await emojiRes.json() as any; if (Array.isArray(data)) return res.json({ success: true, creator: creatorTag, results: data.slice(0, 10).map((e: any) => ({ character: e.character, unicodeName: e.unicodeName, slug: e.slug, group: e.group, subGroup: e.subGroup })) }); } const openRes = await fetch("https://raw.githubusercontent.com/muan/unicode-emoji-json/main/data-by-emoji.json"); const allEmoji = await openRes.json() as Record<string, any>; const matches = Object.entries(allEmoji).filter(([, v]) => v.name.toLowerCase().includes(q.toLowerCase()) || v.slug.toLowerCase().includes(q.toLowerCase())).slice(0, 10); return res.json({ success: true, creator: creatorTag, results: matches.map(([emoji, v]) => ({ character: emoji, name: v.name, slug: v.slug, group: v.group })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/country", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q'" }); const countryRes = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}?fields=name,capital,population,region,subregion,languages,currencies,flags,timezones`); if (!countryRes.ok) throw new Error(`No country found for "${q}"`); const data = await countryRes.json() as any[]; return res.json({ success: true, creator: creatorTag, results: data.slice(0, 5).map((c: any) => ({ name: c.name?.common, official: c.name?.official, capital: c.capital?.[0], population: c.population, region: c.region, subregion: c.subregion, languages: c.languages ? Object.values(c.languages) : [], currencies: c.currencies ? Object.values(c.currencies).map((cur: any) => cur.name) : [], flag: c.flags?.png, timezones: c.timezones })) }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/search/videos", async (req, res) => { try { const q = req.query.q as string; if (!q || q.trim().length === 0) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q' parameter." }); const page = Math.max(0, parseInt((req.query.page as string) || "0", 10) || 0); const result = await searchYandexVideos(q.trim(), page); return res.json(result); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message || "Video search failed" }); } });
  app.get("/api/search/images", async (req, res) => { try { const q = req.query.q as string; if (!q || q.trim().length === 0) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q' parameter." }); const page = Math.max(0, parseInt((req.query.page as string) || "0", 10) || 0); const result = await searchYandexImages(q.trim(), page); return res.json(result); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message || "Image search failed" }); } });
  app.get("/api/search/yandex-images", async (req, res) => { try { const q = req.query.q as string; if (!q || q.trim().length === 0) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'q' parameter." }); const page = Math.max(0, parseInt((req.query.page as string) || "0", 10) || 0); const result = await searchYandexImages(q.trim(), page); return res.json(result); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message || "Yandex image search failed" }); } });

  // ─── TEXTPRO ───────────────────────────────────────────────────────────────
  app.get("/api/textpro/list", async (_req, res) => { try { const effects = await listTextproEffects(); return res.json({ success: true, creator: creatorTag, total: effects.length, effects }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/textpro/generate", async (req, res) => { try { const effect = req.query.effect as string; const text = req.query.text as string; if (!effect) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'effect' parameter." }); if (!text) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'text' parameter." }); const imageUrl = await generateTextpro(effect, text); return res.json({ success: true, creator: creatorTag, effect, text, imageUrl }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/textpro/:effectId", async (req, res) => { try { const effectId = req.params.effectId; const text = req.query.text as string; if (!text) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'text' parameter." }); const imageUrl = await generateTextpro(effectId, text); return res.json({ success: true, creator: creatorTag, effect: effectId, text, imageUrl }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });

  // ─── CONVERTER ─────────────────────────────────────────────────────────────
  app.get("/api/converter/img-to-sticker", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'url' parameter." }); return res.json({ ...await imageToSticker(url), creator: creatorTag }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/converter/sticker-to-img", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'url' parameter." }); return res.json({ ...await stickerToImage(url), creator: creatorTag }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/converter/video-to-sticker", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'url' parameter." }); return res.json({ ...await videoToSticker(url), creator: creatorTag }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/converter/sticker-to-video", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'url' parameter." }); return res.json({ ...await stickerToVideo(url), creator: creatorTag }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/converter/video-to-gif", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'url' parameter." }); return res.json({ ...await videoToGif(url), creator: creatorTag }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/converter/gif-to-video", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'url' parameter." }); return res.json({ ...await gifToVideo(url), creator: creatorTag }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });

  // ─── AUDIO EFFECTS ─────────────────────────────────────────────────────────
  app.get("/api/audio/list", (_req, res) => { try { const effects = listAudioEffects(); return res.json({ success: true, creator: creatorTag, count: effects.length, effects }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });
  app.get("/api/audio/:effectId", async (req, res) => { try { const effectId = req.params.effectId; const url = req.query.url as string; if (!url) return res.status(400).json({ success: false, creator: creatorTag, error: "Missing 'url' parameter." }); return res.json({ ...await applyAudioEffect(effectId, url), creator: creatorTag }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: e.message }); } });

  // ─── ADMIN: Provider Management ────────────────────────────────────────────
  app.get("/api/admin/update-ytdlp", async (_req, res) => { try { const { stdout, stderr } = await execAsync("[ -f ./yt-dlp ] && ./yt-dlp --update-to stable 2>&1 || yt-dlp --update-to stable 2>&1", { timeout: 60000 }); reloadCookies(); return res.json({ success: true, creator: creatorTag, message: (stdout + stderr).trim() || "yt-dlp is already up to date" }); } catch (e: any) { return res.status(500).json({ success: false, creator: creatorTag, error: `yt-dlp update failed: ${e.message}` }); } });
  app.get("/api/admin/reload-cookies", (_req, res) => { reloadCookies(); return res.json({ success: true, creator: creatorTag, message: "Cookie cache cleared." }); });
app.get("/api/status", (req, res) => { return res.json({ success: true, result: getServerStatus() }); });
app.get("/api/endpoints", (req, res) => { return res.json({ success: true, result: getAllEndpoints() }); });
app.get("/api/endpoints/search", (req, res) => { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" }); return res.json({ success: true, result: searchEndpoints(q) }); });
app.get("/api/endpoints/categories", (req, res) => { return res.json({ success: true, result: getCategories() }); });
app.get("/api/endpoints/category/:name", (req, res) => { const result = getEndpointsByCategory(req.params.name); if (!result) return res.status(404).json({ error: "Category not found" }); return res.json({ success: true, result }); });
app.get("/api/endpoints/stats", (req, res) => { return res.json({ success: true, result: getMethodStats() }); });
  app.get("/api/admin/provider-health", (_req, res) => { return res.json({ success: true, creator: creatorTag, providers: ["ytdlp", "fabdl", "cobalt", "piped", "y2mate"], note: "Providers are tried in order. Failed providers are on 5-minute cooldown." }); });
app.get("/api/zodiac/all", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", signs: getAllZodiacSigns() }); });
app.get("/api/zodiac/:sign", (req, res) => { const result = getZodiacSign(req.params.sign); if (!result) return res.status(404).json({ error: "Sign not found" }); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); });
app.get("/api/zodiac/element/:element", (req, res) => { const signs = getZodiacByElement(req.params.element); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", element: req.params.element, signs }); });
app.get("/api/zodiac/compatibility/:s1/:s2", (req, res) => { const result = getCompatibility(req.params.s1, req.params.s2); if (!result) return res.status(404).json({ error: "Signs not found" }); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); });
app.get("/api/game/rps", (req, res) => { const move = req.query.move as string; const result = playRPS(move); if (!result) return res.status(400).json({ error: "Invalid move. Use: rock, paper, or scissors" }); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); });
app.get("/api/game/flag-guess", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: guessCountry() }); });
app.get("/api/game/flag-guess/:id/check", (req, res) => { const answer = req.query.answer as string; const result = checkCountryGuess(req.params.id, answer); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); });
app.get("/api/game/word-scramble", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getWordScramble() }); });
app.get("/api/game/number-guess", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: startNumberGame() }); });
app.post("/api/game/number-guess/:id", (req, res) => { const guess = parseInt(req.body?.guess); if (isNaN(guess)) return res.status(400).json({ error: "Missing guess in body" }); const result = guessNumber(req.params.id, guess); if (!result) return res.status(404).json({ error: "Game not found" }); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); });

app.get("/api/news/tuko", async (req, res) => { try { const result = await scrapeTukoNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/news/nation", async (req, res) => { try { const result = await scrapeNationNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/education/papers", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" }); const page = parseInt(req.query.page as string) || 1; const result = await searchAcademicPapers(q, page); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/education/books", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" }); const page = parseInt(req.query.page as string) || 1; const result = await searchBooks(q, page); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/education/dictionary", async (req, res) => { try { const word = req.query.word || req.query.q as string; if (!word) return res.status(400).json({ error: "Missing word" }); const result = await lookupWord(word); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/education/book-details", async (req, res) => { try { const key = req.query.key as string; if (!key) return res.status(400).json({ error: "Missing key (e.g. /works/OL8112804W)" }); const result = await getBookDetails(key); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
  // ─── MEDIA STATUS ──────────────────────────────────────────────────────────
// DISABLED: app.get("/api/news/kenyans", async (req, res) => { try { const result = await scrapeKenyansNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/news/tuko", async (req, res) => { try { const result = await scrapeTukoNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
// DISABLED: app.get("/api/news/standard", async (req, res) => { try { const result = await scrapeStandardNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/news/nation", async (req, res) => { try { const result = await scrapeNationNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
// DISABLED: app.get("/api/classifieds/jiji", async (req, res) => { try { const result = await scrapeJijiClassifieds(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
// DISABLED: app.get("/api/classifieds/pigiame", async (req, res) => { try { const result = await scrapePigiameClassifieds(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
  let statusCache: { data: any; expiresAt: number } | null = null;
app.get("/api/jobs/kenya", async (req, res) => { try { const page = parseInt(req.query.page as string) || 1; const result = await scrapeKenyaJobs(page); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/fun-data/kenyan-proverb", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getKenyanProverb() }); });
app.get("/api/fun-data/dad-joke", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getDadJoke() }); });
app.get("/api/fun-data/affirmation", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getAffirmation() }); });
app.get("/api/fun-data/swahili-phrase", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getSwahiliPhrase() }); });
app.get("/api/fun-data/kenyan-proverbs", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", count: getAllKenyanProverbs().length, results: getAllKenyanProverbs() }); });
app.get("/api/fun-data/swahili-phrases", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", count: getAllSwahiliPhrases().length, results: getAllSwahiliPhrases() }); });
  async function probeUrl(url: string, opts: RequestInit = {}, timeoutMs = 6000): Promise<boolean> { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs); try { const res = await fetch(url, { ...opts, signal: controller.signal }); return res.status < 500; } catch { return false; } finally { clearTimeout(timer); } }
app.get("/api/fun-data/kenyan-proverb", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getKenyanProverb() }); });
app.get("/api/fun-data/dad-joke", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getDadJoke() }); });
app.get("/api/fun/tech-joke", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getTechJoke() }); });
app.get("/api/fun-data/affirmation", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getAffirmation() }); });
app.get("/api/fun-data/swahili-phrase", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getSwahiliPhrase() }); });
app.get("/api/fun/never-have-i-ever", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getNeverHaveIEver() }); });
app.get("/api/fun/fortune-cookie", (req, res) => { return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: getFortuneCookie() }); });
app.get("/api/fun-data/kenyan-proverbs", (req, res) => { const limit = parseInt(req.query.limit as string) || 10; return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", count: Math.min(limit, KENYAN_PROVERBS.length), results: getAllKenyanProverbs().slice(0, limit) }); });
app.get("/api/fun-data/swahili-phrases", (req, res) => { const limit = parseInt(req.query.limit as string) || 10; return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", count: Math.min(limit, getAllSwahiliPhrases().length), results: getAllSwahiliPhrases().slice(0, limit) }); });
  app.get("/api/media/status", async (_req, res) => { if (statusCache && Date.now() < statusCache.expiresAt) return res.json(statusCache.data); const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"; const [ytdlp, fabdl, cobalt, piped, y2mate, invidious, ytdown, tiktok, igraphql, spotify, shazam] = await Promise.all([ (async () => { try { await execAsync("[ -f ./yt-dlp ] && ./yt-dlp --version || yt-dlp --version", { timeout: 4000 }); return true; } catch { return false; } })(), probeUrl("https://api.fabdl.com/youtube/get?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&type=mp3", { headers: { "User-Agent": UA } }), probeUrl("https://instances.cobalt.best/api/instances.json", { headers: { "User-Agent": UA } }), probeUrl("https://piped-instances.kavin.rocks/", { headers: { "User-Agent": UA } }), probeUrl("https://v1.y2mate.nu/", { headers: { "User-Agent": UA } }), probeUrl("https://invidious.privacyredirect.com/api/v1/stats", { headers: { "User-Agent": UA } }), probeUrl("https://app.ytdown.to/en23/", { headers: { "User-Agent": UA } }), probeUrl("https://ssstik.io/", { headers: { "User-Agent": UA } }), probeUrl("https://www.instagram.com/", { headers: { "User-Agent": UA } }), probeUrl("https://spotdown.org/", { headers: { "User-Agent": UA } }), probeUrl("https://www.shazam.com/", { headers: { "User-Agent": UA } }), ]); const data = { success: true, creator: creatorTag, checkedAt: new Date().toISOString(), categories: { music: { providers: { ytdlp: { active: ytdlp, label: "yt-dlp" }, invidious: { active: invidious, label: "Invidious" }, ytdown: { active: ytdown, label: "YTDown" }, fabdl: { active: fabdl, label: "FabDL" }, cobalt: { active: cobalt, label: "Cobalt" }, piped: { active: piped, label: "Piped" }, y2mate: { active: y2mate, label: "Y2Mate" } } }, "social-media": { providers: { tiktok: { active: tiktok, label: "TikTok (ssstik)" }, instagram: { active: igraphql, label: "Instagram" }, cobalt: { active: cobalt, label: "Cobalt" }, ytdlp: { active: ytdlp, label: "yt-dlp" } } }, spotify: { providers: { spotdown: { active: spotify, label: "Spotdown" } } }, shazam: { providers: { shazam: { active: shazam, label: "Shazam" } } } } }; statusCache = { data, expiresAt: Date.now() + 2 * 60 * 1000 }; return res.json(data); });
app.get("/api/search/youtube", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" }); const result = await youtubeSearch(q); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/youtube/trending", async (req, res) => { try { const result = await youtubeTrending(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/youtube/recommend", async (req, res) => { try { const vid = req.query.id || req.query.v as string; if (!vid) return res.status(400).json({ error: "Missing video id" }); const result = await youtubeRecommend(vid); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/music/search", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q" }); const result = await musicSearch(q); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/music/trending", async (req, res) => { try { const result = await musicTrending(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/music/artist", async (req, res) => { try { const q = req.query.q as string; if (!q) return res.status(400).json({ error: "Missing q (artist name)" }); const result = await artistSearch(q); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });

app.get("/api/bible/ai", async (req, res) => { try { const question = req.query.q || req.query.question as string; if (!question) return res.status(400).json({ error: "Missing question (?q=...)" }); const translation = (req.query.translation as string) || "ESV"; const result = await bibleAI(question, translation); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/soundcloud/download", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" }); const result = await soundcloudDownload(url); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/soundcloud/search", async (req, res) => { try { const query = req.query.q as string; if (!query) return res.status(400).json({ error: "Missing query (?q=...)" }); const limit = parseInt(req.query.limit as string) || 10; const result = await soundcloudSearch(query, limit); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
  // ─── PROXY & STREAM ────────────────────────────────────────────────────────
app.get("/api/news/global", async (req, res) => { try { const result = await getGlobalNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/news/kenya", async (req, res) => { try { const result = await getKenyaNews(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/crypto/price", async (req, res) => { try { const coin = (req.query.coin as string) || "bitcoin"; const result = await getCryptoPrice(coin); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/crypto/all", async (req, res) => { try { const result = await getAllCryptos(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", ...result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/forex/rates", async (req, res) => { try { const result = await getForexRates(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/forex/convert", async (req, res) => { try { const amount = parseFloat(req.query.amount as string) || 1; const from = (req.query.from as string) || "USD"; const to = (req.query.to as string) || "KES"; const result = await convertForex(amount, from, to); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
  app.get("/stream", async (req, res) => { const q = (req.query.q || req.query.url) as string; const type = ((req.query.type as string) || "mp3").toLowerCase() === "mp4" ? "mp4" : "mp3"; if (!q) return res.status(400).json({ error: "Missing q or url param" }); try { let videoUrl = q; if (!isYouTubeUrl(q)) { const searchResults = await searchSongs(q.trim()); if (!searchResults.items || searchResults.items.length === 0) return res.status(404).json({ error: `No results found for "${q}"` }); videoUrl = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`; } const info = await getDownloadInfo(videoUrl, type as "mp3" | "mp4"); if (!info || !info.success || !info.downloadUrl) return res.status(500).json({ error: (info as any)?.error || "Failed to get download URL" }); const { downloadUrl, title } = info as { downloadUrl: string; title: string }; const safeName = (title || "download").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "download"; const fileRes = await fetch(downloadUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "*/*", "Referer": "https://www.youtube.com/" }, redirect: "follow" }); if (!fileRes.ok) return res.status(fileRes.status).json({ error: `CDN returned ${fileRes.status}` }); const contentType = fileRes.headers.get("content-type") || (type === "mp4" ? "video/mp4" : "audio/mpeg"); res.setHeader("Content-Type", contentType); res.setHeader("Content-Disposition", `attachment; filename="${safeName}.${type}"`); res.setHeader("Cache-Control", "no-cache"); if (!fileRes.body) return res.status(502).json({ error: "No response body from CDN" }); const { Readable } = await import("stream"); const nodeStream = Readable.fromWeb(fileRes.body as import("stream/web").ReadableStream); nodeStream.pipe(res); nodeStream.on("error", (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); }); } catch (err: any) { if (!res.headersSent) res.status(500).json({ error: err.message }); } });
app.get("/api/tools/phone-lookup", (req, res) => { try { const phone = req.query.phone as string; if (!phone) return res.status(400).json({ error: "Missing phone" }); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: phoneLookup(phone) }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/tools/password-audit", (req, res) => { try { const password = req.query.password as string; if (!password) return res.status(400).json({ error: "Missing password" }); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result: passwordAudit(password) }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/tools/dns-inspector", async (req, res) => { try { const domain = req.query.domain as string; if (!domain) return res.status(400).json({ error: "Missing domain" }); const result = await dnsInspector(domain); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/tools/wifi-scan", (req, res) => { try { const result = wifiScan(); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });

app.post("/api/scrape/full", async (req, res) => { try { const { url, options } = req.body || {}; if (!url) return res.status(400).json({ error: "Missing url in body" }); const result = await masterScrape(url, options || {}); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
  app.get("/proxy", async (req, res) => { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url param" }); let origin = "https://www.youtube.com"; try { origin = new URL(url).origin; } catch {} const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"; const upstreamHeaders: Record<string, string> = { "User-Agent": UA, "Accept": "*/*", "Accept-Language": "en-US,en;q=0.9", "Accept-Encoding": "identity", "Referer": origin + "/", "Origin": origin, "Sec-Fetch-Dest": "video", "Sec-Fetch-Mode": "no-cors", "Sec-Fetch-Site": "cross-site", "DNT": "1", "Connection": "keep-alive" }; const rangeHeader = req.headers.range; if (rangeHeader) upstreamHeaders["Range"] = rangeHeader; try { const response = await fetch(url, { headers: upstreamHeaders, redirect: "follow" }); if (response.status === 403 || response.status === 401) return res.status(response.status).json({ error: `Upstream blocked (${response.status})` }); if (!response.ok && response.status !== 206) return res.status(response.status).json({ error: `Upstream returned ${response.status}` }); const contentType = response.headers.get("content-type") || "application/octet-stream"; res.setHeader("Content-Type", contentType); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Accept-Ranges", "bytes"); res.status(response.status); if (!response.body) return res.status(502).json({ error: "No response body" }); const { Readable } = await import("stream"); const nodeStream = Readable.fromWeb(response.body as import("stream/web").ReadableStream); nodeStream.pipe(res); nodeStream.on("error", (err: any) => { if (!res.headersSent) res.status(500).json({ error: err.message }); }); } catch (err: any) { if (!res.headersSent) res.status(500).json({ error: err.message }); } });
app.post("/api/tools/deobfuscate", async (req, res) => { try { const { code } = req.body || {}; if (!code) return res.status(400).json({ error: "Missing code in body" }); const result = deobfuscate(code); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.post("/api/tools/deminify", async (req, res) => { try { const { code, language } = req.body || {}; if (!code) return res.status(400).json({ error: "Missing code in body" }); const result = deminify(code, language || "js"); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.post("/api/tools/run-js", async (req, res) => { try { const { code, data } = req.body || {}; if (!code) return res.status(400).json({ error: "Missing code in body" }); const result = runInSandbox(code, data); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/tools/headless", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" }); const cookies = req.query.cookies as string; const result = await fetchHeadless(url, { cookies, followRedirects: true }); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.post("/api/tools/decode", async (req, res) => { try { const { text } = req.body || {}; if (!text) return res.status(400).json({ error: "Missing text in body" }); const result = autoDecode(text); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });

app.get("/api/scrape/links", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" }); const result = await extractLinks(url); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/scrape/inspect", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" }); const result = await inspectSite(url); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/scrape/scripts", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" }); const result = await extractScripts(url); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
app.get("/api/scrape/cookies", async (req, res) => { try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" }); const result = await getCookies(url); return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", result }); } catch (e: any) { return res.status(500).json({ error: e.message }); } });
  registerSocialRoutes(app);
  registerMediaRoutes(app);
  return httpServer;
}
