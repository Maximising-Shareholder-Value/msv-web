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

export async function getCoinMarkets(): Promise<CoinMarket[] | null> {
  try {
    const qs = new URLSearchParams({
      path: "/coins/markets", vs_currency: "usd", order: "market_cap_desc",
      ids: CRYPTO_COINS.map(c => c.id).join(","),
    });
    const res = await fetch(`${API_BASE}/api/coingecko?${qs}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? (data as CoinMarket[]) : null;
  } catch {
    return null;
  }
}
