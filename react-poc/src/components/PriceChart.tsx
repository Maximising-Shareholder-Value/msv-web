// components/PriceChart.tsx — the ticker page's price chart (React, SVG). Range
// buttons, line or candlestick view, 20- and 50-day averages, a hover readout,
// and volume and RSI panels. The bars and indicator maths are in lib/chart.ts.
//
// Not yet ported (still on the main site): the MACD panel, the support and
// resistance levels, and the zoom and pan controls.

import { useEffect, useMemo, useState } from "react";
import { getBars, RANGE_CONFIGS, sma, rsi, type Bar } from "../lib/chart";
import { fmtPrice } from "../lib/format";

const W = 900, PRICE_H = 260, VOL_H = 56, RSI_H = 70, PAD_L = 56, PAD_R = 10;
const RANGES = Object.keys(RANGE_CONFIGS);

export function PriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState("3M");
  const [bars, setBars] = useState<Bar[] | null | undefined>(undefined);
  const [candles, setCandles] = useState(false);
  const [showSma, setShowSma] = useState(true);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    setBars(undefined);
    getBars(symbol, range).then(b => { if (live) setBars(b); });
    return () => { live = false; };
  }, [symbol, range]);

  const sma20 = useMemo(() => (bars ? sma(bars.map(b => b.close), 20) : []), [bars]);
  const sma50 = useMemo(() => (bars ? sma(bars.map(b => b.close), 50) : []), [bars]);
  const rsi14 = useMemo(() => (bars ? rsi(bars.map(b => b.close), 14) : []), [bars]);

  if (bars === undefined) return <p className="muted small">Loading chart…</p>;
  if (bars === null) return <p className="muted small">Price data isn't available for {symbol} at this range right now.</p>;

  const n = bars.length;
  const plotW = W - PAD_L - PAD_R;
  const xOf = (i: number) => PAD_L + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const lo = Math.min(...bars.map(b => b.low)), hi = Math.max(...bars.map(b => b.high));
  const pad = (hi - lo) * 0.05 || 1;
  const yOf = (v: number) => 10 + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (PRICE_H - 20);
  const maxVol = Math.max(...bars.map(b => b.volume), 1);
  const barW = Math.max(1, (plotW / n) * 0.7);

  const path = (vals: (number | null)[]) => vals
    .map((v, i) => (v === null ? null : `${i === 0 || vals[i - 1] === null ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`))
    .filter(Boolean).join(" ");

  const last = bars[n - 1];
  const h = hover !== null ? bars[hover] : last;
  const change = bars.length > 1 ? ((last.close - bars[0].close) / bars[0].close) * 100 : 0;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((x - PAD_L) / plotW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="price-chart">
      <div className="chart-controls">
        <div className="sectors-view-toggle" role="group" aria-label="Range">
          {RANGES.map(r => <button key={r} type="button" className={r === range ? "active" : ""} onClick={() => setRange(r)}>{r}</button>)}
        </div>
        <div className="sectors-view-toggle" role="group" aria-label="Style">
          <button type="button" className={!candles ? "active" : ""} onClick={() => setCandles(false)}>Line</button>
          <button type="button" className={candles ? "active" : ""} onClick={() => setCandles(true)}>Candles</button>
        </div>
        <label className="options-toggle"><input type="checkbox" checked={showSma} onChange={e => setShowSma(e.target.checked)} /> 20 and 50-day averages</label>
      </div>

      <div className="chart-readout small">
        <span className="muted">{h.time}</span>{" "}
        O {fmtPrice(h.open)} · H {fmtPrice(h.high)} · L {fmtPrice(h.low)} · C <strong>{fmtPrice(h.close)}</strong>{" "}
        <span className="muted">Range change</span> <span className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</span>
      </div>

      <svg className="chart-svg" viewBox={`0 0 ${W} ${PRICE_H + VOL_H + RSI_H + 20}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={`${symbol} price chart`}>
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const v = lo - pad + f * (hi - lo + 2 * pad);
          return <g key={f}><line x1={PAD_L} x2={W - PAD_R} y1={yOf(v)} y2={yOf(v)} className="chart-grid" /><text x={PAD_L - 6} y={yOf(v) + 4} textAnchor="end" className="chart-axis">{v.toFixed(2)}</text></g>;
        })}

        {candles
          ? bars.map((b, i) => {
              const up = b.close >= b.open;
              const color = up ? "var(--positive, #10b981)" : "var(--negative, #ef4444)";
              const top = yOf(Math.max(b.open, b.close)), bot = yOf(Math.min(b.open, b.close));
              return <g key={i}><line x1={xOf(i)} x2={xOf(i)} y1={yOf(b.high)} y2={yOf(b.low)} stroke={color} /><rect x={xOf(i) - barW / 2} y={top} width={barW} height={Math.max(1, bot - top)} fill={color} /></g>;
            })
          : <path d={path(bars.map(b => b.close))} fill="none" stroke="var(--accent, #10b981)" strokeWidth="1.8" />}

        {showSma && <>
          <path d={path(sma20)} fill="none" stroke="#f59e0b" strokeWidth="1.2" />
          <path d={path(sma50)} fill="none" stroke="#6366f1" strokeWidth="1.2" />
        </>}

        {hover !== null && <line x1={xOf(hover)} x2={xOf(hover)} y1={10} y2={PRICE_H} className="chart-cursor" />}

        <g transform={`translate(0, ${PRICE_H + 8})`}>
          {bars.map((b, i) => <rect key={i} x={xOf(i) - barW / 2} y={VOL_H - (b.volume / maxVol) * VOL_H} width={barW} height={(b.volume / maxVol) * VOL_H} className={b.close >= b.open ? "chart-vol-up" : "chart-vol-down"} />)}
        </g>

        <g transform={`translate(0, ${PRICE_H + VOL_H + 20})`}>
          <line x1={PAD_L} x2={W - PAD_R} y1={0} y2={0} className="chart-grid" />
          <line x1={PAD_L} x2={W - PAD_R} y1={RSI_H * 0.3} y2={RSI_H * 0.3} className="chart-grid" />
          <line x1={PAD_L} x2={W - PAD_R} y1={RSI_H * 0.7} y2={RSI_H * 0.7} className="chart-grid" />
          <text x={PAD_L - 6} y={4} textAnchor="end" className="chart-axis">RSI 14</text>
          <path d={rsi14.map((v, i) => (v === null ? null : `${rsi14[i - 1] === null || rsi14[i - 1] === undefined ? "M" : "L"}${xOf(i).toFixed(1)},${(RSI_H - (v / 100) * RSI_H).toFixed(1)}`)).filter(Boolean).join(" ")} fill="none" stroke="#a855f7" strokeWidth="1.3" />
        </g>
      </svg>
      <p className="muted small">Bars from Twelve Data. The RSI above 70 is conventionally "overbought" and below 30 "oversold", a rule of thumb, not a signal. The MACD panel and support/resistance levels are on the main site.</p>
    </div>
  );
}
