import axios from 'axios';
import * as cheerio from 'cheerio';

const sites = [
  { name: 'XHAMSTER', url: 'https://xhamster.com/' },
  { name: 'XTUBE', url: 'https://www.xtube.com/' },
  { name: 'XXX.COM', url: 'https://www.xxx.com/' },
  { name: 'XVIDEOS ES', url: 'https://www.xvideos.es/' },
  { name: 'X-ART', url: 'https://www.x-art.com/' },
  { name: 'X-BERRY', url: 'https://www.x-berry.com/' },
  { name: 'XCITY', url: 'https://www.xcity.jp/' },
  { name: 'XBOOKCN', url: 'https://www.xbookcn.com/' }
];

for (const site of sites) {
  console.log('\n========================================');
  console.log('SITE:', site.name);
  console.log('========================================');

  try {
    const response = await axios.get(site.url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      validateStatus: () => true
    });

    const $ = cheerio.load(
      typeof response.data === 'string' ? response.data : ''
    );

    const jsonLdTypes = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).text());
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data['@graph'])
            ? data['@graph']
            : [data];

        for (const item of items) {
          if (item?.['@type']) {
            jsonLdTypes.push(item['@type']);
          }
        }
      } catch {}
    });

    console.log('STATUS:', response.status);
    console.log('FINAL URL:', response.request?.res?.responseUrl || site.url);
    console.log('TITLE:', $('title').text().trim().slice(0, 180));
    console.log('HTML BYTES:', Buffer.byteLength(
      typeof response.data === 'string' ? response.data : ''
    ));
    console.log('OG TITLE:', $('meta[property="og:title"]').attr('content') || 'none');
    console.log('OG IMAGE:', $('meta[property="og:image"]').attr('content') || 'none');
    console.log('VIDEO TAGS:', $('video').length);
    console.log('VIDEO LINKS:', $('a[href]').filter((_, el) =>
      /video|watch|clip/i.test($(el).attr('href') || '')
    ).length);
    console.log('JSON-LD TYPES:', [...new Set(jsonLdTypes)].join(', ') || 'none');

  } catch (error) {
    console.log('REQUEST ERROR:', error.code || error.message);
  }
}
