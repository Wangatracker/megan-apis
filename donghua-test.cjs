const cheerio = require('cheerio');

const BASE = 'https://donghub.vip';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
};

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
    return null;
  }
}

async function testHome() {
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Home page...');
  const html = await fetchHtml(`${BASE}/`);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const popular = [];
  
  $('.listupd.popularslider article.bs').each((i, el) => {
    const a = $(el).find('.bsx a');
    const title = a.attr('title') || '';
    const link = a.attr('href') || '';
    if (title && link) popular.push({ title, link });
  });
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${popular.length} popular donghua`);
  popular.slice(0, 3).forEach(d => console.log(`    - ${d.title}`));
  return popular;
}

async function testSearch() {
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Search "battle"...');
  const html = await fetchHtml(`${BASE}/?s=battle`);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const results = [];
  
  $('.listupd article.bs').each((i, el) => {
    const a = $(el).find('.bsx a');
    const title = a.attr('title') || '';
    const link = a.attr('href') || '';
    if (title && link) results.push({ title, link });
  });
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${results.length} results`);
  results.slice(0, 3).forEach(d => console.log(`    - ${d.title}`));
  return results;
}

async function testEpisode(url) {
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Episode page...');
  const html = await fetchHtml(url);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  const title = $('.entry-title').text().trim();
  
  // Mirrors (streaming)
  const mirrors = [];
  $('select.mirror option').each((i, el) => {
    const name = $(el).text().trim();
    const base64Value = $(el).val();
    if (!base64Value) return;
    
    let streamUrl = '';
    try {
      const decoded = Buffer.from(base64Value, 'base64').toString('utf8');
      const iframeMatch = decoded.match(/src=["']([^"']+)["']/);
      if (iframeMatch) streamUrl = iframeMatch[1];
    } catch (e) {}
    
    mirrors.push({ name, streamUrl });
  });
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Title: ${title}`);
  console.log(`  Mirrors: ${mirrors.length}`);
  
  if (mirrors.length > 0) {
    console.log(`\n  Streaming mirrors:`);
    mirrors.forEach(m => {
      console.log(`    - ${m.name}: ${m.streamUrl || 'No stream URL'}`);
    });
  }
  
  return { title, mirrors };
}

async function main() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         TESTING DONGHUA SCRAPER                     ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // Test home
  const popular = await testHome();
  
  // Test search
  const results = await testSearch();
  
  // Test episode (first result)
  if (results.length > 0) {
    console.log(`\n  Testing episode: ${results[0].title}`);
    await testEpisode(results[0].link);
  } else if (popular.length > 0) {
    console.log(`\n  Testing episode: ${popular[0].title}`);
    await testEpisode(popular[0].link);
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

main().catch(e => console.error('Fatal:', e.message));
