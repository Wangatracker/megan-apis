export default {
  async fetch(request) {
    const url = new URL(request.url);
    const type = url.pathname.split('/').pop();
    
    // nekos.best works from everywhere
    const res = await fetch(`https://nekos.best/api/v2/${type}`);
    const data = await res.json();
    
    if (data?.results?.[0]?.url) {
      return Response.json({ url: data.results[0].url, type, source: 'nekos.best' });
    }
    
    return Response.json({ error: 'No image found' }, { status: 404 });
  }
};
