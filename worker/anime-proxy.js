// Megan APIs — Anime Proxy Worker
// Fetches anime images from sources that Render can't reach

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const type = url.pathname.replace('/anime/', '');
    
    if (!type) return new Response(JSON.stringify({ error: 'Missing type' }), { status: 400 });
    
    // Try nekos.best
    try {
      const nekosRes = await fetch(`https://nekos.best/api/v2/${type}`);
      const nekosData = await nekosRes.json();
      if (nekosData?.results?.[0]?.url) {
        return new Response(JSON.stringify({ url: nekosData.results[0].url, type, source: 'nekos.best' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    } catch(e) {}
    
    // Try waifu.pics
    try {
      const waifuRes = await fetch(`https://api.waifu.pics/sfw/${type}`);
      const waifuData = await waifuRes.json();
      if (waifuData?.url) {
        return new Response(JSON.stringify({ url: waifuData.url, type, source: 'waifu.pics' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    } catch(e) {}
    
    return new Response(JSON.stringify({ error: 'No image found' }), { status: 404 });
  }
};
