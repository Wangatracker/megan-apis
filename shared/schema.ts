import { z } from "zod";

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

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  params: ApiParam[];
  format: string;
  category: string;
  provider?: string;
  subcategory?: string;
}

export const apiCategories = [
  { id: "ai-chat", name: "AI Chat", description: "Free AI chat completion APIs — 33 models", icon: "MessageSquare" },
  { id: "ai-tools", name: "AI Tools", description: "AI-powered utilities: translate, summarize, code, scanner, humanizer", icon: "Wand2" },
  { id: "ai-image", name: "AI Image", description: "Free image search and generation APIs", icon: "Image" },
  { id: "music", name: "Music & Media", description: "YouTube search, MP3, MP4 download, lyrics, SoundCloud, Bible AI", icon: "Music" },
  { id: "social-media", name: "Social Media", description: "Download from YouTube, TikTok, Instagram, Facebook, Twitter/X, Snapchat", icon: "Share2" },
  { id: "spotify", name: "Spotify", description: "Search and download Spotify tracks, albums, artists, playlists", icon: "Music2" },
  { id: "shazam", name: "Shazam", description: "Search songs and recognize music from audio", icon: "AudioLines" },
  { id: "ephoto", name: "Ephoto360", description: "110+ text effects: neon, 3D, fire, glitch, artistic and more", icon: "Sparkles" },
  { id: "photofunia", name: "PhotoFunia", description: "340+ photo effects: filters, billboards, lab, cards, frames, posters and more", icon: "ImagePlus" },
  { id: "stalker", name: "Stalker", description: "Profile lookup and OSINT tools", icon: "Eye" },
  { id: "anime", name: "Anime", description: "30 anime reaction GIFs and images", icon: "Cat" },
  { id: "fun", name: "Fun", description: "Jokes, quotes, pickup lines, roasts, compliments and more", icon: "Laugh" },
  { id: "urlshortener", name: "URL", description: "URL shortening and image hosting services", icon: "Link" },
  { id: "tools", name: "Tools", description: "QR codes, dictionary, weather, passwords, and more utilities", icon: "Wrench" },
  { id: "security", name: "Security", description: "Ethical hacking, OSINT, vulnerability scanning tools", icon: "ShieldCheck" },
  { id: "sports", name: "Sports", description: "Live scores, fixtures, standings, team & player data", icon: "Trophy" },
  { id: "search", name: "Search", description: "Wikipedia, news, GitHub, NPM, Reddit, YouTube, images, videos", icon: "Search" },
  { id: "textpro", name: "Text Effects", description: "109 text effect generators: neon, 3D, chrome, fire, glitter and more", icon: "Type" },
  { id: "converter", name: "Converter", description: "Media conversion tools for WhatsApp bots", icon: "RefreshCw" },
  { id: "audio-fx", name: "Audio Effects", description: "25 audio effects: bass boost, robot, echo, nightcore, 8D and more", icon: "Headphones" },
  { id: "zodiac", name: "Zodiac", description: "Zodiac signs, horoscopes, compatibility, and elements", icon: "Star" },
  { id: "games", name: "Games", description: "Rock Paper Scissors, Flag Guess, Word Scramble, Number Guess", icon: "Gamepad2" },
  { id: "education", name: "Education", description: "Academic papers, books, dictionary, and reference APIs", icon: "BookOpen" },
  { id: "news", name: "News", description: "Kenyan and global news scraping APIs", icon: "Newspaper" },
  { id: "classifieds", name: "Classifieds", description: "Jiji and Pigiame classifieds scraping", icon: "Tag" },
  { id: "jobs", name: "Jobs", description: "Kenyan job listings from BrighterMonday", icon: "Briefcase" },
  { id: "crypto", name: "Crypto", description: "Live cryptocurrency prices and top 10 coins", icon: "Bitcoin" },
  { id: "forex", name: "Forex", description: "Live exchange rates and currency conversion", icon: "DollarSign" },
  { id: "dev-tools", name: "Dev Tools", description: "Deobfuscate, deminify, sandbox JS, headless browser, auto-decode", icon: "Code2" },
  { id: "scraping", name: "Scraping", description: "Website scraping: links, inspect, scripts, cookies, full page", icon: "Globe" },
  { id: "fun-data", name: "Fun Data", description: "Kenyan proverbs, Swahili phrases, dad jokes, affirmations", icon: "Smile" },
  { id: "admin", name: "Admin & Keys", description: "API key management, admin settings, security, provider health", icon: "Settings" },
  { id: "meta", name: "Meta", description: "Server status, endpoint catalog, media status, proxy/stream", icon: "Info" },
  { id: "media", name: "Media Streaming", description: "Movie, video, and tokusatsu streaming with direct MP4 links", icon: "Film" },
];

const Q_PARAM = [{ name: "q", type: "string", required: true, description: "Your message or question", default: "Hello! How are you?" }];

const aiChatEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/gpt", method: "GET", description: "Chat with GPT - general purpose AI assistant", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/claude", method: "GET", description: "Chat with Claude-style AI assistant", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/mistral", method: "GET", description: "Chat with Mistral AI assistant", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/gemini", method: "GET", description: "Chat with Gemini AI assistant", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/deepseek", method: "GET", description: "Chat with DeepSeek AI assistant", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/venice", method: "GET", description: "Chat with Venice AI assistant", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/groq", method: "GET", description: "Chat with Groq AI - fast inference", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/cohere", method: "GET", description: "Chat with Cohere AI assistant", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/llama", method: "GET", description: "Chat with LLaMA - Meta's open model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/mixtral", method: "GET", description: "Chat with Mixtral - mixture of experts model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/phi", method: "GET", description: "Chat with Phi - Microsoft's efficient model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/qwen", method: "GET", description: "Chat with Qwen - Alibaba's language model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/falcon", method: "GET", description: "Chat with Falcon - TII's open model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/vicuna", method: "GET", description: "Chat with Vicuna - open-source chatbot", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/openchat", method: "GET", description: "Chat with OpenChat model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/wizard", method: "GET", description: "Chat with WizardLM - instruction-following AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/zephyr", method: "GET", description: "Chat with Zephyr - chat-tuned AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/codellama", method: "GET", description: "Chat with CodeLlama - code-specialized AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/starcoder", method: "GET", description: "Chat with StarCoder - code generation AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/dolphin", method: "GET", description: "Chat with Dolphin - uncensored AI model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/nous", method: "GET", description: "Chat with Nous Hermes AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/openhermes", method: "GET", description: "Chat with OpenHermes AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/neural", method: "GET", description: "Chat with NeuralChat - Intel's AI model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/solar", method: "GET", description: "Chat with Solar AI model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/yi", method: "GET", description: "Chat with Yi - bilingual language model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/tinyllama", method: "GET", description: "Chat with TinyLlama - compact AI model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/orca", method: "GET", description: "Chat with Orca - reasoning-focused AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/command", method: "GET", description: "Chat with Command R by Cohere", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/nemotron", method: "GET", description: "Chat with Nemotron - NVIDIA's AI model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/internlm", method: "GET", description: "Chat with InternLM - multilingual AI", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/chatglm", method: "GET", description: "Chat with ChatGLM - bilingual model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/wormgpt", method: "GET", description: "Chat with WormGPT - unrestricted AI model", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/replit", method: "GET", description: "Chat with Replit AI - coding assistant for code generation and debugging", params: Q_PARAM, format: "json", category: "ai-chat", provider: "ChatEverywhere" },
];

const aiToolEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/translate", method: "POST", description: "AI-powered text translation", params: [{ name: "text", type: "string", required: true, description: "Text to translate", default: "Hello, how are you?" }, { name: "to", type: "string", required: false, description: "Target language (default: en)", default: "es" }, { name: "from", type: "string", required: false, description: "Source language (default: auto)", default: "en" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/summarize", method: "POST", description: "AI-powered text summarization", params: [{ name: "text", type: "string", required: true, description: "Text to summarize", default: "Artificial intelligence is the simulation of human intelligence processes by machines, especially computer systems." }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/code", method: "POST", description: "AI code generation assistant", params: [{ name: "prompt", type: "string", required: true, description: "Code task description", default: "Write a function to reverse a string" }, { name: "language", type: "string", required: false, description: "Programming language (e.g. python, javascript)", default: "python" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/scanner", method: "POST", description: "AI content scanner - detect if text is AI-generated or human-written", params: [{ name: "text", type: "string", required: true, description: "Text to scan for AI detection", default: "The rapid development of artificial intelligence has led to transformative changes across many industries." }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/humanizer", method: "POST", description: "AI text humanizer - rewrite AI-generated text to sound human-written", params: [{ name: "text", type: "string", required: true, description: "AI-generated text to humanize", default: "The rapid development of artificial intelligence has led to transformative changes across many industries." }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
];

const aiImageEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/image/dall-e", method: "POST", description: "Search for images by prompt (Unsplash-powered)", params: [{ name: "prompt", type: "string", required: true, description: "Image search description", default: "a wolf howling at the moon" }], format: "json", category: "ai-image", provider: "ChatEverywhere" },
  { path: "/api/ai/image/pixabay", method: "GET", description: "Search and get stock images by keyword", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "wolf" }, { name: "page", type: "number", required: false, description: "Page number (default 1)", default: "1" }], format: "json", category: "ai-image", provider: "Unsplash + Picsum" },
  { path: "/api/ai/image/lorem-picsum", method: "GET", description: "Get random placeholder image from Lorem Picsum", params: [{ name: "width", type: "number", required: false, description: "Image width (default 800)", default: "800" }, { name: "height", type: "number", required: false, description: "Image height (default 600)", default: "600" }], format: "json", category: "ai-image", provider: "Lorem Picsum" },
  { path: "/api/ai/image/lorem-flickr", method: "GET", description: "Get random themed image from LoremFlickr", params: [{ name: "q", type: "string", required: true, description: "Image theme keyword", default: "wolf" }, { name: "width", type: "number", required: false, description: "Image width (default 800)", default: "800" }, { name: "height", type: "number", required: false, description: "Image height (default 600)", default: "600" }], format: "json", category: "ai-image", provider: "LoremFlickr" },
  { path: "/api/ai/image/dog", method: "GET", description: "Get random dog image", params: [], format: "json", category: "ai-image", provider: "Dog CEO" },
  { path: "/api/ai/image/cat", method: "GET", description: "Get random cat image", params: [], format: "json", category: "ai-image", provider: "CATAAS" },
  { path: "/api/ai/image/pollinations", method: "GET", description: "Generate AI image using Stable Diffusion (free, no key)", params: [{ name: "q", type: "string", required: true, description: "Image prompt", default: "beautiful landscape" }, { name: "width", type: "number", required: false, description: "Width (default 1024)", default: "1024" }, { name: "height", type: "number", required: false, description: "Height (default 1024)", default: "1024" }], format: "json", category: "ai-image", provider: "Pollinations AI" },
  { path: "/api/ai/image/flux", method: "GET", description: "Generate AI image using Flux model (high quality)", params: [{ name: "q", type: "string", required: true, description: "Image prompt", default: "cyberpunk city" }, { name: "width", type: "number", required: false, description: "Width (default 1024)", default: "1024" }, { name: "height", type: "number", required: false, description: "Height (default 1024)", default: "1024" }], format: "json", category: "ai-image", provider: "Pollinations AI" },
  { path: "/api/ai/image/art", method: "GET", description: "Generate artistic AI image with style control", params: [{ name: "q", type: "string", required: true, description: "Image prompt", default: "dragon" }, { name: "style", type: "string", required: false, description: "Art style (realistic, fantasy, etc.)", default: "fantasy" }], format: "json", category: "ai-image", provider: "Pollinations AI" },
  { path: "/api/ai/image/anime", method: "GET", description: "Generate anime-style AI image (Studio Ghibli inspired)", params: [{ name: "q", type: "string", required: true, description: "Image prompt", default: "samurai" }], format: "json", category: "ai-image", provider: "Pollinations AI" },
];

const musicEndpoints: ApiEndpoint[] = [
  { path: "/api/search", method: "GET", description: "Search for songs by keyword", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist, etc.)", default: "Home NF" }], format: "json", category: "music" },
  { path: "/download/mp3", method: "GET", description: "Download audio as MP3 - supports YouTube URL or song name", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp3", category: "music" },
  { path: "/download/mp4", method: "GET", description: "Download video as MP4 - supports YouTube URL or song name", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp4", category: "music" },
  { path: "/download/audio", method: "GET", description: "Extract audio from YouTube", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp3", category: "music" },
  { path: "/download/ytmp3", method: "GET", description: "Convert YouTube video to MP3", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp3", category: "music" },
  { path: "/download/dlmp3", method: "GET", description: "Direct MP3 download", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp3", category: "music" },
  { path: "/download/yta", method: "GET", description: "YouTube Audio extractor (primary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp3", category: "music" },
  { path: "/download/yta2", method: "GET", description: "YouTube Audio extractor (secondary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp3", category: "music" },
  { path: "/download/yta3", method: "GET", description: "YouTube Audio extractor (tertiary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp3", category: "music" },
  { path: "/download/ytmp4", method: "GET", description: "Convert YouTube video to MP4", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp4", category: "music" },
  { path: "/download/ytmp5", method: "GET", description: "Get both MP3 and MP4 download URLs in one response", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "json", category: "music" },
  { path: "/download/dlmp4", method: "GET", description: "Direct MP4 download", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp4", category: "music" },
  { path: "/download/video", method: "GET", description: "Extract video from YouTube", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp4", category: "music" },
  { path: "/download/hd", method: "GET", description: "Download YouTube video in HD quality", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "mp4", category: "music" },
  { path: "/download/lyrics", method: "GET", description: "Get song lyrics by name", params: [{ name: "q", type: "string", required: true, description: "Song name and artist", default: "Home NF" }], format: "json", category: "music" },
  { path: "/stream", method: "GET", description: "Stream audio/video with direct playback", params: [{ name: "q", type: "string", required: true, description: "YouTube URL or search query", default: "" }, { name: "type", type: "string", required: false, description: "mp3 or mp4", default: "mp3" }], format: "stream", category: "music" },
  { path: "/proxy", method: "GET", description: "Proxy media content with proper headers", params: [{ name: "url", type: "string", required: true, description: "Media URL to proxy", default: "" }], format: "stream", category: "music" },
  { path: "/api/music/search", method: "GET", description: "Search music across platforms", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "Home NF" }], format: "json", category: "music", provider: "Multi" },
  { path: "/api/music/trending", method: "GET", description: "Get trending music", params: [], format: "json", category: "music", provider: "Multi" },
  { path: "/api/music/artist", method: "GET", description: "Search artist info", params: [{ name: "q", type: "string", required: true, description: "Artist name", default: "NF" }], format: "json", category: "music", provider: "Multi" },
  { path: "/api/soundcloud/download", method: "GET", description: "Download SoundCloud track", params: [{ name: "url", type: "string", required: true, description: "SoundCloud URL", default: "" }], format: "json", category: "music", provider: "SoundCloud" },
  { path: "/api/soundcloud/search", method: "GET", description: "Search SoundCloud tracks", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "lofi" }], format: "json", category: "music", provider: "SoundCloud" },
  { path: "/api/bible/ai", method: "GET", description: "AI-powered Bible Q&A", params: [{ name: "q", type: "string", required: true, description: "Bible question", default: "What is love?" }], format: "json", category: "music", provider: "Bible AI" },
];

const socialMediaEndpoints: ApiEndpoint[] = [
  { path: "/api/download/youtube", method: "GET", description: "Download YouTube videos in multiple qualities", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Video name to search", default: "Home NF" }], format: "json", category: "social-media" },
  { path: "/api/download/youtube/mp3", method: "GET", description: "Download YouTube video as MP3 audio", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Home NF" }], format: "json", category: "social-media" },
  { path: "/api/download/youtube/mp4", method: "GET", description: "Download YouTube video as MP4", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }, { name: "q", type: "string", required: false, description: "Video name to search", default: "Home NF" }], format: "json", category: "social-media" },
  { path: "/api/download/youtube/info", method: "GET", description: "Get YouTube video info without downloading", params: [{ name: "url", type: "string", required: true, description: "YouTube video URL", default: "https://www.youtube.com/watch?v=e-ORhEE9VVg" }], format: "json", category: "social-media" },
  { path: "/api/download/youtube/search", method: "GET", description: "Search YouTube videos", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "Home NF" }], format: "json", category: "social-media" },
  { path: "/api/download/tiktok", method: "GET", description: "Download TikTok video without watermark", params: [{ name: "url", type: "string", required: true, description: "TikTok video URL", default: "https://www.tiktok.com/@tiktok/video/6844509757497708805" }], format: "json", category: "social-media", provider: "ssstik.io" },
  { path: "/api/download/tiktok/audio", method: "GET", description: "Extract audio from TikTok video", params: [{ name: "url", type: "string", required: true, description: "TikTok video URL", default: "https://www.tiktok.com/@tiktok/video/6844509757497708805" }], format: "json", category: "social-media", provider: "ssstik.io" },
  { path: "/api/download/tiktok/info", method: "GET", description: "Get TikTok video info (title, author, stats)", params: [{ name: "url", type: "string", required: true, description: "TikTok video URL", default: "https://www.tiktok.com/@tiktok/video/6844509757497708805" }], format: "json", category: "social-media", provider: "ssstik.io" },
  { path: "/api/download/snapchat", method: "GET", description: "Download Snapchat stories, spotlights, and profile media", params: [{ name: "url", type: "string", required: true, description: "Snapchat story, spotlight, or profile URL", default: "https://www.snapchat.com/spotlight/12345678901234567" }], format: "json", category: "social-media", provider: "snapmate.io" },
  { path: "/api/download/instagram", method: "GET", description: "Download Instagram videos, photos, reels", params: [{ name: "url", type: "string", required: true, description: "Instagram post/reel URL", default: "https://www.instagram.com/p/CrX8sBLNqCQ/" }], format: "json", category: "social-media", provider: "Multi-provider" },
  { path: "/api/download/instagram/story", method: "GET", description: "Download Instagram story by URL", params: [{ name: "url", type: "string", required: true, description: "Instagram story URL", default: "https://www.instagram.com/stories/tiktok/12345678/" }], format: "json", category: "social-media", provider: "Multi-provider" },
  { path: "/api/download/facebook", method: "GET", description: "Download Facebook videos in SD and HD quality", params: [{ name: "url", type: "string", required: true, description: "Facebook video URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], format: "json", category: "social-media", provider: "fdownloader.net" },
  { path: "/api/download/facebook/reel", method: "GET", description: "Download Facebook Reels", params: [{ name: "url", type: "string", required: true, description: "Facebook Reel URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], format: "json", category: "social-media", provider: "fdownloader.net" },
  { path: "/api/download/facebook/snap", method: "GET", description: "Download Facebook video via snapsave.app — returns multi-quality links array", params: [{ name: "url", type: "string", required: true, description: "Facebook video or Reel URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], format: "json", category: "social-media", provider: "snapsave.app" },
  { path: "/api/download/facebook/info", method: "GET", description: "Get Facebook video metadata (title, thumbnail, quality info)", params: [{ name: "url", type: "string", required: true, description: "Facebook video or Reel URL", default: "https://www.facebook.com/share/v/1C9J5ePwDE/" }], format: "json", category: "social-media", provider: "fdownloader.net" },
  { path: "/api/download/twitter", method: "GET", description: "Download Twitter/X videos and GIFs", params: [{ name: "url", type: "string", required: true, description: "Tweet URL (twitter.com or x.com)", default: "https://x.com/Twitter/status/1460323737035988996" }], format: "json", category: "social-media", provider: "Multi-provider" },
  { path: "/api/download/twitter/info", method: "GET", description: "Get Twitter/X tweet info and media links", params: [{ name: "url", type: "string", required: true, description: "Tweet URL (twitter.com or x.com)", default: "https://x.com/Twitter/status/1460323737035988996" }], format: "json", category: "social-media", provider: "Multi-provider" },
];

const spotifyEndpoints: ApiEndpoint[] = [
  { path: "/api/spotify/search", method: "GET", description: "Search for songs on Spotify", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)", default: "Blinding Lights" }], format: "json", category: "spotify", provider: "Spotdown" },
  { path: "/api/spotify/download", method: "GET", description: "Download a Spotify track as MP3", params: [{ name: "url", type: "string", required: false, description: "Spotify track URL", default: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b" }, { name: "q", type: "string", required: false, description: "Song name to search", default: "Blinding Lights" }], format: "json", category: "spotify", provider: "Spotdown" },
  { path: "/api/spotify/track/:id", method: "GET", description: "Get detailed track info by Spotify track ID", params: [{ name: "id", type: "string", required: true, description: "Spotify track ID", default: "0VjIjW4GlUZAMYd2vXMi3b" }], format: "json", category: "spotify", provider: "Spotify API" },
  { path: "/api/spotify/album/:id", method: "GET", description: "Get album info and full track listing by Spotify album ID", params: [{ name: "id", type: "string", required: true, description: "Spotify album ID", default: "4aawyAB9vmqN3uQ7FjRGTy" }], format: "json", category: "spotify", provider: "Spotify API" },
  { path: "/api/spotify/artist/:id", method: "GET", description: "Get artist info by Spotify artist ID", params: [{ name: "id", type: "string", required: true, description: "Spotify artist ID", default: "06HL4z0CvFAxyc27GXpf02" }], format: "json", category: "spotify", provider: "Spotify API" },
  { path: "/api/spotify/artist/:id/top-tracks", method: "GET", description: "Get an artist's top tracks by Spotify artist ID", params: [{ name: "id", type: "string", required: true, description: "Spotify artist ID", default: "06HL4z0CvFAxyc27GXpf02" }], format: "json", category: "spotify", provider: "Spotify API" },
  { path: "/api/spotify/playlist/:id", method: "GET", description: "Get playlist info and full track listing by Spotify playlist ID", params: [{ name: "id", type: "string", required: true, description: "Spotify playlist ID", default: "37i9dQZF1DXcBWIGoYBM5M" }], format: "json", category: "spotify", provider: "Spotify API" },
  { path: "/api/spotify/info/search", method: "GET", description: "Search Spotify via GraphQL for tracks, albums, artists or playlists", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "Blinding Lights" }, { name: "type", type: "string", required: false, description: "Result type: track | album | artist | playlist (default: track)", default: "track" }, { name: "limit", type: "string", required: false, description: "Max results (1–50, default: 20)", default: "20" }, { name: "offset", type: "string", required: false, description: "Pagination offset (default: 0)", default: "0" }], format: "json", category: "spotify", provider: "Spotify API" },
];

const shazamEndpoints: ApiEndpoint[] = [
  { path: "/api/shazam/search", method: "GET", description: "Search for songs on Shazam", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)", default: "Home NF" }], format: "json", category: "shazam", provider: "Shazam" },
  { path: "/api/shazam/recognize", method: "POST", description: "Identify a song from audio", params: [{ name: "audio", type: "string", required: false, description: "Base64-encoded raw PCM audio" }, { name: "url", type: "string", required: false, description: "URL to an audio file", default: "https://cdn.freesound.org/previews/612/612092_5674468-lq.mp3" }], format: "json", category: "shazam", provider: "Shazam" },
  { path: "/api/shazam/track/:id", method: "GET", description: "Get details about a Shazam track by ID", params: [{ name: "id", type: "string", required: true, description: "Shazam track ID", default: "1217912247" }], format: "json", category: "shazam", provider: "Shazam" },
];

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

const ephotoEndpoints: ApiEndpoint[] = [
  { path: "/api/ephoto/list", method: "GET", description: "List all available Ephoto360 text effects", params: [], format: "json", category: "ephoto", provider: "Ephoto360" },
  { path: "/api/ephoto/generate", method: "POST", description: "Generate an Ephoto360 text effect", params: [{ name: "effect", type: "string", required: true, description: "Effect ID" }, { name: "text", type: "string", required: true, description: "Text to render" }], format: "json", category: "ephoto", provider: "Ephoto360" },
  ...ephotoEffectsList.map(e => ({
    path: `/api/ephoto/${e.id}`,
    method: "GET" as const,
    description: `Generate ${e.name} via Ephoto360.com`,
    params: [{ name: "text", type: "string", required: true, description: "Text to render" }],
    format: "json",
    category: "ephoto",
    provider: "Ephoto360",
    subcategory: e.category,
  })),
];

const photofuniaEndpoints: ApiEndpoint[] = [
  { path: "/api/photofunia/list", method: "GET", description: "List all available PhotoFunia effects", params: [], format: "json", category: "photofunia", provider: "PhotoFunia" },
  { path: "/api/photofunia/generate", method: "POST", description: "Generate a PhotoFunia effect", params: [{ name: "effect", type: "string", required: true, description: "Effect ID" }, { name: "text", type: "string", required: false, description: "Text input" }, { name: "imageUrl", type: "string", required: false, description: "Image URL" }], format: "json", category: "photofunia", provider: "PhotoFunia" },
  ...photofuniaEffectsList.map(e => {
    const params: ApiParam[] = [];
    if (e.required.includes("imageUrl")) params.push({ name: "imageUrl", type: "string", required: true, description: "Image URL" });
    if (e.required.includes("text")) params.push({ name: "text", type: "string", required: true, description: "Text input" });
    return {
      path: `/api/photofunia/${e.id}`,
      method: "GET" as const,
      description: `Generate ${e.name} via PhotoFunia.com`,
      params,
      format: "json",
      category: "photofunia",
      provider: "PhotoFunia",
      subcategory: e.category,
    };
  }),
];

const stalkerEndpoints: ApiEndpoint[] = [
  { path: "/api/stalk/github", method: "GET", description: "Lookup GitHub user profile, repos, followers and stats", params: [{ name: "username", type: "string", required: true, description: "GitHub username", default: "TrackerWanga" }], format: "json", category: "stalker", provider: "GitHub" },
  { path: "/api/stalk/ip", method: "GET", description: "Lookup IP address geolocation, ISP, timezone and ASN info", params: [{ name: "ip", type: "string", required: true, description: "IP address to lookup", default: "8.8.8.8" }], format: "json", category: "stalker", provider: "IP-API" },
  { path: "/api/stalk/npm", method: "GET", description: "Lookup NPM package details, version, author and stats", params: [{ name: "package", type: "string", required: true, description: "NPM package name", default: "axios" }], format: "json", category: "stalker", provider: "NPM Registry" },
  { path: "/api/stalk/tiktok", method: "GET", description: "Lookup TikTok user profile, followers, likes and video count", params: [{ name: "username", type: "string", required: true, description: "TikTok username (with or without @)", default: "charlidamelio" }], format: "json", category: "stalker", provider: "TikTok" },
  { path: "/api/stalk/instagram", method: "GET", description: "Lookup Instagram user profile info and stats", params: [{ name: "username", type: "string", required: true, description: "Instagram username", default: "instagram" }], format: "json", category: "stalker", provider: "Instagram" },
  { path: "/api/stalk/twitter", method: "GET", description: "Lookup Twitter/X user profile, followers, tweets and verification status", params: [{ name: "username", type: "string", required: true, description: "Twitter/X username (with or without @)", default: "elonmusk" }], format: "json", category: "stalker", provider: "fxTwitter" },
  { path: "/api/stalk/telegram", method: "GET", description: "Lookup Telegram user, channel or group profile and subscriber count", params: [{ name: "username", type: "string", required: true, description: "Telegram username or channel handle (with or without @)", default: "durov" }], format: "json", category: "stalker", provider: "Telegram" },
];

const animeEndpoints: ApiEndpoint[] = [
  { path: "/api/anime/waifu", method: "GET", description: "Get random waifu anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/neko", method: "GET", description: "Get random neko anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/shinobu", method: "GET", description: "Get random Shinobu anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/megumin", method: "GET", description: "Get random Megumin anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/cuddle", method: "GET", description: "Get random cuddle anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/hug", method: "GET", description: "Get random hug anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/kiss", method: "GET", description: "Get random kiss anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/pat", method: "GET", description: "Get random headpat anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/smug", method: "GET", description: "Get random smug anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/bonk", method: "GET", description: "Get random bonk anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/blush", method: "GET", description: "Get random blush anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/smile", method: "GET", description: "Get random smile anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/wave", method: "GET", description: "Get random wave anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/dance", method: "GET", description: "Get random dance anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/cry", method: "GET", description: "Get random cry anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/slap", method: "GET", description: "Get random slap anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/bite", method: "GET", description: "Get random bite anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/poke", method: "GET", description: "Get random poke anime GIF", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/happy", method: "GET", description: "Get random happy anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/wink", method: "GET", description: "Get random wink anime image", params: [], format: "json", category: "anime", provider: "waifu.pics" },
  { path: "/api/anime/highfive", method: "GET", description: "Get random highfive anime GIF", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/sleep", method: "GET", description: "Get random sleep anime image", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/laugh", method: "GET", description: "Get random laugh anime GIF", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/thumbsup", method: "GET", description: "Get random thumbsup anime GIF", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/stare", method: "GET", description: "Get random stare anime image", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/baka", method: "GET", description: "Get random baka anime GIF", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/facepalm", method: "GET", description: "Get random facepalm anime GIF", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/yawn", method: "GET", description: "Get random yawn anime GIF", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/nervous", method: "GET", description: "Get random nervous anime image", params: [], format: "json", category: "anime", provider: "nekos.best" },
  { path: "/api/anime/punch", method: "GET", description: "Get random punch anime GIF", params: [], format: "json", category: "anime", provider: "nekos.best" },
];

const funEndpoints: ApiEndpoint[] = [
  { path: "/api/fun/jokes", method: "GET", description: "Get a random joke", params: [], format: "json", category: "fun", provider: "JokeAPI" },
  { path: "/api/fun/advice", method: "GET", description: "Get random life advice", params: [], format: "json", category: "fun", provider: "AdviceSlip" },
  { path: "/api/fun/quotes", method: "GET", description: "Get an inspirational quote", params: [], format: "json", category: "fun" },
  { path: "/api/fun/motivation", method: "GET", description: "Get a motivational message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/flirt", method: "GET", description: "Get a flirty line", params: [], format: "json", category: "fun" },
  { path: "/api/fun/pickuplines", method: "GET", description: "Get a pickup line", params: [], format: "json", category: "fun" },
  { path: "/api/fun/truth", method: "GET", description: "Get a truth question", params: [], format: "json", category: "fun" },
  { path: "/api/fun/dares", method: "GET", description: "Get a dare challenge", params: [], format: "json", category: "fun" },
  { path: "/api/fun/riddles", method: "GET", description: "Get a riddle with answer", params: [], format: "json", category: "fun" },
  { path: "/api/fun/trivia", method: "GET", description: "Get a random trivia fact", params: [], format: "json", category: "fun", provider: "UselessFacts" },
  { path: "/api/fun/funfacts", method: "GET", description: "Get a fun fact", params: [], format: "json", category: "fun", provider: "UselessFacts" },
  { path: "/api/fun/puns", method: "GET", description: "Get a random pun", params: [], format: "json", category: "fun" },
  { path: "/api/fun/roasts", method: "GET", description: "Get a roast line", params: [], format: "json", category: "fun" },
  { path: "/api/fun/compliments", method: "GET", description: "Get a compliment", params: [], format: "json", category: "fun" },
  { path: "/api/fun/wouldyourather", method: "GET", description: "Get a would-you-rather question", params: [], format: "json", category: "fun" },
  { path: "/api/fun/goodmorning", method: "GET", description: "Get a good morning message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/goodnight", method: "GET", description: "Get a good night message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/valentines", method: "GET", description: "Get a Valentine's Day message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/birthday", method: "GET", description: "Get a birthday wish", params: [], format: "json", category: "fun" },
  { path: "/api/fun/love", method: "GET", description: "Get a love message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/friendship", method: "GET", description: "Get a friendship quote", params: [], format: "json", category: "fun" },
  { path: "/api/fun/shayari", method: "GET", description: "Get a shayari verse", params: [], format: "json", category: "fun" },
  { path: "/api/fun/humor", method: "GET", description: "Get a humorous line", params: [], format: "json", category: "fun" },
  { path: "/api/fun/wisdom", method: "GET", description: "Get a wisdom quote", params: [], format: "json", category: "fun" },
  { path: "/api/fun/success", method: "GET", description: "Get a success quote", params: [], format: "json", category: "fun" },
  { path: "/api/fun/heartbreak", method: "GET", description: "Get a heartbreak quote", params: [], format: "json", category: "fun" },
  { path: "/api/fun/sorry", method: "GET", description: "Get an apology message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/halloween", method: "GET", description: "Get a Halloween message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/christmas", method: "GET", description: "Get a Christmas message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/newyear", method: "GET", description: "Get a New Year message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/thankyou", method: "GET", description: "Get a thank you message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/gratitude", method: "GET", description: "Get a gratitude message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/roseday", method: "GET", description: "Get a Rose Day message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/fathersday", method: "GET", description: "Get a Father's Day message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/mothersday", method: "GET", description: "Get a Mother's Day message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/girlfriendsday", method: "GET", description: "Get a Girlfriend's Day message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/boyfriendsday", method: "GET", description: "Get a Boyfriend's Day message", params: [], format: "json", category: "fun" },
  { path: "/api/fun/tech-joke", method: "GET", description: "Get a random tech/programming joke", params: [], format: "json", category: "fun" },
  { path: "/api/fun/never-have-i-ever", method: "GET", description: "Get a Never Have I Ever question", params: [], format: "json", category: "fun" },
  { path: "/api/fun/fortune-cookie", method: "GET", description: "Get a fortune cookie message", params: [], format: "json", category: "fun" },
];

const urlShortenerEndpoints: ApiEndpoint[] = [
  { path: "/api/short/tinyurl", method: "GET", description: "Shorten URL with TinyURL", params: [{ name: "url", type: "string", required: true, description: "The URL to shorten", default: "https://meganapis.space" }], format: "json", category: "urlshortener", provider: "TinyURL" },
  { path: "/api/short/isgd", method: "GET", description: "Shorten URL with is.gd", params: [{ name: "url", type: "string", required: true, description: "The URL to shorten", default: "https://meganapis.space" }], format: "json", category: "urlshortener", provider: "is.gd" },
  { path: "/api/short/vgd", method: "GET", description: "Shorten URL with v.gd", params: [{ name: "url", type: "string", required: true, description: "The URL to shorten", default: "https://meganapis.space" }], format: "json", category: "urlshortener", provider: "v.gd" },
  { path: "/api/short/cleanuri", method: "GET", description: "Shorten URL with CleanURI", params: [{ name: "url", type: "string", required: true, description: "The URL to shorten", default: "https://meganapis.space" }], format: "json", category: "urlshortener", provider: "CleanURI" },
  { path: "/api/short/chilpit", method: "GET", description: "Shorten URL with Chilp.it", params: [{ name: "url", type: "string", required: true, description: "The URL to shorten", default: "https://meganapis.space" }], format: "json", category: "urlshortener", provider: "Chilp.it" },
  { path: "/api/short/clckru", method: "GET", description: "Shorten URL with clck.ru", params: [{ name: "url", type: "string", required: true, description: "The URL to shorten", default: "https://meganapis.space" }], format: "json", category: "urlshortener", provider: "clck.ru" },
  { path: "/api/short/dagd", method: "GET", description: "Shorten URL with da.gd", params: [{ name: "url", type: "string", required: true, description: "The URL to shorten", default: "https://meganapis.space" }], format: "json", category: "urlshortener", provider: "da.gd" },
  { path: "/api/url/imgbb", method: "POST", description: "Upload image to ImgBB and get a hosted URL", params: [{ name: "image", type: "string", required: true, description: "Image URL or Base64-encoded image", default: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg" }], format: "json", category: "urlshortener", provider: "ImgBB" },
  { path: "/api/url/catbox", method: "POST", description: "Upload file to Catbox.moe and get a hosted URL", params: [{ name: "url", type: "string", required: true, description: "URL of the file to upload", default: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg" }], format: "json", category: "urlshortener", provider: "Catbox" },
];

const toolsEndpoints: ApiEndpoint[] = [
  { path: "/api/tools/qrcode", method: "GET", description: "Generate QR code image from text", params: [{ name: "text", type: "string", required: true, description: "Text or URL to encode", default: "https://meganapis.space" }, { name: "size", type: "number", required: false, description: "Size in pixels (default 300)", default: "300" }], format: "json", category: "tools", provider: "QR Server" },
  { path: "/api/tools/bible", method: "GET", description: "Lookup Bible verse", params: [{ name: "ref", type: "string", required: false, description: "Bible reference (e.g. john 3:16)", default: "john 3:16" }], format: "json", category: "tools", provider: "Bible API" },
  { path: "/api/tools/dictionary", method: "GET", description: "Get word definition and meanings", params: [{ name: "word", type: "string", required: true, description: "Word to look up", default: "serendipity" }], format: "json", category: "tools", provider: "DictionaryAPI" },
  { path: "/api/tools/wikipedia", method: "GET", description: "Get Wikipedia article summary", params: [{ name: "query", type: "string", required: true, description: "Topic to search", default: "Artificial intelligence" }], format: "json", category: "tools", provider: "Wikipedia" },
  { path: "/api/tools/weather", method: "GET", description: "Get current weather for a city", params: [{ name: "city", type: "string", required: true, description: "City name", default: "Nairobi" }], format: "json", category: "tools", provider: "wttr.in" },
  { path: "/api/tools/base64encode", method: "GET", description: "Encode text to Base64", params: [{ name: "text", type: "string", required: true, description: "Text to encode", default: "Hello World" }], format: "json", category: "tools" },
  { path: "/api/tools/base64decode", method: "GET", description: "Decode Base64 to text", params: [{ name: "text", type: "string", required: true, description: "Base64 string to decode", default: "SGVsbG8gV29ybGQ=" }], format: "json", category: "tools" },
  { path: "/api/tools/textstats", method: "GET", description: "Analyze text statistics", params: [{ name: "text", type: "string", required: true, description: "Text to analyze", default: "Hello World, this is a sample text for analysis." }], format: "json", category: "tools" },
  { path: "/api/tools/password", method: "GET", description: "Generate secure random password", params: [{ name: "length", type: "number", required: false, description: "Password length (default 16)", default: "16" }], format: "json", category: "tools" },
  { path: "/api/tools/lorem", method: "GET", description: "Generate Lorem Ipsum text", params: [{ name: "paragraphs", type: "number", required: false, description: "Number of paragraphs (default 1)", default: "2" }], format: "json", category: "tools" },
  { path: "/api/tools/color", method: "GET", description: "Generate random color with hex/rgb/hsl", params: [], format: "json", category: "tools" },
  { path: "/api/tools/timestamp", method: "GET", description: "Get current timestamp in multiple formats", params: [], format: "json", category: "tools" },
  { path: "/api/tools/urlencode", method: "GET", description: "URL encode a string", params: [{ name: "text", type: "string", required: true, description: "Text to encode", default: "Hello World & More" }], format: "json", category: "tools" },
  { path: "/api/tools/urldecode", method: "GET", description: "URL decode a string", params: [{ name: "text", type: "string", required: true, description: "Text to decode", default: "Hello+World+%26+More" }], format: "json", category: "tools" },
  { path: "/api/tools/jsonformat", method: "POST", description: "Format/validate JSON", params: [{ name: "json", type: "string", required: true, description: "JSON string to format", default: "{\"name\":\"Megan\",\"api\":\"Tracker Wanga\"}" }], format: "json", category: "tools" },
  { path: "/api/tools/email-validate", method: "GET", description: "Validate email format", params: [{ name: "email", type: "string", required: true, description: "Email to validate", default: "test@example.com" }], format: "json", category: "tools" },
  { path: "/api/tools/ip-validate", method: "GET", description: "Validate IP address", params: [{ name: "ip", type: "string", required: true, description: "IP address to validate", default: "192.168.1.1" }], format: "json", category: "tools" },
  { path: "/api/tools/hash", method: "GET", description: "Generate hash from text", params: [{ name: "text", type: "string", required: true, description: "Text to hash", default: "Hello World" }, { name: "algorithm", type: "string", required: false, description: "Hash algorithm (md5, sha1, sha256, sha512)", default: "sha256" }], format: "json", category: "tools" },
  { path: "/api/tools/uuid", method: "GET", description: "Generate UUID v4", params: [], format: "json", category: "tools" },
  { path: "/api/tools/password-strength", method: "GET", description: "Check password strength", params: [{ name: "password", type: "string", required: true, description: "Password to check", default: "MyP@ssw0rd123!" }], format: "json", category: "tools" },
  { path: "/api/tools/screenshot", method: "GET", description: "Take website screenshot", params: [{ name: "url", type: "string", required: true, description: "URL to screenshot", default: "https://meganapis.space" }], format: "json", category: "tools", provider: "thum.io" },
  { path: "/api/tools/phone-lookup", method: "GET", description: "Lookup phone number info", params: [{ name: "phone", type: "string", required: true, description: "Phone number", default: "+254..." }], format: "json", category: "tools" },
  { path: "/api/tools/password-audit", method: "GET", description: "Audit password strength in detail", params: [{ name: "password", type: "string", required: true, description: "Password", default: "Test123!" }], format: "json", category: "tools" },
  { path: "/api/tools/dns-inspector", method: "GET", description: "Inspect DNS records in detail", params: [{ name: "domain", type: "string", required: true, description: "Domain", default: "example.com" }], format: "json", category: "tools" },
  { path: "/api/tools/wifi-scan", method: "GET", description: "Scan WiFi networks", params: [], format: "json", category: "tools" },
];

const securityEndpoints: ApiEndpoint[] = [
  { path: "/api/security/whois", method: "GET", description: "WHOIS domain lookup", params: [{ name: "domain", type: "string", required: true, description: "Domain to lookup", default: "meganapis.space" }], format: "json", category: "security", provider: "RDAP" },
  { path: "/api/security/dns", method: "GET", description: "DNS records lookup (A, AAAA, MX, TXT, NS, CNAME)", params: [{ name: "domain", type: "string", required: true, description: "Domain to lookup", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/subdomain", method: "GET", description: "Scan for common subdomains", params: [{ name: "domain", type: "string", required: true, description: "Domain to scan", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/reverse-ip", method: "GET", description: "Reverse IP lookup", params: [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], format: "json", category: "security" },
  { path: "/api/security/geoip", method: "GET", description: "IP geolocation lookup", params: [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], format: "json", category: "security", provider: "IP-API" },
  { path: "/api/security/portscan", method: "GET", description: "Scan common ports on a host", params: [{ name: "host", type: "string", required: true, description: "Hostname or IP", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/headers", method: "GET", description: "Fetch HTTP response headers", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/ssl", method: "GET", description: "Check SSL certificate details", params: [{ name: "host", type: "string", required: true, description: "Hostname to check", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/tls", method: "GET", description: "Get TLS connection details", params: [{ name: "host", type: "string", required: true, description: "Hostname to check", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/ping", method: "GET", description: "Ping a host and check latency", params: [{ name: "host", type: "string", required: true, description: "Hostname to ping", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/latency", method: "GET", description: "Measure HTTP latency", params: [{ name: "url", type: "string", required: true, description: "URL to test", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/traceroute", method: "GET", description: "Trace route to host", params: [{ name: "host", type: "string", required: true, description: "Hostname to trace", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/asn", method: "GET", description: "ASN lookup for IP", params: [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], format: "json", category: "security", provider: "IP-API" },
  { path: "/api/security/mac", method: "GET", description: "MAC address vendor lookup", params: [{ name: "mac", type: "string", required: true, description: "MAC address", default: "00:1A:2B:3C:4D:5E" }], format: "json", category: "security", provider: "MacVendors" },
  { path: "/api/security/security-headers", method: "GET", description: "Analyze security headers with scoring", params: [{ name: "url", type: "string", required: true, description: "URL to analyze", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/waf", method: "GET", description: "Detect Web Application Firewall", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/firewall", method: "GET", description: "Check firewall and security headers", params: [{ name: "host", type: "string", required: true, description: "Hostname to check", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/robots", method: "GET", description: "Check robots.txt file", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/sitemap", method: "GET", description: "Check sitemap.xml", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/cms", method: "GET", description: "Detect CMS/platform", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/techstack", method: "GET", description: "Detect technology stack", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/cookies", method: "GET", description: "Scan cookies for security flags", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/redirects", method: "GET", description: "Check redirect chain", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/xss", method: "GET", description: "Check XSS protection headers", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/sqli", method: "GET", description: "Check SQL injection protection", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/csrf", method: "GET", description: "Check CSRF protection", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/clickjack", method: "GET", description: "Check clickjacking protection", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/directory", method: "GET", description: "Scan for exposed directories", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/exposed-files", method: "GET", description: "Check for exposed sensitive files", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/misconfig", method: "GET", description: "Check security misconfigurations", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/hash-identify", method: "GET", description: "Identify hash type", params: [{ name: "hash", type: "string", required: true, description: "Hash string to identify", default: "5d41402abc4b2a76b9719d911017c592" }], format: "json", category: "security" },
  { path: "/api/security/hash-generate", method: "GET", description: "Generate hash from text", params: [{ name: "text", type: "string", required: true, description: "Text to hash", default: "Hello World" }, { name: "algorithm", type: "string", required: false, description: "Algorithm (md5, sha1, sha256, sha512)", default: "sha256" }], format: "json", category: "security" },
  { path: "/api/security/password-strength", method: "GET", description: "Check password strength", params: [{ name: "password", type: "string", required: true, description: "Password to check", default: "MyP@ssw0rd123!" }], format: "json", category: "security" },
  { path: "/api/security/openports", method: "GET", description: "Scan extended port range", params: [{ name: "host", type: "string", required: true, description: "Hostname or IP", default: "meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/ip-info", method: "GET", description: "Full IP information lookup", params: [{ name: "ip", type: "string", required: true, description: "IP address", default: "8.8.8.8" }], format: "json", category: "security", provider: "IP-API" },
  { path: "/api/security/url-scan", method: "GET", description: "Full URL security scan", params: [{ name: "url", type: "string", required: true, description: "URL to scan", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/phish", method: "GET", description: "Check URL for phishing indicators", params: [{ name: "url", type: "string", required: true, description: "URL to check", default: "https://meganapis.space" }], format: "json", category: "security" },
  { path: "/api/security/metadata", method: "GET", description: "Extract website metadata", params: [{ name: "url", type: "string", required: true, description: "Website URL", default: "https://meganapis.space" }], format: "json", category: "security" },
];

const sportsEndpoints: ApiEndpoint[] = [
  { path: "/api/sports/live", method: "GET", description: "Get live scores across all sports", params: [{ name: "sport", type: "string", required: false, description: "Filter by sport (e.g. Soccer, Basketball)", default: "Soccer" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/search/team", method: "GET", description: "Search for a team by name", params: [{ name: "q", type: "string", required: true, description: "Team name to search", default: "Arsenal" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/search/player", method: "GET", description: "Search for a player by name", params: [{ name: "q", type: "string", required: true, description: "Player name to search", default: "Ronaldo" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/search/league", method: "GET", description: "Search for a league by name", params: [{ name: "q", type: "string", required: true, description: "League name to search", default: "Premier League" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/leagues", method: "GET", description: "Get list of all leagues", params: [], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/league/details", method: "GET", description: "Get league details by ID", params: [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/league/seasons", method: "GET", description: "Get all seasons for a league", params: [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/league/teams", method: "GET", description: "Get all teams in a league", params: [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/league/table", method: "GET", description: "Get league standings/table", params: [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }, { name: "season", type: "string", required: true, description: "Season (e.g. 2024-2025)", default: "2024-2025" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/team/details", method: "GET", description: "Get team details by ID", params: [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/team/players", method: "GET", description: "Get all players in a team", params: [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/team/next", method: "GET", description: "Get next 5 upcoming events for a team", params: [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/team/last", method: "GET", description: "Get last 5 results for a team", params: [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/team/equipment", method: "GET", description: "Get team equipment/kits", params: [{ name: "id", type: "string", required: true, description: "Team ID", default: "133604" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/player/details", method: "GET", description: "Get player details by ID", params: [{ name: "id", type: "string", required: true, description: "Player ID", default: "34146280" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/event/details", method: "GET", description: "Get event/match details by ID", params: [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/event/lineup", method: "GET", description: "Get event lineup", params: [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/event/stats", method: "GET", description: "Get event statistics", params: [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/event/highlights", method: "GET", description: "Get event highlights/video", params: [{ name: "id", type: "string", required: true, description: "Event ID", default: "652890" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/events/day", method: "GET", description: "Get all events on a specific date", params: [{ name: "date", type: "string", required: true, description: "Date (YYYY-MM-DD)", default: "2024-03-15" }, { name: "sport", type: "string", required: false, description: "Filter by sport", default: "Soccer" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/events/round", method: "GET", description: "Get events by league round", params: [{ name: "id", type: "string", required: true, description: "League ID", default: "4328" }, { name: "round", type: "string", required: true, description: "Round number", default: "30" }, { name: "season", type: "string", required: true, description: "Season (e.g. 2024-2025)", default: "2024-2025" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/teams/country", method: "GET", description: "Get teams by country", params: [{ name: "country", type: "string", required: true, description: "Country name", default: "England" }, { name: "sport", type: "string", required: false, description: "Sport (default: Soccer)", default: "Soccer" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/leagues/country", method: "GET", description: "Get leagues by country", params: [{ name: "country", type: "string", required: true, description: "Country name", default: "England" }, { name: "sport", type: "string", required: false, description: "Filter by sport", default: "Soccer" }], format: "json", category: "sports", provider: "TheSportsDB" },
  { path: "/api/sports/venue", method: "GET", description: "Get venue details by ID", params: [{ name: "id", type: "string", required: true, description: "Venue ID", default: "16247" }], format: "json", category: "sports", provider: "TheSportsDB" },
];

const searchEndpoints: ApiEndpoint[] = [
  { path: "/api/search/wiki", method: "GET", description: "Search Wikipedia articles with summaries", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "artificial intelligence" }], format: "json", category: "search", provider: "Wikipedia" },
  { path: "/api/search/news", method: "GET", description: "Search latest news articles worldwide", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "technology" }, { name: "lang", type: "string", required: false, description: "Language (default: en)", default: "en" }], format: "json", category: "search", provider: "GNews" },
  { path: "/api/search/github", method: "GET", description: "Search GitHub repositories", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "megan-apis" }], format: "json", category: "search", provider: "GitHub" },
  { path: "/api/search/npm", method: "GET", description: "Search NPM packages", params: [{ name: "q", type: "string", required: true, description: "Package name or keyword", default: "express" }], format: "json", category: "search", provider: "NPM" },
  { path: "/api/search/pypi", method: "GET", description: "Search Python packages on PyPI", params: [{ name: "q", type: "string", required: true, description: "Package name or keyword", default: "requests" }], format: "json", category: "search", provider: "PyPI" },
  { path: "/api/search/stackoverflow", method: "GET", description: "Search Stack Overflow questions", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "how to reverse a string in python" }], format: "json", category: "search", provider: "StackExchange" },
  { path: "/api/search/reddit", method: "GET", description: "Search Reddit posts and subreddits", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "artificial intelligence" }, { name: "sort", type: "string", required: false, description: "Sort by: relevance, hot, top, new", default: "hot" }], format: "json", category: "search", provider: "Reddit" },
  { path: "/api/search/urbandictionary", method: "GET", description: "Search Urban Dictionary definitions", params: [{ name: "q", type: "string", required: true, description: "Word or phrase", default: "vibe" }], format: "json", category: "search", provider: "Urban Dictionary" },
  { path: "/api/search/emoji", method: "GET", description: "Search emojis by keyword", params: [{ name: "q", type: "string", required: true, description: "Emoji keyword", default: "fire" }], format: "json", category: "search", provider: "Open Emoji" },
  { path: "/api/search/country", method: "GET", description: "Search country information", params: [{ name: "q", type: "string", required: true, description: "Country name", default: "Kenya" }], format: "json", category: "search", provider: "REST Countries" },
  { path: "/api/search/images", method: "GET", description: "Search and return images for any keyword", params: [{ name: "q", type: "string", required: true, description: "Image search query", default: "superman" }, { name: "page", type: "string", required: false, description: "Page number (0-based, default: 0)", default: "0" }], format: "json", category: "search", provider: "Yandex Images" },
  { path: "/api/search/videos", method: "GET", description: "Search and return videos for any keyword", params: [{ name: "q", type: "string", required: true, description: "Video search query", default: "superman trailer" }, { name: "page", type: "string", required: false, description: "Page number (0-based, default: 0)", default: "0" }], format: "json", category: "search", provider: "Yandex Videos" },
  { path: "/api/search/youtube", method: "GET", description: "Search YouTube videos", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "music" }], format: "json", category: "search", provider: "YouTube" },
  { path: "/api/youtube/trending", method: "GET", description: "Get trending YouTube videos", params: [], format: "json", category: "search", provider: "YouTube" },
  { path: "/api/youtube/recommend", method: "GET", description: "Get YouTube video recommendations", params: [{ name: "id", type: "string", required: true, description: "Video ID", default: "dQw4w9WgXcQ" }], format: "json", category: "search", provider: "YouTube" },
];

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

const textproEndpoints: ApiEndpoint[] = [
  { path: "/api/textpro/list", method: "GET", description: "List all available text effects with style previews", params: [], format: "json", category: "textpro", provider: "CoolText" },
  { path: "/api/textpro/generate", method: "GET", description: "Generate a styled text effect image", params: [{ name: "effect", type: "string", required: true, description: "Effect ID from the effects list", default: "alien-glow" }, { name: "text", type: "string", required: true, description: "Text to render", default: "MeganAPI" }], format: "json", category: "textpro", provider: "CoolText" },
  ...TEXTPRO_EFFECTS.map(e => ({
    path: `/api/textpro/${e.id}`,
    method: "GET" as const,
    description: `Generate ${e.name} text effect`,
    params: [{ name: "text", type: "string", required: true, description: "Text to render", default: "MeganAPI" }],
    format: "json" as const,
    category: "textpro" as const,
    provider: "CoolText",
  })),
];

const converterEndpoints: ApiEndpoint[] = [
  { path: "/api/converter/img-to-sticker", method: "GET", description: "Convert image to WhatsApp sticker (WebP)", params: [{ name: "url", type: "string", required: true, description: "Image URL to convert", default: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg" }], format: "json", category: "converter" },
  { path: "/api/converter/sticker-to-img", method: "GET", description: "Convert sticker (WebP) to image (PNG)", params: [{ name: "url", type: "string", required: true, description: "Sticker/WebP URL to convert", default: "https://www.gstatic.com/webp/gallery/1.webp" }], format: "json", category: "converter" },
  { path: "/api/converter/video-to-sticker", method: "GET", description: "Convert video to animated WhatsApp sticker", params: [{ name: "url", type: "string", required: true, description: "Video URL (MP4, max 6 seconds)", default: "https://www.w3schools.com/html/mov_bbb.mp4" }], format: "json", category: "converter" },
  { path: "/api/converter/sticker-to-video", method: "GET", description: "Convert animated sticker to video (MP4)", params: [{ name: "url", type: "string", required: true, description: "Animated sticker/WebP URL", default: "https://www.gstatic.com/webp/gallery/1.webp" }], format: "json", category: "converter" },
  { path: "/api/converter/video-to-gif", method: "GET", description: "Convert video to GIF", params: [{ name: "url", type: "string", required: true, description: "Video URL to convert", default: "https://www.w3schools.com/html/mov_bbb.mp4" }], format: "json", category: "converter" },
  { path: "/api/converter/gif-to-video", method: "GET", description: "Convert GIF to video (MP4)", params: [{ name: "url", type: "string", required: true, description: "GIF URL to convert", default: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" }], format: "json", category: "converter" },
];

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

const audioFxEndpoints: ApiEndpoint[] = [
  { path: "/api/audio/list", method: "GET", description: "List all available audio effects with ffmpeg filters", params: [], format: "json", category: "audio-fx" },
  ...AUDIO_EFFECTS_LIST.map(e => ({
    path: `/api/audio/${e.id}`,
    method: "GET" as const,
    description: `${e.name} effect - get audio data with ffmpeg filter command`,
    params: [{ name: "url", type: "string" as const, required: true, description: "Audio/video URL to process" }],
    format: "json" as const,
    category: "audio-fx",
  })),
];

const zodiacEndpoints: ApiEndpoint[] = [
  { path: "/api/zodiac/all", method: "GET", description: "Get all 12 zodiac signs with full metadata and daily horoscopes", params: [], format: "json", category: "zodiac" },
  { path: "/api/zodiac/:sign", method: "GET", description: "Get a specific zodiac sign with traits, compatibility, lucky numbers, career, and daily horoscope", params: [{ name: "sign", type: "string", required: true, description: "Zodiac sign", default: "aries" }], format: "json", category: "zodiac" },
  { path: "/api/zodiac/element/:element", method: "GET", description: "Get zodiac signs by element (fire, earth, air, water)", params: [{ name: "element", type: "string", required: true, description: "Element", default: "fire" }], format: "json", category: "zodiac" },
  { path: "/api/zodiac/compatibility/:s1/:s2", method: "GET", description: "Get compatibility score between two zodiac signs", params: [{ name: "s1", type: "string", required: true, description: "First sign", default: "aries" }, { name: "s2", type: "string", required: true, description: "Second sign", default: "leo" }], format: "json", category: "zodiac" },
];

const gamesEndpoints: ApiEndpoint[] = [
  { path: "/api/game/rps", method: "GET", description: "Play Rock Paper Scissors against the computer", params: [{ name: "move", type: "string", required: true, description: "Your move", default: "rock" }], format: "json", category: "games" },
  { path: "/api/game/flag-guess", method: "GET", description: "Guess the country from its flag and hint", params: [], format: "json", category: "games" },
  { path: "/api/game/flag-guess/:id/check", method: "GET", description: "Check your flag guess answer", params: [{ name: "answer", type: "string", required: true, description: "Your country guess" }], format: "json", category: "games" },
  { path: "/api/game/word-scramble", method: "GET", description: "Unscramble a word with hint", params: [], format: "json", category: "games" },
  { path: "/api/game/number-guess", method: "GET", description: "Start a number guessing game (1-100, 7 attempts)", params: [], format: "json", category: "games" },
  { path: "/api/game/number-guess/:id", method: "POST", description: "Submit a guess for number guessing game", params: [{ name: "guess", type: "number", required: true, description: "Your guess", default: "50" }], format: "json", category: "games" },
];

const educationEndpoints: ApiEndpoint[] = [
  { path: "/api/education/papers", method: "GET", description: "Search 250M+ academic papers via OpenAlex", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "climate change" }, { name: "page", type: "number", required: false, description: "Page number", default: "1" }], format: "json", category: "education", provider: "OpenAlex" },
  { path: "/api/education/books", method: "GET", description: "Search 20M+ books via Open Library", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "mathematics" }], format: "json", category: "education", provider: "Open Library" },
  { path: "/api/education/dictionary", method: "GET", description: "Look up word with IPA, audio, definitions, synonyms", params: [{ name: "word", type: "string", required: true, description: "Word", default: "serendipity" }], format: "json", category: "education", provider: "Free Dictionary API" },
  { path: "/api/education/book-details", method: "GET", description: "Get detailed book info by Open Library key", params: [{ name: "key", type: "string", required: true, description: "Book key", default: "OL8112804W" }], format: "json", category: "education", provider: "Open Library" },
];

const newsEndpoints: ApiEndpoint[] = [
  { path: "/api/news/tuko", method: "GET", description: "Scrape latest news from Tuko.co.ke", params: [], format: "json", category: "news", provider: "Tuko" },
  { path: "/api/news/nation", method: "GET", description: "Scrape latest news from Nation Africa", params: [], format: "json", category: "news", provider: "Nation" },
  { path: "/api/news/standard", method: "GET", description: "Scrape latest news from Standard Media", params: [], format: "json", category: "news", provider: "Standard" },
  { path: "/api/news/kenyans", method: "GET", description: "Scrape latest news from Kenyans.co.ke", params: [], format: "json", category: "news", provider: "Kenyans" },
  { path: "/api/news/global", method: "GET", description: "Get global news headlines", params: [], format: "json", category: "news", provider: "NewsAPI" },
  { path: "/api/news/kenya", method: "GET", description: "Get Kenya-specific news", params: [], format: "json", category: "news", provider: "GNews" },
];

const classifiedsEndpoints: ApiEndpoint[] = [
  { path: "/api/classifieds/jiji", method: "GET", description: "Scrape classifieds from Jiji Kenya", params: [], format: "json", category: "classifieds", provider: "Jiji" },
  { path: "/api/classifieds/pigiame", method: "GET", description: "Scrape classifieds from Pigiame", params: [], format: "json", category: "classifieds", provider: "Pigiame" },
];

const jobsEndpoints: ApiEndpoint[] = [
  { path: "/api/jobs/kenya", method: "GET", description: "Get latest Kenyan job listings from BrighterMonday", params: [{ name: "page", type: "number", required: false, description: "Page number", default: "1" }], format: "json", category: "jobs", provider: "BrighterMonday" },
];

const cryptoEndpoints: ApiEndpoint[] = [
  { path: "/api/crypto/price", method: "GET", description: "Get live crypto price in USD and KES", params: [{ name: "coin", type: "string", required: false, description: "Coin ID", default: "bitcoin" }], format: "json", category: "crypto", provider: "CoinGecko" },
  { path: "/api/crypto/all", method: "GET", description: "Get top 10 cryptocurrency prices", params: [], format: "json", category: "crypto", provider: "CoinGecko" },
];

const forexEndpoints: ApiEndpoint[] = [
  { path: "/api/forex/rates", method: "GET", description: "Get live exchange rates for major currencies", params: [], format: "json", category: "forex", provider: "ExchangeRate-API" },
  { path: "/api/forex/convert", method: "GET", description: "Convert between any two currencies", params: [{ name: "amount", type: "number", required: false, description: "Amount", default: "100" }, { name: "from", type: "string", required: false, description: "From currency", default: "USD" }, { name: "to", type: "string", required: false, description: "To currency", default: "KES" }], format: "json", category: "forex", provider: "ExchangeRate-API" },
];

const devToolsEndpoints: ApiEndpoint[] = [
  { path: "/api/tools/deobfuscate", method: "POST", description: "Deobfuscate JavaScript code", params: [{ name: "code", type: "string", required: true, description: "Obfuscated JS code", default: "var _0x1234=['hello','world']" }], format: "json", category: "dev-tools" },
  { path: "/api/tools/deminify", method: "POST", description: "Expand minified code", params: [{ name: "code", type: "string", required: true, description: "Minified code", default: "function hello(a,b){return a+b}" }], format: "json", category: "dev-tools" },
  { path: "/api/tools/run-js", method: "POST", description: "Run JavaScript in a secure sandbox", params: [{ name: "code", type: "string", required: true, description: "JS code", default: "console.log('Hello!')" }], format: "json", category: "dev-tools" },
  { path: "/api/tools/headless", method: "GET", description: "Fetch URL like a real browser with cookies", params: [{ name: "url", type: "string", required: true, description: "URL", default: "https://example.com" }], format: "json", category: "dev-tools" },
  { path: "/api/tools/decode", method: "POST", description: "Auto-detect and decode Base64/URL/Hex/JWT/ROT13", params: [{ name: "text", type: "string", required: true, description: "Encoded text", default: "SGVsbG8gV29ybGQ=" }], format: "json", category: "dev-tools" },
];

const scrapingEndpoints: ApiEndpoint[] = [
  { path: "/api/scrape/links", method: "GET", description: "Extract all links from a website", params: [{ name: "url", type: "string", required: true, description: "URL", default: "https://example.com" }], format: "json", category: "scraping" },
  { path: "/api/scrape/inspect", method: "GET", description: "Full website inspection", params: [{ name: "url", type: "string", required: true, description: "URL", default: "https://example.com" }], format: "json", category: "scraping" },
  { path: "/api/scrape/scripts", method: "GET", description: "Extract all JavaScript from a page", params: [{ name: "url", type: "string", required: true, description: "URL", default: "https://example.com" }], format: "json", category: "scraping" },
  { path: "/api/scrape/cookies", method: "GET", description: "Get all cookies from a website", params: [{ name: "url", type: "string", required: true, description: "URL", default: "https://example.com" }], format: "json", category: "scraping" },
  { path: "/api/scrape/full", method: "POST", description: "Master scraper — everything from a page", params: [{ name: "url", type: "string", required: true, description: "URL", default: "https://example.com" }], format: "json", category: "scraping" },
];

const funDataEndpoints: ApiEndpoint[] = [
  { path: "/api/fun-data/kenyan-proverb", method: "GET", description: "Random Kenyan proverb with meaning", params: [], format: "json", category: "fun-data" },
  { path: "/api/fun-data/dad-joke", method: "GET", description: "Random clean dad joke", params: [], format: "json", category: "fun-data" },
  { path: "/api/fun-data/affirmation", method: "GET", description: "Random positive daily affirmation", params: [], format: "json", category: "fun-data" },
  { path: "/api/fun-data/swahili-phrase", method: "GET", description: "Random Swahili phrase with translation", params: [], format: "json", category: "fun-data" },
  { path: "/api/fun-data/kenyan-proverbs", method: "GET", description: "All Kenyan proverbs", params: [], format: "json", category: "fun-data" },
  { path: "/api/fun-data/swahili-phrases", method: "GET", description: "All Swahili phrases", params: [], format: "json", category: "fun-data" },
];

const adminEndpoints: ApiEndpoint[] = [
  { path: "/api/admin/login", method: "POST", description: "Admin login with password", params: [{ name: "password", type: "string", required: true, description: "Admin password" }], format: "json", category: "admin" },
  { path: "/api/admin/stats", method: "GET", description: "Get server request statistics", params: [], format: "json", category: "admin" },
  { path: "/api/admin/logs", method: "GET", description: "Get recent request logs", params: [{ name: "limit", type: "number", required: false, description: "Number of logs (max 300)", default: "100" }], format: "json", category: "admin" },
  { path: "/api/admin/settings", method: "GET", description: "Get admin settings", params: [], format: "json", category: "admin" },
  { path: "/api/admin/settings", method: "POST", description: "Update admin settings", params: [], format: "json", category: "admin" },
  { path: "/api/admin/change-password", method: "POST", description: "Change admin password", params: [{ name: "newPassword", type: "string", required: true, description: "New password (min 6 chars)" }], format: "json", category: "admin" },
  { path: "/api/admin/security", method: "GET", description: "Get security stats and IP blocklist", params: [], format: "json", category: "admin" },
  { path: "/api/admin/block-ip", method: "POST", description: "Block an IP address", params: [{ name: "ip", type: "string", required: true, description: "IP to block" }], format: "json", category: "admin" },
  { path: "/api/admin/unblock-ip", method: "POST", description: "Unblock an IP address", params: [{ name: "ip", type: "string", required: true, description: "IP to unblock" }], format: "json", category: "admin" },
  { path: "/api/admin/update-ytdlp", method: "GET", description: "Update yt-dlp to latest stable version", params: [], format: "json", category: "admin" },
  { path: "/api/admin/reload-cookies", method: "GET", description: "Clear and reload YouTube cookies", params: [], format: "json", category: "admin" },
  { path: "/api/admin/provider-health", method: "GET", description: "Check health of all download providers", params: [], format: "json", category: "admin" },
  { path: "/api/admin/keys/generate", method: "POST", description: "Generate a new API key", params: [{ name: "name", type: "string", required: false, description: "Key name" }, { name: "rate_limit", type: "number", required: false, description: "Rate limit", default: "50" }], format: "json", category: "admin" },
  { path: "/api/admin/keys", method: "GET", description: "List all API keys", params: [], format: "json", category: "admin" },
  { path: "/api/admin/keys/:key/update", method: "POST", description: "Update an API key", params: [], format: "json", category: "admin" },
  { path: "/api/admin/keys/:key", method: "DELETE", description: "Revoke an API key", params: [], format: "json", category: "admin" },
  { path: "/api/admin/keys/:key/usage", method: "GET", description: "Get API key usage stats", params: [], format: "json", category: "admin" },
];

const metaEndpoints: ApiEndpoint[] = [
  { path: "/api/status", method: "GET", description: "Server status — uptime, memory, CPU", params: [], format: "json", category: "meta" },
  { path: "/api/endpoints/search", method: "GET", description: "Search all API endpoints by keyword", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "zodiac" }], format: "json", category: "meta" },
  { path: "/api/endpoints/categories", method: "GET", description: "List all API categories with counts", params: [], format: "json", category: "meta" },
  { path: "/api/endpoints/stats", method: "GET", description: "Endpoint statistics by method and category", params: [], format: "json", category: "meta" },
  { path: "/api/endpoints", method: "GET", description: "List all available API endpoints", params: [], format: "json", category: "meta" },
  { path: "/api/endpoints/category/:name", method: "GET", description: "Get endpoints by category name", params: [{ name: "name", type: "string", required: true, description: "Category name or ID" }], format: "json", category: "meta" },
  { path: "/api/media/status", method: "GET", description: "Check status of all media download providers", params: [], format: "json", category: "meta" },
  { path: "/api/config/cards", method: "GET", description: "Get public repo cards config", params: [], format: "json", category: "meta" },
  { path: "/api/keys/generate", method: "POST", description: "Generate a free API key", params: [{ name: "name", type: "string", required: false, description: "Key name", default: "Free User" }], format: "json", category: "meta" },
  { path: "/api/keys/:key/info", method: "GET", description: "Check API key info and usage", params: [], format: "json", category: "meta" },
  { path: "/api/keys/login", method: "POST", description: "Login with email and password", params: [{ name: "email", type: "string", required: true, description: "Email" }, { name: "password", type: "string", required: true, description: "Password" }], format: "json", category: "meta" },
  { path: "/files/:filename", method: "GET", description: "Download a generated media file by filename", params: [{ name: "filename", type: "string", required: true, description: "File UUID with extension" }], format: "stream", category: "meta" },
];



  { path: "/v1/ai/image/magicstudio", method: "GET", description: "Generate AI art using MagicStudio (no key required)", params: [{ name: "prompt", type: "string", required: true, description: "Image prompt", default: "a cute cat" }], format: "json", category: "ai-image", provider: "MagicStudio" },

const workingAIEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/chat/claude", method: "GET", description: "Chat with Claude Haiku 4.5 (working)", params: Q_PARAM, format: "json", category: "ai-chat", provider: "Overchat.ai" },
  { path: "/api/ai/chat/gpt5", method: "GET", description: "Chat with GPT-4.1 Nano (working)", params: Q_PARAM, format: "json", category: "ai-chat", provider: "Overchat.ai" },
  { path: "/api/ai/chat/deepseek", method: "GET", description: "Chat with DeepSeek V3.2 (working)", params: Q_PARAM, format: "json", category: "ai-chat", provider: "Overchat.ai" },
  { path: "/api/ai/chat/normal", method: "GET", description: "Chat with NoTrack.ai normal persona", params: Q_PARAM, format: "json", category: "ai-chat", provider: "NoTrack.ai" },
  { path: "/api/ai/chat/concise", method: "GET", description: "Chat with NoTrack.ai concise persona", params: Q_PARAM, format: "json", category: "ai-chat", provider: "NoTrack.ai" },
  { path: "/api/ai/chat/detailed", method: "GET", description: "Chat with NoTrack.ai detailed persona", params: Q_PARAM, format: "json", category: "ai-chat", provider: "NoTrack.ai" },
  { path: "/api/ai/chat/creative", method: "GET", description: "Chat with NoTrack.ai creative persona", params: Q_PARAM, format: "json", category: "ai-chat", provider: "NoTrack.ai" },
  { path: "/api/ai/image/flux", method: "GET", description: "Generate AI image using FLUX model", params: [{ name: "prompt", type: "string", required: true, description: "Image prompt", default: "beautiful sunset" }, { name: "width", type: "number", required: false, description: "Width (default 512)", default: "512" }, { name: "height", type: "number", required: false, description: "Height (default 512)", default: "512" }], format: "json", category: "ai-image", provider: "Pollinations.ai" },
  { path: "/api/ai/image/sdxl", method: "GET", description: "Generate AI image using SDXL model", params: [{ name: "prompt", type: "string", required: true, description: "Image prompt", default: "cyberpunk city" }, { name: "width", type: "number", required: false, description: "Width", default: "512" }, { name: "height", type: "number", required: false, description: "Height", default: "512" }], format: "json", category: "ai-image", provider: "Pollinations.ai" },
  { path: "/api/ai/image/turbo", method: "GET", description: "Generate AI image using Turbo model (fast)", params: [{ name: "prompt", type: "string", required: true, description: "Image prompt", default: "dragon" }, { name: "width", type: "number", required: false, description: "Width", default: "512" }, { name: "height", type: "number", required: false, description: "Height", default: "512" }], format: "json", category: "ai-image", provider: "Pollinations.ai" },
  { path: "/api/ai/video/generate", method: "POST", description: "Generate video from text (unlimited with device rotation)", params: [{ name: "prompt", type: "string", required: true, description: "Video prompt", default: "a cat playing piano" }, { name: "aspect_ratio", type: "string", required: false, description: "Aspect ratio (auto, 1:1, 16:9, 9:16)", default: "auto" }, { name: "ai_sound", type: "boolean", required: false, description: "Add AI sound/voice", default: "true" }], format: "json", category: "ai-tools", provider: "TXT2VI" },
];

const mediaStreamingEndpoints: ApiEndpoint[] = [
  { path: "/v1/seegore/home", method: "GET", description: "Get latest videos from SeeGore with direct MP4 links", params: [], format: "json", category: "media", provider: "SeeGore" },
  { path: "/v1/seegore/search", method: "GET", description: "Search SeeGore videos by keyword", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "accident" }], format: "json", category: "media", provider: "SeeGore" },
  { path: "/v1/seegore/watch", method: "GET", description: "Get direct MP4 video URL from SeeGore", params: [{ name: "url", type: "string", required: true, description: "Video URL or slug", default: "https://seegore.com/video-slug/" }], format: "json", category: "media", provider: "SeeGore" },
  { path: "/v1/movie/home", method: "GET", description: "Get latest movies from LK21 with streaming and download links", params: [], format: "json", category: "media", provider: "LK21" },
  { path: "/v1/movie/detail", method: "GET", description: "Get movie details, download links, and streaming players", params: [{ name: "url", type: "string", required: true, description: "Movie URL", default: "https://tv10.lk21official.cc/movie-slug/" }], format: "json", category: "media", provider: "LK21" },
  { path: "/v1/movie/stream", method: "GET", description: "Get streaming players for a movie", params: [{ name: "url", type: "string", required: true, description: "Movie URL", default: "https://tv10.lk21official.cc/movie-slug/" }], format: "json", category: "media", provider: "LK21" },
  { path: "/v1/tokusatsu/home", method: "GET", description: "Get latest Kamen Rider, Super Sentai, and Ultraman episodes", params: [], format: "json", category: "media", provider: "TokusatsuIndo" },
  { path: "/v1/tokusatsu/search", method: "GET", description: "Search tokusatsu episodes (Kamen Rider, Super Sentai, Ultraman)", params: [{ name: "q", type: "string", required: true, description: "Search query", default: "kamen rider" }], format: "json", category: "media", provider: "TokusatsuIndo" },
  { path: "/v1/tokusatsu/watch", method: "GET", description: "Get streaming URL for a tokusatsu episode", params: [{ name: "url", type: "string", required: true, description: "Episode URL", default: "https://www.tokusatsuindo.com/episode-slug/" }], format: "json", category: "media", provider: "TokusatsuIndo" },
];

export const allEndpoints: ApiEndpoint[] = [
  ...mediaStreamingEndpoints,
  ...workingAIEndpoints,
  ...aiChatEndpoints,
  ...aiToolEndpoints,
  ...aiImageEndpoints,
  ...musicEndpoints,
  ...socialMediaEndpoints,
  ...spotifyEndpoints,
  ...shazamEndpoints,
  ...ephotoEndpoints,
  ...photofuniaEndpoints,
  ...stalkerEndpoints,
  ...animeEndpoints,
  ...funEndpoints,
  ...urlShortenerEndpoints,
  ...toolsEndpoints,
  ...securityEndpoints,
  ...sportsEndpoints,
  ...searchEndpoints,
  ...textproEndpoints,
  ...converterEndpoints,
  ...audioFxEndpoints,
  ...zodiacEndpoints,
  ...gamesEndpoints,
  ...educationEndpoints,
  ...newsEndpoints,
  ...classifiedsEndpoints,
  ...jobsEndpoints,
  ...cryptoEndpoints,
  ...forexEndpoints,
  ...devToolsEndpoints,
  ...scrapingEndpoints,
  ...funDataEndpoints,
  ...adminEndpoints,
  ...metaEndpoints,
];

export type ApiCategory = typeof apiCategories[number];

// ─── NEW ENDPOINTS (v3.6.4+) ─────────────────────────────────────────────────

export const newTmdbEndpoints: ApiEndpoint[] = [
  { path: "/api/tmdb/search/movies", method: "GET", description: "Search TMDB movies by title", params: [{ name: "q", type: "string", required: true, description: "Movie title to search", default: "Inception" }, { name: "page", type: "number", required: false, description: "Page number", default: "1" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/search/tv", method: "GET", description: "Search TMDB TV shows by title", params: [{ name: "q", type: "string", required: true, description: "TV show title", default: "Breaking Bad" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/search/people", method: "GET", description: "Search TMDB people by name", params: [{ name: "q", type: "string", required: true, description: "Person name", default: "Brad Pitt" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/trending/:type/:time", method: "GET", description: "Get trending movies or TV shows", params: [{ name: "type", type: "string", required: true, description: "movie, tv, or person" }, { name: "time", type: "string", required: true, description: "day or week" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/popular/movies", method: "GET", description: "Get popular movies", params: [{ name: "page", type: "number", required: false, description: "Page number", default: "1" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/popular/tv", method: "GET", description: "Get popular TV shows", params: [{ name: "page", type: "number", required: false, description: "Page number", default: "1" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/now-playing", method: "GET", description: "Get movies now playing in theaters", params: [], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/on-air", method: "GET", description: "Get TV shows currently on air", params: [], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id", method: "GET", description: "Get detailed movie information", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID", default: "550" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/tv/:id", method: "GET", description: "Get detailed TV show information", params: [{ name: "id", type: "number", required: true, description: "TMDB TV ID", default: "1396" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id/credits", method: "GET", description: "Get movie cast and crew", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id/videos", method: "GET", description: "Get movie trailers and videos", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id/providers", method: "GET", description: "Get streaming providers for a movie", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id/similar", method: "GET", description: "Get similar movies", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id/recommendations", method: "GET", description: "Get movie recommendations", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id/images", method: "GET", description: "Get movie posters and backdrops", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/movie/:id/reviews", method: "GET", description: "Get movie reviews", params: [{ name: "id", type: "number", required: true, description: "TMDB movie ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/person/:id", method: "GET", description: "Get person/actor details", params: [{ name: "id", type: "number", required: true, description: "TMDB person ID", default: "287" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/person/:id/movies", method: "GET", description: "Get person's movie credits", params: [{ name: "id", type: "number", required: true, description: "TMDB person ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/upcoming", method: "GET", description: "Get upcoming movies", params: [{ name: "page", type: "number", required: false, description: "Page number", default: "1" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/top-rated", method: "GET", description: "Get top rated movies", params: [{ name: "page", type: "number", required: false, description: "Page number", default: "1" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/genres/movies", method: "GET", description: "Get all movie genres", params: [], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/genres/tv", method: "GET", description: "Get all TV genres", params: [], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/genre/:id/movies", method: "GET", description: "Get movies by genre", params: [{ name: "id", type: "number", required: true, description: "Genre ID" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/discover/movie", method: "GET", description: "Discover movies with filters", params: [{ name: "with_genres", type: "string", required: false, description: "Comma-separated genre IDs" }, { name: "year", type: "string", required: false, description: "Release year" }, { name: "sort_by", type: "string", required: false, description: "Sort order" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/discover/tv", method: "GET", description: "Discover TV shows with filters", params: [{ name: "with_genres", type: "string", required: false, description: "Comma-separated genre IDs" }, { name: "sort_by", type: "string", required: false, description: "Sort order" }], format: "json", category: "media", provider: "TMDB" },
  { path: "/api/tmdb/tv/:id/season/:num", method: "GET", description: "Get TV season episodes", params: [{ name: "id", type: "number", required: true, description: "TMDB TV ID" }, { name: "num", type: "number", required: true, description: "Season number", default: "1" }], format: "json", category: "media", provider: "TMDB" },
];

export const newContentEndpoints: ApiEndpoint[] = [
  { path: "/api/content/meme", method: "GET", description: "Get a random meme from Reddit", params: [], format: "json", category: "fun", provider: "Meme API" },
  { path: "/api/content/memes/:count", method: "GET", description: "Get multiple random memes", params: [{ name: "count", type: "number", required: false, description: "Number of memes", default: "5" }], format: "json", category: "fun", provider: "Meme API" },
  { path: "/api/content/quote", method: "GET", description: "Get a random inspirational quote", params: [], format: "json", category: "fun", provider: "Quotable" },
  { path: "/api/content/fact", method: "GET", description: "Get a random useless fact", params: [], format: "json", category: "fun", provider: "UselessFacts" },
  { path: "/api/content/cat-fact", method: "GET", description: "Get a random cat fact", params: [], format: "json", category: "fun", provider: "CatFact" },
  { path: "/api/content/riddle", method: "GET", description: "Get a random riddle with answer", params: [], format: "json", category: "fun" },
  { path: "/api/content/trivia", method: "GET", description: "Get a random trivia question", params: [], format: "json", category: "fun", provider: "OpenTDB" },
];

export const newLocalToolEndpoints: ApiEndpoint[] = [
  { path: "/api/tools/age", method: "GET", description: "Calculate age from birth date", params: [{ name: "date", type: "string", required: true, description: "Birth date (YYYY-MM-DD)", default: "2000-01-01" }], format: "json", category: "tools" },
  { path: "/api/tools/word-count", method: "POST", description: "Count words, characters, sentences, paragraphs, and reading time", params: [{ name: "text", type: "string", required: true, description: "Text to analyze", default: "Hello world. This is a test." }], format: "json", category: "tools" },
  { path: "/api/tools/random-number", method: "GET", description: "Generate a random number", params: [{ name: "min", type: "number", required: false, description: "Minimum value", default: "1" }, { name: "max", type: "number", required: false, description: "Maximum value", default: "100" }], format: "json", category: "tools" },
  { path: "/api/tools/coin-flip", method: "GET", description: "Flip a coin (heads or tails)", params: [], format: "json", category: "tools" },
  { path: "/api/tools/dice", method: "GET", description: "Roll a dice", params: [{ name: "sides", type: "number", required: false, description: "Number of sides", default: "6" }], format: "json", category: "tools" },
  { path: "/api/tools/slug", method: "GET", description: "Generate a URL slug from text", params: [{ name: "text", type: "string", required: true, description: "Text to slugify", default: "Hello World!" }], format: "json", category: "tools" },
  { path: "/api/tools/lorem", method: "GET", description: "Generate Lorem Ipsum placeholder text", params: [{ name: "paragraphs", type: "number", required: false, description: "Number of paragraphs", default: "3" }], format: "json", category: "tools" },
];

export const newSocialEndpoints: ApiEndpoint[] = [
  { path: "/api/social/youtube-thumbnails", method: "GET", description: "Get all YouTube thumbnail sizes for a video", params: [{ name: "url", type: "string", required: true, description: "YouTube video URL or ID", default: "https://youtu.be/dQw4w9WgXcQ" }], format: "json", category: "social-media", provider: "YouTube" },
  { path: "/api/social/link-preview", method: "GET", description: "Get Open Graph link preview metadata", params: [{ name: "url", type: "string", required: true, description: "URL to preview", default: "https://github.com" }], format: "json", category: "social-media" },
];

export const newWhatsAppEndpoints: ApiEndpoint[] = [
  { path: "/api/whatsapp/link", method: "GET", description: "Generate a WhatsApp click-to-chat link", params: [{ name: "phone", type: "string", required: true, description: "Phone number with country code", default: "254758476795" }, { name: "message", type: "string", required: false, description: "Pre-filled message", default: "Hi" }], format: "json", category: "tools", provider: "WhatsApp" },
  { path: "/api/whatsapp/check", method: "GET", description: "Validate and format a WhatsApp phone number", params: [{ name: "phone", type: "string", required: true, description: "Phone number", default: "254758476795" }], format: "json", category: "tools" },
  { path: "/api/whatsapp/carrier", method: "GET", description: "Detect Kenyan mobile carrier from phone number", params: [{ name: "phone", type: "string", required: true, description: "Phone number", default: "254712345678" }], format: "json", category: "tools" },
];

export const newEmailEndpoints: ApiEndpoint[] = [
  { path: "/api/email/gravatar", method: "GET", description: "Get Gravatar URL and profile for an email", params: [{ name: "email", type: "string", required: true, description: "Email address", default: "trackerwanga@gmail.com" }], format: "json", category: "tools", provider: "Gravatar" },
  { path: "/api/email/disposable", method: "GET", description: "Check if an email is from a disposable provider", params: [{ name: "email", type: "string", required: true, description: "Email address", default: "test@mailinator.com" }], format: "json", category: "tools" },
];

export const newTimeEndpoints: ApiEndpoint[] = [
  { path: "/api/time/day-of-year", method: "GET", description: "Get current day number of the year", params: [], format: "json", category: "tools" },
  { path: "/api/time/countdown", method: "GET", description: "Get countdown to a specific date", params: [{ name: "date", type: "string", required: true, description: "Target date (YYYY-MM-DD)", default: "2027-01-01" }], format: "json", category: "tools" },
];

export const newMathEndpoints: ApiEndpoint[] = [
  { path: "/api/math/prime", method: "GET", description: "Check if a number is prime", params: [{ name: "number", type: "number", required: true, description: "Number to check", default: "17" }], format: "json", category: "tools" },
  { path: "/api/math/factorial", method: "GET", description: "Calculate factorial of a number", params: [{ name: "number", type: "number", required: true, description: "Number (max 170)", default: "10" }], format: "json", category: "tools" },
  { path: "/api/math/fibonacci", method: "GET", description: "Generate Fibonacci sequence", params: [{ name: "count", type: "number", required: false, description: "Number of terms", default: "10" }], format: "json", category: "tools" },
  { path: "/api/math/bmi", method: "GET", description: "Calculate BMI (Body Mass Index)", params: [{ name: "weight", type: "number", required: true, description: "Weight in kg", default: "70" }, { name: "height", type: "number", required: true, description: "Height in cm", default: "175" }, { name: "unit", type: "string", required: false, description: "metric or imperial", default: "metric" }], format: "json", category: "tools" },
];

export const newEncodingEndpoints: ApiEndpoint[] = [
  { path: "/api/encode/hex", method: "GET", description: "Encode or decode text to/from hex", params: [{ name: "text", type: "string", required: true, description: "Text to encode/decode", default: "Hello" }, { name: "decode", type: "string", required: false, description: "Set to '1' to decode" }], format: "json", category: "tools" },
  { path: "/api/encode/binary", method: "GET", description: "Encode or decode text to/from binary", params: [{ name: "text", type: "string", required: true, description: "Text to encode/decode", default: "Hi" }, { name: "decode", type: "string", required: false, description: "Set to '1' to decode" }], format: "json", category: "tools" },
  { path: "/api/encode/rot13", method: "GET", description: "Apply ROT13 cipher to text", params: [{ name: "text", type: "string", required: true, description: "Text to transform", default: "Hello" }], format: "json", category: "tools" },
  { path: "/api/encode/morse", method: "GET", description: "Convert text to Morse code", params: [{ name: "text", type: "string", required: true, description: "Text to convert", default: "SOS" }], format: "json", category: "tools" },
  { path: "/api/encode/jwt-decode", method: "POST", description: "Decode a JWT token (header and payload)", params: [{ name: "token", type: "string", required: true, description: "JWT token string" }], format: "json", category: "dev-tools" },
];

export const newQrEndpoints: ApiEndpoint[] = [
  { path: "/api/qr/wifi", method: "GET", description: "Generate a WiFi QR code", params: [{ name: "ssid", type: "string", required: true, description: "WiFi network name", default: "MyWiFi" }, { name: "password", type: "string", required: true, description: "WiFi password", default: "pass123" }, { name: "encryption", type: "string", required: false, description: "WPA, WEP, or nopass", default: "WPA" }], format: "json", category: "tools" },
  { path: "/api/qr/vcard", method: "GET", description: "Generate a vCard contact QR code", params: [{ name: "name", type: "string", required: true, description: "Full name", default: "Tracker Wanga" }, { name: "phone", type: "string", required: false, description: "Phone number" }, { name: "email", type: "string", required: false, description: "Email address" }, { name: "org", type: "string", required: false, description: "Organization" }], format: "json", category: "tools" },
];

export const newGamesEndpoints: ApiEndpoint[] = [
  { path: "/api/games/8ball", method: "GET", description: "Ask the magic 8-ball a question", params: [], format: "json", category: "games" },
  { path: "/api/games/this-day", method: "GET", description: "Get historical events that happened today", params: [], format: "json", category: "games" },
  { path: "/api/games/numbers", method: "GET", description: "Get interesting facts about a number", params: [{ name: "number", type: "number", required: true, description: "Any number", default: "42" }], format: "json", category: "games" },
  { path: "/api/games/programming-joke", method: "GET", description: "Get a random programming joke", params: [], format: "json", category: "games" },
];

export const newOtpEndpoints: ApiEndpoint[] = [
  { path: "/api/auth/generate-otp", method: "POST", description: "Generate a one-time password with WhatsApp link", params: [{ name: "phone", type: "string", required: true, description: "Phone number", default: "254758476795" }], format: "json", category: "tools" },
  { path: "/api/auth/verify-otp", method: "POST", description: "Verify a one-time password", params: [{ name: "phone", type: "string", required: true, description: "Phone number" }, { name: "code", type: "string", required: true, description: "OTP code to verify" }], format: "json", category: "tools" },
];

export const newPdfEndpoints: ApiEndpoint[] = [
  { path: "/api/tools/generate-pdf", method: "POST", description: "Generate a beautifully formatted PDF document with title, subtitle, watermark, colors, profile image, and logo", params: [{ name: "title", type: "string", required: false, description: "Document title", default: "My Document" }, { name: "subtitle", type: "string", required: false, description: "Document subtitle" }, { name: "text", type: "string", required: true, description: "Content text (supports # headings and ## subheadings)", default: "Hello World" }, { name: "author", type: "string", required: false, description: "Author name" }, { name: "footer", type: "string", required: false, description: "Footer text" }, { name: "watermark", type: "string", required: false, description: "Watermark text (e.g. CONFIDENTIAL)" }, { name: "color", type: "string", required: false, description: "Primary color hex", default: "#7C3AED" }, { name: "profileImage", type: "string", required: false, description: "Profile image URL" }, { name: "logo", type: "string", required: false, description: "Logo image URL" }], format: "json", category: "tools" },
  { path: "/api/tools/generate-invoice", method: "POST", description: "Generate a professional invoice PDF with company branding, line items, and totals", params: [{ name: "companyName", type: "string", required: true, description: "Your company name" }, { name: "invoiceNumber", type: "string", required: true, description: "Invoice number" }, { name: "date", type: "string", required: true, description: "Invoice date" }, { name: "from", type: "object", required: true, description: "Sender info: name, email, phone, address" }, { name: "to", type: "object", required: true, description: "Recipient info: name, email, phone, address" }, { name: "items", type: "array", required: true, description: "Line items: description, quantity, unitPrice" }, { name: "currency", type: "string", required: false, description: "Currency code", default: "KES" }, { name: "notes", type: "string", required: false, description: "Additional notes" }], format: "json", category: "tools" },
];

// Update allEndpoints to include all new endpoints
export const allNewEndpoints: ApiEndpoint[] = [
  ...newTmdbEndpoints,
  ...newContentEndpoints,
  ...newLocalToolEndpoints,
  ...newSocialEndpoints,
  ...newWhatsAppEndpoints,
  ...newEmailEndpoints,
  ...newTimeEndpoints,
  ...newMathEndpoints,
  ...newEncodingEndpoints,
  ...newQrEndpoints,
  ...newGamesEndpoints,
  ...newOtpEndpoints,
  ...newPdfEndpoints,
];

export const allEndpointsComplete: ApiEndpoint[] = [
  ...allEndpoints,
  ...allNewEndpoints,
];
