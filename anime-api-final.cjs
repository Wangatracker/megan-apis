const cheerio = require("cheerio");

// ============================================
// WORKING ANIME APIS
// ============================================

// 1. Kitsu API - Free anime data
async function searchKitsu(query, limit = 10) {
  try {
    const response = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limit}`, {
      headers: { 'Accept': 'application/vnd.api+json' },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return (data.data || []).map(a => ({
      id: a.id,
      title: a.attributes.canonicalTitle,
      title_en: a.attributes.titles?.en || '',
      title_jp: a.attributes.titles?.ja_jp || '',
      synopsis: a.attributes.synopsis || '',
      episodes: a.attributes.episodeCount || null,
      status: a.attributes.status || 'unknown',
      rating: a.attributes.averageRating || null,
      age_rating: a.attributes.ageRating || null,
      poster: a.attributes.posterImage?.original || '',
      cover: a.attributes.coverImage?.original || '',
      type: a.attributes.subtype || 'TV',
      start_date: a.attributes.startDate || null,
      end_date: a.attributes.endDate || null,
    }));
  } catch (e) {
    throw new Error(`Kitsu error: ${e.message}`);
  }
}

// 2. AniList GraphQL - Comprehensive anime data
async function searchAniList(query, limit = 10) {
  const graphqlQuery = `
    query ($search: String, $limit: Int) {
      Page(page: 1, perPage: $limit) {
        media(search: $search, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description
          episodes
          duration
          status
          averageScore
          meanScore
          popularity
          genres
          tags { name }
          studios { nodes { name } }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          season
          seasonYear
          format
          source
          isAdult
          startDate { year month day }
          endDate { year month day }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { search: query, limit }
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return (data.data?.Page?.media || []).map(a => ({
      id: a.id,
      title: a.title?.romaji || a.title?.english || a.title?.native || 'Unknown',
      title_en: a.title?.english || '',
      title_jp: a.title?.native || '',
      synopsis: (a.description || '').replace(/<[^>]*>/g, '').substring(0, 500),
      episodes: a.episodes || null,
      duration: a.duration || null,
      status: a.status || 'unknown',
      score: a.averageScore || null,
      popularity: a.popularity || null,
      genres: a.genres || [],
      tags: (a.tags || []).map(t => t.name),
      studios: (a.studios?.nodes || []).map(s => s.name),
      poster: a.coverImage?.extraLarge || a.coverImage?.large || '',
      banner: a.bannerImage || '',
      season: a.season || null,
      year: a.seasonYear || null,
      format: a.format || null,
      is_adult: a.isAdult || false,
      start_date: a.startDate ? `${a.startDate.year}-${a.startDate.month}-${a.startDate.day}` : null,
      end_date: a.endDate ? `${a.endDate.year}-${a.endDate.month}-${a.endDate.day}` : null,
    }));
  } catch (e) {
    throw new Error(`AniList error: ${e.message}`);
  }
}

// 3. Samehadaku - Indonesian anime list
async function scrapeSamehadakuList() {
  try {
    const response = await fetch("https://v2.samehadaku.how/daftar-anime-2/?list", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const items = [];
    
    $(".listttl ul li a, .listpst li a, a[href*='/anime/']").each((i, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr("href") || "";
      if (title && url.includes('/anime/')) {
        items.push({
          title,
          url: url.startsWith('http') ? url : 'https://v2.samehadaku.how' + url
        });
      }
    });
    
    // Remove duplicates
    return items.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    );
  } catch (e) {
    throw new Error(`Samehadaku error: ${e.message}`);
  }
}

// Combined search - tries multiple sources
async function searchAnime(query, limit = 10) {
  console.log(`\n[SEARCH] "${query}" across multiple sources...`);
  
  const results = {
    query,
    sources: {}
  };
  
  // Try AniList (most detailed)
  try {
    results.sources.anilist = await searchAniList(query, limit);
    console.log(`  AniList: ${results.sources.anilist.length} results`);
  } catch (e) {
    console.log(`  AniList: Failed (${e.message})`);
    results.sources.anilist = [];
  }
  
  // Try Kitsu
  try {
    results.sources.kitsu = await searchKitsu(query, limit);
    console.log(`  Kitsu: ${results.sources.kitsu.length} results`);
  } catch (e) {
    console.log(`  Kitsu: Failed (${e.message})`);
    results.sources.kitsu = [];
  }
  
  return results;
}

// Get trending anime from AniList
async function getTrendingAnime(limit = 10) {
  const graphqlQuery = `
    query ($limit: Int) {
      Page(page: 1, perPage: $limit) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          id
          title { romaji english }
          description
          episodes
          averageScore
          popularity
          genres
          coverImage { extraLarge large }
          season
          seasonYear
          format
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: graphqlQuery, variables: { limit } }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return (data.data?.Page?.media || []).map(a => ({
      id: a.id,
      title: a.title?.romaji || a.title?.english,
      synopsis: (a.description || '').replace(/<[^>]*>/g, '').substring(0, 300),
      episodes: a.episodes,
      score: a.averageScore,
      popularity: a.popularity,
      genres: a.genres,
      poster: a.coverImage?.extraLarge || a.coverImage?.large,
      season: a.season,
      year: a.seasonYear,
    }));
  } catch (e) {
    throw new Error(`Trending error: ${e.message}`);
  }
}

// Get popular anime
async function getPopularAnime(limit = 10) {
  const graphqlQuery = `
    query ($limit: Int) {
      Page(page: 1, perPage: $limit) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id
          title { romaji english }
          episodes
          averageScore
          popularity
          genres
          coverImage { extraLarge large }
          seasonYear
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: graphqlQuery, variables: { limit } }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return (data.data?.Page?.media || []).map(a => ({
      id: a.id,
      title: a.title?.romaji || a.title?.english,
      episodes: a.episodes,
      score: a.averageScore,
      popularity: a.popularity,
      genres: a.genres,
      poster: a.coverImage?.extraLarge || a.coverImage?.large,
      year: a.seasonYear,
    }));
  } catch (e) {
    throw new Error(`Popular error: ${e.message}`);
  }
}

// Test function
async function testAnimeAPI() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         COMPLETE ANIME API TEST                     ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  
  // Test 1: Search
  console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m TEST 1: SEARCH "one piece"\x1b[0m');
  console.log('\x1b[36m════════════════════════════════════════════\x1b[0m');
  
  const searchResults = await searchAnime('one piece', 3);
  
  if (searchResults.sources.anilist.length > 0) {
    console.log('\n\x1b[32m AniList Results:\x1b[0m');
    searchResults.sources.anilist.forEach(a => {
      console.log(`  - ${a.title} (${a.episodes || '?'} eps, Score: ${a.score || 'N/A'})`);
    });
  }
  
  if (searchResults.sources.kitsu.length > 0) {
    console.log('\n\x1b[32m Kitsu Results:\x1b[0m');
    searchResults.sources.kitsu.forEach(a => {
      console.log(`  - ${a.title} (${a.episodes || '?'} eps)`);
    });
  }
  
  // Test 2: Trending
  console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m TEST 2: TRENDING ANIME\x1b[0m');
  console.log('\x1b[36m════════════════════════════════════════════\x1b[0m');
  
  try {
    const trending = await getTrendingAnime(5);
    console.log('\n\x1b[32m Top 5 Trending:\x1b[0m');
    trending.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title} (Score: ${a.score || 'N/A'}, Popularity: ${a.popularity || 'N/A'})`);
    });
  } catch (e) {
    console.log(`  Failed: ${e.message}`);
  }
  
  // Test 3: Popular
  console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m TEST 3: POPULAR ANIME\x1b[0m');
  console.log('\x1b[36m════════════════════════════════════════════\x1b[0m');
  
  try {
    const popular = await getPopularAnime(5);
    console.log('\n\x1b[32m Top 5 Popular:\x1b[0m');
    popular.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title} (Popularity: ${a.popularity || 'N/A'})`);
    });
  } catch (e) {
    console.log(`  Failed: ${e.message}`);
  }
  
  // Test 4: Samehadaku list
  console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m TEST 4: SAMEHADAKU LIST\x1b[0m');
  console.log('\x1b[36m════════════════════════════════════════════\x1b[0m');
  
  try {
    const samehadaku = await scrapeSamehadakuList();
    console.log(`\n\x1b[32m Samehadaku: ${samehadaku.length} anime\x1b[0m`);
    samehadaku.slice(0, 3).forEach(a => console.log(`  - ${a.title}`));
  } catch (e) {
    console.log(`  Failed: ${e.message}`);
  }
  
  console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[35m  ALL TESTS COMPLETE\x1b[0m');
  console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

// Export functions
module.exports = {
  searchAnime,
  searchKitsu,
  searchAniList,
  getTrendingAnime,
  getPopularAnime,
  scrapeSamehadakuList
};

// Run test
if (require.main === module) {
  testAnimeAPI().catch(e => console.error('Fatal:', e.message));
}
