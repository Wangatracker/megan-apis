import type { Express, Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

// ============================================================
// MEGAN APIs — ADULT VIDEO METADATA
// Creator: Tracker Wanga
//
// Sources: XNXX and XVideos
// Five endpoints per source.
//
// This module extracts public page metadata and resolves
// direct media URLs. It does not download or rehost entire
// videos on Megan's server.
// ============================================================

type SourceName = "xnxx" | "xvideos";

type VideoMetadata = {
  source: SourceName;
  title: string | null;
  pageUrl: string;
  thumbnail: string | null;
  durationSeconds: number | null;
  uploadedAt: string | null;
  views: number | null;
  description: string | null;
};

const SOURCES: Record<
  SourceName,
  {
    name: string;
    baseUrl: string;
    pageHosts: string[];
    mediaDomain: string;
  }
> = {
  xnxx: {
    name: "XNXX",
    baseUrl: "https://www.xnxx.com",
    pageHosts: ["xnxx.com"],
    mediaDomain: "xnxx-cdn.com",
  },
  xvideos: {
    name: "XVIDEOS",
    baseUrl: "https://www.xvideos.com",
    pageHosts: ["xvideos.com"],
    mediaDomain: "xvideos-cdn.com",
  },
};

const client = axios.create({
  timeout: 20000,
  maxRedirects: 5,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/json,*/*",
    "Accept-Language": "en-US,en;q=0.9",
  },
  maxContentLength: 5 * 1024 * 1024,
});

function param(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
}

function adultConfirmed(req: Request, res: Response): boolean {
  if (param(req.query.adult).toLowerCase() === "true") {
    return true;
  }

  res.status(400).json({
    success: false,
    error: "Adult-content confirmation is required.",
    hint:
      "Use adult=true only in an age-restricted application " +
      "with appropriate age and access controls.",
  });

  return false;
}

function getSource(value: string): SourceName | null {
  return value === "xnxx" || value === "xvideos" ? value : null;
}

function hostMatches(host: string, allowedDomain: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, "");

  return (
    normalized === allowedDomain ||
    normalized.endsWith("." + allowedDomain)
  );
}

function validatePageUrl(
  rawUrl: string,
  source: SourceName,
): URL | null {
  try {
    const url = new URL(rawUrl);
    const config = SOURCES[source];

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    if (url.username || url.password) return null;

    if (
      !config.pageHosts.some((domain) =>
        hostMatches(url.hostname, domain),
      )
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function validateMediaUrl(
  rawUrl: string,
  source: SourceName,
): URL | null {
  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;

    if (!hostMatches(url.hostname, SOURCES[source].mediaDomain)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const result = value
    .replace(/&lpar;/gi, "(")
    .replace(/&rpar;/gi, ")")
    .replace(/&comma;/gi, ",")
    .replace(/&period;/gi, ".")
    .replace(/&colon;/gi, ":")
    .replace(/&sol;/gi, "/")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  return result || null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") return null;

  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/i);

  if (!match) return null;

  const number = Number(match[1]);
  const suffix = (match[2] || "").toLowerCase();

  const multiplier =
    suffix === "k" ? 1000 :
    suffix === "m" ? 1000000 :
    suffix === "b" ? 1000000000 : 1;

  const result = number * multiplier;

  return Number.isFinite(result) ? result : null;
}

function durationSeconds(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  if (typeof value === "number") {
    return value >= 0 ? Math.floor(value) : null;
  }

  const input = value.trim();

  // ISO 8601, e.g. PT00H06M32S
  const iso = input.match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i,
  );

  if (iso) {
    return (
      Number(iso[1] || 0) * 3600 +
      Number(iso[2] || 0) * 60 +
      Number(iso[3] || 0)
    );
  }

  // Display formats such as 6:32 or 1:02:30
  if (/^\d+(?::\d{1,2}){1,2}$/.test(input)) {
    const parts = input.split(":").map(Number);

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

function findVideoObject($: cheerio.CheerioAPI): any | null {
  const found: any[] = [];

  function collect(item: any): void {
    if (!item) return;

    if (Array.isArray(item)) {
      for (const child of item) collect(child);
      return;
    }

    if (typeof item !== "object") return;

    const type = item["@type"];

    if (
      type === "VideoObject" ||
      (Array.isArray(type) && type.includes("VideoObject"))
    ) {
      found.push(item);
    }

    if (item["@graph"]) collect(item["@graph"]);
    if (item.mainEntity) collect(item.mainEntity);
    if (item.itemListElement) collect(item.itemListElement);
  }

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      collect(JSON.parse($(element).text()));
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  });

  return found[0] || null;
}

function firstMeta(
  $: cheerio.CheerioAPI,
  selectors: string[],
): string | null {
  for (const selector of selectors) {
    const value = $(selector).first().attr("content");

    if (value?.trim()) return value.trim();
  }

  return null;
}

function imageUrl(value: unknown, pageUrl: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim(), pageUrl);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function extractMetadata(
  html: string,
  pageUrl: string,
  source: SourceName,
): VideoMetadata {
  const $ = cheerio.load(html);
  const video = findVideoObject($);

  const title =
    normalizeText(video?.name) ||
    normalizeText(firstMeta($, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ])) ||
    normalizeText($("title").first().text());

  const thumbnail =
    imageUrl(video?.thumbnailUrl, pageUrl) ||
    imageUrl(firstMeta($, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]), pageUrl);

  const duration =
    durationSeconds(video?.duration) ??
    durationSeconds(firstMeta($, [
      'meta[property="og:duration"]',
      'meta[name="duration"]',
    ]));

  const uploadedAt =
    normalizeText(video?.uploadDate) ||
    normalizeText(firstMeta($, [
      'meta[property="article:published_time"]',
      'meta[name="uploadDate"]',
    ]));

  const interactionCount =
    video?.interactionStatistic?.userInteractionCount ??
    video?.interactionStatistic?.[0]?.userInteractionCount;

  const views =
    numberValue(interactionCount) ??
    numberValue(firstMeta($, [
      'meta[itemprop="interactionCount"]',
    ]));

  const description =
    normalizeText(video?.description) ||
    normalizeText(firstMeta($, [
      'meta[property="og:description"]',
      'meta[name="description"]',
    ]));

  return {
    source,
    title,
    pageUrl,
    thumbnail,
    durationSeconds: duration,
    uploadedAt,
    views,
    description,
  };
}

function getVideoObjectContentUrl(html: string): string | null {
  const $ = cheerio.load(html);
  const video = findVideoObject($);

  return typeof video?.contentUrl === "string"
    ? video.contentUrl
    : null;
}

async function fetchPage(url: string): Promise<string> {
  const response = await client.get(url, {
    responseType: "text",
    validateStatus: (status) => status >= 200 && status < 400,
  });

  if (typeof response.data !== "string") {
    throw new Error("The source returned an unexpected response.");
  }

  return response.data;
}

function publicError(
  res: Response,
  error: unknown,
  action: string,
): void {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 404) {
      res.status(404).json({
        success: false,
        error: "The requested source page was not found.",
      });
      return;
    }

    if (status === 403 || status === 429) {
      res.status(502).json({
        success: false,
        error: "The source denied or rate-limited the request.",
        upstreamStatus: status,
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: `${action} failed because the source did not respond successfully.`,
      code: error.code || undefined,
      upstreamStatus: status || undefined,
    });
    return;
  }

  res.status(502).json({
    success: false,
    error: error instanceof Error ? error.message : `${action} failed.`,
  });
}

function searchUrl(source: SourceName, query: string): string {
  const base = SOURCES[source].baseUrl;

  if (source === "xvideos") {
    return `${base}/?k=${encodeURIComponent(query)}`;
  }

  return `${base}/search/${encodeURIComponent(query)}`;
}

function extractListing(
  html: string,
  baseUrl: string,
  source: SourceName,
  limit: number,
): Array<{
  title: string | null;
  pageUrl: string;
  thumbnail: string | null;
  duration: number | null;
}> {
  const $ = cheerio.load(html);
  const results: Array<{
    title: string | null;
    pageUrl: string;
    thumbnail: string | null;
    duration: number | null;
  }> = [];

  const seen = new Set<string>();
  const videoPath =
    source === "xvideos"
      ? /\/video\.[a-zA-Z0-9]+(?:\/|$)/
      : /\/video-[a-zA-Z0-9]+(?:\/|$)/;

  $("a[href]").each((_, element) => {
    if (results.length >= limit) return false;

    const rawHref = $(element).attr("href");
    if (!rawHref) return;

    let page: URL;

    try {
      page = new URL(rawHref, baseUrl);
    } catch {
      return;
    }

    if (!videoPath.test(page.pathname)) return;

    const checked = validatePageUrl(page.href, source);
    if (!checked) return;

    const canonicalUrl = checked.href.split("#")[0];

    if (seen.has(canonicalUrl)) return;
    seen.add(canonicalUrl);

    const anchor = $(element);
    const container = anchor.closest(
      ".thumb-block, .thumb, .mozaique, .thumb-under, .video-thumb, article",
    );

    const image =
      anchor.find("img").first().attr("data-src") ||
      anchor.find("img").first().attr("data-original") ||
      anchor.find("img").first().attr("src") ||
      container.find("img").first().attr("data-src") ||
      container.find("img").first().attr("src") ||
      null;

    const rawTitle =
      anchor.attr("title") ||
      anchor.find("img").first().attr("alt") ||
      container.find("[title]").first().attr("title") ||
      anchor.text();

    const durationText =
      container.find(".duration, .video-duration, .thumb-duration").first().text() ||
      anchor.find(".duration").first().text();

    results.push({
      title: normalizeText(rawTitle),
      pageUrl: canonicalUrl,
      thumbnail: imageUrl(image, baseUrl),
      duration: durationSeconds(durationText),
    });
  });

  return results;
}

async function getVideo(
  source: SourceName,
  rawUrl: string,
): Promise<{
  metadata: VideoMetadata;
  html: string;
}> {
  const page = validatePageUrl(rawUrl, source);

  if (!page) {
    throw new Error(
      `Invalid video URL. Provide a public ${SOURCES[source].name} video page URL.`,
    );
  }

  const html = await fetchPage(page.href);

  return {
    metadata: extractMetadata(html, page.href, source),
    html,
  };
}

async function resolveMedia(
  source: SourceName,
  pageUrl: string,
): Promise<{
  metadata: VideoMetadata;
  directUrl: string;
  mediaHost: string;
  contentType: string | null;
  status: number;
  rangeSupported: boolean;
  contentRange: string | null;
  contentLength: string | null;
}> {
  const video = await getVideo(source, pageUrl);
  const rawMediaUrl = getVideoObjectContentUrl(video.html);

  if (!rawMediaUrl) {
    throw new Error(
      "The source page did not expose a direct media URL.",
    );
  }

  const media = validateMediaUrl(rawMediaUrl, source);

  if (!media) {
    throw new Error(
      "The resolved media URL did not match the approved source CDN.",
    );
  }

  // Request only one byte. Never download the complete media file here.
  const response = await axios.get(media.href, {
    responseType: "stream",
    timeout: 15000,
    maxRedirects: 3,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      Range: "bytes=0-0",
      Accept: "video/mp4,*/*",
    },
    validateStatus: (status) => status >= 200 && status < 500,
  });

  const headers = response.headers;

  const status = response.status;
  const contentType =
    typeof headers["content-type"] === "string"
      ? headers["content-type"]
      : null;

  const contentRange =
    typeof headers["content-range"] === "string"
      ? headers["content-range"]
      : null;

  const contentLength =
    typeof headers["content-length"] === "string"
      ? headers["content-length"]
      : null;

  response.data.destroy();

  if (status >= 400) {
    throw new Error(
      `The media server returned HTTP ${status}. The URL may have expired.`,
    );
  }

  return {
    metadata: video.metadata,
    directUrl: media.href,
    mediaHost: media.hostname,
    contentType,
    status,
    rangeSupported: status === 206,
    contentRange,
    contentLength,
  };
}

function registerSourceRoutes(
  app: Express,
  source: SourceName,
): void {
  const prefix = `/api/v2/adult/${source}`;
  const config = SOURCES[source];

  // 1. HOMEPAGE
  app.get(`${prefix}/homepage`, async (req: Request, res: Response) => {
    if (!adultConfirmed(req, res)) return;

    try {
      const html = await fetchPage(config.baseUrl);
      const videos = extractListing(html, config.baseUrl, source, 20);

      res.setHeader("Cache-Control", "private, max-age=60");

      return res.json({
        success: true,
        source: config.name,
        category: "homepage",
        count: videos.length,
        videos,
      });
    } catch (error) {
      return publicError(res, error, "Homepage extraction");
    }
  });

  // 2. SEARCH
  app.get(`${prefix}/search`, async (req: Request, res: Response) => {
    if (!adultConfirmed(req, res)) return;

    const query = param(req.query.q);

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "The q parameter is required.",
        example: `${prefix}/search?q=kenya&adult=true`,
      });
    }

    if (query.length > 150) {
      return res.status(400).json({
        success: false,
        error: "Search query must not exceed 150 characters.",
      });
    }

    const requestedLimit = Number(param(req.query.limit) || "20");
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(40, Math.max(1, requestedLimit))
      : 20;

    try {
      const url = searchUrl(source, query);
      const html = await fetchPage(url);
      const videos = extractListing(html, url, source, limit);

      return res.json({
        success: true,
        source: config.name,
        query,
        count: videos.length,
        videos,
      });
    } catch (error) {
      return publicError(res, error, "Search");
    }
  });

  // 3. VIDEO INFORMATION
  app.get(`${prefix}/info`, async (req: Request, res: Response) => {
    if (!adultConfirmed(req, res)) return;

    const url = param(req.query.url);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "The url parameter is required.",
      });
    }

    try {
      const result = await getVideo(source, url);

      return res.json({
        success: true,
        source: config.name,
        data: result.metadata,
      });
    } catch (error) {
      return publicError(res, error, "Video metadata extraction");
    }
  });

  // 4. STREAM RESOLVER
  // Returns a direct source URL; the media is not proxied or rehosted.
  app.get(`${prefix}/stream`, async (req: Request, res: Response) => {
    if (!adultConfirmed(req, res)) return;

    const url = param(req.query.url);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "The url parameter is required.",
      });
    }

    try {
      const result = await resolveMedia(source, url);

      return res.json({
        success: true,
        source: config.name,
        data: {
          ...result.metadata,
          stream: {
            url: result.directUrl,
            mediaHost: result.mediaHost,
            contentType: result.contentType,
            httpStatus: result.status,
            rangeSupported: result.rangeSupported,
            contentRange: result.contentRange,
            contentLength: result.contentLength,
            urlMayExpire: true,
          },
        },
      });
    } catch (error) {
      return publicError(res, error, "Stream URL resolution");
    }
  });

  // 5. DOWNLOAD INFORMATION
  // Provides a direct source URL for a client. Does not download
  // the file on the Megan server or bypass source-site restrictions.
  app.get(`${prefix}/download`, async (req: Request, res: Response) => {
    if (!adultConfirmed(req, res)) return;

    const url = param(req.query.url);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "The url parameter is required.",
      });
    }

    try {
      const result = await resolveMedia(source, url);

      const safeTitle =
        (result.metadata.title || "video")
          .replace(/[^\p{L}\p{N} _.-]/gu, "")
          .trim()
          .slice(0, 100) || "video";

      return res.json({
        success: true,
        source: config.name,
        data: {
          title: result.metadata.title,
          pageUrl: result.metadata.pageUrl,
          thumbnail: result.metadata.thumbnail,
          durationSeconds: result.metadata.durationSeconds,
          downloadUrl: result.directUrl,
          suggestedFilename: `${safeTitle}.mp4`,
          contentType: result.contentType,
          httpStatus: result.status,
          rangeSupported: result.rangeSupported,
          urlMayExpire: true,
          note:
            "This is a direct source URL, not a Megan-hosted file. " +
            "Use it only where downloading is authorized and permitted " +
            "by the source's terms and the rights holder.",
        },
      });
    } catch (error) {
      return publicError(res, error, "Download URL resolution");
    }
  });
}

// ============================================================
// ROUTE REGISTRATION
// ============================================================

export function registerAdultVideoRoutes(app: Express): void {
  app.get("/api/v2/adult", (_req: Request, res: Response) => {
    const endpoints: Record<string, string> = {};

    for (const source of ["xnxx", "xvideos"] as const) {
      endpoints[`${source}_homepage`] =
        `/api/v2/adult/${source}/homepage?adult=true`;

      endpoints[`${source}_search`] =
        `/api/v2/adult/${source}/search?q=kenya&adult=true`;

      endpoints[`${source}_info`] =
        `/api/v2/adult/${source}/info?url=VIDEO_URL&adult=true`;

      endpoints[`${source}_stream`] =
        `/api/v2/adult/${source}/stream?url=VIDEO_URL&adult=true`;

      endpoints[`${source}_download`] =
        `/api/v2/adult/${source}/download?url=VIDEO_URL&adult=true`;
    }

    return res.json({
      success: true,
      name: "Megan APIs — Adult Video Metadata",
      version: "1.0.0",
      creator: "Tracker Wanga",
      sources: ["XNXX", "XVIDEOS"],
      endpointCount: 10,
      endpoints,
      requirements: [
        "Use adult=true in an age-restricted application.",
        "URL parameters must be URL-encoded.",
        "Direct media URLs may expire.",
        "Source-site restrictions and rights must be respected.",
      ],
    });
  });

  registerSourceRoutes(app, "xnxx");
  registerSourceRoutes(app, "xvideos");

  console.log("✅ Megan APIs — Adult Video routes registered");
  console.log("   GET /api/v2/adult");
  console.log("   XNXX: homepage, search, info, stream, download");
  console.log("   XVideos: homepage, search, info, stream, download");
}
