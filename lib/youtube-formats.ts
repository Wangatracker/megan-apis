import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getAllYouTubeFormats(videoUrl: string) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const ytdlpBin = require("fs").existsSync("./yt-dlp") ? "./yt-dlp" : "yt-dlp";
  const cmd = `${ytdlpBin} --no-warnings --dump-json --skip-download "${videoUrl}" 2>/dev/null`;

  const { stdout } = await execAsync(cmd, { timeout: 30000, maxBuffer: 20 * 1024 * 1024 });
  const data = JSON.parse(stdout);

  const downloads: any[] = [];
  const streams: any[] = [];
  const audio: any[] = [];
  const allFormats: any[] = [];

  for (const f of data.formats || []) {
    const hasVideo = f.vcodec && f.vcodec !== 'none';
    const hasAudio = f.acodec && f.acodec !== 'none';
    const height = f.height || 0;
    const ext = f.ext || 'mp4';
    const size = f.filesize || f.filesize_approx || 0;
    const sizeMB = size > 0 ? Math.round(size / 1024 / 1024) : null;
    const url = f.url || '';

    allFormats.push({
      formatId: f.format_id,
      quality: hasVideo ? `${height}p` : 'audio',
      ext,
      hasVideo,
      hasAudio,
      sizeMB,
      url: url || null,
    });

    // Pre-merged (video + audio) → download ready
    if (hasVideo && hasAudio && url) {
      downloads.push({
        quality: `${height}p`,
        format: ext,
        sizeMB,
        url,
        note: 'video+audio pre-merged',
      });
    }

    // Video-only → stream (needs separate audio)
    if (hasVideo && !hasAudio && url && height > 0) {
      streams.push({
        quality: `${height}p`,
        format: ext,
        sizeMB,
        url,
        note: 'video-only (no audio)',
      });
    }

    // Audio-only → mp3 download
    if (hasAudio && !hasVideo && url) {
      audio.push({
        quality: f.abr ? `${f.abr}kbps` : 'audio',
        format: ext,
        sizeMB,
        url,
        note: 'audio-only',
      });
    }
  }

  // Sort by quality descending
  downloads.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
  streams.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
  audio.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

  return {
    title: data.title,
    videoId: data.id,
    thumbnail: data.thumbnail,
    duration: data.duration,
    views: data.view_count,
    downloads: downloads.slice(0, 3),   // top 3 pre-merged
    streams: streams.slice(0, 3),        // top 3 video-only
    audio: audio.slice(0, 3),            // top 3 audio-only
    allFormats: allFormats.slice(0, 15), // first 15 formats
    totalFormats: allFormats.length,
  };
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}
