// ─── CLOUDFLARE WORKERS AI CLIENT (Multi-Account Rotation) ────────────────

const ACCOUNTS: { accountId: string; token: string; label: string }[] = [];

if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_TOKEN) {
  ACCOUNTS.push({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    token: process.env.CLOUDFLARE_AI_TOKEN,
    label: "account-1",
  });
}
if (process.env.CLOUDFLARE_ACCOUNT_ID_2 && process.env.CLOUDFLARE_AI_TOKEN_2) {
  ACCOUNTS.push({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID_2,
    token: process.env.CLOUDFLARE_AI_TOKEN_2,
    label: "account-2",
  });
}

let currentIndex = 0;
// Track which accounts are exhausted (4006 = daily neurons used up)
const exhausted = new Set<number>();

function current() {
  if (ACCOUNTS.length === 0) throw new Error("No Cloudflare AI accounts configured");
  return ACCOUNTS[currentIndex];
}

function nextHealthyIndex(from: number): number {
  for (let i = 1; i <= ACCOUNTS.length; i++) {
    const idx = (from + i) % ACCOUNTS.length;
    if (!exhausted.has(idx)) return idx;
  }
  return from; // all exhausted
}

function rotate() {
  if (ACCOUNTS.length > 1) {
    currentIndex = nextHealthyIndex(currentIndex);
    console.log(`[CF-AI] Rotating to ${current().label}`);
  }
}

function baseUrl() {
  return `https://api.cloudflare.com/client/v4/accounts/${current().accountId}/ai/run`;
}

export function cfAiConfigured(): boolean {
  return ACCOUNTS.length > 0 && exhausted.size < ACCOUNTS.length;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// ─── RESPONSE PARSER ──────────────────────────────────────────────────────
// Cloudflare may return either { result: { response } } (old format)
// or { result: { choices: [{ message: { content } }] } } (new format).
function extractReply(data: any): string {
  const r = data?.result;
  if (!r) return "";
  // Old format
  if (typeof r.response === "string" && r.response.trim()) return r.response.trim();
  // New chat.completion format
  const content = r.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  // Whisper / other
  if (typeof r.text === "string") return r.text.trim();
  return "";
}

// ─── CHAT ─────────────────────────────────────────────────────────────────
export async function cfChat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  maxTokens: number = 800
): Promise<string> {
  if (ACCOUNTS.length === 0) throw new Error("Cloudflare AI not configured");

  let lastError = "";
  const tried = new Set<number>();

  for (let attempt = 0; attempt < ACCOUNTS.length; attempt++) {
    if (tried.has(currentIndex)) {
      currentIndex = nextHealthyIndex(currentIndex);
      if (tried.has(currentIndex)) break;
    }
    tried.add(currentIndex);

    try {
      const res = await fetch(`${baseUrl()}/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${current().token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, max_tokens: maxTokens, temperature: 0.6 }),
        signal: AbortSignal.timeout(25000),
      });

      const data: any = await res.json();

      // Daily neurons used up → mark exhausted, try next
      const errCode = data?.errors?.[0]?.code;
      if (errCode === 4006) {
        exhausted.add(currentIndex);
        console.log(`[CF-AI] ${current().label} exhausted (daily neurons)`);
        lastError = data.errors[0].message;
        rotate();
        continue;
      }

      if (!data.success && (res.status === 429 || res.status === 403)) {
        lastError = data.errors?.[0]?.message || `HTTP ${res.status}`;
        rotate();
        continue;
      }

      if (!data.success) {
        lastError = data.errors?.[0]?.message || `Cloudflare AI error ${res.status}`;
        // Don't rotate on model-level errors, just fail
        throw new Error(lastError);
      }

      const reply = extractReply(data);
      if (!reply) {
        lastError = "Empty response from Cloudflare AI";
        rotate();
        continue;
      }
      return reply;
    } catch (e: any) {
      lastError = e.message;
      rotate();
    }
  }
  throw new Error(`All Cloudflare AI accounts failed. Last: ${lastError}`);
}

// ─── TTS ──────────────────────────────────────────────────────────────────
export async function cfTTS(text: string, voice: string = "aura-2-en-asteria"): Promise<Buffer> {
  if (ACCOUNTS.length === 0) throw new Error("Cloudflare AI not configured");

  let lastError = "";
  const tried = new Set<number>();

  for (let attempt = 0; attempt < ACCOUNTS.length; attempt++) {
    if (tried.has(currentIndex)) {
      currentIndex = nextHealthyIndex(currentIndex);
      if (tried.has(currentIndex)) break;
    }
    tried.add(currentIndex);

    try {
      const res = await fetch(`${baseUrl()}/@cf/deepgram/aura-2-en`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${current().token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.slice(0, 2000), speaker: voice, encoding: "mp3" }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429 || res.status === 403) {
        lastError = `HTTP ${res.status}`;
        rotate();
        continue;
      }

      // If we get JSON, it's an error (4006 etc.)
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data: any = await res.json();
        const errCode = data?.errors?.[0]?.code;
        if (errCode === 4006) {
          exhausted.add(currentIndex);
          console.log(`[CF-AI] ${current().label} exhausted (TTS)`);
        }
        lastError = data?.errors?.[0]?.message || "TTS error";
        rotate();
        continue;
      }

      if (!res.ok) {
        lastError = `TTS failed: ${res.status}`;
        rotate();
        continue;
      }

      return Buffer.from(await res.arrayBuffer());
    } catch (e: any) {
      lastError = e.message;
      rotate();
    }
  }
  throw new Error(`TTS failed: ${lastError}`);
}

// ─── STT ──────────────────────────────────────────────────────────────────
export async function cfSTT(audioBase64: string): Promise<string> {
  if (ACCOUNTS.length === 0) throw new Error("Cloudflare AI not configured");

  let lastError = "";
  const tried = new Set<number>();

  for (let attempt = 0; attempt < ACCOUNTS.length; attempt++) {
    if (tried.has(currentIndex)) {
      currentIndex = nextHealthyIndex(currentIndex);
      if (tried.has(currentIndex)) break;
    }
    tried.add(currentIndex);

    try {
      const res = await fetch(`${baseUrl()}/@cf/openai/whisper-large-v3-turbo`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${current().token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio: audioBase64 }),
        signal: AbortSignal.timeout(30000),
      });

      const data: any = await res.json();
      const errCode = data?.errors?.[0]?.code;

      if (errCode === 4006) {
        exhausted.add(currentIndex);
        console.log(`[CF-AI] ${current().label} exhausted (STT)`);
        lastError = data.errors[0].message;
        rotate();
        continue;
      }

      if (!data.success) {
        lastError = data.errors?.[0]?.message || "STT failed";
        rotate();
        continue;
      }
      return data.result?.text || "";
    } catch (e: any) {
      lastError = e.message;
      rotate();
    }
  }
  throw new Error(`STT failed: ${lastError}`);
}
