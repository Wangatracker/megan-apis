// Megan APIs — Anime Image Fetcher
export async function fetchAnimeImage(type: string): Promise<{ url: string; type: string; source: string }> {
  const t = type.toLowerCase().trim();
  
  try {
    // Use waifu.im with included_tags
    const url = `https://api.waifu.im/search?included_tags=${t}&many=false`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json() as any;
    const imageUrl = data?.images?.[0]?.url;
    if (imageUrl) return { url: imageUrl, type: t, source: 'waifu.im' };
    throw new Error(`no image in response`);
  } catch(e: any) {
    throw new Error(`waifu.im: ${e.message}`);
  }
}
