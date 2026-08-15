import type { Express, Request, Response } from "express";
import axios from "axios";
import { d1Query, d1Execute } from "./d1-client";
import { allEndpoints, apiCategories, ApiEndpoint } from "../shared/schema";

// ─── MEGAN AI ASSISTANT (Dynamic Schema Search) ────────────────────────────

const MEGAN_INFO = {
  name: "Tracker Wanga",
  age: 20,
  country: "Kenya",
  role: "Backend Developer",
  skills: ["Kotlin", "Python", "Java", "PHP", "Go", "Node.js", "TypeScript", "React", "Laravel"],
  phones: ["+254769502217", "+254758476795", "+254119387715", "+254107655023"],
  instagram: "https://www.instagram.com/zeen.whispers",
  facebook: "https://www.facebook.com/profile.php?id=100086220715987",
  github: "https://github.com/TrackerWanga",
  projects: ["Megan APIs (873 endpoints)", "meganapis.space"],
};

// ─── SEARCH SCHEMA ─────────────────────────────────────────────────────────

function searchEndpoints(query: string, limit: number = 10): ApiEndpoint[] {
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(w => w.length > 2);
  
  return allEndpoints
    .map(ep => {
      let score = 0;
      const path = ep.path.toLowerCase();
      const desc = ep.description.toLowerCase();
      const category = ep.category.toLowerCase();
      const categoryId = ep.categoryId.toLowerCase();
      const provider = (ep.provider || "").toLowerCase();
      
      // Exact path match
      if (path.includes(q)) score += 10;
      
      // Keyword matching
      for (const kw of keywords) {
        if (path.includes(kw)) score += 5;
        if (desc.includes(kw)) score += 3;
        if (category.includes(kw)) score += 2;
        if (categoryId.includes(kw)) score += 2;
        if (provider.includes(kw)) score += 1;
      }
      
      // Category match
      if (category.includes(q)) score += 4;
      if (categoryId.includes(q.replace(/s$/, ""))) score += 4;
      
      return { ep, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.ep);
}

function formatEndpointsForPrompt(endpoints: ApiEndpoint[]): string {
  return endpoints.map(ep => {
    const params = ep.params.map(p => p.name).join(", ");
    return `- ${ep.method} ${ep.path} - ${ep.description}${params ? ` (params: ${params})` : ""}${ep.provider ? ` [${ep.provider}]` : ""}`;
  }).join("\n");
}

function buildSystemPrompt(userQuery: string): string {
  const relevantEndpoints = searchEndpoints(userQuery, 10);
  const endpointContext = relevantEndpoints.length > 0 
    ? formatEndpointsForPrompt(relevantEndpoints)
    : "No specific endpoints found.";
  
  return `You are Megan AI for Megan APIs (apis.megan.qzz.io).

Creator: Tracker Wanga (20, Kenya, Backend Dev). Contact: +254769502217.

API Key: Get at POST /api/keys/generate. Add &api_key=YOUR_KEY to all requests.

Available endpoints for this query:
${endpointContext}

Answer ONLY about these Megan APIs endpoints. Format: METHOD path - description. Include &api_key=YOUR_KEY in examples. Under 100 words.`;
}

// ─── AI MODELS (fallback chain) ────────────────────────────────────────────

async function askOverchat(prompt: string, systemPrompt: string, modelKey: string): Promise<string> {
  const OVERCHAT_API = "https://api.overchat.ai/v1/chat/completions";
  const models: Record<string, any> = {
    claude: { name: "Claude Haiku 4.5", model: "claude-haiku-4-5-20251001", personaId: "claude-haiku-4-5-landing" },
    gpt5: { name: "GPT-4.1 Nano", model: "openai/gpt-4.1-nano-2025-04-14", personaId: "gpt-4o-landing" },
    deepseek: { name: "DeepSeek V3.2", model: "deepseek/deepseek-non-thinking-v3.2-exp", personaId: "deepseek-v-3-2-landing" },
  };
  
  const preset = models[modelKey];
  const crypto = require("crypto");
  const chatId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();
  
  const messages = [
    { id: crypto.randomUUID(), role: "system", content: systemPrompt },
    { id: crypto.randomUUID(), role: "user", content: prompt },
  ];
  
  const body = {
    chatId, model: preset.model, messages, personaId: preset.personaId,
    frequency_penalty: 0, max_tokens: 2000, presence_penalty: 0,
    stream: true, temperature: 0.7, top_p: 0.95,
  };
  
  const response = await fetch(OVERCHAT_API, {
    method: "POST",
    headers: {
      "x-device-uuid": deviceId,
      "x-device-language": "en-US",
      "x-device-platform": "web",
      "x-device-version": "1.0.44",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
      "content-type": "application/json",
      "origin": "https://overchat.ai",
      "referer": "https://overchat.ai/",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
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
        if (typeof content === "string") answer += content;
      } catch {}
    }
  }
  
  if (!answer) throw new Error("Empty response");
  return answer;
}

async function askMeganAI(prompt: string, systemPrompt: string): Promise<string> {
  const url = `https://ai.megan.qzz.io/api/ai/workers/glm?prompt=${encodeURIComponent(prompt)}&system=${encodeURIComponent(systemPrompt)}&api_key=megan_admin_master`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json() as any;
  if (data.success && data.text) return data.text;
  if (data.result) return data.result;
  throw new Error(data.error || "Empty response");
}

async function askGeminiLite(prompt: string, systemPrompt: string): Promise<string> {
  const response = await axios.post(
    "https://us-central1-infinite-chain-295909.cloudfunctions.net/gemini-proxy-staging-v1",
    { model: "gemini-2.0-flash-lite", contents: [{ parts: [{ text: systemPrompt }, { text: prompt }] }] },
    { timeout: 20000, headers: { "Content-Type": "application/json" } }
  );
  const content = response.data?.candidates?.[0]?.content;
  const parts = content?.parts || [];
  const answer = parts.map((p: any) => p.text).join("");
  if (!answer) throw new Error("Empty response");
  return answer;
}

// ─── REGISTER ROUTE ─────────────────────────────────────────────────────────

export function registerMeganAIRoutes(app: Express): void {
  app.get("/api/v2/megan-ai", async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ success: false, error: "Parameter 'q' required" });
    
    // Search schema for relevant endpoints
    const relevantEndpoints = searchEndpoints(q.trim(), 15);
    const systemPrompt = buildSystemPrompt(q.trim());
    const conversationId = `conv-${Date.now().toString(36)}`;
    
    const models = [
      { key: "deepseek", name: "DeepSeek V3.2", fn: () => askOverchat(q.trim(), systemPrompt, "deepseek") },
      { key: "megan", name: "Megan AI (GLM)", fn: () => askMeganAI(q.trim(), systemPrompt) },
      { key: "gpt5", name: "GPT-4.1 Nano", fn: () => askOverchat(q.trim(), systemPrompt, "gpt5") },
      { key: "claude", name: "Claude Haiku 4.5", fn: () => askOverchat(q.trim(), systemPrompt, "claude") },
      { key: "gemini", name: "Gemini 2.0 Flash Lite", fn: () => askGeminiLite(q.trim(), systemPrompt) },
    ];
    
    let lastError = "";
    
    for (const model of models) {
      try {
        const answer = await model.fn();
        
        try {
          await d1Execute(
            "INSERT INTO megan_ai_conversations (conversation_id, user_input, ai_response, model_used, fallback_used) VALUES (?, ?, ?, ?, ?)",
            [conversationId, q.trim(), answer, model.name, model.key !== "claude"]
          );
        } catch {}
        
        return res.json({
          success: true,
          provider: "Megan AI",
          model: model.name,
          fallback_used: model.key !== "deepseek",
          conversation_id: conversationId,
          matched_endpoints: relevantEndpoints.map(e => `${e.method} ${e.path}`),
          result: answer,
        });
      } catch (e: any) {
        lastError = e.message;
        console.log(`[MeganAI] ${model.name} failed: ${e.message}`);
      }
    }
    
    return res.status(500).json({ success: false, error: `All AI models failed: ${lastError}` });
  });
  
  console.log("✅ Megan AI Routes Registered:");
  console.log("  GET /api/v2/megan-ai?q=... (dynamic schema search)");
}
