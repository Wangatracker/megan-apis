import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import youtubedl from 'youtube-dl-exec';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const TEMP_DIR = "/tmp/wolfapi_dl";
try { mkdirSync(TEMP_DIR, { recursive: true }); } catch {}

export const tempFiles = new Map<string, { filePath: string; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [uuid, entry] of tempFiles.entries()) {
    if (now > entry.expiresAt) {
      try { require("fs").unlinkSync(entry.filePath); } catch {}
      tempFiles.delete(uuid);
    }
  }
}, 5 * 60 * 1000);

const execAsync = promisify(exec);

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MOBILE_UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-CH-UA": '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"Windows"',
  "DNT": "1",
};

// ═══════════════════════════════════════════════════════════════════════════════
// COOKIES
// ═══════════════════════════════════════════════════════════════════════════════

let _cookiesArg: string | null = null;
function ytdlpCookies(): string {
  if (_cookiesArg === null) {
    const envPath = process.env.YTDLP_COOKIES;
    _cookiesArg = (envPath && existsSync(envPath)) ? `--cookies '${envPath}'` : "";
  }
  return _cookiesArg;
}
export function reloadCookies(): void { _cookiesArg = null; }

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function safeJsonParse(res: Response, label: string): Promise<any> {
  const text = await res.text();
  if (!text?.trim()) throw new Error(`${label}: empty response (${res.status})`);
  try { return JSON.parse(text); } catch { throw new Error(`${label}: invalid JSON (${res.status})`); }
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

async function fetchRealTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { "User-Agent": USER_AGENT } }, 8000
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data?.title || null;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER HEALTH TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

const providerHealth = new Map<string, { failures: number; lastFailure: number; cooldownUntil: number }>();
const HEALTH_CONFIG = { maxFailures: 3, cooldownMs: 5 * 60 * 1000, resetAfterMs: 15 * 60 * 1000 };

function isProviderHealthy(name: string): boolean {
  const h = providerHealth.get(name);
  if (!h) return true;
  if (Date.now() > h.cooldownUntil) {
    if (Date.now() - h.lastFailure > HEALTH_CONFIG.resetAfterMs) providerHealth.delete(name);
    return true;
  }
  return false;
}
function recordProviderFailure(name: string): void {
  const h = providerHealth.get(name) || { failures: 0, lastFailure: 0, cooldownUntil: 0 };
  h.failures++; h.lastFailure = Date.now();
  if (h.failures >= HEALTH_CONFIG.maxFailures) {
    h.cooldownUntil = Date.now() + HEALTH_CONFIG.cooldownMs;
    console.log(`[health] ${name} on cooldown`);
  }
  providerHealth.set(name, h);
}
function recordProviderSuccess(name: string): void { providerHealth.delete(name); }

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════

type ConvertFn = (videoId: string, format: "mp3" | "mp4") => Promise<{ downloadUrl: string; title: string }>;

async function ytdlpDirectUrl(videoId: string, format: "mp3" | "mp4"): Promise<{ downloadUrl: string; title: string }> {
  try {
    const formatArg = format === "mp3" ? "bestaudio/best" : "best[height<=720]/best";
    const result = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
      noWarnings: true, forceIpv4: true,
      extractorArgs: "youtube:player_client=android,android_music,android_vr,tv_embedded,ios",
      socketTimeout: 30, print: "title", format: formatArg, getUrl: true,
    });
    const lines = result.trim().split("\n").filter(Boolean);
    if (lines.length < 2) throw new Error("no URL returned");
    const title = lines[0];
    const downloadUrl = lines[lines.length - 1];
    if (!downloadUrl?.startsWith("http")) throw new Error("invalid URL");
    if (downloadUrl.includes(".m3u8") || downloadUrl.includes("manifest")) throw new Error("HLS not supported");
    return { downloadUrl, title };
  } catch (e: any) {
    throw new Error(`ytdlpDirect: ${(e.stderr || e.message || "unknown").substring(0, 200)}`);
  }
}

async function flvtoConvert(videoId: string, format: "mp3" | "mp4"): Promise<{ downloadUrl: string; title: string }> {
  const res = await fetchWithTimeout("https://es.flvto.top/converter", {
    method: "POST",
    headers: {
      "Referer": "https://ytshortsdown.com/", "Origin": "https://ytshortsdown.com",
      "Content-Type": "application/json", "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ id: videoId, fileType: format }),
  }, 20000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await safeJsonParse(res, "flvto");
  if (format === "mp3" && data.link) return { downloadUrl: data.link, title: data.title || `video_${videoId}` };
  if (format === "mp4" && data.formats?.[0]?.url) return { downloadUrl: data.formats[0].url, title: data.title || `video_${videoId}` };
  throw new Error("no URL");
}

async function fabdlConvert(videoId: string, format: "mp3" | "mp4"): Promise<{ downloadUrl: string; title: string }> {
  const type = format === "mp3" ? "mp3" : "mp4";
  const res = await fetchWithTimeout(
    `https://api.fabdl.com/youtube/get?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&type=${type}`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json", Referer: "https://fabdl.com/" } }, 45000
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await safeJsonParse(res, "fabdl");
  const result = data?.result ?? data;
  const title = result?.title || `video_${videoId}`;
  if (format === "mp3") {
    const audios = (result?.audios || []).filter((a: any) => a?.url);
    audios.sort((a: any, b: any) => parseFloat(b.quality || "0") - parseFloat(a.quality || "0"));
    if (audios[0]?.url) return { downloadUrl: audios[0].url, title };
  } else {
    const videos = (result?.videos || []).filter((v: any) => v?.url);
    videos.sort((a: any, b: any) => parseInt(a.quality || "0") - parseInt(b.quality || "0"));
    if (videos[0]?.url) return { downloadUrl: videos[0].url, title };
  }
  throw new Error("no URL");
}

async function invidiousConvert(videoId: string, format: "mp3" | "mp4"): Promise<{ downloadUrl: string; title: string }> {
  const instances = [
    "https://invidious.privacyredirect.com", "https://inv.tux.pizza", "https://yt.cdaut.de",
    "https://invidious.fdn.fr", "https://yewtu.be",
  ];
  for (const inst of instances) {
    try {
      const r = await fetchWithTimeout(`${inst}/api/v1/videos/${videoId}?fields=title,formatStreams,adaptiveFormats`, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT }
      }, 14000);
      if (!r.ok) continue;
      const data = await r.json() as any;
      const title = data.title || `video_${videoId}`;
      const streams = format === "mp4" ? (data.formatStreams || []) : (data.adaptiveFormats || []).filter((s: any) => s.type?.includes("audio/"));
      const best = streams.sort((a: any, b: any) => (parseInt(b.qualityLabel || b.bitrate || "0")) - (parseInt(a.qualityLabel || a.bitrate || "0")))[0];
      if (best?.itag) return { downloadUrl: `${inst}/latest_version?id=${videoId}&itag=${best.itag}&local=true`, title };
    } catch {}
  }
  throw new Error("all instances failed");
}

async function cobaltConvert(videoId: string, format: "mp3" | "mp4"): Promise<{ downloadUrl: string; title: string }> {
  const instances = ["https://cobalt-api.meowing.de", "https://co.eepy.today"];
  for (const instance of instances) {
    try {
      const body: any = { url: `https://www.youtube.com/watch?v=${videoId}` };
      if (format === "mp3") { body.downloadMode = "audio"; body.audioFormat = "mp3"; }
      else { body.downloadMode = "auto"; body.videoQuality = "720"; }
      const res = await fetchWithTimeout(instance, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": USER_AGENT },
        body: JSON.stringify(body)
      }, 15000);
      if (![200, 201, 202].includes(res.status)) continue;
      const data = await safeJsonParse(res, "cobalt");
      if (data.url) return { downloadUrl: data.url, title: data.filename || `video_${videoId}` };
    } catch {}
  }
  throw new Error("all instances failed");
}

async function pipedConvert(videoId: string, format: "mp3" | "mp4"): Promise<{ downloadUrl: string; title: string }> {
  const instances = ["https://pipedapi.kavin.rocks", "https://api.piped.yt"];
  for (const inst of instances) {
    try {
      const res = await fetchWithTimeout(`${inst}/streams/${videoId}`, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" }
      }, 12000);
      if (!res.ok) continue;
      const data = await safeJsonParse(res, "piped");
      const title = data.title || `video_${videoId}`;
      const streams = format === "mp3" ? (data.audioStreams || []) : (data.videoStreams || []).filter((s: any) => parseInt(s.resolution) <= 720);
      const best = streams.sort((a: any, b: any) => (parseInt(b.resolution || b.bitrate || "0")) - (parseInt(a.resolution || a.bitrate || "0")))[0];
      if (best?.url) return { downloadUrl: best.url, title };
    } catch {}
  }
  throw new Error("all instances failed");
}

async function ytdlpFileConvert(videoId: string, format: "mp3" | "mp4"): Promise<{ downloadUrl: string; title: string }> {
  const uuid = randomUUID();
  const outTemplate = path.join(TEMP_DIR, `${uuid}.%(ext)s`);
  const formatArg = format === "mp3" ? "bestaudio[ext=m4a]/bestaudio/best" : "best[height<=720]/best";
  const cmd = `${existsSync("./yt-dlp") ? "./yt-dlp" : "yt-dlp"} ${ytdlpCookies()} --no-warnings --force-ipv4 --socket-timeout 30 -f "${formatArg}" --print title -o "${outTemplate}" "https://www.youtube.com/watch?v=${videoId}" 2>/dev/null`;
  let stdout: string;
  try { ({ stdout } = await execAsync(cmd, { timeout: 120000 })); }
  catch (e: any) { throw new Error(`ytdlpFile: ${(e.stderr || e.message || "unknown").substring(0, 200)}`); }
  const lines = stdout.trim().split("\n").filter(Boolean);
  const title = lines[0] || `video_${videoId}`;
  const candidates = readdirSync(TEMP_DIR).filter(f => f.startsWith(uuid));
  if (candidates.length === 0) throw new Error("output not found");
  const filename = candidates[0];
  const actualExt = filename.split(".").pop() || (format === "mp3" ? "m4a" : "mp4");
  tempFiles.set(uuid, { filePath: path.join(TEMP_DIR, filename), expiresAt: Date.now() + 30 * 60 * 1000 });
  return { downloadUrl: `local://${uuid}.${actualExt}`, title };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER CHAIN
// ═══════════════════════════════════════════════════════════════════════════════

const mp3Providers: ConvertFn[] = [flvtoConvert, ytdlpDirectUrl, fabdlConvert, invidiousConvert, cobaltConvert, pipedConvert, ytdlpFileConvert];
const mp4Providers: ConvertFn[] = [flvtoConvert, ytdlpDirectUrl, fabdlConvert, invidiousConvert, cobaltConvert, pipedConvert, ytdlpFileConvert];

export async function getDownloadInfo(url: string, format: "mp3" | "mp4" = "mp3") {
  const videoId = extractVideoId(url);
  if (!videoId) return { success: false, error: "Invalid YouTube URL" };

  const errors: string[] = [];
  const providers = format === "mp4" ? mp4Providers : mp3Providers;
  const titlePromise = fetchRealTitle(videoId);

  for (const fn of providers) {
    const name = fn.name || "anonymous";
    try {
      console.log(`[scraper] Trying ${name} for ${videoId} (${format})`);
      const result = await fn(videoId, format);
      const isLocal = result.downloadUrl?.startsWith("local://");
      if (!isLocal && !result.downloadUrl?.startsWith("http")) throw new Error("invalid URL");
      recordProviderSuccess(name);
      let title = result.title;
      if (!title || title === "Unknown" || /^video_[a-zA-Z0-9_-]{11}$/.test(title)) {
        title = (await titlePromise) || title || "Unknown";
      }
      return {
        success: true, title, videoId, format,
        quality: format === "mp3" ? "320kbps" : "720p",
        downloadUrl: result.downloadUrl, isLocalFile: isLocal,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        thumbnailMq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        provider: name,
        ...(errors.length > 0 ? { _skippedProviders: errors } : {}),
      };
    } catch (e: any) {
      console.log(`[scraper] ${name} failed: ${e.message}`);
      recordProviderFailure(name);
      errors.push(`${name}: ${e.message}`);
    }
  }
  return { success: false, error: `All download providers failed. ${errors.join(" | ")}`, videoId };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

function formatSearchItem(data: any) {
  const dur = data.duration || 0;
  const views = data.view_count || 0;
  const id = data.id || data.videoId;
  if (!id || id.length !== 11) return null;
  return {
    title: data.title || "Unknown",
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
    thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    thumbnailHD: data.thumbnails?.[1]?.url || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    duration: dur > 0 ? `${Math.floor(dur/60)}:${String(dur%60).padStart(2,"0")}` : "",
    durationSeconds: dur,
    views,
    viewsFormatted: views > 0 ? Number(views).toLocaleString() : "",
    channelTitle: data.channel || data.uploader || "Unknown",
    uploadDate: data.upload_date || null,
    source: "yt",
  };
}

async function ytdlpSearch(query: string, limit = 50): Promise<any[]> {
  const sanitized = query.replace(/[^a-zA-Z0-9\s\-_.,'&!?()]/g, "").substring(0, 200);
  const ytdlpBin = existsSync("./yt-dlp") ? "./yt-dlp" : "yt-dlp";
  const cmd = `${ytdlpBin} --no-warnings --flat-playlist --dump-json --force-ipv4 --socket-timeout 30 "ytsearch${limit}:${sanitized}" 2>/dev/null`;
  let stdout: string;
  try { ({ stdout } = await execAsync(cmd, { timeout: 30000, maxBuffer: 20 * 1024 * 1024 })); }
  catch (e: any) { throw new Error(`yt-dlp search failed: ${(e.stderr || e.message || "unknown").substring(0, 200)}`); }
  
  const items: any[] = [];
  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    try {
      const data = JSON.parse(line);
      const item = formatSearchItem(data);
      if (item) items.push(item);
    } catch {}
  }
  return items;
}

async function youtubeHtmlSearch(query: string): Promise<any[]> {
  const res = await fetchWithTimeout(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9" } },
    15000
  );
  if (!res.ok) throw new Error(`HTML search HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/var ytInitialData = ({[\s\S]+?});/);
  if (!match) throw new Error("could not parse ytInitialData");
  const data = JSON.parse(match[1]);
  
  const items: any[] = [];
  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  
  for (const section of contents) {
    for (const renderer of section?.itemSectionRenderer?.contents || []) {
      const video = renderer?.videoRenderer;
      if (!video?.videoId) continue;
      const id = video.videoId;
      const viewsRaw = video.viewCountText?.simpleText || "0";
      const viewsNum = parseInt(viewsRaw.replace(/[^0-9]/g, "")) || 0;
      items.push({
        title: video.title?.runs?.[0]?.text || "Unknown",
        id,
        url: `https://www.youtube.com/watch?v=${id}`,
        youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
        thumbnail: video.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        thumbnailHD: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        duration: video.lengthText?.simpleText || "",
        durationSeconds: 0,
        views: viewsNum,
        viewsFormatted: viewsRaw,
        channelTitle: video.ownerText?.runs?.[0]?.text || "Unknown",
        uploadDate: null,
        source: "yt",
      });
    }
  }
  return items;
}

export async function searchSongs(query: string) {
  const errors: string[] = [];
  
  // Try 1: yt-dlp (best results, works locally)
  try {
    const items = await ytdlpSearch(query, 50);
    if (items.length > 0) return { query, items };
    errors.push("yt-dlp: 0 results");
  } catch (e: any) {
    errors.push(`yt-dlp: ${e.message}`);
    console.log(`[search] yt-dlp failed: ${e.message}`);
  }

  // Try 2: YouTube HTML scraping (works on any IP)
  try {
    const items = await youtubeHtmlSearch(query);
    if (items.length > 0) return { query, items };
    errors.push("html: 0 results");
  } catch (e: any) {
    errors.push(`html: ${e.message}`);
    console.log(`[search] HTML failed: ${e.message}`);
  }

  return { query, items: [] };
}
