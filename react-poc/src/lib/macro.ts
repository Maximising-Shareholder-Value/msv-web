import { trackedFetch } from "./apiUsage";
// lib/macro.ts — the Macro page's data: US figures from FRED and every other
// country from the World Bank, both through the msv-api proxy. Mirrors macro.js.

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export interface Reading { value: number | null; date: string | null }

export const MACRO_SERIES = [
  { id: "FEDFUNDS", label: "Fed Funds Rate", unit: "%", params: {} as Record<string, string> },
  { id: "CPIAUCSL", label: "Inflation (CPI, YoY)", unit: "%", params: { units: "pc1" } },
  { id: "UNRATE", label: "Unemployment Rate", unit: "%", params: {} },
  { id: "DGS10", label: "10-Year Treasury Yield", unit: "%", params: {} },
  { id: "MORTGAGE30US", label: "30-Year Mortgage Rate", unit: "%", params: {} },
  { id: "M2SL", label: "M2 Money Supply (YoY)", unit: "%", params: { units: "pc1" } },
  { id: "UMCSENT", label: "Consumer Sentiment", unit: "", params: {} },
  { id: "DCOILWTICO", label: "Crude Oil (WTI)", unit: "", prefix: "$", params: {} },
];

export const MACRO_COUNTRIES = [
  { iso3: "USA", label: "United States", flag: "🇺🇸", source: "fred" },
  { iso3: "CHN", label: "China", flag: "🇨🇳", source: "worldbank" },
  { iso3: "DEU", label: "Germany", flag: "🇩🇪", source: "worldbank" },
  { iso3: "JPN", label: "Japan", flag: "🇯🇵", source: "worldbank" },
  { iso3: "GBR", label: "United Kingdom", flag: "🇬🇧", source: "worldbank" },
];

export const WB_ECON = [
  { id: "NY.GDP.MKTP.KD.ZG", label: "GDP Growth", unit: "%", money: false },
  { id: "FP.CPI.TOTL.ZG", label: "Inflation (CPI, YoY)", unit: "%", money: false },
  { id: "SL.UEM.TOTL.ZS", label: "Unemployment Rate", unit: "%", money: false },
  { id: "BN.CAB.XOKA.GD.ZS", label: "Current Account Balance", unit: "% of GDP", money: false },
  { id: "NY.GDP.PCAP.CD", label: "GDP per Capita", unit: "", money: true },
  { id: "NE.RSB.GNFS.ZS", label: "Trade Balance", unit: "% of GDP", money: false },
  { id: "GC.DOD.TOTL.GD.ZS", label: "Government Debt", unit: "% of GDP", money: false },
  { id: "FI.RES.TOTL.CD", label: "Total Reserves", unit: "", money: true },
  { id: "SP.POP.TOTL", label: "Population", unit: "", money: false, count: true },
];

export const WB_GOVERNANCE = [
  { id: "GOV_WGI_VA.EST", label: "Voice & Accountability" },
  { id: "GOV_WGI_PV.EST", label: "Political Stability" },
  { id: "GOV_WGI_GE.EST", label: "Government Effectiveness" },
  { id: "GOV_WGI_RQ.EST", label: "Regulatory Quality" },
  { id: "GOV_WGI_RL.EST", label: "Rule of Law" },
  { id: "GOV_WGI_CC.EST", label: "Control of Corruption" },
];

/** The latest real (non-null) value for a World Bank indicator. */
export async function wbLatest(iso3: string, indicatorId: string): Promise<Reading> {
  const qs = new URLSearchParams({ path: `/country/${iso3}/indicator/${indicatorId}`, format: "json", per_page: "6" });
  const res = await trackedFetch(`${API_BASE}/api/worldbank?${qs}`);
  if (!res.ok) return { value: null, date: null };
  const data = await res.json();
  const rows = Array.isArray(data) && Array.isArray(data[1]) ? (data[1] as { value: number | null; date: string }[]) : [];
  const hit = rows.find(r => typeof r.value === "number");
  return hit ? { value: hit.value as number, date: hit.date } : { value: null, date: null };
}

/** The latest value of a US series from FRED (one observation, newest first). */
export async function fredLatest(seriesId: string, params: Record<string, string>): Promise<Reading> {
  const qs = new URLSearchParams({ path: "/series/observations", series_id: seriesId, file_type: "json", sort_order: "desc", limit: "1", ...params });
  const res = await trackedFetch(`${API_BASE}/api/fred?${qs}`);
  if (!res.ok) return { value: null, date: null };
  const data = await res.json() as { observations?: { value: string; date: string }[] };
  const obs = data.observations?.[0];
  const v = obs ? parseFloat(obs.value) : NaN;
  return obs && Number.isFinite(v) ? { value: v, date: obs.date } : { value: null, date: null };
}

export interface WbCountry { iso3: string; name: string }

/** Every country the World Bank tracks, without the regional and income-group aggregates. */
export async function wbCountryList(): Promise<WbCountry[]> {
  const qs = new URLSearchParams({ path: "/country", format: "json", per_page: "400" });
  const res = await trackedFetch(`${API_BASE}/api/worldbank?${qs}`);
  if (!res.ok) return [];
  const data = await res.json();
  const rows = Array.isArray(data) && Array.isArray(data[1]) ? (data[1] as { id: string; name: string; region?: { value?: string } }[]) : [];
  return rows.filter(r => r.region?.value && r.region.value !== "Aggregates").map(r => ({ iso3: r.id, name: r.name }));
}

export function fmtReading(v: number | null, unit: string, prefix = "", count = false, money = false): string {
  if (v === null) return "N/A";
  if (money) return `${prefix}${v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v.toLocaleString()}`;
  if (count) return v.toLocaleString();
  return `${prefix}${v.toFixed(2)}${unit}`;
}
