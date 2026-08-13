// Test alternative anime APIs
async function testAnimeAPIs() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         TESTING ANIME APIS (ALTERNATIVES)           ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  // 1. Jikan API (MyAnimeList) - Free, no auth
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Jikan API (MyAnimeList)...');
  try {
    const response = await fetch('https://api.jikan.moe/v4/anime?q=one%20piece&limit=3', {
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${data.data.length} results:`);
        data.data.forEach(a => console.log(`  - ${a.title} (${a.type}, ${a.episodes || '?'} eps)`));
      }
    } else {
      console.log(`\x1b[31m✗ HTTP ${response.status}\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
  }

  // 2. Kitsu API - Free, no auth
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Kitsu API...');
  try {
    const response = await fetch('https://kitsu.io/api/edge/anime?filter[text]=one%20piece&page[limit]=3', {
      headers: { 'Accept': 'application/vnd.api+json' },
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${data.data.length} results:`);
        data.data.forEach(a => console.log(`  - ${a.attributes.canonicalTitle} (${a.attributes.episodeCount || '?'} eps)`));
      }
    } else {
      console.log(`\x1b[31m✗ HTTP ${response.status}\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
  }

  // 3. AniList API - Free, GraphQL
  console.log('\n\x1b[36m[TEST 3]\x1b[0m AniList GraphQL API...');
  try {
    const query = `
      query {
        Page(page: 1, perPage: 3) {
          media(search: "one piece", type: ANIME) {
            title { romaji english }
            episodes
            status
          }
        }
      }
    `;
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      const anime = data.data?.Page?.media || [];
      if (anime.length > 0) {
        console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${anime.length} results:`);
        anime.forEach(a => console.log(`  - ${a.title.romaji || a.title.english} (${a.episodes || '?'} eps, ${a.status})`));
      }
    } else {
      console.log(`\x1b[31m✗ HTTP ${response.status}\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
  }

  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

testAnimeAPIs();
