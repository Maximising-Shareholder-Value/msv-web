// components/PriceChart.tsx — the ticker page's price chart (React, SVG). Range
// buttons, line or candlestick view, 20- and 50-day averages, support and
// resistance levels, a hover readout, and volume, RSI and MACD panels. The bars
// and indicator maths are in lib/chart.ts.
//
// The support and resistance levels are a rough heuristic from recent highs and
// lows, labelled as such, not a forecast.

import { useEffect, useMemo, useState } from "react";
import { getBars, RANGE_CONFIGS, sma, rsi, macd, supportResistance, type Bar } from "../lib/chart";
import { fmtPrice } from "../lib/format";

const W = 900, PRICE_H = 260, VOL_H = 56, RSI_H = 70, MACD_H = 80, PAD_L = 56, PAD_R = 10;
const RANGES = Object.keys(RANGE_CONFIGS);

export function PriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState("3M");
  const [bars, setBars] = useState<Bar[] | null | undefined>(undefined);
  const [candles, setCandles] = useState(false);
  const [showSma, setShowSma] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    setBars(undefined);
    getBars(symbol, range).then(b => { if (live) setBars(b); });
    return () => { live = false; };
  }, [symbol, range]);

  const closes = useMemo(() => (bars ? bars.map(b => b.close) : []), [bars]);
  const sma20 = useMemo(() => sma(closes, 20), [closes]);
  const sma50 = useMemo(() => sma(closes, 50), [closes]);
  const rsi14 = useMemo(() => rsi(closes, 14), [closes]);
  const macdParts = useMemo(() => macd(closes), [closes]);
  const levels = useMemo(() => supportResistance(closes), [closes]);

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
  const macdMax = Math.max(...macdParts.hist.map(v => Math.abs(v ?? 0)), ...macdParts.line.map(v => Math.abs(v ?? 0)), 0.0001);
  const macdY = (v: number) => MACD_H / 2 - (v / macdMax) * (MACD_H / 2 - 4);

  const line = (vals: (number | null)[], yfn: (v: number) => number) => vals
    .map((v, i) => (v === null ? null : `${vals[i - 1] === null || i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yfn(v).toFixed(1)}`))
    .filter(Boolean).join(" ");

  const last = bars[n - 1];
  const h = hover !== null ? bars[hover] : last;
  const change = bars.length > 1 ? ((last.close - bars[0].close) / bars[0].close) * 100 : 0;
  const rsiY = (v: number) => RSI_H - (v / 100) * RSI_H;
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((x - PAD_L) / plotW) * (n - 1)))));
  };
  const total = PRICE_H + VOL_H + RSI_H + MACD_H + 40;

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
        <label className="options-toggle"><input type="checkbox" checked={showLevels} onChange={e => setShowLevels(e.target.checked)} /> Support and resistance</label>
      </div>

      <div className="chart-readout small">
        <span className="muted">{h.time}</span>{" "}
        O {fmtPrice(h.open)} · H {fmtPrice(h.high)} · L {fmtPrice(h.low)} · C <strong>{fmtPrice(h.close)}</strong>{" "}
        <span className="muted">Range change</span> <span className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</span>
      </div>

      <svg className="chart-svg" viewBox={`0 0 ${W} ${total}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={`${symbol} price chart`}>
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const v = lo - pad + f * (hi - lo + 2 * pad);
          return <g key={f}><line x1={PAD_L} x2={W - PAD_R} y1={yOf(v)} y2={yOf(v)} className="chart-grid" /><text x={PAD_L - 6} y={yOf(v) + 4} textAnchor="end" className="chart-axis">{v.toFixed(2)}</text></g>;
        })}

        {showLevels && [...levels.support.map(v => ({ v, label: "Support", c: "#10b981" })), ...levels.resistance.map(v => ({ v, label: "Resistance", c: "#ef4444" }))].map(({ v, label, c }) => (
          <g key={`${label}-${v}`}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yOf(v)} y2={yOf(v)} stroke={c} strokeDasharray="5 4" strokeWidth="1" />
            <text x={W - PAD_R - 2} y={yOf(v) - 3} textAnchor="end" className="chart-axis" fill={c}>{label} {v.toFixed(2)}</text>
          </g>
        ))}

        {candles
          ? bars.map((b, i) => {
              const up = b.close >= b.open;
              const color = up ? "var(--positive, #10b981)" : "var(--negative, #ef4444)";
              const top = yOf(Math.max(b.open, b.close)), bot = yOf(Math.min(b.open, b.close));
              return <g key={i}><line x1={xOf(i)} x2={xOf(i)} y1={yOf(b.high)} y2={yOf(b.low)} stroke={color} /><rect x={xOf(i) - barW / 2} y={top} width={barW} height={Math.max(1, bot - top)} fill={color} /></g>;
            })
          : <path d={line(closes, yOf)} fill="none" stroke="var(--accent, #10b981)" strokeWidth="1.8" />}

        {showSma && <>
          <path d={line(sma20, yOf)} fill="none" stroke="#f59e0b" strokeWidth="1.2" />
          <path d={line(sma50, yOf)} fill="none" stroke="#6366f1" strokeWidth="1.2" />
        </>}

        {hover !== null && <line x1={xOf(hover)} x2={xOf(hover)} y1={10} y2={total} className="chart-cursor" />}

        <g transform={`translate(0, ${PRICE_H + 8})`}>
          {bars.map((b, i) => <rect key={i} x={xOf(i) - barW / 2} y={VOL_H - (b.volume / maxVol) * VOL_H} width={barW} height={(b.volume / maxVol) * VOL_H} className={b.close >= b.open ? "chart-vol-up" : "chart-vol-down"} />)}
        </g>

        <g transform={`translate(0, ${PRICE_H + VOL_H + 20})`}>
          <line x1={PAD_L} x2={W - PAD_R} y1={RSI_H * 0.3} y2={RSI_H * 0.3} className="chart-grid" />
          <line x1={PAD_L} x2={W - PAD_R} y1={RSI_H * 0.7} y2={RSI_H * 0.7} className="chart-grid" />
          <text x={PAD_L - 6} y={4} textAnchor="end" className="chart-axis">RSI 14</text>
          <path d={line(rsi14, rsiY)} fill="none" stroke="#a855f7" strokeWidth="1.3" />
        </g>

        <g transform={`translate(0, ${PRICE_H + VOL_H + RSI_H + 30})`}>
          <line x1={PAD_L} x2={W - PAD_R} y1={MACD_H / 2} y2={MACD_H / 2} className="chart-grid" />
          <text x={PAD_L - 6} y={8} textAnchor="end" className="chart-axis">MACD</text>
          {macdParts.hist.map((v, i) => v === null ? null : <rect key={i} x={xOf(i) - barW / 2} y={Math.min(macdY(v), MACD_H / 2)} width={barW} height={Math.max(1, Math.abs(macdY(v) - MACD_H / 2))} className={v >= 0 ? "chart-vol-up" : "chart-vol-down"} />)}
          <path d={line(macdParts.line, macdY)} fill="none" stroke="#0ea5e9" strokeWidth="1.2" />
          <path d={line(macdParts.signal, macdY)} fill="none" stroke="#f97316" strokeWidth="1.2" />
        </g>
      </svg>
      <p className="muted small">Bars from Twelve Data. RSI above 70 is conventionally "overbought" and below 30 "oversold", a rule of thumb, not a signal. Support and resistance are rough levels from recent highs and lows, not forecasts.</p>
    </div>
  );
}
