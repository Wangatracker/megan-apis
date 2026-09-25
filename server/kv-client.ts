// ─── CLOUDFLARE KV CLIENT (via REST API) ───────────────────────────────────
// Supports multiple namespaces:
//   CLOUDFLARE_KV_NAMESPACE_ID        → AI chat (default)
//   CLOUDFLARE_MEDIA_KV_NAMESPACE_ID  → Movies / media caching

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "2e8e0fc225cf7a576818c6d14f8be62c";
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const KV_CHAT_NS = process.env.CLOUDFLARE_KV_NAMESPACE_ID || "";
const KV_MEDIA_NS = process.env.CLOUDFLARE_MEDIA_KV_NAMESPACE_ID || "";

type Namespace = "chat" | "media";

function getNsId(ns: Namespace): string {
  return ns === "media" ? KV_MEDIA_NS : KV_CHAT_NS;
}

function baseUrl(ns: Namespace): string {
  return `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/storage/kv/namespaces/${getNsId(ns)}`;
}

export function kvConfigured(ns: Namespace = "chat"): boolean {
  return !!(CF_TOKEN && getNsId(ns));
}

export async function kvGet<T = any>(key: string, ns: Namespace = "chat"): Promise<T | null> {
  if (!kvConfigured(ns)) return null;
  try {
    const res = await fetch(`${baseUrl(ns)}/values/${encodeURIComponent(key)}`, {
      headers: { "Authorization": `Bearer ${CF_TOKEN}` },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text) as T;
  } catch (e: any) {
    console.error(`[KV:${ns}] get failed:`, e.message);
    return null;
  }
}

export async function kvPut(key: string, value: any, ns: Namespace = "chat"): Promise<boolean> {
  if (!kvConfigured(ns)) return false;
  try {
    const res = await fetch(`${baseUrl(ns)}/values/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${CF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    });
    return res.ok;
  } catch (e: any) {
    console.error(`[KV:${ns}] put failed:`, e.message);
    return false;
  }
}

export async function kvDelete(key: string, ns: Namespace = "chat"): Promise<boolean> {
  if (!kvConfigured(ns)) return false;
  try {
    const res = await fetch(`${baseUrl(ns)}/values/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${CF_TOKEN}` },
    });
    return res.ok;
  } catch (e: any) {
    console.error(`[KV:${ns}] delete failed:`, e.message);
    return false;
  }
}

// Convenience wrapper for media namespace
export const mediaKv = {
  get: <T = any>(key: string) => kvGet<T>(key, "media"),
  put: (key: string, value: any) => kvPut(key, value, "media"),
  delete: (key: string) => kvDelete(key, "media"),
  configured: () => kvConfigured("media"),
};
