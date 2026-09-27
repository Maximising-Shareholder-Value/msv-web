// Types describe the *shape* of the data each API returns. If we mistype a
// field name anywhere in the app (say `market_cap_rnak`), the editor and
// `npm run typecheck` flag it immediately — the vanilla site can't do that.

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  circulating_supply: number;
  max_supply: number | null;
  ath_change_percentage: number;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  price_change_percentage_1y_in_currency?: number | null;
  sparkline_in_7d?: { price: number[] };
}

export interface GlobalStats {
  data: {
    active_cryptocurrencies: number;
    markets: number;
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth: number };
    market_cap_change_percentage_24h_usd: number;
  };
}

export interface TrendingResponse {
  coins: {
    item: {
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number | null;
      thumb: string;
      data?: { price_change_percentage_24h?: { usd?: number } };
    };
  }[];
}

export interface Category {
  id: string;
  name: string;
  market_cap: number | null;
  market_cap_change_24h: number | null;
  volume_24h: number | null;
  top_3_coins: string[];
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank: number | null;
  categories: (string | null)[];
  image: { large: string };
  genesis_date: string | null;
  hashing_algorithm: string | null;
  block_time_in_minutes: number | null;
  sentiment_votes_up_percentage: number | null;
  description: { en: string };
  links: { homepage: string[] };
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    fully_diluted_valuation: { usd?: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    ath: { usd: number };
    ath_date: { usd: string };
    ath_change_percentage: { usd: number };
    atl: { usd: number };
    atl_date: { usd: string };
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    price_change_percentage_24h: number | null;
    price_change_percentage_7d: number | null;
    price_change_percentage_14d: number | null;
    price_change_percentage_30d: number | null;
    price_change_percentage_60d: number | null;
    price_change_percentage_200d: number | null;
    price_change_percentage_1y: number | null;
    price_change_percentage_1h_in_currency?: { usd?: number };
  };
}

export interface MarketChart {
  prices: [number, number][];
}

export interface FearGreedPoint {
  value: string;
  value_classification: string;
}

export interface LlamaChain {
  name: string;
  tvl: number;
}

export interface Stablecoin {
  name: string;
  symbol: string;
  pegType?: string;
  pegMechanism?: string;
  circulating?: { peggedUSD?: number };
  circulatingPrevWeek?: { peggedUSD?: number };
}

export interface Exchange {
  id: string;
  name: string;
  year_established: number | null;
  country: string | null;
  url: string;
  image: string;
  trust_score: number | null;
  trust_score_rank: number | null;
  trade_volume_24h_btc: number;
}

export interface Derivative {
  market: string;
  symbol: string;
  index_id: string;
  price: string;
  price_percentage_change_24h: number | null;
  contract_type: string;
  funding_rate: number | null;
  open_interest: number | null;
  volume_24h: number | null;
}

export interface Protocol {
  name: string;
  category: string | null;
  tvl: number | null;
  change_1d: number | null;
  change_7d: number | null;
  chains: string[];
  logo?: string;
}

export interface YieldPool {
  project: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  stablecoin: boolean;
  ilRisk: string;
}

export interface StablecoinPriced extends Stablecoin {
  price?: number;
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number; // unix seconds
  image?: string;
  related?: string;
}
