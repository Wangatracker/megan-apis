// Megan APIs — Anime Image Fetcher
// Uses pre-fetched CDN catalog (updated every 12h by GitHub Actions)

const CATALOG_URL = 'https://raw.githubusercontent.com/Wangatracker/megan-apis/main/anime-cdn/catalog.json';
const FALLBACK_URL = 'https://raw.githubusercontent.com/Wangatracker/megan-apis/main/anime-cdn';

let catalogCache: any = null;

async function getCatalog(): Promise<Record<string, { urls: string[]; updated: string }>> {
  if (catalogCache) return catalogCache;
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error('Catalog not available');
  catalogCache = await res.json();
  return catalogCache;
}

export async function fetchAnimeImage(type: string): Promise<{ url: string; type: string; source: string; updated: string }> {
  const t = type.toLowerCase().trim();
  const catalog = await getCatalog();
  
  const data = catalog[t];
  if (!data?.urls?.length) {
    throw new Error(`No images for "${t}"`);
  }
  
  const randomUrl = data.urls[Math.floor(Math.random() * data.urls.length)];
  
  return {
    url: randomUrl,
    type: t,
    source: 'nekos.best',
    updated: data.updated
  };
}
