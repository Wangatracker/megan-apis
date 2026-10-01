import axios from 'axios';

const cryptoFallback: Record<string, any> = {};

const cryptoCache = new Map<string, { data: any; expires: number }>();
const CRYPTO_TTL_MS = 60_000;

export async function getCryptoPrice(coin: string) {
  const key = coin.toLowerCase();
  const cached = cryptoCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  // Provider 1: CoinGecko
  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${key}&vs_currencies=usd,kes&include_24hr_change=true`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }, timeout: 8000,
    });
    const data = res.data[key];
    if (data) {
      const result = { coin: key, price_usd: data.usd, price_kes: data.kes, change_24h_percent: data.usd_24h_change?.toFixed(2) || null, source: "coingecko" };
      cryptoCache.set(key, { data: result, expires: Date.now() + CRYPTO_TTL_MS });
      return result;
    }
  } catch {}

  // Provider 2: CoinCap
  try {
    const res = await axios.get(`https://api.coincap.io/v2/assets/${key}`, { timeout: 8000 });
    const dd = res.data.data;
    if (dd) {
      const result = { coin: key, price_usd: parseFloat(dd.priceUsd).toFixed(2), price_kes: (parseFloat(dd.priceUsd) * 130).toFixed(2), change_24h_percent: parseFloat(dd.changePercent24Hr).toFixed(2), source: "coincap" };
      cryptoCache.set(key, { data: result, expires: Date.now() + CRYPTO_TTL_MS });
      return result;
    }
  } catch {}

  // Provider 3: Binance (very reliable, no key needed)
  try {
    const symbol = `${key.toUpperCase()}USDT`;
    const res = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, { timeout: 8000 });
    if (res.data && res.data.lastPrice) {
      const result = { coin: key, price_usd: parseFloat(res.data.lastPrice).toFixed(2), price_kes: (parseFloat(res.data.lastPrice) * 130).toFixed(2), change_24h_percent: parseFloat(res.data.priceChangePercent).toFixed(2), source: "binance" };
      cryptoCache.set(key, { data: result, expires: Date.now() + CRYPTO_TTL_MS });
      return result;
    }
  } catch {}

  if (cached) return cached.data;
  throw new Error(`Could not fetch price for "${coin}" from any provider`);
}

export async function getGlobalNews() {
  // Use RSS feeds from trusted sources — free, no API key, always fresh
  const feeds = [
    { source: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { source: "Reuters", url: "https://feeds.reuters.com/reuters/worldNews" },
    { source: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  ];
  const results: any[] = [];
  for (const feed of feeds) {
    try {
      const res = await axios.get(feed.url, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
      const xml = res.data as string;
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
      for (const item of items) {
        const block = item[1];
        const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim();
        const link = (block.match(/<link>([\s\S]*?)<\/link>/))?.[1]?.trim();
        const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/))?.[1]?.trim();
        const desc = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || block.match(/<description>([\s\S]*?)<\/description>/))?.[1]?.trim();
        if (title) results.push({ title, url: link, publishedAt: pubDate, description: (desc || "").replace(/<[^>]*>/g, "").slice(0, 200), source: feed.source });
      }
    } catch {}
  }
  if (results.length === 0) return { error: "All news feeds unavailable", articles: [] };
  return { articles: results, count: results.length, sources: feeds.map(f => f.source) };
}

export async function getKenyaNews() {
  // Kenyan news RSS — free, always fresh
  const feeds = [
    { source: "Standard Media", url: "https://www.standardmedia.co.ke/rss/headlines.php" },
    { source: "Nation Africa", url: "https://nation.africa/kenya/rss" },
    { source: "Capital FM", url: "https://www.capitalfm.co.ke/news/feed/" },
  ];
  const results: any[] = [];
  for (const feed of feeds) {
    try {
      const res = await axios.get(feed.url, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
      const xml = res.data as string;
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
      for (const item of items) {
        const block = item[1];
        const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim();
        const link = (block.match(/<link>([\s\S]*?)<\/link>/))?.[1]?.trim();
        const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/))?.[1]?.trim();
        if (title) results.push({ title, url: link, publishedAt: pubDate, source: feed.source });
      }
    } catch {}
  }
  if (results.length === 0) return { error: "Kenyan news feeds unavailable", articles: [] };
  return { articles: results, count: results.length };
}

export async function getAllCryptos() {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false', {
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    return res.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      price_usd: coin.current_price,
      market_cap: coin.market_cap,
      change_24h: coin.price_change_percentage_24h
    }));
  } catch {
    return { error: 'Failed to fetch crypto list', data: [] };
  }
}

export async function getForexRates() {
  try {
    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 10000 });
    return {
      base: 'USD',
      rates: res.data.rates,
      timestamp: res.data.time_last_updated
    };
  } catch {
    return { error: 'Failed to fetch forex rates', rates: {} };
  }
}

export async function convertForex(from: string, to: string, amount: number) {
  try {
    const rates = await getForexRates();
    if (rates.error) throw new Error('Failed to get rates');
    const rate = rates.rates[to.toUpperCase()] / rates.rates[from.toUpperCase()];
    return { from, to, amount, converted: amount * rate, rate };
  } catch {
    return { error: 'Failed to convert currency', result: 0 };
  }
}

export async function getWeather(city: string = 'Nairobi') {
  try {
    const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=demo`, { timeout: 10000 });
    return {
      city: res.data.name,
      temp: res.data.main.temp,
      feels_like: res.data.main.feels_like,
      humidity: res.data.main.humidity,
      description: res.data.weather[0].description,
      wind_speed: res.data.wind.speed
    };
  } catch {
    return { error: 'Failed to fetch weather', temp: 0, city };
  }
}
