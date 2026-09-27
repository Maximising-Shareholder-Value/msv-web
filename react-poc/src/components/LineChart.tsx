import { useState, type MouseEvent } from "react";
import { fmtPrice } from "../lib/format";

interface Point { t: number; v: number }

/**
 * Price chart with a hover crosshair — move the mouse and it shows the exact
 * date and price under the cursor. `hover` is "state": React re-draws just
 * the parts that depend on it every time it changes. Doing this in the
 * vanilla site means manually finding elements and updating them.
 */
export function LineChart({ points, width = 760, height = 240 }: { points: Point[]; width?: number; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return <p className="muted small">Not enough history to chart.</p>;

  const pad = { l: 58, r: 10, t: 12, b: 22 };
  const vals = points.map(p => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / (points.length - 1)) * w;
  const y = (v: number) => pad.t + h - ((v - min) / span) * h;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const up = points[points.length - 1].v >= points[0].v;
  const color = up ? "var(--positive)" : "var(--negative)";
  const date = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(((px - pad.l) / w) * (points.length - 1)))));
  };

  const hp = hover === null ? null : points[hover];
  const flip = hover !== null && hover > points.length * 0.6; // keep the tooltip inside the chart

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="poc-chart" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Price chart">
      {[0, 0.5, 1].map(f => (
        <g key={f}>
          <line x1={pad.l} x2={width - pad.r} y1={pad.t + h * f} y2={pad.t + h * f} stroke="var(--border)" />
          <text x={pad.l - 6} y={pad.t + h * f + 4} textAnchor="end" className="poc-axis">{fmtPrice(max - span * f)}</text>
        </g>
      ))}
      <path d={`${line} L${x(points.length - 1)},${pad.t + h} L${x(0)},${pad.t + h} Z`} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <text x={pad.l} y={height - 5} className="poc-axis">{date(points[0].t)}</text>
      <text x={width - pad.r} y={height - 5} textAnchor="end" className="poc-axis">{date(points[points.length - 1].t)}</text>
      {hp && hover !== null && (
        <g pointerEvents="none">
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="var(--text-muted)" strokeDasharray="3 3" />
          <circle cx={x(hover)} cy={y(hp.v)} r={4.5} fill={color} stroke="var(--bg-surface)" strokeWidth={2} />
          <g transform={`translate(${flip ? x(hover) - 132 : x(hover) + 10}, ${Math.max(pad.t, y(hp.v) - 20)})`}>
            <rect width={122} height={38} rx={6} fill="var(--bg-surface-2)" stroke="var(--border)" />
            <text x={8} y={15} className="poc-tip-date">{new Date(hp.t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</text>
            <text x={8} y={31} className="poc-tip-val">{fmtPrice(hp.v)}</text>
          </g>
        </g>
      )}
    </svg>
  );
}
