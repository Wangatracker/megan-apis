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

function parseDuration(value) {
  if (!value) return null;

  const match = value.match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i
  );

  if (!match) return null;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function readVideoObject($) {
  const scripts = $('script[type="application/ld+json"]').toArray();

  for (const script of scripts) {
    try {
      const parsed = JSON.parse($(script).contents().text());

      const objects = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed['@graph'])
          ? parsed['@graph']
          : [parsed];

      const video = objects.find(item => {
        const type = item?.['@type'];
        return type === 'VideoObject' ||
          (Array.isArray(type) && type.includes('VideoObject'));
      });

      if (video) return video;
    } catch {
      // Ignore unrelated or malformed JSON-LD blocks.
    }
  }

  return null;
}

for (const page of pages) {
  console.log('\n==============================');
  console.log('SOURCE:', page.source);
  console.log('==============================');

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

    if (response.status !== 200) {
      console.log(JSON.stringify({
        source: page.source,
        status: response.status,
        error: 'Video page request failed'
      }, null, 2));
      continue;
    }

    const $ = cheerio.load(response.data);
    const video = readVideoObject($);

    const title =
      video?.name ||
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().replace(/\s*-\s*(XVIDEOS|XNXX)\.COM\s*$/i, '').trim() ||
      null;

    const rawThumbnail =
      video?.thumbnailUrl ||
      $('meta[property="og:image"]').attr('content') ||
      null;

    const thumbnail = Array.isArray(rawThumbnail)
      ? rawThumbnail[0]
      : rawThumbnail;

    const rawDuration =
      video?.duration ||
      $('meta[property="og:duration"]').attr('content') ||
      null;

    const durationSeconds =
      typeof rawDuration === 'string' && rawDuration.startsWith('PT')
        ? parseDuration(rawDuration)
        : rawDuration && /^\d+$/.test(String(rawDuration))
          ? Number(rawDuration)
          : null;

    const result = {
      source: page.source,
      title: title?.replace(/&(?:lpar|rpar|period);/g, token => ({
        '&lpar;': '(',
        '&rpar;': ')',
        '&period;': '.'
      })[token]).replace(/\s+/g, ' ').trim() || null,
      url: page.url,
      thumbnail,
      durationSeconds,
      uploadDate: video?.uploadDate || null,
      views: video?.interactionStatistic?.userInteractionCount
        ? Number(video.interactionStatistic.userInteractionCount)
        : null
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      source: page.source,
      error: error.message
    }, null, 2));
  }
}
