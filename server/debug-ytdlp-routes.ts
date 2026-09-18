import type { Express, Request, Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, statSync } from "fs";

const execAsync = promisify(exec);

export function registerDebugYtdlpRoutes(app: Express): void {
  app.get("/api/debug/ytdlp", async (req: Request, res: Response) => {
    const result: any = {
      binaryExists: existsSync("./yt-dlp"),
      pythonAvailable: false,
      version: null,
      testSearch: null,
      error: null,
    };

    try {
      if (result.binaryExists) {
        result.binarySize = statSync("./yt-dlp").size;
      }
    } catch {}

    // Check python
    try {
      const { stdout } = await execAsync("python3 --version 2>&1 || python --version 2>&1", { timeout: 5000 });
      result.pythonAvailable = true;
      result.pythonVersion = stdout.trim();
    } catch (e: any) {
      result.pythonError = e.message;
    }

    // Test yt-dlp version
    try {
      const { stdout } = await execAsync("./yt-dlp --version 2>&1", { timeout: 10000 });
      result.version = stdout.trim();
    } catch (e: any) {
      result.versionError = e.message;
    }

    // Test search WITHOUT 2>/dev/null so we see errors
    try {
      const { stdout, stderr } = await execAsync(
        `./yt-dlp --no-warnings --dump-json --no-playlist "https://www.youtube.com/watch?v=gyc0QAIRDDA" 2>&1`,
        { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
      );
      const firstLine = stdout.trim().split("\n")[0]?.substring(0, 200);
      result.testSearch = firstLine;
      result.testStderr = stderr?.substring(0, 500);
    } catch (e: any) {
      result.error = e.message;
      result.stdout = (e.stdout || "").substring(0, 500);
      result.stderr = (e.stderr || "").substring(0, 500);
    }

    res.json(result);
  });

  console.log("✅ Debug yt-dlp route registered: GET /api/debug/ytdlp");
}
