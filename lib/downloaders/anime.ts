// Megan APIs — Anime Image Fetcher
// Uses pre-downloaded catalog (no API calls needed)

const CATALOG_URL = 'https://raw.githubusercontent.com/Wangatracker/megan-apis/main/anime-images/catalog.json';

let catalogCache: any = null;

async function getCatalog(): Promise<Record<string, { file: string; source: string }[]>> {
  if (catalogCache) return catalogCache;
  const res = await fetch(CATALOG_URL);
  catalogCache = await res.json();
  return catalogCache;
}

export async function fetchAnimeImage(type: string): Promise<{ url: string; type: string; source: string }> {
  const t = type.toLowerCase().trim();
  const catalog = await getCatalog();
  
  const images = catalog[t];
  if (!images || images.length === 0) {
    throw new Error(`No images found for "${t}"`);
  }
  
  const random = images[Math.floor(Math.random() * images.length)];
  const baseUrl = 'https://raw.githubusercontent.com/Wangatracker/megan-apis/main/anime-images';
  
  return {
    url: `${baseUrl}/${random.file}`,
    type: t,
    source: random.source
  };
}
