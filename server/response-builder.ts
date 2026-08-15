import type { Request } from "express";

// ─── API METADATA ──────────────────────────────────────────────────────────

export const API_INFO = {
  api_name: "Megan APIs",
  api_id: "megan-apis-v3",
  version: "3.7.0",
  creator: "Tracker Wanga",
  tech: "Megan Tech",
  channel_url: "https://whatsapp.com/channel/0029Vb0YxZaJZg4GJQYJYl1o",
} as const;

// ─── STATUS CODES ──────────────────────────────────────────────────────────

export const STATUS_CODES = {
  SUCCESS: { code: 200, name: "OK", meaning: "Request completed successfully" },
  CREATED: { code: 201, name: "Created", meaning: "Resource created successfully" },
  BAD_REQUEST: { code: 400, name: "Bad Request", meaning: "Missing or invalid parameters" },
  UNAUTHORIZED: { code: 401, name: "Unauthorized", meaning: "Invalid or missing API key" },
  FORBIDDEN: { code: 403, name: "Forbidden", meaning: "Access denied" },
  NOT_FOUND: { code: 404, name: "Not Found", meaning: "Resource or endpoint not found" },
  RATE_LIMITED: { code: 429, name: "Rate Limited", meaning: "Too many requests" },
  SERVER_ERROR: { code: 500, name: "Internal Server Error", meaning: "Something went wrong on our end" },
  BAD_GATEWAY: { code: 502, name: "Bad Gateway", meaning: "Upstream service failed" },
  SERVICE_UNAVAILABLE: { code: 503, name: "Service Unavailable", meaning: "Temporarily down" },
  TIMEOUT: { code: 504, name: "Gateway Timeout", meaning: "Upstream timed out" },
} as const;

export type StatusCodeKey = keyof typeof STATUS_CODES;

// ─── RESPONSE BUILDER ──────────────────────────────────────────────────────

function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function buildSuccessResponse(
  req: Request,
  category: string,
  categoryId: string,
  data: any,
  statusKey: StatusCodeKey = "SUCCESS",
  requestId?: string,
) {
  const status = STATUS_CODES[statusKey];
  const startTime = (req as any)._startTime || Date.now();
  
  return {
    // ─── API Info (always first) ───
    api_info: {
      ...API_INFO,
      api_id: requestId || `${API_INFO.api_id}-${Date.now().toString(36)}`,
    },
    
    // ─── Status (always second) ───
    status: {
      success: true,
      code: status.code,
      name: status.name,
      meaning: status.meaning,
    },
    
    // ─── Request Info (always third) ───
    request: {
      timestamp: new Date().toISOString(),
      category,
      category_id: categoryId,
      endpoint: req.path,
      method: req.method,
      requested_ip: getClientIp(req),
      response_time_ms: Date.now() - startTime,
    },
    
    // ─── Data (last) ───
    data,
  };
}

export function buildErrorResponse(
  req: Request,
  category: string,
  categoryId: string,
  error: string,
  statusKey: StatusCodeKey = "SERVER_ERROR",
) {
  const status = STATUS_CODES[statusKey];
  const startTime = (req as any)._startTime || Date.now();
  
  return {
    // ─── API Info (always first) ───
    api_info: {
      ...API_INFO,
      api_id: `${API_INFO.api_id}-${Date.now().toString(36)}`,
    },
    
    // ─── Status (always second) ───
    status: {
      success: false,
      code: status.code,
      name: status.name,
      meaning: status.meaning,
      error,
    },
    
    // ─── Request Info (always third) ───
    request: {
      timestamp: new Date().toISOString(),
      category,
      category_id: categoryId,
      endpoint: req.path,
      method: req.method,
      requested_ip: getClientIp(req),
      response_time_ms: Date.now() - startTime,
    },
  };
}
