import type { Express, Request, Response } from "express";
import { d1Query, d1Execute } from "./d1-client";

// ─── REVIEW & LIKE ROUTES ─────────────────────────────────────────────────

export function registerReviewRoutes(app: Express): void {
  
  // POST /api/v2/review - Add a review
  app.post("/api/v2/review", async (req: Request, res: Response) => {
    const { endpoint, rating, comment, user_name } = req.body || {};
    
    if (!endpoint || !rating) {
      return res.status(400).json({ success: false, error: "Parameters 'endpoint' and 'rating' required" });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "Rating must be 1-5" });
    }
    
    try {
      await d1Execute(
        "INSERT INTO api_reviews (endpoint, rating, comment, user_name) VALUES (?, ?, ?, ?)",
        [endpoint, rating, comment || null, user_name || "anonymous"]
      );
      
      return res.json({ success: true, message: "Review added", endpoint, rating });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // GET /api/v2/reviews/:endpoint - Get reviews for endpoint
  app.get("/api/v2/reviews/:endpoint", async (req: Request, res: Response) => {
    const endpoint = "/" + req.params.endpoint;
    
    try {
      const reviews = await d1Query(
        "SELECT id, endpoint, rating, comment, user_name, created_at FROM api_reviews WHERE endpoint = ? ORDER BY created_at DESC LIMIT 50",
        [endpoint]
      );
      
      const avgResult = await d1Query(
        "SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM api_reviews WHERE endpoint = ?",
        [endpoint]
      );
      
      return res.json({
        success: true,
        endpoint,
        average_rating: avgResult[0]?.avg_rating || 0,
        total_reviews: avgResult[0]?.total_reviews || 0,
        reviews,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // POST /api/v2/like/:endpoint - Like an endpoint
  app.post("/api/v2/like/:endpoint", async (req: Request, res: Response) => {
    const endpoint = "/" + req.params.endpoint;
    
    try {
      await d1Execute(
        "INSERT OR IGNORE INTO api_likes (endpoint) VALUES (?)",
        [endpoint]
      );
      
      const likes = await d1Query(
        "SELECT COUNT(*) as count FROM api_likes WHERE endpoint = ?",
        [endpoint]
      );
      
      return res.json({ success: true, endpoint, likes: likes[0]?.count || 0 });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // GET /api/v2/ranking - Get top rated/most liked endpoints
  app.get("/api/v2/ranking", async (_req: Request, res: Response) => {
    try {
      const topRated = await d1Query(`
        SELECT endpoint, AVG(rating) as avg_rating, COUNT(*) as review_count
        FROM api_reviews
        GROUP BY endpoint
        ORDER BY avg_rating DESC, review_count DESC
        LIMIT 10
      `);
      
      const mostLiked = await d1Query(`
        SELECT endpoint, COUNT(*) as like_count
        FROM api_likes
        GROUP BY endpoint
        ORDER BY like_count DESC
        LIMIT 10
      `);
      
      const mostUsed = await d1Query(`
        SELECT endpoint, COUNT(*) as usage_count, AVG(response_time_ms) as avg_ms
        FROM api_usage
        GROUP BY endpoint
        ORDER BY usage_count DESC
        LIMIT 10
      `);
      
      return res.json({
        success: true,
        top_rated: topRated,
        most_liked: mostLiked,
        most_used: mostUsed,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  // POST /api/v2/report-error - Report an error
  app.post("/api/v2/report-error", async (req: Request, res: Response) => {
    const { endpoint, error_message, error_details } = req.body || {};
    
    if (!endpoint || !error_message) {
      return res.status(400).json({ success: false, error: "Parameters 'endpoint' and 'error_message' required" });
    }
    
    try {
      await d1Execute(
        "INSERT INTO error_reports (endpoint, error_message, error_details) VALUES (?, ?, ?)",
        [endpoint, error_message, error_details || null]
      );
      
      return res.json({ success: true, message: "Error reported", reference_id: Date.now().toString(36) });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  
  console.log("✅ Review Routes Registered:");
  console.log("  POST /api/v2/review");
  console.log("  GET /api/v2/reviews/:endpoint");
  console.log("  POST /api/v2/like/:endpoint");
  console.log("  GET /api/v2/ranking");
  console.log("  POST /api/v2/report-error");
}
