// components/InsiderTradesPanel.tsx — Tier 2 of Trading Insider: what tracked tech/business
// leaders do with their OWN company's stock, from their official SEC Form 4 filings (see
// lib/secForm4.ts for the source, the two-SEC-host setup, and the raw-XML path quirk). Lives as
// a tab alongside Tier 1 (congressional trading, TradingInsiderPage.tsx's own content) rather
// than a separate page, since both answer the same "what are notable figures doing" question.
//
// Unlike Congress's STOCK Act disclosures (filed up to ~45 days after the trade), Form 4 is
// filed within 2 business days — much closer to real time. But not every transaction here is a
// discretionary trade: grants, option exercises and tax-withholding sales are routine
// compensation mechanics, not a bet on the stock, so every row keeps its real SEC transaction
// code label rather than collapsing everything into a generic "buy"/"sell".

import { useEffect, useMemo, useState } from "react";
import {
  TRACKED_INSIDERS, fetchAllRecentInsiderTransactions, fetchInsiderTransactions,
  type InsiderTransaction, type TrackedInsider,
} from "../lib/secForm4";
import { fmtCompact } from "../lib/format";

const FEED_LIMIT_PER_PERSON = 5;   // filings fetched per person for the default merged feed
const DETAIL_LIMIT = 20;           // filings fetched when a person's own panel is opened
const FEED_PAGE_SIZE = 20;
const DETAIL_COLLAPSED = 10;

function fmtShares(n: number | null): string {
  return n === null ? "—" : n.toLocaleString();
}
// Named fmtSharePrice, not fmtPrice, to avoid shadowing lib/format.ts's own fmtPrice (which
// applies different sub-$1 precision — not needed here, Form 4 prices are whole-dollar trade
// prices, not the sub-cent crypto/forex values that export is really for).
function fmtSharePrice(n: number | null): string {
  return n === null ? "—" : `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function fmtValue(shares: number | null, price: number | null): string {
  if (shares === null || price === null) return "—";
  return fmtCompact(shares * price, "$");
}
// Only real cash buys/sells get a color — grants, option exercises, tax withholding, gifts etc.
// aren't a directional bet on the stock, so coloring them green/red would misread as one.
function typeClass(code: string): string {
  if (code === "P") return "positive";
  if (code === "S") return "negative";
  return "";
}

export function InsiderTradesPanel() {
  const [feed, setFeed] = useState<InsiderTransaction[] | null | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<TrackedInsider | null>(null);
  const [detail, setDetail] = useState<InsiderTransaction[] | null | undefined>(undefined);
  const [showAllDetail, setShowAllDetail] = useState(false);

  useEffect(() => {
    fetchAllRecentInsiderTransactions(FEED_LIMIT_PER_PERSON).then(setFeed).catch(() => setFeed(null));
  }, []);

  useEffect(() => {
    if (!selected) { setDetail(undefined); return; }
    let live = true;
    setDetail(undefined);
    setShowAllDetail(false);
    fetchInsiderTransactions(selected, DETAIL_LIMIT)
      .then(r => { if (live) setDetail(r); })
      .catch(() => { if (live) setDetail(null); });
    return () => { live = false; };
  }, [selected]);

  // Per-person summary, computed from the feed already fetched — zero extra requests, same
  // "overview, not just a flat list" shape as the Congress tab's member chips.
  const summaries = useMemo(() => {
    const map = new Map<string, { insider: TrackedInsider; buys: number; sells: number; last: string }>();
    for (const p of TRACKED_INSIDERS) map.set(p.cik, { insider: p, buys: 0, sells: 0, last: "" });
    for (const t of feed ?? []) {
      const s = map.get(t.insiderCik);
      if (!s) continue;
      if (t.code === "P") s.buys++;
      if (t.code === "S") s.sells++;
      if (!s.last || t.filingDate > s.last) s.last = t.filingDate;
    }
    return [...map.values()];
  }, [feed]);

  const paged = (feed ?? []).slice(page * FEED_PAGE_SIZE, (page + 1) * FEED_PAGE_SIZE);
  const issuersInDetail = useMemo(() => new Set((detail ?? []).map(d => d.issuerName)), [detail]);

  return (
    <div className="trades-insiders">
      <p className="muted small" style={{ margin: "0 0 14px" }}>
        What these tracked leaders do with their OWN company's stock, from their official SEC Form 4 filings —
        not everything they personally invest in, only companies where they're an officer, director, or 10%+
        owner. Filed within 2 business days of the trade, much faster than Congress's ~45-day STOCK Act window.
      </p>

      <div className="card">
        <h3 style={{ margin: "0 0 10px" }}>Tracked</h3>
        {feed === undefined ? <p className="muted small">Loading…</p> : (
          <div className="trades-member-row">
            {summaries.map(s => {
              const total = s.buys + s.sells;
              const buyPct = total ? Math.round((s.buys / total) * 100) : 50;
              return (
                <button
                  key={s.insider.cik}
                  type="button"
                  className={`trades-member-chip${selected?.cik === s.insider.cik ? " active" : ""}`}
                  onClick={() => setSelected(s.insider)}
                >
                  <strong>{s.insider.name}</strong>
                  <span className="muted small">{s.last ? `Last filed ${s.last}` : "No recent Form 4"}</span>
                  {total > 0 && (
                    <span className="trades-balance-bar small"><i className="buys" style={{ width: `${buyPct}%` }} /><i className="sells" style={{ width: `${100 - buyPct}%` }} /></span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="card">
          <div className="trades-detail-head">
            <h3 style={{ margin: 0 }}>{selected.name}</h3>
            <button type="button" className="cp-btn cp-btn-ghost" onClick={() => setSelected(null)}>Close</button>
          </div>
          {detail === undefined ? <p className="muted small">Loading…</p> : detail === null ? (
            <p className="muted small">Couldn't load this person's filings right now.</p>
          ) : detail.length === 0 ? (
            <p className="muted small">No recent Form 4 transactions found.</p>
          ) : (
            <>
              <p className="muted small">
                {detail[0].officerTitle || (detail[0].isDirector ? "Director" : "Reporting owner")} at {detail[0].issuerName} ({detail[0].ticker})
                {issuersInDetail.size > 1 && ` and ${issuersInDetail.size - 1} other compan${issuersInDetail.size - 1 === 1 ? "y" : "ies"} — see table`}
              </p>
              <InsiderTable rows={showAllDetail ? detail : detail.slice(0, DETAIL_COLLAPSED)} hideInsider />
              {!showAllDetail && detail.length > DETAIL_COLLAPSED && (
                <button type="button" className="cp-btn cp-btn-ghost trades-show-all" onClick={() => setShowAllDetail(true)}>Show all {detail.length} transactions</button>
              )}
            </>
          )}
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: "0 0 10px" }}>Recent activity across everyone tracked</h3>
        {feed === undefined && <p className="muted small">Loading SEC filings…</p>}
        {feed === null && <p className="muted small">Couldn't load SEC filings right now. Try again shortly.</p>}
        {feed && feed.length === 0 && <p className="muted small">No recent transactions found.</p>}
        {feed && feed.length > 0 && <InsiderTable rows={paged} onSelectInsider={setSelected} />}
        {feed && feed.length > FEED_PAGE_SIZE && (
          <div className="trades-pager">
            <button type="button" className="cp-btn cp-btn-ghost" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Previous</button>
            <span className="muted small">Page {page + 1}</span>
            <button type="button" className="cp-btn cp-btn-ghost" disabled={(page + 1) * FEED_PAGE_SIZE >= feed.length} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      <p className="muted small">
        Source: SEC EDGAR, Form 4 (Statement of Changes in Beneficial Ownership). "Open-market buy/sale" are
        real cash transactions; "Grant/award," "Option exercise," and "Tax withholding" are routine compensation
        mechanics, not a bet on the stock — shown with their real SEC code so you can tell them apart. Not
        investment advice.
      </p>
    </div>
  );
}

function InsiderTable({ rows, onSelectInsider, hideInsider }: { rows: InsiderTransaction[]; onSelectInsider?: (i: TrackedInsider) => void; hideInsider?: boolean }) {
  return (
    <div className="crypto-table-scroll">
      <table className="crypto-table quotes-table">
        <thead>
          <tr>
            {!hideInsider && <th>Insider</th>}
            <th>Company</th><th>Type</th><th className="num">Shares</th><th className="num">Price</th>
            <th className="num">Value</th><th className="num">Owned after</th><th>Filed</th><th>Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={`${t.insiderCik}-${t.filingDate}-${t.code}-${i}`} className="crypto-table-row">
              {!hideInsider && (
                <td>
                  <button
                    type="button"
                    className="trades-member-link"
                    onClick={() => onSelectInsider?.(TRACKED_INSIDERS.find(p => p.cik === t.insiderCik) ?? { name: t.insiderName, cik: t.insiderCik })}
                  >
                    <strong>{t.insiderName}</strong>
                  </button>
                </td>
              )}
              <td>
                <a href={`/app/?page=ticker&symbol=${encodeURIComponent(t.ticker)}`}><strong>{t.ticker}</strong></a>{" "}
                <span className="muted small">{t.issuerName}</span>
              </td>
              <td>
                <span className={typeClass(t.code)}>{t.codeLabel}</span>
                {t.isDerivative && <span className="trades-outcome-badge" title="A derivative security (option/RSU-type), not plain common stock">DERIV</span>}
              </td>
              <td className="num">{fmtShares(t.shares)}</td>
              <td className="num">{fmtSharePrice(t.pricePerShare)}</td>
              <td className="num">{fmtValue(t.shares, t.pricePerShare)}</td>
              <td className="num muted small">{fmtShares(t.sharesOwnedAfter)}</td>
              <td className="muted small">{t.filingDate}</td>
              <td><a href={t.filingUrl} target="_blank" rel="noopener noreferrer" className="small">Filing ↗</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
