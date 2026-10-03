// lib/invest.ts — the "What if you'd invested?" maths, ported from invest.js.
// Real daily closes (about ten years, one Twelve Data request), price return only:
// historical dividends aren't on the free data plan, so none are included.

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
export const RETURN_WINDOWS = [
  { label: "1M", days: 30 }, { label: "3M", days: 91 }, { label: "6M", days: 182 },
  { label: "1Y", days: 365 }, { label: "3Y", days: 3 * 365.25 }, { label: "5Y", days: 5 * 365.25 },
];

export interface Close { dateMs: number; close: number }

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export async function getDailyCloses(symbol: string): Promise<Close[] | null> {
  try {
    const qs = new URLSearchParams({ path: "/time_series", symbol, interval: "1day", outputsize: "2600" });
    const res = await fetch(`${API_BASE}/api/twelvedata?${qs}`);
    const data = await res.json() as { status?: string; values?: { datetime: string; close: string }[] };
    if (!data || data.status === "error" || !Array.isArray(data.values) || data.values.length < 30) return null;
    return [...data.values].reverse().map(v => ({ dateMs: Date.parse(`${v.datetime}T00:00:00`), close: parseFloat(v.close) }));
  } catch {
    return null;
  }
}

/** The last close on or before a date (the nearest trading day before it). */
export function closeOnOrBefore(closes: Close[], targetMs: number): Close {
  let result = closes[0];
  for (const p of closes) {
    if (p.dateMs > targetMs) break;
    result = p;
  }
  return result;
}

export function yearsOfHistory(closes: Close[]): number {
  return (closes[closes.length - 1].dateMs - closes[0].dateMs) / MS_PER_YEAR;
}

/** Growth of an investment bought at a past date, valued at the latest close. */
export function pastInvestment(closes: Close[], amount: number, yearsAgo: number) {
  const latest = closes[closes.length - 1];
  const targetMs = latest.dateMs - yearsAgo * MS_PER_YEAR;
  if (targetMs < closes[0].dateMs) return { ok: false as const };
  const past = closeOnOrBefore(closes, targetMs);
  if (past.dateMs === latest.dateMs) return { ok: false as const };
  const nowValue = (amount / past.close) * latest.close;
  const actualYears = (latest.dateMs - past.dateMs) / MS_PER_YEAR;
  return {
    ok: true as const,
    pastDateMs: past.dateMs,
    nowValue,
    growthPct: ((nowValue - amount) / amount) * 100,
    cagr: Math.pow(nowValue / amount, 1 / actualYears) - 1,
    actualYears,
  };
}

/** Total and annualized return over each fixed window (1M to 5Y). */
export function returnWindows(closes: Close[]) {
  const latest = closes[closes.length - 1];
  const earliest = closes[0];
  return RETURN_WINDOWS.map(({ label, days }) => {
    const targetMs = latest.dateMs - days * DAY;
    if (targetMs < earliest.dateMs) return { label, na: true as const };
    const past = closeOnOrBefore(closes, targetMs);
    if (past.dateMs === latest.dateMs) return { label, na: true as const };
    const totalPct = ((latest.close - past.close) / past.close) * 100;
    const years = (latest.dateMs - past.dateMs) / MS_PER_YEAR;
    const annualPct = (Math.pow(latest.close / past.close, 1 / years) - 1) * 100;
    return { label, na: false as const, totalPct, annualPct };
  });
}
