import type { Express, Request, Response } from "express";
import crypto from "crypto";

// ============================================
// WORKING AI BACKENDS (Tested & Confirmed)
// ============================================

// 1. OVERCHAT.AI - 3 Premium Models (Claude, GPT-5, DeepSeek)
const OVERCHAT_API = "https://api.overchat.ai/v1/chat/completions";
const OVERCHAT_UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

const OVERCHAT_MODELS = {
  claude: {
    name: "Claude Haiku 4.5",
    model: "claude-haiku-4-5-20251001",
    personaId: "claude-haiku-4-5-landing",
  },
  gpt5: {
    name: "GPT-4.1 Nano",
    model: "openai/gpt-4.1-nano-2025-04-14",
    personaId: "gpt-4o-landing",
  },
  deepseek: {
    name: "DeepSeek V3.2",
    model: "deepseek/deepseek-non-thinking-v3.2-exp",
    personaId: "deepseek-v-3-2-landing",
  },
};

async function askOverchat(prompt: string, systemPrompt: string, modelKey: keyof typeof OVERCHAT_MODELS = "gpt5"): Promise<string> {
  const preset = OVERCHAT_MODELS[modelKey];
  const chatId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();

  const messages = [
    {
      id: crypto.randomUUID(),
      role: "system",
      content: systemPrompt,
    },
    {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    },
  ];

  const body = {
    chatId,
    model: preset.model,
    messages,
    personaId: preset.personaId,
    frequency_penalty: 0,
    max_tokens: 4000,
    presence_penalty: 0,
    stream: true,
    temperature: 0.7,
    top_p: 0.95,
  };

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "x-device-uuid": deviceId,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "sec-ch-ua-mobile": "?1",
    "x-device-language": "id-ID",
    "x-device-platform": "web",
    "x-device-version": "1.0.44",
    "user-agent": OVERCHAT_UA,
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://overchat.ai",
    referer: "https://overchat.ai/",
    "accept-language": "id-ID,id;q=0.9",
  };

  const response = await fetch(OVERCHAT_API, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Overchat error: HTTP ${response.status}`);
  }

  let answer = "";
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (typeof content === "string") {
          answer += content;
        }
      } catch {}
    }
  }

  if (!answer) throw new Error("Empty response from Overchat");
  return answer;
}

// 2. TXT2VI VIDEO GENERATOR (Unlimited with device rotation)
const TXT2VI_API = "https://t2v.aritek.app";
const TXT2VI_SIGN = "68d6165b72a7f2d8d17b0dc6fe9691abdf77c583";
const TXT2VI_VERSION = 85;
const TXT2VI_UA = "okhttp/4.12.0";

async function generateVideo(prompt: string, options: { aspectRatio?: string; aiSound?: boolean } = {}): Promise<{ url: string; deviceId: string }> {
  const deviceId = "api_" + crypto.randomBytes(8).toString("hex");
  
  // Get token
  const tokenResponse = await fetch(`${TXT2VI_API}/api/v1/user/info`, {
    headers: {
      'User-Agent': TXT2VI_UA,
      'versionCode': String(TXT2VI_VERSION),
      'Ctry-Target': 'others',
      'Device-Id': deviceId,
      'Sign': TXT2VI_SIGN
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token fetch failed: HTTP ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json() as any;
  const token = tokenData.data?.token;
  if (!token) throw new Error("No token received");

  // Generate video
  const body = {
    prompt,
    versionCode: TXT2VI_VERSION,
    deviceID: deviceId,
    isPremium: 1,
    ctry_target: "others",
    used: [],
    aspect_ratio: options.aspectRatio || "auto",
    ai_sound: options.aiSound !== false ? 1 : 0
  };

  const videoResponse = await fetch(`${TXT2VI_API}/api/v3/video/t2v`, {
    method: 'POST',
    headers: {
      'User-Agent': TXT2VI_UA,
      'versionCode': String(TXT2VI_VERSION),
      'Ctry-Target': 'others',
      'Device-Id': deviceId,
      'Sign': TXT2VI_SIGN,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000)
  });

  if (!videoResponse.ok) {
    throw new Error(`Video generation failed: HTTP ${videoResponse.status}`);
  }

  const videoData = await videoResponse.json() as any;
  if (videoData.data?.url) {
    return { url: videoData.data.url, deviceId };
  }
  
  throw new Error("No video URL in response");
}

// ============================================
// UPGRADED AI ROUTES
// ============================================

export function registerAIRoutes(app: Express): void {
  
  // ─── OVERCHAT.AI ENDPOINTS (WORKING MODELS) ────────────────────────
  
  app.get("/api/ai/overchat/claude", async (req: Request, res: Response) => {
    const prompt = (req.query.q || req.query.prompt) as string;
    if (!prompt) return res.status(400).json({ status: false, error: "Parameter 'q' is required" });
    
    try {
      const text = await askOverchat(prompt, "You are Claude, an AI assistant made by Anthropic. You are thoughtful, nuanced, and carefully consider multiple perspectives before responding.", "claude");
      return res.json({
        status: true,
        creator: "Megan APIs v3.6.5 | Tracker Wanga",
        provider: "Overchat.ai",
        model: "Claude Haiku 4.5",
        result: text,
      });
    } catch (error: any) {
      return res.status(500).json({ status: false, error: error.message });
    }
  });

  app.get("/api/ai/overchat/gpt5", async (req: Request, res: Response) => {
    const prompt = (req.query.q || req.query.prompt) as string;
    if (!prompt) return res.status(400).json({ status: false, error: "Parameter 'q' is required" });
    
    try {
      const text = await askOverchat(prompt, "You are ChatGPT, a helpful AI assistant by OpenAI. Respond clearly, concisely, and helpfully.", "gpt5");
      return res.json({
        status: true,
        creator: "Megan APIs v3.6.5 | Tracker Wanga",
        provider: "Overchat.ai",
        model: "GPT-4.1 Nano",
        result: text,
      });
    } catch (error: any) {
      return res.status(500).json({ status: false, error: error.message });
    }
  });

  app.get("/api/ai/overchat/deepseek", async (req: Request, res: Response) => {
    const prompt = (req.query.q || req.query.prompt) as string;
    if (!prompt) return res.status(400).json({ status: false, error: "Parameter 'q' is required" });
    
    try {
      const text = await askOverchat(prompt, "You are DeepSeek, an advanced AI assistant. Think step by step before answering. Be thorough and precise.", "deepseek");
      return res.json({
        status: true,
        creator: "Megan APIs v3.6.5 | Tracker Wanga",
        provider: "Overchat.ai",
        model: "DeepSeek V3.2",
        result: text,
      });
    } catch (error: any) {
      return res.status(500).json({ status: false, error: error.message });
    }
  });

  // ─── TXT2VI VIDEO ENDPOINT ─────────────────────────────────────────
  
  app.post("/api/ai/video/generate", async (req: Request, res: Response) => {
    const { prompt, aspect_ratio, ai_sound } = req.body;
    
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "Parameter 'prompt' is required" 
      });
    }

    try {
      const result = await generateVideo(prompt.trim(), {
        aspectRatio: aspect_ratio || "auto",
        aiSound: ai_sound !== false
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5 | Tracker Wanga",
        provider: "TXT2VI",
        video_url: result.url,
        prompt: prompt.trim(),
      });
    } catch (error: any) {
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // ─── KEEP ORIGINAL MEGAN AI ENDPOINTS (Fallback) ──────────────────
  
  const MEGAN_AI_BASE = "https://ai.megan.qzz.io";
  
  async function aiProxy(prompt: string, systemPrompt: string): Promise<string> {
    const url = `${MEGAN_AI_BASE}/api/ai/workers/glm?prompt=${encodeURIComponent(prompt)}&system=${encodeURIComponent(systemPrompt)}&api_key=megan_admin_master`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const data = await res.json() as any;
    if (data.success && data.text) return data.text;
    throw new Error(data.error || "Empty response");
  }

  // Keep original endpoints as fallback
  const chatEndpoints = [
    { path: "/api/ai/gpt", label: "GPT", system: "You are ChatGPT, a helpful AI assistant by OpenAI." },
    { path: "/api/ai/claude", label: "Claude", system: "You are Claude, an AI assistant made by Anthropic." },
    { path: "/api/ai/mistral", label: "Mistral", system: "You are Mistral AI, a powerful open-source language model." },
    { path: "/api/ai/gemini", label: "Gemini", system: "You are Gemini, Google's multimodal AI." },
    { path: "/api/ai/deepseek", label: "DeepSeek", system: "You are DeepSeek, an advanced AI assistant." },
  ];

  for (const ep of chatEndpoints) {
    const handleAI = async (req: Request, res: Response) => {
      const prompt = (req.query.q || req.query.prompt || req.body?.q || req.body?.prompt) as string;
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({
          status: false,
          creator: "Megan APIs v3.6.5 | Tracker Wanga",
          error: `Parameter 'q' is required. Usage: ${ep.path}?q=Your message here`,
        });
      }

      try {
        // Try Overchat first (working)
        const text = await askOverchat(prompt.trim(), ep.system);
        return res.json({
          status: true,
          creator: "Megan APIs v3.6.5 | Tracker Wanga",
          provider: "Overchat.ai",
          result: text,
        });
      } catch (error: any) {
        // Fallback to Megan AI
        try {
          const text = await aiProxy(prompt.trim(), ep.system);
          return res.json({
            status: true,
            creator: "Megan APIs v3.6.5 | Tracker Wanga",
            provider: "Megan AI",
            result: text,
          });
        } catch (fallbackError: any) {
          return res.status(500).json({
            status: false,
            creator: "Megan APIs v3.6.5 | Tracker Wanga",
            error: `Both providers failed: ${error.message} | ${fallbackError.message}`,
          });
        }
      }
    };

    app.get(ep.path, handleAI);
    app.post(ep.path, handleAI);
  }

  console.log("✅ AI routes registered:");
  console.log("  - /api/ai/overchat/claude (WORKING)");
  console.log("  - /api/ai/overchat/gpt5 (WORKING)");
  console.log("  - /api/ai/overchat/deepseek (WORKING)");
  console.log("  - /api/ai/video/generate (WORKING)");
  console.log("  - /api/ai/gpt (Fallback to Overchat)");
  console.log("  - /api/ai/claude (Fallback to Overchat)");
}
