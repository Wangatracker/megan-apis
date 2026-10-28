import type { Express, Request, Response } from "express";
import scrape from "website-scraper";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

export function registerWebToZipRoutes(app: Express): void {
  app.get("/api/tools/web-to-zip", async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, error: "Parameter 'url' is required" });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid URL format" });
    }

    const jobId = randomUUID();
    const tempDir = path.join(os.tmpdir(), `web2zip-${jobId}`);

    console.log(`[web2zip] ========== STARTING JOB ${jobId} ==========`);
    console.log(`[web2zip] URL: ${url}`);
    console.log(`[web2zip] Temp dir: ${tempDir}`);

    try {
      // Ensure temp dir exists
      fs.mkdirSync(tempDir, { recursive: true });

      // 1. Scrape the website
      console.log(`[web2zip] Scraping...`);
      const result = await scrape({
        urls: [url],
        directory: tempDir,
        recursive: false, // START SIMPLE - only the main page
        sources: [
          { selector: 'img', attr: 'src' },
          { selector: 'link[rel="stylesheet"]', attr: 'href' },
          { selector: 'script', attr: 'src' },
        ],
        requestConcurrency: 3,
        filenameGenerator: 'bySiteStructure',
      });

      console.log(`[web2zip] Scrape complete. Result:`, JSON.stringify(result).substring(0, 300));

      // 2. Check what was actually downloaded
      const files = fs.readdirSync(tempDir, { recursive: true }) as string[];
      console.log(`[web2zip] Files downloaded: ${files.length}`);
      files.slice(0, 20).forEach(f => console.log(`  - ${f}`));

      if (files.length === 0) {
        throw new Error("Scraper returned 0 files. The site may block bots.");
      }

      // 3. Zip the files
      console.log(`[web2zip] Creating ZIP archive...`);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="website-${jobId}.zip"`);

      const archive = archiver("zip", { zlib: { level: 6 } });

      archive.on("warning", (err) => console.warn(`[web2zip] Archive warning:`, err));
      archive.on("error", (err) => {
        console.error(`[web2zip] Archive ERROR:`, err);
        if (!res.headersSent) res.status(500).end();
      });
      archive.on("end", () => {
        console.log(`[web2zip] ✅ ZIP complete. ${archive.pointer()} bytes sent.`);
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      });

      archive.pipe(res);
      archive.directory(tempDir, false);
      await archive.finalize();

    } catch (err: any) {
      console.error(`[web2zip] ❌ ERROR:`, err);
      console.error(`[web2zip] Stack:`, err.stack);
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: "Failed to scrape website",
          details: err.message,
        });
      }
    }
  });

  console.log("✅ Web-to-ZIP Route Registered:");
  console.log("  GET /api/tools/web-to-zip?url=https://example.com");
}
