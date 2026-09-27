import { useMemo, useState } from "react";
import { coingecko, useAsync } from "../lib/api";
import {
  bandForPrice, flowAt, GENESIS_DATE, HALVINGS, nextHalving, rainbowLog10, RAINBOW_BANDS,
  s2fModelPrice, stockToFlowAt, supplyAt,
} from "../lib/bitcoin";
import { changeClass, fmtCompact, fmtPrice } from "../lib/format";
import type { MarketChart } from "../lib/types";
import { Loadable } from "./Loadable";

const DAY = 86_400_000;

// ---------------- Rainbow chart ----------------
function RainbowChart({ priceHistory }: { priceHistory: [number, number][] }) {
  const width = 900, height = 420, pad = { l: 56, r: 12, t: 10, b: 24 };
  const w = width - pad.l - pad.r, h = height - pad.t - pad.b;

  const start = Date.UTC(2015, 0, 1);
  const end = Date.now() + 365 * DAY;
  const samples = 180;
  const xAt = (t: number) => pad.l + ((t - start) / (end - start)) * w;

  // y domain in log10(price) space, padded a little above/below the bands.
  const yMin = rainbowLog10(start) + RAINBOW_BANDS[0].offset - 0.3;
  const yMax = rainbowLog10(end) + RAINBOW_BANDS[RAINBOW_BANDS.length - 1].offset + 0.3;
  const yAt = (log10Price: number) => pad.t + h - ((log10Price - yMin) / (yMax - yMin)) * h;

  const times = Array.from({ length: samples + 1 }, (_, i) => start + (i / samples) * (end - start));

  const bandPolys = RAINBOW_BANDS.slice(0, -1).map((band, i) => {
    const next = RAINBOW_BANDS[i + 1];
    const top = times.map(t => [xAt(t), yAt(rainbowLog10(t) + next.offset)] as const);
    const bottom = times.map(t => [xAt(t), yAt(rainbowLog10(t) + band.offset)] as const).reverse();
    const d = [...top, ...bottom].map(([x, y], j) => `${j ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") + " Z";
    return { d, color: next.color, label: next.label };
  });

  const priceLine = priceHistory
    .filter(([t]) => t >= start && t <= end)
    .map(([t, v]) => `${xAt(t).toFixed(1)},${yAt(Math.log10(v)).toFixed(1)}`);
  const priceLineD = priceLine.length > 1 ? "M" + priceLine.join(" L") : "";

  const yTicks = [1_000, 10_000, 100_000, 1_000_000].filter(v => Math.log10(v) >= yMin && Math.log10(v) <= yMax);
  const yearTicks = [2016, 2018, 2020, 2022, 2024, 2026, 2028].filter(y => Date.UTC(y, 0, 1) >= start && Date.UTC(y, 0, 1) <= end);

  const now = Date.now();
  const nowPrice = priceHistory.length ? priceHistory[priceHistory.length - 1][1] : null;
  const nowBand = nowPrice ? bandForPrice(now, nowPrice) : null;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="rainbow-svg" role="img" aria-label="Bitcoin rainbow chart">
        {bandPolys.map(b => <path key={b.label} d={b.d} fill={b.color} opacity={0.82} />)}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={pad.l} x2={width - pad.r} y1={yAt(Math.log10(v))} y2={yAt(Math.log10(v))} stroke="rgba(255,255,255,0.25)" strokeDasharray="2 3" />
            <text x={pad.l - 6} y={yAt(Math.log10(v)) + 4} textAnchor="end" className="poc-axis rainbow-axis">${fmtCompact(v)}</text>
          </g>
        ))}
        {yearTicks.map(y => (
          <text key={y} x={xAt(Date.UTC(y, 0, 1))} y={height - 6} textAnchor="middle" className="poc-axis rainbow-axis">{y}</text>
        ))}
        <line x1={xAt(now)} x2={xAt(now)} y1={pad.t} y2={height - pad.b} stroke="#fff" strokeDasharray="4 3" opacity={0.8} />
        {priceLineD && <path d={priceLineD} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />}
        {nowPrice != null && <circle cx={xAt(now)} cy={yAt(Math.log10(nowPrice))} r={5} fill="#fff" stroke="#000" strokeWidth={1} />}
      </svg>
      <div className="rainbow-legend">
        {[...RAINBOW_BANDS].reverse().slice(0, -1).map(b => (
          <span key={b.label} className="rainbow-chip" style={{ background: b.color }}>{b.label}</span>
        ))}
      </div>
      {nowBand && nowPrice != null && (
        <p className="muted small">
          Today's real price (white line, last 365 days only — see note below) sits in the <strong style={{ color: nowBand.color }}>{nowBand.label}</strong> band at {fmtPrice(nowPrice)}.
        </p>
      )}
      <p className="muted small">
        The colored bands are a popular but informal logarithmic regression model (the version popularized by blockchaincenter.net), computed here from Bitcoin's known age — not fetched data, so they're shown across the full 2015–{new Date(end).getUTCFullYear()} range for context. The white price line only covers the <strong>last 365 days</strong> (CoinGecko's free plan doesn't include older history). This is a widely discussed community model, not a prediction, and its coefficients are refit differently by different sites — treat the bands as a talking point, not a forecast.
      </p>
    </div>
  );
}

// ---------------- Stock-to-Flow ----------------
function StockToFlow({ currentPrice, currentSupply }: { currentPrice: number | null; currentSupply: number | null }) {
  const width = 900, height = 280, pad = { l: 56, r: 12, t: 10, b: 24 };
  const w = width - pad.l - pad.r, h = height - pad.t - pad.b;
  const start = GENESIS_DATE, end = Date.UTC(2036, 0, 1);
  const points = Array.from({ length: 160 }, (_, i) => start + (i / 159) * (end - start)).map(t => ({ t, s2f: stockToFlowAt(t) }));
  const maxS2F = Math.max(...points.map(p => p.s2f));
  const xAt = (t: number) => pad.l + ((t - start) / (end - start)) * w;
  const yAt = (v: number) => pad.t + h - (v / maxS2F) * h;
  const line = points.map((p, i) => `${i ? "L" : "M"}${xAt(p.t).toFixed(1)},${yAt(p.s2f).toFixed(1)}`).join(" ");
  const now = Date.now();
  const liveS2F = currentSupply != null ? currentSupply / flowAt(now) : stockToFlowAt(now);
  const modelPrice = s2fModelPrice(liveS2F);
  const diff = currentPrice != null ? ((currentPrice - modelPrice) / modelPrice) * 100 : null;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="rainbow-svg" role="img" aria-label="Stock-to-flow ratio over time">
        {HALVINGS.map(hv => hv.date >= start && hv.date <= end && (
          <line key={hv.date} x1={xAt(hv.date)} x2={xAt(hv.date)} y1={pad.t} y2={height - pad.b} stroke={hv.observed ? "var(--border)" : "var(--text-muted)"} strokeDasharray={hv.observed ? undefined : "3 3"} />
        ))}
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <line x1={xAt(now)} x2={xAt(now)} y1={pad.t} y2={height - pad.b} stroke="#fff" strokeDasharray="4 3" opacity={0.7} />
        {[2010, 2014, 2018, 2022, 2026, 2030, 2034].map(y => (
          <text key={y} x={xAt(Date.UTC(y, 0, 1))} y={height - 6} textAnchor="middle" className="poc-axis rainbow-axis">{y}</text>
        ))}
      </svg>
      <p className="muted small">Vertical lines mark each halving (solid = happened, dashed = projected assuming the ~10-minute average block time continues). Stock-to-Flow roughly doubles at each halving as new supply growth slows.</p>
      <div className="cp-stats cr-wide" style={{ marginTop: 10 }}>
        <div className="cp-stat"><span>Current stock (supply)</span><strong>{currentSupply != null ? fmtCompact(currentSupply) : "—"} BTC</strong></div>
        <div className="cp-stat"><span>Current flow (annual issuance)</span><strong>{fmtCompact(flowAt(now))} BTC/yr</strong></div>
        <div className="cp-stat"><span>Stock-to-Flow ratio</span><strong>{liveS2F.toFixed(1)}</strong></div>
        <div className="cp-stat"><span>S2F model price</span><strong>{fmtPrice(modelPrice)}</strong></div>
        <div className="cp-stat"><span>Actual price vs. model</span><strong className={changeClass(diff)}>{diff != null ? `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%` : "—"}</strong></div>
      </div>
      <p className="muted small">
        PlanB's original 2019 Stock-to-Flow model (Price = e⁻¹·⁸⁴ × S2F³·³⁶) claimed scarcity alone should predict Bitcoin's price. Actual price diverged sharply from it starting around 2021, and many analysts now consider the model broken as a predictor — it's shown here as a well-known piece of crypto history and a real, live scarcity calculation, not as guidance.
      </p>
    </div>
  );
}

// ---------------- Halving table ----------------
function HalvingTable() {
  const next = nextHalving();
  const daysToNext = Math.max(0, Math.round((next.date - Date.now()) / DAY));
  return (
    <div className="card-inner">
      <h4>Halvings <span className="card-subtitle">the reward for mining a new block cuts in half roughly every 4 years — Bitcoin's built-in scarcity clock</span></h4>
      <div className="cr-total">Next halving {next.observed ? "" : "(projected)"} in <strong>~{daysToNext.toLocaleString()} days</strong> — reward drops to {next.reward} BTC</div>
      <table className="crypto-table quotes-table">
        <thead><tr><th>Date</th><th>Block reward</th><th>Annual issuance after</th><th></th></tr></thead>
        <tbody>
          {HALVINGS.filter(h => h.date >= Date.UTC(2012, 0, 1)).slice(0, 8).map(h => (
            <tr key={h.date}>
              <td><strong>{new Date(h.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</strong></td>
              <td>{h.reward} BTC</td>
              <td>{fmtCompact(flowAt(h.date + DAY))} BTC/yr</td>
              <td className="muted small">{h.observed ? "Happened" : "Projected"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BitcoinCycles({ btcPrice, btcSupply }: { btcPrice: number | null; btcSupply: number | null }) {
  const [range] = useState(365);
  const state = useAsync(() => coingecko<MarketChart>("/coins/bitcoin/market_chart", { vs_currency: "usd", days: String(range) }).then(r => r.prices), [range]);
  const prices = useMemo(() => state.data ?? [], [state.data]);

  return (
    <>
      <div className="card-inner">
        <h4>Bitcoin Rainbow Chart <span className="card-subtitle">a popular logarithmic model of where price sits relative to its long-term growth trend</span></h4>
        <Loadable state={state} what="price history">{() => <RainbowChart priceHistory={prices} />}</Loadable>
      </div>
      <div className="card-inner">
        <h4>Stock-to-Flow <span className="card-subtitle">scarcity: how many years of current production it would take to reproduce the existing supply</span></h4>
        <StockToFlow currentPrice={btcPrice} currentSupply={btcSupply ?? supplyAt(Date.now())} />
      </div>
      <HalvingTable />
    </>
  );
}
