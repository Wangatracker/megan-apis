import type { Express, Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";

// ============================================
// ALL WORKING AI IMAGE GENERATION ENDPOINTS
// ============================================

// 1. Pollinations - FLUX model (confirmed working)
function pollinationsFlux(prompt: string, width: number = 512, height: number = 512): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&nologo=true`;
}

// 2. Pollinations - SDXL model (confirmed working)
function pollinationsSDXL(prompt: string, width: number = 512, height: number = 512): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=sdxl&nologo=true`;
}

// 3. Pollinations - Turbo model (confirmed working)
function pollinationsTurbo(prompt: string, width: number = 512, height: number = 512): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=turbo&nologo=true`;
}

// 4. MagicStudio AI Art (confirmed working - returns actual image bytes)
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
// REGISTER ALL IMAGE ROUTES
// ============================================
export function registerAIImageRoutes(app: Express): void {

  // Pollinations FLUX (returns URL)
  app.get("/api/ai/image/flux", (req: Request, res: Response) => {
    const prompt = (req.query.prompt || req.query.q) as string;
    const width = parseInt(req.query.width as string) || 512;
    const height = parseInt(req.query.height as string) || 512;
    if (!prompt) return res.status(400).json({ success: false, error: "Parameter 'prompt' required" });
    
    const imageUrl = pollinationsFlux(prompt, width, height);
    return res.json({
      success: true,
      provider: "Pollinations.ai",
      model: "FLUX",
      image_url: imageUrl,
      prompt,
      width,
      height,
    });
  });

  // Pollinations SDXL (returns URL)
  app.get("/api/ai/image/sdxl", (req: Request, res: Response) => {
    const prompt = (req.query.prompt || req.query.q) as string;
    const width = parseInt(req.query.width as string) || 512;
    const height = parseInt(req.query.height as string) || 512;
    if (!prompt) return res.status(400).json({ success: false, error: "Parameter 'prompt' required" });
    
    const imageUrl = pollinationsSDXL(prompt, width, height);
    return res.json({
      success: true,
      provider: "Pollinations.ai",
      model: "SDXL",
      image_url: imageUrl,
      prompt,
      width,
      height,
    });
  });

  // Pollinations Turbo (returns URL)
  app.get("/api/ai/image/turbo", (req: Request, res: Response) => {
    const prompt = (req.query.prompt || req.query.q) as string;
    const width = parseInt(req.query.width as string) || 512;
    const height = parseInt(req.query.height as string) || 512;
    if (!prompt) return res.status(400).json({ success: false, error: "Parameter 'prompt' required" });
    
    const imageUrl = pollinationsTurbo(prompt, width, height);
    return res.json({
      success: true,
      provider: "Pollinations.ai",
      model: "Turbo",
      image_url: imageUrl,
      prompt,
      width,
      height,
    });
  });

  // MagicStudio AI Art (returns base64)
  app.get("/api/v1/ai/image/magicstudio", async (req: Request, res: Response) => {
    const prompt = (req.query.prompt || req.query.q) as string;
    if (!prompt) return res.status(400).json({ success: false, error: "Parameter 'prompt' required" });

    try {
      const imageBuffer = await magicStudioGenerate(prompt);
      
      // Return image directly with proper headers
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", imageBuffer.length.toString());
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Content-Disposition", `inline; filename="magicstudio-${Date.now()}.jpg"`);
      
      return res.send(imageBuffer);
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // MagicStudio POST
  app.post("/api/v1/ai/image/magicstudio", async (req: Request, res: Response) => {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ success: false, error: "Parameter 'prompt' required" });

    try {
      const imageBuffer = await magicStudioGenerate(prompt);
      
      // Return image directly with proper headers
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", imageBuffer.length.toString());
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Content-Disposition", `inline; filename="magicstudio-${Date.now()}.jpg"`);
      
      return res.send(imageBuffer);
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ AI Image Routes Registered:");
  console.log("  GET /api/ai/image/flux - FLUX (Pollinations)");
  console.log("  GET /api/ai/image/sdxl - SDXL (Pollinations)");
  console.log("  GET /api/ai/image/turbo - Turbo (Pollinations)");
  console.log("  GET /api/v1/ai/image/magicstudio - MagicStudio AI Art");
  console.log("  POST /v1/ai/image/magicstudio - MagicStudio AI Art (POST)");
}
