// lib/risk.ts — fetches the FRED series for the risk gauges through the msv-api
// proxy, and works out each gauge's reading. Mirrors riskDashboard.js.

import { RISK_SERIES, type Level, type RiskSeries } from "../data/risk";

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export interface Obs { date: string; value: number }
export interface SeriesData {
  last: Obs;      // newest first in the source; kept as the latest reading
  prev: Obs;      // about a month back (or 1 month for monthly series)
  yearAgo: Obs;
  avg1y: number;
  asc: Obs[];     // oldest first, for the sparkline
}

const PERIODS = { d: { back: 21, year: 252 }, w: { back: 4, year: 52 }, m: { back: 1, year: 12 } } as const;

export async function fetchSeries(s: RiskSeries): Promise<SeriesData | null> {
  const start = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  const qs = new URLSearchParams({
    path: "/series/observations", series_id: s.id, file_type: "json", sort_order: "desc",
    observation_start: start, limit: "500", ...(s.extra ?? {}),
  });
  const res = await fetch(`${API_BASE}/api/fred?${qs}`);
  if (!res.ok) throw new Error(`FRED request failed (${res.status})`);
  const data = (await res.json()) as { observations?: { date: string; value: string }[] };
  const obs: Obs[] = (data.observations ?? [])
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .filter(o => Number.isFinite(o.value));  // newest first
  if (!obs.length) return null;
  const asc = [...obs].reverse();
  const { back, year } = PERIODS[s.freq];
  const prev = obs[Math.min(back, obs.length - 1)];
  const yearAgo = obs.length > year ? obs[year] : obs[obs.length - 1];
  const avg1y = asc.slice(-year).reduce((sum, o) => sum + o.value, 0) / Math.min(year, asc.length);
  return { last: obs[0], prev, yearAgo, avg1y, asc };
}

/** The reading for a gauge: its level and the label for that band. */
export function levelFor(s: RiskSeries, d: SeriesData): { level: Level; label: string } {
  if (s.info || !s.bands) return { level: "info", label: "" };
  const v = s.rel ? d.last.value / d.avg1y : d.last.value;
  const band = s.bands.find(b => v < b[0]) ?? s.bands[s.bands.length - 1];
  return { level: band[1], label: band[2] };
}

export const LEVEL_TEXT: Record<Level, string> = { calm: "Calm", normal: "Normal", elevated: "Elevated", high: "High", info: "" };
export { RISK_SERIES };
