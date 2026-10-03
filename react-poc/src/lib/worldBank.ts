// lib/worldBank.ts — World Bank indicators for the Market Data page, through
// the msv-api proxy. One request per indicator covers every tracked country.
// Mirrors worldMarkets.js (WB_INDICATORS, ensureWorldIndicator, wbLimit,
// wbRetry). The World Bank throttles bursts, so at most four run at once and
// each retries twice.

import { COUNTRIES } from "../data/countries";
import { fmtCompact, fmtPct } from "./format";
import { trackedFetch } from "./apiUsage";

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export type Risk = "good" | "warn" | "bad";

export interface WbIndicator {
  key: string;
  id: string;
  label: string;
  fmt: (v: number) => string;
  risk?: (v: number) => Risk;
}

export const WB_INDICATORS: WbIndicator[] = [
  { key: "gdp", id: "NY.GDP.MKTP.CD", label: "GDP", fmt: v => fmtCompact(v, "$") },
  { key: "gdpg", id: "NY.GDP.MKTP.KD.ZG", label: "GDP growth", fmt: v => fmtPct(v, 1), risk: v => (v < 0 ? "bad" : v < 2 ? "warn" : "good") },
  { key: "gdppc", id: "NY.GDP.PCAP.CD", label: "GDP per capita", fmt: v => fmtCompact(v, "$") },
  { key: "infl", id: "FP.CPI.TOTL.ZG", label: "Inflation", fmt: v => `${v.toFixed(1)}%`, risk: v => (v > 10 ? "bad" : v > 5 || v < 0 ? "warn" : "good") },
  { key: "unemp", id: "SL.UEM.TOTL.ZS", label: "Unemployment", fmt: v => `${v.toFixed(1)}%`, risk: v => (v > 12 ? "bad" : v > 7 ? "warn" : "good") },
  { key: "debt", id: "GC.DOD.TOTL.GD.ZS", label: "Govt debt / GDP", fmt: v => `${v.toFixed(0)}%`, risk: v => (v > 100 ? "bad" : v > 60 ? "warn" : "good") },
  { key: "cab", id: "BN.CAB.XOKA.GD.ZS", label: "Current account / GDP", fmt: v => fmtPct(v, 1), risk: v => (v < -6 ? "bad" : v < -3 ? "warn" : "good") },
  { key: "trade", id: "NE.TRD.GNFS.ZS", label: "Trade / GDP", fmt: v => `${v.toFixed(0)}%` },
  { key: "fdi", id: "BX.KLT.DINV.WD.GD.ZS", label: "FDI inflows / GDP", fmt: v => `${v.toFixed(1)}%` },
  { key: "res", id: "FI.RES.TOTL.CD", label: "FX reserves", fmt: v => fmtCompact(v, "$") },
  { key: "pop", id: "SP.POP.TOTL", label: "Population", fmt: v => fmtCompact(v) },
  { key: "urban", id: "SP.URB.TOTL.IN.ZS", label: "Urban population", fmt: v => `${v.toFixed(0)}%` },
  { key: "life", id: "SP.DYN.LE00.IN", label: "Life expectancy", fmt: v => `${v.toFixed(1)} yrs` },
  { key: "inet", id: "IT.NET.USER.ZS", label: "Internet users", fmt: v => `${v.toFixed(0)}%` },
  { key: "fx", id: "PA.NUS.FCRF", label: "Currency per US$", fmt: v => (v >= 100 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v.toFixed(2)) },
  { key: "exports", id: "NE.EXP.GNFS.ZS", label: "Exports / GDP", fmt: v => `${v.toFixed(0)}%` },
  { key: "money", id: "FM.LBL.BMNY.GD.ZS", label: "Broad money / GDP", fmt: v => `${v.toFixed(0)}%` },
  { key: "rint", id: "FR.INR.RINR", label: "Real interest rate", fmt: v => fmtPct(v, 1) },
  { key: "gini", id: "SI.POV.GINI", label: "Inequality (Gini)", fmt: v => v.toFixed(1) },
  { key: "polstab", id: "GOV_WGI_PV.EST", label: "Political stability", fmt: v => v.toFixed(2), risk: v => (v < -1 ? "bad" : v < 0 ? "warn" : "good") },
];

export const WB_BY_KEY = Object.fromEntries(WB_INDICATORS.map(i => [i.key, i])) as Record<string, WbIndicator>;

/** One country's latest value for an indicator. */
export interface WbPoint { value: number; date: string }
export type WbStore = Record<string, WbPoint>;  // keyed by ISO3 code

// Taiwan isn't covered by the World Bank, so it's left out of the request.
const COUNTRY_PARAM = COUNTRIES.filter(c => c.iso3 !== "TWN").map(c => c.iso3).join(";");

let active = 0;
const waiting: (() => void)[] = [];
function limited<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = async () => {
      active++;
      try { resolve(await fn()); }
      catch (e) { reject(e); }
      finally { active--; waiting.shift()?.(); }
    };
    if (active < 4) run(); else waiting.push(run);
  });
}

async function retried<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await limited(fn); }
    catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 700 * (i + 1))); }
  }
  throw lastErr;
}

async function wbFetch(path: string, extra: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams({ path, format: "json", per_page: "100", ...extra });
  const res = await trackedFetch(`${API_BASE}/api/worldbank?${qs}`);
  if (!res.ok) throw new Error(`World Bank request failed (${res.status})`);
  return res.json();
}

const cache = new Map<string, Promise<WbStore>>();

/** Latest value per country for one indicator. Resolves to {} if it can't be loaded. */
export function getIndicator(key: string): Promise<WbStore> {
  const hit = cache.get(key);
  if (hit) return hit;
  const ind = WB_BY_KEY[key];
  const p = retried(() => wbFetch(`/country/${COUNTRY_PARAM}/indicator/${ind.id}`, { mrnev: "1" }))
    .then(data => {
      const rows = Array.isArray(data) && Array.isArray(data[1]) ? (data[1] as { countryiso3code: string; value: number | null; date: string }[]) : [];
      const store: WbStore = {};
      rows.forEach(r => { if (typeof r.value === "number" && Number.isFinite(r.value)) store[r.countryiso3code] = { value: r.value, date: r.date }; });
      return store;
    })
    .catch(() => { cache.delete(key); return {} as WbStore; });
  cache.set(key, p);
  return p;
}

/** Peer position for one country on one indicator, or null if there aren't enough data points. */
export function peerStats(store: WbStore | undefined, iso3: string) {
  if (!store) return null;
  const mine = store[iso3];
  const vals = Object.values(store).map(d => d.value).sort((a, b) => a - b);
  if (!mine || vals.length < 3) return null;
  const rank = vals.filter(v => v > mine.value).length + 1;  // 1 = highest
  const median = vals[Math.floor(vals.length / 2)];
  return { value: mine.value, date: mine.date, rank, n: vals.length, min: vals[0], max: vals[vals.length - 1], median };
}

export interface SeriesPoint { label: string; value: number }

/** The last ~30 annual values for one country and indicator, oldest first (vanilla: loadCountryHistory). */
export async function getHistory(iso3: string, indicatorId: string): Promise<SeriesPoint[]> {
  const data = await retried(() => wbFetch(`/country/${iso3}/indicator/${indicatorId}`, { per_page: "40" }));
  const rows = Array.isArray(data) && Array.isArray(data[1]) ? (data[1] as { date: string; value: number | null }[]) : [];
  return rows
    .filter(r => typeof r.value === "number" && Number.isFinite(r.value))
    .map(r => ({ label: r.date, value: r.value as number }))
    .reverse()
    .slice(-30);
}

/** The latest value of one indicator for one country, or null (vanilla: fetchWorldBankIndicator). */
export async function getCountryValue(iso3: string, indicatorId: string): Promise<number | null> {
  const data = await retried(() => wbFetch(`/country/${iso3}/indicator/${indicatorId}`, { mrnev: "1" }));
  const rows = Array.isArray(data) && Array.isArray(data[1]) ? (data[1] as { value: number | null }[]) : [];
  const v = rows[0]?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** The six Worldwide Governance Indicators (−2.5 weak to +2.5 strong). */
export const GOVERNANCE_INDICATORS = [
  { id: "GOV_WGI_VA.EST", label: "Voice & Accountability" },
  { id: "GOV_WGI_PV.EST", label: "Political Stability" },
  { id: "GOV_WGI_GE.EST", label: "Government Effectiveness" },
  { id: "GOV_WGI_RQ.EST", label: "Regulatory Quality" },
  { id: "GOV_WGI_RL.EST", label: "Rule of Law" },
  { id: "GOV_WGI_CC.EST", label: "Control of Corruption" },
];
