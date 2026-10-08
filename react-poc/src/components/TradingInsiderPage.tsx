// components/TradingInsiderPage.tsx — what members of Congress are buying and selling, from
// their official STOCK Act disclosures (Bargo's free Congress Trades API, via the msv-api
// proxy — see lib/bargo.ts for the source and rate-limit notes). First of the "notable
// figures" tiers researched 2026-10-08 (see msv-org-github's API_RESEARCH.md); tech-leader
// insider trades (SEC Form 4) and 13F institutional holdings are the next two, and need a new
// msv-api proxy route each.
//
// Disclosures lag the real trade by up to ~45 days — this is never "live," and every date
// shown is labelled transaction vs. disclosure so that's clear. Not investment advice.
//
// The per-member view (2026-10-08 rework) is a real overview, not just the same flat trade
// list filtered to one name: a buy/sell balance bar, the tickers that member trades most, and
// how long they typically take to disclose — all computed client-side from the trades Bargo
// already returns for that member, no extra request. The full trade list is still there
// underneath, capped by default (a member with 100+ disclosed trades used to render as a
// single unbroken wall of rows) with a "show all" toggle.

import { useEffect, useMemo, useState } from "react";
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
const MEMBER_TRADES_COLLAPSED = 10;

// The STOCK Act's disclosed-amount brackets run from "$1,001 or less" up to "Over $50,000,000"
// — a trade's real size spans that whole range, so a plain bar needs a log scale to be useful
// (a linear one would make everything under $1M look identically tiny).
const AMOUNT_SCALE = [1_000, 50_000_000] as const;
function sizePct(high: number): number {
  const v = Math.max(AMOUNT_SCALE[0], Math.min(AMOUNT_SCALE[1], high));
  return Math.round(((Math.log10(v) - Math.log10(AMOUNT_SCALE[0])) / (Math.log10(AMOUNT_SCALE[1]) - Math.log10(AMOUNT_SCALE[0]))) * 100);
}

function perfClass(v: number | null): string {
  if (v === null) return "";
  return v >= 0 ? "positive" : "negative";
}

/** Shown whenever a section is displaying a cached response instead of a fresh one — most
 * likely because Bargo's free tier hit its daily limit. Real, previously-fetched data, just
 * not current; says so rather than passing it off as live. */
function CachedNote({ at }: { at: string | null }) {
  if (!at) return null;
  const when = new Date(at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return <p className="trades-cached-note small">Showing the last successful load, from {when} — today's free-tier limit on live updates has been reached. This refreshes on its own once that resets.</p>;
}

export function TradingInsiderPage() {
  const [stats, setStats] = useState<CongressStats | null | undefined>(undefined);
  const [statsCachedAt, setStatsCachedAt] = useState<string | null>(null);
  const [topMembers, setTopMembers] = useState<CongressMemberSummary[] | null | undefined>(undefined);
  const [topMembersCachedAt, setTopMembersCachedAt] = useState<string | null>(null);

  const [chamber, setChamber] = useState<"" | "house" | "senate">("");
  const [type, setType] = useState("");
  const [ticker, setTicker] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [page, setPage] = useState(0);

  const [trades, setTrades] = useState<CongressTrade[] | null | undefined>(undefined);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [tradesCachedAt, setTradesCachedAt] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [memberDetail, setMemberDetail] = useState<CongressMemberDetail | null | undefined>(undefined);
  const [memberDetailCachedAt, setMemberDetailCachedAt] = useState<string | null>(null);
  const [showAllMemberTrades, setShowAllMemberTrades] = useState(false);

  useEffect(() => {
    fetchStats().then(r => { setStats(r.data); setStatsCachedAt(r.cachedAt); }).catch(() => setStats(null));
    fetchMembers(8).then(r => { setTopMembers(r.data.members); setTopMembersCachedAt(r.cachedAt); }).catch(() => setTopMembers(null));
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
      .then(r => { if (live) { setTrades(r.data.trades); setTradesCachedAt(r.cachedAt); } })
      .catch(e => { if (live) { setTradesError(e.message); setTrades(null); } });
    return () => { live = false; };
  }, [chamber, type, ticker, memberQuery, page]);

  useEffect(() => {
    if (!selected) { setMemberDetail(undefined); return; }
    let live = true;
    setMemberDetail(undefined);
    setShowAllMemberTrades(false);
    fetchMember(selected)
      .then(r => { if (live) { setMemberDetail(r.data); setMemberDetailCachedAt(r.cachedAt); } })
      .catch(() => { if (live) setMemberDetail(null); });
    return () => { live = false; };
  }, [selected]);

  // Any filter change jumps back to page 0 — a stale page number from a previous, differently
  // filtered search isn't meaningful once the filter itself has changed.
  const setFilter = (fn: () => void) => { fn(); setPage(0); };
  const filtersOn = chamber !== "" || type !== "" || ticker.trim() !== "" || memberQuery.trim() !== "";
  const clearFilters = () => setFilter(() => { setChamber(""); setType(""); setTicker(""); setMemberQuery(""); });
  // One page-wide notice, not three — the stats, members and trades sections are fetched
  // together on load and go stale together, so repeating the same notice in each section
  // would just be noise. The member-detail panel gets its own (see below): a visitor can
  // open that well after the page loaded, so it's a genuinely separate "as of" time.
  const pageCachedAt = statsCachedAt ?? topMembersCachedAt ?? tradesCachedAt;

  return (
    <section className="trades-page">
      <header className="sectors-header">
        <h2>Trading Insider</h2>
        <span className="muted small">What members of Congress are buying and selling, from their official disclosures</span>
      </header>

      <CachedNote at={pageCachedAt} />

      <div className="card">
        {stats === undefined ? <p className="muted small">Loading…</p> : stats === null ? (
          <p className="muted small">Couldn't load the summary right now.</p>
        ) : (
          <>
            <div className="trades-stats-row">
              <div><strong>{fmtCompact(stats.totals.trades)}</strong><span className="muted small">disclosed trades</span></div>
              <div><strong>{stats.totals.members}</strong><span className="muted small">members tracked</span></div>
              <div><strong>{fmtCompact(stats.totals.tickers)}</strong><span className="muted small">tickers</span></div>
              <div><strong className="positive">{stats.totals.buys}</strong><span className="muted small">buys</span></div>
              <div><strong className="negative">{stats.totals.sells}</strong><span className="muted small">sells</span></div>
            </div>
            <p className="muted small">Latest disclosure: {stats.latest_disclosure} (for a trade made {stats.latest_transaction}). Disclosures can lag the real trade by up to ~45 days under the STOCK Act — these are never same-day.</p>
            {stats.most_traded_90d.length > 0 && (
              <>
                <p className="muted small" style={{ margin: "10px 0 6px" }}>Most traded, last 90 days — click to filter the table below</p>
                <div className="trades-chip-grid">
                  {stats.most_traded_90d.slice(0, 10).map(t => {
                    const buyPct = t.trades ? Math.round((t.buys / t.trades) * 100) : 50;
                    return (
                      <button key={t.ticker} type="button" className={`trades-chip${ticker.toUpperCase() === t.ticker ? " active" : ""}`} onClick={() => setFilter(() => setTicker(t.ticker))}>
                        <span className="trades-chip-top"><strong>{t.ticker}</strong><span className="muted small">{t.trades}</span></span>
                        <span className="trades-balance-bar small"><i className="buys" style={{ width: `${buyPct}%` }} /><i className="sells" style={{ width: `${100 - buyPct}%` }} /></span>
                      </button>
                    );
                  })}
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
            {topMembers.map(m => {
              const buyPct = m.trades ? Math.round((m.buys / m.trades) * 100) : 50;
              return (
                <button key={m.member_slug} type="button" className={`trades-member-chip${selected === m.member_slug ? " active" : ""}`} onClick={() => setSelected(m.member_slug)}>
                  <strong>{m.member}</strong>
                  <span className="muted small">{m.chamber === "house" ? "House" : "Senate"} · {m.state} · {m.trades} trades</span>
                  <span className="trades-balance-bar small"><i className="buys" style={{ width: `${buyPct}%` }} /><i className="sells" style={{ width: `${100 - buyPct}%` }} /></span>
                  <span className="trades-chip-legend muted small"><span className="positive">{m.buys} buys</span> / <span className="negative">{m.sells} sells</span></span>
                </button>
              );
            })}
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
              <CachedNote at={memberDetailCachedAt} />
              <p className="muted small">{memberDetail.chamber === "house" ? "House" : "Senate"} · {memberDetail.state}</p>
              <MemberOverview detail={memberDetail} />
              <MemberTradeList detail={memberDetail} showAll={showAllMemberTrades} onShowAll={() => setShowAllMemberTrades(true)} />
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

/** A real overview of one member, not just their trades filtered down: how their disclosed
 * buys and sells balance out, the tickers they trade most, and how long they typically take
 * to disclose a trade — every number here is computed from the trades already fetched for
 * this member, not a separate request. */
function MemberOverview({ detail }: { detail: CongressMemberDetail }) {
  const trades = detail.trades ?? [];

  const topTickers = useMemo(() => {
    const map = new Map<string, { ticker: string; count: number; buys: number; sells: number }>();
    for (const t of trades) {
      const cur = map.get(t.ticker) ?? { ticker: t.ticker, count: 0, buys: 0, sells: 0 };
      cur.count++;
      if (t.type === "purchase") cur.buys++; else if (t.type === "sale") cur.sells++;
      map.set(t.ticker, cur);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [trades]);
  const maxTickerCount = topTickers[0]?.count ?? 1;

  const avgDisclosureDays = useMemo(() => {
    const diffs = trades
      .map(t => (new Date(t.disclosure_date).getTime() - new Date(t.transaction_date).getTime()) / 86_400_000)
      .filter(d => Number.isFinite(d) && d >= 0);
    return diffs.length ? diffs.reduce((s, d) => s + d, 0) / diffs.length : null;
  }, [trades]);

  const total = detail.stats.buys + detail.stats.sells;
  const buyPct = total ? Math.round((detail.stats.buys / total) * 100) : 50;

  return (
    <div className="trades-overview">
      <div className="trades-overview-col">
        <span className="muted small">Buys vs. sells</span>
        <div className="trades-balance-bar"><i className="buys" style={{ width: `${buyPct}%` }} /><i className="sells" style={{ width: `${100 - buyPct}%` }} /></div>
        <span className="small"><span className="positive">{detail.stats.buys} buys</span> · <span className="negative">{detail.stats.sells} sells</span></span>
      </div>
      <div className="trades-overview-col">
        <span className="muted small">Average time to disclose</span>
        <strong>{avgDisclosureDays === null ? "—" : `${Math.round(avgDisclosureDays)} days`}</strong>
        <span className="muted small">STOCK Act allows up to ~45</span>
      </div>
      <div className="trades-overview-col">
        <span className="muted small">Average gain on buys, since trade</span>
        <strong className={perfClass(detail.stats.avg_buy_perf_pct)}>{detail.stats.avg_buy_perf_pct === null ? "—" : fmtPct(detail.stats.avg_buy_perf_pct)}</strong>
      </div>
      {topTickers.length > 0 && (
        <div className="trades-overview-col trades-overview-tickers">
          <span className="muted small">Most-traded tickers</span>
          {topTickers.map(t => (
            <div key={t.ticker} className="trades-ticker-row">
              <a href={`/app/?page=ticker&symbol=${encodeURIComponent(t.ticker)}`} className="trades-ticker-name"><strong>{t.ticker}</strong></a>
              <div className="trades-ticker-bar"><i style={{ width: `${Math.round((t.count / maxTickerCount) * 100)}%` }} /></div>
              <span className="muted small">{t.count}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberTradeList({ detail, showAll, onShowAll }: { detail: CongressMemberDetail; showAll: boolean; onShowAll: () => void }) {
  const trades = detail.trades ?? [];
  const shown = showAll ? trades : trades.slice(0, MEMBER_TRADES_COLLAPSED);
  return (
    <>
      <h4 className="trades-subhead">Trade history ({trades.length})</h4>
      <TradesTable trades={shown} hideMember />
      {!showAll && trades.length > MEMBER_TRADES_COLLAPSED && (
        <button type="button" className="cp-btn cp-btn-ghost trades-show-all" onClick={onShowAll}>Show all {trades.length} trades</button>
      )}
    </>
  );
}

function TradesTable({ trades, onSelectMember, hideMember }: { trades: CongressTrade[]; onSelectMember?: (slug: string) => void; hideMember?: boolean }) {
  return (
    <div className="crypto-table-scroll">
      <table className="crypto-table quotes-table">
        <thead>
          <tr>
            {!hideMember && <th>Member</th>}
            <th>Chamber</th><th>Ticker</th><th>Type</th><th>Amount</th>
            <th>Traded</th><th>Disclosed</th><th className="num">Since trade</th><th>Source</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={`${t.member_slug}-${t.ticker}-${t.transaction_date}-${i}`} className="crypto-table-row">
              {!hideMember && (
                <td>
                  {onSelectMember ? <button type="button" className="trades-member-link" onClick={() => onSelectMember(t.member_slug)}><strong>{t.member}</strong></button> : <strong>{t.member}</strong>}
                </td>
              )}
              <td className="muted small">{t.chamber === "house" ? "House" : "Senate"} · {t.state}</td>
              <td><a href={`/app/?page=ticker&symbol=${encodeURIComponent(t.ticker)}`}><strong>{t.ticker}</strong></a></td>
              <td>
                <span className={t.type === "purchase" ? "positive" : t.type === "sale" ? "negative" : ""}>{t.type}</span>
                {t.outcome && <span className="trades-outcome-badge" title="Outcome, as reported by the source">{t.outcome.replace(/_/g, " ")}</span>}
              </td>
              <td className="muted small">
                {t.amount_range}
                <span className="trades-size-bar" title={`Disclosed range: ${t.amount_range}`}><i style={{ width: `${sizePct(t.amount_high)}%` }} /></span>
              </td>
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
