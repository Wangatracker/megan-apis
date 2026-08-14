import type { Express, Request, Response } from "express";
import axios from "axios";

// ============================================
// MOVIEBOX STREAMING ROUTES
// ============================================

const MOVIEBOX_BASE = 'https://h5-api.aoneroom.com';
const MOVIEBOX_PLAY = 'https://themoviebox.xyz';
const MOVIEBOX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

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

class MovieboxClient {
  private token: string | null = null;

  async initToken(): Promise<string> {
    const response = await axios.get(`${MOVIEBOX_BASE}/wefeed-h5api-bff/home?host=themoviebox.xyz`, {
      timeout: 15000,
      headers: { 'User-Agent': MOVIEBOX_UA }
    });

    const setCookie = response.headers['set-cookie']?.join('; ') || '';
    const tokenMatch = setCookie.match(/token=([^;]+)/);
    if (tokenMatch) {
      this.token = tokenMatch[1];
      return this.token;
    }

    const xUser = response.headers['x-user'];
    if (xUser) {
      const parsed = JSON.parse(xUser);
      if (parsed.token) {
        this.token = parsed.token;
        return this.token;
      }
    }

    throw new Error('Failed to get token');
  }

  async getToken(): Promise<string> {
    if (!this.token) {
      return this.initToken();
    }
    return this.token;
  }

  async request(path: string, method: 'GET' | 'POST' = 'GET', body?: any, extraHeaders: any = {}) {
    const token = await this.getToken();
    
    const headers = {
      'User-Agent': MOVIEBOX_UA,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders
    };

    const config: any = {
      timeout: 20000,
      headers,
    };

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
      keyword,
      page,
      perPage: 20,
      subjectType: 0
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
    
    const response = await axios.get(`${MOVIEBOX_PLAY}/wefeed-h5api-bff/subject/play`, {
      timeout: 20000,
      headers: {
        'User-Agent': MOVIEBOX_UA,
        'Authorization': `Bearer ${token}`,
        'Referer': `${MOVIEBOX_PLAY}/movies/${slug}`,
      },
      params: {
        subjectId,
        se,
        ep,
        detailPath,
        streamSignType: 1
      }
    });
    
    return response.data;
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
    const { subjectId, detailPath, se, ep } = req.query;
    if (!subjectId || !detailPath) {
      return res.status(400).json({ status: false, error: "Parameters 'subjectId' and 'detailPath' required" });
    }
    try {
      const result = await moviebox.getStream(
        subjectId as string,
        detailPath as string,
        parseInt(se as string) || 0,
        parseInt(ep as string) || 0
      );

      // Add proxied URLs to each stream
      if (result.data?.streams) {
        const host = req.headers.host || 'apis.megan.qzz.io';
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const baseUrl = `${protocol}://${host}`;

        result.data.streams = result.data.streams.map((stream: any) => ({
          ...stream,
          proxy_url: `${baseUrl}/api/v2/moviebox/proxy?url=${encodeURIComponent(stream.url)}`,
        }));
      }

      return res.json({ status: true, provider: "Moviebox", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
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
    
    // Return list of available rankings
    return res.json({
      status: true,
      provider: "Moviebox",
      available_rankings: Object.keys(RANKING_LISTS),
    });
  });


// ─── STREAM PROXY (streams video through our server) ───────────────
  app.get('/api/v2/moviebox/proxy', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });

    try {
      // Fetch stream from CDN with proper headers
      const response = await axios.get(url, {
        timeout: 30000,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
          'Referer': 'https://themoviebox.xyz/',
          'Origin': 'https://themoviebox.xyz',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      // Set response headers
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', response.headers['content-length'] || '');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Pipe the stream to client
      response.data.pipe(res);

      response.data.on('error', (error: any) => {
        if (!res.headersSent) {
          res.status(500).json({ status: false, error: error.message });
        }
      });

    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });


  console.log("✅ Moviebox Routes Registered:");
  console.log("  GET /api/v2/search/moviebox");
  console.log("  GET /api/v2/moviebox/home");
  console.log("  GET /api/v2/moviebox/trending");
  console.log("  GET /api/v2/moviebox/detail");
  console.log("  GET /api/v2/moviebox/stream");
  console.log("  GET /api/v2/moviebox/ranking");
}

// ─── STREAM PROXY (bypasses 429 rate limiting) ───────────────
app.get('/api/v2/moviebox/proxy', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });

  try {
    // Get fresh token for auth
    const token = await moviebox.getToken();
    
    // Fetch stream from CDN with proper headers
    const response = await axios.get(url, {
      timeout: 30000,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        'Referer': 'https://themoviebox.xyz/',
        'Origin': 'https://themoviebox.xyz',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Set response headers
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', response.headers['content-length'] || '');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe the stream to client
    response.data.pipe(res);

    response.data.on('error', (error: any) => {
      if (!res.headersSent) {
        res.status(500).json({ status: false, error: error.message });
      }
    });

  } catch (e: any) {
    return res.status(500).json({ status: false, error: e.message });
  }
});
