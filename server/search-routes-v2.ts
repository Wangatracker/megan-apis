import type { Express, Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

// ============================================
// V2 SEARCH ROUTES (All Working)
// ============================================

// 1. Gitagram (Music Chords)
async function gitagramSearch(query: string) {
  const response = await axios.get(`https://www.gitagram.com/index.php?cat=&s=${encodeURIComponent(query)}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(response.data);
  const results: any[] = [];
  $('table.table tbody tr').each((_, el) => {
    results.push({
      title: $(el).find('span.title.is-6').text().trim(),
      artist: $(el).find('span.subtitle.is-6').text().replace('&#8227; ', '').trim(),
      link: $(el).find('a').attr('href'),
    });
  });
  return results;
}

// 2. Lahelu Search
async function laheluSearch(query: string) {
  const response = await axios.get(`https://lahelu.com/api/post/get-search?query=${encodeURIComponent(query)}`, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://lahelu.com',
      'Origin': 'https://lahelu.com',
    },
  });
  return response.data?.postInfos || [];
}

// 3. Mangatoon Search
async function mangatoonSearch(query: string) {
  const response = await axios.get(`https://mangatoon.mobi/en/search?word=${encodeURIComponent(query)}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(response.data);
  const results: any[] = [];
  $('.recommend-item').each((_, el) => {
    results.push({
      title: $(el).find('.recommend-comics-title span').text().trim(),
      image: $(el).find('.comics-image img').attr('data-src'),
      link: $(el).find('a').attr('href'),
    });
  });
  return results;
}

// 4. MCPEDL Search
async function mcpedlSearch(query: string) {
  const response = await axios.get(`https://mcpedl.org/?s=${encodeURIComponent(query)}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(response.data);
  const results: any[] = [];
  $('.g-block.size-20 article').each((i, el) => {
    if (i >= 10) return;
    results.push({
      title: $(el).find('.entry-title a').text().trim(),
      link: $(el).find('.entry-title a').attr('href'),
      image: $(el).find('.post-thumbnail img').attr('src') || $(el).find('.post-thumbnail img').attr('data-srcset'),
      rating: $(el).find('.rating-wrapper span').text().trim(),
    });
  });
  return results;
}

// 5. MyInstants Search
async function myInstantsSearch(query: string) {
  const response = await axios.get(`https://www.myinstants.com/en/search/?name=${encodeURIComponent(query)}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(response.data);
  const results: any[] = [];
  $('.instant').each((_, el) => {
    const onclick = $(el).find('button.small-button').attr('onclick') || '';
    const soundUrl = onclick.match(/play\('([^']+)'/)?.[1] || '';
    results.push({
      title: $(el).find('a.instant-link').text().trim(),
      sound_url: soundUrl.startsWith('http') ? soundUrl : `https://www.myinstants.com${soundUrl}`,
      page_url: $(el).find('a.instant-link').attr('href'),
    });
  });
  return results;
}

// 6. Otakotaku Search (Anime)
async function otakotakuSearch(query: string) {
  const response = await axios.get(`https://otakotaku.com/search?q=${encodeURIComponent(query)}&q_filter=semua`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(response.data);
  const results: any[] = [];
  $('.anime-result .anime-grid').each((_, el) => {
    results.push({
      title: $(el).find('small').text().trim(),
      image: $(el).find('img').attr('src'),
      url: $(el).find('a').attr('href'),
    });
  });
  return results;
}

// 7. ResepKoki Search (Recipes)
async function resepSearch(query: string) {
  const response = await axios.get(`https://resepkoki.id/?s=${encodeURIComponent(query)}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(response.data);
  const results: any[] = [];
  $('article').each((_, el) => {
    const link = $(el).find('h3 a').attr('href');
    if (link && link.includes('/resep')) {
      results.push({
        title: $(el).find('h3 a').text().trim(),
        link,
        image: $(el).find('img').attr('src'),
      });
    }
  });
  return results;
}

// 8. SoundCloud Search
async function soundcloudSearch(query: string) {
  const response = await axios.get('https://api-mobi.soundcloud.com/search', {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': `https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`,
    },
    params: {
      q: query,
      client_id: 'KKzJxmw11tYpCs6T24P4uUYhqmjalG6M',
    },
  });
  return response.data?.collection || [];
}

// 9. Spotify Search (Official API)
async function spotifySearch(query: string) {
  const tokenRes = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from('7bbae52593da45c69a27c853cc22edff:88ae1f7587384f3f83f62a279e7f87af').toString('base64'),
    },
  });
  
  const response = await axios.get('https://api.spotify.com/v1/search', {
    timeout: 15000,
    headers: { 'Authorization': `Bearer ${tokenRes.data.access_token}` },
    params: { q: query, type: 'track', limit: 20, market: 'US' },
  });
  
  return response.data.tracks?.items || [];
}

// ============================================
// REGISTER ROUTES
// ============================================
export function registerSearchRoutesV2(app: Express): void {

  app.get('/api/v2/search/gitagram', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await gitagramSearch(q);
      return res.json({ status: true, provider: "Gitagram", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/lahelu', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await laheluSearch(q);
      return res.json({ status: true, provider: "Lahelu", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/mangatoon', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await mangatoonSearch(q);
      return res.json({ status: true, provider: "Mangatoon", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/mcpedl', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await mcpedlSearch(q);
      return res.json({ status: true, provider: "MCPEDL", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/myinstants', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await myInstantsSearch(q);
      return res.json({ status: true, provider: "MyInstants", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/otakotaku', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await otakotakuSearch(q);
      return res.json({ status: true, provider: "Otakotaku", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/resep', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await resepSearch(q);
      return res.json({ status: true, provider: "ResepKoki", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/soundcloud', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await soundcloudSearch(q);
      return res.json({ status: true, provider: "SoundCloud", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/search/spotify', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await spotifySearch(q);
      return res.json({ status: true, provider: "Spotify", results: result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ V2 Search Routes Registered:");
  console.log("  /api/v2/search/{gitagram,lahelu,mangatoon,mcpedl,myinstants,otakotaku,resep,soundcloud,spotify}");
}
