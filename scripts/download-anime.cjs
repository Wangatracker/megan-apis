const https = require('https');
const fs = require('fs');
const path = require('path');

const TYPES = [
  'waifu', 'neko', 'shinobu', 'megumin', 'hug', 'kiss', 'cuddle', 'pat', 'slap',
  'cry', 'smile', 'wave', 'dance', 'happy', 'blush', 'wink', 'smug', 'bonk', 'bite',
  'poke', 'highfive', 'laugh', 'sleep', 'stare', 'baka', 'facepalm', 'yawn',
  'nervous', 'thumbsup', 'punch'
];
const IMAGES_PER_TYPE = 30;
const OUTPUT_DIR = path.join(__dirname, '..', 'anime-images');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
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
    console.log(`\nCategory: ${type}`);
    const categoryDir = path.join(OUTPUT_DIR, type);
    if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });

    const urls = new Set();

    // Try waifu.im (primary - works from GitHub)
    for (let page = 0; page < 3; page++) {
      try {
        const data = await fetchJson(`https://api.waifu.im/search?included_tags=${type}&many=true&page=${page}`);
        if (data?.images) {
          for (const img of data.images) {
            if (img.url) urls.add(img.url);
          }
        }
      } catch(e) {}
    }

    // Try nekos.best (fallback)
    try {
      const data = await fetchJson(`https://nekos.best/api/v2/${type}?amount=20`);
      if (data?.results) {
        for (const r of data.results) {
          if (r.url) urls.add(r.url);
        }
      }
    } catch(e) {}

    console.log(`  Found ${urls.size} URLs`);

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
    console.log(`\n  Done: ${downloaded} images`);
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2));
  console.log(`\nTotal: ${totalImages} images in ${Object.keys(catalog).length} categories`);
}

main().catch(e => { console.error(e); process.exit(1); });
