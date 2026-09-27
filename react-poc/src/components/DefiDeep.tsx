import { useMemo } from "react";
import { getJSON, useAsync } from "../lib/api";
import { changeClass, fmtCompact, fmtPct } from "../lib/format";
import type { Protocol, YieldPool } from "../lib/types";
import { Loadable } from "./Loadable";

export function Protocols() {
  const state = useAsync(() => getJSON<Protocol[]>("https://api.llama.fi/protocols"), []);
  const rows = useMemo(() => [...(state.data ?? [])].sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0)).slice(0, 15), [state.data]);
  return (
    <div className="card-inner">
      <h4>Top DeFi protocols <span className="card-subtitle">DefiLlama · by total value locked, across all chains — includes centralized exchanges' on-chain reserves</span></h4>
      <Loadable state={state} what="protocol data">
        {() => (
          <table className="crypto-table quotes-table">
            <thead><tr><th>Protocol</th><th>Category</th><th>Chains</th><th>TVL</th><th>1d</th><th>7d</th></tr></thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.name}>
                  <td><strong>{p.name}</strong></td>
                  <td className="muted small">{p.category ?? "—"}</td>
                  <td className="muted small">{p.chains.slice(0, 3).join(", ")}{p.chains.length > 3 ? ` +${p.chains.length - 3}` : ""}</td>
                  <td>{fmtCompact(p.tvl, "$")}</td>
                  <td className={changeClass(p.change_1d)}>{fmtPct(p.change_1d, 1)}</td>
                  <td className={changeClass(p.change_7d)}>{fmtPct(p.change_7d, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Loadable>
    </div>
  );
}

export function YieldPools() {
  const state = useAsync(() => getJSON<{ data: YieldPool[] }>("https://yields.llama.fi/pools").then(r => r.data), []);
  const rows = useMemo(
    () => [...(state.data ?? [])].filter(p => p.tvlUsd > 5e7).sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0)).slice(0, 12),
    [state.data],
  );
  return (
    <div className="card-inner">
      <h4>Highest-yield pools <span className="card-subtitle">DefiLlama · pools with at least $50M deposited, so the yield isn't just a thin/risky pool</span></h4>
      <Loadable state={state} what="yield data">
        {() => (
          <>
            <table className="crypto-table quotes-table">
              <thead><tr><th>Pool</th><th>Project</th><th>Chain</th><th>TVL</th><th>APY</th><th>Type</th></tr></thead>
              <tbody>
                {rows.map(p => (
                  <tr key={p.project + p.symbol + p.chain}>
                    <td><strong>{p.symbol}</strong></td>
                    <td className="muted small">{p.project}</td>
                    <td className="muted small">{p.chain}</td>
                    <td>{fmtCompact(p.tvlUsd, "$")}</td>
                    <td className="positive">{p.apy?.toFixed(2) ?? "—"}%</td>
                    <td className="muted small">{p.stablecoin ? "Stablecoin" : p.ilRisk === "yes" ? "Volatile (IL risk)" : "Volatile"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">APY is variable and can drop fast once a pool gets popular. "IL risk" means impermanent loss — a two-asset pool can be worth less than just holding the assets if their prices diverge. High yield usually means higher risk somewhere (smart-contract, depeg, or IL) — not free money.</p>
          </>
        )}
      </Loadable>
    </div>
  );
}
