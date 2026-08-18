// ─── Megan APIs Gateway — API Routes Only ──────────────────────────────────

const RENDER_URL = "https://megan-apis-33r1.onrender.com";
const PAGES_URL = "https://master.megan-apis-frontend.pages.dev";
const AUTH_URL = "https://auth.megan.qzz.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-admin-password, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

function corsResponse(body, status) {
  status = status || 200;
  return new Response(body, { status: status, headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }) });
}

async function proxyTo(url, request) {
  try {
    var response = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });
    var mod = new Response(response.body, response);
    Object.keys(corsHeaders).forEach(function(k) { mod.headers.set(k, corsHeaders[k]); });
    return mod;
  } catch (e) {
    return corsResponse(JSON.stringify({ error: "Service unavailable" }), 503);
  }
}

function getApiKey(request) {
  var url = new URL(request.url);
  return url.searchParams.get("apikey") || url.searchParams.get("api_key") || request.headers.get("x-api-key") || null;
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname;
    var method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ═══ AUTH ROUTES → Auth Worker ═══
    if (path.startsWith("/auth/") || path === "/login" || path === "/signup") {
      return proxyTo(AUTH_URL + path + url.search, request);
    }

    // ═══ PUBLIC API ROUTES (no key needed) ═══
    if (path === "/api/config/cards" || path === "/api/media/status" || path === "/api/status" || path === "/api/endpoints" || path === "/api/endpoints/search" || path === "/api/endpoints/categories" || path === "/api/endpoints/stats" || path === "/health") {
      return proxyTo(RENDER_URL + path + url.search, request);
    }

    // ═══ API KEY VALIDATION — via Auth Service ═══
    if (path.startsWith("/api/") || path.startsWith("/v1/") || path.startsWith("/download/") || path.startsWith("/files/") || path.startsWith("/proxy") || path.startsWith("/stream")) {
      
      // Key generation — public
      if (path === "/api/keys/generate" || path.startsWith("/api/keys/")) {
        return proxyTo(RENDER_URL + path + url.search, request);
      }

      // Admin routes — use admin password
      if (path.startsWith("/api/admin")) {
        return proxyTo(RENDER_URL + path + url.search, request);
      }

      // Validate API key
      var apikey = getApiKey(request);
      if (!apikey) {
        return corsResponse(JSON.stringify({
          success: false,
          error: "API key required. Get one at https://apis.megan.qzz.io/keys",
          creator: "Megan APIs by Tracker Wanga | Megan Tech"
        }), 401);
      }

      // Check key via Auth Service
      var keyValid = false;
      
      // Master key always works
      if (apikey === "megan_admin_master") {
        keyValid = true;
      }
      
      // Check Auth service
      if (!keyValid) {
        try {
          var keyCheck = await fetch(AUTH_URL + "/auth/verify-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: apikey, project: "megan-apis" }),
          });
          var keyResult = await keyCheck.json();
          keyValid = keyResult.valid === true;
        } catch (e) {
          keyValid = false;
        }
      }
      
      // Fallback: Check megan-db directly via D1 binding
      if (!keyValid && env && env.DB) {
        try {
          var dbKey = await env.DB.prepare(
            "SELECT key, active FROM api_keys WHERE key = ?"
          ).bind(apikey).first();
          keyValid = dbKey && dbKey.active === 1;
        } catch (e) {
          keyValid = false;
        }
      }
      
      if (!keyValid) {
        return corsResponse(JSON.stringify({
          success: false,
          error: "Invalid or revoked API key",
          creator: "Megan APIs by Tracker Wanga | Megan Tech"
        }), 403);
      }

      // Forward to Render
      var cleanUrl = new URL(RENDER_URL + path + url.search);
      cleanUrl.searchParams.delete("apikey");
      cleanUrl.searchParams.delete("api_key");
      return proxyTo(cleanUrl.toString(), request);
    }

    // ═══ FRONTEND — Serve from Cloudflare Pages ═══
    return proxyTo(PAGES_URL + path + url.search, request);
  },
};
