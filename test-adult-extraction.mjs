import axios from 'axios';
import * as cheerio from 'cheerio';

const query = 'kenya';

const sites = [
  {
    name: 'XVIDEOS',
    url: `https://www.xvideos.com/?k=${encodeURIComponent(query)}`,
    pattern: /\/video\.[a-z0-9]+/i
  },
  {
    name: 'XNXX',
    url: `https://www.xnxx.com/search/${encodeURIComponent(query)}`,
    pattern: /\/video-[a-z0-9]+/i
  }
];

for (const site of sites) {
  console.log('\n========================================');
  console.log(`SITE: ${site.name}`);
  console.log('========================================');

  try {
    const response = await axios.get(site.url, {
      timeout: 25000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      validateStatus: () => true
    });

    console.log('STATUS:', response.status);
    console.log('REQUESTED:', site.url);
    console.log('FINAL URL:', response.request?.res?.responseUrl || site.url);

    if (response.status !== 200) {
      console.log('Page request failed.');
      continue;
    }

    const $ = cheerio.load(response.data);
    console.log('PAGE TITLE:', $('title').text().trim());

    const results = [];
    const seen = new Set();

    $('a[href]').each((_, element) => {
      const link = $(element);
      const href = link.attr('href') || '';

      if (!site.pattern.test(href)) return;

      const url = new URL(href, site.url).href;
      if (seen.has(url)) return;
      seen.add(url);

      const card = link.closest(
        'div.thumb-block, div.thumb, div.mozaique, article, .thumb-under, .video-item'
      );

      const image =
        link.find('img').first().add(card.find('img').first());

      const thumbnail = [
        image.attr('data-src'),
        image.attr('data-thumb'),
        image.attr('data-original'),
        image.attr('data-lazy-src'),
        image.attr('src')
      ].find(value =>
        value &&
        !value.startsWith('data:') &&
        !value.includes('blank')
      ) || '';

      const titleCandidates = [
        link.attr('title'),
        link.attr('aria-label'),
        link.find('img').first().attr('alt'),
        card.find('[title]').first().attr('title'),
        card.find('.title, .video-title, p.title').first().text(),
        link.text()
      ];

      const title = titleCandidates
        .map(value => (value || '').replace(/\s+/g, ' ').trim())
        .find(value =>
          value &&
          !/^(360p|480p|720p|1080p|2160p|4k|hd|uhd|cc)$/i.test(value)
        ) || '';

      const duration = card
        .find(
          '.duration, .thumb-duration, [class*="duration"], [class*="time"]'
        )
        .map((_, item) => $(item).text().trim())
        .get()
        .find(value => /^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) || '';

      results.push({ title, url, thumbnail, duration });
    });

    console.log('VIDEO RESULTS FOUND:', results.length);
    console.log(JSON.stringify(results.slice(0, 10), null, 2));

    if (!results.length) {
      console.log('No matching video links found in the returned HTML.');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }
}
