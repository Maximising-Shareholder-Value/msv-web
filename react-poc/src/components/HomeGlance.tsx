// components/HomeGlance.tsx — "Markets at a glance": four major US index funds with
// live prices, and one plain-English line worked out from those same prices.

import { useQuotes } from "../lib/useQuotes";
import { SECTOR_ETFS } from "../data/homeWidgets";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";

// US index funds, each checked live against the Finnhub proxy (2026-10-04). Eight of them, so the row fills.
const INDEXES: [string, string][] = [
  ["SPY", "S&P 500"], ["QQQ", "Nasdaq 100"], ["DIA", "Dow Jones"], ["IWM", "Russell 2000"],
  ["VTI", "Total US"], ["MDY", "MidCap 400"], ["RSP", "Equal Weight"], ["IJR", "SmallCap 600"],
];

/** A sentence for the intro, worked out from the same index prices (the latest session's moves, not a forecast). */
export function MarketsTodayNote() {
  const quotes = useQuotes(INDEXES.map(([s]) => s));
  const pct = (s: string) => {
    const dp = quotes[s]?.dp;
    return dp === undefined || dp === null ? null : `${dp >= 0 ? "+" : ""}${dp.toFixed(2)}%`;
  };
  const [spy, qqq, dia, iwm] = ["SPY", "QQQ", "DIA", "IWM"].map(pct);
  const sectorQuotes = useQuotes(SECTOR_ETFS.map(([s]) => s));
  const sectorMoves = SECTOR_ETFS
    .map(([s, n]) => ({ n, dp: sectorQuotes[s]?.dp }))
    .filter((r): r is { n: string; dp: number } => typeof r.dp === "number")
    .sort((a, b) => b.dp - a.dp);
  const best = sectorMoves[0];
  const worst = sectorMoves[sectorMoves.length - 1];
  const sectorLine = best && worst && best !== worst
    ? ` The strongest sector was ${best.n} (${best.dp >= 0 ? "+" : ""}${best.dp.toFixed(2)}%), and the weakest was ${worst.n} (${worst.dp >= 0 ? "+" : ""}${worst.dp.toFixed(2)}%).`
    : "";
  if (!spy || !qqq || !dia || !iwm) {
    return <p className="hp-live-note muted small">Live index moves will appear here once prices load.</p>;
  }
  return (
    <p className="hp-live-note">
      In the latest session the S&amp;P 500 moved <strong>{spy}</strong>, the Nasdaq 100 <strong>{qqq}</strong>, the Dow <strong>{dia}</strong> and the Russell 2000 <strong>{iwm}</strong>.{sectorLine} The cards below show the same funds with their live prices.
    </p>
  );
}

export function HomeGlance() {
  const quotes = useQuotes(INDEXES.map(([s]) => s));
  const settled = INDEXES.every(([s]) => quotes[s] !== undefined);
  // Only quotes with a real percentage move count; a missing one is not "down".
  const valid = INDEXES.map(([s, n]) => ({ s, n, q: quotes[s] })).filter(r => typeof r.q?.dp === "number");
  const up = valid.filter(r => r.q!.dp! > 0).length;

  const summary = !settled
    ? "Loading live prices…"
    : !valid.length
      ? "Live prices aren't available right now."
      : up === valid.length
        ? `All ${valid.length} major US indexes are up today.`
        : up === 0
          ? `All ${valid.length} major US indexes are down today.`
          : `${up} of ${valid.length} major US indexes are up today.`;

  return (
    <div className="hp-glance">
      <p className="hp-glance-summary">{summary}</p>
      <div className="hp-glance-grid">
        {INDEXES.map(([s, n]) => {
          const q = quotes[s];
          const dp = q?.dp ?? null;
          const width = dp === null ? 0 : Math.min(Math.abs(dp) / 2, 1) * 100;
          return (
            <a key={s} className="hp-glance-tile" href={`/app/?page=ticker&symbol=${s}`}>
              <span className="hp-glance-name">{n} <span className="muted small">{s}</span></span>
              <strong className="hp-glance-price">{q === undefined ? "…" : q ? fmtPrice(q.c) : "—"}</strong>
              <span className={`hp-glance-move ${changeClass(dp)}`}>{q ? fmtPct(dp) : ""}</span>
              <span className="hs-bar"><i className={dp === null ? "" : dp >= 0 ? "up" : "down"} style={{ width: `${width}%` }} /></span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
