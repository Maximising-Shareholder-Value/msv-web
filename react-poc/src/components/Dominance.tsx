import { useMemo } from "react";
import { fmtCompact } from "../lib/format";
import type { Coin } from "../lib/types";

const PALETTE = ["#f7931a", "#627eea", "#26a17b", "#f3ba2f", "#00ffbd", "#0033ad", "#c2a633", "#8247e5", "#6d28d9"];

/** A donut of market-cap share — CoinMarketCap-style, computed from data we already have. */
export function Dominance({ coins, globalTotal }: { coins: Coin[]; globalTotal: number | null }) {
  const slices = useMemo(() => {
    const top = coins.slice(0, 7);
    const topSum = top.reduce((s, c) => s + c.market_cap, 0);
    const others = globalTotal != null ? Math.max(0, globalTotal - topSum) : null;
    const total = globalTotal ?? topSum;
    const raw = [...top.map(c => ({ label: c.symbol.toUpperCase(), value: c.market_cap })), ...(others != null ? [{ label: "Others", value: others }] : [])];
    let angle = -90;
    return raw.map((s, i) => {
      const frac = s.value / total;
      const start = angle;
      angle += frac * 360;
      return { ...s, start, end: angle, pct: frac * 100, color: i === raw.length - 1 && others != null ? "var(--border)" : PALETTE[i % PALETTE.length] };
    });
  }, [coins, globalTotal]);

  const r = 70, cx = 90, cy = 90;
  const arc = (start: number, end: number) => {
    const toXY = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
    const [x1, y1] = toXY(start), [x2, y2] = toXY(end);
    const large = end - start > 180 ? 1 : 0;
    return `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
  };

  return (
    <div className="cr-box">
      <h4>Market cap dominance <span className="card-subtitle">share of the total crypto market, top coins vs. everything else</span></h4>
      <div className="dom-wrap">
        <svg viewBox="0 0 180 180" className="dom-donut" role="img" aria-label="Market cap dominance donut chart">
          {slices.map(s => <path key={s.label} d={arc(s.start, s.end)} fill={s.color} stroke="var(--bg-surface)" strokeWidth={1.5} />)}
          <circle cx={cx} cy={cy} r={38} fill="var(--bg-surface)" />
          <text x={cx} y={cy - 4} textAnchor="middle" className="dom-center-label">Total</text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="dom-center-value">{globalTotal != null ? fmtCompact(globalTotal, "$") : "—"}</text>
        </svg>
        <div className="dom-legend">
          {slices.map(s => (
            <div key={s.label} className="dom-legend-row">
              <i style={{ background: s.color }} /><span>{s.label}</span><b>{s.pct.toFixed(1)}%</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
