import { z } from "zod";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
  options?: string[];
}

export interface StatusCode {
  code: number;
  meaning: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  params: ApiParam[];
  format: string;
  category: string;
  categoryId: string;
  subcategory?: string;
  subcategoryId?: string;
  provider?: string;
  statusCodes: StatusCode[];
  createdAt: string;
  version: "v0" | "v1" | "v2";
  deprecated?: boolean;
  rateLimit?: number;
}

export interface ApiSubcategory {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  createdAt: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: ApiSubcategory[];
  createdAt: string;
}

export const searchResultSchema = z.object({
  title: z.string(),
  id: z.string(),
  size: z.string().optional(),
  duration: z.string().optional(),
  channelTitle: z.string().optional(),
  source: z.string().optional(),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  items: z.array(searchResultSchema),
});

export const downloadResponseSchema = z.object({
  success: z.boolean(),
  title: z.string().optional(),
  videoId: z.string().optional(),
  channelTitle: z.string().optional(),
  downloadUrl: z.string().optional(),
  format: z.enum(["mp3", "mp4"]).optional(),
  error: z.string().optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type DownloadResponse = z.infer<typeof downloadResponseSchema>;

// ─── STATUS CODES ────────────────────────────────────────────────────────────

const SC = {
  SUCCESS: { code: 200, meaning: "Success - Request completed successfully" },
  CREATED: { code: 201, meaning: "Created - Resource created successfully" },
  BAD_REQUEST: { code: 400, meaning: "Bad Request - Missing or invalid parameters" },
  UNAUTHORIZED: { code: 401, meaning: "Unauthorized - Invalid or missing API key" },
  FORBIDDEN: { code: 403, meaning: "Forbidden - Access denied" },
  NOT_FOUND: { code: 404, meaning: "Not Found - Resource or endpoint not found" },
  RATE_LIMITED: { code: 429, meaning: "Rate Limited - Too many requests, slow down" },
  SERVER_ERROR: { code: 500, meaning: "Internal Server Error - Something went wrong on our end" },
  BAD_GATEWAY: { code: 502, meaning: "Bad Gateway - Upstream service failed" },
  SERVICE_UNAVAILABLE: { code: 503, meaning: "Service Unavailable - Temporarily down for maintenance" },
  TIMEOUT: { code: 504, meaning: "Gateway Timeout - Upstream service timed out" },
};

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export const apiCategories: ApiCategory[] = [
  {
    id: "artificial-intelligence",
    name: "Artificial Intelligence",
    description: "AI-powered endpoints for chat, image generation, video generation, and specialized AI tools. Includes 40+ chat models, free image generation, AI video creation, and domain-specific AI assistants.",
    icon: "Brain",
    createdAt: "2025-10-15T08:00:00.000Z",
    subcategories: [
      {
        id: "ai-chat",
        name: "AI Chat",
        description: "Conversational AI models for text-based interactions. Includes GPT, Claude, Gemini, DeepSeek, Mistral, LLaMA, and 30+ other language models from ChatEverywhere, Overchat.ai, NoTrack.ai, and Pollinations.",
        categoryId: "artificial-intelligence",
        createdAt: "2025-10-15T08:00:00.000Z",
      },
      {
        id: "ai-image-generation",
        name: "AI Image Generation",
        description: "Generate images from text prompts using FLUX, SDXL, Turbo, Pollinations, MagicStudio, DALL-E style models, and specialized generators.",
        categoryId: "artificial-intelligence",
        createdAt: "2025-11-20T10:30:00.000Z",
      },
      {
        id: "ai-video-generation",
        name: "AI Video Generation",
        description: "Generate videos from text prompts with AI sound, aspect ratio control, and high-quality output using TXT2VI.",
        categoryId: "artificial-intelligence",
        createdAt: "2026-07-10T14:00:00.000Z",
      },
      {
        id: "ai-tools",
        name: "AI Tools",
        description: "AI-powered utilities including translation, summarization, code generation, content scanning, text humanization, and coding assistance.",
        categoryId: "artificial-intelligence",
        createdAt: "2025-12-01T09:00:00.000Z",
      },
      {
        id: "ai-specialized",
        name: "Specialized AI",
        description: "Domain-specific AI models: Bible AI (23 translations), Gita GPT (Bhagavad Gita), Muslim AI (Quran), Felo Search (with citations), PowerBrain AI, Gemini Lite, and Gandalf security AI.",
        categoryId: "artificial-intelligence",
        createdAt: "2026-07-01T11:00:00.000Z",
      },
    ],
  },
  {
    id: "media-downloader",
    name: "Media Downloader",
    description: "Download videos, audio, and content from YouTube, TikTok, Instagram, Facebook, Twitter/X, Spotify, SoundCloud, Snapchat, Pinterest, CapCut, Douyin, and more platforms.",
    icon: "Download",
    createdAt: "2025-10-15T08:00:00.000Z",
    subcategories: [
      {
        id: "youtube",
        name: "YouTube",
        description: "YouTube video and audio download in multiple qualities, search, video info, lyrics, thumbnails, community posts, and streaming endpoints.",
        categoryId: "media-downloader",
        createdAt: "2025-10-15T08:00:00.000Z",
      },
      {
        id: "social-media",
        name: "Social Media",
        description: "Download from TikTok, Instagram, Facebook, Twitter/X, Snapchat, Pinterest, CapCut, Douyin, Rednote, SnackVideo, and Lahelu.",
        categoryId: "media-downloader",
        createdAt: "2025-10-20T10:00:00.000Z",
      },
      {
        id: "music-streaming",
        name: "Music Streaming",
        description: "Spotify search/download/info, SoundCloud search/download, Shazam search/recognize, and music metadata endpoints.",
        categoryId: "media-downloader",
        createdAt: "2025-11-10T12:00:00.000Z",
      },
    ],
  },
  {
    id: "search",
    name: "Search & Discovery",
    description: "Search across multiple platforms: Wikipedia, News, GitHub, NPM, Reddit, Stack Overflow, images, videos, and specialized search engines like Gitagram, MangaToon, MCPEDL, and more.",
    icon: "Search",
    createdAt: "2025-10-15T08:00:00.000Z",
    subcategories: [
      {
        id: "web-search",
        name: "Web Search",
        description: "General web search: Wikipedia, News, Urban Dictionary, Emoji, Country info, and knowledge base queries.",
        categoryId: "search",
        createdAt: "2025-10-15T08:00:00.000Z",
      },
      {
        id: "developer-search",
        name: "Developer Search",
        description: "Search GitHub repositories, NPM packages, PyPI packages, and Stack Overflow questions.",
        categoryId: "search",
        createdAt: "2025-10-25T09:00:00.000Z",
      },
      {
        id: "media-search",
        name: "Media Search",
        description: "Image search, video search, YouTube search, and multimedia discovery.",
        categoryId: "search",
        createdAt: "2025-11-15T11:00:00.000Z",
      },
      {
        id: "specialized-search",
        name: "Specialized Search",
        description: "Platform-specific search: SoundCloud, Spotify, AN1 APK, Gitagram chords, Lahelu, MangaToon, MCPEDL, MyInstants, Otakotaku, ResepKoki recipes.",
        categoryId: "search",
        createdAt: "2026-07-01T10:00:00.000Z",
      },
    ],
  },
  {
    id: "stalker",
    name: "Stalker & OSINT",
    description: "Profile lookup and information gathering tools for GitHub, Roblox, TikTok, YouTube, Instagram, Twitter, Telegram, IP addresses, and NPM packages.",
    icon: "Eye",
    createdAt: "2025-11-01T09:00:00.000Z",
    subcategories: [
      {
        id: "profile-lookup",
        name: "Profile Lookup",
        description: "Look up user profiles from GitHub, Roblox, TikTok, YouTube, Instagram, Twitter/X, and Telegram with detailed statistics.",
        categoryId: "stalker",
        createdAt: "2025-11-01T09:00:00.000Z",
      },
      {
        id: "network-tools",
        name: "Network & Package Tools",
        description: "IP geolocation, NPM package lookup, and network information gathering.",
        categoryId: "stalker",
        createdAt: "2025-12-01T10:00:00.000Z",
      },
    ],
  },
  {
    id: "security",
    name: "Security & Hacking",
    description: "Ethical hacking and security analysis tools. Includes 35+ endpoints for network security, web security, vulnerability scanning, and OSINT.",
    icon: "ShieldCheck",
    createdAt: "2025-11-20T10:00:00.000Z",
    subcategories: [
      {
        id: "network-security",
        name: "Network Security",
        description: "Port scanning, DNS lookup, WHOIS, traceroute, ASN lookup, MAC lookup, ping, and latency testing.",
        categoryId: "security",
        createdAt: "2025-11-20T10:00:00.000Z",
      },
      {
        id: "web-security",
        name: "Web Security",
        description: "Vulnerability scanning, security headers, WAF detection, XSS/SQLi/CSRF checks, directory scanning, and web analysis.",
        categoryId: "security",
        createdAt: "2025-12-10T11:00:00.000Z",
      },
      {
        id: "hash-tools",
        name: "Hash & Crypto Tools",
        description: "Hash identification, hash generation, and password strength checking.",
        categoryId: "security",
        createdAt: "2026-01-05T09:00:00.000Z",
      },
    ],
  },
  {
    id: "tools",
    name: "Tools & Utilities",
    description: "General utilities: QR codes, text processing, converters, calculators, developer tools, encoding, PDF generation, and more.",
    icon: "Wrench",
    createdAt: "2025-10-15T08:00:00.000Z",
    subcategories: [
      {
        id: "text-tools",
        name: "Text Tools",
        description: "Text processing, Base64, URL encoding, hashing, UUID generation, and analysis tools.",
        categoryId: "tools",
        createdAt: "2025-10-15T08:00:00.000Z",
      },
      {
        id: "developer-tools",
        name: "Developer Tools",
        description: "Code deobfuscation, deminification, sandboxing, headless browsing, auto-decode, and development utilities.",
        categoryId: "tools",
        createdAt: "2025-12-01T09:00:00.000Z",
      },
      {
        id: "converter",
        name: "Converters",
        description: "Media conversion: images to stickers, videos to GIFs, format conversions, and audio effects processing.",
        categoryId: "tools",
        createdAt: "2026-01-10T10:00:00.000Z",
      },
      {
        id: "math-tools",
        name: "Math Tools",
        description: "Prime checker, factorial, Fibonacci, BMI calculator, random number generator, and mathematical utilities.",
        categoryId: "tools",
        createdAt: "2026-03-01T11:00:00.000Z",
      },
      {
        id: "pdf-tools",
        name: "PDF Tools",
        description: "PDF generation with custom formatting, invoice creation, and document generation.",
        categoryId: "tools",
        createdAt: "2026-08-01T10:00:00.000Z",
      },
      {
        id: "auth-tools",
        name: "Auth Tools",
        description: "OTP generation, OTP verification, and authentication utilities.",
        categoryId: "tools",
        createdAt: "2026-07-20T09:00:00.000Z",
      },
      {
        id: "encoding-tools",
        name: "Encoding Tools",
        description: "Hex, binary, ROT13, Morse code, and JWT encoding/decoding.",
        categoryId: "tools",
        createdAt: "2026-04-01T10:00:00.000Z",
      },
      {
        id: "qr-tools",
        name: "QR Tools",
        description: "QR code generation for WiFi, vCard contacts, and general use.",
        categoryId: "tools",
        createdAt: "2026-05-01T09:00:00.000Z",
      },
    ],
  },
  {
    id: "fun",
    name: "Fun & Entertainment",
    description: "Jokes, memes, quotes, games, anime, and entertainment content for engaging user experiences.",
    icon: "Laugh",
    createdAt: "2025-10-15T08:00:00.000Z",
    subcategories: [
      {
        id: "jokes-quotes",
        name: "Jokes & Quotes",
        description: "Jokes, quotes, pickup lines, roasts, compliments, and fun text content.",
        categoryId: "fun",
        createdAt: "2025-10-15T08:00:00.000Z",
      },
      {
        id: "games",
        name: "Games",
        description: "Rock Paper Scissors, flag guessing, word scramble, number guess, 8-ball, trivia, and this-day-in-history.",
        categoryId: "fun",
        createdAt: "2025-11-01T09:00:00.000Z",
      },
      {
        id: "anime",
        name: "Anime",
        description: "Anime images, GIFs, and reactions from waifu.pics and nekos.best (30 types).",
        categoryId: "fun",
        createdAt: "2025-11-15T10:00:00.000Z",
      },
      {
        id: "content",
        name: "Content",
        description: "Memes, facts, riddles, trivia, cat facts, and random content generation.",
        categoryId: "fun",
        createdAt: "2026-02-01T11:00:00.000Z",
      },
      {
        id: "fun-data",
        name: "Fun Data",
        description: "Kenyan proverbs, Swahili phrases, dad jokes, affirmations, fortune cookies, and cultural content.",
        categoryId: "fun",
        createdAt: "2025-12-15T10:00:00.000Z",
      },
    ],
  },
  {
    id: "data",
    name: "Data & Information",
    description: "Real-world data: news, crypto, forex, sports, education, jobs, zodiac, and reference information.",
    icon: "Database",
    createdAt: "2025-11-01T09:00:00.000Z",
    subcategories: [
      {
        id: "news",
        name: "News",
        description: "Kenyan news from Tuko, Nation, Standard, Kenyans.co.ke, and global news.",
        categoryId: "data",
        createdAt: "2025-11-01T09:00:00.000Z",
      },
      {
        id: "crypto",
        name: "Crypto",
        description: "Live cryptocurrency prices and top 10 coins from CoinGecko.",
        categoryId: "data",
        createdAt: "2025-12-01T10:00:00.000Z",
      },
      {
        id: "forex",
        name: "Forex",
        description: "Live exchange rates and currency conversion.",
        categoryId: "data",
        createdAt: "2025-12-01T10:00:00.000Z",
      },
      {
        id: "sports",
        name: "Sports",
        description: "Live scores, fixtures, team and player data, league standings from TheSportsDB.",
        categoryId: "data",
        createdAt: "2026-01-15T11:00:00.000Z",
      },
      {
        id: "education",
        name: "Education",
        description: "Academic papers, books, dictionary, and learning resources.",
        categoryId: "data",
        createdAt: "2026-02-01T12:00:00.000Z",
      },
      {
        id: "jobs",
        name: "Jobs",
        description: "Kenyan job listings from BrighterMonday.",
        categoryId: "data",
        createdAt: "2026-01-20T10:00:00.000Z",
      },
      {
        id: "zodiac",
        name: "Zodiac",
        description: "Zodiac signs, horoscopes, compatibility, and elements.",
        categoryId: "data",
        createdAt: "2025-11-25T09:00:00.000Z",
      },
    ],
  },
  {
    id: "media",
    name: "Media & Streaming",
    description: "Movie and TV show streaming from TMDB, Moviebox, LK21, SeeGore, and Tokusatsu with direct MP4 links.",
    icon: "Film",
    createdAt: "2026-05-01T10:00:00.000Z",
    subcategories: [
      {
        id: "movie-streaming",
        name: "Movie Streaming",
        description: "TMDB search/details, Moviebox streaming, LK21 movies, and movie metadata.",
        categoryId: "media",
        createdAt: "2026-05-01T10:00:00.000Z",
      },
      {
        id: "anime-streaming",
        name: "Anime & Tokusatsu",
        description: "Tokusatsu (Kamen Rider, Super Sentai, Ultraman) episode streaming and search.",
        categoryId: "media",
        createdAt: "2026-06-01T11:00:00.000Z",
      },
      {
        id: "gore-streaming",
        name: "SeeGore",
        description: "SeeGore video streaming with direct MP4 links and search.",
        categoryId: "media",
        createdAt: "2026-05-15T10:00:00.000Z",
      },
    ],
  },
  {
    id: "text-effects",
    name: "Text Effects",
    description: "Text effect generators: neon, 3D, chrome, fire, glitter, and 500+ effects from Ephoto360, PhotoFunia, and TextPro.",
    icon: "Type",
    createdAt: "2025-12-15T11:00:00.000Z",
    subcategories: [
      {
        id: "ephoto",
        name: "Ephoto360",
        description: "110+ text effects from Ephoto360: neon, 3D, fire, glitch, artistic, and more.",
        categoryId: "text-effects",
        createdAt: "2025-12-15T11:00:00.000Z",
      },
      {
        id: "photofunia",
        name: "PhotoFunia",
        description: "340+ photo effects from PhotoFunia: filters, billboards, cards, frames, and more.",
        categoryId: "text-effects",
        createdAt: "2026-01-01T09:00:00.000Z",
      },
      {
        id: "textpro",
        name: "TextPro",
        description: "109 text effect generators from TextPro: neon, 3D, chrome, fire, and more.",
        categoryId: "text-effects",
        createdAt: "2026-02-15T10:00:00.000Z",
      },
    ],
  },
  {
    id: "url",
    name: "URL & Hosting",
    description: "URL shortening and image hosting services for quick sharing.",
    icon: "Link",
    createdAt: "2025-11-10T10:00:00.000Z",
    subcategories: [
      {
        id: "url-shortener",
        name: "URL Shortener",
        description: "Shorten URLs using TinyURL, is.gd, v.gd, CleanURI, Chilp.it, clck.ru, and da.gd.",
        categoryId: "url",
        createdAt: "2025-11-10T10:00:00.000Z",
      },
      {
        id: "image-hosting",
        name: "Image Hosting",
        description: "Upload images to ImgBB and Catbox hosting services.",
        categoryId: "url",
        createdAt: "2025-12-01T11:00:00.000Z",
      },
    ],
  },
  {
    id: "scraping",
    name: "Scraping",
    description: "Website scraping tools: extract links, inspect sites, scripts, cookies, and full page scraping.",
    icon: "Globe",
    createdAt: "2025-12-10T10:00:00.000Z",
    subcategories: [
      {
        id: "web-scraping",
        name: "Web Scraping",
        description: "Link extraction, site inspection, script extraction, cookie retrieval, and full-page scraping.",
        categoryId: "scraping",
        createdAt: "2025-12-10T10:00:00.000Z",
      },
    ],
  },
  {
    id: "image-processing",
    name: "Image Processing",
    description: "Image manipulation tools: blur faces, compress, remove background, and upscale images.",
    icon: "Image",
    createdAt: "2026-07-01T10:00:00.000Z",
    subcategories: [
      {
        id: "image-tools",
        name: "Image Tools",
        description: "Face blurring, image compression, background removal, and image upscaling.",
        categoryId: "image-processing",
        createdAt: "2026-07-01T10:00:00.000Z",
      },
    ],
  },

  {
    id: "sticker",
    name: "Sticker",
    description: "Sticker pack search and details from Sticker.ly. Search Telegram sticker packs, get pack details, author info, and sticker images.",
    icon: "Sticker",
    createdAt: "2026-08-01T10:00:00.000Z",
    subcategories: [
      {
        id: "stickerly",
        name: "Stickerly",
        description: "Sticker.ly sticker pack search and details - search packs by keyword, get pack info, author details, and sticker images.",
        categoryId: "sticker",
        createdAt: "2026-08-01T10:00:00.000Z",
      },
    ],
  },
  {
    id: "admin",
    name: "Admin & Management",
    description: "API management, analytics, error reporting, API keys, and administrative endpoints.",
    icon: "Settings",
    createdAt: "2025-10-15T08:00:00.000Z",
    subcategories: [
      {
        id: "analytics",
        name: "Analytics",
        description: "API usage statistics, request tracking, and performance metrics.",
        categoryId: "admin",
        createdAt: "2026-07-15T10:00:00.000Z",
      },
      {
        id: "management",
        name: "Management",
        description: "API key management, admin settings, IP blocking, and configuration.",
        categoryId: "admin",
        createdAt: "2025-10-15T08:00:00.000Z",
      },
      {
        id: "api-keys",
        name: "API Keys",
        description: "API key generation, validation, usage tracking, and key management.",
        categoryId: "admin",
        createdAt: "2025-10-15T08:00:00.000Z",
      },
    ],
  },
];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

function createEndpoint(
  path: string,
  method: string,
  description: string,
  params: ApiParam[],
  format: string,
  categoryId: string,
  subcategoryId: string,
  version: "v0" | "v1" | "v2",
  createdAt: string,
  provider?: string,
  statusCodes: StatusCode[] = [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR],
  rateLimit?: number,
): ApiEndpoint {
  const category = apiCategories.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subcategoryId);
  return {
    path,
    method,
    description,
    params,
    format,
    category: category?.name || categoryId,
    categoryId,
    subcategory: subcategory?.name || subcategoryId,
    subcategoryId,
    provider,
    statusCodes,
    createdAt,
    version,
    rateLimit,
  };
}

// ─── COMMON PARAMS ───────────────────────────────────────────────────────────

const Q_PARAM = [{ name: "q", type: "string", required: true, description: "Your message or question", default: "Hello! How are you?" }];
const URL_PARAM = [{ name: "url", type: "string", required: true, description: "URL to process", default: "https://example.com" }];
const IMAGE_PARAM = [{ name: "image", type: "string", required: true, description: "Image URL to process", default: "https://example.com/image.jpg" }];

// ─── BIBLE TRANSLATIONS ──────────────────────────────────────────────────────

const BIBLE_TRANSLATIONS = [
  "ESV", "KJV11", "ASV14", "NASB20", "CUV", "LSG", "LUT", "TB", "DB1885", "NR06",
  "polUBG", "AA", "RVR09", "SKB", "SV1917", "KJV", "IRVBen", "nld1939", "NBG",
  "IRVHin", "PaBa", "IRVUrd", "DGV", "ERVVI"
];

// ─── AI CHAT ENDPOINTS (v0 - Oct 2025) ──────────────────────────────────────

const aiChatV0Endpoints: ApiEndpoint[] = [
  createEndpoint("/api/ai/gpt", "GET", "Chat with GPT - OpenAI's general purpose AI assistant for natural language understanding, generation, and reasoning.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-15T08:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/claude", "GET", "Chat with Claude - Anthropic's AI assistant known for thoughtful, nuanced conversation and analysis.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-15T08:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/mistral", "GET", "Chat with Mistral - European AI model for efficient and accurate responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-16T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/gemini", "GET", "Chat with Gemini - Google's multimodal AI assistant with strong reasoning capabilities.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-16T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/deepseek", "GET", "Chat with DeepSeek - Advanced AI model with strong reasoning and problem-solving abilities.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-18T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/venice", "GET", "Chat with Venice - Privacy-focused AI assistant for secure conversations.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-20T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/groq", "GET", "Chat with Groq - Ultra-fast AI inference engine for rapid responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-22T12:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/cohere", "GET", "Chat with Cohere - Enterprise-focused AI model for business applications.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-25T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/llama", "GET", "Chat with LLaMA - Meta's open-source language model for general conversation.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-10-28T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/mixtral", "GET", "Chat with Mixtral - Mixture of experts AI model for diverse tasks.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-01T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/phi", "GET", "Chat with Phi - Microsoft's compact but powerful language model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-03T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/qwen", "GET", "Chat with Qwen - Alibaba's language model for multilingual conversations.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-05T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/falcon", "GET", "Chat with Falcon - TII's open-source AI model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-08T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/vicuna", "GET", "Chat with Vicuna - Open-source chatbot fine-tuned for conversation.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-10T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/openchat", "GET", "Chat with OpenChat - Open-source conversational AI model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-12T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/wizard", "GET", "Chat with WizardLM - Instruction-following AI for complex tasks.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-15T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/zephyr", "GET", "Chat with Zephyr - Chat-tuned AI model for natural conversation.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-18T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/codellama", "GET", "Chat with CodeLlama - Code-specialized AI for programming help.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-20T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/starcoder", "GET", "Chat with StarCoder - Code generation AI for developers.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-22T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/dolphin", "GET", "Chat with Dolphin - Uncensored AI model for unrestricted conversations.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-25T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/nous", "GET", "Chat with Nous Hermes - Powerful AI by Nous Research.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-11-28T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/openhermes", "GET", "Chat with OpenHermes - Highly capable instruction-following AI.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-01T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/neural", "GET", "Chat with NeuralChat - Intel's AI model for general use.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-03T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/solar", "GET", "Chat with Solar - Upstage's AI model for efficient responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-05T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/yi", "GET", "Chat with Yi - Bilingual language model for Chinese and English.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-08T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/tinyllama", "GET", "Chat with TinyLlama - Compact but capable AI model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-10T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/orca", "GET", "Chat with Orca - Microsoft's reasoning-focused AI model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-12T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/command", "GET", "Chat with Command R - Cohere's enterprise AI model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-15T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/nemotron", "GET", "Chat with Nemotron - NVIDIA's AI model for advanced tasks.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-18T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/internlm", "GET", "Chat with InternLM - Multilingual AI for diverse conversations.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-20T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chatglm", "GET", "Chat with ChatGLM - Bilingual model by Zhipu AI.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-22T11:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/wormgpt", "GET", "Chat with WormGPT - Unrestricted AI model (use responsibly).", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-25T09:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ai/replit", "GET", "Chat with Replit AI - Coding assistant for code generation and debugging.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v0", "2025-12-28T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

// ─── AI CHAT ENDPOINTS (v2 - July 2026) ─────────────────────────────────────

const aiChatV2Endpoints: ApiEndpoint[] = [
  createEndpoint("/api/ai/chat/claude", "GET", "Chat with Claude Haiku 4.5 - Premium Anthropic AI model via Overchat.ai for high-quality responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-05T08:00:00.000Z", "Overchat.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/gpt5", "GET", "Chat with GPT-4.1 Nano - OpenAI's latest compact model via Overchat.ai.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-05T08:00:00.000Z", "Overchat.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/deepseek", "GET", "Chat with DeepSeek V3.2 - Advanced non-thinking AI via Overchat.ai.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-06T09:00:00.000Z", "Overchat.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/normal", "GET", "Chat with NoTrack.ai normal persona - balanced, natural responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-10T10:00:00.000Z", "NoTrack.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/concise", "GET", "Chat with NoTrack.ai concise persona - brief, to-the-point responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-10T10:00:00.000Z", "NoTrack.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/detailed", "GET", "Chat with NoTrack.ai detailed persona - comprehensive, thorough responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-11T11:00:00.000Z", "NoTrack.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/creative", "GET", "Chat with NoTrack.ai creative persona - imaginative, artistic responses.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-11T11:00:00.000Z", "NoTrack.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/mistral-p", "GET", "Chat with Mistral via Pollinations.ai - text generation model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-15T09:00:00.000Z", "Pollinations.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/llama-p", "GET", "Chat with Llama via Pollinations.ai - open-source text model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-15T09:00:00.000Z", "Pollinations.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/chat/gpt-p", "GET", "Chat with GPT via Pollinations.ai - text generation model.", Q_PARAM, "json", "artificial-intelligence", "ai-chat", "v2", "2026-07-15T09:00:00.000Z", "Pollinations.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

// ─── SPECIALIZED AI ENDPOINTS (v2 - July 2026) ─────────────────────────────

const specializedAIEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/ai/felo", "GET", "Felo Search AI - Search with sources and citations. Returns comprehensive answers with reference links.", [{ name: "q", type: "string", required: true, description: "Search query or question", default: "What is AI?" }], "json", "artificial-intelligence", "ai-specialized", "v2", "2026-07-05T08:00:00.000Z", "Felo.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/bibleai", "GET", "Bible AI - AI-powered Bible search with 23 translations. Ask questions and get answers grounded in scripture.", [
    { name: "q", type: "string", required: true, description: "Bible question or topic", default: "What is faith?" },
    { name: "translation", type: "string", required: false, description: "Bible translation code", default: "ESV", options: BIBLE_TRANSLATIONS }
  ], "json", "artificial-intelligence", "ai-specialized", "v2", "2026-07-10T09:00:00.000Z", "BibleAI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/gita", "GET", "Gita GPT - Spiritual AI based on the Bhagavad Gita. Get answers to philosophical and spiritual questions.", [{ name: "q", type: "string", required: true, description: "Question about life, karma, dharma, or spirituality", default: "What is karma?" }], "json", "artificial-intelligence", "ai-specialized", "v2", "2026-07-12T10:00:00.000Z", "GitaGPT", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/muslimai", "GET", "Muslim AI - Islamic AI with Quran references. Get answers grounded in Islamic teachings.", [{ name: "q", type: "string", required: true, description: "Question about Islam, Quran, or prayer", default: "What is prayer?" }], "json", "artificial-intelligence", "ai-specialized", "v2", "2026-07-15T11:00:00.000Z", "MuslimAI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/powerbrainai", "GET", "PowerBrain AI - General purpose chat assistant for everyday questions and conversations.", [{ name: "q", type: "string", required: true, description: "Your message or question", default: "Hello" }], "json", "artificial-intelligence", "ai-specialized", "v2", "2026-07-18T09:00:00.000Z", "PowerBrain AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/gemini-lite", "GET", "Gemini 2.0 Flash Lite - Google's lightweight AI model for fast responses with optional system prompt.", [
    { name: "q", type: "string", required: true, description: "Your prompt or question", default: "Say hello" },
    { name: "system", type: "string", required: false, description: "Optional system prompt to guide the AI", default: "" }
  ], "json", "artificial-intelligence", "ai-specialized", "v2", "2026-07-20T10:00:00.000Z", "Gemini", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/gandalf", "GET", "Gandalf Security AI - Test AI prompts against security vulnerabilities. Part of Lakera's security platform.", [
    { name: "q", type: "string", required: true, description: "Prompt to test", default: "Hello" },
    { name: "system", type: "string", required: false, description: "Optional system prompt", default: "" }
  ], "json", "artificial-intelligence", "ai-specialized", "v2", "2026-07-22T11:00:00.000Z", "Lakera", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

// ─── AI IMAGE GENERATION ENDPOINTS ──────────────────────────────────────────

const aiImageEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/ai/image/dall-e", "POST", "Generate AI images using DALL-E style model - text to image generation.", [{ name: "prompt", type: "string", required: true, description: "Image description", default: "a wolf howling at the moon" }], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-10-20T10:00:00.000Z", "ChatEverywhere", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ai/image/pixabay", "GET", "Search and get stock images by keyword from Unsplash and Picsum.", [
    { name: "q", type: "string", required: true, description: "Search query", default: "wolf" },
    { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-10-25T11:00:00.000Z", "Unsplash + Picsum", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/image/lorem-picsum", "GET", "Get random placeholder image from Lorem Picsum.", [
    { name: "width", type: "number", required: false, description: "Image width (default 800)", default: "800" },
    { name: "height", type: "number", required: false, description: "Image height (default 600)", default: "600" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-11-01T09:00:00.000Z", "Lorem Picsum", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/image/lorem-flickr", "GET", "Get random themed image from LoremFlickr.", [
    { name: "q", type: "string", required: true, description: "Image theme keyword", default: "wolf" },
    { name: "width", type: "number", required: false, description: "Image width (default 800)", default: "800" },
    { name: "height", type: "number", required: false, description: "Image height (default 600)", default: "600" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-11-05T10:00:00.000Z", "LoremFlickr", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/image/dog", "GET", "Get random dog image from Dog CEO API.", [], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-11-10T11:00:00.000Z", "Dog CEO", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/image/cat", "GET", "Get random cat image from CATAAS.", [], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-11-12T09:00:00.000Z", "CATAAS", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/image/pollinations", "GET", "Generate AI image using Stable Diffusion via Pollinations - free, no API key required.", [
    { name: "q", type: "string", required: true, description: "Image prompt", default: "beautiful landscape" },
    { name: "width", type: "number", required: false, description: "Width (default 1024)", default: "1024" },
    { name: "height", type: "number", required: false, description: "Height (default 1024)", default: "1024" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-11-15T10:00:00.000Z", "Pollinations AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ai/image/flux", "GET", "Generate high-quality AI image using FLUX model via Pollinations.", [
    { name: "prompt", type: "string", required: true, description: "Image prompt", default: "cyberpunk city" },
    { name: "width", type: "number", required: false, description: "Width (default 512)", default: "512" },
    { name: "height", type: "number", required: false, description: "Height (default 512)", default: "512" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v2", "2026-07-01T08:00:00.000Z", "Pollinations.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ai/image/sdxl", "GET", "Generate AI image using SDXL model via Pollinations.", [
    { name: "prompt", type: "string", required: true, description: "Image prompt", default: "cyberpunk city" },
    { name: "width", type: "number", required: false, description: "Width", default: "512" },
    { name: "height", type: "number", required: false, description: "Height", default: "512" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v2", "2026-07-02T09:00:00.000Z", "Pollinations.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ai/image/turbo", "GET", "Generate AI image using Turbo model via Pollinations - fastest generation.", [
    { name: "prompt", type: "string", required: true, description: "Image prompt", default: "dragon" },
    { name: "width", type: "number", required: false, description: "Width", default: "512" },
    { name: "height", type: "number", required: false, description: "Height", default: "512" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v2", "2026-07-03T10:00:00.000Z", "Pollinations.ai", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ai/image/art", "GET", "Generate artistic AI image with style control via Pollinations.", [
    { name: "q", type: "string", required: true, description: "Image prompt", default: "dragon" },
    { name: "style", type: "string", required: false, description: "Art style (realistic, fantasy, etc.)", default: "fantasy" }
  ], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-11-20T11:00:00.000Z", "Pollinations AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ai/image/anime", "GET", "Generate anime-style AI image (Studio Ghibli inspired) via Pollinations.", [{ name: "q", type: "string", required: true, description: "Image prompt", default: "samurai" }], "json", "artificial-intelligence", "ai-image-generation", "v0", "2025-11-25T09:00:00.000Z", "Pollinations AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v1/ai/image/magicstudio", "GET", "Generate AI art using MagicStudio - returns actual image bytes, no API key required.", [{ name: "prompt", type: "string", required: true, description: "Image prompt", default: "a cute cat" }], "image", "artificial-intelligence", "ai-image-generation", "v1", "2026-05-10T11:00:00.000Z", "MagicStudio", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
];

// ─── AI VIDEO GENERATION ────────────────────────────────────────────────────

const aiVideoEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/ai/video/generate", "POST", "Generate video from text prompt with AI sound, aspect ratio control, and unlimited generation with device rotation.", [
    { name: "prompt", type: "string", required: true, description: "Video prompt", default: "a cat playing piano" },
    { name: "aspect_ratio", type: "string", required: false, description: "Aspect ratio (auto, 1:1, 16:9, 9:16)", default: "auto", options: ["auto", "1:1", "16:9", "9:16"] },
    { name: "ai_sound", type: "boolean", required: false, description: "Add AI sound/voice to video", default: "true" }
  ], "json", "artificial-intelligence", "ai-video-generation", "v2", "2026-07-10T14:00:00.000Z", "TXT2VI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR, SC.TIMEOUT], 10),
];

// ─── AI TOOLS ───────────────────────────────────────────────────────────────

const aiToolEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/ai/translate", "POST", "AI-powered text translation between languages.", [
    { name: "text", type: "string", required: true, description: "Text to translate", default: "Hello, how are you?" },
    { name: "to", type: "string", required: false, description: "Target language (default: en)", default: "es" },
    { name: "from", type: "string", required: false, description: "Source language (default: auto)", default: "en" }
  ], "json", "artificial-intelligence", "ai-tools", "v0", "2025-12-01T09:00:00.000Z", "Megan AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/summarize", "POST", "AI-powered text summarization for articles, documents, and long text.", [{ name: "text", type: "string", required: true, description: "Text to summarize", default: "Artificial intelligence is the simulation of human intelligence processes by machines..." }], "json", "artificial-intelligence", "ai-tools", "v0", "2025-12-05T10:00:00.000Z", "Megan AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/code", "POST", "AI code generation assistant for multiple programming languages.", [
    { name: "prompt", type: "string", required: true, description: "Code task description", default: "Write a function to reverse a string" },
    { name: "language", type: "string", required: false, description: "Programming language (python, javascript, etc.)", default: "python" }
  ], "json", "artificial-intelligence", "ai-tools", "v0", "2025-12-10T11:00:00.000Z", "Megan AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/scanner", "POST", "AI content scanner - detect if text is AI-generated or human-written.", [{ name: "text", type: "string", required: true, description: "Text to scan for AI detection", default: "The rapid development of artificial intelligence..." }], "json", "artificial-intelligence", "ai-tools", "v0", "2025-12-15T09:00:00.000Z", "Megan AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ai/humanizer", "POST", "AI text humanizer - rewrite AI-generated text to sound human-written.", [{ name: "text", type: "string", required: true, description: "AI-generated text to humanize", default: "The rapid development of artificial intelligence..." }], "json", "artificial-intelligence", "ai-tools", "v0", "2025-12-20T10:00:00.000Z", "Megan AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

// ─── ALL ENDPOINTS ──────────────────────────────────────────────────────────

// ─── MEDIA DOWNLOADER - YOUTUBE ENDPOINTS ──────────────────────────────────

const youtubeEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/search", "GET", "Search for songs by keyword across multiple providers. Returns title, ID, size, duration, and channel info.", [{ name: "q", type: "string", required: true, description: "Search query (song name, artist, etc.)", default: "Home NF" }], "json", "media-downloader", "youtube", "v0", "2025-10-15T08:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/download/mp3", "GET", "Download YouTube audio as MP3. Accepts YouTube URL or song name for search.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp3", "media-downloader", "youtube", "v0", "2025-10-15T08:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/mp4", "GET", "Download YouTube video as MP4. Accepts YouTube URL or song name for search.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp4", "media-downloader", "youtube", "v0", "2025-10-15T08:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/audio", "GET", "Extract audio from YouTube video in MP3 format.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp3", "media-downloader", "youtube", "v0", "2025-10-15T08:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/ytmp3", "GET", "Convert YouTube video to MP3 audio file.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp3", "media-downloader", "youtube", "v0", "2025-10-16T09:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/dlmp3", "GET", "Direct MP3 download from YouTube.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp3", "media-downloader", "youtube", "v0", "2025-10-16T09:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/yta", "GET", "YouTube Audio extractor (primary endpoint).", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp3", "media-downloader", "youtube", "v0", "2025-10-18T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/yta2", "GET", "YouTube Audio extractor (secondary endpoint).", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp3", "media-downloader", "youtube", "v0", "2025-10-18T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/yta3", "GET", "YouTube Audio extractor (tertiary endpoint).", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp3", "media-downloader", "youtube", "v0", "2025-10-20T11:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/ytmp4", "GET", "Convert YouTube video to MP4 format.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp4", "media-downloader", "youtube", "v0", "2025-10-20T11:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/ytmp5", "GET", "Get both MP3 and MP4 download URLs in one response.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "json", "media-downloader", "youtube", "v0", "2025-10-22T09:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/dlmp4", "GET", "Direct MP4 download from YouTube.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp4", "media-downloader", "youtube", "v0", "2025-10-22T09:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/video", "GET", "Extract video from YouTube in MP4 format.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp4", "media-downloader", "youtube", "v0", "2025-10-25T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/hd", "GET", "Download YouTube video in HD quality.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "mp4", "media-downloader", "youtube", "v0", "2025-10-25T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/download/lyrics", "GET", "Get song lyrics by name using LRCLIB.", [{ name: "q", type: "string", required: true, description: "Song name and artist", default: "Home NF" }], "json", "media-downloader", "youtube", "v0", "2025-10-28T11:00:00.000Z", "LRCLIB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/stream", "GET", "Stream audio/video with direct playback support.", [
    { name: "q", type: "string", required: true, description: "YouTube URL or search query", default: "" },
    { name: "type", type: "string", required: false, description: "mp3 or mp4", default: "mp3", options: ["mp3", "mp4"] }
  ], "stream", "media-downloader", "youtube", "v0", "2025-11-01T09:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/proxy", "GET", "Proxy media content with proper headers for streaming.", [{ name: "url", type: "string", required: true, description: "Media URL to proxy", default: "" }], "stream", "media-downloader", "youtube", "v0", "2025-11-01T09:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/youtube", "GET", "Download YouTube videos in multiple qualities with metadata.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Video name to search", default: "Home NF" }
  ], "json", "media-downloader", "youtube", "v0", "2025-11-05T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/youtube/mp3", "GET", "Download YouTube video as MP3 audio with metadata.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }
  ], "json", "media-downloader", "youtube", "v0", "2025-11-05T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/youtube/mp4", "GET", "Download YouTube video as MP4 with metadata.", [
    { name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" },
    { name: "q", type: "string", required: false, description: "Video name to search", default: "Home NF" }
  ], "json", "media-downloader", "youtube", "v0", "2025-11-05T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/youtube/info", "GET", "Get YouTube video info without downloading.", [{ name: "url", type: "string", required: true, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }], "json", "media-downloader", "youtube", "v0", "2025-11-08T11:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/download/youtube/search", "GET", "Search YouTube videos with metadata.", [{ name: "q", type: "string", required: true, description: "Search query", default: "Home NF" }], "json", "media-downloader", "youtube", "v0", "2025-11-08T11:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/music/search", "GET", "Search music across multiple platforms.", [{ name: "q", type: "string", required: true, description: "Search query", default: "Home NF" }], "json", "media-downloader", "youtube", "v0", "2025-11-10T09:00:00.000Z", "Multi", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/music/trending", "GET", "Get trending music across platforms.", [], "json", "media-downloader", "youtube", "v0", "2025-11-10T09:00:00.000Z", "Multi", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/music/artist", "GET", "Search artist information.", [{ name: "q", type: "string", required: true, description: "Artist name", default: "NF" }], "json", "media-downloader", "youtube", "v0", "2025-11-12T10:00:00.000Z", "Multi", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/youtube", "GET", "Search YouTube videos with full metadata.", [{ name: "q", type: "string", required: true, description: "Search query", default: "music" }], "json", "media-downloader", "youtube", "v0", "2025-11-15T11:00:00.000Z", "YouTube", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/youtube/trending", "GET", "Get trending YouTube videos.", [], "json", "media-downloader", "youtube", "v0", "2025-11-15T11:00:00.000Z", "YouTube", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/youtube/recommend", "GET", "Get YouTube video recommendations based on a video ID.", [{ name: "id", type: "string", required: true, description: "Video ID", default: "dQw4w9WgXcQ" }], "json", "media-downloader", "youtube", "v0", "2025-11-18T09:00:00.000Z", "YouTube", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/social/youtube-thumbnails", "GET", "Get all YouTube thumbnail sizes for a video.", [{ name: "url", type: "string", required: true, description: "YouTube video URL or ID", default: "https://youtu.be/dQw4w9WgXcQ" }], "json", "media-downloader", "youtube", "v0", "2025-12-01T10:00:00.000Z", "YouTube", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

// ─── MEDIA DOWNLOADER - SOCIAL MEDIA ENDPOINTS ──────────────────────────────

const socialMediaEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/download/tiktok", "GET", "Download TikTok video without watermark with full metadata.", [{ name: "url", type: "string", required: true, description: "TikTok video URL", default: "https://www.tiktok.com/@tiktok/video/6844509757497708805" }], "json", "media-downloader", "social-media", "v0", "2025-10-20T10:00:00.000Z", "ssstik.io", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/tiktok/audio", "GET", "Extract audio from TikTok video.", [{ name: "url", type: "string", required: true, description: "TikTok video URL", default: "https://www.tiktok.com/@tiktok/video/6844509757497708805" }], "json", "media-downloader", "social-media", "v0", "2025-10-20T10:00:00.000Z", "ssstik.io", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/tiktok/info", "GET", "Get TikTok video info (title, author, stats) without downloading.", [{ name: "url", type: "string", required: true, description: "TikTok video URL", default: "https://www.tiktok.com/@tiktok/video/6844509757497708805" }], "json", "media-downloader", "social-media", "v0", "2025-10-22T11:00:00.000Z", "ssstik.io", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/download/snapchat", "GET", "Download Snapchat stories, spotlights, and profile media.", [{ name: "url", type: "string", required: true, description: "Snapchat story, spotlight, or profile URL", default: "https://www.snapchat.com/spotlight/12345678901234567" }], "json", "media-downloader", "social-media", "v0", "2025-10-25T09:00:00.000Z", "snapmate.io", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/instagram", "GET", "Download Instagram videos, photos, and reels with multi-quality options.", [{ name: "url", type: "string", required: true, description: "Instagram post/reel URL", default: "https://www.instagram.com/p/CrX8sBLNqCQ/" }], "json", "media-downloader", "social-media", "v0", "2025-10-28T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/instagram/story", "GET", "Download Instagram story by URL.", [{ name: "url", type: "string", required: true, description: "Instagram story URL", default: "https://www.instagram.com/stories/tiktok/12345678/" }], "json", "media-downloader", "social-media", "v0", "2025-10-28T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/facebook", "GET", "Download Facebook videos in SD and HD quality.", [{ name: "url", type: "string", required: true, description: "Facebook video URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], "json", "media-downloader", "social-media", "v0", "2025-11-01T11:00:00.000Z", "fdownloader.net", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/facebook/reel", "GET", "Download Facebook Reels with multi-quality options.", [{ name: "url", type: "string", required: true, description: "Facebook Reel URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], "json", "media-downloader", "social-media", "v0", "2025-11-01T11:00:00.000Z", "fdownloader.net", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/facebook/snap", "GET", "Download Facebook video via snapsave.app - returns multi-quality links array.", [{ name: "url", type: "string", required: true, description: "Facebook video or Reel URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], "json", "media-downloader", "social-media", "v0", "2025-11-05T09:00:00.000Z", "snapsave.app", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/facebook/info", "GET", "Get Facebook video metadata (title, thumbnail, quality info).", [{ name: "url", type: "string", required: true, description: "Facebook video or Reel URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], "json", "media-downloader", "social-media", "v0", "2025-11-05T09:00:00.000Z", "fdownloader.net", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/download/twitter", "GET", "Download Twitter/X videos and GIFs with multi-provider fallback.", [{ name: "url", type: "string", required: true, description: "Tweet URL (twitter.com or x.com)", default: "https://x.com/Twitter/status/1460323737035988996" }], "json", "media-downloader", "social-media", "v0", "2025-11-10T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/download/twitter/info", "GET", "Get Twitter/X tweet info and media links.", [{ name: "url", type: "string", required: true, description: "Tweet URL (twitter.com or x.com)", default: "https://x.com/Twitter/status/1460323737035988996" }], "json", "media-downloader", "social-media", "v0", "2025-11-10T10:00:00.000Z", "Multi-provider", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/social/link-preview", "GET", "Get Open Graph link preview metadata for any URL.", [{ name: "url", type: "string", required: true, description: "URL to preview", default: "https://github.com" }], "json", "media-downloader", "social-media", "v0", "2025-12-01T10:00:00.000Z", "Open Graph", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  
  // V2 Social Media Downloads (July-Aug 2026)
  createEndpoint("/api/v2/download/spotify", "GET", "Download Spotify track MP3 using Spotidown.", [{ name: "url", type: "string", required: true, description: "Spotify track URL", default: "https://open.spotify.com/track/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-01T08:00:00.000Z", "Spotidown", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/download/twitter", "GET", "Download Twitter video using SnapTwitter.", [{ name: "url", type: "string", required: true, description: "Twitter video URL", default: "https://twitter.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-02T09:00:00.000Z", "SnapTwitter", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/download/capcut", "GET", "Download CapCut video metadata using CapCut API.", [{ name: "url", type: "string", required: true, description: "CapCut URL", default: "https://www.capcut.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-03T10:00:00.000Z", "CapCut", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/download/capcutv2", "GET", "Download CapCut video using AnyDownloader (v2 alternative).", [{ name: "url", type: "string", required: true, description: "CapCut URL", default: "https://www.capcut.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-04T11:00:00.000Z", "AnyDownloader", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/download/douyin", "GET", "Download Douyin/TikTok video using LoveTik.", [{ name: "url", type: "string", required: true, description: "Douyin URL", default: "https://www.douyin.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-05T08:00:00.000Z", "LoveTik", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/download/facebook", "GET", "Download Facebook video using GetVidFB.", [{ name: "url", type: "string", required: true, description: "Facebook video URL", default: "https://www.facebook.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-06T09:00:00.000Z", "GetVidFB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/download/gdrive", "GET", "Get Google Drive direct download link.", [{ name: "url", type: "string", required: true, description: "Google Drive URL", default: "https://drive.google.com/file/d/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-07T10:00:00.000Z", "Google Drive", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/download/github", "GET", "Download GitHub repo/file/gist data.", [{ name: "url", type: "string", required: true, description: "GitHub URL", default: "https://github.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-08T11:00:00.000Z", "GitHub", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/download/lahelu", "GET", "Get Lahelu post data by post ID.", [{ name: "url", type: "string", required: true, description: "Lahelu post URL", default: "https://lahelu.com/post/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-09T08:00:00.000Z", "Lahelu", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/download/pinterest", "GET", "Download Pinterest pin media.", [{ name: "url", type: "string", required: true, description: "Pinterest URL", default: "https://pin.it/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-10T09:00:00.000Z", "Pinterest", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/download/rednote", "GET", "Download Rednote/XiaoHongShu content.", [{ name: "url", type: "string", required: true, description: "Rednote URL", default: "https://www.xiaohongshu.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-11T10:00:00.000Z", "Rednote", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/download/soundcloud", "GET", "Download SoundCloud audio.", [{ name: "url", type: "string", required: true, description: "SoundCloud URL", default: "https://soundcloud.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-12T11:00:00.000Z", "SoundCloud", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/download/snackvideo", "GET", "Download SnackVideo video.", [{ name: "url", type: "string", required: true, description: "SnackVideo URL", default: "https://s.snackvideo.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-13T08:00:00.000Z", "SnackVideo", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/download/seegore", "GET", "Get SeeGore article data.", [{ name: "url", type: "string", required: true, description: "SeeGore URL", default: "https://seegore.com/..." }], "json", "media-downloader", "social-media", "v2", "2026-07-14T09:00:00.000Z", "SeeGore", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/download/ytpost", "GET", "Get YouTube community post.", [{ name: "url", type: "string", required: true, description: "YouTube community URL", default: "https://www.youtube.com/@.../community" }], "json", "media-downloader", "social-media", "v2", "2026-07-15T10:00:00.000Z", "YouTube", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

// ─── MEDIA DOWNLOADER - MUSIC STREAMING ─────────────────────────────────────

const musicStreamingEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/spotify/search", "GET", "Search for songs on Spotify using Spotdown.", [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)", default: "Blinding Lights" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-10T12:00:00.000Z", "Spotdown", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/spotify/download", "GET", "Download a Spotify track as MP3.", [
    { name: "url", type: "string", required: false, description: "Spotify track URL", default: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b" },
    { name: "q", type: "string", required: false, description: "Song name to search", default: "Blinding Lights" }
  ], "json", "media-downloader", "music-streaming", "v0", "2025-11-10T12:00:00.000Z", "Spotdown", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/spotify/track/:id", "GET", "Get detailed track info by Spotify track ID.", [{ name: "id", type: "string", required: true, description: "Spotify track ID", default: "0VjIjW4GlUZAMYd2vXMi3b" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-12T09:00:00.000Z", "Spotify API", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/spotify/album/:id", "GET", "Get album info and full track listing by Spotify album ID.", [{ name: "id", type: "string", required: true, description: "Spotify album ID", default: "4aawyAB9vmqN3uQ7FjRGTy" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-12T09:00:00.000Z", "Spotify API", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/spotify/artist/:id", "GET", "Get artist info by Spotify artist ID.", [{ name: "id", type: "string", required: true, description: "Spotify artist ID", default: "06HL4z0CvFAxyc27GXpf02" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-15T10:00:00.000Z", "Spotify API", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/spotify/artist/:id/top-tracks", "GET", "Get an artist's top tracks by Spotify artist ID.", [{ name: "id", type: "string", required: true, description: "Spotify artist ID", default: "06HL4z0CvFAxyc27GXpf02" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-15T10:00:00.000Z", "Spotify API", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/spotify/playlist/:id", "GET", "Get playlist info and full track listing by Spotify playlist ID.", [{ name: "id", type: "string", required: true, description: "Spotify playlist ID", default: "37i9dQZF1DXcBWIGoYBM5M" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-18T11:00:00.000Z", "Spotify API", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/spotify/info/search", "GET", "Search Spotify via GraphQL for tracks, albums, artists or playlists.", [
    { name: "q", type: "string", required: true, description: "Search query", default: "Blinding Lights" },
    { name: "type", type: "string", required: false, description: "Result type: track | album | artist | playlist (default: track)", default: "track", options: ["track", "album", "artist", "playlist"] },
    { name: "limit", type: "string", required: false, description: "Max results (1-50, default: 20)", default: "20" },
    { name: "offset", type: "string", required: false, description: "Pagination offset (default: 0)", default: "0" }
  ], "json", "media-downloader", "music-streaming", "v0", "2025-11-20T09:00:00.000Z", "Spotify API", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/shazam/search", "GET", "Search for songs on Shazam.", [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)", default: "Home NF" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-22T10:00:00.000Z", "Shazam", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/shazam/recognize", "POST", "Identify a song from audio (base64 or URL).", [
    { name: "audio", type: "string", required: false, description: "Base64-encoded raw PCM audio" },
    { name: "url", type: "string", required: false, description: "URL to an audio file", default: "https://cdn.freesound.org/previews/612/612092_5674468-lq.mp3" }
  ], "json", "media-downloader", "music-streaming", "v0", "2025-11-25T11:00:00.000Z", "Shazam", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/shazam/track/:id", "GET", "Get details about a Shazam track by ID.", [{ name: "id", type: "string", required: true, description: "Shazam track ID", default: "1217912247" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-25T11:00:00.000Z", "Shazam", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/soundcloud/download", "GET", "Download SoundCloud track.", [{ name: "url", type: "string", required: true, description: "SoundCloud URL", default: "" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-28T09:00:00.000Z", "SoundCloud", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/soundcloud/search", "GET", "Search SoundCloud tracks.", [{ name: "q", type: "string", required: true, description: "Search query", default: "lofi" }], "json", "media-downloader", "music-streaming", "v0", "2025-11-28T09:00:00.000Z", "SoundCloud", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/bible/ai", "GET", "AI-powered Bible Q&A with 23 translations.", [
    { name: "q", type: "string", required: true, description: "Bible question", default: "What is love?" },
    { name: "translation", type: "string", required: false, description: "Translation code (default: ESV)", default: "ESV", options: BIBLE_TRANSLATIONS }
  ], "json", "media-downloader", "music-streaming", "v0", "2025-12-01T10:00:00.000Z", "Bible AI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];


// ─── SEARCH ENDPOINTS ───────────────────────────────────────────────────────

const webSearchEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/search/wiki", "GET", "Search Wikipedia articles with summaries and full content.", [{ name: "q", type: "string", required: true, description: "Search query", default: "artificial intelligence" }], "json", "search", "web-search", "v0", "2025-10-15T08:00:00.000Z", "Wikipedia", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/news", "GET", "Search latest news articles worldwide with GNews API.", [
    { name: "q", type: "string", required: true, description: "Search query", default: "technology" },
    { name: "lang", type: "string", required: false, description: "Language code (default: en)", default: "en" }
  ], "json", "search", "web-search", "v0", "2025-10-15T08:00:00.000Z", "GNews", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/urbandictionary", "GET", "Search Urban Dictionary definitions with examples and ratings.", [{ name: "q", type: "string", required: true, description: "Word or phrase", default: "vibe" }], "json", "search", "web-search", "v0", "2025-10-18T09:00:00.000Z", "Urban Dictionary", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/emoji", "GET", "Search emojis by keyword with Unicode details.", [{ name: "q", type: "string", required: true, description: "Emoji keyword", default: "fire" }], "json", "search", "web-search", "v0", "2025-10-20T10:00:00.000Z", "Open Emoji", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/country", "GET", "Search country information by name with flags, population, and currencies.", [{ name: "q", type: "string", required: true, description: "Country name", default: "Kenya" }], "json", "search", "web-search", "v0", "2025-10-22T11:00:00.000Z", "REST Countries", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/reddit", "GET", "Search Reddit posts and subreddits with sorting options.", [
    { name: "q", type: "string", required: true, description: "Search query", default: "artificial intelligence" },
    { name: "sort", type: "string", required: false, description: "Sort by: relevance, hot, top, new", default: "hot", options: ["relevance", "hot", "top", "new"] }
  ], "json", "search", "web-search", "v0", "2025-10-25T09:00:00.000Z", "Reddit", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/images", "GET", "Search and return images for any keyword using Yandex Images.", [
    { name: "q", type: "string", required: true, description: "Image search query", default: "superman" },
    { name: "page", type: "string", required: false, description: "Page number (0-based, default: 0)", default: "0" }
  ], "json", "search", "media-search", "v0", "2025-11-01T10:00:00.000Z", "Yandex Images", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/videos", "GET", "Search and return videos for any keyword using Yandex Videos.", [
    { name: "q", type: "string", required: true, description: "Video search query", default: "superman trailer" },
    { name: "page", type: "string", required: false, description: "Page number (0-based, default: 0)", default: "0" }
  ], "json", "search", "media-search", "v0", "2025-11-01T10:00:00.000Z", "Yandex Videos", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/yandex-images", "GET", "Search Yandex Images with pagination support.", [
    { name: "q", type: "string", required: true, description: "Image search query", default: "superman" },
    { name: "page", type: "string", required: false, description: "Page number (0-based, default: 0)", default: "0" }
  ], "json", "search", "media-search", "v0", "2025-11-05T11:00:00.000Z", "Yandex Images", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const developerSearchEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/search/github", "GET", "Search GitHub repositories with stars, forks, and language info.", [{ name: "q", type: "string", required: true, description: "Search query", default: "megan-apis" }], "json", "search", "developer-search", "v0", "2025-10-25T09:00:00.000Z", "GitHub", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/npm", "GET", "Search NPM packages with version, description, and keywords.", [{ name: "q", type: "string", required: true, description: "Package name or keyword", default: "express" }], "json", "search", "developer-search", "v0", "2025-10-25T09:00:00.000Z", "NPM", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/pypi", "GET", "Search Python packages on PyPI with metadata.", [{ name: "q", type: "string", required: true, description: "Package name or keyword", default: "requests" }], "json", "search", "developer-search", "v0", "2025-10-28T10:00:00.000Z", "PyPI", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/search/stackoverflow", "GET", "Search Stack Overflow questions with answers and scores.", [{ name: "q", type: "string", required: true, description: "Search query", default: "how to reverse a string in python" }], "json", "search", "developer-search", "v0", "2025-10-28T10:00:00.000Z", "StackExchange", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

// V2 Search (July 2026)
const v2SearchEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/v2/search/gitagram", "GET", "Search music chords on Gitagram by song title or artist.", [{ name: "q", type: "string", required: true, description: "Song title or artist", default: "perfect" }], "json", "search", "specialized-search", "v2", "2026-07-01T08:00:00.000Z", "Gitagram", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/lahelu", "GET", "Search Lahelu social media posts by keyword.", [{ name: "q", type: "string", required: true, description: "Search query", default: "funny" }], "json", "search", "specialized-search", "v2", "2026-07-02T09:00:00.000Z", "Lahelu", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/mangatoon", "GET", "Search manga and comics on Mangatoon by title.", [{ name: "q", type: "string", required: true, description: "Manga title", default: "action" }], "json", "search", "specialized-search", "v2", "2026-07-03T10:00:00.000Z", "Mangatoon", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/mcpedl", "GET", "Search Minecraft mods and addons on MCPEDL.", [{ name: "q", type: "string", required: true, description: "Mod name", default: "shaders" }], "json", "search", "specialized-search", "v2", "2026-07-04T11:00:00.000Z", "MCPEDL", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/myinstants", "GET", "Search sound effects on MyInstants by name.", [{ name: "q", type: "string", required: true, description: "Sound name", default: "bruh" }], "json", "search", "specialized-search", "v2", "2026-07-05T08:00:00.000Z", "MyInstants", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/otakotaku", "GET", "Search anime on Otakotaku by title.", [{ name: "q", type: "string", required: true, description: "Anime title", default: "naruto" }], "json", "search", "specialized-search", "v2", "2026-07-06T09:00:00.000Z", "Otakotaku", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/resep", "GET", "Search recipes on ResepKoki by dish name.", [{ name: "q", type: "string", required: true, description: "Recipe name", default: "fried rice" }], "json", "search", "specialized-search", "v2", "2026-07-07T10:00:00.000Z", "ResepKoki", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/soundcloud", "GET", "Search SoundCloud tracks with official API.", [{ name: "q", type: "string", required: true, description: "Track name", default: "lofi" }], "json", "search", "specialized-search", "v2", "2026-07-08T11:00:00.000Z", "SoundCloud", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/spotify", "GET", "Search Spotify tracks using official API.", [{ name: "q", type: "string", required: true, description: "Track name", default: "perfect" }], "json", "search", "specialized-search", "v2", "2026-07-09T08:00:00.000Z", "Spotify", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/an1", "GET", "Search Android APK apps on AN1.com.", [{ name: "q", type: "string", required: true, description: "App name to search", default: "pou" }], "json", "search", "specialized-search", "v2", "2026-07-10T09:00:00.000Z", "AN1", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/npm", "GET", "Search NPM package information with version history.", [{ name: "q", type: "string", required: true, description: "Package name", default: "axios" }], "json", "search", "specialized-search", "v2", "2026-07-11T10:00:00.000Z", "NPM", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/check/resi", "GET", "Track package shipment from JNE, J&T, SiCepat, and other couriers.", [
    { name: "resi", type: "string", required: true, description: "Tracking number", default: "1234567890" },
    { name: "courier", type: "string", required: true, description: "Courier name (e.g. JNE, J&T)", default: "JNE" }
  ], "json", "search", "specialized-search", "v2", "2026-07-12T11:00:00.000Z", "Loman", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 30),
];

// ─── STALKER ENDPOINTS ──────────────────────────────────────────────────────

const stalkerEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/v2/stalk/github", "GET", "Get GitHub user profile info including followers, repos, bio, and avatar.", [{ name: "q", type: "string", required: true, description: "GitHub username", default: "octocat" }], "json", "stalker", "profile-lookup", "v2", "2026-07-01T08:00:00.000Z", "GitHub", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/stalk/roblox", "GET", "Get Roblox user profile info including friends, followers, and presence.", [{ name: "q", type: "string", required: true, description: "Roblox username", default: "builderman" }], "json", "stalker", "profile-lookup", "v2", "2026-07-01T08:00:00.000Z", "Roblox", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/stalk/tiktok", "GET", "Get TikTok user profile info including followers, likes, and videos.", [{ name: "q", type: "string", required: true, description: "TikTok username", default: "mrbeast" }], "json", "stalker", "profile-lookup", "v2", "2026-07-02T09:00:00.000Z", "TikTok", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/stalk/youtube", "GET", "Get YouTube channel info including description, avatar, and channel URL.", [{ name: "q", type: "string", required: true, description: "YouTube channel username", default: "MrBeast" }], "json", "stalker", "profile-lookup", "v2", "2026-07-02T09:00:00.000Z", "YouTube", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/stalk/github", "GET", "Get GitHub user profile with full stats (v0 legacy).", [{ name: "username", type: "string", required: true, description: "GitHub username", default: "octocat" }], "json", "stalker", "profile-lookup", "v0", "2025-11-01T09:00:00.000Z", "GitHub", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/stalk/ip", "GET", "Lookup IP address geolocation, ISP, timezone, and ASN info.", [{ name: "ip", type: "string", required: true, description: "IP address to lookup", default: "8.8.8.8" }], "json", "stalker", "network-tools", "v0", "2025-11-05T10:00:00.000Z", "IP-API", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/stalk/npm", "GET", "Lookup NPM package details, version, author, and stats.", [{ name: "package", type: "string", required: true, description: "NPM package name", default: "axios" }], "json", "stalker", "network-tools", "v0", "2025-11-05T10:00:00.000Z", "NPM Registry", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/stalk/tiktok", "GET", "Lookup TikTok user profile (v0 legacy).", [{ name: "username", type: "string", required: true, description: "TikTok username", default: "charlidamelio" }], "json", "stalker", "profile-lookup", "v0", "2025-11-10T11:00:00.000Z", "TikTok", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/stalk/instagram", "GET", "Lookup Instagram user profile info and stats.", [{ name: "username", type: "string", required: true, description: "Instagram username", default: "instagram" }], "json", "stalker", "profile-lookup", "v0", "2025-11-10T11:00:00.000Z", "Instagram", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/stalk/twitter", "GET", "Lookup Twitter/X user profile, followers, tweets, and verification status.", [{ name: "username", type: "string", required: true, description: "Twitter/X username", default: "elonmusk" }], "json", "stalker", "profile-lookup", "v0", "2025-11-15T09:00:00.000Z", "fxTwitter", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/stalk/telegram", "GET", "Lookup Telegram user, channel, or group profile and subscriber count.", [{ name: "username", type: "string", required: true, description: "Telegram username or channel handle", default: "durov" }], "json", "stalker", "profile-lookup", "v0", "2025-11-15T09:00:00.000Z", "Telegram", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
];


// ─── SECURITY ENDPOINTS ──────────────────────────────────────────────────────

const networkSecurityEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/security/whois", "GET", "WHOIS domain lookup - get domain registration, registrar, and expiry information.", [{ name: "domain", type: "string", required: true, description: "Domain to lookup", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-11-20T10:00:00.000Z", "RDAP", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/dns", "GET", "DNS records lookup - A, AAAA, MX, TXT, NS, and CNAME records.", [{ name: "domain", type: "string", required: true, description: "Domain to lookup", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-11-20T10:00:00.000Z", "DNS", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/subdomain", "GET", "Scan for common subdomains on a target domain.", [{ name: "domain", type: "string", required: true, description: "Domain to scan", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-11-22T11:00:00.000Z", "Multi-source", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/security/reverse-ip", "GET", "Reverse IP lookup - find domains hosted on the same IP.", [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], "json", "security", "network-security", "v0", "2025-11-22T11:00:00.000Z", "Multi-source", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/security/geoip", "GET", "IP geolocation lookup - get country, city, ISP, and coordinates.", [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], "json", "security", "network-security", "v0", "2025-11-25T09:00:00.000Z", "IP-API", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/portscan", "GET", "Scan common ports on a host to identify open services.", [{ name: "host", type: "string", required: true, description: "Hostname or IP", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-11-25T09:00:00.000Z", "Multi-source", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/security/headers", "GET", "Fetch HTTP response headers from a target URL.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "network-security", "v0", "2025-11-28T10:00:00.000Z", "HTTP", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/ssl", "GET", "Check SSL certificate details - issuer, expiry, and validity.", [{ name: "host", type: "string", required: true, description: "Hostname to check", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-11-28T10:00:00.000Z", "SSL", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/tls", "GET", "Get TLS connection details - version, cipher, and security.", [{ name: "host", type: "string", required: true, description: "Hostname to check", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-12-01T11:00:00.000Z", "TLS", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/ping", "GET", "Ping a host and check latency and availability.", [{ name: "host", type: "string", required: true, description: "Hostname to ping", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-12-01T11:00:00.000Z", "ICMP", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/latency", "GET", "Measure HTTP latency to a target URL.", [{ name: "url", type: "string", required: true, description: "URL to test", default: "https://meganapis.space" }], "json", "security", "network-security", "v0", "2025-12-03T09:00:00.000Z", "HTTP", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/traceroute", "GET", "Trace route to a host showing network path and hops.", [{ name: "host", type: "string", required: true, description: "Hostname to trace", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-12-03T09:00:00.000Z", "Traceroute", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/security/asn", "GET", "ASN lookup for IP - get autonomous system number and organization.", [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], "json", "security", "network-security", "v0", "2025-12-05T10:00:00.000Z", "IP-API", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/mac", "GET", "MAC address vendor lookup - identify device manufacturer.", [{ name: "mac", type: "string", required: true, description: "MAC address", default: "00:1A:2B:3C:4D:5E" }], "json", "security", "network-security", "v0", "2025-12-05T10:00:00.000Z", "MacVendors", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/openports", "GET", "Scan extended port range on a target host.", [{ name: "host", type: "string", required: true, description: "Hostname or IP", default: "meganapis.space" }], "json", "security", "network-security", "v0", "2025-12-08T11:00:00.000Z", "Multi-source", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/security/ip-info", "GET", "Full IP information lookup - geolocation, ASN, ISP, and timezone.", [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], "json", "security", "network-security", "v0", "2025-12-08T11:00:00.000Z", "IP-API", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const webSecurityEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/security/security-headers", "GET", "Analyze security headers with scoring - checks HSTS, CSP, X-Frame-Options, and more.", [{ name: "url", type: "string", required: true, description: "URL to analyze", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-10T11:00:00.000Z", "SecurityHeaders", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/waf", "GET", "Detect Web Application Firewall on a target URL.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-10T11:00:00.000Z", "WAF Detector", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/firewall", "GET", "Check firewall and security headers on a target host.", [{ name: "host", type: "string", required: true, description: "Hostname to check", default: "meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-12T09:00:00.000Z", "Multi-source", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/robots", "GET", "Check robots.txt file for a website.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-12T09:00:00.000Z", "HTTP", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/sitemap", "GET", "Check sitemap.xml for a website.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-15T10:00:00.000Z", "HTTP", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/cms", "GET", "Detect CMS/platform used by a website.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-15T10:00:00.000Z", "CMS Detector", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/techstack", "GET", "Detect technology stack used by a website.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-18T11:00:00.000Z", "Tech Detector", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/cookies", "GET", "Scan cookies for security flags - Secure, HttpOnly, SameSite.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-18T11:00:00.000Z", "Cookie Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/redirects", "GET", "Check redirect chain for a URL.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-20T09:00:00.000Z", "HTTP", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/xss", "GET", "Check XSS protection headers on a target URL.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-20T09:00:00.000Z", "Security Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/sqli", "GET", "Check SQL injection protection on a target URL.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-22T10:00:00.000Z", "Security Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/csrf", "GET", "Check CSRF protection on a target URL.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-22T10:00:00.000Z", "Security Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/clickjack", "GET", "Check clickjacking protection on a target URL.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-25T11:00:00.000Z", "Security Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/directory", "GET", "Scan for exposed directories on a website.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-25T11:00:00.000Z", "Directory Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/security/exposed-files", "GET", "Check for exposed sensitive files on a website.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-28T09:00:00.000Z", "File Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/security/misconfig", "GET", "Check security misconfigurations on a website.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2025-12-28T09:00:00.000Z", "Security Scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/url-scan", "GET", "Full URL security scan - checks headers, SSL, and vulnerabilities.", [{ name: "url", type: "string", required: true, description: "URL to scan", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2026-01-05T10:00:00.000Z", "Multi-scanner", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/security/phish", "GET", "Check URL for phishing indicators and suspicious patterns.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2026-01-05T10:00:00.000Z", "Phish Detector", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/metadata", "GET", "Extract website metadata - title, description, OG tags, and more.", [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], "json", "security", "web-security", "v0", "2026-01-08T11:00:00.000Z", "Metadata Extractor", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const hashSecurityEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/security/hash-identify", "GET", "Identify hash type - MD5, SHA1, SHA256, SHA512, bcrypt, and more.", [{ name: "hash", type: "string", required: true, description: "Hash string to identify", default: "5d41402abc4b2a76b9719d911017c592" }], "json", "security", "hash-tools", "v0", "2026-01-10T09:00:00.000Z", "HashID", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/hash-generate", "GET", "Generate hash from text with multiple algorithms.", [
    { name: "text", type: "string", required: true, description: "Text to hash", default: "Hello World" },
    { name: "algorithm", type: "string", required: false, description: "Algorithm (md5, sha1, sha256, sha512)", default: "sha256", options: ["md5", "sha1", "sha256", "sha512"] }
  ], "json", "security", "hash-tools", "v0", "2026-01-10T09:00:00.000Z", "Crypto", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/security/password-strength", "GET", "Check password strength with detailed analysis.", [{ name: "password", type: "string", required: true, description: "Password to check", default: "MyP@ssw0rd123!" }], "json", "security", "hash-tools", "v0", "2026-01-12T10:00:00.000Z", "Password Analyzer", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];


// ─── TOOLS ENDPOINTS ─────────────────────────────────────────────────────────

const textToolsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/tools/qrcode", "GET", "Generate QR code image from text or URL.", [
    { name: "text", type: "string", required: true, description: "Text or URL to encode", default: "https://meganapis.space" },
    { name: "size", type: "number", required: false, description: "Size in pixels (default 300)", default: "300" }
  ], "json", "tools", "text-tools", "v0", "2025-10-15T08:00:00.000Z", "QR Server", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/bible", "GET", "Lookup Bible verse by reference.", [{ name: "ref", type: "string", required: false, description: "Bible reference (e.g. john 3:16)", default: "john 3:16" }], "json", "tools", "text-tools", "v0", "2025-10-15T08:00:00.000Z", "Bible API", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/dictionary", "GET", "Get word definition, meanings, and pronunciation.", [{ name: "word", type: "string", required: true, description: "Word to look up", default: "serendipity" }], "json", "tools", "text-tools", "v0", "2025-10-16T09:00:00.000Z", "DictionaryAPI", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/wikipedia", "GET", "Get Wikipedia article summary and extract.", [{ name: "query", type: "string", required: true, description: "Topic to search", default: "Artificial intelligence" }], "json", "tools", "text-tools", "v0", "2025-10-16T09:00:00.000Z", "Wikipedia", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/weather", "GET", "Get current weather for a city with temperature and conditions.", [{ name: "city", type: "string", required: true, description: "City name", default: "Nairobi" }], "json", "tools", "text-tools", "v0", "2025-10-18T10:00:00.000Z", "wttr.in", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/base64encode", "GET", "Encode text to Base64 format.", [{ name: "text", type: "string", required: true, description: "Text to encode", default: "Hello World" }], "json", "tools", "text-tools", "v0", "2025-10-18T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/base64decode", "GET", "Decode Base64 to text.", [{ name: "text", type: "string", required: true, description: "Base64 string to decode", default: "SGVsbG8gV29ybGQ=" }], "json", "tools", "text-tools", "v0", "2025-10-20T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/textstats", "GET", "Analyze text statistics - word count, character count, and more.", [{ name: "text", type: "string", required: true, description: "Text to analyze", default: "Hello World, this is a sample text for analysis." }], "json", "tools", "text-tools", "v0", "2025-10-20T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/password", "GET", "Generate secure random password.", [{ name: "length", type: "number", required: false, description: "Password length (default 16)", default: "16" }], "json", "tools", "text-tools", "v0", "2025-10-22T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/lorem", "GET", "Generate Lorem Ipsum placeholder text.", [{ name: "paragraphs", type: "number", required: false, description: "Number of paragraphs (default 1)", default: "2" }], "json", "tools", "text-tools", "v0", "2025-10-22T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/color", "GET", "Generate random color with hex, RGB, and HSL values.", [], "json", "tools", "text-tools", "v0", "2025-10-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/timestamp", "GET", "Get current timestamp in multiple formats (Unix, ISO, UTC).", [], "json", "tools", "text-tools", "v0", "2025-10-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/urlencode", "GET", "URL encode a string.", [{ name: "text", type: "string", required: true, description: "Text to encode", default: "Hello World & More" }], "json", "tools", "text-tools", "v0", "2025-10-28T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/urldecode", "GET", "URL decode a string.", [{ name: "text", type: "string", required: true, description: "Text to decode", default: "Hello+World+%26+More" }], "json", "tools", "text-tools", "v0", "2025-10-28T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/jsonformat", "POST", "Format and validate JSON string.", [{ name: "json", type: "string", required: true, description: "JSON string to format", default: "{\"name\":\"Megan\",\"api\":\"Tracker Wanga\"}" }], "json", "tools", "text-tools", "v0", "2025-11-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/email-validate", "GET", "Validate email format and check for common issues.", [{ name: "email", type: "string", required: true, description: "Email to validate", default: "test@example.com" }], "json", "tools", "text-tools", "v0", "2025-11-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/ip-validate", "GET", "Validate IP address format (IPv4 and IPv6).", [{ name: "ip", type: "string", required: true, description: "IP address to validate", default: "192.168.1.1" }], "json", "tools", "text-tools", "v0", "2025-11-05T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/hash", "GET", "Generate hash from text with multiple algorithms.", [
    { name: "text", type: "string", required: true, description: "Text to hash", default: "Hello World" },
    { name: "algorithm", type: "string", required: false, description: "Hash algorithm (md5, sha1, sha256, sha512)", default: "sha256", options: ["md5", "sha1", "sha256", "sha512"] }
  ], "json", "tools", "text-tools", "v0", "2025-11-05T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/uuid", "GET", "Generate UUID v4.", [], "json", "tools", "text-tools", "v0", "2025-11-08T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/password-strength", "GET", "Check password strength with detailed scoring.", [{ name: "password", type: "string", required: true, description: "Password to check", default: "MyP@ssw0rd123!" }], "json", "tools", "text-tools", "v0", "2025-11-08T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/screenshot", "GET", "Take website screenshot and get image URL.", [{ name: "url", type: "string", required: true, description: "URL to screenshot", default: "https://meganapis.space" }], "json", "tools", "text-tools", "v0", "2025-11-10T09:00:00.000Z", "thum.io", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/tools/phone-lookup", "GET", "Lookup phone number info - carrier, country, and type.", [{ name: "phone", type: "string", required: true, description: "Phone number", default: "+254..." }], "json", "tools", "text-tools", "v0", "2025-11-10T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/password-audit", "GET", "Audit password strength in detail with recommendations.", [{ name: "password", type: "string", required: true, description: "Password", default: "Test123!" }], "json", "tools", "text-tools", "v0", "2025-11-12T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/dns-inspector", "GET", "Inspect DNS records in detail with type filtering.", [{ name: "domain", type: "string", required: true, description: "Domain", default: "example.com" }], "json", "tools", "text-tools", "v0", "2025-11-12T10:00:00.000Z", "DNS", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/wifi-scan", "GET", "Scan WiFi networks (returns available networks).", [], "json", "tools", "text-tools", "v0", "2025-11-15T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/tools/word-count", "POST", "Count words, characters, sentences, paragraphs, and reading time.", [{ name: "text", type: "string", required: true, description: "Text to analyze", default: "Hello world. This is a test." }], "json", "tools", "text-tools", "v0", "2026-02-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/slug", "GET", "Generate a URL slug from text.", [{ name: "text", type: "string", required: true, description: "Text to slugify", default: "Hello World!" }], "json", "tools", "text-tools", "v0", "2026-02-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const developerToolsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/tools/deobfuscate", "POST", "Deobfuscate JavaScript code - reverse obfuscation techniques.", [{ name: "code", type: "string", required: true, description: "Obfuscated JS code", default: "var _0x1234=['hello','world']" }], "json", "tools", "developer-tools", "v0", "2025-12-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/tools/deminify", "POST", "Expand minified code with proper formatting.", [
    { name: "code", type: "string", required: true, description: "Minified code", default: "function hello(a,b){return a+b}" },
    { name: "language", type: "string", required: false, description: "Programming language", default: "js", options: ["js", "css", "html", "json"] }
  ], "json", "tools", "developer-tools", "v0", "2025-12-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/tools/run-js", "POST", "Run JavaScript in a secure sandbox environment.", [
    { name: "code", type: "string", required: true, description: "JS code to run", default: "console.log('Hello!')" },
    { name: "data", type: "string", required: false, description: "Optional data to pass to code" }
  ], "json", "tools", "developer-tools", "v0", "2025-12-05T10:00:00.000Z", "Sandbox", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/tools/headless", "GET", "Fetch URL like a real browser with cookies and redirects.", [
    { name: "url", type: "string", required: true, description: "URL to fetch", default: "https://example.com" },
    { name: "cookies", type: "string", required: false, description: "Cookies to send" }
  ], "json", "tools", "developer-tools", "v0", "2025-12-05T10:00:00.000Z", "Headless", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/tools/decode", "POST", "Auto-detect and decode Base64, URL, Hex, JWT, and ROT13.", [{ name: "text", type: "string", required: true, description: "Encoded text", default: "SGVsbG8gV29ybGQ=" }], "json", "tools", "developer-tools", "v0", "2025-12-10T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const converterEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/converter/img-to-sticker", "GET", "Convert image to WhatsApp sticker (WebP format).", [{ name: "url", type: "string", required: true, description: "Image URL to convert", default: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg" }], "json", "tools", "converter", "v0", "2026-01-10T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/converter/sticker-to-img", "GET", "Convert sticker (WebP) to image (PNG).", [{ name: "url", type: "string", required: true, description: "Sticker/WebP URL to convert", default: "https://www.gstatic.com/webp/gallery/1.webp" }], "json", "tools", "converter", "v0", "2026-01-10T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/converter/video-to-sticker", "GET", "Convert video to animated WhatsApp sticker.", [{ name: "url", type: "string", required: true, description: "Video URL (MP4, max 6 seconds)", default: "https://www.w3schools.com/html/mov_bbb.mp4" }], "json", "tools", "converter", "v0", "2026-01-12T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/converter/sticker-to-video", "GET", "Convert animated sticker to video (MP4).", [{ name: "url", type: "string", required: true, description: "Animated sticker/WebP URL", default: "https://www.gstatic.com/webp/gallery/1.webp" }], "json", "tools", "converter", "v0", "2026-01-12T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/converter/video-to-gif", "GET", "Convert video to GIF animation.", [{ name: "url", type: "string", required: true, description: "Video URL to convert", default: "https://www.w3schools.com/html/mov_bbb.mp4" }], "json", "tools", "converter", "v0", "2026-01-15T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/converter/gif-to-video", "GET", "Convert GIF to video (MP4).", [{ name: "url", type: "string", required: true, description: "GIF URL to convert", default: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" }], "json", "tools", "converter", "v0", "2026-01-15T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/audio/list", "GET", "List all available audio effects with ffmpeg filters.", [], "json", "tools", "converter", "v0", "2026-01-20T11:00:00.000Z", "FFmpeg", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/audio/:effectId", "GET", "Apply audio effect (bass, robot, echo, nightcore, 8D, etc.) to audio/video URL.", [
    { name: "effectId", type: "string", required: true, description: "Effect ID (bass, bassboost, robot, chipmunk, deep, echo, reverb, nightcore, slowed, 8d, vaporwave, karaoke, treble, distortion, flanger, phaser, chorus, vibrato, tremolo, reverse, speed2x, slow05x, telephone, underwater, megaphone)", default: "bass" },
    { name: "url", type: "string", required: true, description: "Audio/video URL to process" }
  ], "json", "tools", "converter", "v0", "2026-01-20T11:00:00.000Z", "FFmpeg", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
];

const mathToolsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/tools/random-number", "GET", "Generate a random number between min and max.", [
    { name: "min", type: "number", required: false, description: "Minimum value (default 1)", default: "1" },
    { name: "max", type: "number", required: false, description: "Maximum value (default 100)", default: "100" }
  ], "json", "tools", "math-tools", "v0", "2026-02-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/coin-flip", "GET", "Flip a coin - returns heads or tails.", [], "json", "tools", "math-tools", "v0", "2026-02-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/dice", "GET", "Roll a dice with custom sides.", [{ name: "sides", type: "number", required: false, description: "Number of sides (default 6)", default: "6" }], "json", "tools", "math-tools", "v0", "2026-02-05T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/math/prime", "GET", "Check if a number is prime.", [{ name: "number", type: "number", required: true, description: "Number to check", default: "17" }], "json", "tools", "math-tools", "v0", "2026-03-01T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/math/factorial", "GET", "Calculate factorial of a number (max 170).", [{ name: "number", type: "number", required: true, description: "Number (max 170)", default: "10" }], "json", "tools", "math-tools", "v0", "2026-03-01T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/math/fibonacci", "GET", "Generate Fibonacci sequence.", [{ name: "count", type: "number", required: false, description: "Number of terms", default: "10" }], "json", "tools", "math-tools", "v0", "2026-03-05T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/math/bmi", "GET", "Calculate BMI (Body Mass Index) with category.", [
    { name: "weight", type: "number", required: true, description: "Weight in kg", default: "70" },
    { name: "height", type: "number", required: true, description: "Height in cm", default: "175" },
    { name: "unit", type: "string", required: false, description: "metric or imperial", default: "metric", options: ["metric", "imperial"] }
  ], "json", "tools", "math-tools", "v0", "2026-03-05T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tools/age", "GET", "Calculate age from birth date.", [{ name: "date", type: "string", required: true, description: "Birth date (YYYY-MM-DD)", default: "2000-01-01" }], "json", "tools", "math-tools", "v0", "2026-03-10T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const encodingToolsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/encode/hex", "GET", "Encode or decode text to/from hexadecimal.", [
    { name: "text", type: "string", required: true, description: "Text to encode/decode", default: "Hello" },
    { name: "decode", type: "string", required: false, description: "Set to '1' to decode", default: "" }
  ], "json", "tools", "encoding-tools", "v0", "2026-04-01T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/encode/binary", "GET", "Encode or decode text to/from binary.", [
    { name: "text", type: "string", required: true, description: "Text to encode/decode", default: "Hi" },
    { name: "decode", type: "string", required: false, description: "Set to '1' to decode", default: "" }
  ], "json", "tools", "encoding-tools", "v0", "2026-04-01T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/encode/rot13", "GET", "Apply ROT13 cipher to text.", [{ name: "text", type: "string", required: true, description: "Text to transform", default: "Hello" }], "json", "tools", "encoding-tools", "v0", "2026-04-05T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/encode/morse", "GET", "Convert text to Morse code.", [{ name: "text", type: "string", required: true, description: "Text to convert", default: "SOS" }], "json", "tools", "encoding-tools", "v0", "2026-04-05T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/encode/jwt-decode", "POST", "Decode a JWT token (header and payload).", [{ name: "token", type: "string", required: true, description: "JWT token string" }], "json", "tools", "encoding-tools", "v0", "2026-04-10T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const qrToolsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/qr/wifi", "GET", "Generate a WiFi QR code for easy connection.", [
    { name: "ssid", type: "string", required: true, description: "WiFi network name", default: "MyWiFi" },
    { name: "password", type: "string", required: true, description: "WiFi password", default: "pass123" },
    { name: "encryption", type: "string", required: false, description: "WPA, WEP, or nopass", default: "WPA", options: ["WPA", "WEP", "nopass"] }
  ], "json", "tools", "qr-tools", "v0", "2026-05-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/qr/vcard", "GET", "Generate a vCard contact QR code.", [
    { name: "name", type: "string", required: true, description: "Full name", default: "Tracker Wanga" },
    { name: "phone", type: "string", required: false, description: "Phone number" },
    { name: "email", type: "string", required: false, description: "Email address" },
    { name: "org", type: "string", required: false, description: "Organization" }
  ], "json", "tools", "qr-tools", "v0", "2026-05-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const pdfToolsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/tools/generate-pdf", "POST", "Generate a beautifully formatted PDF document with title, subtitle, watermark, colors, profile image, and logo.", [
    { name: "title", type: "string", required: false, description: "Document title", default: "My Document" },
    { name: "subtitle", type: "string", required: false, description: "Document subtitle" },
    { name: "text", type: "string", required: true, description: "Content text (supports # headings and ## subheadings)", default: "Hello World" },
    { name: "author", type: "string", required: false, description: "Author name" },
    { name: "footer", type: "string", required: false, description: "Footer text" },
    { name: "watermark", type: "string", required: false, description: "Watermark text (e.g. CONFIDENTIAL)" },
    { name: "color", type: "string", required: false, description: "Primary color hex", default: "#7C3AED" },
    { name: "profileImage", type: "string", required: false, description: "Profile image URL" },
    { name: "logo", type: "string", required: false, description: "Logo image URL" }
  ], "json", "tools", "pdf-tools", "v0", "2026-08-01T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/tools/generate-invoice", "POST", "Generate a professional invoice PDF with company branding, line items, and totals.", [
    { name: "companyName", type: "string", required: true, description: "Your company name" },
    { name: "invoiceNumber", type: "string", required: true, description: "Invoice number" },
    { name: "date", type: "string", required: true, description: "Invoice date" },
    { name: "from", type: "object", required: true, description: "Sender info: name, email, phone, address" },
    { name: "to", type: "object", required: true, description: "Recipient info: name, email, phone, address" },
    { name: "items", type: "array", required: true, description: "Line items: description, quantity, unitPrice" },
    { name: "currency", type: "string", required: false, description: "Currency code", default: "KES" },
    { name: "notes", type: "string", required: false, description: "Additional notes" }
  ], "json", "tools", "pdf-tools", "v0", "2026-08-01T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

const authToolsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/auth/generate-otp", "POST", "Generate a one-time password with WhatsApp link.", [{ name: "phone", type: "string", required: true, description: "Phone number", default: "254758476795" }], "json", "tools", "auth-tools", "v0", "2026-07-20T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/auth/verify-otp", "POST", "Verify a one-time password.", [
    { name: "phone", type: "string", required: true, description: "Phone number" },
    { name: "code", type: "string", required: true, description: "OTP code to verify" }
  ], "json", "tools", "auth-tools", "v0", "2026-07-20T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];


// ─── FUN ENDPOINTS ──────────────────────────────────────────────────────────

const funJokesEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/fun/jokes", "GET", "Get a random joke.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-15T08:00:00.000Z", "JokeAPI", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/advice", "GET", "Get random life advice.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-15T08:00:00.000Z", "AdviceSlip", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/quotes", "GET", "Get an inspirational quote.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-16T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/motivation", "GET", "Get a motivational message.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-16T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/flirt", "GET", "Get a flirty line.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-18T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/pickuplines", "GET", "Get a pickup line.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-18T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/truth", "GET", "Get a truth question for truth or dare.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-20T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/dares", "GET", "Get a dare challenge.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-20T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/riddles", "GET", "Get a riddle with answer.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-22T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/trivia", "GET", "Get a random trivia fact.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-22T09:00:00.000Z", "UselessFacts", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/funfacts", "GET", "Get a fun fact.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-25T10:00:00.000Z", "UselessFacts", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/puns", "GET", "Get a random pun.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/roasts", "GET", "Get a roast line.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-28T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/compliments", "GET", "Get a compliment.", [], "json", "fun", "jokes-quotes", "v0", "2025-10-28T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/wouldyourather", "GET", "Get a would-you-rather question.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/goodmorning", "GET", "Get a good morning message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/goodnight", "GET", "Get a good night message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-05T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/valentines", "GET", "Get a Valentine's Day message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-05T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/birthday", "GET", "Get a birthday wish.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-08T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/love", "GET", "Get a love message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-08T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/friendship", "GET", "Get a friendship quote.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-10T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/shayari", "GET", "Get a shayari verse.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-10T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/humor", "GET", "Get a humorous line.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-12T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/wisdom", "GET", "Get a wisdom quote.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-12T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/success", "GET", "Get a success quote.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-15T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/heartbreak", "GET", "Get a heartbreak quote.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-15T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/sorry", "GET", "Get an apology message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-18T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/halloween", "GET", "Get a Halloween message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-18T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/christmas", "GET", "Get a Christmas message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-20T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/newyear", "GET", "Get a New Year message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-20T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/thankyou", "GET", "Get a thank you message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-22T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/gratitude", "GET", "Get a gratitude message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-22T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/roseday", "GET", "Get a Rose Day message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-25T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/fathersday", "GET", "Get a Father's Day message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-25T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/mothersday", "GET", "Get a Mother's Day message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-28T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/girlfriendsday", "GET", "Get a Girlfriend's Day message.", [], "json", "fun", "jokes-quotes", "v0", "2025-11-28T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/boyfriendsday", "GET", "Get a Boyfriend's Day message.", [], "json", "fun", "jokes-quotes", "v0", "2025-12-01T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/tech-joke", "GET", "Get a random tech/programming joke.", [], "json", "fun", "jokes-quotes", "v0", "2025-12-01T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/never-have-i-ever", "GET", "Get a Never Have I Ever question.", [], "json", "fun", "jokes-quotes", "v0", "2025-12-05T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun/fortune-cookie", "GET", "Get a fortune cookie message.", [], "json", "fun", "jokes-quotes", "v0", "2025-12-05T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
];

const funGamesEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/game/rps", "GET", "Play Rock Paper Scissors against the computer.", [{ name: "move", type: "string", required: true, description: "Your move: rock, paper, or scissors", default: "rock", options: ["rock", "paper", "scissors"] }], "json", "fun", "games", "v0", "2025-11-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/game/flag-guess", "GET", "Guess the country from its flag and hint.", [], "json", "fun", "games", "v0", "2025-11-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/game/flag-guess/:id/check", "GET", "Check your flag guess answer.", [{ name: "answer", type: "string", required: true, description: "Your country guess" }], "json", "fun", "games", "v0", "2025-11-05T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/game/word-scramble", "GET", "Unscramble a word with hint.", [], "json", "fun", "games", "v0", "2025-11-05T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/game/number-guess", "GET", "Start a number guessing game (1-100, 7 attempts).", [], "json", "fun", "games", "v0", "2025-11-10T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/game/number-guess/:id", "POST", "Submit a guess for number guessing game.", [{ name: "guess", type: "number", required: true, description: "Your guess (1-100)", default: "50" }], "json", "fun", "games", "v0", "2025-11-10T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/games/8ball", "GET", "Ask the magic 8-ball a question.", [], "json", "fun", "games", "v0", "2026-02-10T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/games/this-day", "GET", "Get historical events that happened today.", [], "json", "fun", "games", "v0", "2026-02-10T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/games/numbers", "GET", "Get interesting facts about a number.", [{ name: "number", type: "number", required: true, description: "Any number", default: "42" }], "json", "fun", "games", "v0", "2026-02-15T10:00:00.000Z", "NumbersAPI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/games/programming-joke", "GET", "Get a random programming joke.", [], "json", "fun", "games", "v0", "2026-02-15T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
];

const animeEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/anime/waifu", "GET", "Get random waifu anime image.", [], "json", "fun", "anime", "v0", "2025-11-15T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/neko", "GET", "Get random neko anime image.", [], "json", "fun", "anime", "v0", "2025-11-15T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/shinobu", "GET", "Get random Shinobu anime image.", [], "json", "fun", "anime", "v0", "2025-11-15T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/megumin", "GET", "Get random Megumin anime image.", [], "json", "fun", "anime", "v0", "2025-11-18T09:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/cuddle", "GET", "Get random cuddle anime GIF.", [], "json", "fun", "anime", "v0", "2025-11-18T09:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/hug", "GET", "Get random hug anime GIF.", [], "json", "fun", "anime", "v0", "2025-11-20T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/kiss", "GET", "Get random kiss anime GIF.", [], "json", "fun", "anime", "v0", "2025-11-20T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/pat", "GET", "Get random headpat anime GIF.", [], "json", "fun", "anime", "v0", "2025-11-22T11:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/smug", "GET", "Get random smug anime image.", [], "json", "fun", "anime", "v0", "2025-11-22T11:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/bonk", "GET", "Get random bonk anime GIF.", [], "json", "fun", "anime", "v0", "2025-11-25T09:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/blush", "GET", "Get random blush anime image.", [], "json", "fun", "anime", "v0", "2025-11-25T09:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/smile", "GET", "Get random smile anime image.", [], "json", "fun", "anime", "v0", "2025-11-28T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/wave", "GET", "Get random wave anime GIF.", [], "json", "fun", "anime", "v0", "2025-11-28T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/dance", "GET", "Get random dance anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-01T11:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/cry", "GET", "Get random cry anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-01T11:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/slap", "GET", "Get random slap anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-05T09:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/bite", "GET", "Get random bite anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-05T09:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/poke", "GET", "Get random poke anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-10T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/happy", "GET", "Get random happy anime image.", [], "json", "fun", "anime", "v0", "2025-12-10T10:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/wink", "GET", "Get random wink anime image.", [], "json", "fun", "anime", "v0", "2025-12-15T11:00:00.000Z", "waifu.pics", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/highfive", "GET", "Get random highfive anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-15T11:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/sleep", "GET", "Get random sleep anime image.", [], "json", "fun", "anime", "v0", "2025-12-20T09:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/laugh", "GET", "Get random laugh anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-20T09:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/thumbsup", "GET", "Get random thumbsup anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-25T10:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/stare", "GET", "Get random stare anime image.", [], "json", "fun", "anime", "v0", "2025-12-25T10:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/baka", "GET", "Get random baka anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-28T11:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/facepalm", "GET", "Get random facepalm anime GIF.", [], "json", "fun", "anime", "v0", "2025-12-28T11:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/yawn", "GET", "Get random yawn anime GIF.", [], "json", "fun", "anime", "v0", "2026-01-05T09:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/nervous", "GET", "Get random nervous anime image.", [], "json", "fun", "anime", "v0", "2026-01-05T09:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/anime/punch", "GET", "Get random punch anime GIF.", [], "json", "fun", "anime", "v0", "2026-01-10T10:00:00.000Z", "nekos.best", [SC.SUCCESS, SC.SERVER_ERROR], 60),
];

const funContentEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/content/meme", "GET", "Get a random meme from Reddit.", [], "json", "fun", "content", "v0", "2026-02-01T11:00:00.000Z", "Meme API", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/content/memes/:count", "GET", "Get multiple random memes.", [{ name: "count", type: "number", required: false, description: "Number of memes (default 5)", default: "5" }], "json", "fun", "content", "v0", "2026-02-01T11:00:00.000Z", "Meme API", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/content/quote", "GET", "Get a random inspirational quote.", [], "json", "fun", "content", "v0", "2026-02-05T09:00:00.000Z", "Quotable", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/content/fact", "GET", "Get a random useless fact.", [], "json", "fun", "content", "v0", "2026-02-05T09:00:00.000Z", "UselessFacts", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/content/cat-fact", "GET", "Get a random cat fact.", [], "json", "fun", "content", "v0", "2026-02-10T10:00:00.000Z", "CatFact", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/content/riddle", "GET", "Get a random riddle with answer.", [], "json", "fun", "content", "v0", "2026-02-10T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/content/trivia", "GET", "Get a random trivia question.", [], "json", "fun", "content", "v0", "2026-02-15T11:00:00.000Z", "OpenTDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
];

const funDataEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/fun-data/kenyan-proverb", "GET", "Random Kenyan proverb with meaning.", [], "json", "fun", "fun-data", "v0", "2025-12-15T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun-data/dad-joke", "GET", "Random clean dad joke.", [], "json", "fun", "fun-data", "v0", "2025-12-15T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun-data/affirmation", "GET", "Random positive daily affirmation.", [], "json", "fun", "fun-data", "v0", "2025-12-20T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun-data/swahili-phrase", "GET", "Random Swahili phrase with translation.", [], "json", "fun", "fun-data", "v0", "2025-12-20T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun-data/kenyan-proverbs", "GET", "All Kenyan proverbs with optional limit.", [{ name: "limit", type: "number", required: false, description: "Max results (default 10)", default: "10" }], "json", "fun", "fun-data", "v0", "2025-12-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/fun-data/swahili-phrases", "GET", "All Swahili phrases with optional limit.", [{ name: "limit", type: "number", required: false, description: "Max results (default 10)", default: "10" }], "json", "fun", "fun-data", "v0", "2025-12-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
];


// ─── DATA ENDPOINTS ─────────────────────────────────────────────────────────

const newsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/news/tuko", "GET", "Scrape latest news from Tuko.co.ke - Kenyan news, politics, entertainment.", [], "json", "data", "news", "v0", "2025-11-01T09:00:00.000Z", "Tuko", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/news/nation", "GET", "Scrape latest news from Nation Africa - Kenyan and African news.", [], "json", "data", "news", "v0", "2025-11-01T09:00:00.000Z", "Nation", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/news/standard", "GET", "Scrape latest news from Standard Media - Kenyan news.", [], "json", "data", "news", "v0", "2025-11-05T10:00:00.000Z", "Standard", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/news/kenyans", "GET", "Scrape latest news from Kenyans.co.ke - Kenyan news.", [], "json", "data", "news", "v0", "2025-11-05T10:00:00.000Z", "Kenyans", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/news/global", "GET", "Get global news headlines from multiple sources.", [], "json", "data", "news", "v0", "2025-11-10T11:00:00.000Z", "NewsAPI", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/news/kenya", "GET", "Get Kenya-specific news with GNews.", [], "json", "data", "news", "v0", "2025-11-10T11:00:00.000Z", "GNews", [SC.SUCCESS, SC.SERVER_ERROR], 60),
];

const cryptoEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/crypto/price", "GET", "Get live crypto price in USD and KES.", [{ name: "coin", type: "string", required: false, description: "Coin ID (default: bitcoin)", default: "bitcoin" }], "json", "data", "crypto", "v0", "2025-12-01T10:00:00.000Z", "CoinGecko", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/crypto/all", "GET", "Get top 10 cryptocurrency prices.", [], "json", "data", "crypto", "v0", "2025-12-01T10:00:00.000Z", "CoinGecko", [SC.SUCCESS, SC.SERVER_ERROR], 60),
];

const forexEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/forex/rates", "GET", "Get live exchange rates for major currencies.", [], "json", "data", "forex", "v0", "2025-12-05T09:00:00.000Z", "ExchangeRate-API", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/forex/convert", "GET", "Convert between any two currencies.", [
    { name: "amount", type: "number", required: false, description: "Amount to convert (default 1)", default: "100" },
    { name: "from", type: "string", required: false, description: "From currency code", default: "USD" },
    { name: "to", type: "string", required: false, description: "To currency code", default: "KES" }
  ], "json", "data", "forex", "v0", "2025-12-05T09:00:00.000Z", "ExchangeRate-API", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const sportsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/sports/live", "GET", "Get live scores across all sports.", [{ name: "sport", type: "string", required: false, description: "Filter by sport (e.g. Soccer, Basketball)", default: "Soccer" }], "json", "data", "sports", "v0", "2026-01-15T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/search/team", "GET", "Search for a team by name.", [{ name: "q", type: "string", required: true, description: "Team name to search", default: "Arsenal" }], "json", "data", "sports", "v0", "2026-01-15T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/search/player", "GET", "Search for a player by name.", [{ name: "q", type: "string", required: true, description: "Player name to search", default: "Ronaldo" }], "json", "data", "sports", "v0", "2026-01-18T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/search/league", "GET", "Search for a league by name.", [{ name: "q", type: "string", required: true, description: "League name to search", default: "Premier League" }], "json", "data", "sports", "v0", "2026-01-18T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/leagues", "GET", "Get list of all leagues.", [], "json", "data", "sports", "v0", "2026-01-20T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/league/details", "GET", "Get league details by ID.", [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }], "json", "data", "sports", "v0", "2026-01-20T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/league/seasons", "GET", "Get all seasons for a league.", [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }], "json", "data", "sports", "v0", "2026-01-22T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/league/teams", "GET", "Get all teams in a league.", [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }], "json", "data", "sports", "v0", "2026-01-22T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/league/table", "GET", "Get league standings/table.", [
    { name: "id", type: "string", required: true, description: "League ID", default: "4328" },
    { name: "season", type: "string", required: true, description: "Season (e.g. 2024-2025)", default: "2024-2025" }
  ], "json", "data", "sports", "v0", "2026-01-25T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/team/details", "GET", "Get team details by ID.", [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], "json", "data", "sports", "v0", "2026-01-25T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/team/players", "GET", "Get all players in a team.", [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], "json", "data", "sports", "v0", "2026-01-28T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/team/next", "GET", "Get next 5 upcoming events for a team.", [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], "json", "data", "sports", "v0", "2026-01-28T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/team/last", "GET", "Get last 5 results for a team.", [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], "json", "data", "sports", "v0", "2026-02-01T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/team/equipment", "GET", "Get team equipment/kits.", [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], "json", "data", "sports", "v0", "2026-02-01T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/player/details", "GET", "Get player details by ID.", [{ name: "id", type: "string", required: true, description: "Player ID", default: "34146280" }], "json", "data", "sports", "v0", "2026-02-05T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/event/details", "GET", "Get event/match details by ID.", [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], "json", "data", "sports", "v0", "2026-02-05T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/event/lineup", "GET", "Get event lineup.", [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], "json", "data", "sports", "v0", "2026-02-10T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/event/stats", "GET", "Get event statistics.", [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], "json", "data", "sports", "v0", "2026-02-10T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/event/highlights", "GET", "Get event highlights/video.", [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], "json", "data", "sports", "v0", "2026-02-15T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/events/day", "GET", "Get all events on a specific date.", [
    { name: "date", type: "string", required: true, description: "Date (YYYY-MM-DD)", default: "2024-03-15" },
    { name: "sport", type: "string", required: false, description: "Filter by sport", default: "Soccer" }
  ], "json", "data", "sports", "v0", "2026-02-15T11:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/events/round", "GET", "Get events by league round.", [
    { name: "id", type: "string", required: true, description: "League ID", default: "4328" },
    { name: "round", type: "string", required: true, description: "Round number", default: "30" },
    { name: "season", type: "string", required: true, description: "Season (e.g. 2024-2025)", default: "2024-2025" }
  ], "json", "data", "sports", "v0", "2026-02-20T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/teams/country", "GET", "Get teams by country.", [
    { name: "country", type: "string", required: true, description: "Country name", default: "England" },
    { name: "sport", type: "string", required: false, description: "Sport (default: Soccer)", default: "Soccer" }
  ], "json", "data", "sports", "v0", "2026-02-20T09:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/leagues/country", "GET", "Get leagues by country.", [
    { name: "country", type: "string", required: true, description: "Country name", default: "England" },
    { name: "sport", type: "string", required: false, description: "Filter by sport", default: "Soccer" }
  ], "json", "data", "sports", "v0", "2026-02-25T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/sports/venue", "GET", "Get venue details by ID.", [{ name: "id", type: "string", required: true, description: "Venue ID", default: "16247" }], "json", "data", "sports", "v0", "2026-02-25T10:00:00.000Z", "TheSportsDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
];

const educationEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/education/papers", "GET", "Search 250M+ academic papers via OpenAlex.", [
    { name: "q", type: "string", required: true, description: "Search query", default: "climate change" },
    { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }
  ], "json", "data", "education", "v0", "2026-02-01T12:00:00.000Z", "OpenAlex", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/education/books", "GET", "Search 20M+ books via Open Library.", [
    { name: "q", type: "string", required: true, description: "Search query", default: "mathematics" },
    { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }
  ], "json", "data", "education", "v0", "2026-02-01T12:00:00.000Z", "Open Library", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/education/dictionary", "GET", "Look up word with IPA, audio, definitions, and synonyms.", [{ name: "word", type: "string", required: true, description: "Word to look up", default: "serendipity" }], "json", "data", "education", "v0", "2026-02-05T09:00:00.000Z", "Free Dictionary API", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/education/book-details", "GET", "Get detailed book info by Open Library key.", [{ name: "key", type: "string", required: true, description: "Book key (e.g. /works/OL8112804W)", default: "OL8112804W" }], "json", "data", "education", "v0", "2026-02-05T09:00:00.000Z", "Open Library", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
];

const jobsEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/jobs/kenya", "GET", "Get latest Kenyan job listings from BrighterMonday.", [{ name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }], "json", "data", "jobs", "v0", "2026-01-20T10:00:00.000Z", "BrighterMonday", [SC.SUCCESS, SC.SERVER_ERROR], 30),
];

const zodiacEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/zodiac/all", "GET", "Get all 12 zodiac signs with full metadata and daily horoscopes.", [], "json", "data", "zodiac", "v0", "2025-11-25T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/zodiac/:sign", "GET", "Get a specific zodiac sign with traits, compatibility, lucky numbers, career, and daily horoscope.", [{ name: "sign", type: "string", required: true, description: "Zodiac sign name", default: "aries" }], "json", "data", "zodiac", "v0", "2025-11-25T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/zodiac/element/:element", "GET", "Get zodiac signs by element (fire, earth, air, water).", [{ name: "element", type: "string", required: true, description: "Element name", default: "fire", options: ["fire", "earth", "air", "water"] }], "json", "data", "zodiac", "v0", "2025-11-28T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/zodiac/compatibility/:s1/:s2", "GET", "Get compatibility score between two zodiac signs.", [
    { name: "s1", type: "string", required: true, description: "First sign", default: "aries" },
    { name: "s2", type: "string", required: true, description: "Second sign", default: "leo" }
  ], "json", "data", "zodiac", "v0", "2025-11-28T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
];

// ─── MEDIA STREAMING ENDPOINTS ──────────────────────────────────────────────

const movieStreamingEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/tmdb/search/movies", "GET", "Search TMDB movies by title with full metadata.", [
    { name: "q", type: "string", required: true, description: "Movie title to search", default: "Inception" },
    { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }
  ], "json", "media", "movie-streaming", "v0", "2026-05-01T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/search/tv", "GET", "Search TMDB TV shows by title.", [{ name: "q", type: "string", required: true, description: "TV show title", default: "Breaking Bad" }], "json", "media", "movie-streaming", "v0", "2026-05-01T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/search/people", "GET", "Search TMDB people by name.", [{ name: "q", type: "string", required: true, description: "Person name", default: "Brad Pitt" }], "json", "media", "movie-streaming", "v0", "2026-05-05T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/trending/:type/:time", "GET", "Get trending movies or TV shows.", [
    { name: "type", type: "string", required: true, description: "movie, tv, or person", default: "movie", options: ["movie", "tv", "person"] },
    { name: "time", type: "string", required: true, description: "day or week", default: "day", options: ["day", "week"] }
  ], "json", "media", "movie-streaming", "v0", "2026-05-05T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/popular/movies", "GET", "Get popular movies.", [{ name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }], "json", "media", "movie-streaming", "v0", "2026-05-10T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/popular/tv", "GET", "Get popular TV shows.", [{ name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }], "json", "media", "movie-streaming", "v0", "2026-05-10T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/now-playing", "GET", "Get movies now playing in theaters.", [], "json", "media", "movie-streaming", "v0", "2026-05-15T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/on-air", "GET", "Get TV shows currently on air.", [], "json", "media", "movie-streaming", "v0", "2026-05-15T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id", "GET", "Get detailed movie information by TMDB ID.", [{ name: "id", type: "number", required: true, description: "TMDB movie ID", default: "550" }], "json", "media", "movie-streaming", "v0", "2026-05-20T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/tv/:id", "GET", "Get detailed TV show information by TMDB ID.", [{ name: "id", type: "number", required: true, description: "TMDB TV ID", default: "1396" }], "json", "media", "movie-streaming", "v0", "2026-05-20T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id/credits", "GET", "Get movie cast and crew.", [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], "json", "media", "movie-streaming", "v0", "2026-05-25T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id/videos", "GET", "Get movie trailers and videos.", [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], "json", "media", "movie-streaming", "v0", "2026-05-25T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id/providers", "GET", "Get streaming providers for a movie.", [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], "json", "media", "movie-streaming", "v0", "2026-06-01T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id/similar", "GET", "Get similar movies.", [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], "json", "media", "movie-streaming", "v0", "2026-06-01T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id/recommendations", "GET", "Get movie recommendations.", [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], "json", "media", "movie-streaming", "v0", "2026-06-05T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id/images", "GET", "Get movie posters and backdrops.", [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], "json", "media", "movie-streaming", "v0", "2026-06-05T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/movie/:id/reviews", "GET", "Get movie reviews with pagination.", [
    { name: "id", type: "number", required: true, description: "TMDB movie ID" },
    { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }
  ], "json", "media", "movie-streaming", "v0", "2026-06-10T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/person/:id", "GET", "Get person/actor details by TMDB ID.", [{ name: "id", type: "number", required: true, description: "TMDB person ID", default: "287" }], "json", "media", "movie-streaming", "v0", "2026-06-10T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/person/:id/movies", "GET", "Get person's movie credits.", [{ name: "id", type: "number", required: true, description: "TMDB person ID" }], "json", "media", "movie-streaming", "v0", "2026-06-15T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/upcoming", "GET", "Get upcoming movies.", [{ name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }], "json", "media", "movie-streaming", "v0", "2026-06-15T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/top-rated", "GET", "Get top rated movies.", [{ name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }], "json", "media", "movie-streaming", "v0", "2026-06-20T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/genres/movies", "GET", "Get all movie genres.", [], "json", "media", "movie-streaming", "v0", "2026-06-20T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/genres/tv", "GET", "Get all TV genres.", [], "json", "media", "movie-streaming", "v0", "2026-06-25T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/genre/:id/movies", "GET", "Get movies by genre ID.", [{ name: "id", type: "number", required: true, description: "Genre ID" }], "json", "media", "movie-streaming", "v0", "2026-06-25T10:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/discover/movie", "GET", "Discover movies with filters (genre, year, sort).", [
    { name: "with_genres", type: "string", required: false, description: "Comma-separated genre IDs" },
    { name: "year", type: "string", required: false, description: "Release year" },
    { name: "sort_by", type: "string", required: false, description: "Sort order", default: "popularity.desc" }
  ], "json", "media", "movie-streaming", "v0", "2026-07-01T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/discover/tv", "GET", "Discover TV shows with filters.", [
    { name: "with_genres", type: "string", required: false, description: "Comma-separated genre IDs" },
    { name: "sort_by", type: "string", required: false, description: "Sort order", default: "popularity.desc" }
  ], "json", "media", "movie-streaming", "v0", "2026-07-01T11:00:00.000Z", "TMDB", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/tmdb/tv/:id/season/:num", "GET", "Get TV season episodes.", [
    { name: "id", type: "number", required: true, description: "TMDB TV ID" },
    { name: "num", type: "number", required: true, description: "Season number", default: "1" }
  ], "json", "media", "movie-streaming", "v0", "2026-07-05T09:00:00.000Z", "TMDB", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/search/moviebox", "GET", "Search movies and TV shows on Moviebox.", [
    { name: "q", type: "string", required: true, description: "Search keyword", default: "avatar" },
    { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }
  ], "json", "media", "movie-streaming", "v2", "2026-07-01T08:00:00.000Z", "Moviebox", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/moviebox/home", "GET", "Get Moviebox homepage content.", [], "json", "media", "movie-streaming", "v2", "2026-07-01T08:00:00.000Z", "Moviebox", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/moviebox/trending", "GET", "Get trending movies and shows from Moviebox.", [{ name: "page", type: "number", required: false, description: "Page number (default 0)", default: "0" }], "json", "media", "movie-streaming", "v2", "2026-07-02T09:00:00.000Z", "Moviebox", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/moviebox/detail", "GET", "Get movie/show details from Moviebox.", [{ name: "detailPath", type: "string", required: true, description: "Movie detail path from search results", default: "" }], "json", "media", "movie-streaming", "v2", "2026-07-02T09:00:00.000Z", "Moviebox", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/moviebox/stream", "GET", "Get streaming URLs (360p-1080p MP4) from Moviebox.", [
    { name: "subjectId", type: "string", required: true, description: "Movie subject ID", default: "" },
    { name: "detailPath", type: "string", required: true, description: "Movie detail path", default: "" },
    { name: "se", type: "number", required: false, description: "Season (0 for movies)", default: "0" },
    { name: "ep", type: "number", required: false, description: "Episode (0 for movies)", default: "0" }
  ], "json", "media", "movie-streaming", "v2", "2026-07-03T10:00:00.000Z", "Moviebox", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/moviebox/ranking", "GET", "Get ranked movie lists (Trending, K-Drama, Anime, etc.) from Moviebox.", [
    { name: "name", type: "string", required: false, description: "Ranking name (TRENDING_NOW, K_DRAMA, ANIME, etc.)", default: "" },
    { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }
  ], "json", "media", "movie-streaming", "v2", "2026-07-03T10:00:00.000Z", "Moviebox", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/moviebox/proxy", "GET", "Proxy Moviebox streaming URLs with proper headers.", [{ name: "url", type: "string", required: true, description: "Media URL to proxy", default: "" }], "stream", "media", "movie-streaming", "v2", "2026-07-05T11:00:00.000Z", "Moviebox", [SC.SUCCESS, SC.BAD_REQUEST, SC.BAD_GATEWAY, SC.TIMEOUT], 30),
];

const animeStreamingEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/v1/tokusatsu/home", "GET", "Get latest Kamen Rider, Super Sentai, and Ultraman episodes.", [], "json", "media", "anime-streaming", "v1", "2026-06-01T11:00:00.000Z", "TokusatsuIndo", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v1/tokusatsu/search", "GET", "Search tokusatsu episodes (Kamen Rider, Super Sentai, Ultraman).", [{ name: "q", type: "string", required: true, description: "Search query", default: "kamen rider" }], "json", "media", "anime-streaming", "v1", "2026-06-01T11:00:00.000Z", "TokusatsuIndo", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v1/tokusatsu/watch", "GET", "Get streaming URL for a tokusatsu episode.", [{ name: "url", type: "string", required: true, description: "Episode URL", default: "https://www.tokusatsuindo.com/episode-slug/" }], "json", "media", "anime-streaming", "v1", "2026-06-05T09:00:00.000Z", "TokusatsuIndo", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

const goreStreamingEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/v1/seegore/home", "GET", "Get latest videos from SeeGore with direct MP4 links.", [], "json", "media", "gore-streaming", "v1", "2026-05-15T10:00:00.000Z", "SeeGore", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v1/seegore/search", "GET", "Search SeeGore videos by keyword.", [{ name: "q", type: "string", required: true, description: "Search query", default: "accident" }], "json", "media", "gore-streaming", "v1", "2026-05-15T10:00:00.000Z", "SeeGore", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v1/seegore/watch", "GET", "Get direct MP4 video URL from SeeGore.", [{ name: "url", type: "string", required: true, description: "Video URL or slug", default: "https://seegore.com/video-slug/" }], "json", "media", "gore-streaming", "v1", "2026-05-20T11:00:00.000Z", "SeeGore", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v1/movie/home", "GET", "Get latest movies from LK21 with streaming and download links.", [], "json", "media", "gore-streaming", "v1", "2026-05-20T11:00:00.000Z", "LK21", [SC.SUCCESS, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v1/movie/detail", "GET", "Get movie details, download links, and streaming players from LK21.", [{ name: "url", type: "string", required: true, description: "Movie URL", default: "https://tv10.lk21official.cc/movie-slug/" }], "json", "media", "gore-streaming", "v1", "2026-05-25T09:00:00.000Z", "LK21", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v1/movie/stream", "GET", "Get streaming players for a movie from LK21.", [{ name: "url", type: "string", required: true, description: "Movie URL", default: "https://tv10.lk21official.cc/movie-slug/" }], "json", "media", "gore-streaming", "v1", "2026-05-25T09:00:00.000Z", "LK21", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];


// ─── TEXT EFFECTS ENDPOINTS ─────────────────────────────────────────────────

const ephotoEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/ephoto/list", "GET", "List all available Ephoto360 text effects.", [], "json", "text-effects", "ephoto", "v0", "2025-12-15T11:00:00.000Z", "Ephoto360", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/ephoto/generate", "POST", "Generate an Ephoto360 text effect.", [
    { name: "effect", type: "string", required: true, description: "Effect ID from list" },
    { name: "text", type: "string", required: true, description: "Text to render" }
  ], "json", "text-effects", "ephoto", "v0", "2025-12-15T11:00:00.000Z", "Ephoto360", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/ephoto/:effectId", "GET", "Generate Ephoto360 text effect by ID.", [
    { name: "effectId", type: "string", required: true, description: "Effect ID (e.g. neon, gold, fire, horror, naruto, etc.)" },
    { name: "text", type: "string", required: true, description: "Text to render", default: "MeganAPI" }
  ], "json", "text-effects", "ephoto", "v0", "2025-12-15T11:00:00.000Z", "Ephoto360", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

const photofuniaEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/photofunia/list", "GET", "List all available PhotoFunia effects.", [], "json", "text-effects", "photofunia", "v0", "2026-01-01T09:00:00.000Z", "PhotoFunia", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/photofunia/generate", "POST", "Generate a PhotoFunia effect.", [
    { name: "effect", type: "string", required: true, description: "Effect ID from list" },
    { name: "text", type: "string", required: false, description: "Text input (if required)" },
    { name: "imageUrl", type: "string", required: false, description: "Image URL (if required)" }
  ], "json", "text-effects", "photofunia", "v0", "2026-01-01T09:00:00.000Z", "PhotoFunia", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/photofunia/:effectId", "GET", "Generate PhotoFunia effect by ID.", [
    { name: "effectId", type: "string", required: true, description: "Effect ID" },
    { name: "text", type: "string", required: false, description: "Text input" },
    { name: "imageUrl", type: "string", required: false, description: "Image URL" }
  ], "json", "text-effects", "photofunia", "v0", "2026-01-01T09:00:00.000Z", "PhotoFunia", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

const textproEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/textpro/list", "GET", "List all available text effects from TextPro.", [], "json", "text-effects", "textpro", "v0", "2026-02-15T10:00:00.000Z", "TextPro", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/textpro/generate", "GET", "Generate a styled text effect image from TextPro.", [
    { name: "effect", type: "string", required: true, description: "Effect ID (e.g. alien-glow, neon-blue, chrome, fire, etc.)" },
    { name: "text", type: "string", required: true, description: "Text to render", default: "MeganAPI" }
  ], "json", "text-effects", "textpro", "v0", "2026-02-15T10:00:00.000Z", "TextPro", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/textpro/:effectId", "GET", "Generate TextPro effect by ID.", [
    { name: "effectId", type: "string", required: true, description: "Effect ID" },
    { name: "text", type: "string", required: true, description: "Text to render", default: "MeganAPI" }
  ], "json", "text-effects", "textpro", "v0", "2026-02-15T10:00:00.000Z", "TextPro", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

// ─── URL ENDPOINTS ──────────────────────────────────────────────────────────

const urlShortenerEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/short/tinyurl", "GET", "Shorten URL with TinyURL.", [{ name: "url", type: "string", required: true, description: "URL to shorten", default: "https://meganapis.space" }], "json", "url", "url-shortener", "v0", "2025-11-10T10:00:00.000Z", "TinyURL", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/short/isgd", "GET", "Shorten URL with is.gd.", [{ name: "url", type: "string", required: true, description: "URL to shorten", default: "https://meganapis.space" }], "json", "url", "url-shortener", "v0", "2025-11-10T10:00:00.000Z", "is.gd", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/short/vgd", "GET", "Shorten URL with v.gd.", [{ name: "url", type: "string", required: true, description: "URL to shorten", default: "https://meganapis.space" }], "json", "url", "url-shortener", "v0", "2025-11-12T09:00:00.000Z", "v.gd", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/short/cleanuri", "GET", "Shorten URL with CleanURI.", [{ name: "url", type: "string", required: true, description: "URL to shorten", default: "https://meganapis.space" }], "json", "url", "url-shortener", "v0", "2025-11-12T09:00:00.000Z", "CleanURI", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/short/chilpit", "GET", "Shorten URL with Chilp.it.", [{ name: "url", type: "string", required: true, description: "URL to shorten", default: "https://meganapis.space" }], "json", "url", "url-shortener", "v0", "2025-11-15T10:00:00.000Z", "Chilp.it", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/short/clckru", "GET", "Shorten URL with clck.ru.", [{ name: "url", type: "string", required: true, description: "URL to shorten", default: "https://meganapis.space" }], "json", "url", "url-shortener", "v0", "2025-11-15T10:00:00.000Z", "clck.ru", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/short/dagd", "GET", "Shorten URL with da.gd.", [{ name: "url", type: "string", required: true, description: "URL to shorten", default: "https://meganapis.space" }], "json", "url", "url-shortener", "v0", "2025-11-18T11:00:00.000Z", "da.gd", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/url/imgbb", "POST", "Upload image to ImgBB and get a hosted URL.", [{ name: "image", type: "string", required: true, description: "Image URL or Base64-encoded image", default: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg" }], "json", "url", "image-hosting", "v0", "2025-12-01T11:00:00.000Z", "ImgBB", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/url/catbox", "POST", "Upload file to Catbox.moe and get a hosted URL.", [{ name: "url", type: "string", required: true, description: "URL of the file to upload", default: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg" }], "json", "url", "image-hosting", "v0", "2025-12-01T11:00:00.000Z", "Catbox", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

// ─── SCRAPING ENDPOINTS ─────────────────────────────────────────────────────

const scrapingEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/scrape/links", "GET", "Extract all links from a website.", [{ name: "url", type: "string", required: true, description: "URL to scrape", default: "https://example.com" }], "json", "scraping", "web-scraping", "v0", "2025-12-10T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/scrape/inspect", "GET", "Full website inspection - metadata, headers, and content.", [{ name: "url", type: "string", required: true, description: "URL to inspect", default: "https://example.com" }], "json", "scraping", "web-scraping", "v0", "2025-12-10T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/scrape/scripts", "GET", "Extract all JavaScript from a page.", [{ name: "url", type: "string", required: true, description: "URL to scrape", default: "https://example.com" }], "json", "scraping", "web-scraping", "v0", "2025-12-15T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/scrape/cookies", "GET", "Get all cookies from a website.", [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://example.com" }], "json", "scraping", "web-scraping", "v0", "2025-12-15T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/scrape/full", "POST", "Master scraper - extract everything from a page (links, scripts, metadata, content).", [
    { name: "url", type: "string", required: true, description: "URL to scrape", default: "https://example.com" },
    { name: "options", type: "object", required: false, description: "Scraping options" }
  ], "json", "scraping", "web-scraping", "v0", "2025-12-20T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
];

// ─── IMAGE PROCESSING ENDPOINTS ─────────────────────────────────────────────

const imageProcessingEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/v2/image/blurface", "GET", "Blur faces in an image for privacy using iLoveIMG.", [{ name: "image", type: "string", required: true, description: "Image URL to process", default: "https://example.com/image.jpg" }], "image", "image-processing", "image-tools", "v2", "2026-07-01T10:00:00.000Z", "iLoveIMG", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/image/compress", "GET", "Compress image file size using iLoveIMG.", [{ name: "image", type: "string", required: true, description: "Image URL to compress", default: "https://example.com/image.jpg" }], "image", "image-processing", "image-tools", "v2", "2026-07-01T10:00:00.000Z", "iLoveIMG", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/image/removebg", "GET", "Remove image background using iLoveIMG.", [{ name: "image", type: "string", required: true, description: "Image URL to process", default: "https://example.com/image.jpg" }], "image", "image-processing", "image-tools", "v2", "2026-07-02T09:00:00.000Z", "iLoveIMG", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
  createEndpoint("/api/v2/image/upscale", "GET", "Upscale image 2x/4x using iLoveIMG.", [{ name: "image", type: "string", required: true, description: "Image URL to upscale", default: "https://example.com/image.jpg" }], "image", "image-processing", "image-tools", "v2", "2026-07-02T09:00:00.000Z", "iLoveIMG", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 20),
];

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

const adminEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/admin/login", "POST", "Admin login with password.", [{ name: "password", type: "string", required: true, description: "Admin password" }], "json", "admin", "management", "v0", "2025-10-15T08:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 5),
  createEndpoint("/api/admin/stats", "GET", "Get server request statistics - total, daily, top endpoints.", [], "json", "admin", "analytics", "v0", "2025-10-15T08:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/logs", "GET", "Get recent request logs.", [{ name: "limit", type: "number", required: false, description: "Number of logs (max 300)", default: "100" }], "json", "admin", "analytics", "v0", "2025-10-16T09:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/settings", "GET", "Get admin settings.", [], "json", "admin", "management", "v0", "2025-10-16T09:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/settings", "POST", "Update admin settings (githubUrl, repoCards).", [
    { name: "githubUrl", type: "string", required: false, description: "GitHub URL" },
    { name: "repoCards", type: "array", required: false, description: "Repository cards" }
  ], "json", "admin", "management", "v0", "2025-10-18T10:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/change-password", "POST", "Change admin password.", [{ name: "newPassword", type: "string", required: true, description: "New password (min 6 chars)" }], "json", "admin", "management", "v0", "2025-10-18T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.UNAUTHORIZED, SC.SERVER_ERROR], 10),
  createEndpoint("/api/admin/security", "GET", "Get security stats and IP blocklist.", [], "json", "admin", "management", "v0", "2025-10-20T11:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/block-ip", "POST", "Block an IP address.", [{ name: "ip", type: "string", required: true, description: "IP to block" }], "json", "admin", "management", "v0", "2025-10-20T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/unblock-ip", "POST", "Unblock an IP address.", [{ name: "ip", type: "string", required: true, description: "IP to unblock" }], "json", "admin", "management", "v0", "2025-10-22T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/update-ytdlp", "GET", "Update yt-dlp to latest stable version.", [], "json", "admin", "management", "v0", "2025-10-22T09:00:00.000Z", "yt-dlp", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 10),
  createEndpoint("/api/admin/reload-cookies", "GET", "Clear and reload YouTube cookies.", [], "json", "admin", "management", "v0", "2025-10-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 10),
  createEndpoint("/api/admin/provider-health", "GET", "Check health of all download providers.", [], "json", "admin", "management", "v0", "2025-10-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/config/cards", "GET", "Get public repo cards config.", [], "json", "admin", "management", "v0", "2025-10-28T11:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/media/status", "GET", "Check status of all media download providers.", [], "json", "admin", "management", "v0", "2025-11-01T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/status", "GET", "Server status - uptime, memory, CPU usage.", [], "json", "admin", "management", "v0", "2025-10-15T08:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/endpoints", "GET", "List all available API endpoints.", [], "json", "admin", "management", "v0", "2025-10-15T08:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/endpoints/search", "GET", "Search all API endpoints by keyword.", [{ name: "q", type: "string", required: true, description: "Search query", default: "zodiac" }], "json", "admin", "management", "v0", "2025-10-16T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/endpoints/categories", "GET", "List all API categories with counts.", [], "json", "admin", "management", "v0", "2025-10-16T09:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/endpoints/category/:name", "GET", "Get endpoints by category name.", [{ name: "name", type: "string", required: true, description: "Category name or ID" }], "json", "admin", "management", "v0", "2025-10-18T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/endpoints/stats", "GET", "Endpoint statistics by method and category.", [], "json", "admin", "management", "v0", "2025-10-18T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/files/:filename", "GET", "Download a generated media file by filename.", [{ name: "filename", type: "string", required: true, description: "File UUID with extension" }], "stream", "admin", "management", "v0", "2025-10-20T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  
  // API Keys
  createEndpoint("/api/keys/generate", "POST", "Generate a free API key.", [{ name: "name", type: "string", required: false, description: "Key name", default: "Free User" }], "json", "admin", "api-keys", "v0", "2025-10-15T08:00:00.000Z", "D1", [SC.SUCCESS, SC.SERVER_ERROR], 10),
  createEndpoint("/api/keys/:key/info", "GET", "Check API key info and usage.", [{ name: "key", type: "string", required: true, description: "API key" }], "json", "admin", "api-keys", "v0", "2025-10-15T08:00:00.000Z", "D1", [SC.SUCCESS, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/keys/login", "POST", "Login with email and password to get API key.", [
    { name: "email", type: "string", required: true, description: "Email address" },
    { name: "password", type: "string", required: true, description: "Password" }
  ], "json", "admin", "api-keys", "v0", "2025-10-16T09:00:00.000Z", "D1", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 10),
  createEndpoint("/api/admin/keys/generate", "POST", "Admin: Generate API key with custom rate limit.", [
    { name: "name", type: "string", required: false, description: "Key name" },
    { name: "rate_limit", type: "number", required: false, description: "Rate limit (default 50)", default: "50" },
    { name: "userId", type: "string", required: false, description: "User ID to associate" }
  ], "json", "admin", "api-keys", "v0", "2025-10-18T10:00:00.000Z", "D1", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 10),
  createEndpoint("/api/admin/keys", "GET", "Admin: List all API keys.", [], "json", "admin", "api-keys", "v0", "2025-10-18T10:00:00.000Z", "D1", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/keys/:key/update", "POST", "Admin: Update API key (rate_limit, active, name).", [
    { name: "key", type: "string", required: true, description: "API key" },
    { name: "rate_limit", type: "number", required: false, description: "New rate limit" },
    { name: "active", type: "boolean", required: false, description: "Active status" },
    { name: "name", type: "string", required: false, description: "Key name" }
  ], "json", "admin", "api-keys", "v0", "2025-10-20T11:00:00.000Z", "D1", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/keys/:key", "DELETE", "Admin: Revoke API key.", [{ name: "key", type: "string", required: true, description: "API key to revoke" }], "json", "admin", "api-keys", "v0", "2025-10-20T11:00:00.000Z", "D1", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
  createEndpoint("/api/admin/keys/:key/usage", "GET", "Admin: Get API key usage stats.", [{ name: "key", type: "string", required: true, description: "API key" }], "json", "admin", "api-keys", "v0", "2025-10-22T09:00:00.000Z", "D1", [SC.SUCCESS, SC.UNAUTHORIZED, SC.SERVER_ERROR], 30),
];

// ─── WHATSAPP & SOCIAL TOOLS ────────────────────────────────────────────────

const whatsappEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/whatsapp/link", "GET", "Generate a WhatsApp click-to-chat link.", [
    { name: "phone", type: "string", required: true, description: "Phone number with country code", default: "254758476795" },
    { name: "message", type: "string", required: false, description: "Pre-filled message", default: "Hi" }
  ], "json", "tools", "text-tools", "v0", "2026-03-15T10:00:00.000Z", "WhatsApp", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/whatsapp/check", "GET", "Validate and format a WhatsApp phone number.", [{ name: "phone", type: "string", required: true, description: "Phone number", default: "254758476795" }], "json", "tools", "text-tools", "v0", "2026-03-15T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/whatsapp/carrier", "GET", "Detect Kenyan mobile carrier from phone number.", [{ name: "phone", type: "string", required: true, description: "Phone number", default: "254712345678" }], "json", "tools", "text-tools", "v0", "2026-03-20T09:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const emailEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/email/gravatar", "GET", "Get Gravatar URL and profile for an email.", [{ name: "email", type: "string", required: true, description: "Email address", default: "trackerwanga@gmail.com" }], "json", "tools", "text-tools", "v0", "2026-03-20T09:00:00.000Z", "Gravatar", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/email/disposable", "GET", "Check if an email is from a disposable provider.", [{ name: "email", type: "string", required: true, description: "Email address", default: "test@mailinator.com" }], "json", "tools", "text-tools", "v0", "2026-03-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];

const timeEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/time/day-of-year", "GET", "Get current day number of the year.", [], "json", "tools", "text-tools", "v0", "2026-03-25T10:00:00.000Z", "Local", [SC.SUCCESS, SC.SERVER_ERROR], 60),
  createEndpoint("/api/time/countdown", "GET", "Get countdown to a specific date.", [{ name: "date", type: "string", required: true, description: "Target date (YYYY-MM-DD)", default: "2027-01-01" }], "json", "tools", "text-tools", "v0", "2026-03-30T11:00:00.000Z", "Local", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
];


// ─── TEXTPRO EFFECTS LIST ───────────────────────────────────────────────────

export const TEXTPRO_EFFECTS: { id: string; name: string; logoId: number; params: Record<string, string> }[] = [
  { id: "alien-glow", name: "Alien Glow", logoId: 4, params: { Color1_color: "#39FF14", BackgroundColor_color: "#000000" } },
  { id: "neon-blue", name: "Neon Blue", logoId: 4, params: { Color1_color: "#00BFFF", BackgroundColor_color: "#000000" } },
  { id: "neon-pink", name: "Neon Pink", logoId: 4, params: { Color1_color: "#FF1493", BackgroundColor_color: "#000000" } },
  { id: "neon-purple", name: "Neon Purple", logoId: 4, params: { Color1_color: "#8B00FF", BackgroundColor_color: "#000000" } },
  { id: "neon-red", name: "Neon Red", logoId: 4, params: { Color1_color: "#FF0000", BackgroundColor_color: "#000000" } },
  { id: "neon-gold", name: "Neon Gold", logoId: 4, params: { Color1_color: "#FFD700", BackgroundColor_color: "#000000" } },
  { id: "neon-cyan", name: "Neon Cyan", logoId: 4, params: { Color1_color: "#00FFFF", BackgroundColor_color: "#000000" } },
  { id: "neon-orange", name: "Neon Orange", logoId: 4, params: { Color1_color: "#FF6600", BackgroundColor_color: "#000000" } },
  { id: "neon-white", name: "Neon White", logoId: 4, params: { Color1_color: "#FFFFFF", BackgroundColor_color: "#000000" } },
  { id: "3d-outline", name: "3D Outline", logoId: 1, params: { Color1_color: "#FF6600" } },
  { id: "chrome", name: "Chrome", logoId: 2, params: { Color1_color: "#C0C0C0" } },
  { id: "gold-chrome", name: "Gold Chrome", logoId: 2, params: { Color1_color: "#FFD700" } },
  { id: "fire", name: "Fire", logoId: 5, params: { Color1_color: "#FF4500" } },
  { id: "inferno", name: "Inferno", logoId: 5, params: { Color1_color: "#FF0000" } },
  { id: "lava", name: "Lava", logoId: 5, params: { Color1_color: "#FF6347" } },
  { id: "embossed", name: "Embossed", logoId: 6, params: { Color1_color: "#808080" } },
  { id: "gold-embossed", name: "Gold Embossed", logoId: 6, params: { Color1_color: "#DAA520" } },
  { id: "classic-gold", name: "Classic Gold", logoId: 7, params: { Color1_color: "#FFD700" } },
  { id: "retro", name: "Retro", logoId: 7, params: { Color1_color: "#FF6347" } },
  { id: "groovy", name: "Groovy", logoId: 8, params: { Color1_color: "#FF69B4" } },
  { id: "steel", name: "Steel", logoId: 9, params: { Color1_color: "#708090" } },
  { id: "dark-steel", name: "Dark Steel", logoId: 9, params: { Color1_color: "#2F4F4F" } },
  { id: "comic-pop", name: "Comic Pop", logoId: 10, params: { Color1_color: "#FFD700" } },
  { id: "comic-red", name: "Comic Red", logoId: 10, params: { Color1_color: "#FF0000" } },
  { id: "graffiti", name: "Graffiti", logoId: 11, params: { Color1_color: "#FF4500" } },
  { id: "graffiti-green", name: "Graffiti Green", logoId: 11, params: { Color1_color: "#32CD32" } },
  { id: "old-stone", name: "Old Stone", logoId: 12, params: { Color1_color: "#696969" } },
  { id: "carved", name: "Carved", logoId: 13, params: { Color1_color: "#8B4513" } },
  { id: "glitter-gold", name: "Glitter Gold", logoId: 14, params: { Color1_color: "#FFD700", BackgroundColor_color: "#000000" } },
  { id: "glitter-silver", name: "Glitter Silver", logoId: 14, params: { Color1_color: "#C0C0C0", BackgroundColor_color: "#000000" } },
  { id: "glitter-pink", name: "Glitter Pink", logoId: 14, params: { Color1_color: "#FF69B4", BackgroundColor_color: "#000000" } },
  { id: "glitter-blue", name: "Glitter Blue", logoId: 14, params: { Color1_color: "#4169E1", BackgroundColor_color: "#000000" } },
  { id: "glitter-green", name: "Glitter Green", logoId: 14, params: { Color1_color: "#00FF00", BackgroundColor_color: "#000000" } },
  { id: "gradient", name: "Gradient", logoId: 15, params: { Color1_color: "#FF6347" } },
  { id: "gradient-blue", name: "Gradient Blue", logoId: 15, params: { Color1_color: "#1E90FF" } },
  { id: "curvy", name: "Curvy", logoId: 16, params: { Color1_color: "#FF69B4" } },
  { id: "basic-bold", name: "Basic Bold", logoId: 17, params: { Color1_color: "#FFFFFF", BackgroundColor_color: "#000000" } },
  { id: "scratch", name: "Scratch", logoId: 18, params: { Color1_color: "#FFD700" } },
  { id: "elegant", name: "Elegant", logoId: 19, params: { Color1_color: "#FFD700" } },
  { id: "tribal", name: "Tribal", logoId: 21, params: { Color1_color: "#000000" } },
  { id: "sketch", name: "Sketch", logoId: 22, params: { Color1_color: "#333333" } },
  { id: "racing", name: "Racing", logoId: 23, params: { Color1_color: "#FF0000" } },
  { id: "medieval", name: "Medieval", logoId: 24, params: { Color1_color: "#8B4513" } },
  { id: "chalk", name: "Chalk", logoId: 25, params: { Color1_color: "#FFFFFF", BackgroundColor_color: "#2F4F4F" } },
  { id: "sparkle", name: "Sparkle", logoId: 26, params: { Color1_color: "#FFD700", BackgroundColor_color: "#000000" } },
  { id: "sharp", name: "Sharp", logoId: 27, params: { Color1_color: "#FF4500" } },
  { id: "fantasy", name: "Fantasy", logoId: 28, params: { Color1_color: "#9400D3" } },
  { id: "watercolor", name: "Watercolor", logoId: 29, params: { Color1_color: "#87CEEB" } },
  { id: "blocky", name: "Blocky", logoId: 30, params: { Color1_color: "#FF4500" } },
  { id: "glass", name: "Glass", logoId: 31, params: { Color1_color: "#87CEEB" } },
  { id: "stencil", name: "Stencil", logoId: 32, params: { Color1_color: "#2F4F4F" } },
  { id: "matrix", name: "Matrix", logoId: 33, params: { Color1_color: "#00FF00", BackgroundColor_color: "#000000" } },
  { id: "nifty", name: "Nifty", logoId: 34, params: { Color1_color: "#FF6347" } },
  { id: "futuristic", name: "Futuristic", logoId: 35, params: { Color1_color: "#00CED1" } },
  { id: "vintage", name: "Vintage", logoId: 36, params: { Color1_color: "#8B4513" } },
  { id: "candy", name: "Candy", logoId: 37, params: { Color1_color: "#FF69B4" } },
  { id: "pastel", name: "Pastel", logoId: 38, params: { Color1_color: "#DDA0DD" } },
  { id: "metallic", name: "Metallic", logoId: 39, params: { Color1_color: "#B0C4DE" } },
  { id: "pixel", name: "Pixel", logoId: 42, params: { Color1_color: "#FF0000" } },
  { id: "western", name: "Western", logoId: 43, params: { Color1_color: "#8B4513" } },
  { id: "horror", name: "Horror", logoId: 44, params: { Color1_color: "#8B0000" } },
  { id: "sci-fi", name: "Sci-Fi", logoId: 45, params: { Color1_color: "#00CED1" } },
  { id: "frost", name: "Frost", logoId: 46, params: { Color1_color: "#B0E0E6" } },
];

// ─── AUDIO EFFECTS LIST ──────────────────────────────────────────────────────

export const AUDIO_EFFECTS_LIST = [
  { id: "bass", name: "Bass" }, { id: "bassboost", name: "Bass Boost" }, { id: "robot", name: "Robot" },
  { id: "chipmunk", name: "Chipmunk" }, { id: "deep", name: "Deep Voice" }, { id: "echo", name: "Echo" },
  { id: "reverb", name: "Reverb" }, { id: "nightcore", name: "Nightcore" }, { id: "slowed", name: "Slowed" },
  { id: "8d", name: "8D Audio" }, { id: "vaporwave", name: "Vaporwave" }, { id: "karaoke", name: "Karaoke" },
  { id: "treble", name: "Treble Boost" }, { id: "distortion", name: "Distortion" }, { id: "flanger", name: "Flanger" },
  { id: "phaser", name: "Phaser" }, { id: "chorus", name: "Chorus" }, { id: "vibrato", name: "Vibrato" },
  { id: "tremolo", name: "Tremolo" }, { id: "reverse", name: "Reverse" }, { id: "speed2x", name: "Speed 2x" },
  { id: "slow05x", name: "Slow 0.5x" }, { id: "telephone", name: "Telephone" }, { id: "underwater", name: "Underwater" },
  { id: "megaphone", name: "Megaphone" },
];

// ─── EPHOTO EFFECTS LIST ─────────────────────────────────────────────────────

export interface EffectEntry {
  id: string;
  name: string;
  category: string;
  inputType: string;
  required: string;
}

export const PHOTOFUNIA_SUBCATEGORIES = [
  { id: "halloween", name: "Halloween" },
  { id: "christmas", name: "Christmas" },
  { id: "valentine", name: "Valentine's Day" },
  { id: "easter", name: "Easter" },
  { id: "filters", name: "Filters" },
  { id: "lab", name: "Lab" },
  { id: "cards", name: "Cards" },
  { id: "posters", name: "Posters" },
  { id: "galleries", name: "Galleries" },
  { id: "photography", name: "Photography" },
  { id: "faces", name: "Faces" },
  { id: "billboards", name: "Billboards" },
  { id: "celebrities", name: "Celebrities" },
  { id: "frames", name: "Frames" },
  { id: "drawings", name: "Drawings" },
  { id: "vintage", name: "Vintage" },
  { id: "magazines", name: "Magazines" },
  { id: "professions", name: "Professions" },
  { id: "books", name: "Books" },
  { id: "misc", name: "Misc" },
];

export const EPHOTO_SUBCATEGORIES = [
  { id: "text-effects", name: "Text Effects" },
  { id: "3d-effect", name: "3D Effect" },
  { id: "christmas", name: "Merry Christmas" },
  { id: "new-year", name: "Happy New Year" },
  { id: "game-effect", name: "Game Effect" },
  { id: "love", name: "Love" },
  { id: "happy-birthday", name: "Happy Birthday" },
  { id: "fire-effects", name: "Fire Effects" },
  { id: "halloween", name: "Halloween" },
  { id: "tattoo-effects", name: "Tattoo Effects" },
  { id: "artistic-effect", name: "Artistic Effect" },
  { id: "drawing-effects", name: "Drawing Effects" },
  { id: "cup-effects", name: "Cup Effects" },
  { id: "coins-effects", name: "Coins Effects" },
  { id: "festival", name: "Festival" },
  { id: "shirt-effect", name: "Shirt Effect" },
  { id: "glass-effect", name: "Glass Effect" },
  { id: "cover-facebook", name: "Cover Facebook" },
  { id: "technology", name: "Technology" },
  { id: "animations", name: "Animations" },
  { id: "sport-effects", name: "Sport Effects" },
  { id: "video-effect", name: "Video Effect" },
];

export const ephotoEffectsList: EffectEntry[] = [
  { id: "neon", name: "Anonymous Hacker Cyan Neon", category: "text-effects", inputType: "text", required: "text" },
  { id: "colorfulglow", name: "Colorful Glow Neon", category: "text-effects", inputType: "text", required: "text" },
  { id: "advancedglow", name: "Advanced Glow Neon", category: "text-effects", inputType: "text", required: "text" },
  { id: "neononline", name: "Neon Text Online", category: "text-effects", inputType: "text", required: "text" },
  { id: "blueneon", name: "Blue Neon Light", category: "text-effects", inputType: "text", required: "text" },
  { id: "neontext", name: "Neon Text Effect", category: "text-effects", inputType: "text", required: "text" },
  { id: "neonlight", name: "Neon Light Effect", category: "text-effects", inputType: "text", required: "text" },
  { id: "greenneon", name: "Green Neon Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "greenlightneon", name: "Green Light Neon", category: "text-effects", inputType: "text", required: "text" },
  { id: "blueneonlogo", name: "Blue Neon Logo", category: "text-effects", inputType: "text", required: "text" },
  { id: "galaxyneon", name: "Galaxy Neon Style", category: "text-effects", inputType: "text", required: "text" },
  { id: "retroneon", name: "80s Retro Neon", category: "text-effects", inputType: "text", required: "text" },
  { id: "multicolorneon", name: "Multicolor Neon Light", category: "text-effects", inputType: "text", required: "text" },
  { id: "hackerneon", name: "Hacker Neon Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "devilwings", name: "Devil Wings Neon", category: "text-effects", inputType: "text", required: "text" },
  { id: "glowtext", name: "Glow Text Effect", category: "text-effects", inputType: "text", required: "text" },
  { id: "neonglitch", name: "Digital Glitch Neon", category: "text-effects", inputType: "text", required: "text" },
  { id: "neonwall", name: "Neon Writing on Wall", category: "text-effects", inputType: "text", required: "text" },
  { id: "led", name: "LED Text Effect", category: "text-effects", inputType: "text", required: "text" },
  { id: "writeonwetglass", name: "Write on Wet Glass", category: "text-effects", inputType: "text", required: "text" },
  { id: "deadpool", name: "Deadpool Logo Style", category: "text-effects", inputType: "text", required: "text" },
  { id: "dragonball", name: "Dragon Ball Style", category: "text-effects", inputType: "text", required: "text" },
  { id: "typographypavement", name: "Typography Pavement", category: "text-effects", inputType: "text", required: "text" },
  { id: "blackpinklogo", name: "Blackpink Style Logo", category: "text-effects", inputType: "text", required: "text" },
  { id: "bornpink", name: "Born Pink Album Logo", category: "text-effects", inputType: "text", required: "text" },
  { id: "frozen", name: "Frozen Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "gold", name: "Gold Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "horror", name: "Horror Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "blood", name: "Blood Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "lava", name: "Lava Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "thunder", name: "Thunder Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "matrix", name: "Matrix Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "smoke", name: "Smoke Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "naruto", name: "Naruto Shippuden Style", category: "text-effects", inputType: "text", required: "text" },
  { id: "avengers3d", name: "Avengers Text Style", category: "text-effects", inputType: "text", required: "text" },
  { id: "americanflag3d", name: "American Flag Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "wooden3d", name: "Wooden 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "cubic3d", name: "Cubic 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "wooden3donline", name: "Wooden 3D Online", category: "3d-effect", inputType: "text", required: "text" },
  { id: "water3d", name: "Water 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "text3d", name: "3D Text Effect", category: "3d-effect", inputType: "text", required: "text" },
  { id: "graffiti3d", name: "3D Graffiti Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "silver3d", name: "Glossy Silver 3D", category: "3d-effect", inputType: "text", required: "text" },
  { id: "style3d", name: "3D Style Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "metal3d", name: "Metallic 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "comic3d", name: "3D Comic Style Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "hologram3d", name: "Hologram 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "gradient3d", name: "Gradient 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "stone3d", name: "Stone 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "space3d", name: "Space 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "sand3d", name: "Sand 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "snow3d", name: "Snow 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "papercut3d", name: "Paper Cut 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "balloon3d", name: "Balloon 3D Text", category: "3d-effect", inputType: "text", required: "text" },
  { id: "christmas3d", name: "Christmas 3D Text", category: "christmas", inputType: "text", required: "text" },
  { id: "christmas-sparkles", name: "Sparkles Christmas Text", category: "christmas", inputType: "text", required: "text" },
  { id: "christmas-snow3d", name: "Christmas Snow 3D Text", category: "christmas", inputType: "text", required: "text" },
  { id: "christmas-frozen", name: "Frozen Christmas Text", category: "christmas", inputType: "text", required: "text" },
  { id: "christmas-gold", name: "Christmas Gold Glitter", category: "christmas", inputType: "text", required: "text" },
  { id: "newyear-gold", name: "New Year Gold Text", category: "new-year", inputType: "text", required: "text" },
  { id: "pubglogo", name: "PUBG Logo Maker", category: "game-effect", inputType: "text", required: "text" },
  { id: "valorantbanner", name: "Valorant YouTube Banner", category: "game-effect", inputType: "text", required: "text" },
  { id: "birthday3d", name: "Birthday 3D Text", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "pubgbirthday", name: "PUBG Birthday Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "flowerbirthday", name: "Flower Birthday Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "fire", name: "Fire Text Effect", category: "fire-effects", inputType: "text", required: "text" },
  { id: "flamelettering", name: "Flame Lettering", category: "fire-effects", inputType: "text", required: "text" },
  { id: "horrorcemetery", name: "Horror Cemetery Name", category: "halloween", inputType: "text", required: "text" },
  { id: "halloweentheme", name: "Halloween Theme Text", category: "halloween", inputType: "text", required: "text" },
  { id: "bloodwall", name: "Blood Wall Text", category: "halloween", inputType: "text", required: "text" },
  { id: "frankensteintext", name: "Frankenstein Text", category: "halloween", inputType: "text", required: "text" },
  { id: "horrormetal", name: "Horror Metal Text", category: "halloween", inputType: "text", required: "text" },
  { id: "halloweentext", name: "Halloween Text Effect", category: "halloween", inputType: "text", required: "text" },
  { id: "halloweeneffect", name: "Halloween Neon Text", category: "halloween", inputType: "text", required: "text" },
  { id: "horrortext", name: "Horror Text Online", category: "halloween", inputType: "text", required: "text" },
  { id: "halloweencard", name: "Halloween Card Text", category: "halloween", inputType: "text", required: "text" },
  { id: "nametattoo", name: "Name Tattoo Online", category: "tattoo-effects", inputType: "text", required: "text" },
  { id: "foilballoon3d", name: "3D Foil Balloon Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "colorfulpaint3d", name: "3D Colorful Paint Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "blackpinksignature", name: "Blackpink Signature Logo", category: "text-effects", inputType: "text", required: "text" },
  { id: "dragonballtext", name: "Dragon Ball Text Effect", category: "text-effects", inputType: "text", required: "text" },
  { id: "glossysilver3d", name: "Glossy Silver 3D Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "typographyart", name: "Typography Art Layers", category: "text-effects", inputType: "text", required: "text" },
  { id: "foggyglass", name: "Handwritten Foggy Glass Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "narutologo", name: "Naruto Shippuden Logo Text", category: "text-effects", inputType: "text", required: "text" },
  { id: "chocolatecake", name: "Chocolate Birthday Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "rosecake", name: "Rose Flower Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "amazingflowercake", name: "Amazing Flower Birthday Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "redrosebirthday", name: "Red Rose Birthday Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "greetingcake", name: "Greeting Birthday Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "anniversarycake", name: "Anniversary Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "romanticflowercake", name: "Romantic Flower Cake", category: "happy-birthday", inputType: "text", required: "text" },
  { id: "pubglogo2", name: "PUBG Logo 2", category: "game-effect", inputType: "text", required: "text" },
  { id: "pubgesports", name: "PUBG eSports Logo", category: "game-effect", inputType: "text", required: "text" },
  { id: "warzonecover", name: "Warzone Cover Banner", category: "game-effect", inputType: "text", required: "text" },
  { id: "aovbanner", name: "Arena of Valor Banner", category: "game-effect", inputType: "text", required: "text" },
  { id: "sunlightshadow", name: "Sunlight Shadow Love Text", category: "love", inputType: "text", required: "text" },
  { id: "heartwinggif", name: "Heart Wings Name GIF", category: "love", inputType: "text", required: "text" },
  { id: "loveballoons", name: "Love Balloons Card", category: "love", inputType: "text", required: "text" },
  { id: "cfcover", name: "CrossFire Cover", category: "cover-facebook", inputType: "text", required: "text" },
  { id: "lolcover", name: "League of Legends Cover", category: "cover-facebook", inputType: "text", required: "text" },
  { id: "csgocover", name: "CS:GO Cover", category: "cover-facebook", inputType: "text", required: "text" },
  { id: "dota2cover", name: "Dota 2 Cover", category: "cover-facebook", inputType: "text", required: "text" },
  { id: "overwatchcover", name: "Overwatch Cover", category: "cover-facebook", inputType: "text", required: "text" },
  { id: "onepiececover", name: "One Piece Cover", category: "cover-facebook", inputType: "text", required: "text" },
  { id: "dragonballcover", name: "Dragon Ball Cover", category: "cover-facebook", inputType: "text", required: "text" },
  { id: "youtubebutton", name: "YouTube Subscribe Button", category: "technology", inputType: "text", required: "text" },
  { id: "examcrank", name: "Exam Results GIF", category: "animations", inputType: "text", required: "text" },
];

export const photofuniaEffectsList: EffectEntry[] = [
  { id: "smokeflare", name: "Smoke Flare", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "nightmarewriting", name: "Nightmare Writing", category: "halloween", inputType: "txt", required: "text" },
  { id: "lightning", name: "Lightning", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "cemeterygates", name: "Cemetery Gates", category: "halloween", inputType: "txt", required: "text" },
  { id: "summoningspirits", name: "Summoning Spirits", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "ghostwood", name: "Ghost Wood", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "halloweenpumpkins", name: "Halloween Pumpkins", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "hauntedhotel", name: "Haunted Hotel", category: "halloween", inputType: "both", required: "imageUrl, text" },
  { id: "burningfire", name: "Burning Fire", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "frankensteinmonster", name: "Frankenstein Monster", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "dayofthedead", name: "Day of the Dead", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "bloodwriting", name: "Blood Writing", category: "halloween", inputType: "both", required: "imageUrl, text" },
  { id: "witchwithapple", name: "Witch with Apple", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "tvprisoner", name: "TV Prisoner", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "vampire", name: "Vampire", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "halloweenhat", name: "Halloween Hat", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "pumpkins", name: "Pumpkins", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "fireeffect", name: "Fire", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "zombie", name: "Zombie", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "witch", name: "Witch", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "captivity", name: "Captivity", category: "halloween", inputType: "img", required: "imageUrl" },
];



// ─── EPHOTO360 INDIVIDUAL EFFECT ENDPOINTS ─────────────────────────────────

const ephotoIndividualEndpoints: ApiEndpoint[] = ephotoEffectsList.map(e => 
  createEndpoint(
    `/api/ephoto/${e.id}`,
    "GET",
    `Generate ${e.name} text effect via Ephoto360.com - ${e.category} category.`,
    [{ name: "text", type: "string", required: true, description: "Text to render", default: "MeganAPI" }],
    "json",
    "text-effects",
    "ephoto",
    "v0",
    "2025-12-15T11:00:00.000Z",
    "Ephoto360",
    [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR],
    30
  )
);

// ─── PHOTOFUNIA INDIVIDUAL EFFECT ENDPOINTS ────────────────────────────────

const photofuniaIndividualEndpoints: ApiEndpoint[] = photofuniaEffectsList.map(e => {
  const params: ApiParam[] = [];
  if (e.required.includes("imageUrl")) params.push({ name: "imageUrl", type: "string", required: true, description: "Image URL to process" });
  if (e.required.includes("text")) params.push({ name: "text", type: "string", required: true, description: "Text input" });
  return createEndpoint(
    `/api/photofunia/${e.id}`,
    "GET",
    `Generate ${e.name} effect via PhotoFunia.com - ${e.category} category.`,
    params,
    "json",
    "text-effects",
    "photofunia",
    "v0",
    "2026-01-01T09:00:00.000Z",
    "PhotoFunia",
    [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR],
    30
  );
});

// ─── TEXTPRO INDIVIDUAL EFFECT ENDPOINTS ───────────────────────────────────

const textproIndividualEndpoints: ApiEndpoint[] = TEXTPRO_EFFECTS.map(e =>
  createEndpoint(
    `/api/textpro/${e.id}`,
    "GET",
    `Generate ${e.name} text effect via TextPro - CoolText API.`,
    [{ name: "text", type: "string", required: true, description: "Text to render", default: "MeganAPI" }],
    "json",
    "text-effects",
    "textpro",
    "v0",
    "2026-02-15T10:00:00.000Z",
    "CoolText",
    [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR],
    30
  )
);

// ─── AUDIO EFFECT INDIVIDUAL ENDPOINTS ─────────────────────────────────────

const audioIndividualEndpoints: ApiEndpoint[] = AUDIO_EFFECTS_LIST.map(e =>
  createEndpoint(
    `/api/audio/${e.id}`,
    "GET",
    `${e.name} audio effect - apply ${e.name} effect to audio/video using FFmpeg.`,
    [{ name: "url", type: "string", required: true, description: "Audio/video URL to process" }],
    "json",
    "tools",
    "converter",
    "v0",
    "2026-01-20T11:00:00.000Z",
    "FFmpeg",
    [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR],
    20
  )
);

// ─── ANIME INDIVIDUAL ENDPOINTS ────────────────────────────────────────────

const animeTypes = [
  "waifu", "neko", "shinobu", "megumin", "cuddle", "hug", "kiss", "pat", "smug", "bonk",
  "blush", "smile", "wave", "dance", "cry", "slap", "bite", "poke", "happy", "wink",
  "highfive", "sleep", "laugh", "thumbsup", "stare", "baka", "facepalm", "yawn", "nervous", "punch"
];

const animeIndividualEndpoints: ApiEndpoint[] = animeTypes.map(type =>
  createEndpoint(
    `/api/anime/${type}`,
    "GET",
    `Get random ${type} anime image or GIF.`,
    [],
    "json",
    "fun",
    "anime",
    "v0",
    "2025-11-15T10:00:00.000Z",
    type.includes("highfive") || type.includes("sleep") || type.includes("laugh") || type.includes("thumbsup") || type.includes("stare") || type.includes("baka") || type.includes("facepalm") || type.includes("yawn") || type.includes("nervous") || type.includes("punch") ? "nekos.best" : "waifu.pics",
    [SC.SUCCESS, SC.SERVER_ERROR],
    60
  )
);


// ─── ALL ENDPOINTS COMPLETE ─────────────────────────────────────────────────

const stickerEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/v2/sticker/stickerly-detail", "GET", "Get detailed Sticker.ly sticker pack info by share URL. Returns pack name, author details (name, username, bio, followers), sticker list with image URLs, view count, export count, and thumbnail.", [
    { name: "url", type: "string", required: true, description: "Sticker.ly share URL (https://sticker.ly/s/...)", default: "https://sticker.ly/s/W7ES6T" }
  ], "json", "sticker", "stickerly", "v2", "2026-08-01T10:00:00.000Z", "Stickerly", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/sticker/stickerly-detail", "POST", "Get detailed Sticker.ly sticker pack info via JSON body. Returns pack name, author info, sticker list with images, and pack metrics.", [
    { name: "url", type: "string", required: true, description: "Sticker.ly share URL" }
  ], "json", "sticker", "stickerly", "v2", "2026-08-01T10:00:00.000Z", "Stickerly", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/sticker/stickerly-search", "GET", "Search Sticker.ly sticker packs by keyword. Returns pack name, author, sticker count, view count, export count, thumbnail URL, and share URL.", [
    { name: "query", type: "string", required: true, description: "Search keyword for sticker packs", default: "love" }
  ], "json", "sticker", "stickerly", "v2", "2026-08-02T09:00:00.000Z", "Stickerly", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/sticker/stickerly-search", "POST", "Search Sticker.ly sticker packs via JSON body. Returns pack details including name, author, counts, and thumbnail.", [
    { name: "query", type: "string", required: true, description: "Search keyword" }
  ], "json", "sticker", "stickerly", "v2", "2026-08-02T09:00:00.000Z", "Stickerly", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 30),
];

const newToolEndpoints: ApiEndpoint[] = [
  createEndpoint("/api/v2/tools/translate", "GET", "Translate text between languages using Google Translate. Supports auto-detection of source language and 100+ target languages.", [
    { name: "text", type: "string", required: true, description: "Text to translate", default: "Hello world" },
    { name: "source", type: "string", required: false, description: "Source language code (default: auto)", default: "auto" },
    { name: "target", type: "string", required: false, description: "Target language code (default: id)", default: "id" }
  ], "json", "tools", "text-tools", "v2", "2026-08-01T10:00:00.000Z", "Google Translate", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/tools/kodepos", "GET", "Search Indonesian postal code information by location name. Returns postal code, village, sub-district, city, and province.", [
    { name: "form", type: "string", required: true, description: "Location name (village, district, etc.)", default: "pasiran jaya" }
  ], "json", "tools", "text-tools", "v2", "2026-08-02T09:00:00.000Z", "Pos Indonesia", [SC.SUCCESS, SC.BAD_REQUEST, SC.NOT_FOUND, SC.SERVER_ERROR], 60),
  createEndpoint("/api/v2/tools/vcc-generator", "GET", "Generate virtual credit card details for testing. Supports Visa, MasterCard, Amex, CUP, JCB, Diners, and RuPay.", [
    { name: "type", type: "string", required: true, description: "Card type (Visa, MasterCard, Amex, CUP, JCB, Diners, RuPay)", default: "MasterCard", options: ["Visa", "MasterCard", "Amex", "CUP", "JCB", "Diners", "RuPay"] },
    { name: "count", type: "number", required: false, description: "Number of cards (1-5, default: 1)", default: "1" }
  ], "json", "tools", "text-tools", "v2", "2026-08-03T10:00:00.000Z", "NeaPay", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
  createEndpoint("/api/v2/tools/ngl", "GET", "Send anonymous message to an NGL.link profile.", [
    { name: "link", type: "string", required: true, description: "NGL.link profile URL", default: "https://ngl.link/username" },
    { name: "text", type: "string", required: true, description: "Anonymous message to send", default: "Hello!" }
  ], "json", "tools", "text-tools", "v2", "2026-08-04T11:00:00.000Z", "NGL", [SC.SUCCESS, SC.BAD_REQUEST, SC.SERVER_ERROR], 30),
];

export const allEndpoints: ApiEndpoint[] = [
  // Artificial Intelligence (40+ endpoints)
  ...aiChatV0Endpoints,
  ...aiChatV2Endpoints,
  ...specializedAIEndpoints,
  ...aiImageEndpoints,
  ...aiVideoEndpoints,
  ...aiToolEndpoints,
  
  // Media Downloader
  ...youtubeEndpoints,
  ...socialMediaEndpoints,
  ...musicStreamingEndpoints,
  
  // Search
  ...webSearchEndpoints,
  ...developerSearchEndpoints,
  ...v2SearchEndpoints,
  
  // Stalker
  ...stalkerEndpoints,
  
  // Security
  ...networkSecurityEndpoints,
  ...webSecurityEndpoints,
  ...hashSecurityEndpoints,
  
  // Tools
  ...textToolsEndpoints,
  ...developerToolsEndpoints,
  ...converterEndpoints,
  ...mathToolsEndpoints,
  ...encodingToolsEndpoints,
  ...qrToolsEndpoints,
  ...pdfToolsEndpoints,
  ...authToolsEndpoints,
  ...whatsappEndpoints,
  ...emailEndpoints,
  ...timeEndpoints,
  
  // Fun
  ...funJokesEndpoints,
  ...funGamesEndpoints,
  ...animeEndpoints,
  ...funContentEndpoints,
  ...funDataEndpoints,
  
  // Data
  ...newsEndpoints,
  ...cryptoEndpoints,
  ...forexEndpoints,
  ...sportsEndpoints,
  ...educationEndpoints,
  ...jobsEndpoints,
  ...zodiacEndpoints,
  
  // Media
  ...movieStreamingEndpoints,
  ...animeStreamingEndpoints,
  ...goreStreamingEndpoints,
  
  // Text Effects
  ...ephotoEndpoints,
  ...photofuniaEndpoints,
  ...textproEndpoints,
  ...ephotoIndividualEndpoints,
  ...photofuniaIndividualEndpoints,
  ...textproIndividualEndpoints,
  ...audioIndividualEndpoints,
  ...animeIndividualEndpoints,
  
  // URL
  ...urlShortenerEndpoints,
  
  // Scraping
  ...scrapingEndpoints,
  
  // Image Processing
  ...imageProcessingEndpoints,
  
  // Admin
  ...adminEndpoints,
  
  // Sticker
  ...stickerEndpoints,
  
  // New Tools
  ...newToolEndpoints,
];


// ─── STICKER ENDPOINTS ─────────────────────────────────────────────────────



// ─── NEW LIGHTWEIGHT TOOL ENDPOINTS ────────────────────────────────────────


export const allEndpointsComplete = allEndpoints;

