// components/ComparePage.tsx — the side-by-side comparison (React). Ports compare.js:
// up to four tickers in columns, with price, today's move, valuation, growth,
// margins, dividend, beta and where each sits in its 52-week range. Dots use the
// same sector-relative traffic lights as the ticker pages.

import { useEffect, useState } from "react";
import { getQuote, getMetric, getCompanyProfile, metricValue, type Quote, type Metric, type CompanyProfile } from "../lib/finnhub";
import { getSectorBucket, getTrafficLight, trafficLabel } from "../lib/sectorRules";
import { fmtPct, fmtPrice } from "../lib/format";

const MAX = 4;

interface Entry { symbol: string; quote: Quote; profile: CompanyProfile | null; metric: Metric | null }

interface Row {
  label: string;
  defKey: string | null;
  percent?: boolean;
  money?: boolean;
  get: (e: Entry) => number | null | undefined;
}

const ROWS: Row[] = [
  { label: "Price", defKey: null, money: true, get: e => e.quote.c },
  { label: "Change today", defKey: null, percent: true, get: e => e.quote.dp },
  { label: "Market cap ($M)", defKey: "marketCap", get: e => e.profile?.marketCapitalization },
  { label: "P/E ratio", defKey: "peRatio", get: e => metricValue(e.metric, "peTTM") },
  { label: "P/B ratio", defKey: "pbRatio", get: e => metricValue(e.metric, "pbAnnual") },
  { label: "EV/EBITDA", defKey: "evEbitda", get: e => metricValue(e.metric, "evEbitdaTTM") },
  { label: "Revenue growth (TTM)", defKey: "revenueGrowth", percent: true, get: e => metricValue(e.metric, "revenueGrowthTTMYoy") },
  { label: "Net margin", defKey: "netMargin", percent: true, get: e => metricValue(e.metric, "netProfitMarginTTM") },
  { label: "Return on equity", defKey: "roe", percent: true, get: e => metricValue(e.metric, "roeTTM") },
  { label: "Dividend yield", defKey: "dividendYield", percent: true, get: e => metricValue(e.metric, "dividendYieldIndicatedAnnual") },
  { label: "Beta", defKey: "beta", get: e => metricValue(e.metric, "beta") },
  {
    label: "52-week range position", defKey: null, percent: true,
    get: e => {
      const hi = metricValue(e.metric, "52WeekHigh"), lo = metricValue(e.metric, "52WeekLow");
      return hi !== null && lo !== null && hi > lo ? ((e.quote.c - lo) / (hi - lo)) * 100 : null;
    },
  },
];

function parseSymbols(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(Boolean))].slice(0, MAX);
}

export function ComparePage() {
  const initial = new URLSearchParams(location.search).get("symbols") ?? "AAPL,MSFT";
  const [text, setText] = useState(initial.replace(/,/g, ", "));
  const [entries, setEntries] = useState<Entry[] | null | "loading">(null);
  const [status, setStatus] = useState<string>("");

  const run = async () => {
    const symbols = parseSymbols(text);
    if (symbols.length < 2) { setStatus("Enter at least two tickers, separated by commas."); return; }
    setStatus("Loading…");
    setEntries("loading");
    const url = new URL(location.href);
    url.searchParams.set("symbols", symbols.join(","));
    history.replaceState(null, "", url);
    const results = await Promise.all(symbols.map(async symbol => {
      const [quote, profile, metric] = await Promise.all([getQuote(symbol), getCompanyProfile(symbol), getMetric(symbol)]);
      return quote ? { symbol, quote, profile, metric } : null;
    }));
    const ok = results.filter((r): r is Entry => r !== null);
    setEntries(ok);
    setStatus(ok.length === symbols.length ? "" : `No live data for ${symbols.filter(s => !ok.some(e => e.symbol === s)).join(", ")}.`);
  };

  // Opening a link with tickers in it (?symbols=…) runs the comparison straight away.
  useEffect(() => {
    if (new URLSearchParams(location.search).get("symbols")) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="compare-page">
      <header className="sectors-header">
        <h2>Compare</h2>
        <span className="muted small">Up to {MAX} tickers side by side</span>
      </header>
      <form className="compare-form" onSubmit={e => { e.preventDefault(); run(); }}>
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="AAPL, MSFT, GOOGL" aria-label="Tickers to compare" />
        <button type="submit" className="cp-btn">Compare</button>
      </form>
      {status && <p className="muted small">{status}</p>}
      {entries === "loading" && <p className="muted small">Loading live data…</p>}
      {Array.isArray(entries) && entries.length > 0 && <CompareTable entries={entries} />}
    </section>
  );
}

function CompareTable({ entries }: { entries: Entry[] }) {
  return (
    <div className="compare-table" style={{ ["--compare-cols" as string]: entries.length }}>
      <div className="compare-cell compare-corner" />
      {entries.map(e => (
        <a key={e.symbol} className="compare-cell compare-col-header" href={`/app/?page=ticker&symbol=${encodeURIComponent(e.symbol)}`}>
          <div className="compare-col-name">{e.profile?.name ?? e.symbol}</div>
          <div className="compare-col-ticker">{e.symbol}</div>
        </a>
      ))}
      {ROWS.map(row => (
        <FragmentRow key={row.label} row={row} entries={entries} />
      ))}
    </div>
  );
}

function FragmentRow({ row, entries }: { row: Row; entries: Entry[] }) {
  return (
    <>
      <div className="compare-cell compare-row-label">{row.label}</div>
      {entries.map(e => {
        const v = row.get(e);
        const bucket = getSectorBucket(e.profile?.finnhubIndustry ?? null);
        const light = row.defKey && typeof v === "number" ? getTrafficLight(row.defKey, v, bucket) : null;
        const text = typeof v !== "number" || !Number.isFinite(v) ? "N/A"
          : row.money ? fmtPrice(v) : row.percent ? fmtPct(v) : v.toFixed(2);
        return (
          <div key={e.symbol} className="compare-cell">
            {light && <span className={`traffic-dot traffic-${light}`} title={trafficLabel(light)} />} {text}
          </div>
        );
      })}
    </>
  );
}
