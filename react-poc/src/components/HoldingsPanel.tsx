// components/HoldingsPanel.tsx — Tier 3 of Trading Insider: tracked institutional managers'
// latest 13F holdings (see lib/sec13F.ts for the source, the Ackman-entity gotcha, and the
// whole-dollars-not-thousands note). Lives as a third tab alongside Congress (Tier 1) and
// Company Insiders (Tier 2) in TradingInsiderPage.tsx.
//
// A 13F is a point-in-time snapshot as of a quarter-end date, not a feed of individual trades —
// so unlike the other two tiers there's no "transaction type" or "amount traded" here, just a
// position size and (for the manager's own detail view) what share of their reported US equity
// portfolio it represents.

import { useEffect, useMemo, useState } from "react";
import { TRACKED_MANAGERS, fetchAllLatestHoldings, type ManagerHoldings, type Holding } from "../lib/sec13F";
import { fmtCompact } from "../lib/format";

const TOP_HOLDINGS_COLLAPSED = 10;

function fmtShares(n: number | null): string {
  return n === null ? "—" : n.toLocaleString();
}

export function HoldingsPanel() {
  const [all, setAll] = useState<(ManagerHoldings | null)[] | undefined>(undefined);
  const [selectedCik, setSelectedCik] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAllLatestHoldings().then(setAll).catch(() => setAll(TRACKED_MANAGERS.map(() => null)));
  }, []);

  useEffect(() => { setShowAll(false); }, [selectedCik]);

  const selected = all?.find(m => m?.manager.cik === selectedCik) ?? null;

  return (
    <div className="trades-insiders">
      <p className="muted small" style={{ margin: "0 0 14px" }}>
        What these tracked managers hold, from their official quarterly SEC 13F filings — a snapshot of their US
        equity positions as of the filing's reporting date, not a feed of individual trades. Filed up to 45 days
        after each quarter closes, so this is always at least somewhat behind the manager's real current book.
      </p>

      <div className="card">
        <h3 style={{ margin: "0 0 10px" }}>Tracked</h3>
        {all === undefined ? <p className="muted small">Loading…</p> : (
          <div className="trades-member-row">
            {TRACKED_MANAGERS.map(m => {
              const h = all.find(x => x?.manager.cik === m.cik) ?? null;
              return (
                <button
                  key={m.cik}
                  type="button"
                  className={`trades-member-chip${selectedCik === m.cik ? " active" : ""}`}
                  onClick={() => setSelectedCik(m.cik)}
                  disabled={!h}
                >
                  <strong>{m.name}</strong>
                  <span className="muted small">{m.fundName}</span>
                  <span className="muted small">
                    {h ? `${h.holdings.length} positions · as of ${h.periodOfReport}` : "No recent 13F-HR found"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="card">
          <div className="trades-detail-head">
            <h3 style={{ margin: 0 }}>{selected.manager.name} — {selected.manager.fundName}</h3>
            <button type="button" className="cp-btn cp-btn-ghost" onClick={() => setSelectedCik(null)}>Close</button>
          </div>
          <p className="muted small">
            As of {selected.periodOfReport} (filed {selected.filingDate}) · {selected.holdings.length} positions ·
            reported value {fmtCompact(selected.totalValueUsd, "$")}
          </p>
          <ManagerHoldingsTable holdings={showAll ? selected.holdings : selected.holdings.slice(0, TOP_HOLDINGS_COLLAPSED)} totalValueUsd={selected.totalValueUsd} />
          {!showAll && selected.holdings.length > TOP_HOLDINGS_COLLAPSED && (
            <button type="button" className="cp-btn cp-btn-ghost trades-show-all" onClick={() => setShowAll(true)}>Show all {selected.holdings.length} positions</button>
          )}
        </div>
      )}

      <p className="muted small">
        Source: SEC EDGAR, Form 13F (Information Required of Institutional Investment Managers). Only covers US
        equity positions a manager is required to report — not short positions, non-US holdings, cash, or (for a
        fund that also runs other strategies) their whole business. CUSIP-to-ticker mapping via OpenFIGI; a
        position with no "—" ticker means OpenFIGI had no match (e.g. a bond, an unlisted security, or a very
        recently changed listing). Not investment advice.
      </p>
    </div>
  );
}

function ManagerHoldingsTable({ holdings, totalValueUsd }: { holdings: Holding[]; totalValueUsd: number }) {
  const maxValue = useMemo(() => holdings.reduce((m, h) => Math.max(m, h.valueUsd), 1), [holdings]);
  return (
    <div className="crypto-table-scroll">
      <table className="crypto-table quotes-table">
        <thead>
          <tr>
            <th>Company</th><th>Class</th><th className="num">Shares</th><th className="num">Value</th>
            <th className="num">% of portfolio</th><th>Size</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr key={`${h.cusip}-${i}`} className="crypto-table-row">
              <td>
                {h.ticker ? (
                  <a href={`/app/?page=ticker&symbol=${encodeURIComponent(h.ticker)}`}><strong>{h.ticker}</strong></a>
                ) : <strong className="muted">—</strong>}{" "}
                <span className="muted small">{h.nameOfIssuer}</span>
                {h.putCall && <span className="trades-outcome-badge" title="An options position, not a plain equity holding">{h.putCall.toUpperCase()}</span>}
              </td>
              <td className="muted small">{h.titleOfClass}</td>
              <td className="num">{fmtShares(h.shares)}</td>
              <td className="num">{fmtCompact(h.valueUsd, "$")}</td>
              <td className="num muted small">{totalValueUsd ? `${((h.valueUsd / totalValueUsd) * 100).toFixed(1)}%` : "—"}</td>
              <td><span className="trades-size-bar"><i style={{ width: `${Math.round((h.valueUsd / maxValue) * 100)}%` }} /></span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
