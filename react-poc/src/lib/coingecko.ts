import { trackedFetch } from "./apiUsage";
// lib/coingecko.ts — crypto market data for the homepage's Crypto tab, through
// the msv-api CoinGecko proxy. One call covers every coin in the list.

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

/** The homepage's six coins: exchange-style symbol → CoinGecko id and display name. */
export const CRYPTO_COINS: { symbol: string; id: string; name: string }[] = [
  { symbol: "BINANCE:BTCUSDT", id: "bitcoin", name: "Bitcoin" },
  { symbol: "BINANCE:ETHUSDT", id: "ethereum", name: "Ethereum" },
  { symbol: "BINANCE:SOLUSDT", id: "solana", name: "Solana" },
  { symbol: "BINANCE:XRPUSDT", id: "ripple", name: "XRP" },
  { symbol: "BINANCE:DOGEUSDT", id: "dogecoin", name: "Dogecoin" },
  { symbol: "BINANCE:ADAUSDT", id: "cardano", name: "Cardano" },
];

export interface CoinMarket {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  circulating_supply: number | null;
  max_supply: number | null;
  ath_change_percentage: number | null;
}

export interface CoinDetail {
  current_price: number | null;
  market_cap_rank: number | null;
  market_cap: number | null;
  total_volume: number | null;
  circulating_supply: number | null;
  max_supply: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  price_change_percentage_30d: number | null;
  price_change_percentage_1y: number | null;
  ath: number | null;
  ath_date: string | null;
  ath_change_percentage: number | null;
  atl: number | null;
  atl_date: string | null;
}

/** One coin's market data (CoinGecko /coins/{id}). The proxy allows this path, unlike /coins/markets. */
export async function getCoinDetail(id: string): Promise<CoinDetail | null> {
  try {
    const qs = new URLSearchParams({
      path: `/coins/${id}`, localization: "false", tickers: "false",
      community_data: "false", developer_data: "false", sparkline: "false",
    });
    const res = await trackedFetch(`${API_BASE}/api/coingecko?${qs}`);
    if (!res.ok) return null;
    const d = await res.json() as { market_cap_rank?: number; market_data?: Record<string, Record<string, number> & { usd?: number }> & Record<string, { usd?: number }> };
    const md = d.market_data;
    if (!md) return null;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      current_price: n(md.current_price?.usd),
      market_cap_rank: n(d.market_cap_rank),
      market_cap: n(md.market_cap?.usd),
      total_volume: n(md.total_volume?.usd),
      circulating_supply: n(md.circulating_supply),
      max_supply: n(md.max_supply),
      price_change_percentage_24h: n(md.price_change_percentage_24h),
      price_change_percentage_7d: n(md.price_change_percentage_7d),
      price_change_percentage_30d: n(md.price_change_percentage_30d),
      price_change_percentage_1y: n(md.price_change_percentage_1y),
      ath: n(md.ath?.usd),
      ath_date: (md.ath_date?.usd as unknown as string) ?? null,
      ath_change_percentage: n(md.ath_change_percentage?.usd),
      atl: n(md.atl?.usd),
      atl_date: (md.atl_date?.usd as unknown as string) ?? null,
    };
  } catch {
    return null;
  }
}

/** Market data for the homepage's six coins, one detail request each (the markets list is blocked on the proxy). */
export async function getCoinMarkets(): Promise<CoinMarket[] | null> {
  const details = await Promise.all(CRYPTO_COINS.map(async c => ({ c, d: await getCoinDetail(c.id) })));
  const rows: CoinMarket[] = [];
  details.forEach(({ c, d }) => {
    if (!d) return;
    rows.push({
      id: c.id, symbol: c.id, current_price: d.current_price ?? 0,
      price_change_percentage_24h: d.price_change_percentage_24h, market_cap: d.market_cap,
      market_cap_rank: d.market_cap_rank, total_volume: d.total_volume,
      circulating_supply: d.circulating_supply, max_supply: d.max_supply, ath_change_percentage: d.ath_change_percentage,
    });
  });
  return rows.length ? rows : null;
}
