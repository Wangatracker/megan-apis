const cheerio = require('cheerio');

const BASE = 'https://tv10.lk21official.cc';

const hdrs = {
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
  'accept-language': 'id-ID,id;q=0.9',
  referer: BASE + '/',
};

async function get(url) {
  const res = await fetch(url, { headers: hdrs, signal: AbortSignal.timeout(20000) });
  return res.text();
}

async function getMovieDetail(url) {
  const html = await get(url);
  const $ = cheerio.load(html);
  
  const title = $('h1').first().text().trim();
  const synopsis = $('.synopsis').text().trim();
  const rating = $('.rating-number').attr('data-base-rating') || '';
  
  // All download links
  const downloads = [];
  $('a[href*="download"], a[title*="Download"], a[href*="dl"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const text = $(a).text().trim() || $(a).attr('title') || 'Download';
    if (href && href !== '#' && !downloads.find(d => d.url === href)) {
      downloads.push({ text, url: href.startsWith('http') ? href : BASE + href });
    }
  });
  
  // All player links
  const players = [];
  $('#player-list a[data-url]').each((_, a) => {
    players.push({
      server: $(a).attr('data-server') || $(a).text().trim(),
      url: $(a).attr('data-url') || $(a).attr('href')
    });
  });
  
  // Movie info
  const info = {};
  $('.detail p').each((_, el) => {
    const label = $(el).find('span').text().replace(':', '').trim();
    const val = $(el).clone().find('span').remove().end().text().trim();
    if (label) info[label] = val;
  });
  
  return { title, synopsis, rating, info, downloads, players };
}

async function testDownloads() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         LK21 DOWNLOAD LINKS TEST                    ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // Test with known movie
  const url = `${BASE}/agent-shaan-elite-pursuit-2026`;
  console.log(`\n\x1b[36m[MOVIE]\x1b[0m ${url}\n`);
  
  const detail = await getMovieDetail(url);
  
  console.log(`\x1b[32m Title: ${detail.title}\x1b[0m`);
  console.log(`\x1b[36m Rating: ${detail.rating}\x1b[0m`);
  console.log(`\x1b[36m Synopsis: ${detail.synopsis.substring(0, 150)}...\x1b[0m`);
  
  console.log(`\n\x1b[33m═══ DOWNLOAD LINKS (${detail.downloads.length}) ═══\x1b[0m`);
  detail.downloads.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.text}`);
    console.log(`     ${d.url}`);
  });
  
  console.log(`\n\x1b[33m═══ STREAMING PLAYERS (${detail.players.length}) ═══\x1b[0m`);
  detail.players.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.server}`);
    console.log(`     ${p.url}`);
  });
  
  // Test if download links are accessible
  if (detail.downloads.length > 0) {
    console.log(`\n\x1b[36m[TESTING]\x1b[0m Checking download links...`);
    for (const d of detail.downloads.slice(0, 3)) {
      try {
        const response = await fetch(d.url, {
          method: 'HEAD',
          headers: hdrs,
          signal: AbortSignal.timeout(10000)
        });
        console.log(`  ${d.text}: ${response.ok ? '\x1b[32m✓ ACCESSIBLE\x1b[0m' : `\x1b[31m✗ HTTP ${response.status}\x1b[0m`}`);
      } catch (e) {
        console.log(`  ${d.text}: \x1b[31m✗ ${e.message}\x1b[0m`);
      }
    }
  }
  
  // Test streaming player
  if (detail.players.length > 0) {
    console.log(`\n\x1b[36m[TESTING]\x1b[0m Checking streaming players...`);
    for (const p of detail.players.slice(0, 2)) {
      try {
        const response = await fetch(p.url, {
          headers: hdrs,
          signal: AbortSignal.timeout(10000)
        });
        console.log(`  ${p.server}: ${response.ok ? '\x1b[32m✓ ACCESSIBLE\x1b[0m' : `\x1b[31m✗ HTTP ${response.status}\x1b[0m`}`);
      } catch (e) {
        console.log(`  ${p.server}: \x1b[31m✗ ${e.message}\x1b[0m`);
      }
    }
  }
}

testDownloads().catch(e => console.error('Fatal:', e.message));
