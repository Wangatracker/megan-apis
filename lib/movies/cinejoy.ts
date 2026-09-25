// ─── CINEJOY RESOLVER (internal only — never exposed by name) ──────────────
// Uses external encryption service + api.wing.st backend.

import { mediaKv } from "../../server/kv-client";

const WING = "https://api.wing.st";
const ENC_DEC = "https://enc-dec.app/api";
const DOWNLOADS = "https://downloads.wing.st";
const SUBS = "https://subs.wing.st";
const ORIGIN = "https://cinejoy.pk";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

const HEADERS = {
  "Accept": "*/*",
  "Origin": ORIGIN,
  "Referer": `${ORIGIN}/`,
  "User-Agent": UA,
};

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(str: string): Buffer {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

// ─── SERVERS ──────────────────────────────────────────────────────────────
export async function getServers(): Promise<any[]> {
  const cacheKey = "movies:servers";
  if (mediaKv.configured()) {
    const hit = await mediaKv.get<any[]>(cacheKey);
    if (hit && Array.isArray(hit)) return hit;
  }

  try {
    const res = await fetch(`${WING}/servers`, { headers: HEADERS });
    if (!res.ok) return [];
    const data: any = await res.json();
    const servers = data.servers || [];
    if (mediaKv.configured()) await mediaKv.put(cacheKey, servers);
    return servers;
  } catch {
    return [];
  }
}

// ─── STREAMS ──────────────────────────────────────────────────────────────
export interface StreamResult {
  server: string;
  quality?: string;
  type: "hls" | "mp4";
  url: string;
  captions?: any[];
}

export async function resolveStream(opts: {
  tmdbId: number;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  server?: string;
}): Promise<StreamResult[]> {
  const { tmdbId, type, season, episode, server } = opts;
  const cacheKey = `movies:stream:${type}:${tmdbId}:${season || 0}:${episode || 0}:${server || "any"}`;

  if (mediaKv.configured()) {
    const hit = await mediaKv.get<StreamResult[]>(cacheKey);
    if (hit && Array.isArray(hit)) return hit;
  }

  const servers = server ? [{ name: server }] : await getServers();
  if (!servers.length) return [];

  const results: StreamResult[] = [];

  for (const srv of servers) {
    const serverName = srv.name;
    try {
      // Build URL
      const params = new URLSearchParams();
      if (type === "movie") {
        params.set("type", "movie");
      } else {
        params.set("type", "series");
        params.set("season", String(season || 1));
        params.set("episode", String(episode || 1));
      }
      params.set("tmdb", String(tmdbId));
      params.set("server", serverName);
      const targetUrl = `${WING}/?${params.toString()}`;

      // 1. Encrypt
      const encRes = await fetch(`${ENC_DEC}/enc-cinejoy?url=${encodeURIComponent(targetUrl)}`);
      const encData: any = await encRes.json();
      if (encData.status !== 200) continue;

      const enc = encData.result;
      const payload = b64urlDecode(enc.data);
      const state = enc.state;

      // 2. Send
      const sendRes = await fetch(`${WING}/g`, {
        method: "POST",
        headers: HEADERS,
        body: payload,
      });
      const respBuf = Buffer.from(await sendRes.arrayBuffer());
      if (respBuf.length < 30) continue;

      // 3. Decrypt
      const decRes = await fetch(`${ENC_DEC}/dec-cinejoy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: b64urlEncode(respBuf),
          state,
        }),
      });
      const decData: any = await decRes.json();
      if (decData.status !== 200) continue;

      const decrypted = decData.result;
      const streams = decrypted?.data?.stream || [];

      for (const s of streams) {
        if (s.type === "hls" && s.playlist) {
          results.push({
            server: serverName,
            quality: srv["4k"] ? "4K" : "Auto",
            type: "hls",
            url: s.playlist,
            captions: s.captions || [],
          });
        } else if (s.type === "file" && s.qualities) {
          for (const [q, v] of Object.entries<any>(s.qualities)) {
            if (v?.url) {
              results.push({
                server: serverName,
                quality: q,
                type: "mp4",
                url: v.url,
              });
            }
          }
        }
      }
    } catch (e: any) {
      console.error(`[movies] server ${serverName} error:`, e.message);
    }
  }

  if (mediaKv.configured() && results.length > 0) {
    await mediaKv.put(cacheKey, results);
  }
  return results;
}

// ─── DOWNLOADS ────────────────────────────────────────────────────────────
export interface DownloadResult {
  source: string;
  name: string;
  quality: number;
  url: string;
  size?: string;
  filename?: string;
  provider?: string;
}

export async function getDownloads(opts: {
  tmdbId: number;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
}): Promise<DownloadResult[]> {
  const { tmdbId, type, season, episode } = opts;
  const cacheKey = `movies:dl:${type}:${tmdbId}:${season || 0}:${episode || 0}`;

  if (mediaKv.configured()) {
    const hit = await mediaKv.get<DownloadResult[]>(cacheKey);
    if (hit && Array.isArray(hit)) return hit;
  }

  let url: string;
  if (type === "movie") {
    url = `${DOWNLOADS}/movie/${tmdbId}`;
  } else {
    url = `${DOWNLOADS}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
  }

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data: any = await res.json();
    const links = data.links || [];
    if (mediaKv.configured() && links.length > 0) {
      await mediaKv.put(cacheKey, links);
    }
    return links;
  } catch {
    return [];
  }
}

// ─── SUBTITLES ────────────────────────────────────────────────────────────
export async function getSubtitles(opts: {
  tmdbId: number;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
}): Promise<any[]> {
  const { tmdbId, type, season, episode } = opts;
  const cacheKey = `movies:subs:${type}:${tmdbId}:${season || 0}:${episode || 0}`;

  if (mediaKv.configured()) {
    const hit = await mediaKv.get<any[]>(cacheKey);
    if (hit && Array.isArray(hit)) return hit;
  }

  const params = new URLSearchParams({ tmdb: String(tmdbId) });
  if (type === "tv") {
    params.set("season", String(season || 1));
    params.set("episode", String(episode || 1));
  }

  try {
    const res = await fetch(`${SUBS}/subtitles?${params}`, { headers: HEADERS });
    if (!res.ok) return [];
    const data: any = await res.json();
    const subs = Array.isArray(data) ? data : [];
    if (mediaKv.configured() && subs.length > 0) {
      await mediaKv.put(cacheKey, subs);
    }
    return subs;
  } catch {
    return [];
  }
}
