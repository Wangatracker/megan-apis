const cheerio = require('cheerio');

const BASE = 'https://s13.nontonanimeid.boats';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id,en-US;q=0.7,en;q=0.3'
};

async function getSoup(url) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    return cheerio.load(html);
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
    return null;
  }
}

async function testHome() {
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Home page...');
  const $ = await getSoup(BASE);
  if (!$) return false;
  
  const title = $('title').text().trim();
  const episodes = [];
  $('#postbaru article.animeseries').each((i, el) => {
    const aTag = $(el).find('a');
    if (aTag.length > 0) {
      episodes.push({
        title: aTag.find('img').attr('alt') || aTag.find('h3.title').text().trim(),
        link: aTag.attr('href') || ''
      });
    }
  });
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Title: ${title}`);
  console.log(`  Episode Terbaru: ${episodes.length}`);
  episodes.slice(0, 3).forEach(e => console.log(`    - ${e.title}`));
  return episodes;
}

async function testSearch() {
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Search "one piece"...');
  const $ = await getSoup(`${BASE}/?s=one+piece`);
  if (!$) return [];
  
  const results = [];
  $('div.animeseries a, a.as-anime-card').each((i, el) => {
    const aTag = $(el);
    const title = aTag.find('img').attr('alt') || aTag.find('.title').text().trim();
    const link = aTag.attr('href') || '';
    if (title && link) results.push({ title, link });
  });
  
  if (results.length > 0) {
    console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${results.length} results`);
    results.slice(0, 3).forEach(r => console.log(`    - ${r.title}`));
  } else {
    console.log(`\x1b[33m⚠ No results\x1b[0m`);
  }
  return results;
}

async function testStream(url) {
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Streaming page...');
  const $ = await getSoup(url);
  if (!$) return null;
  
  const title = $('h1.entry-title').text().trim();
  
  // Video servers
  const servers = [];
  $('ul.player li.serverplayer').each((i, el) => {
    servers.push({
      name: $(el).text().trim(),
      post_id: $(el).attr('data-post') || '',
      nume: $(el).attr('data-nume') || '',
      type: $(el).attr('data-type') || ''
    });
  });
  
  // Download links
  const downloads = [];
  $('div#arealinker div.listlink').each((i, el) => {
    const format = $(el).find('span').text().trim();
    const links = [];
    $(el).find('a').each((j, a) => {
      links.push({ label: $(a).text().trim(), url: $(a).attr('href') || '' });
    });
    if (links.length) downloads.push({ format, links });
  });
  
  // Default iframe
  const defaultVideo = $('div#videoku iframe').attr('src') || '';
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Title: ${title}`);
  console.log(`  Servers: ${servers.length}`);
  console.log(`  Downloads: ${downloads.length} formats`);
  console.log(`  Default Video: ${defaultVideo ? 'YES' : 'NO'}`);
  
  if (servers.length > 0) {
    console.log(`\n  Servers:`);
    servers.forEach(s => console.log(`    - ${s.name} (post: ${s.post_id})`));
  }
  
  if (downloads.length > 0) {
    console.log(`\n  Downloads:`);
    downloads.forEach(d => {
      console.log(`    [${d.format}]`);
      d.links.forEach(l => console.log(`      - ${l.label}: ${l.url}`));
    });
  }
  
  return { title, servers, downloads, defaultVideo };
}

async function main() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║      TESTING NONTONANIMEID SCRAPER                  ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // Test home
  const episodes = await testHome();
  
  // Test search
  const results = await testSearch();
  
  // Test stream (first result)
  if (results.length > 0) {
    console.log(`\n  Testing stream for: ${results[0].title}`);
    await testStream(results[0].link);
  } else if (episodes.length > 0) {
    console.log(`\n  Testing stream for: ${episodes[0].title}`);
    await testStream(episodes[0].link);
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

main().catch(e => console.error('Fatal:', e.message));
