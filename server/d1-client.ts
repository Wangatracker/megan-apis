// ─── D1 DATABASE CLIENT (via Cloudflare API) ──────────────────────────────

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "2e8e0fc225cf7a576818c6d14f8be62c";
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const D1_DATABASE_ID = process.env.D1_DATABASE_ID || "0d46ad04-712a-47fe-b855-eae8f7dd8ffc";
const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${D1_DATABASE_ID}`;

function cfHeaders() {
  return {
    "Authorization": `Bearer ${CF_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function d1Query(sql: string, params: any[] = []): Promise<any[]> {
  const res = await fetch(`${CF_BASE}/query`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify({ sql, params }),
  });
  
  const data = await res.json() as any;
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "D1 query failed");
  }
  
  return data.result?.[0]?.results || [];
}

export async function d1Execute(sql: string, params: any[] = []): Promise<any> {
  const res = await fetch(`${CF_BASE}/query`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify({ sql, params }),
  });
  
  const data = await res.json() as any;
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "D1 query failed");
  }
  
  return data.result?.[0];
}
