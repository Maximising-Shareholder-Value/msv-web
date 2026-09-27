import { useMemo } from "react";
import { coingecko, useAsync } from "../lib/api";
import { changeClass, fmtCompact, fmtPct } from "../lib/format";
import type { Derivative } from "../lib/types";
import { Loadable } from "./Loadable";

// The raw feed has 25,000+ contracts across every exchange. We reduce it to
// one row per major coin's perpetual futures, aggregated, which is what
// actually answers "are traders leaning long or short."
function summarize(rows: Derivative[]) {
  const perp = rows.filter(r => r.contract_type === "perpetual" && r.open_interest);
  const byCoin = new Map<string, { oi: number; volWeightedFunding: number; volume: number; count: number }>();
  for (const r of perp) {
    const key = r.index_id;
    const cur = byCoin.get(key) ?? { oi: 0, volWeightedFunding: 0, volume: 0, count: 0 };
    cur.oi += r.open_interest ?? 0;
    cur.volume += r.volume_24h ?? 0;
    cur.volWeightedFunding += (r.funding_rate ?? 0) * (r.volume_24h ?? 0);
    cur.count += 1;
    byCoin.set(key, cur);
  }
  return [...byCoin.entries()]
    .map(([coin, v]) => ({ coin, oi: v.oi, volume: v.volume, count: v.count, avgFunding: v.volume ? (v.volWeightedFunding / v.volume) * 100 : 0 }))
    .filter(x => x.oi > 1e7)
    .sort((a, b) => b.oi - a.oi)
    .slice(0, 12);
}

export function Derivatives() {
  const state = useAsync(() => coingecko<Derivative[]>("/derivatives"), []);
  const rows = useMemo(() => (state.data ? summarize(state.data) : []), [state.data]);
  return (
    <div className="card-inner">
      <h4>Futures &amp; derivatives <span className="card-subtitle">perpetual futures open interest and funding rate, aggregated across exchanges</span></h4>
      <Loadable state={state} what="derivatives data">
        {() => (
          <>
            <table className="crypto-table quotes-table">
              <thead><tr><th>Coin</th><th>Open interest</th><th>24h volume</th><th>Funding rate</th><th>Contracts</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.coin}>
                    <td><strong>{r.coin}</strong></td>
                    <td>{fmtCompact(r.oi, "$")}</td>
                    <td>{fmtCompact(r.volume, "$")}</td>
                    <td className={changeClass(r.avgFunding)}>{fmtPct(r.avgFunding, 4)}</td>
                    <td className="muted small">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">Open interest = total value of unsettled futures contracts — a proxy for leverage in the system. Funding rate: positive means longs pay shorts (crowd leaning bullish); negative means the reverse. Paid every few hours, small on any one payment but a real ongoing cost while a position is open.</p>
          </>
        )}
      </Loadable>
    </div>
  );
}
