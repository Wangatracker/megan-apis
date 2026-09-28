// ─── CLOUDFLARE WORKERS AI CLIENT (Multi-Account Rotation) ────────────────
// Rotates between CLOUDFLARE_AI_TOKEN and CLOUDFLARE_AI_TOKEN_2.
// If one hits a limit (429/403), it switches automatically.

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "2e8e0fc225cf7a576818c6d14f8be62c";

const TOKENS = [
  process.env.CLOUDFLARE_AI_TOKEN,
  process.env.CLOUDFLARE_AI_TOKEN_2,
].filter(Boolean) as string[];

let currentTokenIndex = 0;

function getToken(): string {
  if (TOKENS.length === 0) throw new Error("No Cloudflare AI tokens configured");
  return TOKENS[currentTokenIndex];
}

function rotateToken() {
  if (TOKENS.length > 1) {
    currentTokenIndex = (currentTokenIndex + 1) % TOKENS.length;
    console.log(`[CF-AI] Rotating to token index ${currentTokenIndex}`);
  }
}

const BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run`;

export function cfAiConfigured(): boolean {
  return TOKENS.length > 0;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export async function cfChat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  maxTokens: number = 800
): Promise<string> {
  if (!cfAiConfigured()) throw new Error("Cloudflare AI not configured");
  const maxRetries = Math.max(TOKENS.length, 1);
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`${BASE}/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, max_tokens: maxTokens, temperature: 0.6 }),
        signal: AbortSignal.timeout(25000),
      });

      const data: any = await res.json();

      if (!data.success && (res.status === 429 || res.status === 403)) {
        lastError = data.errors?.[0]?.message || `HTTP ${res.status}`;
        rotateToken();
        continue;
      }

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || `Cloudflare AI error ${res.status}`);
      }

      const reply = data.result?.response || data.result?.text || "";
      if (!reply) throw new Error("Empty response from Cloudflare AI");
      return reply.trim();
    } catch (e: any) {
      lastError = e.message;
      if (attempt < maxRetries - 1) rotateToken();
    }
  }
  throw new Error(`All Cloudflare AI tokens failed. Last: ${lastError}`);
}

// ─── TTS ──────────────────────────────────────────────────────────────────
export async function cfTTS(text: string, voice: string = "aura-2-en-asteria"): Promise<Buffer> {
  if (!cfAiConfigured()) throw new Error("Cloudflare AI not configured");
  const maxRetries = Math.max(TOKENS.length, 1);
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`${BASE}/@cf/deepgram/aura-2-en`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.slice(0, 2000), speaker: voice, encoding: "mp3" }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429 || res.status === 403) {
        lastError = `HTTP ${res.status}`;
        rotateToken();
        continue;
      }
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`TTS failed: ${res.status} ${err.slice(0, 200)}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (e: any) {
      lastError = e.message;
      if (attempt < maxRetries - 1) rotateToken();
    }
  }
  throw new Error(`TTS failed: ${lastError}`);
}

// ─── STT ──────────────────────────────────────────────────────────────────
export async function cfSTT(audioBase64: string): Promise<string> {
  if (!cfAiConfigured()) throw new Error("Cloudflare AI not configured");
  const maxRetries = Math.max(TOKENS.length, 1);
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`${BASE}/@cf/openai/whisper-large-v3-turbo`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio: audioBase64 }),
        signal: AbortSignal.timeout(30000),
      });
      const data: any = await res.json();
      if (!data.success && (res.status === 429 || res.status === 403)) {
        lastError = `HTTP ${res.status}`;
        rotateToken();
        continue;
      }
      if (!data.success) throw new Error(data.errors?.[0]?.message || "STT failed");
      return data.result?.text || "";
    } catch (e: any) {
      lastError = e.message;
      if (attempt < maxRetries - 1) rotateToken();
    }
  }
  throw new Error(`STT failed: ${lastError}`);
}
