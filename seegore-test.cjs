const cheerio = require('cheerio');

const BASE_URL = 'https://seegore.com';

async function getHtml(url, params = null) {
  let targetUrl = url;
  if (params) {
    const urlObj = new URL(url);
    Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));
    targetUrl = urlObj.toString();
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': `${BASE_URL}/gore/`
  };

  try {
    const response = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (response.ok) {
      return await response.text();
    } else {
      console.log(`  HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`  ${error.message}`);
  }
  return null;
}

async function testHome() {
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Home/Gore page...');
  const html = await getHtml(`${BASE_URL}/gore/`);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const latest = [];
  
  $('article.mm-card').each((_, el) => {
    const article = $(el);
    const titleLink = article.find('h2.mm-card__title a');
    const mediaLink = article.find('a.mm-card__media');
    
    const title = titleLink.attr('title') || titleLink.text().trim() || mediaLink.attr('aria-label') || '';
    const url = titleLink.attr('href') || mediaLink.attr('href') || '';
    const img = mediaLink.find('img').attr('src') || '';
    const category = article.find('a.mm-card__badge').text().trim() || '';
    
    if (title && url) {
      latest.push({ title, url, img, category });
    }
  });
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${latest.length} videos`);
  latest.slice(0, 3).forEach(v => {
    console.log(`    - ${v.title}`);
    console.log(`      ${v.url}`);
    console.log(`      Category: ${v.category}`);
  });
  
  return latest;
}

async function testSearch() {
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Search "accident"...');
  const html = await getHtml(`${BASE_URL}/`, { s: 'accident' });
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const results = [];
  
  $('article.mm-card').each((_, el) => {
    const article = $(el);
    const titleLink = article.find('h2.mm-card__title a');
    const title = titleLink.attr('title') || titleLink.text().trim();
    const url = titleLink.attr('href') || '';
    
    if (title && url) {
      results.push({ title, url });
    }
  });
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${results.length} results`);
  results.slice(0, 3).forEach(v => console.log(`    - ${v.title}`));
  
  return results;
}

async function testVideoDetail(url) {
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Video detail...');
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}/${url}/`;
  const html = await getHtml(fullUrl);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  const article = $('article');
  
  const title = article.find('h1').text().trim() || $('h1').text().trim();
  const videos = [];
  
  // Find video tags
  article.find('video').each((idx, videoEl) => {
    const vt = $(videoEl);
    let src = '';
    const sourceTag = vt.find('source');
    if (sourceTag.length) {
      src = sourceTag.attr('src') || '';
    }
    if (!src) {
      src = vt.attr('src') || '';
    }
    
    if (src) {
      src = src.split('?')[0];
      videos.push({
        index: idx + 1,
        src,
        poster: vt.attr('poster') || '',
      });
    }
  });
  
  // Find MP4 links
  if (videos.length === 0) {
    article.find('a').each((idx, aEl) => {
      const href = $(aEl).attr('href') || '';
      if (href.split('?')[0].endsWith('.mp4')) {
        videos.push({
          index: idx + 1,
          src: href.split('?')[0],
          poster: '',
        });
      }
    });
  }
  
  console.log(`\x1b[32m✓ WORKING!\x1b[0m Title: ${title}`);
  console.log(`  Videos: ${videos.length}`);
  
  if (videos.length > 0) {
    console.log(`\n  MP4 URLs:`);
    videos.forEach(v => {
      console.log(`    ${v.index}. ${v.src}`);
    });
  }
  
  return { title, videos };
}

async function main() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         TESTING SEEGORE SCRAPER                     ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // Test home
  const latest = await testHome();
  
  // Test search
  const results = await testSearch();
  
  // Test video detail (first result)
  if (results.length > 0) {
    console.log(`\n  Testing video: ${results[0].title}`);
    await testVideoDetail(results[0].url);
  } else if (latest.length > 0) {
    console.log(`\n  Testing video: ${latest[0].title}`);
    await testVideoDetail(latest[0].url);
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

main().catch(e => console.error('Fatal:', e.message));
