import axios from "axios";
import * as cheerio from "cheerio";
import * as qs from "qs";

export class SpotidownScraper {
  private baseUrl = 'https://spotidown.app';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  private async getSession() {
    const response = await axios.get(`${this.baseUrl}/en3`, {
      timeout: 30000,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html',
      }
    });

    const cookies = response.headers['set-cookie'] || [];
    const sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');

    const $ = cheerio.load(response.data);
    const form = $('form[name="spotifyurl"]');
    let dynamicName = '';
    let dynamicValue = '';
    form.find('input[type="hidden"]').each((i, elem) => {
      const name = $(elem).attr('name');
      const val = $(elem).attr('value');
      if (name && name !== 'g-recaptcha-response') {
        dynamicName = name;
        dynamicValue = val;
      }
    });

    return { sessionCookie, dynamicName, dynamicValue };
  }

  async search(queryOrUrl: string) {
    const { sessionCookie, dynamicName, dynamicValue } = await this.getSession();

    const payload: any = {
      url: queryOrUrl,
      'g-recaptcha-response': '',
    };
    if (dynamicName) payload[dynamicName] = dynamicValue;

    const response = await axios.post(`${this.baseUrl}/action`, qs.stringify(payload), {
      timeout: 30000,
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': this.baseUrl,
        'Referer': `${this.baseUrl}/en3`,
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': sessionCookie,
        'Accept': '*/*',
      }
    });

    const $ = cheerio.load(response.data.data || response.data);
    const tracks: any[] = [];

    $('form[name="submitspurl"]').each((i, formElem) => {
      const form = $(formElem);
      const data = form.find('input[name="data"]').val();
      const base = form.find('input[name="base"]').val();
      const token = form.find('input[name="token"]').val();
      
      if (data && base && token) {
        let metadata: any = {};
        try {
          const decodedMeta = Buffer.from(data, 'base64').toString('utf8');
          metadata = JSON.parse(decodedMeta);
        } catch {}

        tracks.push({
          metadata,
          form: { data, base, token }
        });
      }
    });

    return { tracks, sessionCookie };
  }

  async getDownloadLinks(form: any, sessionCookie: string) {
    const response = await axios.post(`${this.baseUrl}/action/track`, qs.stringify(form), {
      timeout: 60000,
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': this.baseUrl,
        'Referer': `${this.baseUrl}/en3`,
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': sessionCookie,
        'Accept': '*/*',
      }
    });

    const $ = cheerio.load(response.data.data || response.data);
    const links: any = { mp3: null, cover: null };

    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      if (href && text.toLowerCase().includes('download mp3')) links.mp3 = href;
      if (href && text.toLowerCase().includes('download cover')) links.cover = href;
    });

    return links;
  }
}

export const spotidown = new SpotidownScraper();
