import type { Express, Request, Response } from "express";
import * as cheerio from 'cheerio';

// ============================================
// ALL WORKING MEDIA SCRAPERS
// ============================================

// Headers
const LK21_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
  'accept-language': 'id-ID,id;q=0.9',
  referer: 'https://tv10.lk21official.cc/',
};

const TOKUSATSU_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
  'Referer': 'https://www.tokusatsuindo.com/'
};

const SEEGORE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://seegore.com/gore/'
};

// ============================================
// SEEGORE (Direct MP4)
// ============================================
const SEEGORE_BASE = 'https://seegore.com';

async function seegoreGet(url: string): Promise<string> {
  const res = await fetch(url, { headers: SEEGORE_HEADERS, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ============================================
// LK21 (Movies)
// ============================================
const LK21_BASE = 'https://tv10.lk21official.cc';

async function lk21Get(url: string): Promise<string> {
  const res = await fetch(url, { headers: LK21_HEADERS, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ============================================
// TOKUSATSU (Kamen Rider, Super Sentai)
// ============================================
const TOKUSATSU_BASE = 'https://www.tokusatsuindo.com';

async function tokusatsuGet(url: string): Promise<string> {
  const res = await fetch(url, { headers: TOKUSATSU_HEADERS, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function tokusatsuPost(url: string, body: string, referer: string): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...TOKUSATSU_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': referer,
    },
    body,
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ============================================
// REGISTER ALL ROUTES
// ============================================
export function registerMovieRoutes(app: Express): void {

  // ============ SEEGORE ROUTES (Direct MP4) ============

  app.get('/api/v1/seegore/home', async (_req: Request, res: Response) => {
    try {
      const html = await seegoreGet(`${SEEGORE_BASE}/gore/`);
      const $ = cheerio.load(html);
      const videos: any[] = [];
      
      $('article.mm-card').each((_, el) => {
        const article = $(el);
        const titleLink = article.find('h2.mm-card__title a');
        const mediaLink = article.find('a.mm-card__media');
        
        const title = titleLink.attr('title') || titleLink.text().trim() || mediaLink.attr('aria-label') || '';
        const url = titleLink.attr('href') || mediaLink.attr('href') || '';
        const img = mediaLink.find('img').attr('src') || '';
        const category = article.find('a.mm-card__badge').text().trim() || '';
        
        if (title && url) {
          videos.push({ title, url, thumbnail: img, category });
        }
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "SeeGore",
        total: videos.length,
        data: videos,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/v1/seegore/search', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ success: false, error: "Parameter 'q' required" });
    
    try {
      const html = await seegoreGet(`${SEEGORE_BASE}/?s=${encodeURIComponent(q)}`);
      const $ = cheerio.load(html);
      const results: any[] = [];
      
      $('article.mm-card').each((_, el) => {
        const article = $(el);
        const titleLink = article.find('h2.mm-card__title a');
        const title = titleLink.attr('title') || titleLink.text().trim();
        const url = titleLink.attr('href') || '';
        
        if (title && url) {
          results.push({ title, url });
        }
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "SeeGore",
        query: q,
        total: results.length,
        results,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/v1/seegore/watch', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ success: false, error: "Parameter 'url' required" });
    
    try {
      const fullUrl = url.startsWith('http') ? url : `${SEEGORE_BASE}/${url}/`;
      const html = await seegoreGet(fullUrl);
      const $ = cheerio.load(html);
      const article = $('article');
      
      const title = article.find('h1').text().trim() || $('h1').text().trim();
      const videos: any[] = [];
      
      article.find('video').each((idx, videoEl) => {
        const vt = $(videoEl);
        let src = '';
        const sourceTag = vt.find('source');
        if (sourceTag.length) src = sourceTag.attr('src') || '';
        if (!src) src = vt.attr('src') || '';
        if (src) {
          videos.push({
            index: idx + 1,
            src: src.split('?')[0],
            poster: vt.attr('poster') || '',
          });
        }
      });
      
      if (videos.length === 0) {
        article.find('a').each((idx, aEl) => {
          const href = $(aEl).attr('href') || '';
          if (href.split('?')[0].endsWith('.mp4')) {
            videos.push({ index: idx + 1, src: href.split('?')[0], poster: '' });
          }
        });
      }
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "SeeGore",
        title,
        video_urls: videos,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ============ LK21 ROUTES (Movies) ============

  app.get('/api/v1/movie/home', async (_req: Request, res: Response) => {
    try {
      const html = await lk21Get(`${LK21_BASE}/`);
      const $ = cheerio.load(html);
      const movies: any[] = [];
      
      $('.gallery-grid article, #post-container article').each((_, el) => {
        const a = $(el).find('a').first();
        const img = $(el).find('img').first();
        movies.push({
          title: $(el).find('.poster-title').text().trim(),
          url: a.attr('href')?.startsWith('http') ? a.attr('href') : LK21_BASE + (a.attr('href') || ''),
          quality: $(el).find('.poster .label').text().trim(),
          rating: $(el).find('.rating').text().trim(),
          poster: img.attr('src') || '',
        });
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "LK21",
        total: movies.length,
        data: movies,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/v1/movie/detail', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ success: false, error: "Parameter 'url' required" });
    
    try {
      const html = await lk21Get(url);
      const $ = cheerio.load(html);
      
      const downloads: any[] = [];
      $('a[href*="download"], a[title*="Download"]').each((_, a) => {
        const href = $(a).attr('href') || '';
        if (href && href !== '#') downloads.push({
          text: $(a).text().trim() || 'Download',
          url: href.startsWith('http') ? href : LK21_BASE + href
        });
      });
      
      const players: any[] = [];
      $('#player-list a[data-url]').each((_, a) => {
        players.push({
          server: $(a).attr('data-server') || $(a).text().trim(),
          url: $(a).attr('data-url') || $(a).attr('href')
        });
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "LK21",
        title: $('h1').first().text().trim(),
        synopsis: $('.synopsis').text().trim(),
        rating: $('.rating-number').attr('data-base-rating') || '',
        downloads,
        players,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/v1/movie/stream', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ success: false, error: "Parameter 'url' required" });
    
    try {
      const html = await lk21Get(url);
      const $ = cheerio.load(html);
      
      const players: any[] = [];
      $('#player-list a[data-url]').each((_, a) => {
        players.push({
          server: $(a).attr('data-server') || $(a).text().trim(),
          url: $(a).attr('data-url') || $(a).attr('href')
        });
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "LK21",
        title: $('h1').first().text().trim(),
        players,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // ============ TOKUSATSU ROUTES ============

  app.get('/api/v1/tokusatsu/home', async (_req: Request, res: Response) => {
    try {
      const html = await tokusatsuGet(`${TOKUSATSU_BASE}/`);
      const $ = cheerio.load(html);
      
      const slider: any[] = [];
      $('.gmr-slider-content').each((_, el) => {
        const title = $(el).find('.gmr-slide-titlelink').text().trim();
        const link = $(el).find('.gmr-slide-titlelink').attr('href');
        if (title && link) slider.push({ title, link });
      });
      
      const updates: any[] = [];
      $('article.item-infinite').each((_, el) => {
        const title = $(el).find('h2.entry-title a').text().trim();
        const link = $(el).find('h2.entry-title a').attr('href');
        if (title && link) updates.push({ title, link });
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "TokusatsuIndo",
        slider,
        updates,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/v1/tokusatsu/search', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ success: false, error: "Parameter 'q' required" });
    
    try {
      const html = await tokusatsuGet(`${TOKUSATSU_BASE}/?s=${encodeURIComponent(q)}`);
      const $ = cheerio.load(html);
      
      const results: any[] = [];
      $('article.item-infinite').each((_, el) => {
        const title = $(el).find('h2.entry-title a').text().trim();
        const link = $(el).find('h2.entry-title a').attr('href');
        if (title && link) results.push({ title, link });
      });
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "TokusatsuIndo",
        query: q,
        total: results.length,
        results,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/v1/tokusatsu/watch', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ success: false, error: "Parameter 'url' required" });
    
    try {
      const html = await tokusatsuGet(url);
      const $ = cheerio.load(html);
      
      const playerContainer = $('#muvipro_player_content_id');
      if (playerContainer.length === 0) {
        return res.status(400).json({ success: false, error: "Not an episode page" });
      }
      
      const postId = playerContainer.attr('data-id');
      const servers: any[] = [];
      $('ul.muvipro-player-tabs > li > a').each((_, el) => {
        servers.push({
          name: $(el).text().trim(),
          tab: $(el).attr('href')?.replace('#', '')
        });
      });
      
      let streamUrl = null;
      if (servers.length > 0 && postId) {
        const postBody = `action=muvipro_player_content&tab=${servers[0].tab}&post_id=${postId}`;
        const streamHtml = await tokusatsuPost(
          `${TOKUSATSU_BASE}/wp-admin/admin-ajax.php`,
          postBody,
          url
        );
        const $stream = cheerio.load(streamHtml);
        const iframe = $stream('iframe');
        if (iframe.length > 0) {
          streamUrl = iframe.attr('src');
        }
      }
      
      return res.json({
        success: true,
        creator: "Megan APIs v3.6.5",
        provider: "TokusatsuIndo",
        title: $('h1.entry-title').text().trim(),
        post_id: postId,
        servers,
        stream_url: streamUrl,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  console.log("✅ Movie Routes Registered:");
  console.log("  SEEGORE:");
  console.log("    GET /v1/seegore/home");
  console.log("    GET /v1/seegore/search?q=...");
  console.log("    GET /v1/seegore/watch?url=...");
  console.log("  LK21 MOVIES:");
  console.log("    GET /v1/movie/home");
  console.log("    GET /v1/movie/detail?url=...");
  console.log("    GET /v1/movie/stream?url=...");
  console.log("  TOKUSATSU:");
  console.log("    GET /v1/tokusatsu/home");
  console.log("    GET /v1/tokusatsu/search?q=...");
  console.log("    GET /v1/tokusatsu/watch?url=...");
}
