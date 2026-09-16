import type { Express, Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { spotidown } from "../lib/downloaders/v2/spotify";

// ============================================
// V2 DOWNLOAD ROUTES
// ============================================

// 1. Spotify Download
async function spotifyDownload(url: string) {
  const { tracks, sessionCookie } = await spotidown.search(url);
  if (tracks.length === 0) throw new Error("No tracks found");
  const links = await spotidown.getDownloadLinks(tracks[0].form, sessionCookie);
  return { metadata: tracks[0].metadata, links };
}

// 2. Twitter Download
async function twitterDownload(url: string) {
  const homeRes = await axios.get('https://snaptwitter.com/', { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(homeRes.data);
  const token = $('input[name="token"]').attr('value');
  const formData = new URLSearchParams();
  formData.append('url', url);
  formData.append('token', token || '');
  const response = await axios.post('https://snaptwitter.com/action.php', formData, {
    timeout: 20000,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const $result = cheerio.load(response.data.data || response.data);
  return {
    imgUrl: $result('.videotikmate-left img').attr('src'),
    downloadLink: $result('.abuttons a').attr('href'),
    title: $result('.videotikmate-middle h1').text().trim(),
  };
}

// 3. CapCut Download
async function capcutDownload(url: string) {
  const response = await axios.get(url, {
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const $ = cheerio.load(response.data);
  let videoData: any = null;
  $('script[type="application/ld+json"]').each((i, el) => {
    try { videoData = JSON.parse($(el).html() as string); return false; } catch {}
  });
  return videoData;
}

// 4. CapCut v2 Download
async function capcutV2Download(url: string) {
  const mainPage = await axios.get('https://anydownloader.com/en/online-capcut-video-downloader-without-watermark/', {
    timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(mainPage.data);
  const token = $('#token').val();
  const encodedUrl = Buffer.from(url).toString('base64');
  const hash = encodedUrl + '1037YWlvLWRs';
  const response = await axios.post('https://anydownloader.com/wp-json/aio-dl/video-data/',
    `url=${encodeURIComponent(url)}&token=${token}&hash=${Buffer.from(hash).toString('base64')}`,
    {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://anydownloader.com',
        'Referer': 'https://anydownloader.com/en/online-capcut-video-downloader-without-watermark/',
      },
    }
  );
  const { duration, source, sid, ...filteredData } = response.data;
  return filteredData;
}

// 5. Douyin/TikTok Download
async function douyinDownload(url: string) {
  const response = await axios.post('https://lovetik.app/api/ajaxSearch', 'q=' + encodeURIComponent(url) + '&lang=en', {
    timeout: 20000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://lovetik.app',
      'Referer': 'https://lovetik.app/en',
    },
  });
  const extractData = response.data.data;
  const downloadUrls = extractData.match(/https:\/\/(dl\.snapcdn\.app|v\d+-cold\.douyinvod\.com)\/get\?token=[^"]+/g) || [];
  const thumbnailMatch = /<img src="([^"]+)"/.exec(extractData);
  const titleMatch = /<h3>(.*?)<\/h3>/.exec(extractData);
  return {
    title: titleMatch?.[1] || 'Untitled',
    thumbnail: thumbnailMatch?.[1] || null,
    downloads: downloadUrls.map((url: string, i: number) => ({ quality: `Version ${i + 1}`, url })),
  };
}

// 6. Facebook Download
async function facebookDownload(url: string) {
  const formData = `url=${encodeURIComponent(url)}&lang=en&type=redirect`;
  const response = await axios.post('https://getvidfb.com/', formData, {
    timeout: 20000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://getvidfb.com',
      'Referer': 'https://getvidfb.com/',
    },
  });
  const $ = cheerio.load(response.data);
  const videoContainer = $('#snaptik-video');
  const thumb = videoContainer.find('.snaptik-left img').attr('src');
  const title = videoContainer.find('.snaptik-middle h3').text().trim();
  const hasil: any[] = [];
  videoContainer.find('.abuttons a').each((_, el) => {
    const link = $(el).attr('href');
    const spanText = $(el).find('.span-icon span').last().text().trim();
    if (link && spanText && link.startsWith('http')) {
      hasil.push({ url: link, quality: spanText });
    }
  });
  return { thumbnail: thumb, title, data: hasil };
}

// 7. Google Drive Download
async function gdriveDownload(url: string) {
  const response = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(response.data);
  const id = url.split('/')[5];
  return {
    name: $('head').find('title').text().split('-')[0].trim(),
    download: `https://drive.usercontent.google.com/uc?id=${id}&export=download`,
    link: url,
  };
}

// 8. GitHub Download
async function githubDownload(url: string) {
  const response = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'github-data-fetcher' } });
  return response.data;
}

// 9. Lahelu Download
async function laheluDownload(url: string) {
  const postID = url.replace('https://lahelu.com/post/', '');
  const response = await axios.get('https://lahelu.com/api/post/get', {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    params: { postID },
  });
  return response.data?.postInfo || null;
}

// 10. Pinterest Download
async function pinterestDownload(url: string) {
  const pinId = url.split('/pin/')[1]?.split('/')[0]?.split('?')[0];
  if (!pinId) throw new Error('Invalid Pinterest URL');
  const response = await axios.get(`https://www.pinterest.com/resource/PinResource/get/`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    params: {
      source_url: `/pin/${pinId}/`,
      data: JSON.stringify({ options: { field_set_key: 'detailed', id: pinId }, context: {} }),
      _: Date.now(),
    },
  });
  return response.data?.resource_response?.data || null;
}

// 11. Rednote Download
async function rednoteDownload(url: string) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const data = response.data;
  return {
    title: (data.match(/<title>(.*?)<\/title>/i) || [])[1]?.trim() || '',
    desc: (data.match(/<meta\s+name="description"\s+content="(.*?)"/i) || [])[1]?.trim() || '',
    videoUrl: (data.match(/<meta\s+name="og:video"\s+content="(.*?)"/i) || [])[1]?.trim() || '',
    images: (data.match(/<meta\s+name="og:image"\s+content="(.*?)"/gi) || []).map((m: string) => (m.match(/content="(.*?)"/i) || [])[1]),
  };
}

// 12. SoundCloud Download
async function soundcloudDownload(url: string) {
  const clientID = "KKzJxmw11tYpCs6T24P4uUYhqmjalG6M";
  const resolveRes = await axios.get(`https://api-v2.soundcloud.com/resolve?client_id=${clientID}&url=${encodeURIComponent(url)}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Postify/1.0.0' },
  });
  const track = resolveRes.data;
  const transcodings = track.media?.transcodings || [];
  const progressive = transcodings.find((t: any) => t.format?.protocol === 'progressive');
  if (!progressive) throw new Error('No progressive stream available');
  const streamRes = await axios.get(`${progressive.url}?client_id=${clientID}`, { timeout: 15000 });
  return {
    title: track.title,
    url: streamRes.data.url,
    thumbnail: track.artwork_url || track.user?.avatar_url,
    duration: track.full_duration || track.duration,
  };
}

// 13. SnackVideo Download
async function snackvideoDownload(url: string) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const $ = cheerio.load(response.data);
  const videoData = JSON.parse($('#VideoObject').html() || '{}');
  return {
    url: videoData.url || '',
    title: videoData.name || '',
    thumbnail: videoData.thumbnailUrl?.[0] || '',
    videoUrl: videoData.contentUrl || '',
  };
}

// 14. SeeGore Download
async function seegoreDownload(url: string) {
  const response = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(response.data);
  return {
    title: $('h1.entry-title').text().trim(),
    author: $('div.bb-author-vcard-mini span[itemprop="name"]').text().trim(),
    videoSrc: $('video source[type="video/mp4"]').attr('src'),
  };
}

// 15. YouTube Community
async function ytpostDownload(url: string) {
  const response = await axios.get(url, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(response.data);
  const ytInitialData = JSON.parse($('script').text().match(/ytInitialData = ({.*?});/)?.[1] || '{}');
  const posts = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents
    ?.flatMap((section: any) => section.itemSectionRenderer?.contents || [])
    ?.map((item: any) => {
      const post = item.backstagePostThreadRenderer?.post?.backstagePostRenderer;
      if (!post) return null;
      return {
        postId: post.postId,
        author: post.authorText?.simpleText,
        content: post.contentText?.runs?.map((r: any) => r.text).join('') || '',
      };
    })
    .filter(Boolean);
  return posts?.[0] || null;
}

// ============================================
// REGISTER V2 DOWNLOAD ROUTES
// ============================================
export function registerV2DownloadRoutes(app: Express): void {

  app.get('/api/v2/download/spotify', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await spotifyDownload(url);
      return res.json({ status: true, provider: "Spotidown", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/twitter', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await twitterDownload(url);
      return res.json({ status: true, provider: "SnapTwitter", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/capcut', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await capcutDownload(url);
      return res.json({ status: true, provider: "CapCut", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/capcutv2', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await capcutV2Download(url);
      return res.json({ status: true, provider: "AnyDownloader", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/douyin', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await douyinDownload(url);
      return res.json({ status: true, provider: "LoveTik", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/facebook', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await facebookDownload(url);
      return res.json({ status: true, provider: "GetVidFB", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/gdrive', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await gdriveDownload(url);
      return res.json({ status: true, provider: "Google Drive", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/github', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await githubDownload(url);
      return res.json({ status: true, provider: "GitHub", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/lahelu', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await laheluDownload(url);
      return res.json({ status: true, provider: "Lahelu", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/pinterest', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await pinterestDownload(url);
      return res.json({ status: true, provider: "Pinterest", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/rednote', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await rednoteDownload(url);
      return res.json({ status: true, provider: "Rednote", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/soundcloud', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await soundcloudDownload(url);
      return res.json({ status: true, provider: "SoundCloud", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/snackvideo', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await snackvideoDownload(url);
      return res.json({ status: true, provider: "SnackVideo", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/seegore', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await seegoreDownload(url);
      return res.json({ status: true, provider: "SeeGore", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/v2/download/ytpost', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' required" });
    try {
      const result = await ytpostDownload(url);
      return res.json({ status: true, provider: "YouTube", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ V2 Download Routes Registered:");
  console.log("  /api/v2/download/{spotify,twitter,capcut,capcutv2,douyin,facebook,gdrive,github,lahelu,pinterest,rednote,soundcloud,snackvideo,seegore,ytpost}");
}
