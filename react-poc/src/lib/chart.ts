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
    const res = await fetch(`${API_BASE}/api/twelvedata?${qs}`);
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
