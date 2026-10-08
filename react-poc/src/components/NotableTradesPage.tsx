// components/NotableTradesPage.tsx — what members of Congress are buying and selling, from
// their official STOCK Act disclosures (Bargo's free Congress Trades API — see lib/bargo.ts
// for the source and rate-limit notes). First of the "notable figures" tiers researched
// 2026-10-08 (see msv-org-github's API_RESEARCH.md); tech-leader insider trades (SEC Form 4)
// and 13F institutional holdings are the next two, and need a new msv-api proxy route each.
//
// Disclosures lag the real trade by up to ~45 days — this is never "live," and every date
// shown is labelled transaction vs. disclosure so that's clear. Not investment advice.

import { useEffect, useState } from "react";
import {
  fetchTrades, fetchMembers, fetchMember, fetchStats,
  type CongressTrade, type CongressMemberSummary, type CongressMemberDetail, type CongressStats,
} from "../lib/bargo";
import { fmtPct, fmtCompact } from "../lib/format";

const CHAMBERS: { id: "" | "house" | "senate"; label: string }[] = [
  { id: "", label: "All" }, { id: "house", label: "House" }, { id: "senate", label: "Senate" },
];
const TYPES: { id: string; label: string }[] = [
  { id: "", label: "All" }, { id: "purchase", label: "Buys" }, { id: "sale", label: "Sales" },
];
const LIMIT = 25;

function perfClass(v: number | null): string {
  if (v === null) return "";
  return v >= 0 ? "positive" : "negative";
}

export function NotableTradesPage() {
  const [stats, setStats] = useState<CongressStats | null | undefined>(undefined);
  const [topMembers, setTopMembers] = useState<CongressMemberSummary[] | null | undefined>(undefined);

  const [chamber, setChamber] = useState<"" | "house" | "senate">("");
  const [type, setType] = useState("");
  const [ticker, setTicker] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [page, setPage] = useState(0);

  const [trades, setTrades] = useState<CongressTrade[] | null | undefined>(undefined);
  const [tradesError, setTradesError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [memberDetail, setMemberDetail] = useState<CongressMemberDetail | null | undefined>(undefined);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null));
    fetchMembers(8).then(d => setTopMembers(d.members)).catch(() => setTopMembers(null));
  }, []);

  useEffect(() => {
    let live = true;
    setTrades(undefined); setTradesError(null);
    fetchTrades({
      limit: LIMIT, page,
      chamber: chamber || undefined,
      type: type || undefined,
      ticker: ticker.trim() ? ticker.trim().toUpperCase() : undefined,
      member: memberQuery.trim() || undefined,
    })
      .then(d => { if (live) setTrades(d.trades); })
      .catch(e => { if (live) { setTradesError(e.message); setTrades(null); } });
    return () => { live = false; };
  }, [chamber, type, ticker, memberQuery, page]);

  useEffect(() => {
    if (!selected) { setMemberDetail(undefined); return; }
    let live = true;
    setMemberDetail(undefined);
    fetchMember(selected).then(d => { if (live) setMemberDetail(d); }).catch(() => { if (live) setMemberDetail(null); });
    return () => { live = false; };
  }, [selected]);

  // Any filter change jumps back to page 0 — a stale page number from a previous, differently
  // filtered search isn't meaningful once the filter itself has changed.
  const setFilter = (fn: () => void) => { fn(); setPage(0); };
  const filtersOn = chamber !== "" || type !== "" || ticker.trim() !== "" || memberQuery.trim() !== "";
  const clearFilters = () => setFilter(() => { setChamber(""); setType(""); setTicker(""); setMemberQuery(""); });

  return (
    <section className="trades-page">
      <header className="sectors-header">
        <h2>Notable Trades</h2>
        <span className="muted small">What members of Congress are buying and selling, from their official disclosures</span>
      </header>

      <div className="card">
        {stats === undefined ? <p className="muted small">Loading…</p> : stats === null ? (
          <p className="muted small">Couldn't load the summary right now.</p>
        ) : (
          <>
            <div className="trades-stats-row">
              <div><strong>{fmtCompact(stats.totals.trades)}</strong><span className="muted small">disclosed trades</span></div>
              <div><strong>{stats.totals.members}</strong><span className="muted small">members tracked</span></div>
              <div><strong>{fmtCompact(stats.totals.tickers)}</strong><span className="muted small">tickers</span></div>
              <div><strong>{stats.totals.buys}</strong><span className="muted small">buys</span></div>
              <div><strong>{stats.totals.sells}</strong><span className="muted small">sells</span></div>
            </div>
            <p className="muted small">Latest disclosure: {stats.latest_disclosure} (for a trade made {stats.latest_transaction}). Disclosures can lag the real trade by up to ~45 days under the STOCK Act — these are never same-day.</p>
            {stats.most_traded_90d.length > 0 && (
              <>
                <p className="muted small" style={{ margin: "10px 0 6px" }}>Most traded, last 90 days — click to filter the table below</p>
                <div className="hp-chips">
                  {stats.most_traded_90d.slice(0, 10).map(t => (
                    <button key={t.ticker} type="button" className={ticker.toUpperCase() === t.ticker ? "active" : ""} onClick={() => setFilter(() => setTicker(t.ticker))}>
                      {t.ticker} <span className="muted small">({t.trades})</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {topMembers && topMembers.length > 0 && (
        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Most active members</h3>
          <div className="trades-member-row">
            {topMembers.map(m => (
              <button key={m.member_slug} type="button" className="trades-member-chip" onClick={() => setSelected(m.member_slug)}>
                <strong>{m.member}</strong>
                <span className="muted small">{m.chamber === "house" ? "House" : "Senate"} · {m.state}</span>
                <span className="muted small">{m.trades} trades · {m.buys} buys / {m.sells} sells</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="card">
          <div className="trades-detail-head">
            <h3 style={{ margin: 0 }}>{memberDetail?.member ?? selected.replace(/-/g, " ")}</h3>
            <button type="button" className="cp-btn cp-btn-ghost" onClick={() => setSelected(null)}>Close</button>
          </div>
          {memberDetail === undefined ? <p className="muted small">Loading…</p> : !memberDetail?.stats ? (
            <p className="muted small">Couldn't load this member's trades right now.</p>
          ) : (
            <>
              <p className="muted small">
                {memberDetail.chamber === "house" ? "House" : "Senate"} · {memberDetail.state} · {memberDetail.stats.trades} disclosed trades
                ({memberDetail.stats.buys} buys, {memberDetail.stats.sells} sells)
                {memberDetail.stats.avg_buy_perf_pct !== null && <> · average gain on buys since trade: <span className={perfClass(memberDetail.stats.avg_buy_perf_pct)}>{fmtPct(memberDetail.stats.avg_buy_perf_pct)}</span></>}
              </p>
              <TradesTable trades={memberDetail.trades ?? []} />
            </>
          )}
        </div>
      )}

      <div className="card">
        <div className="trades-filter-row">
          <div className="sectors-view-toggle" role="group" aria-label="Chamber">
            {CHAMBERS.map(c => <button key={c.id} type="button" className={chamber === c.id ? "active" : ""} onClick={() => setFilter(() => setChamber(c.id))}>{c.label}</button>)}
          </div>
          <div className="sectors-view-toggle" role="group" aria-label="Trade type">
            {TYPES.map(t => <button key={t.id} type="button" className={type === t.id ? "active" : ""} onClick={() => setFilter(() => setType(t.id))}>{t.label}</button>)}
          </div>
          <input type="search" className="news-search" placeholder="Ticker, e.g. NVDA" value={ticker} onChange={e => setFilter(() => setTicker(e.target.value))} aria-label="Filter by ticker" />
          <input type="search" className="news-search" placeholder="Member name" value={memberQuery} onChange={e => setFilter(() => setMemberQuery(e.target.value))} aria-label="Filter by member name" />
          {filtersOn && <button type="button" className="cp-btn cp-btn-ghost" onClick={clearFilters}>Clear filters</button>}
        </div>

        {trades === undefined && <p className="muted small">Loading trades…</p>}
        {tradesError && <p className="muted small">Couldn't load trades right now ({tradesError}). Try again shortly.</p>}
        {trades && trades.length === 0 && <p className="muted small">No disclosed trades match this filter.</p>}
        {trades && trades.length > 0 && <TradesTable trades={trades} onSelectMember={setSelected} />}

        <div className="trades-pager">
          <button type="button" className="cp-btn cp-btn-ghost" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Previous</button>
          <span className="muted small">Page {page + 1}</span>
          <button type="button" className="cp-btn cp-btn-ghost" disabled={!trades || trades.length < LIMIT} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      <p className="muted small">
        Source: official House Clerk and Senate disclosure filings under the STOCK Act, via Bargo's free Congress Trades API.
        "Performance since trade" compares the disclosed trade price to a recent price — it isn't the member's actual realised
        return, since the real purchase/sale price and whether they still hold the position aren't always disclosed. Not
        investment advice.
      </p>
    </section>
  );
}

function TradesTable({ trades, onSelectMember }: { trades: CongressTrade[]; onSelectMember?: (slug: string) => void }) {
  return (
    <div className="crypto-table-scroll">
      <table className="crypto-table quotes-table">
        <thead>
          <tr>
            <th>Member</th><th>Chamber</th><th>Ticker</th><th>Type</th><th>Amount</th>
            <th>Traded</th><th>Disclosed</th><th className="num">Since trade</th><th>Source</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={`${t.member_slug}-${t.ticker}-${t.transaction_date}-${i}`} className="crypto-table-row">
              <td>
                {onSelectMember ? <button type="button" className="trades-member-link" onClick={() => onSelectMember(t.member_slug)}><strong>{t.member}</strong></button> : <strong>{t.member}</strong>}
              </td>
              <td className="muted small">{t.chamber === "house" ? "House" : "Senate"} · {t.state}</td>
              <td><a href={`/app/?page=ticker&symbol=${encodeURIComponent(t.ticker)}`}><strong>{t.ticker}</strong></a></td>
              <td><span className={t.type === "purchase" ? "positive" : t.type === "sale" ? "negative" : ""}>{t.type}</span></td>
              <td className="muted small">{t.amount_range}</td>
              <td className="muted small">{t.transaction_date}</td>
              <td className="muted small">{t.disclosure_date}</td>
              <td className={`num ${perfClass(t.perf_pct)}`}>{t.perf_pct === null ? "—" : fmtPct(t.perf_pct)}</td>
              <td><a href={t.filing_portal} target="_blank" rel="noopener noreferrer" className="small">Filing ↗</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
