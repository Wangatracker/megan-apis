import type { Express, Request, Response } from "express";
// archiver is imported dynamically to avoid CJS interop issues
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

// Download a URL using system curl (bypasses Node's broken fetch/undici)
async function curlDownload(url: string, maxBytes = 10 * 1024 * 1024): Promise<Buffer> {
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  
  // --max-time 20 = timeout
  // -L = follow redirects
  // -s = silent
  // -k = allow self-signed (some sites need it)
  // --max-filesize = cap total size
  const { stdout } = await execFileAsync(
    "curl",
    [
      "-s", "-L", "-k",
      "--max-time", "20",
      "--max-filesize", String(maxBytes),
      "-H", `User-Agent: ${UA}`,
      "-H", "Accept: */*",
      url,
    ],
    {
      encoding: "buffer",
      maxBuffer: maxBytes + 1024,
    }
  );
  
  if (!stdout || stdout.length === 0) {
    throw new Error(`curl returned empty body for ${url}`);
  }
  return Buffer.from(stdout);
}

export function registerWebToZipRoutes(app: Express): void {
  app.get("/api/tools/web-to-zip", async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, error: "Parameter 'url' is required" });
    }

    let parsed: URL;
    try { parsed = new URL(url); } catch {
      return res.status(400).json({ success: false, error: "Invalid URL format" });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ success: false, error: "Only http and https URLs are allowed" });
    }

    const jobId = randomUUID();
    console.log(`[web2zip] ========== STARTING JOB ${jobId} ==========`);
    console.log(`[web2zip] URL: ${url}`);

    try {
      // 1. Download main HTML with curl
      console.log(`[web2zip] Fetching main HTML with curl...`);
      const htmlBuf = await curlDownload(parsed.href, 5 * 1024 * 1024);
      let html = htmlBuf.toString("utf-8");
      console.log(`[web2zip] Main HTML: ${html.length} bytes`);

      if (html.length < 50) {
        throw new Error(`HTML too small (${html.length} bytes). Site may block bots.`);
      }

      // 2. Find assets in the HTML
      const assetUrls = new Set<string>();
      const patterns = [
        /<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi,
        /<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi,
        /<img[^>]+src=["']([^"']+\.(?:png|jpg|jpeg|gif|webp|svg|ico)[^"']*)["']/gi,
      ];
      for (const pattern of patterns) {
        let m;
        while ((m = pattern.exec(html)) !== null) {
          try {
            const abs = new URL(m[1], parsed.href).href;
            if (new URL(abs).origin === parsed.origin) assetUrls.add(abs);
          } catch {}
        }
      }
      const assetList = Array.from(assetUrls).slice(0, 30);
      console.log(`[web2zip] Found ${assetList.length} assets`);

      // 3. Download each asset sequentially (curl handles 1 at a time reliably)
      const assets: { url: string; data: Buffer }[] = [];
      for (const assetUrl of assetList) {
        try {
          const buf = await curlDownload(assetUrl, 3 * 1024 * 1024);
          assets.push({ url: assetUrl, data: buf });
          console.log(`[web2zip] ✅ ${assetUrl} (${buf.length} bytes)`);
        } catch (e: any) {
          console.log(`[web2zip] ⚠️ Skipped: ${assetUrl} -> ${e.message}`);
        }
      }
      console.log(`[web2zip] Downloaded ${assets.length}/${assetList.length} assets`);

      // 4. Build ZIP in memory FIRST (so errors return proper JSON, not empty 200)
      console.log(`[web2zip] Building ZIP in memory...`);
      
      // archiver@8 exposes ZipArchive as a named export
      const archiverModule: any = await import("archiver");
      const { ZipArchive } = archiverModule;
      if (typeof ZipArchive !== "function") {
        throw new Error(`ZipArchive is not a function. Keys: ${Object.keys(archiverModule).join(", ")}`);
      }
      
      const chunks: Buffer[] = [];
      const archive = new ZipArchive({ zlib: { level: 6 } });

      archive.on("data", (chunk) => chunks.push(chunk));
      
      const archiveDone = new Promise<void>((resolve, reject) => {
        archive.on("end", () => resolve());
        archive.on("error", reject);
      });

      // Add main HTML
      archive.append(html, { name: "index.html" });

      // Add assets
      for (const asset of assets) {
        const relPath = new URL(asset.url).pathname.split("/").filter(Boolean).join("_") || "file";
        archive.append(asset.data, { name: `assets/${relPath}` });
      }

      await archive.finalize();
      await archiveDone;

      const zipBuffer = Buffer.concat(chunks);
      console.log(`[web2zip] ✅ ZIP built: ${zipBuffer.length} bytes (${assets.length + 1} files)`);

      if (zipBuffer.length < 22) {
        throw new Error(`ZIP too small: ${zipBuffer.length} bytes`);
      }

      // 5. Send the ZIP (now that we KNOW it's valid)
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="website-${jobId}.zip"`);
      res.setHeader("Content-Length", zipBuffer.length.toString());
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(zipBuffer);
      console.log(`[web2zip] ✅ Response sent: ${zipBuffer.length} bytes`);

    } catch (err: any) {
      console.error(`[web2zip] ❌ ERROR:`, err.message || err);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: "Failed to scrape website",
          details: err.message || String(err),
        });
      }
    }
  });

  console.log("✅ Web-to-ZIP Route Registered:");
  console.log("  GET /api/tools/web-to-zip?url=https://example.com");
}
