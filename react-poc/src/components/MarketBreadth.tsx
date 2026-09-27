import { useMemo } from "react";
import { changeClass, fmtPct } from "../lib/format";
import type { Coin } from "../lib/types";

/**
 * Computed entirely from the top-100 coins we already fetched — zero extra
 * API calls. Answers questions the raw table doesn't: is this a broad rally
 * or just Bitcoin, and which coins are the outliers.
 */
export function MarketBreadth({ coins }: { coins: Coin[] }) {
  const stats = useMemo(() => {
    const d24 = coins.map(c => c.price_change_percentage_24h_in_currency).filter((v): v is number => v != null);
    const up = d24.filter(v => v > 0).length;
    const avg = d24.reduce((s, v) => s + v, 0) / (d24.length || 1);
    const sorted = [...coins].filter(c => c.price_change_percentage_24h_in_currency != null)
      .sort((a, b) => (b.price_change_percentage_24h_in_currency! - a.price_change_percentage_24h_in_currency!));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Altcoin Season Index (simplified): among the top 50 non-stablecoins,
    // what share beat Bitcoin's own 30-day return? >75% = "altcoin season",
    // <25% = "Bitcoin season". Same idea CoinGecko's own index uses.
    const btc = coins.find(c => c.id === "bitcoin");
    const btc30 = btc?.price_change_percentage_30d_in_currency ?? null;
    const stableIds = new Set(["tether", "usd-coin", "dai", "true-usd", "first-digital-usd", "usds", "ethena-usde"]);
    const field = coins.filter(c => !stableIds.has(c.id)).slice(0, 50).map(c => c.price_change_percentage_30d_in_currency).filter((v): v is number => v != null);
    const beatBtc = btc30 != null ? field.filter(v => v > btc30).length : null;
    const altSeasonPct = beatBtc != null && field.length ? (beatBtc / field.length) * 100 : null;
    const seasonLabel = altSeasonPct == null ? null : altSeasonPct >= 75 ? "Altcoin season" : altSeasonPct <= 25 ? "Bitcoin season" : "Mixed / neutral";

    // Spread: how wide the 24h moves are — a rough volatility-of-the-day gauge.
    const spread = d24.length ? Math.max(...d24) - Math.min(...d24) : null;

    return { up, total: d24.length, avg, best, worst, altSeasonPct, seasonLabel, spread };
  }, [coins]);

  return (
    <div className="cr-box">
      <h4>Market breadth &amp; analysis <span className="card-subtitle">computed from the top 100 coins — not a forecast</span></h4>
      <div className="poc-breadth-grid">
        <div className="cr-stat">
          <span>24h breadth</span>
          <strong className={stats.up > stats.total / 2 ? "positive" : "negative"}>{stats.up} / {stats.total} up</strong>
          <em>average move {fmtPct(stats.avg, 2)}</em>
        </div>
        <div className="cr-stat">
          <span>Best mover (24h)</span>
          <strong>{stats.best?.symbol.toUpperCase() ?? "—"} <span className={changeClass(stats.best?.price_change_percentage_24h_in_currency)}>{fmtPct(stats.best?.price_change_percentage_24h_in_currency)}</span></strong>
        </div>
        <div className="cr-stat">
          <span>Worst mover (24h)</span>
          <strong>{stats.worst?.symbol.toUpperCase() ?? "—"} <span className={changeClass(stats.worst?.price_change_percentage_24h_in_currency)}>{fmtPct(stats.worst?.price_change_percentage_24h_in_currency)}</span></strong>
        </div>
        <div className="cr-stat">
          <span>Dispersion (24h)</span>
          <strong>{stats.spread != null ? `${stats.spread.toFixed(0)} pts` : "—"}</strong>
          <em>gap between best and worst</em>
        </div>
        <div className="cr-stat">
          <span>Altcoin Season Index</span>
          <strong>{stats.altSeasonPct != null ? `${stats.altSeasonPct.toFixed(0)}%` : "—"}</strong>
          <em>{stats.seasonLabel ?? "—"} · % of top 50 beating BTC's 30d return</em>
        </div>
      </div>
    </div>
  );
}
