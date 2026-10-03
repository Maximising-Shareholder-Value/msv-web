// lib/finnhub.ts — quotes and fund metrics for the React pages, fetched
// through the same msv-api proxy the live site uses (so no API key reaches
// the browser).
//
// Why a queue: Finnhub's free tier allows 60 calls a minute, shared by every
// visitor. A page that needs 60+ prices can't fire them all at once, so every
// request here goes through a small queue (one at a time, about 1.1 seconds apart — about 55 a minute, under the limit).
// Results are cached so a ticker is only fetched once per window.
//
// The vanilla site does the same job in dataUtils.js (fetchQuoteCached,
// fetchMetricCached, runThrottled). Keep the two in step if one changes.

import type { NewsItem } from "./types";

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";
const QUOTE_TTL_MS = 2 * 60 * 1000;
const METRIC_TTL_MS = 15 * 60 * 1000;
const CONCURRENCY = 1;
const GAP_MS = 1100; // one call about every 1.1s, about 55 a minute, under the 60/min limit

export interface Quote {
  c: number;  // current price
  d: number | null;   // change $
  dp: number | null;  // change %
  h: number; l: number; o: number; pc: number;
}

export type Metric = Record<string, number | null | undefined>;

interface Cached<T> { data: T; at: number }
const quoteCache = new Map<string, Cached<Quote | null>>();
const metricCache = new Map<string, Cached<Metric | null>>();
// In-flight requests, kept per cache so two caches with the same key never share a result.
const inflightByCache = new Map<object, Map<string, Promise<unknown>>>();

let running = 0;
const waiting: (() => void)[] = [];
async function queued<T>(task: () => Promise<T>): Promise<T> {
  if (running >= CONCURRENCY) await new Promise<void>(resolve => waiting.push(resolve));
  running++;
  try {
    return await task();
  } finally {
    setTimeout(() => {
      running--;
      waiting.shift()?.();
    }, GAP_MS);
  }
}

async function finnhub<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, path });
  const res = await fetch(`${API_BASE}/api/finnhub?${qs}`);
  if (res.status === 429) throw new Error("rate limit reached, try again in a minute");
  if (!res.ok) throw new Error(`request failed (${res.status})`);
  return res.json() as Promise<T>;
}

function cachedOrFetch<T>(
  cache: Map<string, Cached<T | null>>,
  ttl: number,
  key: string,
  fetcher: () => Promise<T | null>,
): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data);
  let inflight = inflightByCache.get(cache);
  if (!inflight) { inflight = new Map(); inflightByCache.set(cache, inflight); }
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T | null>;
  const p = queued(fetcher)
    .then(data => { cache.set(key, { data, at: Date.now() }); return data; })
    .catch(() => null)
    .finally(() => inflight!.delete(key));
  inflight.set(key, p);
  return p;
}

/** Live quote for one ticker, or null if there isn't one. */
export function getQuote(symbol: string): Promise<Quote | null> {
  return cachedOrFetch(quoteCache, QUOTE_TTL_MS, symbol, async () => {
    const q = await finnhub<Quote>("/quote", { symbol });
    return q && q.c !== 0 ? q : null;
  });
}

/** Performance periods, beta, 52-week range and volume for one ticker. */
export function getMetric(symbol: string): Promise<Metric | null> {
  return cachedOrFetch(metricCache, METRIC_TTL_MS, symbol, async () => {
    const r = await finnhub<{ metric?: Metric }>("/stock/metric", { symbol, metric: "all" });
    return r.metric ?? null;
  });
}

/** Read a numeric metric field, or null when it's missing or not a number. */
export function metricValue(m: Metric | null | undefined, key: string): number | null {
  const v = m?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const newsCache = new Map<string, Cached<NewsItem[] | null>>();
const ipoCache = new Map<string, Cached<IpoRow[] | null>>();
const NEWS_TTL_MS = 5 * 60 * 1000;
const IPO_TTL_MS = 60 * 60 * 1000;

/** Market news for one Finnhub category: "general", "merger", "forex" or "crypto". */
export function getNews(category: string): Promise<NewsItem[] | null> {
  return cachedOrFetch(newsCache, NEWS_TTL_MS, category, () => finnhub<NewsItem[]>("/news", { category }));
}

export interface IpoRow {
  date: string;
  exchange: string;
  name: string;
  symbol: string | null;
  price: string | null;
  numberOfShares: number | null;
  totalSharesValue: number | null;
  status: string;  // "filed" | "expected" | "priced"
}

/** IPO calendar between two YYYY-MM-DD dates (Finnhub's /calendar/ipo). */
export function getIpoCalendar(from: string, to: string): Promise<IpoRow[] | null> {
  return cachedOrFetch(ipoCache, IPO_TTL_MS, `${from}:${to}`, async () => {
    const r = await finnhub<{ ipoCalendar?: IpoRow[] }>("/calendar/ipo", { from, to });
    return r.ipoCalendar ?? [];
  });
}

export interface Profile {
  name?: string;
  marketCapitalization?: number;  // in millions of USD
  logo?: string;                  // company logo image URL
}

const profileCache = new Map<string, Cached<Profile | null>>();
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000;  // company profiles barely change day to day

/** Company profile (name, market cap). Market cap is in millions of dollars. */
export function getProfile(symbol: string): Promise<Profile | null> {
  return cachedOrFetch(profileCache, PROFILE_TTL_MS, symbol, async () => {
    const p = await finnhub<Profile>("/stock/profile2", { symbol });
    return p && p.name ? p : null;
  });
}

export interface EarningsItem {
  date: string;
  symbol: string;
  hour?: string;            // "bmo" | "amc" | ""
  epsEstimate?: number | null;
  revenueEstimate?: number | null;
}

const earningsCache = new Map<string, Cached<EarningsItem[] | null>>();

/** Companies reporting in the next seven days (Finnhub /calendar/earnings, one call). */
export function getEarnings(): Promise<EarningsItem[] | null> {
  const from = new Date();
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return cachedOrFetch(earningsCache, 60 * 60 * 1000, `earnings:${fmt(from)}`, async () => {
    const r = await finnhub<{ earningsCalendar?: EarningsItem[] }>("/calendar/earnings", { from: fmt(from), to: fmt(to) });
    return r.earningsCalendar ?? [];
  });
}

export interface CompanyProfile {
  name?: string;
  ticker?: string;
  exchange?: string;
  finnhubIndustry?: string;
  logo?: string;
  country?: string;
  ipo?: string;
  weburl?: string;
  marketCapitalization?: number;  // millions
  shareOutstanding?: number;      // millions
}

const companyCache = new Map<string, Cached<CompanyProfile | null>>();

/** Full company profile (Finnhub /stock/profile2). Empty for ETFs and crypto. */
export function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  return cachedOrFetch(companyCache, PROFILE_TTL_MS, `full:${symbol}`, async () => {
    const p = await finnhub<CompanyProfile>("/stock/profile2", { symbol });
    return p && p.name ? p : null;
  });
}

export interface RecommendationTrend { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }
export interface EarningsQuarter { period: string; estimate: number | null; actual: number | null; surprisePercent: number | null }

const recCache = new Map<string, Cached<RecommendationTrend[] | null>>();
const earnCache = new Map<string, Cached<EarningsQuarter[] | null>>();

/** Analyst recommendation counts by month (Finnhub /stock/recommendation). */
export function getRecommendations(symbol: string): Promise<RecommendationTrend[] | null> {
  return cachedOrFetch(recCache, METRIC_TTL_MS, symbol, async () => {
    const r = await finnhub<unknown>("/stock/recommendation", { symbol });
    return Array.isArray(r) ? (r as RecommendationTrend[]) : null;
  });
}

/** Recent quarterly earnings, expected against actual (Finnhub /stock/earnings). */
export function getEarningsHistory(symbol: string): Promise<EarningsQuarter[] | null> {
  return cachedOrFetch(earnCache, PROFILE_TTL_MS, symbol, async () => {
    const r = await finnhub<unknown>("/stock/earnings", { symbol });
    return Array.isArray(r) ? (r as EarningsQuarter[]) : null;
  });
}

export interface CompanyNewsItem { headline: string; summary: string; source: string; url: string; datetime: number }

const companyNewsCache = new Map<string, Cached<CompanyNewsItem[] | null>>();
const peersCache = new Map<string, Cached<string[] | null>>();

/** Recent headlines about one company (Finnhub /company-news, last 14 days). */
export function getCompanyNews(symbol: string): Promise<CompanyNewsItem[] | null> {
  return cachedOrFetch(companyNewsCache, NEWS_TTL_MS, symbol, async () => {
    const to = new Date(), from = new Date(to.getTime() - 14 * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const r = await finnhub<unknown>("/company-news", { symbol, from: fmt(from), to: fmt(to) });
    return Array.isArray(r) ? (r as CompanyNewsItem[]).slice(0, 12) : null;
  });
}

/** Companies in the same space, as Finnhub lists them (/stock/peers). */
export function getPeers(symbol: string): Promise<string[] | null> {
  return cachedOrFetch(peersCache, PROFILE_TTL_MS, symbol, async () => {
    const r = await finnhub<unknown>("/stock/peers", { symbol });
    return Array.isArray(r) ? (r as string[]).filter(s => s && s !== symbol).slice(0, 12) : null;
  });
}

export interface InsiderTrade { name: string; transactionDate: string; change: number; transactionPrice: number | null }

const insiderCache = new Map<string, Cached<InsiderTrade[] | null>>();

/** Recent Form 4 insider trades (Finnhub /stock/insider-transactions). */
export function getInsiderTrades(symbol: string): Promise<InsiderTrade[] | null> {
  return cachedOrFetch(insiderCache, PROFILE_TTL_MS / 24, symbol, async () => {
    const r = await finnhub<{ data?: InsiderTrade[] }>("/stock/insider-transactions", { symbol });
    return Array.isArray(r.data) ? r.data : [];
  });
}

export interface ReportItem { concept: string; label?: string; value: number }
export interface FinancialFiling { endDate: string; form: string; report?: { ic?: ReportItem[] } }

const financialsCache = new Map<string, Cached<FinancialFiling[] | null>>();

/** Quarterly statements straight from SEC filings (Finnhub /stock/financials-reported). */
export function getFinancials(symbol: string): Promise<FinancialFiling[] | null> {
  return cachedOrFetch(financialsCache, PROFILE_TTL_MS, symbol, async () => {
    const r = await finnhub<{ data?: FinancialFiling[] }>("/stock/financials-reported", { symbol, freq: "quarterly" });
    return Array.isArray(r.data) ? r.data : [];
  });
}
