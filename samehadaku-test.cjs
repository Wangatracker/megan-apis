const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://v2.samehadaku.how";

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (e) {
    throw new Error(`Fetch failed: ${e.message}`);
  }
}

// Test 1: Check if site is accessible
async function testSiteAccess() {
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Checking if Samehadaku is accessible...');
  try {
    const html = await fetchPage(BASE_URL);
    console.log(`\x1b[32m[OK]\x1b[0m Site accessible! (${html.length} bytes)`);
    return html;
  } catch (e) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${e.message}`);
    return null;
  }
}

// Test 2: Home page
async function testHomePage(html) {
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Scraping home page...');
  if (!html) return;
  
  const $ = cheerio.load(html);
  const title = $('title').text().trim();
  console.log(`\x1b[36m[INFO]\x1b[0m Page title: ${title}`);
  
  // Check for anime list
  const animeCount = $('.animpost, article, .widgetseries li').length;
  console.log(`\x1b[36m[INFO]\x1b[0m Anime articles found: ${animeCount}`);
  
  // Get first few titles
  const titles = [];
  $('h2.entry-title, .judul, h2').each((i, el) => {
    const text = $(el).text().trim();
    if (text && titles.length < 5) titles.push(text);
  });
  
  if (titles.length > 0) {
    console.log(`\x1b[32m[OK]\x1b[0m Found ${titles.length} titles:`);
    titles.forEach(t => console.log(`  - ${t}`));
  } else {
    console.log(`\x1b[33m[WARN]\x1b[0m No titles found (site structure may have changed)`);
  }
}

// Test 3: Daftar Anime
async function testDaftarAnime() {
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Testing daftar anime...');
  try {
    const html = await fetchPage(BASE_URL + "/daftar-anime-2/?list");
    const $ = cheerio.load(html);
    const items = [];
    $(".listttl ul li a, .listpst li a, a[href*='/anime/']").each((i, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr("href") || "";
      if (title && url.includes('/anime/') && items.length < 10) {
        items.push({ title, url });
      }
    });
    
    if (items.length > 0) {
      console.log(`\x1b[32m[OK]\x1b[0m Found ${items.length} anime:`);
      items.forEach(item => console.log(`  - ${item.title}`));
    } else {
      console.log(`\x1b[33m[WARN]\x1b[0m No anime found`);
    }
    return items;
  } catch (e) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${e.message}`);
    return [];
  }
}

// Test 4: Jadwal Rilis API
async function testJadwalRilis() {
  console.log('\n\x1b[36m[TEST 4]\x1b[0m Testing jadwal rilis API...');
  try {
    const url = `${BASE_URL}/wp-json/custom/v1/all-schedule?perpage=5&day=monday`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`\x1b[32m[OK]\x1b[0m Found ${data.length} scheduled anime:`);
        data.forEach(item => {
          console.log(`  - ${item.title} (${item.east_time || 'N/A'})`);
        });
        return true;
      }
    }
    console.log(`\x1b[33m[WARN]\x1b[0m API returned no data (status: ${response.status})`);
    return false;
  } catch (e) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${e.message}`);
    return false;
  }
}

// Test 5: Detail Anime
async function testDetailAnime() {
  console.log('\n\x1b[36m[TEST 5]\x1b[0m Testing detail anime (One Piece)...');
  try {
    const html = await fetchPage(BASE_URL + "/anime/one-piece/");
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim();
    const synopsis = $('.series-synopsis, .desc, .sinopsis').first().text().trim();
    const episodes = [];
    
    $(".eplister ul li a, a[href*='episode']").each((i, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      if (href.includes('episode') && episodes.length < 5) {
        episodes.push({ title: text, url: href });
      }
    });
    
    console.log(`\x1b[36m[INFO]\x1b[0m Title: ${title}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Synopsis: ${synopsis.substring(0, 100)}...`);
    
    if (episodes.length > 0) {
      console.log(`\x1b[32m[OK]\x1b[0m Found ${episodes.length} episodes:`);
      episodes.forEach(ep => console.log(`  - ${ep.title}`));
    } else {
      console.log(`\x1b[33m[WARN]\x1b[0m No episodes found`);
    }
    
    return episodes;
  } catch (e) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${e.message}`);
    return [];
  }
}

// Test 6: Episode/Streaming
async function testEpisode(url) {
  console.log('\n\x1b[36m[TEST 6]\x1b[0m Testing episode page...');
  if (!url) {
    console.log(`\x1b[33m[WARN]\x1b[0m No episode URL to test`);
    return;
  }
  
  try {
    const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
    const html = await fetchPage(fullUrl);
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim();
    const players = [];
    
    $(".east_player_option").each((i, el) => {
      players.push({
        name: $(el).find("span").text().trim(),
        data_post: $(el).attr("data-post") || "",
        data_nume: $(el).attr("data-nume") || ""
      });
    });
    
    $("iframe").each((i, el) => {
      players.push({ name: "iframe", src: $(el).attr("src") || "" });
    });
    
    // Downloads
    const downloads = [];
    $(".download-eps").each((i, el) => {
      const format = $(el).find("p b").text().trim();
      const links = [];
      $(el).find("ul li span a").each((j, a) => {
        links.push({ provider: $(a).text().trim(), url: $(a).attr("href") || "" });
      });
      if (links.length) downloads.push({ format, links: links.length });
    });
    
    console.log(`\x1b[36m[INFO]\x1b[0m Title: ${title}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Players: ${players.length}`);
    console.log(`\x1b[36m[INFO]\x1b[0m Download formats: ${downloads.length}`);
    
    if (players.length > 0) {
      console.log(`\x1b[32m[OK]\x1b[0m Streaming players found:`);
      players.forEach(p => console.log(`  - ${p.name}: ${p.data_post || p.src || 'N/A'}`));
    }
    
    return { players, downloads };
  } catch (e) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${e.message}`);
    return null;
  }
}

// Main test
async function main() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         TESTING SAMEHADAKU ANIME SCRAPER            ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  const html = await testSiteAccess();
  await testHomePage(html);
  await testDaftarAnime();
  await testJadwalRilis();
  const episodes = await testDetailAnime();
  
  if (episodes.length > 0) {
    await testEpisode(episodes[0].url);
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

main().catch(e => {
  console.error('\n\x1b[31m[FATAL]\x1b[0m', e.message);
});
