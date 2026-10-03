// components/Analysts.tsx — analyst recommendations and recent earnings for the
// ticker page. Ports renderRecommendation() and renderEarnings() from script.js.
// Actual EPS is coloured green when it beat the estimate and red when it missed.

import { useEffect, useState } from "react";
import { getRecommendations, getEarningsHistory, type RecommendationTrend, type EarningsQuarter } from "../lib/finnhub";

export function Analysts({ symbol }: { symbol: string }) {
  const [recs, setRecs] = useState<RecommendationTrend[] | null | undefined>(undefined);
  const [earn, setEarn] = useState<EarningsQuarter[] | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setRecs(undefined); setEarn(undefined);
    getRecommendations(symbol).then(r => { if (live) setRecs(r); });
    getEarningsHistory(symbol).then(e => { if (live) setEarn(e); });
    return () => { live = false; };
  }, [symbol]);

  return (
    <div className="analysts">
      <div className="analysts-col">
        <h5>Analyst recommendations</h5>
        <Recommendation data={recs} />
      </div>
      <div className="analysts-col">
        <h5>Recent earnings</h5>
        <Earnings data={earn} />
      </div>
    </div>
  );
}

function Recommendation({ data }: { data: RecommendationTrend[] | null | undefined }) {
  if (data === undefined) return <p className="muted small">Loading…</p>;
  const latest = data && [...data].sort((a, b) => b.period.localeCompare(a.period))[0];
  if (!latest) return <p className="muted">No analyst recommendation data available for this symbol.</p>;
  const segments: [string, number, string][] = [
    ["Strong Buy", latest.strongBuy, "rec-strongbuy"],
    ["Buy", latest.buy, "rec-buy"],
    ["Hold", latest.hold, "rec-hold"],
    ["Sell", latest.sell, "rec-sell"],
    ["Strong Sell", latest.strongSell, "rec-strongsell"],
  ];
  const total = segments.reduce((s, [, n]) => s + n, 0);
  if (total === 0) return <p className="muted">No analyst recommendation data available for this symbol.</p>;
  return (
    <>
      <div className="rec-bar">
        {segments.filter(([, n]) => n > 0).map(([label, n, cls]) => (
          <div key={label} className={`rec-segment ${cls}`} style={{ width: `${(n / total) * 100}%` }} title={`${label}: ${n}`} />
        ))}
      </div>
      <div className="rec-legend">
        {segments.map(([label, n, cls]) => <span key={label} className="rec-legend-item"><span className={`rec-dot ${cls}`} />{label}: {n}</span>)}
      </div>
      <p className="muted small">As of {latest.period} · {total} analysts</p>
    </>
  );
}

function Earnings({ data }: { data: EarningsQuarter[] | null | undefined }) {
  if (data === undefined) return <p className="muted small">Loading…</p>;
  if (!data || data.length === 0) return <p className="muted">No earnings history available for this symbol.</p>;
  const rows = [...data].sort((a, b) => b.period.localeCompare(a.period)).slice(0, 4);
  const num = (v: number | null) => (typeof v === "number" ? v.toFixed(2) : "N/A");
  return (
    <div className="earnings-table">
      <div className="earnings-row earnings-header"><div>Quarter</div><div>Expected EPS</div><div>Actual EPS</div></div>
      {rows.map(q => {
        const beat = typeof q.surprisePercent === "number" ? q.surprisePercent >= 0 : null;
        return (
          <div key={q.period} className="earnings-row">
            <div>{q.period || "--"}</div>
            <div>{num(q.estimate)}</div>
            <div className={beat === null ? "" : beat ? "positive" : "negative"}>{num(q.actual)}</div>
          </div>
        );
      })}
    </div>
  );
}
