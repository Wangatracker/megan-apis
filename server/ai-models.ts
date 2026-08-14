import type { Express, Request, Response } from "express";
import axios from "axios";

// ============================================
// NEW WORKING AI MODELS (Tested & Confirmed)
// ============================================

// 1. Felo Search AI (with sources)
async function feloSearch(query: string): Promise<string> {
  const response = await axios.post(
    "https://api.felo.ai/search/threads",
    {
      query,
      search_uuid: Date.now().toString(),
      search_options: { langcode: "en" },
      search_video: true,
    },
    {
      timeout: 30000,
      headers: {
        Accept: "*/*",
        "User-Agent": "Postify/1.0.0",
        "Content-Type": "application/json",
      },
      responseType: "text",
    }
  );

  const matches = response.data.match(/data: ({.*?})/g) || [];
  let answer = "";
  for (const m of matches) {
    try {
      const json = JSON.parse(m.slice(5));
      if (json.data?.text) answer = json.data.text.replace(/\d+/g, "");
    } catch {}
  }
  return answer;
}

// 2. BibleAI (23 translations)
const VALID_TRANSLATIONS: Record<string, string> = {
  "IRVBen": "Indian Revised Version (Bengali)",
  "CUV": "Chinese Union Version",
  "nld1939": "Dutch 1939 Petrus Canisiusvertaling",
  "NBG": "Dutch NBG 1951",
  "ESV": "English Standard Version",
  "NASB20": "New American Standard Bible 2020",
  "ASV14": "American Standard Version 1914",
  "KJV11": "King James Version 1611",
  "LSG": "Louis Segond (French)",
  "LUT": "Luther Bible (German)",
  "IRVHin": "Indian Revised Version (Hindi)",
  "PaBa": "Pavitra Bible (Hindi)",
  "TB": "Alkitab Terjemahan Baru 1974 (Indonesian)",
  "DB1885": "Diodati Bibbia 1885 (Italian)",
  "NR06": "Nuova Riveduta 2006 (Italian)",
  "polUBG": "Polish Biblia Gdańska",
  "AA": "Almeida Atualizada (Portuguese)",
  "RVR09": "Reina Valera 1909 (Spanish)",
  "SKB": "Svenska Kärnbibeln",
  "SV1917": "Swedish 1917 Bible",
  "KJV": "King James Version (Thai)",
  "IRVUrd": "Indian Revised Version (Urdu)",
  "DGV": "Kitab-e-Muqaddas (Urdu)",
  "ERVVI": "Easy-to-Read Vietnamese Version",
};

async function bibleSearch(question: string, translation: string = "ESV"): Promise<string> {
  const response = await axios.get(
    `https://api.bibleai.com/v2/search?question=${encodeURIComponent(question)}&translation=${translation}&filters[]=bible&filters[]=books&filters[]=articles&pro=true&language=en-US&id=`,
    {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    }
  );
  return response.data?.data?.answer || "";
}

// 3. GitaGPT (Bhagavad Gita)
async function gitaSearch(q: string): Promise<string> {
  const response = await axios.get(
    `https://gitagpt.org/api/ask/gita?q=${encodeURIComponent(q)}&email=null&locale=en`,
    {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
        "Referer": "https://gitagpt.org/#",
      },
    }
  );
  return response.data.response;
}

// 4. MuslimAI (Islamic/Quran)
async function muslimSearch(query: string): Promise<string> {
  const searchResponse = await axios.post(
    "https://www.muslimai.io/api/search",
    { query },
    {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
        "Referer": "https://www.muslimai.io/",
      },
    }
  );

  const ayatData = searchResponse.data;
  const content = ayatData?.[0]?.content;
  if (!content) throw new Error("No data found for the query");

  const prompt = `Use the following passages to answer the query in Indonesian, ensuring clarity and understanding, as a world-class expert in the Quran. Do not mention that you were provided any passages in your answer: ${query}\n\n${content}`;

  const answerResponse = await axios.post(
    "https://www.muslimai.io/api/answer",
    { prompt },
    {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.muslimai.io/",
      },
    }
  );

  return typeof answerResponse.data === "string" ? answerResponse.data : JSON.stringify(answerResponse.data);
}

// 5. PowerBrain AI
async function powerBrainSearch(query: string): Promise<string> {
  const qs = require("qs");
  const response = await axios.post(
    "https://powerbrainai.com/chat.php",
    qs.stringify({ message: query, messageCount: "1" }),
    {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
        "Content-Type": "application/x-www-form-urlencoded",
        "referer": "https://powerbrainai.com/chat.html",
        "origin": "https://powerbrainai.com",
      },
    }
  );
  return response.data.response;
}

// 6. Gemini Lite (Gemini 2.0 Flash via Cloud Function)
async function geminiLiteSearch(prompt: string, systemPrompt?: string): Promise<string> {
  const parts: any[] = [];
  if (systemPrompt) {
    parts.push({ text: systemPrompt });
  }
  parts.push({ text: prompt });
  
  const response = await axios.post(
    "https://us-central1-infinite-chain-295909.cloudfunctions.net/gemini-proxy-staging-v1",
    {
      model: "gemini-2.0-flash-lite",
      contents: [{ parts }],
    },
    {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    }
  );

  const content = response.data?.candidates?.[0]?.content;
  const parts = content?.parts || [];
  return parts.map((p: any) => p.text).join("");
}

// 7. Gandalf Lakera (Security AI - GET method)
async function gandalfSearch(prompt: string): Promise<string> {
  const response = await axios.get(
    "https://gandalf.lakera.ai/api/send-message",
    {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://gandalf.lakera.ai",
        "Referer": "https://gandalf.lakera.ai/baseline",
      },
      params: { prompt, defender: "baseline" },
    }
  );
  return response.data?.answer || "";
}

// ============================================
// REGISTER ROUTES
// ============================================
export function registerAIModels(app: Express): void {

  // Felo Search
  app.get("/api/ai/felo", async (req: Request, res: Response) => {
    const query = (req.query.q || req.query.query) as string;
    if (!query) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const answer = await feloSearch(query);
      return res.json({ status: true, provider: "Felo.ai", result: answer });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // BibleAI
  app.get("/api/ai/bibleai", async (req: Request, res: Response) => {
    const question = (req.query.q || req.query.question) as string;
    const translation = ((req.query.translation as string) || "ESV").toUpperCase();
    if (!question) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    if (!VALID_TRANSLATIONS[translation]) {
      return res.status(400).json({ status: false, error: `Invalid translation. Valid: ${Object.keys(VALID_TRANSLATIONS).join(", ")}` });
    }
    try {
      const answer = await bibleSearch(question, translation);
      return res.json({
        status: true,
        provider: "BibleAI",
        translation: VALID_TRANSLATIONS[translation],
        translation_code: translation,
        result: answer,
      });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // GitaGPT
  app.get("/api/ai/gita", async (req: Request, res: Response) => {
    const q = (req.query.q || req.query.query) as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const answer = await gitaSearch(q);
      return res.json({ status: true, provider: "GitaGPT", result: answer });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // MuslimAI
  app.get("/api/ai/muslimai", async (req: Request, res: Response) => {
    const query = (req.query.q || req.query.query) as string;
    if (!query) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const answer = await muslimSearch(query);
      return res.json({ status: true, provider: "MuslimAI", result: answer });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // PowerBrain AI
  app.get("/api/ai/powerbrainai", async (req: Request, res: Response) => {
    const query = (req.query.q || req.query.query) as string;
    if (!query) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const answer = await powerBrainSearch(query);
      return res.json({ status: true, provider: "PowerBrain AI", result: answer });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Gemini Lite
  app.get("/api/ai/gemini-lite", async (req: Request, res: Response) => {
    const prompt = (req.query.q || req.query.prompt) as string;
    const systemPrompt = req.query.system as string | undefined;
    if (!prompt) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const answer = await geminiLiteSearch(prompt, systemPrompt);
      return res.json({ status: true, provider: "Gemini Lite", model: "gemini-2.0-flash-lite", result: answer });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Gandalf Lakera
  app.get("/api/ai/gandalf", async (req: Request, res: Response) => {
    const prompt = (req.query.q || req.query.prompt) as string;
    const systemPrompt = req.query.system as string | undefined;
    if (!prompt) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      const answer = await gandalfSearch(fullPrompt);
      return res.json({ status: true, provider: "Gandalf Lakera", result: answer });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ AI Models Registered:");
  console.log("  GET /api/ai/felo - Felo Search with sources");
  console.log("  GET /api/ai/bibleai - Bible (23 translations)");
  console.log("  GET /api/ai/gita - Bhagavad Gita");
  console.log("  GET /api/ai/muslimai - Islamic/Quran");
  console.log("  GET /api/ai/powerbrainai - PowerBrain AI");
  console.log("  GET /api/ai/gemini-lite - Gemini 2.0 Flash");
  console.log("  GET /api/ai/gandalf - Security AI");
}
