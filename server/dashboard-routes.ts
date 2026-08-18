import type { Express, Request, Response } from "express";
import { d1Query, d1Execute } from "./d1-client";

// ─── DASHBOARD API ─────────────────────────────────────────────────────────
// Combines Megan Auth (identity) + Megan APIs (keys, usage, analytics)

const AUTH_URL = "https://auth.megan.qzz.io";

async function getAuthUser(req: Request) {
  const uid = req.query.uid as string || req.headers["x-uid"] as string;
  if (!uid) return null;
  
  try {
    const res = await fetch(`${AUTH_URL}/auth/profile/me?uid=${uid}`);
    const data = await res.json() as any;
    return data?.user || data?.result?.user || null;
  } catch {
    return null;
  }
}

export function registerDashboardRoutes(app: Express): void {
  // GET /api/dashboard/overview - Combined overview
  app.get("/api/dashboard/overview", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });
    
    try {
      // Get Auth user
      const authUser = await getAuthUser(req);
      
      // Get API keys
      const keys = await d1Query(
        "SELECT key, name, rate_limit, active, created_at, last_used_at, expires_at, environment FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
        [uid]
      );
      
      // Get usage stats
      const totalRequests = await d1Query(
        "SELECT COUNT(*) as count FROM api_usage WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?)",
        [uid]
      );
      
      const successRequests = await d1Query(
        "SELECT COUNT(*) as count FROM api_usage WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?) AND status_code < 400",
        [uid]
      );
      
      const errorRequests = await d1Query(
        "SELECT COUNT(*) as count FROM api_usage WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?) AND status_code >= 400",
        [uid]
      );
      
      const avgResponseTime = await d1Query(
        "SELECT AVG(response_time_ms) as avg_ms FROM api_usage WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?)",
        [uid]
      );
      
      // Recent activity
      const recentActivity = await d1Query(
        "SELECT endpoint, method, status_code, response_time_ms, created_at FROM api_usage WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?) ORDER BY created_at DESC LIMIT 10",
        [uid]
      );
      
      // Top endpoints
      const topEndpoints = await d1Query(
        "SELECT endpoint, COUNT(*) as count, AVG(response_time_ms) as avg_ms FROM api_usage WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?) GROUP BY endpoint ORDER BY count DESC LIMIT 5",
        [uid]
      );
      
      return res.json({
        success: true,
        user: authUser || { uid },
        keys: {
          total: keys.length,
          active: keys.filter((k: any) => k.active).length,
          list: keys,
        },
        usage: {
          total_requests: totalRequests[0]?.count || 0,
          success_requests: successRequests[0]?.count || 0,
          error_requests: errorRequests[0]?.count || 0,
          success_rate: totalRequests[0]?.count > 0
            ? Math.round((successRequests[0]?.count / totalRequests[0]?.count) * 1000) / 10
            : 100,
          avg_response_ms: Math.round(avgResponseTime[0]?.avg_ms || 0),
        },
        recent_activity: recentActivity,
        top_endpoints: topEndpoints,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // GET /api/dashboard/keys - List user's API keys
  app.get("/api/dashboard/keys", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });
    
    try {
      const keys = await d1Query(
        `SELECT k.key, k.name, k.rate_limit, k.active, k.created_at, k.last_used_at, k.expires_at, k.environment,
                (SELECT COUNT(*) FROM api_usage u WHERE u.api_key = k.key) as total_requests,
                (SELECT COUNT(*) FROM usage us WHERE us.api_key = k.key AND us.date = date('now')) as today_requests
         FROM api_keys k WHERE k.user_id = ? ORDER BY k.created_at DESC`,
        [uid]
      );
      
      return res.json({ success: true, keys });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // POST /api/dashboard/keys/generate - Create new key for user
  app.post("/api/dashboard/keys/generate", async (req: Request, res: Response) => {
    const { uid, name, rate_limit = 50, environment = "production" } = req.body || {};
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });
    
    try {
      const crypto = require("crypto");
      const apiKey = `megan_${crypto.randomBytes(16).toString("hex")}`;
      
      await d1Execute(
        "INSERT INTO api_keys (key, user_id, name, rate_limit, active, created_by, created_at, environment) VALUES (?, ?, ?, ?, 1, ?, ?, ?)",
        [apiKey, uid, name || "Default Key", rate_limit, uid, Date.now(), environment]
      );
      
      return res.json({ success: true, key: { key: apiKey, name: name || "Default Key", rate_limit, environment } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // POST /api/dashboard/keys/:key/revoke
  app.post("/api/dashboard/keys/:key/revoke", async (req: Request, res: Response) => {
    const { key } = req.params;
    try {
      await d1Execute("UPDATE api_keys SET active = 0 WHERE key = ?", [key]);
      return res.json({ success: true, message: "Key revoked" });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // GET /api/dashboard/usage - Detailed usage
  app.get("/api/dashboard/usage", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });
    
    const days = parseInt(req.query.days as string) || 7;
    
    try {
      // Daily breakdown
      const daily = await d1Query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM api_usage 
         WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?)
         AND created_at > datetime('now', ?)
         GROUP BY DATE(created_at) ORDER BY date`,
        [uid, `-${days} days`]
      );
      
      // Method breakdown
      const byMethod = await d1Query(
        `SELECT method, COUNT(*) as count
         FROM api_usage 
         WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?)
         GROUP BY method`,
        [uid]
      );
      
      // Status breakdown
      const byStatus = await d1Query(
        `SELECT status_code, COUNT(*) as count
         FROM api_usage 
         WHERE api_key IN (SELECT key FROM api_keys WHERE user_id = ?)
         GROUP BY status_code ORDER BY count DESC`,
        [uid]
      );
      
      return res.json({
        success: true,
        daily,
        by_method: byMethod,
        by_status: byStatus,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  console.log("✅ Dashboard Routes Registered:");
  console.log("  GET /api/dashboard/overview?uid=...");
  console.log("  GET /api/dashboard/keys?uid=...");
  console.log("  POST /api/dashboard/keys/generate");
  console.log("  POST /api/dashboard/keys/:key/revoke");
  console.log("  GET /api/dashboard/usage?uid=...&days=7");
}
