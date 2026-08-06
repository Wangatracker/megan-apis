import { promisify } from "util";
import { exec } from "child_process";
import { existsSync } from "fs";
import * as path from "path";

const execAsync = promisify(exec);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";

// ─── Cobalt instance pool ────────────────────────────────────────────────────

const COBALT_FALLBACK_INSTANCES = [
  "https://cobalt-api.meowing.de",
  "https://cobalt-backend.canine.tools",
  "https://cobalt.dark-dragon.digital",
  "https://co.eepy.today",
  "https://cobalt-api.kwiatekmiki.com",
];

let cobaltCache: { instances: string[]; expiresAt: number } | null = null;

async function getCobaltInstances(): Promise<string[]> {
  if (cobaltCache && Date.now() < cobaltCache.expiresAt) return cobaltCache.instances;
  try {
    const res = await fetchWithTimeout(
      "https://instances.cobalt.best/api/instances.json",
      { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
      8000
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as any[];
    const instances = data
      .filter((i: any) => i.online && i.services?.instagram === true && i.cors && i.score >= 70)
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 6)
      .map((i: any) => `https://${i.api}`);
    if (instances.length > 0) {
      cobaltCache = { instances, expiresAt: Date.now() + 30 * 60 * 1000 };
      return instances;
    }
  } catch {}
  cobaltCache = {
    instances: COBALT_FALLBACK_INSTANCES,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return COBALT_FALLBACK_INSTANCES;
}

// ─── Cookies for yt-dlp ──────────────────────────────────────────────────────

const COOKIES_PATHS = [
  path.join(process.cwd(), "cookies.txt"),
  "/var/www/megan-apis/cookies.txt",
  path.join(process.env.HOME || "", "cookies.txt"),
];

function getInstagramCookiesArg(): string {
  for (const p of COOKIES_PATHS) {
    if (existsSync(p)) return `--cookies '${p}'`;
  }
  return "";
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface InstagramMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  quality?: string;
}

interface InstagramResult {
  success: boolean;
  creator?: string;
  title?: string;
  username?: string;
  media?: InstagramMedia[];
  duration?: number;
  error?: string;
  provider?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/stories\/[^/]+\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ─── Provider 1: Cobalt ──────────────────────────────────────────────────────

async function tryCobaltInstagram(url: string): Promise<InstagramResult> {
  const instances = await getCobaltInstances();
  const errors: string[] = [];

  for (const instance of instances) {
    try {
      const res = await fetchWithTimeout(
        instance,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": USER_AGENT,
          },
          body: JSON.stringify({ url, downloadMode: "auto" }),
        },
        15000
      );

      if (res.status === 429 || res.status === 403 || res.status >= 500) {
        errors.push(`${instance}: status ${res.status}`);
        continue;
      }

      const data = (await res.json()) as any;

      if (data.status === "error" || data.status === "rate-limit") {
        const code = data.error?.code || data.text || "error";
        if (code.includes("jwt")) {
          errors.push(`${instance}: requires auth`);
        } else {
          errors.push(`${instance}: ${code}`);
        }
        continue;
      }

      const dlUrl = data.url || data.audio;
      if (dlUrl) {
        const isVideo =
          !dlUrl.includes(".jpg") &&
          !dlUrl.includes(".jpeg") &&
          !dlUrl.includes(".png");
        return {
          success: true,
          creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
          provider: "cobalt",
          title: data.filename || "Instagram Media",
          media: [{ type: isVideo ? "video" : "image", url: dlUrl }],
        };
      }

      if ((data.status === "tunnel" || data.status === "redirect") && data.url) {
        return {
          success: true,
          creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
          provider: "cobalt",
          title: data.filename || "Instagram Media",
          media: [{ type: "video", url: data.url }],
        };
      }

      errors.push(`${instance}: no URL in response`);
    } catch (e: any) {
      errors.push(`${instance}: ${e.message}`);
    }
  }

  cobaltCache = null;
  return { success: false, error: `Cobalt failed: ${errors.join("; ")}` };
}

// ─── Provider 2: yt-dlp ──────────────────────────────────────────────────────

async function tryYtdlpInstagram(url: string): Promise<InstagramResult> {
  const cookies = getInstagramCookiesArg();
  try {
    const safeUrl = url.replace(/'/g, "'\\''");
    const ytdlpBin = existsSync("./yt-dlp") ? "./yt-dlp" : "yt-dlp";
    const cmd = `${ytdlpBin} ${cookies} --no-warnings --dump-json --no-playlist -f "bv*+ba/b" '${safeUrl}'`;
    const { stdout } = await execAsync(cmd, {
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const lines = stdout.trim().split("\n").filter(Boolean);
    const mediaItems: InstagramMedia[] = [];
    let title = "";
    let username = "";

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        title = title || data.title || data.description || "Instagram Media";
        username = username || data.uploader || data.channel || "";
        // Prefer merged video+audio format, fall back to best single format
        const formats = data.formats || [];
        const mergedFormat = formats.find((f: any) => f.acodec !== 'none' && f.vcodec !== 'none');
        const bestFormat = mergedFormat || formats[formats.length - 1];
        const mediaUrl = bestFormat?.url || data.url;
        if (mediaUrl) {
          const isVideo =
            (data.ext && data.ext !== "jpg" && data.ext !== "png") ||
            data.vcodec !== "none";
          mediaItems.push({
            type: isVideo ? "video" : "image",
            url: mediaUrl,
            thumbnail: data.thumbnail,
          });
        }
      } catch {}
    }

    if (mediaItems.length === 0)
      return { success: false, error: "yt-dlp returned no media" };

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      provider: "ytdlp",
      title,
      username,
      media: mediaItems,
    };
  } catch (e: any) {
    const msg = e.stderr?.toString() || e.message || "unknown error";
    return { success: false, error: `yt-dlp: ${msg.substring(0, 200)}` };
  }
}

// ─── Provider 3: Instagram GraphQL API ───────────────────────────────────────

function buildGraphQLBody(shortcode: string): string {
  const params: Record<string, string> = {
    av: "0",
    __d: "www",
    __user: "0",
    __a: "1",
    __req: "b",
    __hs: "20183.HYP:instagram_web_pkg.2.1...0",
    dpr: "3",
    __ccg: "GOOD",
    __rev: "1021613311",
    __s: "hm5eih:ztapmw:x0losd",
    __hsi: "7489787314313612244",
    __dyn:
      "7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJw5ux609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swtUd8-U2zxe2GewGw9a361qw8Xxm16wa-0oa2-azo7u3C2u2J0bS1LwTwKG1pg2fwxyo6O1FwlA3a3zhA6bwIxe6V8aUuwm8jwhU3cyVrDyo",
    __csr: "",
    __comet_req: "7",
    lsd: "AVrqPT0gJDo",
    jazoest: "2946",
    __spin_r: "1021613311",
    __spin_b: "trunk",
    __spin_t: "1743852001",
    __crn: "comet.igweb.PolarisPostRoute",
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
    variables: JSON.stringify({
      shortcode,
      fetch_tagged_user_count: null,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
    }),
    server_timestamps: "true",
    doc_id: "8845758582119845",
  };

  return new URLSearchParams(params).toString();
}

async function tryGraphQLApi(shortcode: string): Promise<InstagramResult> {
  try {
    const res = await fetchWithTimeout("https://www.instagram.com/graphql/query", {
      method: "POST",
      headers: {
        "User-Agent": MOBILE_UA,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
        "X-BLOKS-VERSION-ID":
          "0d99de0d13662a50e0958bcb112dd651f70dea02e1859073ab25f8f2a477de96",
        "X-CSRFToken": "uy8OpI1kndx4oUHjlHaUfu",
        "X-IG-App-ID": "1217981644879628",
        "X-FB-LSD": "AVrqPT0gJDo",
        "X-ASBD-ID": "359341",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Referer: `https://www.instagram.com/p/${shortcode}/`,
      },
      body: buildGraphQLBody(shortcode),
    });

    if (res.status === 429 || res.status === 401)
      return { success: false, error: "Rate limited by Instagram" };
    if (!res.ok)
      return { success: false, error: `Instagram returned status ${res.status}` };

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json"))
      return { success: false, error: "Instagram returned non-JSON response" };

    const data = await res.json();
    const mediaData = data?.data?.xdt_shortcode_media;

    if (!mediaData)
      return { success: false, error: "Post not found or is private" };

    const media: InstagramMedia[] = [];

    if (mediaData.is_video && mediaData.video_url) {
      media.push({
        type: "video",
        url: mediaData.video_url,
        thumbnail: mediaData.thumbnail_src || mediaData.display_url,
        quality: mediaData.dimensions
          ? `${mediaData.dimensions.width}x${mediaData.dimensions.height}`
          : undefined,
      });
    } else if (mediaData.display_url) {
      media.push({ type: "image", url: mediaData.display_url });
    }

    if (Array.isArray(mediaData.edge_sidecar_to_children?.edges)) {
      for (const edge of mediaData.edge_sidecar_to_children.edges) {
        const node = edge.node;
        if (node?.is_video && node?.video_url) {
          media.push({ type: "video", url: node.video_url, thumbnail: node.display_url });
        } else if (node?.display_url) {
          media.push({ type: "image", url: node.display_url });
        }
      }
    }

    if (media.length === 0)
      return { success: false, error: "No downloadable media found in this post" };

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      provider: "graphql",
      title:
        mediaData.edge_media_to_caption?.edges?.[0]?.node?.text?.substring(0, 100) ||
        "Instagram Media",
      username: mediaData.owner?.username,
      media,
      duration: mediaData.video_duration || undefined,
    };
  } catch {
    return { success: false, error: "GraphQL request failed" };
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function downloadInstagram(url: string): Promise<InstagramResult> {
  const shortcode = extractShortcode(url);

  if (!shortcode) {
    return {
      success: false,
      error: "Invalid Instagram URL. Provide a valid post, reel, or IGTV link.",
    };
  }

  const providers: Array<{ name: string; fn: () => Promise<InstagramResult> }> = [
    { name: "cobalt",  fn: () => tryCobaltInstagram(url) },
    { name: "ytdlp",   fn: () => tryYtdlpInstagram(url) },
    { name: "graphql", fn: () => tryGraphQLApi(shortcode) },
    { name: "snapinsta", fn: () => trySnapInsta(url) },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[instagram] Trying provider: ${provider.name}`);
      const result = await provider.fn();
      if (result.success) {
        console.log(`[instagram] Provider ${provider.name} succeeded`);
        return result;
      }
      errors.push(`${provider.name}: ${result.error}`);
      console.log(`[instagram] Provider ${provider.name} failed: ${result.error}`);
    } catch (err: any) {
      errors.push(`${provider.name}: ${err.message}`);
      console.log(`[instagram] Provider ${provider.name} threw: ${err.message}`);
    }
  }

  return {
    success: false,
    creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
    error:
      "Could not download this Instagram post. It may be private, deleted, or temporarily unavailable.",
    details: errors.join(" | "),
  } as any;
}

// ─── Provider 4: SnapInsta (pure Node.js, no yt-dlp) ────────────────────────

async function trySnapInsta(url: string): Promise<InstagramResult> {
  try {
    const { scrape } = await import('./snapinsta.js');
    const results = await scrape(url);
    if (!results || results.length === 0) {
      return { success: false, error: 'SnapInsta returned no media' };
    }
    return {
      success: true,
      creator: 'Megan APIs v3.6.4 | Tracker Wanga | Megan Tech',
      provider: 'snapinsta',
      title: 'Instagram Media',
      media: results.map((r: any) => ({
        type: r.type || 'video',
        url: r.url,
        thumbnail: r.thumbnail,
        quality: r.quality,
      })),
    };
  } catch (e: any) {
    return { success: false, error: `SnapInsta: ${e.message}` };
  }
}
