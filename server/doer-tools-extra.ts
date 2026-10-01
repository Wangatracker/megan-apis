// ─── EXTENDED DOER TOOLS ───────────────────────────────────────────────
// Added tools for: stalker, security, downloaders+, research, content
// creation, OSINT, screenshot/QR, sound, utility, and messaging.
//
// The TOOLS object is merged into DOER_TOOLS in doer-tools.ts at startup.

const SELF_BASE_EXTRA = process.env.SELF_BASE_URL || "https://apis.megan.qzz.io";
const ADMIN_KEY_EXTRA = process.env.ADMIN_KEY || "megan_admin_master";

function d_extra(raw: any): any { return raw?.data ?? raw; }

function arr_extra(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.results)) return x.results;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.papers)) return x.papers;
  if (Array.isArray(x?.books)) return x.books;
  if (Array.isArray(x?.articles)) return x.articles;
  return [];
}

export const EXTRA_TOOLS: Record<string, any> = {
  // ═══════════════════ STALKER (7) ═══════════════════
  stalk_github: {
    kind: "read",
    description: "Get GitHub user profile (followers, repos, bio, avatar, location, company, links).",
    params: { username: "string" },
    endpoint: "/api/stalk/github",
    method: "GET",
    build: (a: any) => ({ query: { username: a.username } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const u = data.result || data;
      return {
        type: "profile",
        platform: "GitHub",
        username: u.username || u.login,
        name: u.name,
        avatar: u.avatar,
        bio: u.bio,
        followers: u.followers,
        following: u.following,
        repos: u.publicRepos || u.public_repos,
        gists: u.publicGists || u.public_gists,
        company: u.company,
        location: u.location,
        blog: u.blog,
        twitter: u.twitterUsername || u.twitter_username,
        createdAt: u.createdAt || u.created_at,
        url: u.profileUrl || u.html_url,
        profileUrl: u.profileUrl || u.html_url,
      };
    },
  },
  stalk_tiktok: {
    kind: "read",
    description: "Get TikTok user profile (followers, likes, videos).",
    params: { q: "string (TikTok username without @)" },
    endpoint: "/api/v2/stalk/tiktok",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q || a.username } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const u = data.result || data;
      return { type: "profile", platform: "TikTok", name: u.nickname, username: u.username, avatar: u.avatarLarger || u.avatar, bio: u.signature, followers: u.followerCount, following: u.followingCount, likes: u.heartCount, videos: u.videoCount };
    },
  },
  stalk_instagram: {
    kind: "read",
    description: "Get Instagram user profile info.",
    params: { username: "string" },
    endpoint: "/api/stalk/instagram",
    method: "GET",
    build: (a: any) => ({ query: { username: a.username } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      return { type: "profile", platform: "Instagram", name: data.fullName || data.name, username: data.username, avatar: data.profilePicUrl || data.avatar, bio: data.biography, followers: data.followerCount, following: data.followingCount, posts: data.postCount, url: data.profileUrl };
    },
  },
  stalk_twitter: {
    kind: "read",
    description: "Get Twitter/X user profile.",
    params: { username: "string" },
    endpoint: "/api/stalk/twitter",
    method: "GET",
    build: (a: any) => ({ query: { username: a.username } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      return { type: "profile", platform: "Twitter/X", name: data.name, username: data.username, avatar: data.avatar, bio: data.bio, followers: data.followers, following: data.following, tweets: data.tweets, verified: data.verified };
    },
  },
  stalk_telegram: {
    kind: "read",
    description: "Get Telegram user or channel info.",
    params: { username: "string" },
    endpoint: "/api/stalk/telegram",
    method: "GET",
    build: (a: any) => ({ query: { username: a.username } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      return { type: "profile", platform: "Telegram", name: data.name, username: data.username, avatar: data.avatar, bio: data.bio, subscribers: data.subscribers };
    },
  },
  stalk_roblox: {
    kind: "read",
    description: "Get Roblox user profile.",
    params: { q: "string" },
    endpoint: "/api/v2/stalk/roblox",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q || a.username } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const u = data.result || data;
      return { type: "profile", platform: "Roblox", name: u.display_name, username: u.username, avatar: u.avatar, id: u.id, description: u.description, created: u.created, friends: u.friends, followers: u.followers };
    },
  },
  stalk_youtube: {
    kind: "read",
    description: "Get YouTube channel info.",
    params: { q: "string" },
    endpoint: "/api/v2/stalk/youtube",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q || a.username } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const u = data.result || data;
      return { type: "profile", platform: "YouTube", name: u.name, username: u.username, avatar: u.avatar, description: u.description, subscribers: u.subscriberCount, videos: u.videoCount };
    },
  },

  // ═══════════════════ SECURITY (7) ═══════════════════
  security_whois: {
    kind: "read",
    description: "WHOIS lookup for a domain — registrar, expiry, owner info.",
    params: { domain: "string" },
    endpoint: "/api/security/whois",
    method: "GET",
    build: (a: any) => ({ query: { domain: a.domain } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "security_report", check: "WHOIS", domain: r.domain, info: r.info || r };
    },
  },
  security_dns: {
    kind: "read",
    description: "DNS records lookup (A, AAAA, MX, TXT, NS, CNAME).",
    params: { domain: "string" },
    endpoint: "/api/security/dns",
    method: "GET",
    build: (a: any) => ({ query: { domain: a.domain } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "security_report", check: "DNS", domain: r.domain, records: { A: r.A, AAAA: r.AAAA, MX: r.MX, TXT: r.TXT, NS: r.NS, CNAME: r.CNAME } };
    },
  },
  security_ssl: {
    kind: "read",
    description: "Check SSL certificate validity and issuer.",
    params: { host: "string" },
    endpoint: "/api/security/ssl",
    method: "GET",
    build: (a: any) => ({ query: { host: a.host } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "security_report", check: "SSL", host: r.host, valid: r.valid, issuer: r.issuer, expires: r.expires || r.validTo };
    },
  },
  security_headers: {
    kind: "read",
    description: "Inspect HTTP response headers from any URL.",
    params: { url: "string" },
    endpoint: "/api/security/headers",
    method: "GET",
    build: (a: any) => ({ query: { url: a.url } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "security_report", check: "Headers", url: r.url, status: r.status, headers: r.headers };
    },
  },
  security_scan_ports: {
    kind: "read",
    description: "Scan common ports on a host to find open services.",
    params: { host: "string" },
    endpoint: "/api/security/portscan",
    method: "GET",
    build: (a: any) => ({ query: { host: a.host } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "security_report", check: "Port Scan", host: r.host, ports: r.ports };
    },
  },
  security_techstack: {
    kind: "read",
    description: "Detect the technology stack of a website (server, CDN, language).",
    params: { url: "string" },
    endpoint: "/api/security/techstack",
    method: "GET",
    build: (a: any) => ({ query: { url: a.url } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "security_report", check: "Tech Stack", url: r.url, server: r.server, poweredBy: r.poweredBy, cdn: r.cdn, language: r.language, framework: r.framework };
    },
  },
  security_check_waf: {
    kind: "read",
    description: "Detect if a site uses a Web Application Firewall.",
    params: { url: "string" },
    endpoint: "/api/security/waf",
    method: "GET",
    build: (a: any) => ({ query: { url: a.url } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "security_report", check: "WAF", url: r.url, detected: r.detected, provider: r.provider };
    },
  },

  // ═══════════════════ RESEARCH (6) ═══════════════════
  search_papers: {
    kind: "read",
    description: "Search 250M+ academic papers (OpenAlex).",
    params: { q: "string", page: "number (optional)" },
    endpoint: "/api/education/papers",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q, page: String(a.page || 1) } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const items = (data.papers || []).map((p: any) => ({ title: p.title, authors: p.authors, year: p.year || p.publication_year, doi: p.doi, url: p.url || p.doi }));
      return { type: "paper_list", query: data.query, totalResults: data.totalResults, items };
    },
  },
  search_books: {
    kind: "read",
    description: "Search 20M+ books (Open Library).",
    params: { q: "string" },
    endpoint: "/api/education/books",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const items = arr_extra(data).map((b: any) => ({ title: b.title, author: b.author || (b.authors && b.authors[0]), year: b.year || b.first_publish_year, cover: b.cover || b.thumbnail }));
      return { type: "book_list", query: data.query, items };
    },
  },
  wikipedia_deep: {
    kind: "read",
    description: "Get full Wikipedia article extract.",
    params: { q: "string" },
    endpoint: "/api/tools/wikipedia",
    method: "GET",
    build: (a: any) => ({ query: { query: a.q || a.query } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "text", title: r.title, result: (r.extract || r.summary || "").slice(0, 2000) };
    },
  },
  search_stackoverflow: {
    kind: "read",
    description: "Search Stack Overflow questions.",
    params: { q: "string" },
    endpoint: "/api/search/stackoverflow",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const items = arr_extra(data).slice(0, 10).map((q: any) => ({ title: q.title, score: q.score, answers: q.answer_count, url: q.link, isAnswered: q.is_answered }));
      return { type: "list", title: "Stack Overflow Results", items };
    },
  },
  search_github_repos: {
    kind: "read",
    description: "Search GitHub repositories.",
    params: { q: "string" },
    endpoint: "/api/search/github",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const items = arr_extra(data).slice(0, 10).map((r: any) => ({ title: r.full_name || r.name, description: r.description, stars: r.stargazers_count || r.stars, language: r.language, url: r.html_url }));
      return { type: "list", title: "GitHub Repos", items };
    },
  },
  search_npm: {
    kind: "read",
    description: "Search NPM packages.",
    params: { q: "string" },
    endpoint: "/api/search/npm",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const items = arr_extra(data).slice(0, 10).map((p: any) => ({ title: p.name, description: p.description, version: p.version, url: p.links?.npm || p.url }));
      return { type: "list", title: "NPM Packages", items };
    },
  },

  // ═══════════════════ SCREENSHOT / QR (3) ═══════════════════
  screenshot_website: {
    kind: "read",
    description: "Take a screenshot of any website.",
    params: { url: "string" },
    endpoint: "/api/tools/screenshot",
    method: "GET",
    build: (a: any) => ({ query: { url: a.url } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "media", kind: "image", url: r.screenshot, prompt: `Screenshot: ${r.url}` };
    },
  },
  qr_wifi: {
    kind: "read",
    description: "Generate a WiFi QR code for phone scanning.",
    params: { ssid: "string", password: "string", encryption: "string (optional: WPA/WEP/nopass)" },
    endpoint: "/api/qr/wifi",
    method: "GET",
    build: (a: any) => ({ query: { ssid: a.ssid, password: a.password, encryption: a.encryption || "WPA" } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "media", kind: "image", url: r.url || r.qr, text: `WiFi: ${r.ssid || ""}` };
    },
  },
  qr_vcard: {
    kind: "read",
    description: "Generate a vCard contact QR code.",
    params: { name: "string", phone: "string (optional)", email: "string (optional)", org: "string (optional)" },
    endpoint: "/api/qr/vcard",
    method: "GET",
    build: (a: any) => ({ query: { name: a.name, phone: a.phone || "", email: a.email || "", org: a.org || "" } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "media", kind: "image", url: r.url || r.qr, text: `Contact: ${r.name || ""}` };
    },
  },

  // ═══════════════════ UTILITY / DEV (5) ═══════════════════
  deobfuscate_js: {
    kind: "read",
    description: "Deobfuscate obfuscated JavaScript code.",
    params: { code: "string" },
    endpoint: "/api/tools/deobfuscate",
    method: "POST",
    build: (a: any) => ({ body: { code: a.code } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "text", title: "Deobfuscated Code", result: (r.code || r.result || JSON.stringify(r)).slice(0, 3000) };
    },
  },
  deminify_code: {
    kind: "read",
    description: "Beautify minified JS/CSS/HTML/JSON.",
    params: { code: "string", language: "string (js/css/html/json)" },
    endpoint: "/api/tools/deminify",
    method: "POST",
    build: (a: any) => ({ body: { code: a.code, language: a.language || "js" } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "text", title: "Beautified Code", result: (r.code || r.result || "").slice(0, 3000) };
    },
  },
  auto_decode: {
    kind: "read",
    description: "Auto-detect and decode Base64, URL, Hex, JWT, ROT13.",
    params: { text: "string" },
    endpoint: "/api/tools/decode",
    method: "POST",
    build: (a: any) => ({ body: { text: a.text } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "text", title: `Decoded (${r.format || r.type || "auto"})`, result: r.decoded || r.result || JSON.stringify(r) };
    },
  },
  hash_tool: {
    kind: "read",
    description: "Generate a hash from text (md5, sha1, sha256, sha512).",
    params: { text: "string", algorithm: "string (md5/sha1/sha256/sha512)" },
    endpoint: "/api/tools/hash",
    method: "GET",
    build: (a: any) => ({ query: { text: a.text, algorithm: a.algorithm || "sha256" } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "text", title: `${(r.algorithm || "sha256").toUpperCase()} Hash`, result: r.hash };
    },
  },
  hash_identify: {
    kind: "read",
    description: "Identify the type of a hash (md5/sha1/sha256/etc).",
    params: { hash: "string" },
    endpoint: "/api/security/hash-identify",
    method: "GET",
    build: (a: any) => ({ query: { hash: a.hash } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "text", title: "Hash Type", result: `Type: ${r.type || r.name || "unknown"}\nConfidence: ${r.confidence || "medium"}` };
    },
  },

  // ═══════════════════ SOUND (2) ═══════════════════
  get_lyrics_pro: {
    kind: "read",
    description: "Get song lyrics from LRCLIB.",
    params: { q: "string (song title and artist)" },
    endpoint: "/download/lyrics",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q || a.query } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      return { type: "lyrics", title: data.title || data.trackName, artist: data.artist || data.artistName, lyrics: data.lyrics || data.plainLyrics || data.result };
    },
  },
  audio_effect: {
    kind: "action",
    description: "Apply an audio effect (bass, robot, nightcore, 8D, etc).",
    params: { url: "string (audio/video URL)", effect: "string (bass/bassboost/robot/chipmunk/deep/echo/nightcore/slowed/8d/vaporwave/karaoke)" },
    endpoint: "/api/audio/:effect",
    method: "GET",
    build: (a: any) => ({ query: { url: a.url } }),
    classify: (raw: any) => {
      const data = d_extra(raw);
      const r = data.result || data;
      return { type: "media", kind: "audio", title: `${r.effect || "effect"} applied`, url: r.url || r.downloadUrl || r.output, format: "mp3" };
    },
  },
};

// ─── Registration helper ───────────────────────────────────────────────
export function registerExtraTools(DOER_TOOLS: Record<string, any>): number {
  let count = 0;
  for (const [name, def] of Object.entries(EXTRA_TOOLS)) {
    if (!DOER_TOOLS[name]) {
      DOER_TOOLS[name] = def;
      count++;
    }
  }
  return count;
}

export { SELF_BASE_EXTRA, ADMIN_KEY_EXTRA };
