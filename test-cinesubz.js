import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://cinesubz.net';
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36';

async function getNonce() {
  try {
    const response = await axios.get(BASE_URL, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
    });
    const match = response.data.match(/zetaflix_nonce["']?\s*:\s*["']([^"']+)["']/i) ||
                  response.data.match(/ajax_nonce["']?\s*:\s*["']([^"']+)["']/i) ||
                  response.data.match(/nonce["']?\s*:\s*["']([^"']+)["']/i);
    if (match) return match[1];
    return '11c13d6e10';
  } catch (error) {
    console.log('Error getting nonce:', error.message);
    return '11c13d6e10';
  }
}

async function testSearch() {
  console.log('🔍 Testing search functionality...');
  try {
    const nonce = await getNonce();
    console.log('Got nonce:', nonce);
    
    const response = await axios.get(`${BASE_URL}/wp-json/zetaflix/search/`, {
      params: { keyword: 'alone', nonce: nonce },
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${BASE_URL}/movies/`,
      },
      timeout: 15000,
    });
    
    console.log('✅ Search successful!');
    console.log('Results count:', Object.keys(response.data).length);
    if (Object.keys(response.data).length > 0) {
      console.log('First result:', JSON.stringify(Object.values(response.data)[0], null, 2));
    }
    return true;
  } catch (error) {
    console.log('❌ Search failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data?.substring?.(0, 200));
    }
    return false;
  }
}

async function testMovieDetails() {
  console.log('\n🎬 Testing movie details...');
  try {
    const url = `${BASE_URL}/movies/he-knows-youre-alone-1980-sinhala-subtitles`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': `${BASE_URL}/movies/`,
      },
      timeout: 15000,
    });
    
    const $ = cheerio.load(response.data);
    const title = $('h1.entry-title, h1.title, h1').first().text().trim();
    console.log('✅ Movie details fetched!');
    console.log('Title:', title);
    return true;
  } catch (error) {
    console.log('❌ Movie details failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing CineSubz Scraper');
  console.log('============================\n');
  
  const searchWorks = await testSearch();
  const movieWorks = await testMovieDetails();
  
  console.log('\n📊 Test Results:');
  console.log('Search:', searchWorks ? '✅ PASS' : '❌ FAIL');
  console.log('Movie Details:', movieWorks ? '✅ PASS' : '❌ FAIL');
}

main();
