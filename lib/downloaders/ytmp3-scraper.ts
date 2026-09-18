// ytmp3.mobi external scraper — bypasses YouTube bot detection
// Used as a fallback when yt-dlp is blocked on the host

export interface Ytmp3Result {
  status: "success" | "error";
  videoId?: string;
  title?: string;
  format?: "mp3" | "mp4";
  downloadUrl?: string;
  message?: string;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://id.ytmp3.mobi",
  "Referer": "https://id.ytmp3.mobi/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
};

export async function scrapeYtmp3(youtubeUrl: string, format: "mp3" | "mp4" = "mp3"): Promise<Ytmp3Result> {
  const m = /(?:v=|\/shorts\/|youtu\.be\/|\/embed\/|\/live\/)([a-zA-Z0-9_-]{11})/.exec(youtubeUrl)
    || /^([a-zA-Z0-9_-]{11})$/.exec(youtubeUrl);
  if (!m) return { status: "error", message: "Invalid YouTube URL" };
  const videoId = m[1];

  try {
    const initRes = await fetch(`https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers: HEADERS });
    if (!initRes.ok) throw new Error(`init HTTP ${initRes.status}`);
    const initJson: any = await initRes.json();
    if (initJson.error > 0) throw new Error(`init error ${initJson.error}`);

    let convertUrl = `${initJson.convertURL}&v=${videoId}&f=${format}&_=${Math.random()}`;
    let convertJson: any;
    let guard = 0;

    while (guard++ < 10) {
      const r = await fetch(convertUrl, { headers: HEADERS });
      if (!r.ok) throw new Error(`convert HTTP ${r.status}`);
      convertJson = await r.json();
      if (convertJson.error > 0) throw new Error(`convert error ${convertJson.error}`);
      if (convertJson.redirect > 0 && convertJson.redirectURL) {
        convertUrl = `${convertJson.redirectURL}&v=${videoId}&f=${format}&_=${Math.random()}`;
        continue;
      }
      break;
    }

    const progressUrl = convertJson.progressURL;
    const downloadUrl = convertJson.downloadURL;
    let title = convertJson.title || "";

    let progress = 0;
    let polls = 0;
    while (progress < 3 && polls < 60) {
      await new Promise(r => setTimeout(r, 1000));
      polls++;
      const pr = await fetch(progressUrl, { headers: HEADERS });
      if (!pr.ok) throw new Error(`progress HTTP ${pr.status}`);
      const pj: any = await pr.json();
      if (pj.error > 0) throw new Error(`progress error ${pj.error}`);
      progress = pj.progress;
      if (pj.title) title = pj.title;
    }

    if (progress < 3) throw new Error("conversion timeout");
    return { status: "success", videoId, title, format, downloadUrl };
  } catch (e: any) {
    return { status: "error", message: e.message };
  }
}
