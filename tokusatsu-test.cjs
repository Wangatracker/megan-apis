const axios = require('axios');
const cheerio = require('cheerio');

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://www.tokusatsuindo.com/'
};

async function fetchHtml(url) {
    try {
        const res = await axios.get(url, { headers: HTTP_HEADERS, timeout: 15000 });
        return res.data;
    } catch (e) {
        throw new Error(`Fetch failed: ${e.message}`);
    }
}

// Test 1: Home
async function testHome() {
    console.log('\n\x1b[36m[TEST 1]\x1b[0m Home page...');
    try {
        const html = await fetchHtml('https://www.tokusatsuindo.com/');
        const $ = cheerio.load(html);
        
        const slider = [];
        $('.gmr-slider-content').each((i, el) => {
            const title = $(el).find('.gmr-slide-titlelink').text().trim();
            if (title) slider.push(title);
        });
        
        const updates = [];
        $('article.item-infinite').each((i, el) => {
            const title = $(el).find('h2.entry-title a').text().trim();
            if (title) updates.push(title);
        });
        
        console.log(`\x1b[32m✓ WORKING!\x1b[0m`);
        console.log(`  Slider: ${slider.length} items`);
        console.log(`  Updates: ${updates.length} items`);
        
        if (slider.length > 0) {
            console.log(`\n  Slider titles:`);
            slider.slice(0, 3).forEach(t => console.log(`    - ${t}`));
        }
        
        if (updates.length > 0) {
            console.log(`\n  Latest updates:`);
            updates.slice(0, 3).forEach(t => console.log(`    - ${t}`));
        }
        
        return { slider, updates };
    } catch (e) {
        console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
        return null;
    }
}

// Test 2: Search
async function testSearch() {
    console.log('\n\x1b[36m[TEST 2]\x1b[0m Search "kamen rider"...');
    try {
        const html = await fetchHtml('https://www.tokusatsuindo.com/?s=kamen+rider');
        const $ = cheerio.load(html);
        
        const results = [];
        $('article.item-infinite').each((i, el) => {
            const title = $(el).find('h2.entry-title a').text().trim();
            const link = $(el).find('h2.entry-title a').attr('href');
            if (title && link) results.push({ title, link });
        });
        
        if (results.length > 0) {
            console.log(`\x1b[32m✓ WORKING!\x1b[0m Found ${results.length} results`);
            results.slice(0, 3).forEach(r => {
                console.log(`    - ${r.title}`);
                console.log(`      ${r.link}`);
            });
            return results;
        } else {
            console.log(`\x1b[33m⚠ No results\x1b[0m`);
            return [];
        }
    } catch (e) {
        console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
        return [];
    }
}

// Test 3: Detail + Stream
async function testDetail(url) {
    console.log('\n\x1b[36m[TEST 3]\x1b[0m Detail + Stream...');
    try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);
        
        const title = $('h1.entry-title').text().trim() || $('h1').first().text().trim();
        const playerContainer = $('#muvipro_player_content_id');
        const isEpisode = playerContainer.length > 0;
        
        console.log(`\x1b[36m  Title: ${title}\x1b[0m`);
        console.log(`\x1b[36m  Type: ${isEpisode ? 'Episode' : 'Series'}\x1b[0m`);
        
        if (isEpisode) {
            const postId = playerContainer.attr('data-id');
            const servers = [];
            $('ul.muvipro-player-tabs > li > a').each((i, el) => {
                servers.push({
                    name: $(el).text().trim(),
                    tab: $(el).attr('href')?.replace('#', '')
                });
            });
            
            console.log(`\x1b[32m✓ EPISODE FOUND!\x1b[0m`);
            console.log(`  Post ID: ${postId}`);
            console.log(`  Servers: ${servers.length}`);
            
            servers.forEach(s => console.log(`    - ${s.name} (${s.tab})`));
            
            // Try to get stream URL
            if (servers.length > 0 && postId) {
                console.log(`\n  Fetching stream URL...`);
                try {
                    const streamUrl = await fetchStreamLink(postId, servers[0].tab, url);
                    if (streamUrl) {
                        console.log(`\x1b[32m✓ STREAM URL FOUND!\x1b[0m`);
                        console.log(`  ${streamUrl}`);
                    } else {
                        console.log(`\x1b[33m⚠ No stream URL\x1b[0m`);
                    }
                } catch (e) {
                    console.log(`\x1b[31m✗ Stream fetch failed: ${e.message}\x1b[0m`);
                }
            }
            
            return { type: 'episode', title, postId, servers };
        } else {
            // Series - get episodes
            const episodes = [];
            $('.entry-content a').each((i, el) => {
                const text = $(el).text().trim();
                const href = $(el).attr('href') || '';
                if (href && text.toLowerCase().includes('episode')) {
                    episodes.push({ title: text, url: href });
                }
            });
            
            console.log(`\x1b[32m✓ SERIES FOUND!\x1b[0m`);
            console.log(`  Episodes: ${episodes.length}`);
            
            episodes.slice(0, 5).forEach(e => console.log(`    - ${e.title}`));
            
            return { type: 'series', title, episodes };
        }
    } catch (e) {
        console.log(`\x1b[31m✗ ${e.message}\x1b[0m`);
        return null;
    }
}

async function fetchStreamLink(postId, tabName, refererUrl) {
    const postBody = `action=muvipro_player_content&tab=${tabName}&post_id=${postId}`;
    const response = await axios.post(
        'https://www.tokusatsuindo.com/wp-admin/admin-ajax.php',
        postBody,
        {
            headers: {
                ...HTTP_HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': refererUrl || 'https://www.tokusatsuindo.com/'
            }
        }
    );
    
    const $ = cheerio.load(response.data);
    const iframe = $('iframe');
    if (iframe.length > 0) {
        return iframe.attr('src');
    }
    return null;
}

async function main() {
    console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[35m║         TESTING TOKUSATSU SCRAPER                   ║\x1b[0m');
    console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
    
    // Test home
    await testHome();
    
    // Test search
    const results = await testSearch();
    
    // Test detail (first result)
    if (results.length > 0) {
        console.log('\n  Testing detail for first result...');
        await testDetail(results[0].link);
    }
    
    console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
    console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');
}

main().catch(e => console.error('Fatal:', e.message));
