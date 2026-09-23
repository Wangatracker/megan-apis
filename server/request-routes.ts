import type { Express, Request, Response } from "express";
import { d1Query, d1Execute } from "./d1-client";

const ADMIN_PWD = process.env.ADMIN_PASSWORD || "meganadmin2026";
const MAX_REQUESTS_PER_DAY = 5;

function requireAdmin(req: Request, res: Response): boolean {
  const pwd = req.headers["x-admin-password"] as string | undefined;
  if (pwd !== ADMIN_PWD) {
    res.status(403).json({ success: false, error: "Admin required" });
    return false;
  }
  return true;
}

function formatRequest(r: any, currentUserVote: number | null = null) {
  return {
    id: r.id,
    user_id: r.user_id,
    username: r.username,
    title: r.title,
    description: r.description,
    use_case: r.use_case,
    examples: r.examples,
    status: r.status,
    upvotes: r.upvotes || 0,
    downvotes: r.downvotes || 0,
    net_votes: r.net_votes || 0,
    shipped_endpoint: r.shipped_endpoint,
    admin_note: r.admin_note,
    created_at: r.created_at,
    updated_at: r.updated_at,
    my_vote: currentUserVote,
  };
}

export function registerRequestRoutes(app: Express): void {

  // ─── GET /api/requests ──────────────────────────────────────────────────
  // Public. Query: ?status=open|planned|in_progress|shipped|rejected&sort=trending|new|top&page=0&limit=20
  app.get("/api/requests", async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string) || null;
      const sort = (req.query.sort as string) || "trending";
      const page = Math.max(0, parseInt(req.query.page as string) || 0);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = page * limit;
      const uid = (req.query.uid as string) || null;

      let sql = "SELECT * FROM endpoint_requests";
      const params: any[] = [];
      if (status && status !== "all") {
        sql += " WHERE status = ?";
        params.push(status);
      }

      if (sort === "new") {
        sql += " ORDER BY created_at DESC";
      } else if (sort === "top") {
        sql += " ORDER BY net_votes DESC, created_at DESC";
      } else {
        // trending = net_votes weighted with recency bonus
        // Simple version: net_votes DESC but within last 30 days
        sql += " ORDER BY net_votes DESC, created_at DESC";
      }

      sql += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const rows = await d1Query(sql, params);

      // Get user's votes for these requests (single query, not N+1)
      let voteMap: Record<number, number> = {};
      if (uid && rows.length > 0) {
        const ids = rows.map((r: any) => r.id).join(",");
        const votes = await d1Query(
          `SELECT request_id FROM endpoint_request_votes WHERE user_id = ? AND request_id IN (${ids})`,
          [uid]
        );
        votes.forEach((v: any) => { voteMap[v.request_id] = 1; });
      }

      // Total count for pagination
      let countSql = "SELECT COUNT(*) as c FROM endpoint_requests";
      const countParams: any[] = [];
      if (status && status !== "all") {
        countSql += " WHERE status = ?";
        countParams.push(status);
      }
      const countRes = await d1Query(countSql, countParams);
      const total = countRes[0]?.c || 0;

      return res.json({
        success: true,
        page,
        limit,
        total,
        has_more: offset + rows.length < total,
        requests: rows.map((r: any) => formatRequest(r, voteMap[r.id] || null)),
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── GET /api/requests/:id ──────────────────────────────────────────────
  app.get("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid id" });

      const rows = await d1Query("SELECT * FROM endpoint_requests WHERE id = ?", [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, error: "Request not found" });

      const uid = (req.query.uid as string) || null;
      let myVote: number | null = null;
      if (uid) {
        const v = await d1Query(
          "SELECT id FROM endpoint_request_votes WHERE request_id = ? AND user_id = ? LIMIT 1",
          [id, uid]
        );
        if (v.length > 0) myVote = 1;
      }

      const comments = await d1Query(
        "SELECT id, user_id, username, body, created_at FROM endpoint_request_comments WHERE request_id = ? ORDER BY created_at ASC LIMIT 100",
        [id]
      );

      return res.json({
        success: true,
        request: formatRequest(rows[0], myVote),
        comments,
        comment_count: comments.length,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── POST /api/requests ─────────────────────────────────────────────────
  // Body: { uid, username, title, description, use_case?, examples? }
  app.post("/api/requests", async (req: Request, res: Response) => {
    try {
      const { uid, username, title, description, use_case, examples } = req.body || {};
      if (!uid || !username || !title || !description) {
        return res.status(400).json({ success: false, error: "uid, username, title, description required" });
      }
      if (title.length < 5 || title.length > 120) {
        return res.status(400).json({ success: false, error: "Title must be 5-120 characters" });
      }
      if (description.length < 20 || description.length > 2000) {
        return res.status(400).json({ success: false, error: "Description must be 20-2000 characters" });
      }

      // Rate limit: max 5 requests per user in last 24h
      const recent = await d1Query(
        "SELECT COUNT(*) as c FROM endpoint_requests WHERE user_id = ? AND created_at > datetime('now', '-1 day')",
        [uid]
      );
      if ((recent[0]?.c || 0) >= MAX_REQUESTS_PER_DAY) {
        return res.status(429).json({ success: false, error: `Max ${MAX_REQUESTS_PER_DAY} requests per day` });
      }

      // Duplicate check: same user + same title in last 30 days
      const dupe = await d1Query(
        "SELECT id FROM endpoint_requests WHERE user_id = ? AND LOWER(title) = LOWER(?) AND created_at > datetime('now', '-30 days') LIMIT 1",
        [uid, title]
      );
      if (dupe.length > 0) {
        return res.status(409).json({ success: false, error: "You already submitted a similar request recently" });
      }

      await d1Execute(
        `INSERT INTO endpoint_requests (user_id, username, title, description, use_case, examples, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))`,
        [uid, username, title.trim(), description.trim(), use_case || null, examples || null]
      );

      const inserted = await d1Query("SELECT * FROM endpoint_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1", [uid]);
      return res.json({ success: true, request: formatRequest(inserted[0]) });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── POST /api/requests/:id/vote ────────────────────────────────────────
  // Body: { uid } — toggles upvote on/off
  app.post("/api/requests/:id/vote", async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const uid = req.body?.uid;
      if (!uid) return res.status(400).json({ success: false, error: "uid required" });
      if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid id" });

      // Check request exists
      const reqRow = await d1Query("SELECT id FROM endpoint_requests WHERE id = ?", [id]);
      if (reqRow.length === 0) return res.status(404).json({ success: false, error: "Request not found" });

      // Check if user already voted
      const existing = await d1Query(
        "SELECT id FROM endpoint_request_votes WHERE request_id = ? AND user_id = ? LIMIT 1",
        [id, uid]
      );

      let action: "voted" | "unvoted";
      let newCount: number;

      if (existing.length > 0) {
        // Unvote
        await d1Execute("DELETE FROM endpoint_request_votes WHERE request_id = ? AND user_id = ?", [id, uid]);
        await d1Execute(
          "UPDATE endpoint_requests SET upvotes = MAX(0, upvotes - 1), net_votes = MAX(0, net_votes - 1), updated_at = datetime('now') WHERE id = ?",
          [id]
        );
        action = "unvoted";
      } else {
        // Vote
        await d1Execute(
          "INSERT INTO endpoint_request_votes (request_id, user_id, vote_type, created_at) VALUES (?, ?, 'up', datetime('now'))",
          [id, uid]
        );
        await d1Execute(
          "UPDATE endpoint_requests SET upvotes = upvotes + 1, net_votes = net_votes + 1, updated_at = datetime('now') WHERE id = ?",
          [id]
        );
        action = "voted";
      }

      const fresh = await d1Query("SELECT upvotes, net_votes FROM endpoint_requests WHERE id = ?", [id]);
      newCount = fresh[0]?.net_votes || 0;

      return res.json({ success: true, action, net_votes: newCount });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── POST /api/requests/:id/comment ─────────────────────────────────────
  app.post("/api/requests/:id/comment", async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { uid, username, body } = req.body || {};
      if (!uid || !username || !body) return res.status(400).json({ success: false, error: "uid, username, body required" });
      if (body.length < 1 || body.length > 1000) return res.status(400).json({ success: false, error: "Comment must be 1-1000 characters" });
      if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid id" });

      const reqRow = await d1Query("SELECT id FROM endpoint_requests WHERE id = ?", [id]);
      if (reqRow.length === 0) return res.status(404).json({ success: false, error: "Request not found" });

      await d1Execute(
        "INSERT INTO endpoint_request_comments (request_id, user_id, username, body, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, uid, username, body.trim()]
      );

      return res.json({ success: true, message: "Comment added" });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── PATCH /api/requests/:id ────────────────────────────────────────────
  // Admin. Body: { status?, shipped_endpoint?, admin_note? }
  // Auto-notifies submitter + voters when status → 'shipped'
  app.patch("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid id" });

      const { status, shipped_endpoint, admin_note } = req.body || {};
      const existing = await d1Query("SELECT * FROM endpoint_requests WHERE id = ?", [id]);
      if (existing.length === 0) return res.status(404).json({ success: false, error: "Request not found" });
      const prev = existing[0];

      const updates: string[] = [];
      const params: any[] = [];
      if (status) { updates.push("status = ?"); params.push(status); }
      if (shipped_endpoint !== undefined) { updates.push("shipped_endpoint = ?"); params.push(shipped_endpoint || null); }
      if (admin_note !== undefined) { updates.push("admin_note = ?"); params.push(admin_note || null); }
      if (updates.length === 0) return res.status(400).json({ success: false, error: "No fields to update" });
      updates.push("updated_at = datetime('now')");
      params.push(id);

      await d1Execute(`UPDATE endpoint_requests SET ${updates.join(", ")} WHERE id = ?`, params);

      // ─── Auto-notify when shipping ────────────────────────────────────
      if (status === "shipped" && prev.status !== "shipped") {
        const finalEndpoint = shipped_endpoint || prev.shipped_endpoint || "";
        const title = `🚀 Your request shipped: ${prev.title}`;
        const message = finalEndpoint
          ? `Endpoint live: ${finalEndpoint}. Thanks for the suggestion!`
          : `Your requested feature is now live. Thanks for the suggestion!`;

        // 1. Notify submitter
        try {
          await d1Execute(
            `INSERT INTO notifications (type, title, message, priority, target_user_id, is_active, created_at)
             VALUES ('new', ?, ?, 'high', ?, 1, datetime('now'))`,
            [title, message, prev.user_id]
          );
        } catch (e) { console.error("notif submitter failed", e); }

        // 2. Notify all voters (except submitter — they already got one)
        try {
          const voters = await d1Query(
            "SELECT user_id FROM endpoint_request_votes WHERE request_id = ? AND user_id != ?",
            [id, prev.user_id]
          );
          for (const v of voters as any[]) {
            try {
              await d1Execute(
                `INSERT INTO notifications (type, title, message, priority, target_user_id, is_active, created_at)
                 VALUES ('new', ?, ?, 'normal', ?, 1, datetime('now'))`,
                [`🚀 Request you voted for shipped: ${prev.title}`, message, v.user_id]
              );
            } catch {}
          }
        } catch (e) { console.error("notif voters failed", e); }

        // 3. Auto-changelog entry
        try {
          await d1Execute(
            `INSERT INTO changelog (type, title, description, endpoints, version, created_at)
             VALUES ('new', ?, ?, ?, ?, datetime('now'))`,
            [
              `Community Request: ${prev.title}`,
              `Shipped from user request by ${prev.username}. ${prev.description}`,
              finalEndpoint,
              "community",
            ]
          );
        } catch (e) { console.error("changelog failed", e); }
      }

      return res.json({ success: true, message: "Updated", id });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── DELETE /api/requests/:id ───────────────────────────────────────────
  // Admin only. Hard delete.
  app.delete("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid id" });

      await d1Execute("DELETE FROM endpoint_request_votes WHERE request_id = ?", [id]);
      await d1Execute("DELETE FROM endpoint_request_comments WHERE request_id = ?", [id]);
      await d1Execute("DELETE FROM endpoint_requests WHERE id = ?", [id]);

      return res.json({ success: true, deleted: id });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── GET /api/requests/mine ─────────────────────────────────────────────
  // User's own requests
  app.get("/api/requests/mine", async (req: Request, res: Response) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) return res.status(400).json({ success: false, error: "uid required" });
      const rows = await d1Query(
        "SELECT * FROM endpoint_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [uid]
      );
      return res.json({ success: true, count: rows.length, requests: rows.map((r: any) => formatRequest(r)) });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ Request Routes Registered:");
  console.log("  GET    /api/requests");
  console.log("  GET    /api/requests/:id");
  console.log("  GET    /api/requests/mine?uid=...");
  console.log("  POST   /api/requests");
  console.log("  POST   /api/requests/:id/vote");
  console.log("  POST   /api/requests/:id/comment");
  console.log("  PATCH  /api/requests/:id          (admin)");
  console.log("  DELETE /api/requests/:id          (admin)");
}
