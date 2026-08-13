const cheerio = require('cheerio');

const BASE = 'https://tv10.lk21official.cc';
const SEARCH_API = 'https://gudangvape.com/search.php';
const COVER = 'https://cover.showcdnx.com/wp-content/uploads/';

const hdrs = {
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
  'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
  referer: BASE + '/',
};

async function get(url) {
  const res = await fetch(url, { headers: hdrs, signal: AbortSignal.timeout(15000) });
  return res.text();
}

async function getJSON(url) {
  const res = await fetch(url, {
    headers: { ...hdrs, accept: 'application/json', 'x-requested-with': 'XMLHttpRequest' },
    signal: AbortSignal.timeout(15000)
  });
  return res.json();
}

// Test functions
async function testHome() {
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Home page...');
  try {
    const html = await get(BASE + '/');
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const items = $('.gallery-grid article, #post-container article').length;
    console.log(`\x1b[32m✓ WORKING!\x1b[0m Title: ${title}`);
    console.log(`  Items found: ${items}`);
    return true;
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
    return false;
  }
}

async function testSearch() {
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Search "avengers"...');
  try {
    const data = await getJSON(`${SEARCH_API}?s=avengers&page=1`);
    const items = data?.data || data?.items || [];
    if (items.length > 0) {
      console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${items.length} results`);
      items.slice(0, 3).forEach(it => {
        console.log(`  - ${it.title} (${it.year || 'N/A'}) - ${it.quality || 'N/A'}`);
      });
      return items;
    } else {
      console.log(`\x1b[33m⚠ No results\x1b[0m`);
      return [];
    }
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
    return [];
  }
}

async function testDetail(url) {
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Detail page...');
  try {
    const html = await get(url);
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim();
    const synopsis = $('.synopsis').text().trim();
    const rating = $('.rating-number').attr('data-base-rating') || '';
    
    // Players
    const players = [];
    $('#player-list a[data-url], #player-list li a').each((_, a) => {
      players.push({
        server: $(a).attr('data-server') || $(a).text().trim(),
        url: $(a).attr('data-url') || $(a).attr('href')
      });
    });
    
    // Download
    const download = $('a[title^="Download"]').attr('href') || '';
    
    console.log(`\x1b[32m✓ WORKING!\x1b[0m Title: ${title}`);
    console.log(`  Rating: ${rating}`);
    console.log(`  Synopsis: ${synopsis.substring(0, 100)}...`);
    console.log(`  Players: ${players.length}`);
    console.log(`  Download: ${download ? 'YES' : 'NO'}`);
    
    if (players.length > 0) {
      console.log(`\n  Players:`);
      players.forEach(p => console.log(`    - ${p.server}: ${p.url}`));
    }
    
    return { title, players, download };
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
    return null;
  }
}

async function testStream(url) {
  console.log('\n\x1b[36m[TEST 4]\x1b[0m Streaming page...');
  try {
    const html = await get(url);
    const $ = cheerio.load(html);
    
    const players = [];
    $('#player-list a[data-url]').each((_, a) => {
      players.push({
        server: $(a).attr('data-server') || $(a).text().trim(),
        url: $(a).attr('data-url') || $(a).attr('href')
      });
    });
    
    // iframe source
    const iframeSrc = $('#main-player').attr('src') || '';
    
    console.log(`\x1b[32m✓ WORKING!\x1b[0m Players: ${players.length}`);
    
    if (players.length > 0) {
      console.log(`\n  Streaming URLs:`);
      players.forEach(p => console.log(`    - ${p.server}: ${p.url}`));
    }
    
    if (iframeSrc) {
      console.log(`\n  Iframe: ${iframeSrc}`);
    }
    
    return { players, iframeSrc };
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
    return null;
  }
}

async function main() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         TESTING LK21 MOVIE SCRAPER                  ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // Test 1: Home
  const homeWorks = await testHome();
  
  // Test 2: Search
  const searchResults = await testSearch();
  
  // Test 3: Detail (if search works)
  if (searchResults.length > 0) {
    const firstMovie = searchResults[0];
    const movieUrl = `${BASE}/${firstMovie.slug}`;
    console.log(`\n  Testing detail: ${movieUrl}`);
    const detail = await testDetail(movieUrl);
    
    // Test 4: Stream (if detail works)
    if (detail && detail.players.length > 0) {
      const firstPlayer = detail.players[0];
      if (firstPlayer.url && firstPlayer.url !== '#') {
        console.log(`\n  Testing stream: ${firstPlayer.url}`);
        await testStream(firstPlayer.url);
      }
    }
  } else {
    // Test with known movie
    console.log('\n  Testing with default movie...');
    const detail = await testDetail(`${BASE}/agent-shaan-elite-pursuit-2026`);
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

main().catch(e => console.error('Fatal:', e.message));
