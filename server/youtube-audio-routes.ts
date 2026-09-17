import type { Express, Request, Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

const execAsync = promisify(exec);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function extractVideoId(input: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  return null;
}

async function searchVideo(query: string): Promise<string | null> {
  const ytdlpBin = existsSync("./yt-dlp") ? "./yt-dlp" : "yt-dlp";
  const sanitized = query.replace(/[^a-zA-Z0-9\s\-_.,'&!?()]/g, "").substring(0, 200);
  try {
    const { stdout } = await execAsync(
      `${ytdlpBin} --no-warnings --flat-playlist --print id "ytsearch1:${sanitized}" 2>/dev/null`,
      { timeout: 20000 }
    );
    const id = stdout.trim().split("\n")[0];
    return id?.length === 11 ? id : null;
  } catch {
    return null;
  }
}

async function getAudioInfo(videoId: string) {
  const ytdlpBin = existsSync("./yt-dlp") ? "./yt-dlp" : "yt-dlp";
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // Get metadata
  const metaCmd = `${ytdlpBin} --no-warnings --dump-json --no-playlist "${url}" 2>/dev/null`;
  const { stdout: metaOut } = await execAsync(metaCmd, { timeout: 30000, maxBuffer: 15 * 1024 * 1024 });
  const meta = JSON.parse(metaOut.trim());

  // Get best audio direct URL
  const urlCmd = `${ytdlpBin} --no-warnings --no-playlist -f "bestaudio[ext=m4a]/bestaudio/best" -g "${url}" 2>/dev/null`;
  const { stdout: urlOut } = await execAsync(urlCmd, { timeout: 30000 });
  const streamUrl = urlOut.trim().split("\n")[0];

  if (!streamUrl?.startsWith("http")) throw new Error("No audio URL from yt-dlp");

  // Collect available audio formats
  const audioFormats = (meta.formats || [])
    .filter((f: any) => f.acodec && f.acodec !== "none" && (f.vcodec === "none" || !f.vcodec) && f.url)
    .map((f: any) => ({
      formatId: f.format_id,
      ext: f.ext,
      bitrate: f.abr ? `${Math.round(f.abr)}kbps` : null,
      size: f.filesize || f.filesize_approx || null,
      url: f.url,
    }))
    .sort((a: any, b: any) => (parseFloat(b.bitrate) || 0) - (parseFloat(a.bitrate) || 0))
    .slice(0, 5);

  return {
    videoId,
    title: meta.title,
    author: meta.uploader || meta.channel,
    duration: meta.duration,
    durationString: meta.duration_string,
    thumbnail: meta.thumbnail,
    views: meta.view_count,
    streamUrl,
    audioFormats,
  };
}

export function registerYouTubeAudioRoutes(app: Express): void {

  // Main endpoint — accepts URL or search query
  app.get("/api/v2/download/ytaudio", async (req: Request, res: Response) => {
    try {
      const input = (req.query.q || req.query.url || req.query.query) as string;
      if (!input) return res.status(400).json({ success: false, error: "Parameter 'q' or 'url' required" });

      let videoId = extractVideoId(input);
      if (!videoId) {
        videoId = await searchVideo(input);
        if (!videoId) return res.status(404).json({ success: false, error: `No video found for: ${input}` });
      }

      const info = await getAudioInfo(videoId);

      // Build proxy URL (works from anywhere — pipes through our server)
      const host = req.headers.host || "apis.megan.qzz.io";
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const proxyUrl = `${protocol}://${host}/api/v2/download/ytaudio/proxy?url=${encodeURIComponent(info.streamUrl)}`;

      return res.json({
        success: true,
        provider: "yt-dlp",
        videoId: info.videoId,
        title: info.title,
        author: info.author,
        duration: info.duration,
        durationString: info.durationString,
        thumbnail: info.thumbnail,
        views: info.views,
        streamUrl: info.streamUrl,        // direct (googlevideo) — works if user's IP matches
        downloadUrl: proxyUrl,             // proxied — works everywhere
        audioFormats: info.audioFormats,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Proxy endpoint — streams the audio through our server
  app.get("/api/v2/download/ytaudio/proxy", async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send("Missing url param");

    const https = require("https");
    const http = require("http");
    let targetUrl: URL;
    try { targetUrl = new URL(url); } catch { return res.status(400).send("Invalid URL"); }

    const headers: Record<string, string> = {
      "User-Agent": UA,
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.youtube.com/",
      "Origin": "https://www.youtube.com",
      "Connection": "keep-alive",
    };
    if (req.headers.range) headers["Range"] = req.headers.range;

    const options = {
      hostname: targetUrl.hostname,
      path: targetUrl.pathname + targetUrl.search,
      method: "GET",
      headers,
      timeout: 60000,
    };

    const protocol = targetUrl.protocol === "https:" ? https : http;
    const proxyReq = protocol.request(options, (proxyRes: any) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const redirectUrl = new URL(proxyRes.headers.location, targetUrl);
        return res.redirect(`/api/v2/download/ytaudio/proxy?url=${encodeURIComponent(redirectUrl.toString())}`);
      }

      res.setHeader("Content-Type", proxyRes.headers["content-type"] || "audio/mp4");
      if (proxyRes.headers["content-length"]) res.setHeader("Content-Length", proxyRes.headers["content-length"]);
      if (proxyRes.headers["content-range"]) res.setHeader("Content-Range", proxyRes.headers["content-range"]);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(proxyRes.statusCode || 200);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err: any) => {
      if (!res.headersSent) res.status(502).send(err.message);
    });
    proxyReq.on("timeout", () => {
      proxyReq.destroy();
      if (!res.headersSent) res.status(504).send("Gateway timeout");
    });
    proxyReq.end();
  });

  console.log("✅ YouTube Audio Routes Registered:");
  console.log("  GET /api/v2/download/ytaudio?q=<url or search>");
  console.log("  GET /api/v2/download/ytaudio/proxy?url=<googlevideo-url>");
}
