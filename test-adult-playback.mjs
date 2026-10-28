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

const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9'
};

function findContentUrl($) {
  for (const element of $('script[type="application/ld+json"]').toArray()) {
    try {
      const data = JSON.parse($(element).text());
      const objects = Array.isArray(data)
        ? data
        : Array.isArray(data['@graph'])
          ? data['@graph']
          : [data];

      const video = objects.find(item =>
        item?.['@type'] === 'VideoObject'
      );

      if (video?.contentUrl) return video.contentUrl;
    } catch {}
  }

  return null;
}

for (const page of pages) {
  console.log('\n========================================');
  console.log('SOURCE:', page.source);
  console.log('========================================');

  try {
    const pageResponse = await axios.get(page.url, {
      headers,
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: () => true
    });

    console.log('PAGE STATUS:', pageResponse.status);

    if (pageResponse.status !== 200) {
      console.log('Cannot inspect metadata from this page.');
      continue;
    }

    const $ = cheerio.load(pageResponse.data);
    const mediaUrl = findContentUrl($);

    if (!mediaUrl) {
      console.log('CONTENT URL: not found');
      continue;
    }

    const parsed = new URL(mediaUrl);

    console.log('CONTENT URL FOUND: yes');
    console.log('MEDIA HOST:', parsed.hostname);
    console.log('MEDIA URL HAS QUERY PARAMETERS:', parsed.search.length > 0);

    // Request only the first byte, if the server supports Range requests.
    const result = await axios.get(mediaUrl, {
      headers: {
        ...headers,
        Range: 'bytes=0-0'
      },
      responseType: 'stream',
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: () => true
    });

    const response = result;
    const h = response.headers;

    console.log('MEDIA STATUS:', response.status);
    console.log('CONTENT TYPE:', h['content-type'] || 'unknown');
    console.log('ACCEPT RANGES:', h['accept-ranges'] || 'not declared');
    console.log('CONTENT RANGE:', h['content-range'] || 'not declared');
    console.log('CONTENT LENGTH:', h['content-length'] || 'not declared');

    // Stop the response immediately; never download the full file.
    response.data.destroy();

    console.log(
      'RANGE TEST:',
      response.status === 206
        ? 'PASS — server returned partial content'
        : response.status === 200
          ? 'Server ignored Range; full response was stopped'
          : 'No successful partial-content response'
    );
  } catch (error) {
    console.log('TEST ERROR:', error.code || error.message);
  }
}
