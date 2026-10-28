import axios from 'axios';

const sites = [
{ name: 'XVIDEOS', url: 'https://www.xvideos.com/' },
{ name: 'XNXX', url: 'https://www.xnxx.com/' },
{ name: 'PORNHUB', url: 'https://www.pornhub.com/' },
{ name: 'NAIJAHOMEMADE', url: 'https://naijahomemade.com/' }
];

const client = axios.create({
timeout: 15000,
maxRedirects: 5,
validateStatus: () => true,
headers: {
'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,/;q=0.8',
'Accept-Language': 'en-US,en;q=0.9'
}
});

for (const site of sites) {
console.log('\n========================================');
console.log("TESTING: ${site.name}");
console.log('========================================');

try {
const response = await client.get(site.url);
const html = typeof response.data === 'string'
? response.data
: JSON.stringify(response.data);

const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  ?.replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

console.log('URL:', site.url);
console.log('HTTP STATUS:', response.status);
console.log('CONTENT TYPE:', response.headers['content-type'] || 'unknown');
console.log('HTML SIZE:', html.length, 'bytes');
console.log('PAGE TITLE:', title || 'Not found');
console.log('VIDEO METADATA:', /og:video|videoObject|application\/ld\+json/i.test(html) ? 'Found indicators' : 'Not detected');
console.log('IMAGE METADATA:', /og:image|twitter:image/i.test(html) ? 'Found indicators' : 'Not detected');
console.log('CHALLENGE INDICATORS:', /captcha|cf-chl-|challenge-platform|verify you are human/i.test(html) ? 'Possible challenge' : 'Not detected');
console.log('HTML PREVIEW:', html.slice(0, 160).replace(/\s+/g, ' '));

} catch (error) {
console.log('REQUEST FAILED:', error.code || error.message);
}
}
