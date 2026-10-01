import axios from 'axios';

const cryptoFallback: Record<string, any> = {};

const cryptoCache = new Map<string, { data: any; expires: number }>();
const CRYPTO_TTL_MS = 60_000;

// Symbol maps for providers that use ticker codes instead of coin names
const BINANCE_SYMBOLS: Record<string, string> = {
  bitcoin: "BTCUSDT", ethereum: "ETHUSDT", binancecoin: "BNBUSDT", bnb: "BNBUSDT",
  ripple: "XRPUSDT", xrp: "XRPUSDT", cardano: "ADAUSDT", ada: "ADAUSDT",
  solana: "SOLUSDT", sol: "SOLUSDT", dogecoin: "DOGEUSDT", doge: "DOGEUSDT",
  polkadot: "DOTUSDT", dot: "DOTUSDT", matic: "MATICUSDT", polygon: "MATICUSDT",
  litecoin: "LTCUSDT", ltc: "LTCUSDT", tron: "TRXUSDT", trx: "TRXUSDT",
  shiba: "SHIBUSDT", shib: "SHIBUSDT", avalanche: "AVAXUSDT", avax: "AVAXUSDT",
  chainlink: "LINKUSDT", link: "LINKUSDT", atom: "ATOMUSDT", cosmos: "ATOMUSDT",
  uniswap: "UNIUSDT", uni: "UNIUSDT", stellar: "XLMUSDT", xlm: "XLMUSDT",
  near: "NEARUSDT", aptos: "APTUSDT", apt: "APTUSDT", arbitrum: "ARBUSDT",
  optimism: "OPUSDT", op: "OPUSDT", "internet-computer": "ICPUSDT", icp: "ICPUSDT",
};

const KRAKEN_SYMBOLS: Record<string, string> = {
  bitcoin: "XBTUSD", ethereum: "ETHUSD", ripple: "XRPUSD", xrp: "XRPUSD",
  cardano: "ADAUSD", ada: "ADAUSD", solana: "SOLUSD", sol: "SOLUSD",
  dogecoin: "XDGUSD", doge: "XDGUSD", polkadot: "DOTUSD", dot: "DOTUSD",
  litecoin: "LTCUSD", ltc: "LTCUSD", chainlink: "LINKUSD", link: "LINKUSD",
  stellar: "XLMUSD", xlm: "XLMUSD", uniswap: "UNIUSD", uni: "UNIUSD",
};

const KES_RATE_FALLBACK = 129;


export async function getCryptoPrice(coin: string) {
  const key = coin.toLowerCase().trim();
  const cached = cryptoCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const errors: string[] = [];

  // ── Provider 1: Binance (uses ticker symbols, very reliable) ──
  const binanceSymbol = BINANCE_SYMBOLS[key];
  if (binanceSymbol) {
    try {
      const res = await axios.get(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
        { timeout: 6000 }
      );
      if (res.data?.lastPrice) {
        const usd = parseFloat(res.data.lastPrice);
        const result = {
          coin: key,
          symbol: binanceSymbol.replace("USDT", ""),
          price_usd: usd.toFixed(2),
          price_kes: (usd * KES_RATE_FALLBACK).toFixed(2),
          change_24h_percent: parseFloat(res.data.priceChangePercent).toFixed(2),
          source: "binance",
          updatedAt: new Date().toISOString(),
        };
        cryptoCache.set(key, { data: result, expires: Date.now() + CRYPTO_TTL_MS });
        return result;
      }
    } catch (e: any) { errors.push(`binance: ${e.message}`); }
  }

  // ── Provider 2: Kraken ──
  const krakenSymbol = KRAKEN_SYMBOLS[key];
  if (krakenSymbol) {
    try {
      const res = await axios.get(
        `https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`,
        { timeout: 6000 }
      );
      const result = res.data?.result;
      const firstKey = result ? Object.keys(result)[0] : null;
      if (firstKey && result[firstKey]?.c?.[0]) {
        const usd = parseFloat(result[firstKey].c[0]);
        const out = {
          coin: key,
          symbol: krakenSymbol.replace("USD", ""),
          price_usd: usd.toFixed(2),
          price_kes: (usd * KES_RATE_FALLBACK).toFixed(2),
          change_24h_percent: null,
          source: "kraken",
          updatedAt: new Date().toISOString(),
        };
        cryptoCache.set(key, { data: out, expires: Date.now() + CRYPTO_TTL_MS });
        return out;
      }
    } catch (e: any) { errors.push(`kraken: ${e.message}`); }
  }

  // ── Provider 3: CoinGecko (has KES if works, but often rate-limited) ──
  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${key}&vs_currencies=usd,kes&include_24hr_change=true`,
      { timeout: 6000, headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
    );
    const data = res.data?.[key];
    if (data?.usd) {
      const out = {
        coin: key,
        price_usd: data.usd.toString(),
        price_kes: data.kes?.toString() || (data.usd * KES_RATE_FALLBACK).toFixed(2),
        change_24h_percent: data.usd_24h_change?.toFixed(2) || null,
        source: "coingecko",
        updatedAt: new Date().toISOString(),
      };
      cryptoCache.set(key, { data: out, expires: Date.now() + CRYPTO_TTL_MS });
      return out;
    }
  } catch (e: any) { errors.push(`coingecko: ${e.message}`); }

  // ── Provider 4: Blockchain.info (BTC only, always works) ──
  if (key === "bitcoin" || key === "btc") {
    try {
      const res = await axios.get("https://blockchain.info/ticker", { timeout: 6000 });
      const usd = res.data?.USD?.last;
      if (usd) {
        const out = {
          coin: "bitcoin",
          symbol: "BTC",
          price_usd: usd.toFixed(2),
          price_kes: (usd * KES_RATE_FALLBACK).toFixed(2),
          change_24h_percent: null,
          source: "blockchain.info",
          updatedAt: new Date().toISOString(),
        };
        cryptoCache.set(key, { data: out, expires: Date.now() + CRYPTO_TTL_MS });
        return out;
      }
    } catch (e: any) { errors.push(`blockchain.info: ${e.message}`); }
  }

  // ── Final fallback: stale cache ──
  if (cached) return cached.data;

  // ── Absolute last resort: helpful error ──
  throw new Error(
    `Could not fetch price for "${coin}". ` +
    `Tried Binance, Kraken, CoinGecko${key === "bitcoin" ? ", Blockchain.info" : ""}. ` +
    `Check the coin name (e.g. bitcoin, ethereum, solana).`
  );
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
