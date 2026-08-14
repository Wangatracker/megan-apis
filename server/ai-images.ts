import type { Express, Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";

// ============================================
// ADDITIONAL AI IMAGE GENERATION (Tested Working)
// ============================================

// MagicStudio AI Art Generator
async function magicStudioGenerate(prompt: string): Promise<Buffer> {
  const generateClientId = (): string => {
    return crypto.randomBytes(32).toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  const form = new FormData();
  form.append("prompt", prompt);
  form.append("output_format", "bytes");
  form.append("user_profile_id", "null");
  form.append("anonymous_user_id", crypto.randomUUID());
  form.append("request_timestamp", (Date.now() / 1000).toFixed(3));
  form.append("user_is_subscribed", "false");
  form.append("client_id", generateClientId());

  const response = await axios.post(
    "https://ai-api.magicstudio.com/api/ai-art-generator",
    form,
    {
      timeout: 30000,
      headers: {
        ...form.getHeaders(),
        "accept": "application/json, text/plain, */*",
        "origin": "https://magicstudio.com",
        "referer": "https://magicstudio.com/ai-art-generator/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      },
      responseType: "arraybuffer",
    }
  );

  return Buffer.from(response.data);
}

// ============================================
// REGISTER ROUTES
// ============================================
export function registerAIImages(app: Express): void {

  // MagicStudio AI Art (v1 to avoid duplicates with existing /api/ai/image/*)
  app.get("/v1/ai/image/magicstudio", async (req: Request, res: Response) => {
    const prompt = (req.query.prompt || req.query.q) as string;
    if (!prompt) return res.status(400).json({ success: false, error: "Parameter 'prompt' required" });

    try {
      const imageBuffer = await magicStudioGenerate(prompt);
      return res.json({
        success: true,
        provider: "MagicStudio",
        model: "AI Art Generator",
        prompt,
        image_url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
        image_size: imageBuffer.length,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // POST version
  app.post("/v1/ai/image/magicstudio", async (req: Request, res: Response) => {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ success: false, error: "Parameter 'prompt' required" });

    try {
      const imageBuffer = await magicStudioGenerate(prompt);
      return res.json({
        success: true,
        provider: "MagicStudio",
        model: "AI Art Generator",
        prompt,
        image_url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
        image_size: imageBuffer.length,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ AI Image Routes Registered:");
  console.log("  GET /v1/ai/image/magicstudio - MagicStudio AI Art");
  console.log("  POST /v1/ai/image/magicstudio - MagicStudio AI Art (POST)");
}
