// components/ScreenerPage.tsx — the Stock Screener, React version. Ports
// screener.js: filter and sort stocks by price, today's move, market cap and
// P/E, then open a ticker's page for anything interesting.
//
// SCOPE: this covers the ~94 stocks in the four stock categories (Trending
// Tech, Blue Chip, Dividend Payers, Growth), not the whole market. Finnhub's
// free tier has no bulk screener endpoint, so each stock needs three separate
// calls (quote, metrics, profile). They're queued through lib/finnhub.ts, so a
// cold load takes a few minutes, and the table fills in as results arrive.

import { useEffect, useMemo, useState } from "react";
import { SCREENER_CATEGORIES } from "../data/screener";
import { getMetric, getProfile, getQuote, metricValue, type Metric, type Quote } from "../lib/finnhub";
import { fmtCompact, fmtPct, fmtPrice, changeClass } from "../lib/format";

interface Row {
  symbol: string;
  name: string;
  category: string;
  quote?: Quote | null;
  metric?: Metric | null;
  marketCap?: number | null;  // millions of dollars
  loaded: number;             // how many of this row's three calls have returned
}

interface Filters {
  category: string;
  cap: string;
  minPrice: string;
  maxPrice: string;
  direction: "all" | "gainers" | "losers";
  maxPe: string;
}

const EMPTY_FILTERS: Filters = { category: "all", cap: "all", minPrice: "", maxPrice: "", direction: "all", maxPe: "" };

const CAP_BUCKETS: [string, string, (v: number) => boolean][] = [
  ["mega", "Mega ($200B+)", v => v >= 200_000],
  ["large", "Large ($10B–$200B)", v => v >= 10_000 && v < 200_000],
  ["mid", "Mid ($2B–$10B)", v => v >= 2_000 && v < 10_000],
  ["small", "Small (<$2B)", v => v < 2_000],
];

function capBucket(marketCapMillions: number | null | undefined): string | null {
  if (marketCapMillions === null || marketCapMillions === undefined || !Number.isFinite(marketCapMillions)) return null;
  return CAP_BUCKETS.find(([, , test]) => test(marketCapMillions))?.[0] ?? null;
}

// The universe, once, in the order the calls are queued.
const UNIVERSE: Omit<Row, "loaded">[] = SCREENER_CATEGORIES.flatMap(cat =>
  cat.items.map(([symbol, name]) => ({ symbol, name, category: cat.title })),
).filter((row, i, all) => all.findIndex(r => r.symbol === row.symbol) === i);

const TOTAL_CALLS = UNIVERSE.length * 3;

type SortKey = "symbol" | "price" | "pct" | "marketCap" | "pe" | "week52high" | "week52low" | "beta" | "divYield" | "avgVolume" | "category";

const COLUMNS: { key: SortKey; label: string; text?: boolean }[] = [
  { key: "symbol", label: "Symbol", text: true },
  { key: "price", label: "Price" },
  { key: "pct", label: "Chg %" },
  { key: "marketCap", label: "Market cap" },
  { key: "pe", label: "P/E" },
  { key: "week52high", label: "52W high" },
  { key: "week52low", label: "52W low" },
  { key: "beta", label: "Beta" },
  { key: "divYield", label: "Div yield" },
  { key: "avgVolume", label: "Avg vol (10D)" },
  { key: "category", label: "Category", text: true },
];

function sortValue(r: Row, key: SortKey): number | string | null {
  switch (key) {
    case "symbol": return r.symbol;
    case "category": return r.category;
    case "price": return r.quote?.c ?? null;
    case "pct": return r.quote?.dp ?? null;
    case "marketCap": return r.marketCap ?? null;
    case "pe": return metricValue(r.metric, "peTTM");
    case "week52high": return metricValue(r.metric, "52WeekHigh");
    case "week52low": return metricValue(r.metric, "52WeekLow");
    case "beta": return metricValue(r.metric, "beta");
    case "divYield": return metricValue(r.metric, "dividendYieldIndicatedAnnual");
    case "avgVolume": return metricValue(r.metric, "10DayAverageTradingVolume");
  }
}

export function ScreenerPage() {
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(UNIVERSE.map(r => [r.symbol, { ...r, loaded: 0 }])),
  );
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "marketCap", dir: -1 });

  // Queue the three calls for every stock, in order. Each lands in its row
  // as it arrives; lib/finnhub.ts runs them one at a time, paced for the limit.
  useEffect(() => {
    let live = true;
    const apply = (symbol: string, patch: Partial<Row>) => {
      if (!live) return;
      setRows(prev => ({ ...prev, [symbol]: { ...prev[symbol], ...patch, loaded: (prev[symbol].loaded ?? 0) + 1 } }));
    };
    UNIVERSE.forEach(({ symbol }) => {
      getQuote(symbol).then(q => apply(symbol, { quote: q }));
      getMetric(symbol).then(m => apply(symbol, { metric: m }));
      getProfile(symbol).then(p => apply(symbol, { marketCap: p?.marketCapitalization ?? null }));
    });
    return () => { live = false; };
  }, []);

  const loadedCalls = useMemo(() => Object.values(rows).reduce((n, r) => n + r.loaded, 0), [rows]);
  const loading = loadedCalls < TOTAL_CALLS;

  const shown = useMemo(() => {
    const minPrice = filters.minPrice === "" ? null : parseFloat(filters.minPrice);
    const maxPrice = filters.maxPrice === "" ? null : parseFloat(filters.maxPrice);
    const maxPe = filters.maxPe === "" ? null : parseFloat(filters.maxPe);
    const kept = Object.values(rows).filter(r => {
      if (filters.category !== "all" && r.category !== filters.category) return false;
      if (filters.cap !== "all" && capBucket(r.marketCap) !== filters.cap) return false;
      const price = r.quote?.c;
      if (minPrice !== null && (!Number.isFinite(price) || (price as number) < minPrice)) return false;
      if (maxPrice !== null && (!Number.isFinite(price) || (price as number) > maxPrice)) return false;
      const pct = r.quote?.dp;
      if (filters.direction === "gainers" && (!Number.isFinite(pct) || (pct as number) <= 0)) return false;
      if (filters.direction === "losers" && (!Number.isFinite(pct) || (pct as number) >= 0)) return false;
      if (maxPe !== null) {
        const pe = metricValue(r.metric, "peTTM");
        if (pe === null || pe > maxPe) return false;
      }
      return true;
    });
    // Missing values always sort to the bottom, whichever direction is chosen.
    return kept.sort((a, b) => {
      const va = sortValue(a, sort.key), vb = sortValue(b, sort.key);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * sort.dir;
      return ((va as number) - (vb as number)) * sort.dir;
    });
  }, [rows, filters, sort]);

  const categories = [...new Set(SCREENER_CATEGORIES.map(c => c.title))];
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters(f => ({ ...f, [key]: value }));
  const clickSort = (key: SortKey) => setSort(s => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "symbol" || key === "category" ? 1 : -1 }));

  return (
    <section className="screener-page">
      <header className="sectors-header">
        <h2>Stock Screener</h2>
        <span className="muted small">{UNIVERSE.length} stocks from the four stock categories · not the whole market</span>
      </header>

      <div className="screener-filters">
        <label>Category
          <select value={filters.category} onChange={e => setFilter("category", e.target.value)}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Market cap
          <select value={filters.cap} onChange={e => setFilter("cap", e.target.value)}>
            <option value="all">Any size</option>
            {CAP_BUCKETS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label>Price min <input type="number" min="0" value={filters.minPrice} placeholder="0" onChange={e => setFilter("minPrice", e.target.value)} /></label>
        <label>Price max <input type="number" min="0" value={filters.maxPrice} placeholder="Any" onChange={e => setFilter("maxPrice", e.target.value)} /></label>
        <label>Today
          <select value={filters.direction} onChange={e => setFilter("direction", e.target.value as Filters["direction"])}>
            <option value="all">Up or down</option>
            <option value="gainers">Gainers only</option>
            <option value="losers">Losers only</option>
          </select>
        </label>
        <label>Max P/E <input type="number" min="0" value={filters.maxPe} placeholder="Any" onChange={e => setFilter("maxPe", e.target.value)} /></label>
        <button type="button" className="screener-reset-btn" onClick={() => setFilters(EMPTY_FILTERS)}>Reset filters</button>
      </div>

      <p className="muted small">
        {loading
          ? `Loading live data: ${loadedCalls} of ${TOTAL_CALLS} requests done. The table fills in as results arrive.`
          : `${shown.length} of ${UNIVERSE.length} stocks match. Click a column heading to sort.`}
      </p>

      <div className="crypto-table-scroll">
        <table className="crypto-table quotes-table screener-table">
          <thead>
            <tr>
              {COLUMNS.map(c => (
                <th key={c.key} className="screener-sortable" onClick={() => clickSort(c.key)} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
                  {c.label}{sort.key === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.symbol}>
                <td><a href={`/?ticker=${encodeURIComponent(r.symbol)}`}><strong>{r.symbol}</strong></a> <span className="muted small">{r.name}</span></td>
                <td>{r.quote === undefined ? "…" : r.quote ? fmtPrice(r.quote.c) : "—"}</td>
                <td className={changeClass(r.quote?.dp)}>{r.quote ? fmtPct(r.quote.dp) : "—"}</td>
                <td>{r.marketCap ? `$${fmtCompact(r.marketCap * 1e6)}` : "—"}</td>
                <td>{fmtNumber(metricValue(r.metric, "peTTM"))}</td>
                <td>{fmtPrice(metricValue(r.metric, "52WeekHigh"))}</td>
                <td>{fmtPrice(metricValue(r.metric, "52WeekLow"))}</td>
                <td>{fmtNumber(metricValue(r.metric, "beta"))}</td>
                <td>{fmtYield(metricValue(r.metric, "dividendYieldIndicatedAnnual"))}</td>
                <td>{fmtCompact(metricValue(r.metric, "10DayAverageTradingVolume") === null ? null : (metricValue(r.metric, "10DayAverageTradingVolume") as number) * 1e6)}</td>
                <td className="muted">{r.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted small screener-foot">
        Figures are from Finnhub's free data and can lag. The vanilla page's TradingView screener (whole-market) is still on the main site, not ported here. Not investment advice.
      </p>
    </section>
  );
}

const fmtNumber = (v: number | null) => (v === null ? "—" : v.toFixed(2));
// Dividend yield is already a percentage (no sign, unlike a price change).
const fmtYield = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);
