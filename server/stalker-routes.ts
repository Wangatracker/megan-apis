import type { Express, Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

// ============================================
// STALKER ROUTES (All Working)
// ============================================

// 1. GitHub Stalk
async function githubStalk(username: string) {
  const response = await axios.get(`https://api.github.com/users/${username}`, {
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  return {
    username: response.data.login,
    name: response.data.name,
    bio: response.data.bio,
    avatar: response.data.avatar_url,
    followers: response.data.followers,
    following: response.data.following,
    public_repos: response.data.public_repos,
    location: response.data.location,
    blog: response.data.blog,
    company: response.data.company,
    created_at: response.data.created_at,
  };
}

// 2. Roblox Stalk
async function robloxStalk(username: string) {
  const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
    usernames: [username],
    excludeBannedUsers: false,
  }, {
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' },
  });
  
  const userId = userRes.data?.data?.[0]?.id;
  if (!userId) throw new Error('User not found');
  
  const [info, presence, friends, followers, following] = await Promise.all([
    axios.get(`https://users.roblox.com/v1/users/${userId}`),
    axios.post('https://presence.roblox.com/v1/presence/users', { userIds: [userId] }, {
      headers: { 'Content-Type': 'application/json' },
    }),
    axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
    axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
    axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
  ]);
  
  return {
    id: userId,
    username: info.data.name,
    display_name: info.data.displayName,
    description: info.data.description,
    created: info.data.created,
    friends: friends.data.count,
    followers: followers.data.count,
    following: following.data.count,
  };
}

// 3. TikTok Stalk
async function tiktokStalk(username: string) {
  const response = await axios.get(`https://tiktok.com/@${username}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  
  const $ = cheerio.load(response.data);
  const data = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').text();
  const result = JSON.parse(data);
  const userInfo = result['__DEFAULT_SCOPE__']['webapp.user-detail']['userInfo'];
  
  return {
    id: userInfo.user.id,
    username: userInfo.user.uniqueId,
    nickname: userInfo.user.nickname,
    signature: userInfo.user.signature,
    avatar: userInfo.user.avatarLarger,
    verified: userInfo.user.verified,
    followers: userInfo.stats.followerCount,
    following: userInfo.stats.followingCount,
    likes: userInfo.stats.heartCount,
    videos: userInfo.stats.videoCount,
  };
}

// 4. YouTube Stalk
async function youtubeStalk(username: string) {
  const response = await axios.get(`https://youtube.com/@${username}`, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  
  const $ = cheerio.load(response.data);
  const script = $('script').filter((_, el) => $(el).html()?.includes('var ytInitialData =')).html();
  const match = script?.match(/var ytInitialData = ({.*?});/);
  
  if (!match) throw new Error('Could not parse YouTube data');
  
  const data = JSON.parse(match[1]);
  const header = data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;
  const metadata = data.metadata?.channelMetadataRenderer;
  
  return {
    name: header?.title?.content || metadata?.title,
    username: metadata?.ownerUrls?.[0]?.split('@')[1] || username,
    description: metadata?.description,
    avatar: header?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
    channel_url: metadata?.channelUrl,
  };
}

// ============================================
// REGISTER ROUTES
// ============================================
export function registerStalkerRoutes(app: Express): void {

  app.get('/api/stalk/github', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await githubStalk(q);
      return res.json({ status: true, provider: "GitHub", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/stalk/roblox', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await robloxStalk(q);
      return res.json({ status: true, provider: "Roblox", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/stalk/tiktok', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await tiktokStalk(q);
      return res.json({ status: true, provider: "TikTok", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  app.get('/api/stalk/youtube', async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' required" });
    try {
      const result = await youtubeStalk(q);
      return res.json({ status: true, provider: "YouTube", result });
    } catch (e: any) {
      return res.status(500).json({ status: false, error: e.message });
    }
  });

  console.log("✅ Stalker Routes Registered:");
  console.log("  GET /api/stalk/github");
  console.log("  GET /api/stalk/roblox");
  console.log("  GET /api/stalk/tiktok");
  console.log("  GET /api/stalk/youtube");
}
