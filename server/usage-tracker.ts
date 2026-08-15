import type { Request, Response, NextFunction } from "express";
import { d1Execute } from "./d1-client";

// ─── USAGE TRACKING MIDDLEWARE ─────────────────────────────────────────────
// Logs every API request to D1 for analytics

export function usageTracker(req: Request, res: Response, next: NextFunction): void {
  // Only track API endpoints
  if (!req.path.startsWith("/api") && !req.path.startsWith("/download") && !req.path.startsWith("/stream") && !req.path.startsWith("/proxy") && !req.path.startsWith("/files")) {
    return next();
  }
  
  const startTime = Date.now();
  (req as any)._startTime = startTime;
  
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    const endpoint = req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    const apiKey = (req.query.api_key as string) || (req.headers["x-api-key"] as string) || "anonymous";
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    
    // Fire and forget - don't block response
    d1Execute(
      "INSERT INTO api_usage (endpoint, method, status_code, api_key, requested_ip, response_time_ms) VALUES (?, ?, ?, ?, ?, ?)",
      [endpoint, method, statusCode, apiKey, ip, responseTime]
    ).catch(() => {
      // Silently fail if D1 is unavailable
    });
  });
  
  next();
}
