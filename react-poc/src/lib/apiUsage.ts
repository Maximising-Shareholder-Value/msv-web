// lib/apiUsage.ts — counts the data requests this browser tab makes, per provider,
// for the sidebar's usage panel. It's an estimate: it can't see other tabs, other
// visitors or the server's cache, and the real limits are enforced server-side.
// Limits are each provider's published free-tier numbers (see the old apiUsage.js).

const WINDOW_MS = 60 * 1000;
const recent: Record<string, number[]> = {};

export const USAGE_ROWS: { key: string; label: string; limit: number | null; per: "min" | "day" }[] = [
  { key: "finnhub", label: "Finnhub", limit: 60, per: "min" },
  { key: "twelvedata", label: "Twelve Data", limit: 8, per: "min" },
  { key: "twelvedata-day", label: "Twelve Data", limit: 800, per: "day" },
  { key: "coingecko", label: "CoinGecko", limit: 30, per: "min" },
  { key: "fred", label: "FRED", limit: 120, per: "min" },
  { key: "alpaca", label: "Alpaca", limit: 1000, per: "min" },
  { key: "worldbank", label: "World Bank", limit: null, per: "min" },
  { key: "fmp", label: "FMP", limit: 250, per: "day" },
  { key: "bargo", label: "Bargo", limit: 100, per: "day" },
];

const dayKey = (name: string) => `msv-api-daily-${name}`;

function bumpDaily(name: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const saved = JSON.parse(localStorage.getItem(dayKey(name)) || "null");
    const count = saved && saved.date === today ? saved.count + 1 : 1;
    localStorage.setItem(dayKey(name), JSON.stringify({ date: today, count }));
  } catch { /* storage blocked: the per-minute count still works */ }
}

function dailyCount(name: string): number {
  try {
    const saved = JSON.parse(localStorage.getItem(dayKey(name)) || "null");
    return saved && saved.date === new Date().toISOString().slice(0, 10) ? saved.count : 0;
  } catch { return 0; }
}

export function logCall(name: string) {
  (recent[name] ??= []).push(Date.now());
  if (name === "twelvedata" || name === "fmp" || name === "bargo") bumpDaily(name);
}

/** Which provider a request URL belongs to, or null if it isn't one of ours. */
function providerFor(url: string): string | null {
  if (url.includes("/api/finnhub")) return "finnhub";
  if (url.includes("/api/twelvedata")) return "twelvedata";
  if (url.includes("/api/coingecko") || url.includes("api.coingecko.com")) return "coingecko";
  if (url.includes("/api/fred")) return "fred";
  if (url.includes("/api/worldbank")) return "worldbank";
  if (url.includes("/api/alpaca")) return "alpaca";
  if (url.includes("/api/fmp") || url.includes("financialmodelingprep")) return "fmp";
  if (url.includes("/api/bargo") || url.includes("bargo.ai")) return "bargo";
  return null;
}

/** fetch() that also records the call against its provider. Use it for every data request. */
export function trackedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const name = providerFor(url);
  if (name) logCall(name);
  return fetch(input, init);
}

/** Calls in the last minute, or today for the daily rows. */
export function usageNow() {
  const now = Date.now();
  return USAGE_ROWS.map(row => {
    if (row.per === "day") {
      const name = row.key === "twelvedata-day" ? "twelvedata" : row.key;
      return { ...row, count: dailyCount(name) };
    }
    const list = (recent[row.key] ?? []).filter(t => now - t < WINDOW_MS);
    recent[row.key] = list;
    return { ...row, count: list.length };
  });
}
