import axios from 'axios';

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
  } catch {
    return '11c13d6e10';
  }
}

async function getPlayerUrl(postId, nume = 1) {
  const nonce = await getNonce();
  console.log(`Requesting player for post ${postId} with nonce ${nonce}...`);
  const response = await axios.post(
    `${BASE_URL}/wp-admin/admin-ajax.php`,
    new URLSearchParams({
      action: 'zeta_player_ajax',
      post: postId.toString(),
      nume: nume.toString(),
      type: 'mv',
      nonce: nonce,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${BASE_URL}/movies/`,
      },
      timeout: 15000,
    }
  );

  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(response.data, null, 2));
  return response.data;
}

// Test with the post ID we found
const postId = 67349;
console.log(`Testing player URL for post ID ${postId}...\n`);
const result = await getPlayerUrl(postId);

if (result && result.embed_url) {
  console.log('\n✅ SUCCESS! Embed URL:', result.embed_url);
  
  // Optionally follow redirect to get final video URL
  console.log('\nFollowing redirect to get final video URL...');
  try {
    const videoResponse = await axios.get(result.embed_url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://cinesubz.net/',
      },
      maxRedirects: 5,
      validateStatus: () => true,
    });
    if (videoResponse.status === 301 || videoResponse.status === 302) {
      console.log('Redirected to:', videoResponse.headers.location);
    } else {
      console.log('Final status:', videoResponse.status);
      console.log('Content-Type:', videoResponse.headers['content-type']);
    }
  } catch (e) {
    console.log('Could not follow redirect:', e.message);
  }
} else {
  console.log('\n❌ No embed_url in response. Full response:', result);
}
