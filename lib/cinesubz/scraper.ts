import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://cinesubz.net";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36";

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  img: string;
  genres: string;
  date: string;
  imdb: string;
  runtime: string;
  slug: string;
}

export interface MovieDetails {
  title: string;
  poster: string;
  description: string;
  embedUrl: string | null;
  postId: number | null;
  url: string;
  downloadUrl?: string | null;
}

async function getNonce(): Promise<string> {
  try {
    const response = await axios.get(BASE_URL, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
    });
    const match =
      response.data.match(/zetaflix_nonce["']?\s*:\s*["']([^"']+)["']/i) ||
      response.data.match(/ajax_nonce["']?\s*:\s*["']([^"']+)["']/i) ||
      response.data.match(/nonce["']?\s*:\s*["']([^"']+)["']/i);
    if (match) return match[1];
    return "11c13d6e10";
  } catch {
    return "11c13d6e10";
  }
}

export async function searchMovies(query: string): Promise<SearchResult[]> {
  const nonce = await getNonce();
  const response = await axios.get(`${BASE_URL}/wp-json/zetaflix/search/`, {
    params: { keyword: query, nonce: nonce },
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${BASE_URL}/movies/`,
    },
    timeout: 15000,
  });

  const data = response.data;
  const results: SearchResult[] = [];
  for (const [id, movie] of Object.entries(data) as [string, any][]) {
    results.push({
      id: parseInt(id),
      title: movie.title || "Unknown",
      url: movie.url || "",
      img: movie.img || "",
      genres: movie.extra?.genres || "",
      date: movie.extra?.date || "",
      imdb: movie.extra?.imdb || "",
      runtime: movie.extra?.runtime || "",
      slug: movie.url ? movie.url.split("/").filter(Boolean).pop() || "" : "",
    });
  }
  return results;
}

export async function getMovieDetails(slugOrUrl: string): Promise<MovieDetails | null> {
  let url = slugOrUrl;
  if (!url.startsWith("http")) {
    url = `${BASE_URL}/movies/${slugOrUrl}`;
  }

  const response = await axios.get(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      Referer: `${BASE_URL}/movies/`,
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  const html = response.data;

  // Extract from page title (more accurate)
  const title =
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*\|.*$/, "").trim() ||
    $("h1.entry-title, h1.title, h1").first().text().trim() ||
    "Unknown";

  const poster =
    $("img.wp-post-image, img.attachment-post-thumbnail, .post-thumbnail img, .movie-poster img").first().attr("src") || "";

  const description =
    $(".entry-content p, .movie-description, .description").first().text().trim() || "";

  let embedUrl: string | null = null;
  let postId: number | null = null;

  const postIdMatch = html.match(/post[_\s]*id[_\s]*[=:][_\s]*["']?(\d+)["']?/i);
  if (postIdMatch) {
    postId = parseInt(postIdMatch[1]);
    const playerData = await getPlayerUrl(postId);
    if (playerData) {
      embedUrl = playerData.embed_url;
    }
  }

  // Follow redirect to get final download URL
  let downloadUrl: string | null = null;
  if (embedUrl) {
    downloadUrl = await followVideoRedirect(embedUrl, url);
  }

  return { title, poster, description, embedUrl, postId, url, downloadUrl };
}

export async function getPlayerUrl(postId: number, nume: number = 1): Promise<{ embed_url: string; type: string } | null> {
  const nonce = await getNonce();
  const response = await axios.post(
    `${BASE_URL}/wp-admin/admin-ajax.php`,
    new URLSearchParams({
      action: "zeta_player_ajax",
      post: postId.toString(),
      nume: nume.toString(),
      type: "mv",
      nonce: nonce,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${BASE_URL}/movies/`,
      },
      timeout: 15000,
    }
  );

  const data = response.data;
  if (data && data.embed_url) {
    return { embed_url: data.embed_url, type: data.type || "mp4" };
  }
  return null;
}

export async function followVideoRedirect(videoUrl: string, referer: string | null = null): Promise<string | null> {
  try {
    const response = await axios.get(videoUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: referer || "https://cinesubz.net/",
        Accept: "text/html,application/xhtml+xml",
      },
      maxRedirects: 10,
      timeout: 15000,
    });
    return response.request.res.responseUrl || videoUrl;
  } catch {
    return null;
  }
}

export async function fullWorkflow(query: string) {
  const searchResults = await searchMovies(query);
  if (searchResults.length === 0) {
    return { success: false, error: "No results found" };
  }

  const firstResult = searchResults[0];
  const details = await getMovieDetails(firstResult.slug);

  if (details?.downloadUrl) {
    details.finalVideoUrl = details.downloadUrl;
  }

  return {
    success: true,
    searchQuery: query,
    searchResults,
    selectedMovie: details,
  };
}
