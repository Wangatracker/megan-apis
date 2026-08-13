const cheerio = require("cheerio");
const fs = require("fs");

const BASE_URL = "https://v2.samehadaku.how";

// Multiple User-Agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchPage(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate',
          'Referer': 'https://www.google.com/',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'cross-site',
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        return await response.text();
      }
      
      // If 403, wait longer before retry
      if (response.status === 403) {
        const waitTime = 5000 * (i + 1);
        console.log(`    403 - Waiting ${waitTime/1000}s...`);
        await new Promise(r => setTimeout(r, waitTime));
      }
    } catch (e) {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  return null;
}

// Use Google Cache as fallback
async function fetchWithGoogleCache(url) {
  console.log(`    Trying Google Cache...`);
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
  try {
    const response = await fetch(cacheUrl, {
      headers: { 'User-Agent': getRandomUA() },
      signal: AbortSignal.timeout(15000)
    });
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {}
  return null;
}

// Use Wayback Machine as fallback
async function fetchWithWayback(url) {
  console.log(`    Trying Wayback Machine...`);
  try {
    const waybackUrl = `https://web.archive.org/web/2024/${url}`;
    const response = await fetch(waybackUrl, {
      headers: { 'User-Agent': getRandomUA() },
      signal: AbortSignal.timeout(15000)
    });
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {}
  return null;
}

async function fetchPageSmart(url) {
  // Try direct first
  let html = await fetchPage(url);
  if (html) return html;
  
  // Try Google Cache
  html = await fetchWithGoogleCache(url);
  if (html) return html;
  
  // Try Wayback Machine
  html = await fetchWithWayback(url);
  if (html) return html;
  
  return null;
}

// Scrape daftar anime (confirmed working)
async function scrapeDaftarAnime() {
  console.log('\n[1] Scraping Daftar Anime...');
  const html = await fetchPage(BASE_URL + "/daftar-anime-2/?list");
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const items = [];
  
  $(".listttl ul li a, .listpst li a, a[href*='/anime/']").each((i, el) => {
    const title = $(el).text().trim();
    const url = $(el).attr("href") || "";
    if (title && url.includes('/anime/')) {
      const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
      items.push({ title, url: fullUrl });
    }
  });
  
  // Remove duplicates
  const unique = items.filter((item, index, self) => 
    index === self.findIndex(t => t.url === item.url)
  );
  
  console.log(`  Found ${unique.length} anime`);
  return unique;
}

// Scrape detail with fallback
async function scrapeDetailAnime(url) {
  console.log(`\n[2] Scraping: ${url.split('/').pop() || url}...`);
  
  let html = await fetchPageSmart(url);
  if (!html) {
    console.log(`  Failed to fetch detail page`);
    return null;
  }
  
  const $ = cheerio.load(html);
  
  const title = $('h1').first().text().trim() || 'Unknown';
  const image = $('.thumb img, img[itemprop="image"]').first().attr('src') || '';
  const synopsis = $('.series-synopsis, .desc, .sinopsis').first().text().trim() || '';
  
  // Info
  const info = {};
  $('.infox .spe span, .spe span').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes(':')) {
      const [k, ...v] = text.split(':');
      info[k.trim()] = v.join(':').trim();
    }
  });
  
  // Genres
  const genres = [];
  $('a[href*="genre"]').each((i, el) => {
    const g = $(el).text().trim();
    if (g && !genres.includes(g)) genres.push(g);
  });
  
  // Episodes
  const episodes = [];
  const seen = new Set();
  $(".eplister ul li a, a[href*='episode']").each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href.includes('episode') && text && !seen.has(href)) {
      seen.add(href);
      const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
      episodes.push({ title: text, url: fullUrl });
    }
  });
  
  console.log(`  Title: ${title}`);
  console.log(`  Episodes: ${episodes.length}`);
  console.log(`  Genres: ${genres.join(', ') || 'N/A'}`);
  
  return { title, image, synopsis, info, genres, episodes };
}

// API-like functions for Express
async function getAnimeList() {
  return await scrapeDaftarAnime();
}

async function getAnimeDetail(url) {
  return await scrapeDetailAnime(url);
}

async function searchAnime(query) {
  console.log(`\n[SEARCH] Searching for: ${query}...`);
  const allAnime = await scrapeDaftarAnime();
  const results = allAnime.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase())
  );
  console.log(`  Found ${results.length} results`);
  return results;
}

// Test function
async function testScraper() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         SAMEHADAKU API SCRAPER                      ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // Test 1: Get anime list
  const animeList = await scrapeDaftarAnime();
  
  if (animeList.length > 0) {
    // Save list
    fs.writeFileSync('anime-list.json', JSON.stringify(animeList, null, 2));
    console.log(`\n  Saved ${animeList.length} anime to anime-list.json`);
    
    // Test 2: Search
    const searchResults = await searchAnime('one piece');
    if (searchResults.length > 0) {
      console.log(`\n  First result: ${searchResults[0].title} - ${searchResults[0].url}`);
      
      // Test 3: Get detail (with delay to avoid 403)
      console.log('\n  Waiting 10 seconds before detail request...');
      await new Promise(r => setTimeout(r, 10000));
      
      const detail = await scrapeDetailAnime(searchResults[0].url);
      if (detail) {
        fs.writeFileSync('anime-detail.json', JSON.stringify(detail, null, 2));
        console.log(`\n  Saved detail to anime-detail.json`);
      }
    }
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

// Export for use in Express
module.exports = {
  getAnimeList,
  getAnimeDetail,
  searchAnime,
  scrapeDaftarAnime,
  scrapeDetailAnime
};

// Run test if called directly
if (require.main === module) {
  testScraper().catch(e => console.error('Fatal:', e.message));
}
