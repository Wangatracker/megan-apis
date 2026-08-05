import * as cheerio from 'cheerio';
import vm from 'node:vm';

const BOUNDARY = '----WebKitFormBoundaryzZnHotN3v1glRn05';

const HEADERS = {
  accept: '*/*',
  'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
  origin: 'https://snapsave.app',
  referer: 'https://snapsave.app/',
  'user-agent':
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
};

function buildFormData(url) {
  return (
    `--${BOUNDARY}\r\n` +
    `Content-Disposition: form-data; name="url"\r\n\r\n` +
    `${url}\r\n` +
    `--${BOUNDARY}--\r\n`
  );
}

function detectType(text) {
  const t = text.toLowerCase();
  if (t.includes('audio')) return 'audio';
  if (t.includes('image') || t.includes('photo')) return 'image';
  return 'video';
}

function cleanUrl(url) {
  return url.replace(/^\\+|\\+$/g, '').trim();
}

function isDownloadUrl(url) {
  return url.includes('rapidcdn') && !url.includes('play.google.com') && !url.includes('com.snapd');
}

function decodeRaw(raw) {
  const patched = raw.replace(/eval\(/g, 'globalThis.__snap = (');
  const sandbox = { globalThis: {}, setTimeout() {}, clearTimeout() {} };
  vm.createContext(sandbox);
  vm.runInContext(patched, sandbox, { timeout: 5000 });

  const decoded = sandbox.globalThis.__snap || '';
  if (!decoded) throw new Error('Empty response from SnapSave');

  if (decoded.includes('#alert') && decoded.includes('innerHTML')) {
    const errMatch = decoded.match(/innerHTML\s*=\s*"([^"]+)"/);
    if (errMatch) throw new Error(errMatch[1].replace(/\\"/g, '"'));
  }

  return decoded;
}

function extractHtml(decoded) {
  const match = decoded.replace(/\\n/g, '').match(/\.innerHTML\s*=\s*"((?:[^"\\]|\\.)*)"/);
  if (!match) return '';
  return match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function parseHtml(html) {
  const $ = cheerio.load(html);
  const results = [];

  const thumb = $('.media-left img').attr('src') || '';
  const author = $('.media-content strong').first().text().trim();
  const caption = $('.media-content .video-des').first().text().trim();

  $('.download-items').each((_, el) => {
    const btn = $(el).find('.download-items__btn a');
    const img = $(el).find('.download-items__thumb img');
    const url = cleanUrl(btn.attr('href') || '');
    if (!isDownloadUrl(url)) return;

    results.push({
      type: detectType(btn.find('span').text()),
      url,
      thumbnail: img.attr('src') || '',
      quality: '',
      author,
      caption,
    });
  });

  if (!results.length) {
    $('tr.render').each((_, el) => {
      const btn = $(el).find('a.button');
      const url = cleanUrl(btn.attr('href') || '');
      if (!isDownloadUrl(url)) return;

      results.push({
        type: detectType($(el).find('.video-quality').text()),
        url,
        thumbnail: thumb,
        quality: $(el).find('.video-quality').text().trim(),
        author,
        caption,
      });
    });
  }

  if (!results.length) {
    $('.download-link a.button').each((_, btnEl) => {
      const url = cleanUrl($(btnEl).attr('href') || '');
      if (!isDownloadUrl(url)) return;

      results.push({
        type: detectType($(btnEl).text()),
        url,
        thumbnail: thumb,
        quality: '',
        author,
        caption,
      });
    });
  }

  return results;
}

export function scrape(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const raw = await fetch('https://snapsave.app/action.php?lang=en', {
        method: 'POST',
        headers: HEADERS,
        body: buildFormData(url),
      }).then((r) => r.text());

      const decoded = decodeRaw(raw);
      const html = extractHtml(decoded);
      const results = parseHtml(html);
      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
}
