import type { Express, Request, Response } from "express";
import axios from "axios";
import { d1Query, d1Execute } from "./d1-client";
import { allEndpoints, apiCategories, ApiEndpoint } from "../shared/schema";

// ─── MEGAN AI ASSISTANT (Dynamic Schema Search) ────────────────────────────

// ─── CHAT RATE LIMIT (in-memory) ────────────────────────────────────────────
const chatRateLimitMap = new Map<string, { count: number; reset: number }>();
const CHAT_LIMIT = 10;               // 10 messages
const CHAT_WINDOW_MS = 60 * 1000;    // per minute

function checkChatRateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = chatRateLimitMap.get(key);
  if (!entry || now > entry.reset) {
    chatRateLimitMap.set(key, { count: 1, reset: now + CHAT_WINDOW_MS });
    return { ok: true, remaining: CHAT_LIMIT - 1 };
  }
  if (entry.count >= CHAT_LIMIT) return { ok: false, remaining: 0 };
  entry.count++;
  return { ok: true, remaining: CHAT_LIMIT - entry.count };
}

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
  projects: ["Megan APIs (873 endpoints)", "apis.megan.qzz.io"],
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
  
  // ─── POST /api/v2/megan-ai/chat ────────────────────────────────────────
  // Multi-turn chat. Body: { message, conversation_id? }
  // Returns structured endpoint recommendations + reply text.
  app.post("/api/v2/megan-ai/chat", async (req: Request, res: Response) => {
    const message = (req.body?.message || "").trim();
    const incomingConvId = req.body?.conversation_id as string | undefined;
    const uid = (req.body?.uid as string) || (req.query.uid as string) || (req.ip || "anon");

    if (!message) return res.status(400).json({ success: false, error: "message required" });
    if (message.length > 1000) return res.status(400).json({ success: false, error: "message too long (max 1000 chars)" });

    // Rate limit
    const rate = checkChatRateLimit(uid);
    if (!rate.ok) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Try again in a minute.",
      });
    }

    try {
      // 1. Search endpoints
      const relevantEndpoints = searchEndpoints(message, 8);
      const systemPrompt = buildSystemPrompt(message);
      const conversationId = incomingConvId || `conv-${Date.now().toString(36)}`;

      // 2. Ask the LLM (cascade)
      const models = [
        { key: "deepseek", name: "DeepSeek V3.2", fn: () => askOverchat(message, systemPrompt, "deepseek") },
        { key: "megan",    name: "Megan AI (GLM)", fn: () => askMeganAI(message, systemPrompt) },
        { key: "gpt5",     name: "GPT-4.1 Nano",  fn: () => askOverchat(message, systemPrompt, "gpt5") },
        { key: "gemini",   name: "Gemini 2.0 Flash Lite", fn: () => askGeminiLite(message, systemPrompt) },
      ];

      let answer = "";
      let usedModel = "";
      let lastError = "";

      for (const m of models) {
        try {
          answer = await m.fn();
          usedModel = m.name;
          break;
        } catch (e: any) {
          lastError = e.message;
          console.log(`[MeganChat] ${m.name} failed: ${e.message}`);
        }
      }

      if (!answer) {
        return res.status(500).json({ success: false, error: `AI unavailable: ${lastError}` });
      }

      // 3. Structure endpoints for the frontend
      const structuredEndpoints = relevantEndpoints.slice(0, 6).map((ep: any) => ({
        path: ep.path,
        method: ep.method,
        description: ep.description,
      }));

      // 4. Persist (best-effort)
      try {
        await d1Execute(
          "INSERT INTO megan_ai_conversations (conversation_id, user_input, ai_response, model_used, fallback_used) VALUES (?, ?, ?, ?, ?)",
          [conversationId, message, answer, usedModel, usedModel !== "DeepSeek V3.2"]
        );
      } catch {}

      // ─── SESSION MANAGEMENT ───────────────────────────────────────────
      const sessionId = (req.body?.session_id as string) || null;
      let finalSessionId = sessionId;
      let isNewSession = false;

      if (!finalSessionId) {
        // New session
        finalSessionId = `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        isNewSession = true;
        const title = message.length > 60 ? message.slice(0, 57) + "..." : message;
        try {
          await d1Execute(
            "INSERT INTO ai_chat_sessions (id, user_id, title, message_count, created_at, updated_at) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))",
            [finalSessionId, uid === "anon" ? null : uid, title]
          );
        } catch (e: any) { console.error("session create failed", e.message); }
      }

      // Save user message
      try {
        await d1Execute(
          "INSERT INTO ai_chat_messages (session_id, role, content, created_at) VALUES (?, 'user', ?, datetime('now'))",
          [finalSessionId, message]
        );
      } catch (e: any) { console.error("user msg save failed", e.message); }

      // Save AI message
      try {
        await d1Execute(
          "INSERT INTO ai_chat_messages (session_id, role, content, endpoints, model_used, created_at) VALUES (?, 'assistant', ?, ?, ?, datetime('now'))",
          [finalSessionId, answer, JSON.stringify(structuredEndpoints), usedModel]
        );
      } catch (e: any) { console.error("ai msg save failed", e.message); }

      // Bump session updated_at + message_count
      try {
        await d1Execute(
          "UPDATE ai_chat_sessions SET message_count = message_count + 2, updated_at = datetime('now') WHERE id = ?",
          [finalSessionId]
        );
      } catch {}

      return res.json({
        success: true,
        provider: "Megan AI",
        model: usedModel,
        session_id: finalSessionId,
        is_new_session: isNewSession,
        reply: answer,
        endpoints: structuredEndpoints,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── GET /api/v2/megan-ai/sessions ─────────────────────────────────────
  // List user's recent chat sessions (last 30)
  app.get("/api/v2/megan-ai/sessions", async (req: Request, res: Response) => {
    try {
      const uid = (req.query.uid as string) || "";
      if (!uid) return res.status(400).json({ success: false, error: "uid required" });

      const sessions = await d1Query(
        "SELECT id, title, message_count, created_at, updated_at FROM ai_chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 30",
        [uid]
      );
      return res.json({ success: true, count: sessions.length, sessions });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── GET /api/v2/megan-ai/sessions/:id ─────────────────────────────────
  // Load a full session with messages
  app.get("/api/v2/megan-ai/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.id);
      const uid = (req.query.uid as string) || "";

      // Verify ownership (if session has user_id)
      const session = await d1Query(
        "SELECT * FROM ai_chat_sessions WHERE id = ?",
        [sessionId]
      );
      if (session.length === 0) {
        return res.status(404).json({ success: false, error: "Session not found" });
      }
      const s = session[0];
      if (s.user_id && s.user_id !== uid) {
        return res.status(403).json({ success: false, error: "Not your session" });
      }

      const messages = await d1Query(
        "SELECT id, role, content, endpoints, model_used, created_at FROM ai_chat_messages WHERE session_id = ? ORDER BY id ASC LIMIT 200",
        [sessionId]
      );

      // Parse endpoints JSON
      const parsed = messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        endpoints: m.endpoints ? (() => { try { return JSON.parse(m.endpoints); } catch { return []; } })() : [],
        model_used: m.model_used,
        created_at: m.created_at,
      }));

      return res.json({
        success: true,
        session: {
          id: s.id,
          title: s.title,
          message_count: s.message_count,
          created_at: s.created_at,
          updated_at: s.updated_at,
        },
        messages: parsed,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── DELETE /api/v2/megan-ai/sessions/:id ──────────────────────────────
  app.delete("/api/v2/megan-ai/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.id);
      const uid = (req.query.uid as string) || "";

      const session = await d1Query(
        "SELECT user_id FROM ai_chat_sessions WHERE id = ?",
        [sessionId]
      );
      if (session.length === 0) {
        return res.status(404).json({ success: false, error: "Not found" });
      }
      if (session[0].user_id && session[0].user_id !== uid) {
        return res.status(403).json({ success: false, error: "Not your session" });
      }

      await d1Execute("DELETE FROM ai_chat_messages WHERE session_id = ?", [sessionId]);
      await d1Execute("DELETE FROM ai_chat_sessions WHERE id = ?", [sessionId]);

      return res.json({ success: true, deleted: sessionId });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── PATCH /api/v2/megan-ai/sessions/:id ───────────────────────────────
  // Rename a session
  app.patch("/api/v2/megan-ai/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.id);
      const uid = (req.query.uid as string) || "";
      const title = (req.body?.title as string || "").trim().slice(0, 100);
      if (!title) return res.status(400).json({ success: false, error: "title required" });

      const session = await d1Query(
        "SELECT user_id FROM ai_chat_sessions WHERE id = ?",
        [sessionId]
      );
      if (session.length === 0) return res.status(404).json({ success: false, error: "Not found" });
      if (session[0].user_id && session[0].user_id !== uid) {
        return res.status(403).json({ success: false, error: "Not your session" });
      }

      await d1Execute(
        "UPDATE ai_chat_sessions SET title = ?, updated_at = datetime('now') WHERE id = ?",
        [title, sessionId]
      );
      return res.json({ success: true, title });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ Megan AI Routes Registered:");
  console.log("  GET    /api/v2/megan-ai?q=...");
  console.log("  POST   /api/v2/megan-ai/chat  (10/min rate limit)");
  console.log("  GET    /api/v2/megan-ai/sessions?uid=...");
  console.log("  GET    /api/v2/megan-ai/sessions/:id");
  console.log("  PATCH  /api/v2/megan-ai/sessions/:id");
  console.log("  DELETE /api/v2/megan-ai/sessions/:id");
}
