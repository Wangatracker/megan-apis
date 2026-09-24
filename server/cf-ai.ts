// ─── CLOUDFLARE WORKERS AI CLIENT ──────────────────────────────────────────
// Uses Cloudflare's REST API to run models:
//   - Text chat: llama-3.3-70b-instruct-fp8-fast
//   - TTS:       @cf/deepgram/aura-2-en
//   - STT:       @cf/openai/whisper-large-v3-turbo

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "2e8e0fc225cf7a576818c6d14f8be62c";
const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN || process.env.CLOUDFLARE_API_TOKEN || "";

const BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run`;

function headers() {
  return {
    "Authorization": `Bearer ${CF_AI_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export function cfAiConfigured(): boolean {
  return !!CF_AI_TOKEN;
}

// ─── TEXT CHAT ─────────────────────────────────────────────────────────────
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

  const res = await fetch(`${BASE}/${model}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature: 0.6,
    }),
    signal: AbortSignal.timeout(25000),
  });

  const data: any = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || `Cloudflare AI error ${res.status}`);
  }

  const reply = data.result?.response || data.result?.text || "";
  if (!reply) throw new Error("Empty response from Cloudflare AI");
  return reply.trim();
}

// ─── TEXT TO SPEECH ────────────────────────────────────────────────────────
// Returns MP3 bytes. Model: deepgram aura-2-en
export async function cfTTS(text: string, voice: string = "asteria"): Promise<Buffer> {
  if (!cfAiConfigured()) throw new Error("Cloudflare AI not configured");

  const res = await fetch(`${BASE}/@cf/deepgram/aura-2-en`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      text: text.slice(0, 2000), // cap length
      speaker: voice,
      encoding: "mp3",
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed: ${res.status} ${err.slice(0, 200)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── SPEECH TO TEXT ────────────────────────────────────────────────────────
// Takes base64 audio → returns transcript
export async function cfSTT(audioBase64: string): Promise<string> {
  if (!cfAiConfigured()) throw new Error("Cloudflare AI not configured");

  const res = await fetch(`${BASE}/@cf/openai/whisper-large-v3-turbo`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ audio: audioBase64 }),
    signal: AbortSignal.timeout(30000),
  });

  const data: any = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "STT failed");
  }

  return data.result?.text || "";
}
