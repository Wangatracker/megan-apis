const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const CREATOR = "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech";

async function fetchJSON(url: string, headers: Record<string, string> = {}): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, ...headers },
      signal: controller.signal,
    });
    // Always try to parse the body — even on non-OK — so callers can see GitHub's error messages
    let body: any = null;
    try { body = await res.json(); } catch { body = null; }
    if (!res.ok) {
      // Return body so callers see the real error (e.g. "API rate limit exceeded")
      return body || null;
    }
    return body;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHTML(url: string, headers: Record<string, string> = {}): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, ...headers },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function githubStalk(username: string) {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

  const data = await fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`, headers);

  // Handle GitHub API errors explicitly
  if (!data) {
    return { success: false, creator: CREATOR, error: `GitHub user "${username}" not found` };
  }
  if (data.message === "Not Found") {
    return { success: false, creator: CREATOR, error: `GitHub user "${username}" does not exist` };
  }
  if (data.message && data.message.toLowerCase().includes("rate limit")) {
    return { success: false, creator: CREATOR, error: "GitHub API rate limit reached. Try again in a minute." };
  }
  if (data.message) {
    return { success: false, creator: CREATOR, error: data.message };
  }
  return {
    success: true,
    creator: CREATOR,
    platform: "GitHub",
    username: data.login,
    name: data.name,
    bio: data.bio,
    avatar: data.avatar_url,
    profileUrl: data.html_url,
    publicRepos: data.public_repos,
    publicGists: data.public_gists,
    followers: data.followers,
    following: data.following,
    company: data.company,
    location: data.location,
    blog: data.blog,
    twitterUsername: data.twitter_username,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function ipStalk(ip: string) {
  const data = await fetchJSON(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,continent,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
  if (!data || data.status === "fail") {
    return { success: false, creator: CREATOR, error: data?.message || `IP lookup failed for "${ip}"` };
  }
  return {
    success: true,
    creator: CREATOR,
    platform: "IP Lookup",
    ip: data.query,
    continent: data.continent,
    country: data.country,
    countryCode: data.countryCode,
    region: data.regionName,
    regionCode: data.region,
    city: data.city,
    zip: data.zip,
    latitude: data.lat,
    longitude: data.lon,
    timezone: data.timezone,
    isp: data.isp,
    org: data.org,
    as: data.as,
  };
}

export async function npmStalk(packageName: string) {
  const data = await fetchJSON(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
  if (!data || data.error) {
    return { success: false, creator: CREATOR, error: data?.error || `NPM package "${packageName}" not found` };
  }
  const latest = data["dist-tags"]?.latest;
  const latestVersion = latest ? data.versions?.[latest] : null;
  return {
    success: true,
    creator: CREATOR,
    platform: "NPM",
    name: data.name,
    description: data.description,
    latestVersion: latest,
    license: data.license || latestVersion?.license,
    homepage: data.homepage,
    repository: typeof data.repository === "object" ? data.repository?.url : data.repository,
    author: data.author,
    maintainers: data.maintainers?.map((m: any) => m.name || m.email),
    keywords: data.keywords,
    distTags: data["dist-tags"],
    createdAt: data.time?.created,
    lastModified: data.time?.modified,
    npmUrl: `https://www.npmjs.com/package/${data.name}`,
  };
}

export async function tiktokStalk(username: string) {
  const cleanUsername = username.replace(/^@/, "");
  const html = await fetchHTML(`https://www.tiktok.com/@${encodeURIComponent(cleanUsername)}`);
  if (!html) {
    return { success: false, creator: CREATOR, error: `Could not fetch TikTok profile for "${cleanUsername}"` };
  }

  const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      const jsonData = JSON.parse(scriptMatch[1]);
      const userInfo = jsonData?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo;
      if (userInfo) {
        return {
          success: true,
          creator: CREATOR,
          platform: "TikTok",
          username: userInfo.user?.uniqueId,
          nickname: userInfo.user?.nickname,
          bio: userInfo.user?.signature,
          avatar: userInfo.user?.avatarLarger,
          verified: userInfo.user?.verified,
          privateAccount: userInfo.user?.privateAccount,
          followers: userInfo.stats?.followerCount,
          following: userInfo.stats?.followingCount,
          likes: userInfo.stats?.heartCount,
          videos: userInfo.stats?.videoCount,
          profileUrl: `https://www.tiktok.com/@${userInfo.user?.uniqueId}`,
        };
      }
    } catch {}
  }

  const nicknameMatch = html.match(/"nickname":"([^"]+)"/);
  const followerMatch = html.match(/"followerCount":(\d+)/);
  const followingMatch = html.match(/"followingCount":(\d+)/);
  const heartMatch = html.match(/"heartCount":(\d+)/);
  const videoMatch = html.match(/"videoCount":(\d+)/);
  const bioMatch = html.match(/"signature":"([^"]*?)"/);
  const avatarMatch = html.match(/"avatarLarger":"([^"]+)"/);

  if (nicknameMatch) {
    return {
      success: true,
      creator: CREATOR,
      platform: "TikTok",
      username: cleanUsername,
      nickname: nicknameMatch?.[1],
      bio: bioMatch?.[1]?.replace(/\\n/g, "\n"),
      avatar: avatarMatch?.[1]?.replace(/\\u002F/g, "/"),
      followers: followerMatch ? parseInt(followerMatch[1]) : null,
      following: followingMatch ? parseInt(followingMatch[1]) : null,
      likes: heartMatch ? parseInt(heartMatch[1]) : null,
      videos: videoMatch ? parseInt(videoMatch[1]) : null,
      profileUrl: `https://www.tiktok.com/@${cleanUsername}`,
    };
  }

  return { success: false, creator: CREATOR, error: `Could not extract TikTok profile data for "${cleanUsername}". The profile may be private or doesn't exist.` };
}

export async function instagramStalk(username: string) {
  const cleanUsername = username.replace(/^@/, "");

  const html = await fetchHTML(`https://www.instagram.com/${encodeURIComponent(cleanUsername)}/`, {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
    "Cache-Control": "no-cache",
  });

  if (!html) {
    return {
      success: false,
      creator: CREATOR,
      platform: "Instagram",
      username: cleanUsername,
      profileUrl: `https://www.instagram.com/${cleanUsername}/`,
      error: `Instagram is currently blocking automated lookups for "${cleanUsername}". Visit the profile URL directly.`,
    };
  }

  const descMatch = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]*?)"/i);
  const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*?)"/i);
  const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*?)"/i);

  let followers: string | null = null;
  let following: string | null = null;
  let posts: string | null = null;
  if (descMatch) {
    const desc = descMatch[1];
    const statsMatch = desc.match(/([\d,.]+[KkMm]?)\s*Followers.*?([\d,.]+[KkMm]?)\s*Following.*?([\d,.]+[KkMm]?)\s*Posts/i);
    if (statsMatch) {
      followers = statsMatch[1];
      following = statsMatch[2];
      posts = statsMatch[3];
    }
  }

  if (titleMatch || descMatch) {
    return {
      success: true,
      creator: CREATOR,
      platform: "Instagram",
      username: cleanUsername,
      name: titleMatch?.[1]?.replace(/ \(@.*/, "") || cleanUsername,
      bio: descMatch?.[1] || null,
      avatar: imageMatch?.[1] || null,
      followers,
      following,
      posts,
      profileUrl: `https://www.instagram.com/${cleanUsername}/`,
    };
  }

  return {
    success: false,
    creator: CREATOR,
    platform: "Instagram",
    username: cleanUsername,
    profileUrl: `https://www.instagram.com/${cleanUsername}/`,
    error: `Instagram is blocking automated lookups. Visit the profile URL directly to view this account.`,
  };
}

export async function twitterStalk(username: string) {
  const cleanUsername = username.replace(/^@/, "");

  const data = await fetchJSON(`https://api.fxtwitter.com/${encodeURIComponent(cleanUsername)}`);

  if (data?.code === 200 && data?.user) {
    const u = data.user;
    return {
      success: true,
      creator: CREATOR,
      platform: "Twitter/X",
      username: u.screen_name,
      name: u.name,
      bio: u.description || null,
      avatar: u.avatar_url?.replace("_normal.", "_400x400.") || null,
      banner: u.banner_url || null,
      location: u.location || null,
      website: u.website || null,
      verified: u.verification?.verified || false,
      verifiedType: u.verification?.type || null,
      followers: u.followers,
      following: u.following,
      tweets: u.tweets,
      likes: u.likes,
      mediaCount: u.media_count,
      joinedAt: u.joined || null,
      profileUrl: `https://twitter.com/${u.screen_name}`,
    };
  }

  if (data?.code === 404) {
    return { success: false, creator: CREATOR, error: `Twitter/X user "${cleanUsername}" not found` };
  }

  return {
    success: false,
    creator: CREATOR,
    platform: "Twitter/X",
    username: cleanUsername,
    profileUrl: `https://twitter.com/${cleanUsername}`,
    error: `Could not retrieve Twitter/X profile for "${cleanUsername}". The account may be suspended or protected.`,
  };
}

export async function numberPlateStalk(plate: string) {
  const cleanPlate = plate.replace(/\s+/g, "").toUpperCase();
  const apiKey = process.env.DVLA_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      creator: CREATOR,
      error: "DVLA_API_KEY environment variable is not set. Get a free key at https://developer-portal.driver-vehicle-licensing.api.gov.uk/ and add it as DVLA_API_KEY.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ registrationNumber: cleanPlate }),
      signal: controller.signal,
    });

    if (res.status === 404) {
      return { success: false, creator: CREATOR, error: `No vehicle found for plate "${cleanPlate}". Make sure it is a valid UK number plate.` };
    }
    if (res.status === 401 || res.status === 403) {
      return { success: false, creator: CREATOR, error: "Invalid or expired DVLA API key. Please update your DVLA_API_KEY." };
    }
    if (!res.ok) {
      return { success: false, creator: CREATOR, error: `DVLA API returned status ${res.status}` };
    }

    const data = await res.json();

    return {
      success: true,
      creator: CREATOR,
      platform: "DVLA UK Vehicle Enquiry",
      plate: cleanPlate,
      make: data.make || null,
      colour: data.colour || null,
      fuelType: data.fuelType || null,
      engineCapacityCC: data.engineCapacity || null,
      yearOfManufacture: data.yearOfManufacture || null,
      monthOfFirstRegistration: data.monthOfFirstRegistration || null,
      co2Emissions: data.co2Emissions != null ? `${data.co2Emissions} g/km` : null,
      motStatus: data.motStatus || null,
      motExpiryDate: data.motExpiryDate || null,
      taxStatus: data.taxStatus || null,
      taxDueDate: data.taxDueDate || null,
      typeApproval: data.typeApproval || null,
      wheelplan: data.wheelplan || null,
      revenueWeight: data.revenueWeight || null,
      realDrivingEmissions: data.realDrivingEmissions || null,
      euroStatus: data.euroStatus || null,
      markedForExport: data.markedForExport ?? null,
      dateOfLastV5CIssued: data.dateOfLastV5CIssued || null,
    };
  } catch (err: any) {
    return { success: false, creator: CREATOR, error: err?.name === "AbortError" ? "DVLA API request timed out" : `Request failed: ${err?.message}` };
  } finally {
    clearTimeout(timer);
  }
}

export async function telegramStalk(username: string) {
  const cleanUsername = username.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");

  const html = await fetchHTML(`https://t.me/${encodeURIComponent(cleanUsername)}`, {
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
  });

  if (!html) {
    return { success: false, creator: CREATOR, error: `Could not fetch Telegram profile for "${cleanUsername}"` };
  }

  const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/);
  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

  const extraMatch = html.match(/<div class="tgme_page_extra">([^<]+)<\/div>/);
  const extra = extraMatch?.[1]?.trim() || "";

  let subscribers: string | null = null;
  let members: string | null = null;
  let isChannel = false;
  let isGroup = false;
  let isBot = false;

  const subMatch = extra.match(/([\d\s,]+)\s*subscribers/i);
  const memMatch = extra.match(/([\d\s,]+)\s*members/i);
  if (subMatch) {
    subscribers = subMatch[1].replace(/\s/g, "").replace(/,/g, "");
    isChannel = true;
  }
  if (memMatch) {
    members = memMatch[1].replace(/\s/g, "").replace(/,/g, "");
    isGroup = true;
  }

  const verifiedMatch = html.match(/verified-icon/);
  const botMatch = html.match(/tgme_page_extra[^>]*>[^<]*bot/i) || html.match(/<\/i>\s*bot\s*<\/div>/i);
  if (botMatch) isBot = true;

  const name = nameMatch?.[1]?.trim() || null;
  const bio = descMatch?.[1]?.trim() || null;
  const avatar = imageMatch?.[1] || null;

  if (!name && !bio) {
    return {
      success: false,
      creator: CREATOR,
      platform: "Telegram",
      username: cleanUsername,
      profileUrl: `https://t.me/${cleanUsername}`,
      error: `Telegram user/channel "${cleanUsername}" not found or has no public profile.`,
    };
  }

  const type = isBot ? "bot" : isChannel ? "channel" : isGroup ? "group" : "user";

  return {
    success: true,
    creator: CREATOR,
    platform: "Telegram",
    username: cleanUsername,
    name,
    bio,
    avatar,
    subscribers: subscribers ? parseInt(subscribers) : null,
    members: members ? parseInt(members) : null,
    verified: !!verifiedMatch,
    type,
    profileUrl: `https://t.me/${cleanUsername}`,
    deepLink: `tg://resolve?domain=${cleanUsername}`,
  };
}
