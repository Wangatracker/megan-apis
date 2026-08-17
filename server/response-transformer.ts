import type { Request, Response, NextFunction } from "express";

// ─── RESPONSE TRANSFORMER ──────────────────────────────────────────────────
// This middleware intercepts ALL responses and transforms them to the new format

const API_INFO = {
  api_name: "Megan APIs",
  api_id: "megan-apis-v3",
  version: "3.7.0",
  creator: "Tracker Wanga",
  tech: "Megan Tech",
  channel_url: "https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37",
} as const;

const STATUS_CODES: Record<number, string> = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  429: "Rate Limited",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function getCategory(path: string): { category: string; categoryId: string } {
  const segment = path.split('/').filter(Boolean);
  
  if (path.includes('/ai/')) return { category: "Artificial Intelligence", categoryId: "artificial-intelligence" };
  if (path.includes('/download/') || path.includes('/spotify/') || path.includes('/shazam/') || path.includes('/soundcloud/')) 
    return { category: "Media Downloader", categoryId: "media-downloader" };
  if (path.includes('/search/')) return { category: "Search & Discovery", categoryId: "search" };
  if (path.includes('/stalk/')) return { category: "Stalker & OSINT", categoryId: "stalker" };
  if (path.includes('/security/')) return { category: "Security & Hacking", categoryId: "security" };
  if (path.includes('/tools/') || path.includes('/encode/') || path.includes('/math/') || path.includes('/qr/') || path.includes('/converter/') || path.includes('/audio/'))
    return { category: "Tools & Utilities", categoryId: "tools" };
  if (path.includes('/fun/') || path.includes('/anime/') || path.includes('/game/') || path.includes('/content/'))
    return { category: "Fun & Entertainment", categoryId: "fun" };
  if (path.includes('/news/') || path.includes('/crypto/') || path.includes('/forex/') || path.includes('/sports/') || path.includes('/education/') || path.includes('/zodiac/') || path.includes('/jobs/'))
    return { category: "Data & Information", categoryId: "data" };
  if (path.includes('/tmdb/') || path.includes('/moviebox/') || path.includes('/movie/') || path.includes('/seegore/') || path.includes('/tokusatsu/'))
    return { category: "Media & Streaming", categoryId: "media" };
  if (path.includes('/ephoto/') || path.includes('/photofunia/') || path.includes('/textpro/'))
    return { category: "Text Effects", categoryId: "text-effects" };
  if (path.includes('/short/') || path.includes('/url/'))
    return { category: "URL & Hosting", categoryId: "url" };
  if (path.includes('/scrape/')) return { category: "Scraping", categoryId: "scraping" };
  if (path.includes('/image/')) return { category: "Image Processing", categoryId: "image-processing" };
  if (path.includes('/sticker/')) return { category: "Sticker", categoryId: "sticker" };
  if (path.includes('/admin/') || path.includes('/keys/') || path.includes('/endpoints/') || path.includes('/status') || path.includes('/config/'))
    return { category: "Admin & Management", categoryId: "admin" };
  
  return { category: "General", categoryId: "general" };
}

export function responseTransformer(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  const startTime = (req as any)._startTime || Date.now();
  
  res.json = function (body: any) {
    // If body is not an object or already has api_info, skip
    if (!body || typeof body !== 'object' || body.api_info) {
      return originalJson(body);
    }
    
    // Check if it's a Buffer or stream
    if (Buffer.isBuffer(body)) {
      return originalJson(body);
    }
    
    const statusCode = res.statusCode || 200;
    const statusName = STATUS_CODES[statusCode] || "Unknown";
    const isSuccess = statusCode < 400 && (body.success !== false);
    const { category, categoryId } = getCategory(req.path);
    
    // Extract data (remove old metadata fields)
    const {
      api_name: _api_name,
      version: _version,
      creator: _creator,
      tech: _tech,
      success: _success,
      error: _error,
      ...data
    } = body;
    
    const transformed = {
      api_info: {
        ...API_INFO,
        api_id: `${API_INFO.api_id}-${Date.now().toString(36)}`,
      },
      status: {
        success: isSuccess,
        code: statusCode,
        name: statusName,
        meaning: getStatusMeaning(statusCode),
        ...(body.error ? { error: body.error } : {}),
      },
      request: {
        timestamp: new Date().toISOString(),
        category,
        category_id: categoryId,
        endpoint: req.path,
        method: req.method,
        requested_ip: getClientIp(req),
        response_time_ms: Date.now() - startTime,
      },
      data: Object.keys(data).length > 0 ? data : null,
    };
    
    // Remove null data
    if (transformed.data === null) {
      delete transformed.data;
    }
    
    return originalJson(transformed);
  };
  
  next();
}

function getStatusMeaning(code: number): string {
  const meanings: Record<number, string> = {
    200: "Request completed successfully",
    201: "Resource created successfully",
    400: "Missing or invalid parameters",
    401: "Invalid or missing API key",
    403: "Access denied",
    404: "Resource or endpoint not found",
    429: "Too many requests, slow down",
    500: "Something went wrong on our end",
    502: "Upstream service failed",
    503: "Service temporarily down",
    504: "Upstream service timed out",
  };
  return meanings[code] || "Request processed";
}
