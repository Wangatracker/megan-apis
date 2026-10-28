import * as cheerio from 'cheerio';

const SITES = {
  "OpenStax": "https://openstax.org",
  "CK-12": "https://www.ck12.org",
  "MIT OpenCourseWare": "https://ocw.mit.edu",
  "PhET": "https://phet.colorado.edu",
  "OER Commons": "https://www.oercommons.org",
  "Khan Academy": "https://www.khanacademy.org",
  "LibreTexts": "https://libretexts.org"
};

const HEADERS = { "User-Agent": "MeganEducationResearch/1.0 (educational resource audit)" };

async function fetchWithTimeout(url, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: HEADERS, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

async function runAudit() {
  for (const [name, base] of Object.entries(SITES)) {
    console.log("\n" + "=".repeat(65));
    console.log(`${name} - ${base}`);
    console.log("=".repeat(65));

    let homeRes;
    try {
      homeRes = await fetchWithTimeout(base);
      console.log("Homepage HTTP:", homeRes.status);
      console.log("Final URL:", homeRes.url);
    } catch (e) {
      console.log("Homepage error:", e.message);
      continue;
    }

    for (const path of ["/robots.txt", "/sitemap.xml"]) {
      const url = new URL(path, base).href;
      try {
        const r = await fetchWithTimeout(url, 20000);
        console.log(`\n${path}: HTTP ${r.status}`);
        if (r.ok) {
          const text = await r.text();
          console.log(text.substring(0, 800).replace(/\0/g, ''));
        }
      } catch (e) {
        console.log(`${path} error: ${e.message}`);
      }
    }

    const contentType = homeRes.headers.get("content-type") || "";
    if (homeRes.ok && contentType.includes("html")) {
      try {
        const html = await homeRes.text();
        const $ = cheerio.load(html);
        console.log("\nRelevant public homepage links:");

        let count = 0;
        const keywords = ["biology", "physics", "chemistry", "textbook", "course", "simulation", "science", "education", "open textbook", "math", "history"];

        $('a').each((i, el) => {
          if (count >= 10) return false;
          const title = $(el).text().trim().replace(/\s+/g, ' ');
          let href = $(el).attr('href');
          if (!href) return;
          try { href = new URL(href, homeRes.url).href; } catch { return; }
          const text = `${title} ${href}`.toLowerCase();
          if (keywords.some(kw => text.includes(kw))) {
            console.log(`- ${title.substring(0, 100)}: ${href}`);
            count++;
          }
        });
      } catch (e) {
        console.log("Parsing error:", e.message);
      }
    }
  }
  console.log("\nAudit complete.");
}

runAudit();
