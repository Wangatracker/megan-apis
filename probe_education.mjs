import * as cheerio from 'cheerio';

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

async function probe() {
  // ─── 1. MIT SEARCH PROBE ───
  console.log("\n" + "=".repeat(60));
  console.log("PROBING MIT OPENCOURSEWARE (Search: Physics)");
  console.log("=".repeat(60));
  
  try {
    const mitUrl = "https://ocw.mit.edu/search/?q=physics";
    const mitRes = await fetch(mitUrl, { headers: HEADERS });
    const mitHtml = await mitRes.text();
    const $mit = cheerio.load(mitHtml);

    // We don't know the exact class, so let's look for the most common link containers
    const links = $mit('a');
    console.log(`Found ${links.length} total links.`);

    let found = 0;
    links.each((i, el) => {
      if (found >= 5) return false;
      const text = $mit(el).text().trim().replace(/\s+/g, ' ');
      const href = $mit(el).attr('href');
      
      // Filter out nav bars and look for courses (usually have /courses/ in the URL)
      if (href && href.includes('/courses/')) {
        console.log(`\nLink Text: ${text.substring(0, 100)}`);
        console.log(`URL: ${href}`);
        found++;
      }
    });
    
    if (found === 0) {
      console.log("No /courses/ links found. Dumping raw text of first 500 chars to see if it's a JS-rendered page:");
      console.log(mitHtml.substring(0, 500));
    }
  } catch (e) {
    console.log("MIT Error:", e.message);
  }

  // ─── 2. PhET PROBE ───
  console.log("\n" + "=".repeat(60));
  console.log("PROBING PhET SIMULATIONS (Subject: Physics)");
  console.log("=".repeat(60));

  try {
    const phetUrl = "https://phet.colorado.edu/en/simulations/filter?subjects=physics&type=html";
    const phetRes = await fetch(phetUrl, { headers: HEADERS });
    const phetHtml = await phetRes.text();
    const $phet = cheerio.load(phetHtml);

    // Search for simulation cards
    const sims = $phet('.simulation-list-item, .simulation-card, [data-simulation]');
    console.log(`Found ${sims.length} simulation cards using common selectors.`);

    if (sims.length > 0) {
      sims.slice(0, 5).each((i, el) => {
        const title = $phet(el).find('h3, h2, .title').text().trim().replace(/\s+/g, ' ');
        const href = $phet(el).find('a').attr('href');
        console.log(`\nTitle: ${title}`);
        console.log(`Link: ${href}`);
      });
    } else {
      // If selectors fail, look for all links containing /simulations/
      console.log("\nFallback: Looking for /simulations/ links in the page...");
      let found = 0;
      $phet('a').each((i, el) => {
        if (found >= 5) return false;
        const href = $phet(el).attr('href');
        const text = $phet(el).text().trim().replace(/\s+/g, ' ');
        if (href && href.includes('/simulations/') && text.length > 3) {
          console.log(`- ${text.substring(0, 80)}: ${href}`);
          found++;
        }
      });
    }
  } catch (e) {
    console.log("PhET Error:", e.message);
  }
}

probe();
