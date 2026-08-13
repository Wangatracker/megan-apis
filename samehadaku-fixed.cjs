const cheerio = require("cheerio");
const fs = require("fs");

const BASE_URL = "https://v2.samehadaku.how";

// Better fetch with proper headers
async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'Referer': 'https://www.google.com/'
        },
        signal: AbortSignal.timeout(20000)
      });
      
      if (response.ok) {
        return await response.text();
      } else if (response.status === 403 || response.status === 503) {
        console.log(`  Retry ${i + 1}: Got ${response.status}, waiting...`);
        await new Promise(r => setTimeout(r, 3000 * (i + 1)));
        continue;
      }
    } catch (e) {
      if (i < retries - 1) {
        console.log(`  Retry ${i + 1}: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

// Scrape daftar anime (working)
async function scrapeDaftarAnime() {
  console.log('\n\x1b[36m[1]\x1b[0m Scraping Daftar Anime...');
  try {
    const html = await fetchPage(BASE_URL + "/daftar-anime-2/?list");
    const $ = cheerio.load(html);
    const items = [];
    
    $(".listttl ul li a, .listpst li a, a[href*='/anime/']").each((i, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr("href") || "";
      if (title && url.includes('/anime/')) {
        items.push({ title, url: url.startsWith('http') ? url : BASE_URL + url });
      }
    });
    
    // Remove duplicates
    const unique = items.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    );
    
    console.log(`  Found ${unique.length} anime`);
    return unique;
  } catch (e) {
    console.log(`  Error: ${e.message}`);
    return [];
  }
}

// Scrape detail anime (working)
async function scrapeDetailAnime(url) {
  console.log(`\n\x1b[36m[2]\x1b[0m Scraping detail: ${url.split('/').pop()}...`);
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim();
    const image = $('.thumb img, img[itemprop="image"]').first().attr('src') || '';
    const synopsis = $('.series-synopsis, .desc, .sinopsis').first().text().trim();
    
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
        episodes.push({ title: text, url: href.startsWith('http') ? href : BASE_URL + href });
      }
    });
    
    return { title, image, synopsis, info, genres, episodes };
  } catch (e) {
    console.log(`  Error: ${e.message}`);
    return null;
  }
}

// Scrape episode (working)
async function scrapeEpisode(url) {
  console.log(`\n\x1b[36m[3]\x1b[0m Scraping episode...`);
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim();
    
    // Players
    const players = [];
    $(".east_player_option").each((i, el) => {
      const $el = $(el);
      players.push({
        name: $el.find("span").text().trim(),
        data_post: $el.attr("data-post") || "",
        data_nume: $el.attr("data-nume") || ""
      });
    });
    
    // Downloads
    const downloads = [];
    $(".download-eps").each((i, el) => {
      const $el = $(el);
      const format = $el.find("p b").text().trim();
      const links = [];
      $el.find("ul li").each((j, li) => {
        const $li = $(li);
        const quality = $li.find("strong").text().trim();
        const providers = [];
        $li.find("span a").each((k, a) => {
          providers.push({
            provider: $(a).text().trim(),
            url: $(a).attr("href") || ""
          });
        });
        if (quality) links.push({ quality, providers });
      });
      if (links.length) downloads.push({ format, links });
    });
    
    return { title, players, downloads };
  } catch (e) {
    console.log(`  Error: ${e.message}`);
    return null;
  }
}

// Main
async function main() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         SAMEHADAKU SCRAPER (FIXED)                  ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // 1. Get daftar anime
  const animeList = await scrapeDaftarAnime();
  
  if (animeList.length > 0) {
    // 2. Get first anime detail
    const firstAnime = animeList[0];
    const detail = await scrapeDetailAnime(firstAnime.url);
    
    if (detail && detail.episodes.length > 0) {
      // 3. Get first episode
      const episode = await scrapeEpisode(detail.episodes[0].url);
      
      // Save results
      const result = {
        total_anime: animeList.length,
        sample_anime: firstAnime.title,
        detail: detail,
        episode: episode
      };
      
      fs.writeFileSync('samehadaku-result.json', JSON.stringify(result, null, 2));
      console.log('\n\x1b[32m[SAVED]\x1b[0m Results saved to samehadaku-result.json');
    }
  }
  
  // Also scrape One Piece (known working)
  console.log('\n\x1b[36m[EXTRA]\x1b[0m Scraping One Piece (for testing)...');
  const onePiece = await scrapeDetailAnime(BASE_URL + "/anime/one-piece/");
  
  if (onePiece && onePiece.episodes.length > 0) {
    console.log(`\x1b[32m[OK]\x1b[0m One Piece: ${onePiece.episodes.length} episodes found`);
    console.log(`  Latest: ${onePiece.episodes[0].title}`);
    
    const latestEp = await scrapeEpisode(onePiece.episodes[0].url);
    if (latestEp) {
      console.log(`  Players: ${latestEp.players.length}`);
      console.log(`  Downloads: ${latestEp.downloads.length} formats`);
    }
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  SCRAPING COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

main().catch(e => console.error('Fatal:', e.message));
