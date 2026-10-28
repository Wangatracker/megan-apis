import type { Express, Request, Response } from "express";
import scrape from "website-scraper";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "crypto"; // or use randomUUID

export function registerWebToZipRoutes(app: Express): void {
  app.get("/api/tools/web-to-zip", async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, error: "Parameter 'url' is required" });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid URL format" });
    }

    // Create a unique temp folder for this download
    const jobId = (Date.now() + Math.random()).toString(36);
    const tempDir = path.join(os.tmpdir(), `web2zip-${jobId}`);

    try {
      console.log(`[web2zip] Starting scrape of ${url} into ${tempDir}`);

      // 1. Scrape the website
      await scrape({
        urls: [url],
        directory: tempDir,
        recursive: true,
        maxRecursiveDepth: 1, // Only follow 1 level deep to prevent huge downloads
        maxDepth: 2,
        sources: [
          { selector: 'img', attr: 'src' },
          { selector: 'link[rel="stylesheet"]', attr: 'href' },
          { selector: 'script', attr: 'src' },
        ],
        requestConcurrency: 5, // Safe for Render
        filenameGenerator: 'bySiteStructure',
        urlFilter: (url: string) => {
          // Prevent downloading external sites
          return url.startsWith(new URL(url).origin);
        },
      });

      // 2. Zip the downloaded files
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="website-${jobId}.zip"`);

      const archive = archiver("zip", { zlib: { level: 6 } });

      archive.on("error", (err) => {
        console.error("[web2zip] Archive error:", err);
        if (!res.headersSent) res.status(500).end();
      });

      archive.on("end", () => {
        console.log(`[web2zip] Finished zipping ${url}.`);
        // Cleanup temp folder
        fs.rmSync(tempDir, { recursive: true, force: true });
      });

      archive.pipe(res);
      archive.directory(tempDir, false);
      await archive.finalize();
    } catch (err: any) {
      console.error("[web2zip] Error:", err.message);
      // Cleanup
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
