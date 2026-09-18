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


// ─── OWNERSHIP CHECK ────────────────────────────────────────────────────────
async function verifyKeyOwnership(key: string, uid: string): Promise<boolean> {
  try {
    const rows = await d1Query(
      "SELECT key FROM api_keys WHERE key = ? AND user_id = ?",
      [key, uid]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

// ─── MASK IP ────────────────────────────────────────────────────────────────
function maskIP(ip: string | null): string {
  if (!ip) return "unknown";
  // IPv4: 1.2.3.4 → 1.2.3.x
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }
  // IPv6: shorten
  if (ip.includes(":")) {
    return ip.slice(0, 12) + "...";
  }
  return "unknown";
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
    const key = String(req.params.key);
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
  

  // ─── OWNER VISIBILITY ENDPOINTS ──────────────────────────────────────────
  
  // GET /api/dashboard/keys/:key/stats - Detailed stats for one key
  app.get("/api/dashboard/keys/:key/stats", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    const key = String(req.params.key);
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });

    try {
      if (!(await verifyKeyOwnership(key, uid))) {
        return res.status(403).json({ success: false, error: "Not your key" });
      }

      // Totals per window
      const windows = [
        { label: "24h", mod: "-1 day" },
        { label: "7d",  mod: "-7 days" },
        { label: "30d", mod: "-30 days" },
      ];

      const stats: Record<string, any> = {};
      for (const w of windows) {
        const total = await d1Query(
          "SELECT COUNT(*) as count FROM api_usage WHERE api_key = ? AND created_at > datetime('now', ?)",
          [key, w.mod]
        );
        const success = await d1Query(
          "SELECT COUNT(*) as count FROM api_usage WHERE api_key = ? AND created_at > datetime('now', ?) AND status_code < 400",
          [key, w.mod]
        );
        const errors = await d1Query(
          "SELECT COUNT(*) as count FROM api_usage WHERE api_key = ? AND created_at > datetime('now', ?) AND status_code >= 400",
          [key, w.mod]
        );
        const avg = await d1Query(
          "SELECT AVG(response_time_ms) as avg_ms FROM api_usage WHERE api_key = ? AND created_at > datetime('now', ?)",
          [key, w.mod]
        );
        const uniqueIps = await d1Query(
          "SELECT COUNT(DISTINCT requested_ip) as count FROM api_usage WHERE api_key = ? AND created_at > datetime('now', ?)",
          [key, w.mod]
        );

        const t = total[0]?.count || 0;
        stats[w.label] = {
          total: t,
          success: success[0]?.count || 0,
          errors: errors[0]?.count || 0,
          success_rate: t > 0 ? Math.round(((success[0]?.count || 0) / t) * 1000) / 10 : 100,
          avg_ms: Math.round(avg[0]?.avg_ms || 0),
          unique_ips: uniqueIps[0]?.count || 0,
        };
      }

      // Key meta
      const meta = await d1Query(
        "SELECT key, name, rate_limit, active, created_at, last_used_at, environment FROM api_keys WHERE key = ?",
        [key]
      );

      // Active flag count
      const flagCount = await d1Query(
        "SELECT COUNT(*) as count FROM key_flags WHERE api_key = ? AND resolved_at IS NULL",
        [key]
      );

      return res.json({
        success: true,
        key: meta[0] || null,
        stats,
        active_flags: flagCount[0]?.count || 0,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // GET /api/dashboard/keys/:key/requests?limit=50 - Recent requests
  app.get("/api/dashboard/keys/:key/requests", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    const key = String(req.params.key);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    if (!uid) return res.status(400).json({ success: false, error: "uid required" });

    try {
      if (!(await verifyKeyOwnership(key, uid))) {
        return res.status(403).json({ success: false, error: "Not your key" });
      }

      const rows = await d1Query(
        `SELECT endpoint, method, status_code, response_time_ms, requested_ip, created_at
         FROM api_usage WHERE api_key = ? ORDER BY created_at DESC LIMIT ?`,
        [key, limit]
      );

      // Mask IPs for owner privacy (don't expose full IPs)
      const masked = rows.map((r: any) => ({
        ...r,
        requested_ip: maskIP(r.requested_ip),
      }));

      return res.json({ success: true, count: masked.length, requests: masked });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // GET /api/dashboard/keys/:key/top-endpoints
  app.get("/api/dashboard/keys/:key/top-endpoints", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    const key = String(req.params.key);
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });

    try {
      if (!(await verifyKeyOwnership(key, uid))) {
        return res.status(403).json({ success: false, error: "Not your key" });
      }

      const rows = await d1Query(
        `SELECT endpoint, COUNT(*) as count, AVG(response_time_ms) as avg_ms,
                SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
         FROM api_usage WHERE api_key = ?
         GROUP BY endpoint ORDER BY count DESC LIMIT 10`,
        [key]
      );

      return res.json({ success: true, endpoints: rows });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // GET /api/dashboard/keys/:key/top-ips
  app.get("/api/dashboard/keys/:key/top-ips", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    const key = String(req.params.key);
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });

    try {
      if (!(await verifyKeyOwnership(key, uid))) {
        return res.status(403).json({ success: false, error: "Not your key" });
      }

      const rows = await d1Query(
        `SELECT requested_ip, COUNT(*) as count, MAX(created_at) as last_seen
         FROM api_usage WHERE api_key = ? AND requested_ip IS NOT NULL
         GROUP BY requested_ip ORDER BY count DESC LIMIT 10`,
        [key]
      );

      const masked = rows.map((r: any) => ({
        ip: maskIP(r.requested_ip),
        count: r.count,
        last_seen: r.last_seen,
      }));

      return res.json({ success: true, ips: masked });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // GET /api/dashboard/keys/:key/flags - Active warnings for this key
  app.get("/api/dashboard/keys/:key/flags", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    const key = String(req.params.key);
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });

    try {
      if (!(await verifyKeyOwnership(key, uid))) {
        return res.status(403).json({ success: false, error: "Not your key" });
      }

      const rows = await d1Query(
        `SELECT id, type, severity, description, metadata, detected_at, resolved_at, dismissed_by_user
         FROM key_flags WHERE api_key = ? ORDER BY detected_at DESC LIMIT 30`,
        [key]
      );

      return res.json({ success: true, count: rows.length, flags: rows });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // POST /api/dashboard/keys/:key/flags/:id/dismiss - User marks flag as false positive
  app.post("/api/dashboard/keys/:key/flags/:id/dismiss", async (req: Request, res: Response) => {
    const uid = req.query.uid as string;
    const key = String(req.params.key);
    const id = String(req.params.id);
    if (!uid) return res.status(400).json({ success: false, error: "uid required" });

    try {
      if (!(await verifyKeyOwnership(key, uid))) {
        return res.status(403).json({ success: false, error: "Not your key" });
      }

      await d1Execute(
        "UPDATE key_flags SET dismissed_by_user = 1, resolved_at = datetime('now'), resolved_by = 'user' WHERE id = ? AND api_key = ?",
        [parseInt(id), key]
      );

      return res.json({ success: true, message: "Flag dismissed" });
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
  console.log("  GET /api/dashboard/keys/:key/stats?uid=...");
  console.log("  GET /api/dashboard/keys/:key/requests?uid=...");
  console.log("  GET /api/dashboard/keys/:key/top-endpoints?uid=...");
  console.log("  GET /api/dashboard/keys/:key/top-ips?uid=...");
  console.log("  GET /api/dashboard/keys/:key/flags?uid=...");
  console.log("  POST /api/dashboard/keys/:key/flags/:id/dismiss");
}
