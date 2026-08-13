// Test actual anime streaming/download sources
async function testStreamingSources() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║      TESTING ANIME STREAMING/DOWNLOAD SOURCES        ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  // 1. GogoAnime API (free, no auth)
  console.log('\n\x1b[36m[TEST 1]\x1b[0m GogoAnime API...');
  try {
    const response = await fetch('https://api.consumet.org/anime/gogoanime/one-piece', {
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${data.results.length} results`);
        console.log(`  First: ${data.results[0].title} (${data.results[0].id})`);
        return { source: 'gogoanime', data };
      }
    } else {
      console.log(`\x1b[31m✗ HTTP ${response.status}\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
  }

  // 2. Consumet API (free)
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Consumet API...');
  try {
    const response = await fetch('https://api.consumet.org/anime/gogoanime/top-airing', {
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        console.log(`\x1b[32m✓ WORKING!\x1b[0m Top airing: ${data.results.length} anime`);
        console.log(`  First: ${data.results[0].title}`);
        return { source: 'consumet', data };
      }
    } else {
      console.log(`\x1b[31m✗ HTTP ${response.status}\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
  }

  // 3. Aniwatch API
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Aniwatch API...');
  try {
    const response = await fetch('https://aniwatch-api-net.vercel.app/api/v2/hianime/search?q=one%20piece', {
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.animes && data.data.animes.length > 0) {
        console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${data.data.animes.length} results`);
        console.log(`  First: ${data.data.animes[0].name}`);
        return { source: 'aniwatch', data };
      }
    } else {
      console.log(`\x1b[31m✗ HTTP ${response.status}\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
  }

  // 4. Enime API
  console.log('\n\x1b[36m[TEST 4]\x1b[0m Enime API...');
  try {
    const response = await fetch('https://api.enime.moe/search?query=one%20piece', {
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${data.data.length} results`);
        return { source: 'enime', data };
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

testStreamingSources();
