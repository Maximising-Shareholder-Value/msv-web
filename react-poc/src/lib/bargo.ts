// lib/bargo.ts — congressional stock trades, from Bargo's free Congress Trades API
// (www.bargo.ai/free-apis/congress), via the msv-api proxy (`/api/bargo`).
//
// This used to call Bargo directly from the browser — fine on the free, keyless tier (no
// secret involved, real CORS support confirmed live 2026-10-08). Moved behind the proxy the
// same day once Jozsua got a free API key: a key can't go in client-side code like this file
// (it ships straight to every visitor's browser, readable in the page's own JS), so it lives
// as a Cloudflare secret on msv-api instead, the same as every other keyed source this app
// uses (Finnhub, Twelve Data, FRED, FMP). msv-api also caches responses at the edge, so many
// visitors' page loads can share one real Bargo request instead of each spending their own —
// real rate limits confirmed live: 30 requests/day & 100 rows/day keyless (shared per visitor
// IP, since that tier is called with no key); 100 requests/day & 1,000 rows/day with the free
// key msv-api now holds (the "1,000 requests/day" figure in Bargo's own docs page didn't match
// what the live response headers actually showed for this key — the header is what's trusted).
//
// Underlying source: the House Clerk's and Senate's own STOCK Act disclosure filings — real
// transactions, but disclosed up to ~45 days after the trade. Never "live" in the sense of
// today's trading.

import { trackedFetch } from "./apiUsage";

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export interface CongressTrade {
  member: string;
  member_slug: string;
  chamber: "house" | "senate" | string;
  state: string;
  ticker: string;
  asset: string;
  type: string;
  amount_low: number;
  amount_high: number;
  amount_range: string;
  transaction_date: string;
  disclosure_date: string;
  est_price: number | null;
  recent_price: number | null;
  recent_price_date?: string;
  perf_pct: number | null;
  realized_return_pct: number | null;
  outcome: string | null;
  filing_portal: string;
}

export interface CongressMemberSummary {
  member: string;
  member_slug: string;
  chamber: string;
  state: string;
  trades: number;
  buys: number;
  sells: number;
  last_trade: string;
}

export interface CongressMemberDetail {
  member: string;
  member_slug: string;
  chamber: string;
  state: string;
  stats: { trades: number; buys: number; sells: number; last_trade: string; avg_buy_perf_pct: number | null };
  trades: CongressTrade[];
}

export interface CongressStats {
  totals: { trades: number; members: number; tickers: number; buys: number; sells: number };
  latest_transaction: string;
  latest_disclosure: string;
  most_traded_90d: { ticker: string; trades: number; buys: number; sells: number; members: number }[];
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const search = new URLSearchParams({ path });
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const res = await trackedFetch(`${API_BASE}/api/bargo?${search.toString()}`);
  if (!res.ok) throw new Error(`Bargo returned ${res.status}`);
  return res.json();
}

/**
 * A real network result, or — only when the live call fails (most likely the free tier's
 * daily limit) — the last successful response this browser got for the exact same request,
 * read back from localStorage. Never invented data: `stale` is only true when `data` came
 * from a genuine earlier fetch, and the UI is expected to say so rather than pass it off as
 * current.
 */
export interface Cached<T> { data: T; stale: boolean; cachedAt: string | null }

async function getCached<T>(path: string, params?: Record<string, string | number | undefined>): Promise<Cached<T>> {
  const key = `bargo-cache:${path}:${JSON.stringify(params ?? {})}`;
  try {
    const data = await get<T>(path, params);
    try { localStorage.setItem(key, JSON.stringify({ data, at: new Date().toISOString() })); } catch { /* storage blocked: no cache, but the live call still succeeded */ }
    return { data, stale: false, cachedAt: null };
  } catch (err) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw) as { data: T; at: string };
        return { data: cached.data, stale: true, cachedAt: cached.at };
      }
    } catch { /* storage blocked or corrupt: nothing to fall back to */ }
    throw err;
  }
}

export interface TradesFilter {
  limit?: number;
  page?: number;
  ticker?: string;
  member?: string;
  chamber?: "house" | "senate";
  type?: string;
}

export function fetchTrades(filter: TradesFilter): Promise<Cached<{ trades: CongressTrade[]; page: number; limit: number; count: number }>> {
  return getCached("/trades", filter as Record<string, string | number | undefined>);
}

export function fetchMembers(limit = 10): Promise<Cached<{ members: CongressMemberSummary[] }>> {
  return getCached("/members", { limit });
}

export function fetchMember(slug: string): Promise<Cached<CongressMemberDetail>> {
  return getCached(`/members/${encodeURIComponent(slug)}`);
}

export function fetchStats(): Promise<Cached<CongressStats>> {
  return getCached("/stats");
}
