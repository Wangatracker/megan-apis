import axios from 'axios';
import * as cheerio from 'cheerio';

const sites = [
{ name: 'XVIDEOS', url: 'https://www.xvideos.com/' },
{ name: 'XNXX', url: 'https://www.xnxx.com/' },
{ name: 'PORNHUB', url: 'https://www.pornhub.com/' },
{ name: 'NAIJAHOMEMADE', url: 'https://naijahomemade.com/' }
];

const client = axios.create({
timeout: 20000,
maxRedirects: 5,
validateStatus: () => true,
headers: {
'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36',
'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,/;q=0.8',
'Accept-Language': 'en-US,en;q=0.9'
}
});

for (const site of sites) {
console.log('\n========================================');
console.log("SITE: ${site.name}");
console.log('========================================');

try {
const response = await client.get(site.url);
const $ = cheerio.load(
typeof response.data === 'string'
? response.data
: JSON.stringify(response.data)
);

console.log('HTTP:', response.status);
console.log('TITLE:', $('title').first().text().trim() || 'Not found');
console.log('ANCHORS:', $('a[href]').length);
console.log('IMAGES:', $('img').length);
console.log('VIDEO ELEMENTS:', $('video').length);
console.log('IFRAMES:', $('iframe').length);
console.log('JSON-LD BLOCKS:', $('script[type="application/ld+json"]').length);

console.log('\nPUBLIC VIDEO-LIKE LINKS:');
let count = 0;

$('a[href]').each((_, element) => {
  if (count >= 8) return;

  const href = $(element).attr('href') || '';
  const title =
    $(element).attr('title') ||
    $(element).find('img').attr('alt') ||
    $(element).text().replace(/\s+/g, ' ').trim();

  if (
    title &&
    /video|watch|porn|clip|movie/i.test(href + ' ' + title) &&
    !/login|signup|register|privacy|terms/i.test(href)
  ) {
    let absoluteUrl;

    try {
      absoluteUrl = new URL(href, site.url).href;
    } catch {
      return;
    }

    console.log(JSON.stringify({
      title: title.slice(0, 120),
      url: absoluteUrl
    }));

    count++;
  }
});

console.log('\nIMAGE EXAMPLES:');

$('img').slice(0, 4).each((_, element) => {
  console.log(JSON.stringify({
    alt: ($(element).attr('alt') || '').slice(0, 100),
    src: $(element).attr('src') || '',
    lazySrc: $(element).attr('data-src') || '',
    width: $(element).attr('width') || ''
  }));
});

console.log('\nMETADATA:');

for (const key of ['og:title', 'og:image', 'og:video', 'twitter:image']) {
  const value = $(`meta[property="${key}"], meta[name="${key}"]`)
    .first()
    .attr('content');

  if (value) console.log(`${key}: ${value.slice(0, 250)}`);
}

console.log('\nJSON-LD PREVIEW:');
const jsonLd = $('script[type="application/ld+json"]').first().text().trim();

console.log(jsonLd ? jsonLd.slice(0, 700) : 'No JSON-LD found.');

} catch (error) {
console.log('ERROR:', error.code || error.message);
}
}
