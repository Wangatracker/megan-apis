// ─── MEGAN KNOWLEDGE BASE ──────────────────────────────────────────────────
// Loads hosting, platform info, and provides smart retrieval for Hinatu.

import * as fs from "fs";
import * as path from "path";

interface HostingProvider {
  id: string;
  name: string;
  url: string;
  description: string;
  features?: string[];
  pricing?: string;
  best_for?: string;
  tagline?: string;
  official?: boolean;
}

interface PlatformInfo {
  creator: any;
  platform: any;
  authentication: any;
  rate_limits: any;
  support: any;
  ecosystem: { services: any[] };
  beginner_concepts: Record<string, string>;
  common_projects: string[];
}

let hostingCache: { providers: HostingProvider[] } | null = null;
let platformCache: PlatformInfo | null = null;

function loadHosting(): { providers: HostingProvider[] } {
  if (hostingCache) return hostingCache;
  try {
    const file = path.join(__dirname, "data", "hosting.json");
    hostingCache = JSON.parse(fs.readFileSync(file, "utf-8"));
    return hostingCache!;
  } catch (e: any) {
    console.error("[knowledge] hosting.json load failed:", e.message);
    return { providers: [] };
  }
}

function loadPlatform(): PlatformInfo | null {
  if (platformCache) return platformCache;
  try {
    const file = path.join(__dirname, "data", "platform.json");
    platformCache = JSON.parse(fs.readFileSync(file, "utf-8"));
    return platformCache;
  } catch (e: any) {
    console.error("[knowledge] platform.json load failed:", e.message);
    return null;
  }
}

// ─── HOSTING SEARCH ────────────────────────────────────────────────────────
export function searchHosting(query: string, limit: number = 4): HostingProvider[] {
  const kb = loadHosting();
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(w => w.length > 2);

  const scored = kb.providers.map((p) => {
    let score = 0;
    const haystack = [
      p.name, p.description, p.best_for || "", p.tagline || "",
      ...(p.features || []),
    ].join(" ").toLowerCase();

    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 3;
    }
    if (p.official && /\b(megan|host)\b/.test(q)) score += 5;

    return { provider: p, score };
  }).filter(x => x.score > 0);

  scored.sort((a, b) => b.score - a.score);

  // If nothing scored but the query mentions hosting-ish words, return all
  if (scored.length === 0 && /\b(host|deploy|publish|server|online)\b/.test(q)) {
    return kb.providers.slice(0, limit);
  }
  return scored.slice(0, limit).map(x => x.provider);
}

export function getHostingProvider(id: string): HostingProvider | null {
  const kb = loadHosting();
  return kb.providers.find(p => p.id === id) || null;
}

export function getAllHostingProviders(): HostingProvider[] {
  return loadHosting().providers;
}

// ─── PLATFORM INFO ─────────────────────────────────────────────────────────
export function getPlatformInfo(): PlatformInfo | null {
  return loadPlatform();
}

export function getEcosystem(): any[] {
  const p = loadPlatform();
  return p?.ecosystem?.services || [];
}

export function getBeginnerConcepts(): Record<string, string> {
  const p = loadPlatform();
  return p?.beginner_concepts || {};
}

// ─── FORMAT FOR PROMPT ─────────────────────────────────────────────────────
// Knowledge is context, not output. Give the LLM enough to reason, not to dump.

export function formatHostingForPrompt(providers: HostingProvider[]): string {
  if (providers.length === 0) return "";
  return providers.map(p => {
    const parts = [`- ${p.name} (${p.url})`];
    if (p.description) parts.push(`  ${p.description}`);
    if (p.best_for) parts.push(`  Best for: ${p.best_for}`);
    if (p.features?.length) parts.push(`  Features: ${p.features.join(", ")}`);
    if (p.pricing) parts.push(`  Pricing: ${p.pricing}`);
    return parts.join("\n");
  }).join("\n\n");
}

export function formatEcosystemForPrompt(): string {
  const services = getEcosystem();
  return services.map(s => `- ${s.name} (${s.url}) — ${s.purpose}`).join("\n");
}

export function formatPlatformSummaryForPrompt(): string {
  const p = loadPlatform();
  if (!p) return "";
  return `Megan APIs is a developer API platform with ${p.platform.total_endpoints}+ endpoints across ${p.platform.categories} categories.
Creator: ${p.creator.name}, ${p.creator.role}, based in ${p.creator.country}.
API keys: get one at ${p.platform.url} → Dashboard → API Keys.
Auth: add &api_key=YOUR_KEY to any request.`;
}
