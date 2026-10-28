import { extractVideoId } from "./lib/scraper";
// We will re-implement the wrappers exactly as they exist in scraper.ts to ensure isolation
import youtubedl from 'youtube-dl-exec';
import { scrapeYtmp3 } from "./lib/downloaders/ytmp3-scraper";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const TEMP_DIR = "/tmp/wolfapi_dl";
try { mkdirSync(TEMP_DIR, { recursive: true }); } catch {}

// A mock timeout fetch to prevent hanging forever
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// INDIVIDUAL PROVIDER IMPLEMENTATIONS (Copied from your scraper.ts)
// ============================================================================

const ytmp3Convert = async (videoId: string, format: "mp3" | "mp4") => {
  const result = await scrapeYtmp3(`https://www.youtube.com/watch?v=${videoId}`, format);
  if (result.status !== "success" || !result.downloadUrl) throw new Error(result.message || "no download URL");
  return { downloadUrl: result.downloadUrl, title: result.title };
};

const ytdlpDirectUrl = async (videoId: string, format: "mp3" | "mp4") => {
  const formatArg = format === "mp3" ? "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best" : "best[height<=720][ext=mp4]/best[height<=720]/best";
  const result = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
    noWarnings: true, forceIpv4: true,
    extractorArgs: "youtube:player_client=android,android_music,android_vr,tv_embedded,ios",
    socketTimeout: 30, print: "title", format: formatArg, getUrl: true,
  });
  const lines = result.trim().split("\n").filter(Boolean);
  return { downloadUrl: lines[lines.length - 1], title: lines[0] };
};

const flvtoConvert = async (videoId: string, format: "mp3" | "mp4") => {
  const res = await fetchWithTimeout("https://es.flvto.top/converter", {
    method: "POST",
    headers: {
      "Referer": "https://ytshortsdown.com/", "Origin": "https://ytshortsdown.com",
      "Content-Type": "application/json", "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ id: videoId, fileType: format }),
  }, 20000);
  if (!res.ok) throw new Error(`HTTP${res.status}`);
  const data = await res.json() as any;
  if (format === "mp3" && data.link) return { downloadUrl: data.link, title: data.title };
  if (format === "mp4" && data.formats?.[0]?.url) return { downloadUrl: data.formats[0].url, title: data.title };
  throw new Error("no URL");
};

const fabdlConvert = async (videoId: string, format: "mp3" | "mp4") => {
  const type = format === "mp3" ? "mp3" : "mp4";
  const res = await fetchWithTimeout(
    `https://api.fabdl.com/youtube/get?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&type=${type}`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json", Referer: "https://fabdl.com/" } }, 45000
  );
  if (!res.ok) throw new Error(`HTTP${res.status}`);
  const data = await res.json() as any;
  const result = data?.result ?? data;
  if (format === "mp3" && result?.audios?.[0]?.url) return { downloadUrl: result.audios[0].url, title: result.title };
  if (format === "mp4" && result?.videos?.[0]?.url) return { downloadUrl: result.videos[0].url, title: result.title };
  throw new Error("no URL");
};

const invidiousConvert = async (videoId: string, format: "mp3" | "mp4") => {
  const instances = ["https://invidious.privacyredirect.com", "https://inv.tux.pizza", "https://yt.cdaut.de", "https://invidious.fdn.fr", "https://yewtu.be"];
  for (const inst of instances) {
    try {
      const r = await fetchWithTimeout(`${inst}/api/v1/videos/${videoId}?fields=title,formatStreams,adaptiveFormats`, { headers: { Accept: "application/json", "User-Agent": USER_AGENT } }, 14000);
      if (!r.ok) continue;
      const data = await r.json() as any;
      const streams = format === "mp4" ? (data.formatStreams || []) : (data.adaptiveFormats || []).filter((s: any) => s.type?.includes("audio/"));
      const best = streams.sort((a: any, b: any) => (parseInt(b.qualityLabel || b.bitrate || "0")) - (parseInt(a.qualityLabel || a.bitrate || "0")))[0];
      if (best?.itag) return { downloadUrl: `${inst}/latest_version?id=${videoId}&itag=${best.itag}&local=true`, title: data.title };
    } catch {}
  }
  throw new Error("all instances failed");
};

const cobaltConvert = async (videoId: string, format: "mp3" | "mp4") => {
  const instances = ["https://cobalt-api.meowing.de", "https://co.eepy.today"];
  for (const instance of instances) {
    try {
      const body: any = { url: `https://www.youtube.com/watch?v=${videoId}` };
      if (format === "mp3") { body.downloadMode = "audio"; body.audioFormat = "mp3"; }
      else { body.downloadMode = "auto"; body.videoQuality = "720"; }
      const res = await fetchWithTimeout(instance, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": USER_AGENT }, body: JSON.stringify(body) }, 15000);
      if (![200, 201, 202].includes(res.status)) continue;
      const data = await res.json() as any;
      if (data.url) return { downloadUrl: data.url, title: data.filename };
    } catch {}
  }
  throw new Error("all instances failed");
};

const pipedConvert = async (videoId: string, format: "mp3" | "mp4") => {
  const instances = ["https://pipedapi.kavin.rocks", "https://api.piped.yt"];
  for (const inst of instances) {
    try {
      const res = await fetchWithTimeout(`${inst}/streams/${videoId}`, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } }, 12000);
      if (!res.ok) continue;
      const data = await res.json() as any;
      const streams = format === "mp3" ? (data.audioStreams || []) : (data.videoStreams || []).filter((s: any)=> parseInt(s.resolution) <= 720);
      const best = streams.sort((a: any, b: any) => (parseInt(b.resolution || b.bitrate || "0")) - (parseInt(a.resolution || a.bitrate || "0")))[0];
      if (best?.url) return { downloadUrl: best.url, title: data.title };
    } catch {}
  }
  throw new Error("all instances failed");
};

const ytdlpFileConvert = async (videoId: string, format: "mp3" | "mp4") => {
  const uuid = randomUUID();
  const outTemplate = path.join(TEMP_DIR, `${uuid}.%(ext)s`);
  const formatArg = format === "mp3" ? "bestaudio[ext=m4a]/bestaudio/best" : "best[height<=720]/best";
  const cmd = `${existsSync("./yt-dlp") ? "./yt-dlp" : "yt-dlp"} --no-warnings --force-ipv4 --socket-timeout 30 -f "${formatArg}" --print title -o "${outTemplate}" "https://www.youtube.com/watch?v=${videoId}" 2>/dev/null`;
  const { stdout } = await execAsync(cmd, { timeout: 120000 });
  const lines = stdout.trim().split("\n").filter(Boolean);
  const title = lines[0] || `video_${videoId}`;
  const candidates = readdirSync(TEMP_DIR).filter(f => f.startsWith(uuid));
  if (candidates.length === 0) throw new Error("output not found");
  return { downloadUrl: `local://${uuid}`, title };
};

// ============================================================================
// TEST RUNNER
// ============================================================================

const providers = {
  ytmp3Convert,
  ytdlpDirectUrl,
  flvtoConvert,
  fabdlConvert,
  invidiousConvert,
  cobaltConvert,
  pipedConvert,
  ytdlpFileConvert
};

async function runTests() {
  const videoId = "e-ORhEE9VVg";
  const format = "mp3";
  
  console.log(`\n🚀 Starting Provider Speed Test for Video: ${videoId} (${format})\n`);
  console.log("=".repeat(60));

  const results: { name: string; time: number; status: string; error?: string }[] = [];

  for (const [name, fn] of Object.entries(providers)) {
    console.log(`\n⏳ Testing [${name}]...`);
    const start = Date.now();
    try {
      const result = await fn(videoId, format);
      const time = Date.now() - start;
      results.push({ name, time, status: "✅ SUCCESS" });
      console.log(`   ✅ SUCCESS in ${time}ms`);
      console.log(`   URL: ${result.downloadUrl.substring(0, 80)}...`);
    } catch (e: any) {
      const time = Date.now() - start;
      results.push({ name, time, status: "❌ FAILED", error: e.message });
      console.log(`   ❌ FAILED in ${time}ms - ${e.message.substring(0, 80)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL RESULTS (Sorted by Speed)");
  console.log("=".repeat(60));
  
  const successes = results.filter(r => r.status.includes("SUCCESS")).sort((a, b) => a.time - b.time);
  const failures = results.filter(r => r.status.includes("FAILED")).sort((a, b) => a.time - b.time);

  console.log("\n🏆 WINNERS (Fastest to Slowest):");
  if (successes.length === 0) console.log("   None succeeded 😢");
  successes.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name.padEnd(20)} - ${r.time}ms`);
  });

  console.log("\n💀 FAILURES (Fastest to Slowest):");
  failures.forEach((r) => {
    console.log(`   - ${r.name.padEnd(20)} - ${r.time}ms (${r.error})`);
  });
}

runTests();
