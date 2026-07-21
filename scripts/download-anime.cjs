const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = ['waifu', 'neko', 'shinobu', 'megumin', 'hug', 'kiss', 'cuddle', 'pat', 'slap', 'cry', 'smile', 'wave', 'dance', 'happy', 'blush', 'wink', 'smug', 'bonk', 'bite', 'poke', 'highfive', 'laugh', 'sleep', 'stare', 'baka', 'facepalm', 'yawn', 'nervous', 'thumbsup', 'punch'];
const IMAGES_PER_TYPE = 20;
const OUTPUT_DIR = path.join(__dirname, '..', 'anime-images');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { console.log('  Parse error:', e.message.substring(0, 50)); resolve(null); }
      });
    }).on('error', (e) => { console.log('  Fetch error:', e.message); resolve(null); });
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, filepath).then(resolve);
        return;
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(true); });
      stream.on('error', () => resolve(false));
    }).on('error', () => resolve(false));
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const catalog = {};
  let totalImages = 0;

  for (const type of TYPES) {
    console.log(`\n${type}:`);
    const categoryDir = path.join(OUTPUT_DIR, type);
    if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });

    const urls = new Set();

    // Try nekos.best - test ONE to see if it works
    const testUrl = `https://nekos.best/api/v2/${type}`;
    console.log(`  Testing: ${testUrl}`);
    const testData = await fetchJson(testUrl);
    console.log(`  Result: ${testData ? 'GOT DATA' : 'NULL'}`);
    
    if (testData?.results) {
      for (const r of testData.results) {
        if (r.url) urls.add(r.url);
      }
      // Get more
      for (let i = 0; i < 3; i++) {
        const moreData = await fetchJson(`https://nekos.best/api/v2/${type}?amount=20`);
        if (moreData?.results) {
          for (const r of moreData.results) {
            if (r.url) urls.add(r.url);
          }
        }
      }
    }

    // Try waifu.pics
    const waifuData = await fetchJson(`https://api.waifu.pics/sfw/${type}`);
    if (waifuData?.url) urls.add(waifuData.url);

    console.log(`  URLs found: ${urls.size}`);

    catalog[type] = [];
    let downloaded = 0;

    for (const url of urls) {
      if (downloaded >= IMAGES_PER_TYPE) break;
      const ext = (url.split('.').pop()?.split('?')[0] || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
      const filename = `${type}_${downloaded + 1}.${ext}`;
      const filepath = path.join(categoryDir, filename);

      if (fs.existsSync(filepath)) {
        catalog[type].push({ file: `${type}/${filename}` });
        downloaded++;
        continue;
      }

      const success = await downloadFile(url, filepath);
      if (success) {
        catalog[type].push({ file: `${type}/${filename}` });
        downloaded++;
        totalImages++;
        process.stdout.write('.');
      }
    }
    console.log(`  Downloaded: ${downloaded}`);
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2));
  console.log(`\nTotal: ${totalImages} images`);
}

main().catch(e => { console.error(e); process.exit(1); });
