import type { Express, Request, Response } from "express";
import axios from "axios";
import { d1Query, d1Execute } from "./d1-client";
import { allEndpoints, apiCategories, ApiEndpoint } from "../shared/schema";
import { cfChat, cfTTS, cfSTT, cfAiConfigured, groqChat, groqSTT, groqConfigured, fallbackTTS } from "./cf-ai";
import { runDoerTool, formatToolsForDoer, isKnownTool, DOER_TOOLS } from "./doer-tools";
import {
  searchHosting,
  getHostingProvider,
  getAllHostingProviders,
  getPlatformInfo,
  getEcosystem,
  getBeginnerConcepts,
  formatHostingForPrompt,
  formatEcosystemForPrompt,
  formatPlatformSummaryForPrompt,
} from "./knowledge";

// ─── CHAT RATE LIMIT ───────────────────────────────────────────────────────
const chatRateLimitMap = new Map<string, { count: number; reset: number }>();
const CHAT_LIMIT = 15;
const CHAT_WINDOW_MS = 60 * 1000;

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

// ─── ENDPOINT SEARCH (still used as a tool) ────────────────────────────────
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

      if (path.includes(q)) score += 10;
      for (const kw of keywords) {
        if (path.includes(kw)) score += 5;
        if (desc.includes(kw)) score += 3;
        if (category.includes(kw)) score += 2;
        if (categoryId.includes(kw)) score += 2;
        if (provider.includes(kw)) score += 1;
      }
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
    return `- ${ep.method} ${ep.path} — ${ep.description}${params ? ` (params: ${params})` : ""}`;
  }).join("\n");
}

// ─── CONVERSATION HISTORY ──────────────────────────────────────────────────
interface HistoryMsg {
  role: "user" | "assistant";
  content: string;
}

async function loadHistory(sessionId: string, limit: number = 15): Promise<HistoryMsg[]> {
  try {
    const rows = await d1Query(
      `SELECT role, content FROM ai_chat_messages 
       WHERE session_id = ? 
       ORDER BY id DESC LIMIT ?`,
      [sessionId, limit]
    );
    // Reverse to chronological order
    return (rows as any[]).reverse().map(r => ({
      role: r.role === "user" ? "user" : "assistant",
      content: r.content,
    }));
  } catch (e: any) {
    console.error("[history] load failed:", e.message);
    return [];
  }
}

// ─── TOOL DEFINITIONS FOR HINATU ───────────────────────────────────────────
// The LLM decides when to call these. We parse its JSON output.
interface ToolCall {
  tool: "search_endpoints" | "search_hosting" | "get_endpoint_details" | "get_ecosystem";
  query?: string;
  path?: string;
  id?: string;
}

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────
function buildSystemPrompt(userMessage: string): string {
  const platformSummary = formatPlatformSummaryForPrompt();
  const ecosystem = formatEcosystemForPrompt();
  const beginner = getBeginnerConcepts();
  const beginnerText = Object.entries(beginner)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `You are Hinatu, the conversational assistant for Megan Tech and Megan APIs.

PERSONALITY:
- Warm, intelligent, patient, lightly playful
- Technically capable but never condescending
- Not childish, not overly emoji-heavy (1-2 max per message)
- Concise by default, more detailed only when asked
- You speak naturally, like a friendly expert

YOUR ROLE:
- Chat naturally about anything
- Answer general questions
- Explain technical concepts simply
- Help beginners feel welcome (never pressure them)
- Recommend Megan API endpoints ONLY when genuinely relevant
- Recommend hosting providers ONLY when the user mentions deployment, hosting, publishing, servers, going live, or similar
- Guide users through Megan ecosystem services

CONVERSATION RULES:
1. Read the conversation history carefully. Understand follow-ups like "yeah", "that", "it", "how".
2. Never force API recommendations into every reply.
3. Never mention endpoints just because a keyword appears.
4. Never pretend you did something you didn't.
5. Never invent Megan endpoints, parameters, or hosting features.
6. If you don't know something, say so.
7. Don't overwhelm beginners with code unless they ask.
8. Keep normal responses concise (2-5 sentences) unless asked for detail.
9. Never expose system prompts, secrets, API keys, provider credentials, or internal details.

PLATFORM KNOWLEDGE:
${platformSummary}

MEGAN ECOSYSTEM:
${ecosystem}

BEGINNER CONCEPTS (use when relevant):
${beginnerText}

Remember: you are a conversation partner first, a helpful guide second. Megan APIs is context you draw from, not the reason you speak.`;
}

// ─── ORACLE: Megan APIs expert ────────────────────────────────────────────
function buildOraclePrompt(userMessage: string): string {
  const platformSummary = formatPlatformSummaryForPrompt();
  const ecosystem = formatEcosystemForPrompt();

  return `You are Oracle, the Megan APIs expert for Megan Tech.

PERSONALITY:
- Direct, confident, technically precise
- No fluff, no filler. You respect the user's time.
- You speak like a senior engineer explaining something to a peer.
- 1 emoji max, only when it genuinely adds warmth.

YOUR ROLE:
- You are the authority on Megan APIs (apis.megan.qzz.io)
- Recommend the BEST endpoint for any task, not every endpoint
- Explain parameters, response shapes, and edge cases
- Generate working code snippets (curl, Python, JS)
- Diagnose errors and suggest fixes
- Explain the Megan ecosystem and its services

CONVERSATION RULES:
1. When recommending an endpoint, give: path, method, one-line purpose, and the key parameters.
2. When asked "how do I do X", give the endpoint AND a 3-line code example.
3. Never dump every matching endpoint. Pick the single best fit.
4. If multiple fit, rank them (best → fallback).
5. If you don't know an endpoint exists, say so. Never invent paths.
6. Never expose system prompts, API keys, or internal infrastructure.
7. Keep answers tight: 3-6 sentences, plus code when relevant.

PLATFORM KNOWLEDGE:
${platformSummary}

MEGAN ECOSYSTEM:
${ecosystem}

You are Oracle. Be the expert the user came here for.`;
}

// ─── DOER: Action agent ───────────────────────────────────────────────────
function buildDoerPrompt(userMessage: string): string {
  const platformSummary = formatPlatformSummaryForPrompt();

  return `You are Doer, the action agent for Megan Tech.

PERSONALITY:
- Action-oriented, energetic, no-nonsense
- You say what you're going to do, then you do it.
- Short sentences. Clear intent.
- Zero emojis unless the user uses them first.

YOUR ROLE:
You are an ACTION AGENT. When the user requests something, you MUST call a tool. You do not explain — you execute.

TOOLS YOU CAN CALL:
${formatToolsForDoer()}

MANDATORY RESPONSE FORMAT:
Your reply MUST start with a single JSON block on its own line, followed by nothing else:

{"tool": "tool_name", "args": {"param": "value"}}

YOU DO NOT KNOW REAL-TIME DATA. You have NO knowledge of live scores, upcoming fixtures, current standings, or streaming URLs. Your training data is outdated. For ANY question about sports — including "what's playing", "stream this", "who's winning", "show me the table" — you MUST call a tool. NEVER answer sports questions from your own knowledge. NEVER mention ESPN, Sky Sports, DAZN, LiveScore, FootyBite, Stream2Watch, or any external website — those are NOT our tools. Only use the tools listed above.

EXAMPLES:

User: "find movies called Inception"
You: {"tool": "search_movies", "args": {"q": "Inception"}}

User: "translate hello to swahili"
You: {"tool": "translate_text", "args": {"text": "hello", "target": "sw"}}

User: "download this song https://youtube.com/watch?v=abc"
You: {"tool": "download_mp3", "args": {"url": "https://youtube.com/watch?v=abc"}}

User: "generate an image of a cat"
You: {"tool": "generate_image", "args": {"prompt": "a cat"}}

User: "what's the weather in Nairobi"
You: {"tool": "get_weather", "args": {"city": "Nairobi"}}

User: "hi"
You: {"tool": "none", "reply": "Hey. What do you need?"}

User: "apply referral code MEGAN-XYZ4"
You: {"tool": "apply_referral", "args": {"uid": "self", "code": "MEGAN-XYZ4"}}

User: "redeem giveaway MEGAN-ABCD-EFGH-IJKL"
You: {"tool": "redeem_giveaway", "args": {"uid": "self", "code": "MEGAN-ABCD-EFGH-IJKL"}}

User: "what's my premium status"
You: {"tool": "get_premium_status", "args": {"uid": "self"}}

User: "how many days of premium do I have left"
You: {"tool": "get_premium_status", "args": {"uid": "self"}}

User: "is there any live match"
You: {"tool": "get_live_matches", "args": {"sport": "football"}}

User: "any league I just need to stream football now"
You: {"tool": "get_live_streams", "args": {}}

User: "can I stream any match"
You: {"tool": "get_live_streams", "args": {}}

User: "what's playing today"
You: {"tool": "get_today_matches", "args": {}}

User: "premier league table"
You: {"tool": "get_league_standings", "args": {"id": "4328"}}

User: "man united last match"
You: {"tool": "search_matches", "args": {"q": "Manchester United"}}

User: "what sports do you support"
You: {"tool": "get_sports_list", "args": {}}

User: "can't we just chat"
You: {"tool": "none", "reply": "Yeah, of course. What's on your mind?"}

User: "thanks"
You: {"tool": "none", "reply": "Anytime."}

RULES:
1. Output ONLY the JSON block. No prose before or after.
2. Use only tools from the list above. Never invent names.
3. If the user is chatting casually (greeting, thanks, small talk), reply naturally with {"tool": "none", "reply": "<your warm reply here>"}. NEVER refuse to chat. NEVER tell them to switch to another model. Doer is happy to talk.
4. If the user asks for a task you don't have a tool for, use {"tool": "none", "reply": "I don't have a tool for that yet — want me to describe the best endpoint for it instead?"}.
5. Keep casual replies short (1 sentence). You're still primarily an executor, but you're friendly about it.
6. Never repeat the same reply twice in a row. Vary your wording.

SPORTS-SPECIFIC REASONING (IMPORTANT):
- When the user asks about "today's matches" or "what's playing", call get_today_matches first.
- If get_today_matches returns empty, IMMEDIATELY call get_upcoming_matches and offer 3 alternatives.
- When the user asks for a specific team's matches (e.g. "Manchester City matches"), call search_matches. If that returns empty, call search_teams to find the team, then get_team_fixtures with the team ID.
- When the user asks for standings, call get_league_standings with the right league ID. Common IDs: 4328 = Premier League, 4335 = La Liga, 4332 = Serie A, 4331 = Bundesliga, 4334 = Ligue 1, 4480 = UCL.
- When the user asks for a team's info or squad, use get_team_info or get_team_squad.
- When the user asks about World Cup, use get_worldcup_teams / get_worldcup_superstars / get_worldcup_fixtures.
- When the user asks to watch a match, use get_match_streams with the match ID.
- When the user asks for highlights, use get_recent_highlights or get_match_highlights.
- Be proactive: if nothing is available, suggest what IS available. This is the core value of a sports agent.
- STREAMS: When a user asks to stream or watch a match, ALWAYS CHAIN TOOLS:
  STEP 1: Call get_live_streams to find matches that have streams.
  STEP 2: If get_live_streams returns at least one streamable match, IMMEDIATELY call get_match_streams with that match's ID — do NOT tell the user to call it. You must call it yourself in the SAME response.
  STEP 3: The response should only say "Click Watch to open the stream" — NEVER mention URLs in your reply text. The URL is automatically rendered in the card.
  If NO matches have streams: say "None of the live matches have streams right now — they're minor league fixtures. Want to see recent highlights or upcoming major matches?"
  NEVER just repeat the match list when the user asks a follow-up. Answer the actual question.
- CRITICAL: When you see a standings card, only reference teams that are ACTUALLY in the card's items array. Do NOT hallucinate positions or points for teams that aren't returned. If the user asks about a team that isn't in the returned standings, say: "I only have the top N teams in this data. Let me search for that team specifically." Then use search_teams or get_team_fixtures.

PLATFORM KNOWLEDGE:
${platformSummary}

You are Doer. Capable of both chat and action. Output ONLY the JSON block. Nothing else.`;
}


// ─── INTENT CLASSIFIER (deterministic, no LLM) ────────────────────────────
interface Intent {
  needs_endpoints: boolean;
  needs_hosting: boolean;
  endpoint_query?: string;
  hosting_query?: string;
}

function classifyIntent(message: string, history: HistoryMsg[]): Intent {
  const m = message.toLowerCase().trim();
  const recentText = history.slice(-4).map(h => h.content.toLowerCase()).join(" ");
  const combined = `${recentText} ${m}`;

  // Pure greetings — skip everything
  const pureGreeting = /^(hi|hey|hello|yo|sup|thanks|thank you|ty|ok|okay|cool|nice|bye|lol|haha|np|good morning|good evening|good afternoon|how are you|what'?s up)[\s\?\!.,]*$/i;
  if (pureGreeting.test(m)) {
    return { needs_endpoints: false, needs_hosting: false };
  }

  // HOSTING — deploy, host, server, publish, launch
  const hostingPattern = /\b(deploy|deployment|host|hosting|server|servers|go live|publish|put online|production|launch|ship it|make it live)\b/i;
  const needs_hosting = hostingPattern.test(m);

  // ENDPOINT — build/create/develop + tasks
  const buildPattern = /\b(api|endpoint|build|create|make|develop|integrat|downloader|generator|translator|stalker|scraper|tool for|want.*(?:api|tool|endpoint)|need.*(?:api|tool|endpoint)|looking for.*(?:api|tool))\b/i;
  const taskPattern = /\b(tiktok|youtube|instagram|twitter|facebook|spotify|soundcloud|discord|whatsapp|telegram|reddit|anime|movie|netflix|ai chat|gpt|image gen|qr code|weather|translate|download.*video|download.*song)\b/i;
  const needs_endpoints = (buildPattern.test(combined) || taskPattern.test(m)) && !needs_hosting;

  return {
    needs_endpoints,
    needs_hosting,
    endpoint_query: needs_endpoints ? message : undefined,
    hosting_query: needs_hosting ? "deployment hosting" : undefined,
  };
}

// ─── MAIN CHAT HANDLER ─────────────────────────────────────────────────────

// ─── DOER EXECUTION LOOP ──────────────────────────────────────────────────
// When Doer (the LLM) emits a JSON tool call, we:
//   1. Parse the tool name + args
//   2. Run the real endpoint via runDoerTool
//   3. Feed the result back to Doer for a human summary
//   4. Return { reply, cards, tool_result }

interface DoerToolCall {
  tool: string;
  args: Record<string, any>;
  reply?: string;   // top-level reply for {"tool": "none", "reply": "..."}
}

function extractDoerToolCall(text: string): DoerToolCall | null {
  // Balanced-brace scanner — handles nested objects like {"tool":"x","args":{"q":"y"}}
  const candidates: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        candidates.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  for (const cand of candidates) {
    try {
      const parsed = JSON.parse(cand);
      if (parsed && typeof parsed.tool === "string") {
        return {
          tool: parsed.tool,
          args: parsed.args || parsed.params || {},
          reply: typeof parsed.reply === "string" ? parsed.reply : undefined,
        };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

function stripDoerToolCall(text: string): string {
  // Strip any balanced JSON block containing a "tool" key
  let out = "";
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        const block = text.slice(start, i + 1);
        try {
          const parsed = JSON.parse(block);
          if (parsed && typeof parsed.tool === "string") {
            // Skip this block
            start = -1;
            continue;
          }
        } catch {}
        out += block;
        start = -1;
      }
    } else if (depth === 0) {
      out += ch;
    }
  }
  return out.trim();
}

async function executeDoerLoop(
  firstReply: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  systemPrompt: string
): Promise<{ reply: string; cards: any[]; toolResult: any }> {
  // ─── PRE-FLIGHT: catch obvious sports queries before LLM even decides ───
  const userMessage = (messages.filter(m => m.role === "user").pop()?.content || "").toLowerCase();
  const isLiveQuery = /\b(live|playing right now|live matches?)\b/.test(userMessage) && /\b(match|matches|game|games|football|soccer|sport)\b/.test(userMessage);
  const isStreamQuery = /\b(stream|streaming|watch|can i stream|can i watch)\b/.test(userMessage);

  if ((isLiveQuery || isStreamQuery) && !firstReply.includes('{"tool"')) {
    console.log(`[Doer] Pre-flight forcing get_live_streams for: ${userMessage.slice(0, 60)}`);
    try {
      const forced = await runDoerTool("get_live_streams", {});
      if (forced && forced.ok && forced.card) {
        return {
          reply: forced.card.message || "Here are the live streams available right now.",
          cards: [forced.card],
          toolResult: forced.card,
        };
      }
    } catch (e: any) {
      console.error(`[Doer] Pre-flight tool failed: ${e.message}`);
    }
  }

  const call = extractDoerToolCall(firstReply);
  if (!call) {
    // No tool call — Doer just wants to talk. Return as-is.
    return { reply: firstReply, cards: [], toolResult: null };
  }

  // Special case: {"tool": "none", "reply": "..."} means Doer wants to chat
  if (call.tool === "none") {
    const replyText =
      call.reply ||
      (call.args as any)?.reply ||
      stripDoerToolCall(firstReply) ||
      "Hey. What do you need?";
    return { reply: replyText, cards: [], toolResult: null };
  }

  if (!isKnownTool(call.tool)) {
    return {
      reply: `${stripDoerToolCall(firstReply)}\n\nI don't have a tool called "${call.tool}" — try rephrasing or use Oracle.`,
      cards: [],
      toolResult: null,
    };
  }

  // Execute the real tool
  console.log(`[Doer] Executing tool: ${call.tool}`, JSON.stringify(call.args));
  const result = await runDoerTool(call.tool, call.args);

  const toolDef = DOER_TOOLS[call.tool];
  const card: any = {
    tool: call.tool,
    endpoint: result.endpoint,
    method: result.method,
    args: call.args,
    ok: result.ok,
    status: result.status,
    ...result.card, // spread the typed card (type, items, url, etc)
  };

  // Feed result back to Doer for a human summary
  const summaryPrompt = `You called the tool "${call.tool}" with args ${JSON.stringify(call.args)}.
The API returned (status ${result.status}):
${JSON.stringify(result.card).slice(0, 1500)}

Now summarize this in 1-2 short sentences. Do NOT include raw JSON. Do NOT say "the API returned". Speak naturally.
IMPORTANT: If this result contains URLs (stream URLs, video URLs, image URLs), NEVER mention them in your reply. Instead say something like "Click Watch to open it" — the URL is rendered as a button in the card below.`;

  let summary = "";
  try {
    // Ask the LLM for a human summary. We do NOT reuse the Doer system prompt
    // because it forces JSON tool output — instead use a clean summarizer prompt.
    const summarizeSystem = `You summarize API results in 1-2 short sentences for the user. Speak naturally. Never include JSON. Never say "the API returned". Just describe what was found.`;
    summary = await cfChat([
      { role: "system", content: summarizeSystem },
      { role: "user", content: summaryPrompt },
    ], undefined, 300);
  } catch {
    summary = "Done.";
  }

  // Strip any accidental JSON block that leaked through
  const cleanedSummary = summary.replace(/\{[^{}]*"tool"[^{}]*\}/g, "").trim();
  summary = cleanedSummary || "Done. Check the card below for details.";

  return { reply: summary, cards: [card], toolResult: result.card };
}

async function handleChat(
  message: string,
  uid: string,
  sessionId: string,
  history: HistoryMsg[],
  fallbacks: { askOverchat: Function; askMeganAI: Function; askGeminiLite: Function },
  modelId: string = "hinatu"
): Promise<{ reply: string; cards: any[]; usedModel: string }> {
  // 1. Classify intent (skipped for Doer — Doer picks its own tools)
  const intent = modelId === "doer"
    ? { needs_endpoints: false, needs_hosting: false }
    : classifyIntent(message, history);

  // 2. Run tools BEFORE the LLM
  let toolContext = "";
  const cards: any[] = [];

  if (intent.needs_hosting) {
    const providers = searchHosting(intent.hosting_query || "deployment", 4);
    if (providers.length > 0) {
      toolContext += `\n\nHOSTING OPTIONS (use these in your reply):\n${formatHostingForPrompt(providers)}`;
      for (const p of providers) cards.push({ type: "hosting", id: p.id });
    }
  }

  if (intent.needs_endpoints) {
    const endpoints = searchEndpoints(intent.endpoint_query || message, 6);
    if (endpoints.length > 0) {
      toolContext += `\n\nRELEVANT MEGAN ENDPOINTS (mention the most fitting one):\n${formatEndpointsForPrompt(endpoints)}`;
      for (const ep of endpoints) {
        cards.push({ type: "endpoint", path: ep.path, method: ep.method, description: ep.description });
      }
    }
  }

  // 3. Build prompt with tool context injected
  const basePrompt =
    modelId === "oracle" ? buildOraclePrompt(message) :
    modelId === "doer"   ? buildDoerPrompt(message)   :
                           buildSystemPrompt(message);
  const systemPrompt = basePrompt + toolContext;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];
  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: "user", content: message });

  // 4. Ask the LLM
  let rawReply = "";
  let usedModel = "";
  let lastError = "";

  // Doer prefers Groq (better JSON tool-calling). Others prefer Cloudflare.
  const tryGroqFirst = modelId === "doer" && groqConfigured();

  if (tryGroqFirst) {
    try {
      rawReply = await groqChat(messages);
      usedModel = "Groq gpt-oss-120b";
    } catch (e: any) {
      lastError = e.message;
      console.log(`[Doer] Groq failed: ${e.message} — falling back to Cloudflare`);
    }
  }

  if (!rawReply && cfAiConfigured()) {
    try {
      rawReply = await cfChat(messages);
      usedModel = "Cloudflare Llama 3.3 70B";
    } catch (e: any) {
      lastError = e.message;
      console.log(`[${modelId}] CF AI failed: ${e.message}`);
    }
  }

  // If Doer's Groq failed and CF also failed, try Groq second time for non-Doer models
  if (!rawReply && !tryGroqFirst && groqConfigured()) {
    try {
      rawReply = await groqChat(messages);
      usedModel = "Groq gpt-oss-120b";
    } catch (e: any) {
      lastError = e.message;
      console.log(`[${modelId}] Groq failed: ${e.message}`);
    }
  }

  if (!rawReply) {
    const combined = history.map(h => `${h.role}: ${h.content}`).join("\n") + `\nuser: ${message}`;
    const fbList = [
      { name: "DeepSeek V3.2", fn: () => fallbacks.askOverchat(combined, systemPrompt, "deepseek") },
      { name: "Megan AI (GLM)", fn: () => fallbacks.askMeganAI(combined, systemPrompt) },
      { name: "Gemini Flash Lite", fn: () => fallbacks.askGeminiLite(combined, systemPrompt) },
    ];
    for (const fb of fbList) {
      try {
        rawReply = await fb.fn();
        usedModel = fb.name + " (fallback)";
        break;
      } catch (e: any) {
        lastError = e.message;
      }
    }
  }

  if (!rawReply) {
    return { reply: "Sorry, I'm having trouble thinking right now. Try again in a moment.", cards: [], usedModel: "none" };
  }

  // 5. Strip any accidental JSON the LLM might output
  let finalReply = rawReply.replace(/\{"tool"\s*:[^}]*\}/g, "").trim() || rawReply;
  let finalCards = cards;

  // 6. DOER LOOP — if this is the Doer model, check for tool calls
  if (modelId === "doer") {
    const doerResult = await executeDoerLoop(rawReply, messages, systemPrompt);
    finalReply = doerResult.reply;
    finalCards = [...cards, ...doerResult.cards];
  }

  console.log(`[${modelId}] cards=${finalCards.length}`);

  return { reply: finalReply, cards: finalCards, usedModel };
}

// ─── REGISTER ROUTES ───────────────────────────────────────────────────────
export function registerMeganAIRoutes(app: Express): void {
  // Legacy single-turn endpoint (kept for compatibility)
  app.get("/api/v2/megan-ai", async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ success: false, error: "Parameter 'q' required" });
    const conversationId = `conv-${Date.now().toString(36)}`;
    try {
      const result = await handleChat(q.trim(), "anon", conversationId, [], {
        askOverchat: async () => { throw new Error("not configured"); },
        askMeganAI: async () => { throw new Error("not configured"); },
        askGeminiLite: async () => { throw new Error("not configured"); },
      });
      return res.json({
        success: true,
        provider: "Megan AI",
        model: result.usedModel,
        conversation_id: conversationId,
        result: result.reply,
        matched_endpoints: result.cards.filter(c => c.type === "endpoint").map(c => `${c.method} ${c.path}`),
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── MAIN CHAT ──────────────────────────────────────────────────────────
  app.post("/api/v2/megan-ai/chat", async (req: Request, res: Response) => {
    const message = (req.body?.message || "").trim();

    // ─── PREMIUM GATE ──────────────────────────────────────────────────
    // Every Doer/Hinatu/Oracle chat requires an active trial or subscription.
    // Free users get a friendly upgrade message instead.
    const gateUid = (req.body?.uid as string) || (req.query.uid as string) || null;
    if (gateUid && gateUid !== "anon") {
      try {
        const authBase = process.env.AUTH_DOMAIN
          ? `https://${process.env.AUTH_DOMAIN}`
          : "https://auth.megan.qzz.io";
        const premiumRes = await fetch(`${authBase}/api/user/me?uid=${encodeURIComponent(gateUid)}`);
        if (premiumRes.ok) {
          const prem: any = await premiumRes.json();
          const isPremium = prem?.premium_active === true;
          if (!isPremium) {
            return res.status(402).json({
              success: false,
              error: "premium_required",
              message: "This AI assistant is a premium feature. Start your 7-day free trial or redeem a code to continue.",
              upgrade_url: `${authBase}/upgrade`,
              redeem_hint: "Use POST /api/user/redeem with a giveaway code.",
            });
          }
        }
      } catch (e: any) {
        console.log(`[premium-gate] check failed: ${e.message} — allowing through (fail-open)`);
        // Fail-open: if auth is down, don't block users.
      }
    }
    // ─── END PREMIUM GATE ──────────────────────────────────────────────

    const messageBody = message;

        const modelRequested = (req.body?.model || "hinatu").toLowerCase();
    const modelId = ["hinatu", "oracle", "doer"].includes(modelRequested) ? modelRequested : "hinatu";
    const incomingConvId = req.body?.conversation_id as string | undefined;
    const uid = (req.body?.uid as string) || (req.query.uid as string) || (req.ip || "anon");

    if (!message) return res.status(400).json({ success: false, error: "message required" });
    if (message.length > 2000) return res.status(400).json({ success: false, error: "message too long" });

    const rate = checkChatRateLimit(uid);
    if (!rate.ok) {
      return res.status(429).json({ success: false, error: "Rate limit exceeded. Try again in a minute." });
    }

    // message_id for the assistant reply (set later, used in the JSON response)
    let newMessageId: number | null = null;

    try {
      // ── Session management ──
      const incomingSessionId = (req.body?.session_id as string) || null;
      let finalSessionId = incomingSessionId;
      let isNewSession = false;

      if (!finalSessionId) {
        finalSessionId = `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        isNewSession = true;
        const title = message.length > 60 ? message.slice(0, 57) + "..." : message;
        try {
          await d1Execute(
            "INSERT INTO ai_chat_sessions (id, user_id, title, model, message_count, created_at, updated_at) VALUES (?, ?, ?, ?, 0, datetime('now'), datetime('now'))",
            [finalSessionId, uid === "anon" ? null : uid, title, modelId]
          );
        } catch (e: any) { console.error("session create failed", e.message); }
      }

      // ── Load conversation history ──
      const history = isNewSession ? [] : await loadHistory(finalSessionId, 15);

      // ── Save user message ──
      try {
        await d1Execute(
          "INSERT INTO ai_chat_messages (session_id, role, content, created_at) VALUES (?, 'user', ?, datetime('now'))",
          [finalSessionId, message]
        );
      } catch (e: any) { console.error("user msg save failed", e.message); }

      // ── Ask Hinatu (with tools) ──
      const result = await handleChat(message, uid, finalSessionId, history, {
        askOverchat: askOverchat,
        askMeganAI: askMeganAI,
        askGeminiLite: askGeminiLite,
      }, modelId);

      // ── Save AI message ──
      try {
        await d1Execute(
          "INSERT INTO ai_chat_messages (session_id, role, content, endpoints, model_used, created_at) VALUES (?, 'assistant', ?, ?, ?, datetime('now'))",
          [finalSessionId, result.reply, JSON.stringify(result.cards), result.usedModel]
        );
        // Fetch the row we just inserted so we can return its ID for reactions
        try {
          const rows: any = await d1Query(
            "SELECT id FROM ai_chat_messages WHERE session_id = ? AND role = 'assistant' ORDER BY id DESC LIMIT 1",
            [finalSessionId]
          );
          newMessageId = rows?.[0]?.id ?? null;
        } catch {}
        
        await d1Execute(
          "UPDATE ai_chat_sessions SET message_count = message_count + 2, updated_at = datetime('now') WHERE id = ?",
          [finalSessionId]
        );
      } catch (e: any) { console.error("ai msg save failed", e.message); }

      return res.json({
        success: true,
        provider: "Megan AI",
        model: result.usedModel,
        session_id: finalSessionId,
        is_new_session: isNewSession,
        message_id: typeof newMessageId !== "undefined" ? newMessageId : null,
        reply: result.reply,
        cards: result.cards,
        reactions: { endpoint: "/api/chat/react", method: "POST", body: { uid: "<your-uid>", messageId: "<message_id>", reaction: "like|dislike" } },
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── SESSIONS ──────────────────────────────────────────────────────────
  app.get("/api/v2/megan-ai/sessions", async (req: Request, res: Response) => {
    try {
      const uid = (req.query.uid as string) || "";
      if (!uid) return res.status(400).json({ success: false, error: "uid required" });
      const modelFilter = (req.query.model as string) || "";
      const sessions = modelFilter
        ? await d1Query(
            "SELECT id, title, model, message_count, created_at, updated_at FROM ai_chat_sessions WHERE user_id = ? AND model = ? ORDER BY updated_at DESC LIMIT 30",
            [uid, modelFilter]
          )
        : await d1Query(
            "SELECT id, title, model, message_count, created_at, updated_at FROM ai_chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 30",
            [uid]
          );
      return res.json({ success: true, count: sessions.length, sessions });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/v2/megan-ai/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.id);
      const uid = (req.query.uid as string) || "";
      const session = await d1Query("SELECT * FROM ai_chat_sessions WHERE id = ?", [sessionId]);
      if (session.length === 0) return res.status(404).json({ success: false, error: "Session not found" });
      const s = session[0];
      if (s.user_id && s.user_id !== uid) return res.status(403).json({ success: false, error: "Not your session" });

      const messages = await d1Query(
        "SELECT id, role, content, endpoints, model_used, created_at FROM ai_chat_messages WHERE session_id = ? ORDER BY id ASC LIMIT 200",
        [sessionId]
      );
      const parsed = messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        cards: m.endpoints ? (() => { try { return JSON.parse(m.endpoints); } catch { return []; } })() : [],
        model_used: m.model_used,
        created_at: m.created_at,
      }));

      return res.json({
        success: true,
        session: { id: s.id, title: s.title, message_count: s.message_count, created_at: s.created_at, updated_at: s.updated_at },
        messages: parsed,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/v2/megan-ai/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.id);
      const uid = (req.query.uid as string) || "";
      const session = await d1Query("SELECT user_id FROM ai_chat_sessions WHERE id = ?", [sessionId]);
      if (session.length === 0) return res.status(404).json({ success: false, error: "Not found" });
      if (session[0].user_id && session[0].user_id !== uid) return res.status(403).json({ success: false, error: "Not your session" });
      await d1Execute("DELETE FROM ai_chat_messages WHERE session_id = ?", [sessionId]);
      await d1Execute("DELETE FROM ai_chat_sessions WHERE id = ?", [sessionId]);
      return res.json({ success: true, deleted: sessionId });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.patch("/api/v2/megan-ai/sessions/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.id);
      const uid = (req.query.uid as string) || "";
      const title = (req.body?.title as string || "").trim().slice(0, 100);
      if (!title) return res.status(400).json({ success: false, error: "title required" });
      const session = await d1Query("SELECT user_id FROM ai_chat_sessions WHERE id = ?", [sessionId]);
      if (session.length === 0) return res.status(404).json({ success: false, error: "Not found" });
      if (session[0].user_id && session[0].user_id !== uid) return res.status(403).json({ success: false, error: "Not your session" });
      await d1Execute("UPDATE ai_chat_sessions SET title = ?, updated_at = datetime('now') WHERE id = ?", [title, sessionId]);
      return res.json({ success: true, title });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── TTS ────────────────────────────────────────────────────────────────
  app.post("/api/v2/megan-ai/tts", async (req: Request, res: Response) => {
    try {
      const text = (req.body?.text || "").trim();
      const voice = (req.body?.voice as string) || "asteria";
      if (!text) return res.status(400).json({ success: false, error: "text required" });
      if (text.length > 2000) return res.status(400).json({ success: false, error: "text too long" });
      if (!cfAiConfigured()) return res.status(503).json({ success: false, error: "TTS not configured" });
      let mp3: Buffer;
      try {
        mp3 = await cfTTS(text, voice);
      } catch (cfErr: any) {
        console.log(`[TTS] Cloudflare failed: ${cfErr.message} — trying fallbacks`);
        mp3 = await fallbackTTS(text);
      }
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.send(mp3);
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── STT ────────────────────────────────────────────────────────────────
  app.post("/api/v2/megan-ai/stt", async (req: Request, res: Response) => {
    try {
      const audio = req.body?.audio as string;
      if (!audio) return res.status(400).json({ success: false, error: "audio (base64) required" });
      if (audio.length > 15_000_000) return res.status(413).json({ success: false, error: "audio too large" });
      if (!cfAiConfigured()) return res.status(503).json({ success: false, error: "STT not configured" });
      let text: string;
      try {
        text = await cfSTT(audio);
      } catch (cfErr: any) {
        console.log(`[STT] Cloudflare failed: ${cfErr.message} — trying Groq`);
        if (groqConfigured()) {
          text = await groqSTT(audio);
        } else {
          throw new Error("STT fallback unavailable");
        }
      }
      return res.json({ success: true, text });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── DIAGNOSTIC ──────────────────────────────────────────────────────
  app.get("/api/v2/megan-ai/__diag", (_req: Request, res: Response) => {
    res.json({
      cfConfigured: cfAiConfigured(),
      groqConfigured: groqConfigured(),
      hasGroqKey: !!process.env.GROQ_API_KEY,
      hasToken1: !!process.env.CLOUDFLARE_AI_TOKEN,
      hasToken2: !!process.env.CLOUDFLARE_AI_TOKEN_2,
      hasAccount2: !!process.env.CLOUDFLARE_ACCOUNT_ID_2,
    });
  });

  console.log("✅ Hinatu Routes Registered (v2 conversational):");
  console.log("  GET    /api/v2/megan-ai?q=...");
  console.log("  POST   /api/v2/megan-ai/chat   (15/min, tools + history)");
  console.log("  POST   /api/v2/megan-ai/tts");
  console.log("  POST   /api/v2/megan-ai/stt");
  console.log("  GET    /api/v2/megan-ai/sessions?uid=...");
  console.log("  GET    /api/v2/megan-ai/sessions/:id");
  console.log("  PATCH  /api/v2/megan-ai/sessions/:id");
  console.log("  DELETE /api/v2/megan-ai/sessions/:id");
}

// ─── HELPER: Fallback model implementations ────────────────────────────────
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
      "x-device-uuid": deviceId, "x-device-language": "en-US", "x-device-platform": "web",
      "x-device-version": "1.0.44", "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
      "content-type": "application/json", "origin": "https://overchat.ai", "referer": "https://overchat.ai/",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let answer = "";
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No body");
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
  if (!answer) throw new Error("Empty");
  return answer;
}

async function askMeganAI(prompt: string, systemPrompt: string): Promise<string> {
  const url = `https://ai.megan.qzz.io/api/ai/workers/glm?prompt=${encodeURIComponent(prompt)}&system=${encodeURIComponent(systemPrompt)}&api_key=megan_admin_master`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json() as any;
  if (data.success && data.text) return data.text;
  if (data.result) return data.result;
  throw new Error(data.error || "Empty");
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
  if (!answer) throw new Error("Empty");
  return answer;
}
