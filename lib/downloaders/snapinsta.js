import * as cheerio from 'cheerio';
import vm from 'node:vm';

const DOMAIN = 'snapinsta.app';
const BOUNDARY = '----WebKitFormBoundaryzZnHotN3v1glRn05';

const HEADERS = {
  accept: '*/*',
  'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
  origin: `https://${DOMAIN}`,
  referer: `https://${DOMAIN}/`,
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

function decodeRaw(raw) {
  const patched = raw.replace(/eval\(/g, 'globalThis.__snap = (');
  const sandbox = { globalThis: {}, setTimeout() {}, clearTimeout() {} };
  vm.createContext(sandbox);
  
  try {
    vm.runInContext(patched, sandbox, { timeout: 5000 });
  } catch (e) {
    throw new Error(`VM execution failed: ${e.message}`);
  }

  const decoded = sandbox.globalThis.__snap || '';
  if (!decoded) throw new Error('Empty response from server');

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

  const thumb = $('.media-left img').attr('src') || 
               $('img.thumbnail').attr('src') || '';

  // Try multiple selector patterns (different sites use different classes)
  const selectors = [
    '.download-items .download-items__btn a',
    '.download-link a.button',
    'a.download-link',
    '.results a[href*="cdn"]',
    'a[download]',
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const url = cleanUrl($(el).attr('href') || '');
      if (!url || url.includes('play.google.com')) return;
      
      results.push({
        type: detectType($(el).text()),
        url,
        thumbnail: thumb,
        quality: $(el).find('.video-quality').text().trim() || '',
      });
    });
    
    if (results.length) break;
  }

  // Fallback: grab any href that looks like a direct media link
  if (!results.length) {
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('cdn') || href.includes('.mp4') || href.includes('.jpg'))) {
        results.push({
          type: detectType($(el).text()),
          url: cleanUrl(href),
          thumbnail: thumb,
          quality: '',
        });
      }
    });
  }

  return results;
}

export function scrape(url) {
  return new Promise(async (resolve, reject) => {
    try {
      // Try different action endpoints
      const endpoints = [
        `https://${DOMAIN}/action.php?lang=en`,
        `https://${DOMAIN}/api/download`,
        `https://${DOMAIN}/process`,
      ];

      let raw = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: HEADERS,
            body: buildFormData(url),
          });
          raw = await res.text();
          
          if (raw && raw.includes('eval(')) break;
          if (raw && raw.includes('download')) break;
        } catch (e) {
          lastError = e;
          continue;
        }
      }

      if (!raw) {
        throw lastError || new Error('All endpoints failed');
      }

      // If response contains eval(), decode it; otherwise try parsing directly
      let html;
      if (raw.includes('eval(')) {
        const decoded = decodeRaw(raw);
        html = extractHtml(decoded);
      } else {
        html = raw;
      }

      const results = parseHtml(html);
      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
}

// Export a way to change the domain
export function setDomain(domain) {
  HEADERS.origin = `https://${domain}`;
  HEADERS.referer = `https://${domain}/`;
}
