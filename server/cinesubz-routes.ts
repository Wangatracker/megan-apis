import { Router, Request, Response } from "express";
import {
  searchMovies,
  getMovieDetails,
  getPlayerUrl,
  fullWorkflow,
} from "../lib/cinesubz/scraper";

const router = Router();

// Search movies
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const results = await searchMovies(q);
    return res.json({ success: true, results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get movie details
router.get("/movie/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const details = await getMovieDetails(slug);
    if (!details) {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }
    return res.json({ success: true, movie: details });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get player URL
router.get("/player/:postId", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    const playerData = await getPlayerUrl(postId);
    if (!playerData) {
      return res.status(404).json({ success: false, error: "Player not found" });
    }
    return res.json({ success: true, ...playerData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Full workflow: search → details → video
router.get("/all", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const result = await fullWorkflow(q);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
