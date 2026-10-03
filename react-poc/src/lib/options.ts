// lib/options.ts — the options chain for the ticker page, from Alpaca's snapshot
// endpoint through the msv-api proxy. One request covers a ±15% strike band and
// the next 45 days, as on the main site. Option symbols are OCC-style, e.g.
// AAPL260921C00250000 = AAPL, 2026-09-21, call, $250 strike.

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export interface Quote { bp?: number; ap?: number }
export interface Snap { latestQuote?: Quote; latestTrade?: { p?: number }; dailyBar?: { v?: number } }
export interface OptionRow { expiry: string; type: "call" | "put"; strike: number; snap: Snap }

export function parseOption(occ: string, underlying: string, snap: Snap): OptionRow | null {
  if (!occ.startsWith(underlying)) return null;
  const m = occ.slice(underlying.length).match(/^(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
  if (!m) return null;
  const [, yy, mm, dd, cp, strike] = m;
  return { expiry: `20${yy}-${mm}-${dd}`, type: cp === "C" ? "call" : "put", strike: parseInt(strike, 10) / 1000, snap };
}

export async function getOptions(symbol: string, price: number): Promise<OptionRow[] | null> {
  const today = new Date();
  const max = new Date(today.getTime() + 45 * 86400000);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  try {
    const qs = new URLSearchParams({
      path: `/options/snapshots/${symbol}`, feed: "indicative", limit: "200",
      expiration_date_gte: day(today), expiration_date_lte: day(max),
      strike_price_gte: (price * 0.85).toFixed(2), strike_price_lte: (price * 1.15).toFixed(2),
    });
    const res = await fetch(`${API_BASE}/api/alpaca?${qs}`);
    if (!res.ok) return null;
    const data = await res.json() as { snapshots?: Record<string, Snap> };
    return Object.entries(data.snapshots ?? {})
      .map(([occ, snap]) => parseOption(occ, symbol, snap))
      .filter((o): o is OptionRow => o !== null);
  } catch {
    return null;
  }
}
