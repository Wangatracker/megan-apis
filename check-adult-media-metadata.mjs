import axios from 'axios';
import * as cheerio from 'cheerio';

const pages = [
  {
    source: 'xvideos',
    url: 'https://www.xvideos.com/video.ufthivh1c25/mashujaa_day_fuck_creampie_pussy_hot_sex'
  },
  {
    source: 'xnxx',
    url: 'https://www.xnxx.com/video-1hgsvj64/a_horny_neighbour_jirani_in_kenya_comes_in_my_bedroom_early_in_the_morning_to_ask_for_a_bathing_soap_and_starts_dancing_infront_of_the_mirror._guess_what_i_fuck_her_harder_until_i_cum'
  }
];

for (const page of pages) {
  console.log('\nSOURCE:', page.source);

  try {
    const response = await axios.get(page.url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36'
      },
      validateStatus: () => true
    });

    console.log('STATUS:', response.status);

    if (response.status !== 200) continue;

    const $ = cheerio.load(response.data);
    let found = false;

    $('script[type="application/ld+json"]').each((_, element) => {
      if (found) return;

      try {
        const data = JSON.parse($(element).text());
        const objects = Array.isArray(data)
          ? data
          : Array.isArray(data['@graph'])
            ? data['@graph']
            : [data];

        for (const item of objects) {
          if (item?.['@type'] !== 'VideoObject') continue;

          found = true;

          let mediaHost = null;
          try {
            if (item.contentUrl) {
              mediaHost = new URL(item.contentUrl).hostname;
            }
          } catch {}

          console.log(JSON.stringify({
            hasVideoObject: true,
            hasContentUrl: Boolean(item.contentUrl),
            mediaHost,
            hasEmbedUrl: Boolean(item.embedUrl),
            hasThumbnail: Boolean(item.thumbnailUrl),
            hasDuration: Boolean(item.duration)
          }, null, 2));
        }
      } catch {}
    });

    if (!found) {
      console.log('No VideoObject found in JSON-LD.');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }
}
