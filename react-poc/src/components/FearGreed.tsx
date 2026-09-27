import { getJSON, useAsync } from "../lib/api";
import type { FearGreedPoint } from "../lib/types";
import { Loadable } from "./Loadable";
import { Sparkline } from "./Sparkline";

const SEGMENTS: [number, string][] = [[25, "#dc2626"], [45, "#f97316"], [55, "#eab308"], [75, "#84cc16"], [100, "#16a34a"]];
// 0..100 -> a point on a half circle (left = 0, right = 100)
const polar = (v: number, r: number): [number, number] => {
  const a = Math.PI * (1 - v / 100);
  return [110 + r * Math.cos(a), 110 - r * Math.sin(a)];
};

export function FearGreed() {
  const state = useAsync(() => getJSON<{ data: FearGreedPoint[] }>("https://api.alternative.me/fng/?limit=31").then(r => r.data), []);
  return (
    <div className="cr-box">
      <h4>Fear &amp; Greed <span className="card-subtitle">alternative.me · 0 = extreme fear, 100 = extreme greed</span></h4>
      <Loadable state={state} what="the index">
        {data => {
          const now = Number(data[0].value);
          const [nx, ny] = polar(now, 74);
          let prev = 0;
          const arcs = SEGMENTS.map(([to, color]) => {
            const [x1, y1] = polar(prev, 90);
            const [x2, y2] = polar(to, 90);
            const d = `M${x1.toFixed(1)},${y1.toFixed(1)} A90,90 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
            prev = to;
            return <path key={to} d={d} stroke={color} strokeWidth={16} fill="none" />;
          });
          const at = (i: number) => (data[i] ? <>{data[i].value} <span className="muted">{data[i].value_classification}</span></> : "—");
          return (
            <>
              <div className="cr-fear">
                <svg viewBox="0 0 220 128" className="cr-gauge">
                  {arcs}
                  <line x1={110} y1={110} x2={nx} y2={ny} stroke="var(--text-primary)" strokeWidth={3} strokeLinecap="round" />
                  <circle cx={110} cy={110} r={6} fill="var(--text-primary)" />
                  <text x={110} y={100} textAnchor="middle" className="cr-gauge-num">{now}</text>
                </svg>
                <div className="cr-fear-side">
                  <strong className="cr-fear-label">{data[0].value_classification}</strong>
                  <div className="cr-fear-rows"><span>Yesterday</span><b>{at(1)}</b><span>Last week</span><b>{at(7)}</b><span>Last month</span><b>{at(30)}</b></div>
                  <Sparkline values={data.map(d => Number(d.value)).reverse()} width={160} height={34} />
                  <div className="muted small">30-day history</div>
                </div>
              </div>
              <p className="muted small">A composite of volatility, momentum, social media, dominance and trends. Extreme readings have often — not always — marked short-term turning points.</p>
            </>
          );
        }}
      </Loadable>
    </div>
  );
}
