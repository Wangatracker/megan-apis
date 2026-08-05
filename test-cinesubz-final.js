import axios from 'axios';
import fs from 'fs';

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36';

async function followRedirect(url, referer) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': referer || 'https://cinesubz.net/',
      },
      maxRedirects: 10,
      timeout: 15000,
    });
    
    console.log('Final status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Length:', response.headers['content-length']);
    console.log('Final URL:', response.request.res.responseUrl || url);
    
    return response.request.res.responseUrl || url;
  } catch (error) {
    console.log('Error:', error.message);
    return null;
  }
}

const embedUrl = 'https://player2.sonic-cloud.online/Home.Alone.3.1997.WEBRip-%5BCineSubz.co%5D-720p.mp4';
console.log('Following:', embedUrl);
console.log('');
const finalUrl = await followRedirect(embedUrl, 'https://cinesubz.net/');
console.log('\nDirect download URL:', finalUrl);
