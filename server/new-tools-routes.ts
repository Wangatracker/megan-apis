import type { Express, Request, Response } from "express";
import { buildSuccessResponse, buildErrorResponse } from "./response-builder";
import axios from "axios";
import * as cheerio from "cheerio";

// ─── GOOGLE TRANSLATE ──────────────────────────────────────────────────────

async function translateText(text: string, source: string, target: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  return response.data?.[0]?.[0]?.[0] || "Translation not found.";
}

// ─── KODEPOS (Indonesian Postal Code) ──────────────────────────────────────

async function scrapeKodepos(form: string) {
  const response = await axios.post(
    "https://kodepos.posindonesia.co.id/CariKodepos",
    new URLSearchParams({ kodepos: form }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
      },
      timeout: 15000,
    }
  );
  const $ = cheerio.load(response.data);
  return $("tbody > tr").map((_, el) => {
    const $td = $(el).find("td");
    return {
      kodepos: $td.eq(1).text().trim(),
      desa: $td.eq(2).text().trim(),
      kecamatan: $td.eq(3).text().trim(),
      kota: $td.eq(4).text().trim(),
      provinsi: $td.eq(5).text().trim(),
    };
  }).get();
}

// ─── VCC GENERATOR ─────────────────────────────────────────────────────────

async function generateVcc(type: string, count: number) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    const response = await axios.post(
      "https://neapay.com/online-tools/credit-card-number-generator-validator.html",
      `bin=${type}&generate=`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
        },
        timeout: 15000,
      }
    );
    const $ = cheerio.load(response.data);
    const cardFront = $(".card-front");
    const cardBack = $(".card-back");
    cards.push({
      cardNumber: cardFront.find("pre").eq(0).text().trim().replace(/\s+/g, ""),
      expirationDate: cardFront.find("pre").eq(1).text().trim(),
      cardholderName: cardFront.find("pre").eq(2).text().trim(),
      cvv: cardBack.find("pre").eq(0).text().trim(),
    });
  }
  return cards;
}

// ─── NGL MESSAGE ───────────────────────────────────────────────────────────

async function submitNglAnswer(question: string, urlString: string) {
  const parsedUrl = new URL(urlString);
  const username = parsedUrl.pathname.split("/").filter(Boolean).pop();
  if (!username) throw new Error("Invalid URL: Unable to extract username.");
  
  const postData = new URLSearchParams({ username, question, deviceId: "", gameSlug: "", referrer: "" });
  const { data } = await axios.post("https://ngl.link/api/submit", postData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
      "Referer": urlString,
    },
    timeout: 15000,
  });
  return data;
}

// ─── REGISTER ROUTES ───────────────────────────────────────────────────────

export function registerNewToolRoutes(app: Express): void {
  // Translate
  app.get("/api/v2/tools/translate", async (req: Request, res: Response) => {
    const { text, source = "auto", target = "id" } = req.query || {};
    if (!text) return res.status(400).json({ status: false, error: "Parameter 'text' required" });
    try {
      const result = await translateText(String(text), String(source), String(target));
      return res.json(buildSuccessResponse(req, "Tools", "tools", { provider: "Google Translate", translatedText: result }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Kodepos
  app.get("/api/v2/tools/kodepos", async (req: Request, res: Response) => {
    const form = req.query.form as string;
    if (!form) return res.status(400).json({ status: false, error: "Parameter 'form' required" });
    try {
      const result = await scrapeKodepos(form.trim());
      if (!result.length) return res.status(404).json({ status: false, error: "No postal code found" });
      return res.json(buildSuccessResponse(req, "Tools", "tools", { provider: "Pos Indonesia", results: result }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // VCC Generator
  app.get("/api/v2/tools/vcc-generator", async (req: Request, res: Response) => {
    const type = req.query.type as string;
    const count = parseInt(req.query.count as string) || 1;
    const validTypes = ["Visa", "MasterCard", "Amex", "CUP", "JCB", "Diners", "RuPay"];
    if (!type || !validTypes.includes(type)) return res.status(400).json({ status: false, error: "Invalid card type", validTypes });
    if (count < 1 || count > 5) return res.status(400).json({ status: false, error: "Count must be 1-5" });
    try {
      const cards = await generateVcc(type, count);
      return res.json(buildSuccessResponse(req, "Tools", "tools", { provider: "NeaPay", count: cards.length, cards }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // NGL
  app.get("/api/v2/tools/ngl", async (req: Request, res: Response) => {
    const { link, text } = req.query || {};
    if (!link || !text) return res.status(400).json({ status: false, error: "Parameters 'link' and 'text' required" });
    try {
      const result = await submitNglAnswer(String(text), String(link));
      return res.json(buildSuccessResponse(req, "Tools", "tools", { provider: "NGL", result }));
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ New Tool Routes Registered:");
  console.log("  GET /api/v2/tools/translate?text=...&source=auto&target=id");
  console.log("  GET /api/v2/tools/kodepos?form=...");
  console.log("  GET /api/v2/tools/vcc-generator?type=Visa&count=1");
  console.log("  GET /api/v2/tools/ngl?link=...&text=...");
}
