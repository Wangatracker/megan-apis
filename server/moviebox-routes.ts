import type { Express, Request, Response } from "express";
import axios from "axios";

// ============================================
// MOVIEBOX STREAMING ROUTES
// ============================================

const MOVIEBOX_BASE = 'https://h5-api.aoneroom.com';
const PYTHON_STREAM_API = "https://megan-moviebox-api1.onrender.com";
const MOVIEBOX_PLAY_DOMAINS = [
  'https://themoviebox.xyz',
  'https://netfilm.world',
  'https://123movienow.cc',
];
const MOVIEBOX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const STATIC_UUID = 'd8c3539e-2e46-4000-af20-7046a856e30a';

const RANKING_LISTS = {
  TRENDING_NOW: "872031290915189720",
  TRENDING_MOVIE: "8821254238245470240",
  TRENDING_DRAMA: "8617025562613270856",
  TRENDING_ANIME: "567783349092340776",
  INDO_FILM: "6528093688173053896",
  K_DRAMA: "4380734070238626200",
  INDO_DRAMA: "5283462032510044280",
  ANIME: "8617025562613270856",
  HOLLYWOOD: "1469286917119311888",
  C_DRAMA: "8624142774394406504",
  INDO_HORROR: "5848753831881965888",
  THAI_DRAMA: "1164329479448281992",
  SHORT_TV: "567783349092340776",
  FUNNY_HORROR_CRIME: "3528002473103362040",
  INDO_DUBBED: "5549742004948601072",
  RECENTLY_ADDED: "4019055174353407000",
  INDONESIAN_KILLERS: "5863917898430924656",
  HAPPY_LIFE: "4993310637209048808",
  RUN_ESCAPE_DEATH: "8703838933408530536",
  BAD_ROMANCE: "4539350473970797944",
  CYBERPUNK: "3766111568753312664",
  MONSTER_TITAN: "1653005382303864120",
  SEA_ADVENTURE: "6708972608207443352"
};

// Helper: random delay to feel human
function randomDelay(min = 100, max = 500) {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

class MovieboxClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  async initToken(): Promise<string> {
    // Try multiple endpoints to get a token
    const endpoints = [
      `${MOVIEBOX_BASE}/wefeed-h5api-bff/home?host=themoviebox.xyz`,
      `${MOVIEBOX_BASE}/wefeed-h5api-bff/home?host=moviebox.ph`,
    ];

    for (const url of endpoints) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: { 'User-Agent': MOVIEBOX_UA, 'Accept': 'application/json' }
        });

        const setCookie = response.headers['set-cookie']?.join('; ') || '';
        const tokenMatch = setCookie.match(/token=([^;]+)/);
        if (tokenMatch) {
          this.token = tokenMatch[1];
          this.tokenExpiry = Date.now() + (90 * 24 * 60 * 60 * 1000);
          return this.token;
        }

        const xUser = response.headers['x-user'];
        if (xUser) {
          const parsed = JSON.parse(xUser);
          if (parsed.token) {
            this.token = parsed.token;
            this.tokenExpiry = Date.now() + (90 * 24 * 60 * 60 * 1000);
            return this.token;
          }
        }
      } catch (e) {
        console.log(`  Token failed for ${url}: ${(e as any).message}`);
      }
      await randomDelay(200, 400);
    }

    throw new Error('Failed to get token from all endpoints');
  }

  async getToken(): Promise<string> {
    if (!this.token || Date.now() > this.tokenExpiry) {
      return this.initToken();
    }
    return this.token;
  }

  async request(path: string, method: 'GET' | 'POST' = 'GET', body?: any) {
    const token = await this.getToken();
    const headers = {
      'User-Agent': MOVIEBOX_UA,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config: any = { timeout: 15000, headers };

    if (method === 'POST') {
      config.method = 'POST';
      config.data = body;
    } else {
      config.method = 'GET';
      config.params = body;
    }

    const response = await axios(`${MOVIEBOX_BASE}${path}`, config);
    return response.data;
  }

  async search(keyword: string, page = 1) {
    return this.request('/wefeed-h5api-bff/subject/search', 'POST', {
      keyword, page, perPage: 20, subjectType: 0
    });
  }

  async getHome() {
    return this.request('/wefeed-h5api-bff/home?host=themoviebox.xyz');
  }

  async getTrending(page = 0) {
    return this.request(`/wefeed-h5api-bff/subject/trending?page=${page}&perPage=20`);
  }

  async getDetail(detailPath: string) {
    return this.request(`/wefeed-h5api-bff/detail?detailPath=${detailPath}`);
  }

  async getStream(subjectId: string, detailPath: string, se = 0, ep = 0) {
    const slug = detailPath.split('/').filter(Boolean).pop() || detailPath;
    const token = await this.getToken();

    // Try multiple play domains
    for (const domain of MOVIEBOX_PLAY_DOMAINS) {
      try {
        const response = await axios.get(`${domain}/wefeed-h5api-bff/subject/play`, {
          timeout: 10000,
          headers: {
            'User-Agent': MOVIEBOX_UA,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Referer': `${domain}/spa/videoPlayPage/movies/${slug}`,
            'Cookie': `uuid=${STATIC_UUID}; token=${token}`,
          },
          params: { subjectId, se, ep, detailPath, streamSignType: 1 }
        });

        if (response.data?.code === 0 && response.data?.data?.streams?.length > 0) {
          console.log(`  Stream success from ${domain}`);
          return response.data;
        }
        console.log(`  ${domain}: no streams (code ${response.data?.code})`);
      } catch (e) {
        console.log(`  ${domain}: ${(e as any).message}`);
      }
      await randomDelay(150, 300);
    }

    // Return a clean empty response instead of throwing
    return {
      code: 0,
      message: 'ok',
      data: {
        streams: [],
        freeNum: 0,
        limited: true,
        limitedCode: 'no_streams_available',
        dash: [],
        hls: [],
        hasResource: false,
        vipLocked: false,
        codecPriority: [],
        playConfig: { adFree: false, maxResolution: 0 }
      }
    };
  }

  async getRanking(rankingId: string, page = 1) {
    return this.request(`/wefeed-h5api-bff/ranking-list/content?id=${rankingId}&page=${page}&perPage=20`);
  }
}

const moviebox = new MovieboxClient();

// ============================================
// REGISTER ROUTES
// ============================================
export function registerMovieboxRoutes(app: Express): void {

  // Search
  app.get('/api/v2/search/moviebox', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await moviebox.search(q, page);
      return res.json({ status: true, provider: "Moviebox", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Home
  app.get('/api/v2/moviebox/home', async (_req: Request, res: Response) => {
    try {
      const result = await moviebox.getHome();
      return res.json({ status: true, provider: "Moviebox", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Trending
  app.get('/api/v2/moviebox/trending', async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 0;
    try {
      const result = await moviebox.getTrending(page);
      return res.json({ status: true, provider: "Moviebox", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Detail
  app.get('/api/v2/moviebox/detail', async (req: Request, res: Response) => {
    const detailPath = req.query.detailPath as string;
    if (!detailPath) return res.status(400).json({ status: false, error: "Parameter 'detailPath' required" });
    try {
      const result = await moviebox.getDetail(detailPath);
      return res.json({ status: true, provider: "Moviebox", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  // Stream (returns both original and proxied URLs)
  app.get('/api/v2/moviebox/stream', async (req: Request, res: Response) => {
    const { subjectId, se, ep, quality, format } = req.query;
    if (!subjectId) {
      return res.status(400).json({ status: false, error: "Parameter 'subjectId' required" });
    }

    try {
      const qs = new URLSearchParams();
      if (se) qs.set('se', String(se));
      if (ep) qs.set('ep', String(ep));
      if (quality) qs.set('quality', String(quality));
      if (format) qs.set('format', String(format));

      const upstream = await axios.get(
        `${PYTHON_STREAM_API}/api/stream/${subjectId}?${qs.toString()}`,
        { timeout: 45000 }
      );

      const host = req.headers.host || 'apis.megan.qzz.io';
      const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
      const baseUrl = `${protocol}://${host}`;

      const streams = (upstream.data.streams || []).map((s: any) => ({
        ...s,
        proxy_url: `${baseUrl}/api/v2/moviebox/proxy-v3?url=${encodeURIComponent(s.url)}`,
      }));

      return res.json({
        status: true,
        provider: "Moviebox",
        source: "python-bridge",
        subject_id: upstream.data.subject_id,
        season: upstream.data.season,
        episode: upstream.data.episode,
        count: streams.length,
        available_formats: upstream.data.available_formats || [],
        streams,
        note: upstream.data.note,
      });
    } catch (e: any) {
      return res.status(502).json({
        status: false,
        error: e.message,
        hint: "Python API may be cold-starting. Retry in 30s.",
      });
    }
  });

  // Ranking
  app.get('/api/v2/moviebox/ranking', async (req: Request, res: Response) => {
    const name = req.query.name as string;
    const page = parseInt(req.query.page as string) || 1;

    if (name && RANKING_LISTS[name as keyof typeof RANKING_LISTS]) {
      try {
        const result = await moviebox.getRanking(RANKING_LISTS[name as keyof typeof RANKING_LISTS], page);
        return res.json({ status: true, provider: "Moviebox", ranking: name, result });
      } catch (e: any) {
        return res.status(500).json({ status: false, error: e.message });
      }
    }

    return res.json({
      status: true,
      provider: "Moviebox",
      available_rankings: Object.keys(RANKING_LISTS),
    });
  });

  // Stream Proxy — delegates to Python resolver for CDN headers
  app.get('/api/v2/moviebox/proxy', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });

    const qs = new URLSearchParams({ url });
    for (const k of ['download', 'sub_id', 'se', 'ep', 'quality']) {
      if (req.query[k]) qs.set(k, String(req.query[k]));
    }

    try {
      const upstream = await axios.get(
        `${PYTHON_STREAM_API}/proxy?${qs.toString()}`,
        {
          responseType: 'stream',
          timeout: 60000,
          headers: { ...(req.headers.range ? { Range: req.headers.range } : {}) },
          validateStatus: () => true,
        }
      );

      const headersToRelay = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition'];
      headersToRelay.forEach((h) => {
        const v = upstream.headers[h];
        if (v) res.setHeader(h, v as string);
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(upstream.status || 200);
      upstream.data.pipe(res);
    } catch (e: any) {
      if (!res.headersSent) return res.status(502).json({ status: false, error: e.message });
    }
  });

  // proxy-v3 — alias referenced by /stream's proxy_url
  app.get('/api/v2/moviebox/proxy-v3', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });

    const qs = new URLSearchParams({ url });
    for (const k of ['download', 'sub_id', 'se', 'ep', 'quality']) {
      if (req.query[k]) qs.set(k, String(req.query[k]));
    }

    try {
      const upstream = await axios.get(
        `${PYTHON_STREAM_API}/proxy?${qs.toString()}`,
        {
          responseType: 'stream',
          timeout: 60000,
          headers: { ...(req.headers.range ? { Range: req.headers.range } : {}) },
          validateStatus: () => true,
        }
      );

      const headersToRelay = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition'];
      headersToRelay.forEach((h) => {
        const v = upstream.headers[h];
        if (v) res.setHeader(h, v as string);
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(upstream.status || 200);
      upstream.data.pipe(res);
    } catch (e: any) {
      if (!res.headersSent) return res.status(502).json({ status: false, error: e.message });
    }
  });

  console.log("✅ Moviebox Routes Registered (v3.7.1 - Multi-domain fallback):");
  console.log("  GET /api/v2/search/moviebox");
  console.log("  GET /api/v2/moviebox/home");
  console.log("  GET /api/v2/moviebox/trending");
  console.log("  GET /api/v2/moviebox/detail");
  console.log("  GET /api/v2/moviebox/stream");
  console.log("  GET /api/v2/moviebox/ranking");
  console.log("  GET /api/v2/moviebox/proxy");
}
