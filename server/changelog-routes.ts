import type { Express, Request, Response } from "express";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG — uses D1_CHANGELOG_DB_ID (separate from main D1_DATABASE_ID)
// ═══════════════════════════════════════════════════════════════════════════════

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const D1_CHANGELOG_DB_ID = process.env.D1_CHANGELOG_DB_ID || process.env.D1_DATABASE_ID || "";
const ADMIN_KEY = process.env.ADMIN_KEY || "megan_admin_master";

// ═══════════════════════════════════════════════════════════════════════════════
// D1 REST API CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

async function d1Query(sql: string, params: any[] = []) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_CHANGELOG_DB_ID) {
    throw new Error("Changelog D1 credentials not configured");
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_CHANGELOG_DB_ID}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const data: any = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "D1 query failed");
  }
  return data.result?.[0]?.results || [];
}

function isAdmin(req: Request): boolean {
  return req.query.api_key === ADMIN_KEY || req.headers["x-admin-key"] === ADMIN_KEY;
}

function formatEntry(e: any) {
  return {
    id: e.id,
    type: e.type,
    title: e.title,
    description: e.description,
    endpoints: e.endpoints ? e.endpoints.split(",") : [],
    version: e.version,
    createdAt: e.created_at,
  };
}

function formatNotification(n: any) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    priority: n.priority,
    createdAt: n.created_at,
    expiresAt: n.expires_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

export function registerChangelogRoutes(app: Express): void {

  // ─────────────────────────────────────────────────────────────────────────
  // CHANGELOG
  // ─────────────────────────────────────────────────────────────────────────

  // List all changelog entries
  app.get("/api/changelog", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const type = req.query.type as string;
      let sql = "SELECT * FROM changelog";
      const params: any[] = [];
      if (type) {
        sql += " WHERE type = ?";
        params.push(type);
      }
      sql += " ORDER BY id DESC LIMIT ?";
      params.push(limit);

      const entries = await d1Query(sql, params);
      res.json({
        success: true,
        count: entries.length,
        entries: entries.map(formatEntry),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Get latest entries (for polling)
  app.get("/api/changelog/latest", async (req: Request, res: Response) => {
    try {
      const since = parseInt(req.query.since as string) || 0;
      const entries = await d1Query(
        "SELECT * FROM changelog WHERE id > ? ORDER BY id ASC LIMIT 50",
        [since]
      );
      const latestId = entries.length > 0
        ? Math.max(...entries.map((e: any) => e.id))
        : since;
      res.json({
        success: true,
        latestId,
        count: entries.length,
        entries: entries.map(formatEntry),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Unread count + entries for a user
  app.get("/api/changelog/unread", async (req: Request, res: Response) => {
    try {
      const userId = (req.query.user_id as string) || (req.query.user as string);
      if (!userId) return res.status(400).json({ success: false, error: "Parameter 'user_id' required" });

      const unread = await d1Query(`
        SELECT c.* FROM changelog c
        WHERE c.id NOT IN (
          SELECT changelog_id FROM user_seen WHERE user_id = ?
        )
        ORDER BY c.id DESC
        LIMIT 100
      `, [userId]);

      res.json({
        success: true,
        userId,
        unreadCount: unread.length,
        entries: unread.map(formatEntry),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Mark entries as seen
  app.post("/api/changelog/mark-seen", async (req: Request, res: Response) => {
    try {
      const userId = req.body.user_id || req.body.userId;
      const ids: number[] = req.body.ids || (req.body.id ? [req.body.id] : []);
      if (!userId) return res.status(400).json({ success: false, error: "'user_id' required" });
      if (ids.length === 0) return res.status(400).json({ success: false, error: "'ids' array required" });

      let marked = 0;
      for (const id of ids) {
        try {
          await d1Query(
            "INSERT OR IGNORE INTO user_seen (user_id, changelog_id) VALUES (?, ?)",
            [userId, id]
          );
          marked++;
        } catch {}
      }
      res.json({ success: true, userId, marked, total: ids.length });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Add new changelog entry (admin)
  app.post("/api/changelog", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ success: false, error: "Admin key required" });

      const { type, title, description, endpoints, version } = req.body || {};
      if (!type || !title || !description) {
        return res.status(400).json({ success: false, error: "'type', 'title', 'description' required" });
      }

      const endpointStr = Array.isArray(endpoints) ? endpoints.join(",") : (endpoints || "");
      await d1Query(
        "INSERT INTO changelog (type, title, description, endpoints, version) VALUES (?, ?, ?, ?, ?)",
        [type, title, description, endpointStr, version || null]
      );
      const [inserted] = await d1Query("SELECT * FROM changelog ORDER BY id DESC LIMIT 1");
      res.json({ success: true, entry: formatEntry(inserted) });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Update entry (admin)
  app.put("/api/changelog/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ success: false, error: "Admin key required" });

      const { id } = req.params;
      const { type, title, description, endpoints, version } = req.body || {};
      const endpointStr = Array.isArray(endpoints) ? endpoints.join(",") : endpoints;

      const fields: string[] = [];
      const params: any[] = [];
      if (type) { fields.push("type = ?"); params.push(type); }
      if (title) { fields.push("title = ?"); params.push(title); }
      if (description) { fields.push("description = ?"); params.push(description); }
      if (endpoints !== undefined) { fields.push("endpoints = ?"); params.push(endpointStr); }
      if (version) { fields.push("version = ?"); params.push(version); }

      if (fields.length === 0) return res.status(400).json({ success: false, error: "No fields to update" });
      params.push(id);

      await d1Query(`UPDATE changelog SET ${fields.join(", ")} WHERE id = ?`, params);
      res.json({ success: true, updated: id });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Delete entry (admin, soft delete not applicable here — hard delete)
  app.delete("/api/changelog/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ success: false, error: "Admin key required" });
      const { id } = req.params;
      await d1Query("DELETE FROM changelog WHERE id = ?", [id]);
      res.json({ success: true, deleted: id });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS (user-facing messages, separate from changelog)
  // ─────────────────────────────────────────────────────────────────────────

  // List active notifications
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      // Auto-create table if missing
      try {
        await d1Query(`CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          priority TEXT DEFAULT 'normal',
          is_active INTEGER DEFAULT 1,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
      } catch {}

      const list = await d1Query(
        "SELECT * FROM notifications WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY id DESC LIMIT 50"
      );
      res.json({
        success: true,
        count: list.length,
        notifications: list.map(formatNotification),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Add notification (admin)
  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ success: false, error: "Admin key required" });
      const { type, title, message, priority, expires_at } = req.body || {};
      if (!type || !title || !message) {
        return res.status(400).json({ success: false, error: "'type', 'title', 'message' required" });
      }

      await d1Query(
        "INSERT INTO notifications (type, title, message, priority, expires_at) VALUES (?, ?, ?, ?, ?)",
        [type, title, message, priority || "normal", expires_at || null]
      );
      const [inserted] = await d1Query("SELECT * FROM notifications ORDER BY id DESC LIMIT 1");
      res.json({ success: true, notification: formatNotification(inserted) });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Delete notification (admin)
  app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ success: false, error: "Admin key required" });
      const { id } = req.params;
      await d1Query("UPDATE notifications SET is_active = 0 WHERE id = ?", [id]);
      res.json({ success: true, deleted: id });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ Changelog Routes Registered:");
  console.log("  GET    /api/changelog");
  console.log("  GET    /api/changelog/latest?since=ID");
  console.log("  GET    /api/changelog/unread?user_id=X");
  console.log("  POST   /api/changelog/mark-seen");
  console.log("  POST   /api/changelog          (admin)");
  console.log("  PUT    /api/changelog/:id      (admin)");
  console.log("  DELETE /api/changelog/:id      (admin)");
  console.log("✅ Notification Routes Registered:");
  console.log("  GET    /api/notifications");
  console.log("  POST   /api/notifications      (admin)");
  console.log("  DELETE /api/notifications/:id  (admin)");
}
