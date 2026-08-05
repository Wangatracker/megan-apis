import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://cinesubz.net';
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36';

async function getMovieDetails(slugOrUrl) {
  let url = slugOrUrl;
  if (!url.startsWith('http')) {
    url = `${BASE_URL}/movies/${slugOrUrl}`;
  }

  console.log('Fetching:', url);

  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Referer': `${BASE_URL}/movies/`,
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  const html = response.data;

  // Try multiple title selectors
  console.log('\n--- Title Extraction ---');
  console.log('h1.entry-title:', $('h1.entry-title').first().text().trim());
  console.log('h1.title:', $('h1.title').first().text().trim());
  console.log('h1:', $('h1').first().text().trim());
  console.log('Page title:', html.match(/<title>([^<]+)<\/title>/i)?.[1]);

  // Check for post ID in different places
  console.log('\n--- Post ID Search ---');
  const postIdMatch = html.match(/post[_\s]*id[_\s]*[=:][_\s]*["']?(\d+)["']?/i);
  console.log('post_id match:', postIdMatch?.[1]);
  
  const ampPostMatch = html.match(/&post=(\d+)/);
  console.log('&post= match:', ampPostMatch?.[1]);
  
  const postMatch = html.match(/post=(\d+)/);
  console.log('post= match:', postMatch?.[1]);

  // Check for video/embed URLs
  console.log('\n--- Video/Embed URLs ---');
  const videoLinks = html.match(/https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*/gi);
  console.log('Video links:', videoLinks);

  const embedLinks = html.match(/embed_url["\']?\s*[:=]\s*["\']([^"\']+)["\']/gi);
  console.log('Embed links in source:', embedLinks);

  // Look for download links
  console.log('\n--- Download Links ---');
  const downloadLinks = html.match(/href=["\']([^"\']*(?:download|\.mp4|\.mkv)[^"\']*)["\']/gi);
  console.log('Download links:', downloadLinks?.slice(0, 5));

  // Check for iframe
  console.log('\n--- Iframes ---');
  const iframes = html.match(/<iframe[^>]+src=["\']([^"\']+)["\']/gi);
  console.log('Iframes:', iframes?.slice(0, 3));

  return response.data;
}

// Test with the movie from search results
const movieUrl = 'https://cinesubz.net/movies/home-alone-3-1997-sinhala-subtitles/';
console.log('Fetching movie details...\n');
const html = await getMovieDetails(movieUrl);

// Save HTML for inspection
import fs from 'fs';
fs.writeFileSync('movie-page.html', html);
console.log('\n✅ Full HTML saved to movie-page.html for inspection');
