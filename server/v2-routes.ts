import type { Express, Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { spotidown } from "../lib/downloaders/v2/spotify";

// ============================================
// V2 API ROUTES
// ============================================

// ─── SEARCH ROUTES ──────────────────────────────

// Spotify Search
async function spotifySearch(query: string) {
  const { tracks } = await spotidown.search(query);
  return tracks.map(t => t.metadata);
}

// AN1 APK Search
async function an1Search(search: string) {
  const response = await axios.get(`https://an1.com/?story=${search}&do=search&subaction=search`, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const $ = cheerio.load(response.data);
  const apps: any[] = [];
  $('.item').each((_, el) => {
    const $el = $(el);
    apps.push({
      title: $el.find('.name a span').text().trim(),
      link: $el.find('.name a').attr('href'),
      developer: $el.find('.developer').text().trim(),
      image: $el.find('.img img').attr('src'),
      type: $el.find('.item_app').hasClass('mod') ? 'MOD' : 'Original',
    });
  });
  return apps;
}

// NPM Search
async function npmSearch(packageName: string) {
  const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
    timeout: 30000,
    headers: { 'User-Agent': 'Postify/1.0.0' },
  });
  const versions = Object.keys(response.data.versions || {});
  const latest = versions[versions.length - 1];
  return {
    name: packageName,
    latest_version: latest,
    publish_time: response.data.time?.created,
    total_versions: versions.length,
  };
}

// ─── CHECK ROUTES ──────────────────────────────

// Package Tracking
async function trackResi(resi: string, courier: string) {
  const response = await axios.get('https://loman.id/resapp/getdropdown.php', {
    timeout: 10000,
    headers: { 'User-Agent': 'Postify/1.0.0' },
  });
  
  const couriers = response.data.data;
  const found = couriers.find((c: any) => 
    c.title.toLowerCase().includes(courier.toLowerCase())
  );
  
  if (!found) throw new Error(`Courier "${courier}" not found`);
  
  const qs = require('qs');
  const trackResponse = await axios.post('https://loman.id/resapp/', qs.stringify({
    resi,
    ex: found.title,
  }), {
    timeout: 15000,
    headers: {
      'User-Agent': 'Postify/1.0.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return trackResponse.data;
}

// ============================================
// REGISTER V2 ROUTES
// ============================================
export function registerV2Routes(app: Express): void {

  // ─── SEARCH ────────────────────────────────
  
  app.get('/api/v2/search/spotify', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const results = await spotifySearch(q);
      return res.json({ status: true, provider: "Spotidown", results });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/an1', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const results = await an1Search(q);
      return res.json({ status: true, provider: "AN1", results });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/npm', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const results = await npmSearch(q);
      return res.json({ status: true, provider: "NPM", results });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // ─── CHECK ────────────────────────────────
  
  app.get('/api/v2/check/resi', async (req: Request, res: Response) => {
    const { resi, courier } = req.query;
    if (!resi || !courier) return res.status(400).json({ status: false, error: "Parameters 'resi' and 'courier' required" });
    try {
      const result = await trackResi(resi as string, courier as string);
      return res.json({ status: true, provider: "Loman", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ V2 Routes Registered:");
  console.log("  SEARCH:");
  console.log("    GET /api/v2/search/spotify");
  console.log("    GET /api/v2/search/an1");
  console.log("    GET /api/v2/search/npm");
  console.log("  CHECK:");
  console.log("    GET /api/v2/check/resi");
}
