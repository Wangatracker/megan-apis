import { scrape } from './snapinsta.js';

// Try with a real public Instagram URL
scrape('https://www.instagram.com/reel/CxYzAbCdEfG/')
  .then(results => {
    if (results.length === 0) {
      console.log('No download links found. Response might need debugging.');
      console.log('Try opening snapinsta.app in a browser and pasting the URL manually first.');
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  })
  .catch(err => console.error('Error:', err.message));
