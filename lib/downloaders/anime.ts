// Megan APIs — Anime Image Fetcher
// Serves directly from R2 CDN — no more blocking!

const CDN_BASE = 'https://anime-cdn.megan.qzz.io/anime';

// How many files we have per type on R2
const COUNTS: Record<string, number> = {
  hug: 30, kiss: 30, slap: 30, pat: 30,
  cry: 20, dance: 30, laugh: 30, cuddle: 7,
  waifu: 26
};

// Map extensions — waifu has mixed formats
const EXT: Record<string, string> = {
  waifu: '' // handled per file
};

// Some waifu files have different extensions
const WAIFU_EXTS = ['png','png','jpeg','jpg','jpg','jpg','jpeg','jpg','jpeg','jpg','jpg','jpg','jpeg','png','png','jpg','png','png','png','jpg','jpeg','jpeg','jpg','png','png','png'];

function randomFile(type: string): string {
  const max = COUNTS[type] || 20;
  const num = Math.floor(Math.random() * max) + 1;
  const padded = String(num).padStart(3, '0');
  
  if (type === 'waifu') {
    const ext = WAIFU_EXTS[num - 1] || 'png';
    return `${CDN_BASE}/waifu/${padded}.${ext}`;
  }
  
  return `${CDN_BASE}/${type}/${padded}.gif`;
}

export async function fetchAnimeImage(type: string): Promise<{ url: string; type: string; source: string; updated: string }> {
  const t = type.toLowerCase().trim();
  
  if (!COUNTS[t]) {
    throw new Error(`No images for "${t}". Available: ${Object.keys(COUNTS).join(', ')}`);
  }

  return {
    url: randomFile(t),
    type: t,
    source: 'Megan R2 CDN',
    updated: '2026-07-25'
  };
}
