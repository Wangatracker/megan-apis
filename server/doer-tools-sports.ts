// ─── DOER SPORTS TOOLS ────────────────────────────────────────────────────
// 25 tools that call the Megan Sports API (via megan-apis proxy).
// Each returns a typed card for the frontend.

const SPORTS_BASE = process.env.SPORTS_API_BASE || "https://apis.megan.qzz.io";
const SPORTS_KEY = process.env.ADMIN_KEY || "megan_admin_master";

function d(raw: any): any { return raw?.data?.result ?? raw?.data ?? raw; }

export const SPORTS_TOOLS: Record<string, any> = {
  // ═══════════════ LIVE & SCHEDULE (7) ═══════════════
  get_live_matches: {
    kind: "read",
    description: "Get football matches happening RIGHT NOW with live scores and current minute. Returns empty array if nothing is live.",
    params: { sport: "string (optional: football, basketball, tennis, nba, nfl, etc — default: football)" },
    endpoint: "/api/sports/v2/matches/live",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const matches = data?.matches || [];
      return {
        type: "match_list",
        status: "live",
        count: matches.length,
        items: matches.map((m: any) => ({
          id: m.id, title: m.title, league: m.league,
          minute: m.currentMinute, homeScore: m.homeScore, awayScore: m.awayScore,
          homeLogo: m.homeTeam?.logo, awayLogo: m.awayTeam?.logo,
          hasStreams: m.hasStreams, kickoff: m.kickoff,
        })),
      };
    },
  },

  get_today_matches: {
    kind: "read",
    description: "Get matches scheduled for TODAY (UTC). May be empty. If empty, Doer should proactively check get_upcoming_matches and offer alternatives.",
    params: {},
    endpoint: "/api/sports/v2/matches/today",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const matches = data?.matches || [];
      return {
        type: "match_list",
        status: "today",
        date: data?.date,
        count: matches.length,
        items: matches.map((m: any) => ({
          id: m.id, title: m.title, league: m.league, status: m.status,
          kickoff: m.kickoff, homeScore: m.homeScore, awayScore: m.awayScore,
          homeLogo: m.homeTeam?.logo, awayLogo: m.awayTeam?.logo,
        })),
      };
    },
  },

  get_tomorrow_matches: {
    kind: "read",
    description: "Get matches scheduled for TOMORROW (UTC).",
    params: {},
    endpoint: "/api/sports/v2/matches/tomorrow",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const matches = data?.matches || [];
      return {
        type: "match_list",
        status: "tomorrow",
        date: data?.date,
        count: matches.length,
        items: matches.map((m: any) => ({
          id: m.id, title: m.title, league: m.league,
          kickoff: m.kickoff, homeLogo: m.homeTeam?.logo, awayLogo: m.awayTeam?.logo,
        })),
      };
    },
  },

  get_upcoming_matches: {
    kind: "read",
    description: "Get matches coming up in the next 24-72 hours across all providers. Great for proactive suggestions when nothing is live.",
    params: {},
    endpoint: "/api/sports/v2/matches/upcoming",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const matches = data?.matches || [];
      return {
        type: "match_list",
        status: "upcoming",
        window: data?.window || "next 24 hours",
        count: matches.length,
        items: matches.slice(0, 20).map((m: any) => ({
          id: m.id, title: m.title, league: m.league,
          kickoff: m.kickoff, homeLogo: m.homeTeam?.logo, awayLogo: m.awayTeam?.logo,
        })),
      };
    },
  },

  get_matches_by_league: {
    kind: "read",
    description: "Get matches for a specific league by name (e.g. 'Premier League', 'LaLiga', 'AFCON').",
    params: { league: "string (e.g. 'Premier League')" },
    endpoint: "/api/sports/v2/matches/league/:league",
    method: "GET",
    build: (a: any) => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const matches = data?.matches || [];
      return {
        type: "match_list",
        status: "league",
        league: data?.league,
        count: matches.length,
        items: matches.slice(0, 20).map((m: any) => ({
          id: m.id, title: m.title, league: m.league,
          status: m.status, kickoff: m.kickoff, homeScore: m.homeScore, awayScore: m.awayScore,
        })),
      };
    },
  },

  search_matches: {
    kind: "read",
    description: "Search for matches by team name, league, or title. Use for 'Manchester City matches', 'Barcelona', 'Arsenal fixtures', etc.",
    params: { q: "string (search query)" },
    endpoint: "/api/sports/v2/matches/search",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q } }),
    classify: (raw: any) => {
      const data = d(raw);
      const matches = data?.matches || [];
      return {
        type: "match_list",
        status: "search",
        query: data?.query,
        count: matches.length,
        items: matches.slice(0, 20).map((m: any) => ({
          id: m.id, title: m.title, league: m.league,
          status: m.status, kickoff: m.kickoff,
          homeScore: m.homeScore, awayScore: m.awayScore,
          homeLogo: m.homeTeam?.logo, awayLogo: m.awayTeam?.logo,
        })),
      };
    },
  },

  get_match_details: {
    kind: "read",
    description: "Get full details for a single match by its ID (e.g. 'wf_401927911').",
    params: { id: "string (prefixed match ID)" },
    endpoint: "/api/sports/v2/match/:id",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const m = data?.match || data;
      return {
        type: "match_detail",
        id: m?.id, title: m?.title, league: m?.league,
        status: m?.status, scores: m?.scores, teams: m?.teams,
        streams: m?.streams, venue: m?.venue,
      };
    },
  },

  // ═══════════════ STREAMS & HIGHLIGHTS (4) ═══════════════
  get_match_streams: {
    kind: "read",
    description: "Get playable live stream URLs for a match. Multiple servers returned when available.",
    params: { id: "string (match ID)" },
    endpoint: "/api/sports/v2/match/:id/streams",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const streams = data?.streams || [];
      return {
        type: "stream_list",
        id: data?.id,
        count: streams.length,
        streams: streams.map((s: any) => ({ label: s.label, url: s.url, quality: s.quality })),
      };
    },
  },

  get_match_stats: {
    kind: "read",
    description: "Get detailed match statistics (boxscore, rosters, commentary). Only available for WatchFooty matches (wf_ prefix).",
    params: { id: "string (wf_ match ID)" },
    endpoint: "/api/sports/v2/match/:id/stats",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const s = data?.stats || data;
      return {
        type: "match_stats",
        id: data?.id,
        venue: s?.venue, boxscore: s?.boxscore, rosters: s?.rosters, commentary: s?.commentary,
      };
    },
  },

  get_recent_highlights: {
    kind: "read",
    description: "Get the latest football match highlights with MP4 video URLs.",
    params: {},
    endpoint: "/api/sports/v2/highlights",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const highlights = data?.highlights || [];
      return {
        type: "highlight_list",
        count: highlights.length,
        items: highlights.slice(0, 15).map((h: any) => ({
          id: h.id, title: h.title, url: h.videoUrl, thumbnail: h.cover,
          duration: h.duration, views: h.viewCount,
        })),
      };
    },
  },

  get_match_highlights: {
    kind: "read",
    description: "Get highlights specific to a match by ID.",
    params: { id: "string (match ID)" },
    endpoint: "/api/sports/v2/match/:id/highlights",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const highlights = data?.highlights || [];
      return { type: "highlight_list", id: data?.matchId, count: highlights.length, items: highlights };
    },
  },

  // ═══════════════ TEAMS (5) ═══════════════
  get_team_info: {
    kind: "read",
    description: "Get full profile for a team by TheSportsDB ID (e.g. 133604 for Arsenal).",
    params: { id: "string (team ID)" },
    endpoint: "/api/sports/v2/teams/:id",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const t = data?.team || data;
      return {
        type: "team",
        id: t?.idTeam, name: t?.strTeam, logo: t?.strTeamBadge, stadium: t?.strStadium,
        country: t?.strCountry, league: t?.strLeague, description: t?.strDescriptionEN?.slice(0, 500),
      };
    },
  },

  get_team_squad: {
    kind: "read",
    description: "Get the full squad list for a team by ID.",
    params: { id: "string (team ID)" },
    endpoint: "/api/sports/v2/teams/:id/squad",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const players = data?.players || [];
      return {
        type: "player_list",
        teamId: data?.teamId,
        count: players.length,
        items: players.slice(0, 30).map((p: any) => ({
          name: p.strPlayer, position: p.strPosition, number: p.strNumber,
          nationality: p.strNationality, photo: p.strThumb,
        })),
      };
    },
  },

  get_team_fixtures: {
    kind: "read",
    description: "Get upcoming fixtures for a team by ID.",
    params: { id: "string (team ID)" },
    endpoint: "/api/sports/v2/teams/:id/fixtures",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const fixtures = data?.fixtures || [];
      return {
        type: "match_list",
        status: "team_fixtures",
        teamId: data?.teamId,
        count: fixtures.length,
        items: fixtures.slice(0, 10).map((f: any) => ({
          id: f.idEvent, title: f.strEvent, date: f.dateEvent, time: f.strTime,
          homeTeam: f.strHomeTeam, awayTeam: f.strAwayTeam, league: f.strLeague,
        })),
      };
    },
  },

  get_team_results: {
    kind: "read",
    description: "Get recent results for a team by ID.",
    params: { id: "string (team ID)" },
    endpoint: "/api/sports/v2/teams/:id/fixtures",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      return { type: "match_list", status: "team_results", items: data?.fixtures || [] };
    },
  },

  search_teams: {
    kind: "read",
    description: "Search for teams by name (e.g. 'Arsenal', 'Manchester').",
    params: { q: "string" },
    endpoint: "/api/sports/v2/teams/search",
    method: "GET",
    build: (a: any) => ({ query: { q: a.q } }),
    classify: (raw: any) => {
      const data = d(raw);
      const teams = data?.teams || [];
      return {
        type: "team_list",
        query: data?.query,
        count: teams.length,
        items: teams.map((t: any) => typeof t === "string" ? { name: t } : t),
      };
    },
  },

  // ═══════════════ LEAGUES (4) ═══════════════
  get_all_leagues: {
    kind: "read",
    description: "Get list of all available football leagues.",
    params: {},
    endpoint: "/api/sports/v2/leagues",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const leagues = data?.leagues || [];
      return {
        type: "league_list",
        count: leagues.length,
        items: leagues.map((l: any) => typeof l === "string" ? { name: l } : l),
      };
    },
  },

  get_league_info: {
    kind: "read",
    description: "Get detailed info about a league by its ID.",
    params: { id: "string (league ID)" },
    endpoint: "/api/sports/v2/leagues/:id",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const l = data?.league || data;
      return {
        type: "league",
        id: l?.idLeague, name: l?.strLeague, sport: l?.strSport,
        country: l?.strCountry, logo: l?.strBadge,
        description: l?.strDescriptionEN?.slice(0, 500),
      };
    },
  },

  get_league_standings: {
    kind: "read",
    description: "Get the current standings/table for a league by ID. Use 4328 for English Premier League, 4335 for La Liga, 4332 for Serie A, 4331 for Bundesliga.",
    params: { id: "string (league ID)" },
    endpoint: "/api/sports/v2/leagues/:id/standings",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const standings = data?.standings || [];
      return {
        type: "standings",
        leagueId: data?.leagueId,
        source: data?.source,
        count: standings.length,
        items: standings.slice(0, 25).map((t: any, i: number) => ({
          position: i + 1,
          team: t.strTeam || t.teamName || t.name,
          played: t.intPlayed,
          wins: t.intWin,
          draws: t.intDraw,
          losses: t.intLoss,
          points: t.intPoints || t.points,
          goalsFor: t.intGoalsFor,
          goalsAgainst: t.intGoalsAgainst,
          goalDiff: t.intGoalDifference,
        })),
      };
    },
  },

  get_league_fixtures: {
    kind: "read",
    description: "Get upcoming fixtures for a league by ID.",
    params: { id: "string (league ID)" },
    endpoint: "/api/sports/v2/leagues/:id/fixtures",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const fixtures = data?.fixtures || [];
      return {
        type: "match_list",
        status: "league_fixtures",
        leagueId: data?.leagueId,
        count: fixtures.length,
        items: fixtures.slice(0, 15).map((f: any) => ({
          id: f.idEvent, title: f.strEvent, date: f.dateEvent,
          homeTeam: f.strHomeTeam, awayTeam: f.strAwayTeam,
        })),
      };
    },
  },

  // ═══════════════ WORLD CUP (3) ═══════════════
  get_worldcup_teams: {
    kind: "read",
    description: "Get all 48 teams competing in the FIFA World Cup 2026.",
    params: {},
    endpoint: "/api/sports/v2/worldcup/teams",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const teams = data?.teams || [];
      return {
        type: "team_list",
        tournament: "FIFA World Cup 2026",
        count: teams.length,
        items: teams.map((t: any) => ({
          slug: t.slug, title: t.title, kicker: t.kicker, image: t.image,
        })),
      };
    },
  },

  get_worldcup_superstars: {
    kind: "read",
    description: "Get 22 FIFA World Cup superstar player profiles (Messi, Ronaldo, Mbappé, Haaland, Salah, etc).",
    params: {},
    endpoint: "/api/sports/v2/worldcup/superstars",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const stars = data?.superstars || [];
      return {
        type: "player_list",
        tournament: "FIFA World Cup 2026",
        count: stars.length,
        items: stars.map((s: any) => ({
          slug: s.slug, title: s.title, kicker: s.kicker, image: s.image,
        })),
      };
    },
  },

  get_worldcup_fixtures: {
    kind: "read",
    description: "Get upcoming FIFA World Cup fixtures.",
    params: {},
    endpoint: "/api/sports/v2/worldcup/fixtures",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const fixtures = data?.fixtures || [];
      return { type: "match_list", status: "worldcup", count: fixtures.length, items: fixtures };
    },
  },

  // ═══════════════ MULTI-SPORT & META (3) ═══════════════
  get_sports_list: {
    kind: "read",
    description: "Get the list of all sports supported by Megan Sports (football, basketball, tennis, NBA, NFL, F1, cricket, baseball, hockey, rugby).",
    params: {},
    endpoint: "/api/sports/v2/sports",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const sports = data?.sports || [];
      return {
        type: "sports_list",
        count: sports.length,
        items: sports.map((s: any) => ({ id: s.id, name: s.name, icon: s.icon })),
      };
    },
  },

  get_sports_news: {
    kind: "read",
    description: "Get latest football news articles (Tuko, BBC, Al Jazeera).",
    params: {},
    endpoint: "/api/sports/v2/news",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const articles = data?.articles || [];
      return {
        type: "news_list",
        count: articles.length,
        items: articles.slice(0, 20).map((a: any) => ({
          id: a.id, title: a.title, summary: a.summary,
          cover: a.cover, url: a.url, source: a.source,
        })),
      };
    },
  },

  get_sports_providers: {
    kind: "read",
    description: "Get status of all sports data providers (WatchFooty, CDNLiveTV, Streamed.pk, TheSportsDB).",
    params: {},
    endpoint: "/api/sports/v2/providers",
    method: "GET",
    build: () => ({ query: {} }),
    classify: (raw: any) => {
      const data = d(raw);
      const providers = data?.providers || [];
      return {
        type: "providers",
        count: providers.length,
        items: providers.map((p: any) => ({
          id: p.id, name: p.name, status: p.status,
          capabilities: p.capabilities, sports: p.sports,
        })),
      };
    },
  },
};

export function registerSportsTools(DOER_TOOLS: Record<string, any>): number {
  let count = 0;
  for (const [name, def] of Object.entries(SPORTS_TOOLS)) {
    if (!DOER_TOOLS[name]) {
      DOER_TOOLS[name] = def;
      count++;
    }
  }
  return count;
}
