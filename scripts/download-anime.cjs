// Downloads anime images and generates a JSON catalog
const https = require('https');
const fs = require('fs');
const path = require('path');

const TYPES = {
  waifu: ['waifu'], neko: ['neko'], shinobu: ['shinobu'], megumin: ['megumin'],
  hug: ['hug'], kiss: ['kiss'], cuddle: ['cuddle'], pat: ['pat'], slap: ['slap'],
  cry: ['cry'], smile: ['smile'], wave: ['wave'], dance: ['dance'], happy: ['happy'],
  blush: ['blush'], wink: ['wink'], smug: ['smug'], bonk: ['bonk'], bite: ['bite'],
  poke: ['poke'], highfive: ['highfive'], laugh: ['laugh'], sleep: ['sleep'],
  stare: ['stare'], baka: ['baka'], facepalm: ['facepalm'], yawn: ['yawn'],
  nervous: ['nervous'], thumbsup: ['thumbsup'], punch: ['punch'], kick: ['kick'],
  tickle: ['tickle'], handhold: ['handhold'], nom: ['nom'], awoo: ['awoo'],
  lick: ['lick'], bully: ['bully'], yeet: ['yeet'], cringe: ['cringe'],
  pout: ['pout'], think: ['think'], shoot: ['shoot'], nod: ['nod'],
};
const IMAGES_PER_TYPE = 40;
const OUTPUT_DIR = path.join(__dirname, '..', 'anime-images');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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
  
  for (const [category, types] of Object.entries(TYPES)) {
    console.log(`\nCategory: ${category}`);
    const categoryDir = path.join(OUTPUT_DIR, category);
    if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });
    
    const urls = new Set();
    for (const type of types) {
      try {
        const data = await fetchJson(`https://nekos.best/api/v2/${type}?amount=20`);
        if (data?.results) for (const r of data.results) { if (r.url) urls.add(r.url); }
      } catch(e) {}
      try {
        const data = await fetchJson(`https://api.waifu.pics/sfw/${type}`);
        if (data?.url) urls.add(data.url);
      } catch(e) {}
    }
    
    console.log(`  Found ${urls.size} URLs`);
    catalog[category] = [];
    let downloaded = 0;
    
    for (const url of urls) {
      if (downloaded >= IMAGES_PER_TYPE) break;
      const ext = (url.split('.').pop()?.split('?')[0] || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
      const filename = `${category}_${downloaded + 1}.${ext}`;
      const filepath = path.join(categoryDir, filename);
      
      if (fs.existsSync(filepath)) {
        catalog[category].push({ file: `${category}/${filename}` });
        downloaded++;
        continue;
      }
      
      const success = await downloadFile(url, filepath);
      if (success) {
        catalog[category].push({ file: `${category}/${filename}` });
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
