import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { exec } from "child_process";
import cors from "cors";
import {
  securityHeaders,
  antiClone,
  responseFingerprint,
  blockDirectSourceAccess,
  ipBlocklistGuard,
  botBlocker,
  globalLimiter,
} from "./security";

function autoUpdateYtDlp() {
  const { existsSync } = require("fs");
  if (existsSync("./yt-dlp")) {
    console.log("[yt-dlp] Found local binary (./yt-dlp) — ready");
  } else if (existsSync("/usr/bin/yt-dlp") || existsSync("/usr/local/bin/yt-dlp")) {
    console.log("[yt-dlp] Found system binary — ready");
  } else {
    console.log("[yt-dlp] Not found — will use Node.js fallbacks (SnapInsta, GraphQL)");
  }
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.set("trust proxy", 1);
app.set("query parser", "extended");

// CORS — allow all origins for public API
app.use(cors());

// Security middleware
app.use(securityHeaders());
app.use(ipBlocklistGuard);
app.use(globalLimiter);
app.use(botBlocker);
app.use(blockDirectSourceAccess);
app.use(antiClone);
app.use(responseFingerprint);

app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// URL decode validator
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    decodeURIComponent(req.path);
    if (req.query) {
      for (const key of Object.keys(req.query)) {
        const val = req.query[key];
        if (typeof val === "string") {
          decodeURIComponent(val);
        }
      }
    }
  } catch (e) {
    return res.status(400).json({ error: "Malformed URL encoding" });
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  autoUpdateYtDlp();

  await registerRoutes(httpServer, app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return;
    }

    return res.status(status).json({ success: false, error: message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
