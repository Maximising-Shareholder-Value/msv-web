import { coingecko, getJSON, useAsync } from "../lib/api";
import { changeClass, fmtCompact, fmtPct } from "../lib/format";
import type { Category, LlamaChain, StablecoinPriced } from "../lib/types";
import { Loadable } from "./Loadable";

export function Categories() {
  const state = useAsync(
    () => coingecko<Category[]>("/coins/categories").then(list => list.filter(c => c.market_cap).sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0)).slice(0, 18)),
    [],
  );
  return (
    <div className="card-inner">
      <h4>Crypto sectors <span className="card-subtitle">CoinGecko categories, by market cap — they overlap (one coin can sit in several)</span></h4>
      <Loadable state={state} what="categories">
        {list => (
          <table className="crypto-table quotes-table">
            <thead><tr><th>Sector</th><th>Market cap</th><th>24h</th><th>24h volume</th><th>Top coins</th></tr></thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{fmtCompact(c.market_cap, "$")}</td>
                  <td className={changeClass(c.market_cap_change_24h)}>{fmtPct(c.market_cap_change_24h, 1)}</td>
                  <td>{fmtCompact(c.volume_24h, "$")}</td>
                  <td>{c.top_3_coins.map(u => <img key={u} src={u} alt="" width={18} height={18} className="cr-mini" />)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Loadable>
    </div>
  );
}

export function Defi() {
  const state = useAsync(() => getJSON<LlamaChain[]>("https://api.llama.fi/v2/chains").then(c => [...c].sort((a, b) => b.tvl - a.tvl)), []);
  return (
    <div className="card-inner">
      <h4>DeFi: value locked by blockchain <span className="card-subtitle">DefiLlama · total value locked (TVL)</span></h4>
      <Loadable state={state} what="DeFi data">
        {chains => {
          const total = chains.reduce((s, c) => s + (c.tvl || 0), 0);
          const top = chains.slice(0, 10);
          return (
            <>
              <div className="cr-total">Total DeFi TVL <strong>{fmtCompact(total, "$")}</strong> across {chains.length} chains</div>
              {top.map(c => (
                <div key={c.name} className="mi-rank-row cr-defi-row">
                  <span className="mi-rank-name">{c.name}</span>
                  <span className="mi-rank-bar"><i style={{ width: `${(c.tvl / top[0].tvl) * 100}%` }} /></span>
                  <b>{fmtCompact(c.tvl, "$")}</b>
                </div>
              ))}
              <p className="muted small">TVL is the dollar value of assets deposited in a chain's lending, trading and staking apps — a measure of usage, not profit or safety.</p>
            </>
          );
        }}
      </Loadable>
    </div>
  );
}

const MECHANISM: Record<string, string> = { "fiat-backed": "Backed by cash & Treasuries", "crypto-backed": "Backed by crypto collateral", algorithmic: "Algorithmic" };

// A depeg is usually small — a few tenths of a cent — so 0.3% is already a
// visible amber warning, and anything past 1% is a real, rare event.
function pegStatus(price: number | undefined) {
  if (price == null) return { label: "—", cls: "" };
  const dev = Math.abs(price - 1) * 100;
  if (dev < 0.3) return { label: "On peg", cls: "positive" };
  if (dev < 1) return { label: `${dev.toFixed(2)}% off`, cls: "" };
  return { label: `${dev.toFixed(2)}% off`, cls: "negative" };
}

export function Stablecoins() {
  const state = useAsync(
    () => getJSON<{ peggedAssets: StablecoinPriced[] }>("https://stablecoins.llama.fi/stablecoins?includePrices=true").then(r =>
      r.peggedAssets
        .filter(a => !a.pegType || a.pegType === "peggedUSD")
        .map(a => ({ ...a, cap: a.circulating?.peggedUSD ?? 0, week: a.circulatingPrevWeek?.peggedUSD ?? 0 }))
        .sort((a, b) => b.cap - a.cap)),
    [],
  );
  return (
    <div className="card-inner">
      <h4>Stablecoins <span className="card-subtitle">DefiLlama · dollar-pegged tokens — the "cash" of crypto, plus live peg tracking</span></h4>
      <Loadable state={state} what="stablecoin data">
        {list => {
          const total = list.reduce((s, a) => s + a.cap, 0);
          return (
            <>
              <div className="cr-total">Dollar stablecoins outstanding <strong>{fmtCompact(total, "$")}</strong></div>
              <table className="crypto-table quotes-table">
                <thead><tr><th>Stablecoin</th><th>Price</th><th>Peg status</th><th>Circulating</th><th>Share</th><th>7d change</th><th>How it's backed</th></tr></thead>
                <tbody>
                  {list.slice(0, 12).map(a => {
                    const wk = a.week ? ((a.cap - a.week) / a.week) * 100 : null;
                    const peg = pegStatus(a.price);
                    return (
                      <tr key={a.symbol + a.name}>
                        <td><strong>{a.symbol}</strong> <span className="muted small">{a.name}</span></td>
                        <td>{a.price != null ? `$${a.price.toFixed(4)}` : "—"}</td>
                        <td className={peg.cls}>{peg.label}</td>
                        <td>{fmtCompact(a.cap, "$")}</td>
                        <td>{((a.cap / total) * 100).toFixed(1)}%</td>
                        <td className={changeClass(wk)}>{fmtPct(wk)}</td>
                        <td className="muted small">{(a.pegMechanism && MECHANISM[a.pegMechanism]) ?? a.pegMechanism ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="muted small">Stablecoins aim to hold $1, but can "depeg" if reserves are questioned. Growth in supply is often read as money waiting on the sidelines.</p>
            </>
          );
        }}
      </Loadable>
    </div>
  );
}
