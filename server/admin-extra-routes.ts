import type { Express, Request, Response } from "express";
import { d1Query, d1Execute } from "./d1-client";

const ADMIN_PWD = process.env.ADMIN_PASSWORD || "meganadmin2026";

function requireAdmin(req: Request, res: Response): boolean {
  const pwd = req.headers["x-admin-password"] as string | undefined;
  if (pwd !== ADMIN_PWD) {
    res.status(403).json({ success: false, error: "Admin required" });
    return false;
  }
  return true;
}

export function registerAdminExtraRoutes(app: Express): void {

  // ─── FLAGS ──────────────────────────────────────────────────────────────
  // GET /api/admin/flags — list all flags (open + resolved)
  app.get("/api/admin/flags", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const status = req.query.status as string; // "open" | "resolved" | undefined = all
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

      let sql = `SELECT f.*, k.name as key_name, k.user_id
                 FROM key_flags f
                 LEFT JOIN api_keys k ON k.key = f.api_key`;

      const params: any[] = [];
      if (status === "open") {
        sql += " WHERE f.resolved_at IS NULL";
      } else if (status === "resolved") {
        sql += " WHERE f.resolved_at IS NOT NULL";
      }
      sql += " ORDER BY f.detected_at DESC LIMIT ?";
      params.push(limit);

      const flags = await d1Query(sql, params);

      // Summary counts
      const openCount = await d1Query(
        "SELECT COUNT(*) as c FROM key_flags WHERE resolved_at IS NULL"
      );
      const bySeverity = await d1Query(
        `SELECT severity, COUNT(*) as c FROM key_flags 
         WHERE resolved_at IS NULL GROUP BY severity`
      );
      const byType = await d1Query(
        `SELECT type, COUNT(*) as c FROM key_flags 
         WHERE resolved_at IS NULL GROUP BY type`
      );

      return res.json({
        success: true,
        count: flags.length,
        open_count: openCount[0]?.c || 0,
        by_severity: bySeverity,
        by_type: byType,
        flags,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // POST /api/admin/flags/:id/resolve — admin resolves a flag
  app.post("/api/admin/flags/:id/resolve", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const id = String(req.params.id);
      await d1Execute(
        "UPDATE key_flags SET resolved_at = datetime('now'), resolved_by = 'admin' WHERE id = ?",
        [parseInt(id)]
      );
      return res.json({ success: true, message: "Flag resolved", id });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── ERROR REPORTS ──────────────────────────────────────────────────────
  // GET /api/admin/reports — list error reports
  app.get("/api/admin/reports", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const endpointFilter = req.query.endpoint as string | undefined;

      let sql = "SELECT * FROM error_reports";
      const params: any[] = [];
      if (endpointFilter) {
        sql += " WHERE endpoint = ?";
        params.push(endpointFilter);
      }
      sql += " ORDER BY id DESC LIMIT ?";
      params.push(limit);

      const reports = await d1Query(sql, params);
      const total = await d1Query("SELECT COUNT(*) as c FROM error_reports");

      return res.json({
        success: true,
        count: reports.length,
        total: total[0]?.c || 0,
        reports,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // DELETE /api/admin/reports/:id — delete a report
  app.delete("/api/admin/reports/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const id = String(req.params.id);
      await d1Execute("DELETE FROM error_reports WHERE id = ?", [parseInt(id)]);
      return res.json({ success: true, deleted: id });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── REVIEWS MODERATION ─────────────────────────────────────────────────
  // GET /api/admin/reviews — list all reviews (with pagination)
  app.get("/api/admin/reviews", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const endpoint = req.query.endpoint as string | undefined;

      let sql = "SELECT * FROM api_reviews";
      const params: any[] = [];
      if (endpoint) {
        sql += " WHERE endpoint = ?";
        params.push(endpoint);
      }
      sql += " ORDER BY id DESC LIMIT ?";
      params.push(limit);

      const reviews = await d1Query(sql, params);
      return res.json({ success: true, count: reviews.length, reviews });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // DELETE /api/admin/reviews/:id — delete a review
  app.delete("/api/admin/reviews/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const id = String(req.params.id);
      await d1Execute("DELETE FROM api_reviews WHERE id = ?", [parseInt(id)]);
      return res.json({ success: true, deleted: id });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ─── DETECTOR CONTROL ───────────────────────────────────────────────────
  // POST /api/admin/detector/run — manually trigger (already exists in detector.ts)
  // We'll re-export it here for consistency? No — leave it where it is.

  console.log("✅ Admin Extra Routes Registered:");
  console.log("  GET    /api/admin/flags");
  console.log("  POST   /api/admin/flags/:id/resolve");
  console.log("  GET    /api/admin/reports");
  console.log("  DELETE /api/admin/reports/:id");
  console.log("  GET    /api/admin/reviews");
  console.log("  DELETE /api/admin/reviews/:id");
}
