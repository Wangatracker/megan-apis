import axios from 'axios';
import * as cheerio from 'cheerio';

const query = 'kenya';

const sites = [
{
name: 'XVIDEOS',
url: "https://www.xvideos.com/?k=${encodeURIComponent(query)}"
},
{
name: 'XNXX',
url: "https://www.xnxx.com/search/${encodeURIComponent(query)}"
},
{
name: 'PORNHUB',
url: "https://www.pornhub.com/video/search?search=${encodeURIComponent(query)}"
},
{
name: 'NAIJAHOMEMADE',
url: "https://naijahomemade.com/?search=${encodeURIComponent(query)}"
}
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
const html = typeof response.data === 'string'
? response.data
: JSON.stringify(response.data);

const $ = cheerio.load(html);

console.log('STATUS:', response.status);
console.log('FINAL URL:', response.request?.res?.responseUrl || site.url);
console.log('TITLE:', $('title').first().text().trim());
console.log('HTML LENGTH:', html.length);
console.log('VIDEO LINKS:', $('a[href]').filter((_, el) => {
  const href = $(el).attr('href') || '';
  return /\/video\/|\/watch\/|\/videos?\//i.test(href);
}).length);

console.log('\nCANDIDATE RESULTS:');

let count = 0;

$('a[href]').each((_, el) => {
  if (count >= 10) return;

  const href = $(el).attr('href') || '';
  const title = (
    $(el).attr('title') ||
    $(el).find('img').attr('alt') ||
    $(el).text()
  ).replace(/\s+/g, ' ').trim();

  if (!title || title.length < 4) return;

  let url;

  try {
    url = new URL(href, site.url).href;
  } catch {
    return;
  }

  if (!new URL(url).hostname.endsWith(new URL(site.url).hostname)) return;

  const image = $(el).find('img').first();

  const thumbnail =
    image.attr('data-src') ||
    image.attr('data-thumb') ||
    image.attr('data-original') ||
    image.attr('src') ||
    '';

  const context = `${href} ${title}`;

  if (
    /video|watch|clip|movie/i.test(context) &&
    !/login|signup|register|privacy|terms/i.test(context)
  ) {
    console.log(JSON.stringify({
      title: title.slice(0, 120),
      url,
      thumbnail: thumbnail ? new URL(thumbnail, site.url).href : '',
      duration: $(el).find(
        '.duration, .thumb-duration, [class*="duration"]'
      ).first().text().trim()
    }));

    count++;
  }
});

console.log('\nSEARCH FORM:', $('form').map((_, el) => ({
  action: $(el).attr('action') || '',
  method: $(el).attr('method') || 'GET',
  inputs: $(el).find('input').map((_, input) => ({
    name: $(input).attr('name') || '',
    type: $(input).attr('type') || 'text'
  })).get()
})).get().slice(0, 3));

if (count === 0) {
  console.log('No matching result links detected by the generic test.');
}

} catch (error) {
console.log('ERROR:', error.code || error.message);
}
}
