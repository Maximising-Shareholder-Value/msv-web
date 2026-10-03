// components/Invest.tsx — the "What if you'd invested?" calculator on the ticker
// page. Ports initInvestCalc / renderInvestResults / renderReturnsTable from
// invest.js. Price return only: the free data plans don't include dividends, and
// the page says so.

import { useEffect, useMemo, useState } from "react";
import { getDailyCloses, pastInvestment, returnWindows, yearsOfHistory, type Close } from "../lib/invest";
import { fmtPrice } from "../lib/format";

export function Invest({ symbol }: { symbol: string }) {
  const [closes, setCloses] = useState<Close[] | null | undefined>(undefined);
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(5);

  useEffect(() => {
    let live = true;
    setCloses(undefined);
    getDailyCloses(symbol).then(c => { if (live) setCloses(c); });
    return () => { live = false; };
  }, [symbol]);

  const result = useMemo(() => (closes ? pastInvestment(closes, amount, years) : null), [closes, amount, years]);
  const windows = useMemo(() => (closes ? returnWindows(closes) : []), [closes]);

  if (closes === undefined) return <p className="muted small">Loading price history…</p>;
  if (closes === null) return <p className="muted">Not enough price history available for this symbol.</p>;

  const maxYears = Math.max(1, Math.min(10, Math.floor(yearsOfHistory(closes))));
  const money = (v: number) => fmtPrice(v);

  return (
    <div className="invest">
      <div className="invest-controls">
        <label className="invest-amount-row">
          Invest <span className="invest-amount-prefix">$</span>
          <input type="number" min={1} max={10000000} step={1} value={amount} onChange={e => setAmount(Math.max(1, Number(e.target.value) || 0))} />
        </label>
        <div className="invest-years-row">
          <span>{years} year{years === 1 ? "" : "s"} ago</span>
          <div className="invest-years-slider-row">
            <button type="button" className="invest-years-step" aria-label="One year less" onClick={() => setYears(y => Math.max(1, y - 1))}>−</button>
            <input type="range" min={1} max={maxYears} step={1} value={Math.min(years, maxYears)} onChange={e => setYears(Number(e.target.value))} />
            <button type="button" className="invest-years-step" aria-label="One year more" onClick={() => setYears(y => Math.min(maxYears, y + 1))}>+</button>
          </div>
        </div>
      </div>

      {!result || !result.ok ? (
        <p className="muted">Only {yearsOfHistory(closes).toFixed(1)} years of price history available for {symbol}. Pick a shorter period.</p>
      ) : (
        <>
          <div className="invest-result-block">
            <p className="invest-result-lead">{money(amount)} invested in {symbol} on <strong>{new Date(result.pastDateMs).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</strong> would be worth</p>
            <p className={`invest-result-figure ${result.growthPct >= 0 ? "positive" : "negative"}`}>
              {money(result.nowValue)} <span className="invest-result-pct">({result.growthPct >= 0 ? "+" : ""}{result.growthPct.toFixed(1)}% total)</span>
            </p>
            <p className="invest-yield-readout">Historical yield: <strong className={result.cagr >= 0 ? "positive" : "negative"}>{result.cagr >= 0 ? "+" : ""}{(result.cagr * 100).toFixed(1)}% / year</strong> <span className="muted small">(annualized, over {result.actualYears.toFixed(1)} years)</span></p>
          </div>
          <div className="invest-result-block invest-projection">
            <p className="invest-result-lead">If {symbol}'s own {result.actualYears.toFixed(1)}-year historical growth rate continued, {money(amount)} invested <strong>today</strong> could grow to roughly</p>
            <p className="invest-result-figure invest-projection-figure">{money(amount * Math.pow(1 + result.cagr, result.actualYears))} <span className="invest-result-pct">in {result.actualYears.toFixed(1)} years</span></p>
            <p className="muted small invest-projection-caveat">Illustrative only, not a prediction. It extends {symbol}'s past growth rate forward and assumes nothing changes. Real future returns will very likely differ, possibly by a lot.</p>
          </div>
        </>
      )}

      <div className="invest-table-scroll">
        <p className="invest-table-title">Historical returns &amp; yield, {symbol}</p>
        <table className="invest-returns-table">
          <thead><tr><th /> {windows.map(w => <th key={w.label}>{w.label}</th>)}</tr></thead>
          <tbody>
            <tr><th>Total return</th>{windows.map(w => <td key={w.label} className={w.na ? "muted" : w.totalPct >= 0 ? "positive" : "negative"}>{w.na ? "N/A" : `${w.totalPct >= 0 ? "+" : ""}${w.totalPct.toFixed(1)}%`}</td>)}</tr>
            <tr><th>Annualized yield</th>{windows.map(w => <td key={w.label} className={w.na ? "muted" : w.annualPct >= 0 ? "positive" : "negative"}>{w.na ? "N/A" : `${w.annualPct >= 0 ? "+" : ""}${w.annualPct.toFixed(1)}%`}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="muted small">Based on real historical closing prices (Twelve Data). Price return only: historical dividends aren't on the free data plan, so they aren't included.</p>
    </div>
  );
}
