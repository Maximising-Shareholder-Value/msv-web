import { trackedFetch } from "./apiUsage";
// lib/twelveData.ts — forex quotes from Twelve Data through the msv-api proxy.
// One comma-separated request covers every pair. Finnhub's free tier has no
// forex coverage, so this is the source the homepage's currency strip uses.

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export interface ForexQuote { close: string; percent_change: string }

export async function getForexQuotes(symbols: string[]): Promise<Record<string, ForexQuote> | null> {
  try {
    const qs = new URLSearchParams({ path: "/quote", symbol: symbols.join(",") });
    const res = await trackedFetch(`${API_BASE}/api/twelvedata?${qs}`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, ForexQuote>;
  } catch {
    return null;
  }
}
