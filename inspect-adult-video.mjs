import axios from 'axios';
import * as cheerio from 'cheerio';

const pages = [
  {
    name: 'XVIDEOS',
    url: 'https://www.xvideos.com/video.ufthivh1c25/mashujaa_day_fuck_creampie_pussy_hot_sex'
  },
  {
    name: 'XNXX',
    url: 'https://www.xnxx.com/video-1hgsvj64/a_horny_neighbour_jirani_in_kenya_comes_in_my_bedroom_early_in_the_morning_to_ask_for_a_bathing_soap_and_starts_dancing_infront_of_the_mirror._guess_what_i_fuck_her_harder_until_i_cum'
  }
];

for (const page of pages) {
  console.log('\n========================================');
  console.log('SITE:', page.name);
  console.log('========================================');

  try {
    const response = await axios.get(page.url, {
      timeout: 25000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      validateStatus: () => true
    });

    console.log('STATUS:', response.status);

    if (response.status !== 200) {
      console.log('Page unavailable; skipping metadata inspection.');
      continue;
    }

    const $ = cheerio.load(response.data);

    for (const selector of [
      'title',
      'meta[property="og:title"]',
      'meta[property="og:image"]',
      'meta[property="og:duration"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:image"]',
      'meta[itemprop="duration"]',
      'meta[itemprop="thumbnailUrl"]',
      'meta[itemprop="name"]',
      'script[type="application/ld+json"]'
    ]) {
      const elements = $(selector).toArray().slice(0, 3);

      for (const element of elements) {
        const el = $(element);
        const value =
          el.attr('content') ??
          el.attr('datetime') ??
          el.text().trim();

        if (value) {
          console.log(selector + ':', value.slice(0, 700));
        }
      }
    }

    console.log('\nPossible title and duration elements:');

    $('[title], [class*="duration"], [class*="time"], [itemprop]').each((_, element) => {
      const el = $(element);
      const title = el.attr('title');
      const itemprop = el.attr('itemprop');
      const cls = el.attr('class');
      const text = el.text().replace(/\s+/g, ' ').trim();

      if (title || itemprop || /duration|time/i.test(cls || '')) {
        console.log(JSON.stringify({
          tag: element.tagName,
          class: cls || '',
          title: title || '',
          itemprop: itemprop || '',
          text: text.slice(0, 180)
        }));
      }
    }).slice(0, 35);

  } catch (error) {
    console.log('ERROR:', error.message);
  }
}
