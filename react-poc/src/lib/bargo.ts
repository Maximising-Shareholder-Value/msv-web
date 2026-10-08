// lib/bargo.ts — congressional stock trades, from Bargo's free Congress Trades API
// (www.bargo.ai/free-apis/congress). Real CORS support confirmed live, 2026-10-08 — called
// directly from the browser, no msv-api proxy needed, same tier as Polymarket.
//
// Free-tier limits (per Bargo's own docs, confirmed live): keyless, 30 requests/day and 100
// rows/day, counted per visitor's own IP (not shared across this site's visitors, since every
// call happens client-side). Kept economical on purpose: one /stats call, one /trades call per
// filter change (not auto-refreshed), and member detail only fetched when a member is opened.
//
// Underlying source: the House Clerk's and Senate's own STOCK Act disclosure filings — real
// transactions, but disclosed up to ~45 days after the trade. Never "live" in the sense of
// today's trading.

const BASE = "https://www.bargo.ai/free-apis/congress/v1";

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
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Bargo returned ${res.status}`);
  return res.json();
}

export interface TradesFilter {
  limit?: number;
  page?: number;
  ticker?: string;
  member?: string;
  chamber?: "house" | "senate";
  type?: string;
}

export function fetchTrades(filter: TradesFilter): Promise<{ trades: CongressTrade[]; page: number; limit: number; count: number }> {
  return get("/trades", filter as Record<string, string | number | undefined>);
}

export function fetchMembers(limit = 10): Promise<{ members: CongressMemberSummary[] }> {
  return get("/members", { limit });
}

export function fetchMember(slug: string): Promise<CongressMemberDetail> {
  return get(`/members/${encodeURIComponent(slug)}`);
}

export function fetchStats(): Promise<CongressStats> {
  return get("/stats");
}
