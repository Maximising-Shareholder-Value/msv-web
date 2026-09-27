import { coingecko, useAsync } from "../lib/api";
import { fmtCompact } from "../lib/format";
import type { Exchange } from "../lib/types";
import { Loadable } from "./Loadable";

export function Exchanges() {
  const state = useAsync(() => coingecko<Exchange[]>("/exchanges", { per_page: "15", page: "1" }), []);
  return (
    <div className="card-inner">
      <h4>Top exchanges <span className="card-subtitle">CoinGecko trust score (0–10, weighs regulation, liquidity and reported-volume reliability) and 24h volume, in BTC</span></h4>
      <Loadable state={state} what="exchanges">
        {list => (
          <table className="crypto-table quotes-table">
            <thead><tr><th>#</th><th>Exchange</th><th>Country</th><th>Established</th><th>Trust score</th><th>24h volume (BTC)</th></tr></thead>
            <tbody>
              {list.map(ex => (
                <tr key={ex.id}>
                  <td className="muted">{ex.trust_score_rank ?? "—"}</td>
                  <td><span className="cr-coin"><img src={ex.image} alt="" width={20} height={20} /><strong>{ex.name}</strong></span></td>
                  <td className="muted small">{ex.country ?? "—"}</td>
                  <td className="muted small">{ex.year_established ?? "—"}</td>
                  <td>{ex.trust_score != null ? <span className={ex.trust_score >= 8 ? "positive" : ex.trust_score >= 5 ? "" : "negative"}>{ex.trust_score} / 10</span> : "—"}</td>
                  <td>{fmtCompact(ex.trade_volume_24h_btc)} BTC</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Loadable>
      <p className="muted small">Reported volume can be inflated by some exchanges (wash trading) — trust score is CoinGecko's attempt to weigh for that, not a guarantee.</p>
    </div>
  );
}
