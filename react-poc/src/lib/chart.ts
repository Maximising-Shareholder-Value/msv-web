import { trackedFetch } from "./apiUsage";
// lib/chart.ts — price history and indicator maths for the ticker page's chart.
// Bars come from Twelve Data (time_series) through the msv-api proxy; each range
// maps to an interval chosen to give a sensible number of bars (as chart.js does).
// The indicator formulas are the standard ones used on the main site.

export const RANGE_CONFIGS: Record<string, { interval: string; outputsize: number }> = {
  "1D": { interval: "5min", outputsize: 78 },
  "1W": { interval: "30min", outputsize: 65 },
  "3M": { interval: "1day", outputsize: 63 },
  "6M": { interval: "1day", outputsize: 130 },
  "1Y": { interval: "1day", outputsize: 252 },
  "5Y": { interval: "1week", outputsize: 260 },
};

export interface Bar { time: string; open: number; high: number; low: number; close: number; volume: number }

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export async function getBars(symbol: string, range: string): Promise<Bar[] | null> {
  const cfg = RANGE_CONFIGS[range];
  if (!cfg) return null;
  try {
    const qs = new URLSearchParams({ path: "/time_series", symbol, interval: cfg.interval, outputsize: String(cfg.outputsize) });
    const res = await trackedFetch(`${API_BASE}/api/twelvedata?${qs}`);
    const data = await res.json() as { status?: string; values?: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }[] };
    if (!data || data.status === "error" || !Array.isArray(data.values) || data.values.length < 2) return null;
    return [...data.values].reverse().map(v => ({
      time: v.datetime,
      open: parseFloat(v.open), high: parseFloat(v.high), low: parseFloat(v.low), close: parseFloat(v.close),
      volume: parseFloat(v.volume ?? "0") || 0,
    }));
  } catch {
    return null;
  }
}

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  out[period] = 100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

export function ema(values: (number | null)[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = new Array(values.length).fill(null);
  let prev: number | null = null;
  values.forEach((v, i) => {
    if (v === null || v === undefined) return;
    prev = prev === null ? v : v * k + prev * (1 - k);
    out[i] = prev;
  });
  return out;
}

/** MACD: the 12/26 EMA difference, its 9-period signal line, and the histogram between them. */
export function macd(closes: number[]) {
  const e12 = ema(closes, 12), e26 = ema(closes, 26);
  const line = closes.map((_, i) => (e12[i] !== null && e26[i] !== null ? (e12[i] as number) - (e26[i] as number) : null));
  const signal = ema(line, 9);
  const hist = line.map((v, i) => (v !== null && signal[i] !== null ? v - (signal[i] as number) : null));
  return { line, signal, hist };
}

// Local highs and lows: a close that is the highest or lowest of its neighbourhood.
function pivots(closes: number[], window = 4) {
  const highs: number[] = [], lows: number[] = [];
  for (let i = window; i < closes.length - window; i++) {
    const slice = closes.slice(i - window, i + window + 1);
    if (closes[i] === Math.max(...slice)) highs.push(closes[i]);
    if (closes[i] === Math.min(...slice)) lows.push(closes[i]);
  }
  return { highs, lows };
}

// Groups nearby levels (within 2%) and keeps the averages of the biggest groups.
function clusterLevels(levels: number[], tolerance = 0.02): { avg: number; count: number }[] {
  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: { values: number[]; avg: number }[] = [];
  sorted.forEach(level => {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(level - last.avg) / last.avg < tolerance) {
      last.values.push(level);
      last.avg = last.values.reduce((a, b) => a + b, 0) / last.values.length;
    } else {
      clusters.push({ values: [level], avg: level });
    }
  });
  return clusters.sort((a, b) => b.values.length - a.values.length).map(c => ({ avg: c.avg, count: c.values.length }));
}

/** Rough support and resistance levels: the two strongest clusters of recent pivots. A heuristic, not a forecast. */
export function supportResistance(closes: number[]) {
  const { highs, lows } = pivots(closes);
  return {
    support: clusterLevels(lows).slice(0, 2).map(c => c.avg),
    resistance: clusterLevels(highs).slice(0, 2).map(c => c.avg),
  };
}
