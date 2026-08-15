import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { getSettings } from "./admin-settings";

// ─── IP Tracking ───────────────────────────────────────────────────────────

interface IpRecord {
  ip: string;
  count: number;
  endpoints: Record<string, number>;
  lastSeen: number;
}

const ipMap = new Map<string, IpRecord>();

export function trackIpRequest(ip: string, endpoint: string): void {
  const now = Date.now();
  let record = ipMap.get(ip);
  if (!record) {
    record = { ip, count: 0, endpoints: {}, lastSeen: now };
    ipMap.set(ip, record);
  }
  record.count++;
  record.endpoints[endpoint] = (record.endpoints[endpoint] || 0) + 1;
  record.lastSeen = now;
  
  if (Math.random() < 0.001) {
    for (const [key, val] of ipMap.entries()) {
      if (now - val.lastSeen > 3600000) ipMap.delete(key);
    }
  }
}

export function getTopIpsToday(): IpRecord[] {
  return Array.from(ipMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

export function getSecurityStats() {
  return {
    totalIpsTracked: ipMap.size,
    topIps: getTopIpsToday(),
  };
}

// ─── Rate Limiters ─────────────────────────────────────────────────────────

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts, please try again later." },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "API rate limit exceeded. Slow down!" },
});

export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Download rate limit exceeded. Max 20 requests per minute." },
});

export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Admin rate limit exceeded." },
});

// ─── Bot / Scanner Blocker ─────────────────────────────────────────────────

const SCANNER_PATTERNS = [
  "sqlmap", "nikto", "nmap", "scrapy", "nuclei", "masscan",
  "dirbuster", "gobuster", "ffuf", "wfuzz", "hydra",
  "burpsuite", "acunetix", "nessus", "openvas", "zgrab",
];

export function botBlocker(req: Request, res: Response, next: NextFunction): void {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  
  if (SCANNER_PATTERNS.some(pattern => ua.includes(pattern))) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }
  
  if (req.path.startsWith("/api") && !ua.trim()) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }
  
  next();
}

// ─── IP Blocklist Guard ────────────────────────────────────────────────────

export function ipBlocklistGuard(req: Request, res: Response, next: NextFunction): void {
  const settings = getSettings();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  
  if (settings.ipBlocklist?.includes(ip)) {
    res.status(403).json({ success: false, error: "Access denied" });
    return;
  }
  
  next();
}

export const blocklist = {
  add(ip: string): void {
    const settings = getSettings();
    if (!settings.ipBlocklist) settings.ipBlocklist = [];
    if (!settings.ipBlocklist.includes(ip)) {
      settings.ipBlocklist.push(ip);
      saveSettings(settings);
    }
  },
  remove(ip: string): void {
    const settings = getSettings();
    if (settings.ipBlocklist) {
      settings.ipBlocklist = settings.ipBlocklist.filter(i => i !== ip);
      saveSettings(settings);
    }
  },
  list(): string[] {
    return getSettings().ipBlocklist || [];
  }
};

import { saveSettings } from "./admin-settings";

// ─── Security Headers ──────────────────────────────────────────────────────

export function securityHeaders(): ReturnType<typeof helmet> {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "blob:", "https:"],
        connectSrc: ["'self'", "https:", "wss:"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
  });
}

// ─── Source File Access Blocker ────────────────────────────────────────────

export function blockDirectSourceAccess(req: Request, res: Response, next: NextFunction): void {
  const p = req.path.toLowerCase();
  const blocked = [".ts", ".tsx", ".map", ".env"];
  const blockedPaths = ["/server/", "/lib/", "/shared/", "/.git/", "/node_modules/"];
  
  if (blocked.some(ext => p.endsWith(ext)) || blockedPaths.some(bp => p.includes(bp))) {
    res.status(404).json({ success: false, error: "Not found" });
    return;
  }
  next();
}

// ─── Response Fingerprinting ───────────────────────────────────────────────

export function responseFingerprint(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (body && typeof body === "object") {
      // Only add metadata if not already present (for legacy routes)
      if (!body.api_info) {
        // Legacy route - add basic metadata at the end
        body.api_name = "Megan APIs";
        body.version = "3.6.4";
        body.creator = "Tracker Wanga";
        body.tech = "Megan Tech";
      }
      // If already has api_info, don't duplicate
    }
    return originalJson(body);
  };
  next();
}

// ─── Anti-Clone (protect endpoint list from non-browser access) ────────────

export function antiClone(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/api/endpoints/list") {
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    if (!ua || !ua.includes("mozilla")) {
      res.status(403).json({ success: false, error: "Browser access required" });
      return;
    }
  }
  next();
}
