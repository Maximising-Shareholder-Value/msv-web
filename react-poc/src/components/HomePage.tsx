// components/HomePage.tsx — the homepage, React, first slice. Ports the core of
// home.js: the browse tabs (each category as a live table), the Winners /
// Losers / Most Active rankings, the market-news column and the daily "Did you
// know" tip.
//
// NOT YET PORTED (still on the vanilla homepage): the watchlist and recently viewed, the explore
// page, the how-to walkthrough, and the sidebar/router shell.

import { useEffect, useMemo, useState } from "react";
import { BROWSE_CATEGORIES, RANKING_STOCK_SYMBOLS } from "../data/home";
import { LEARN_CATEGORIES } from "../data/learn";
import { getNews, type Quote } from "../lib/finnhub";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";
import type { NewsItem } from "../lib/types";
import { IndexStrip, SectorHeatmap, ForexStrip, EconCalendar } from "./HomeWidgets";
import { MarketBreadth, EarningsCalendar, CryptoTable } from "./HomeMore";

const RANKING_TABS = [
  { id: "winners", title: "Winners" },
  { id: "losers", title: "Losers" },
  { id: "active", title: "Most Active" },
];

interface Row { symbol: string; name: string; quote: Quote }

const timeAgo = (unixSeconds: number) => {
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

export function HomePage() {
  const [tab, setTab] = useState("trending-tech");
  const isRanking = RANKING_TABS.some(t => t.id === tab);
  const category = BROWSE_CATEGORIES.find(c => c.id === tab);

  // The symbols behind the current tab: a browse category, or the ranking pool.
  const pool: [string, string][] = isRanking ? RANKING_STOCK_SYMBOLS : (category?.items ?? []);
  const quotes = useQuotes(pool.map(([s]) => s));
  const names = useMemo(() => Object.fromEntries(pool), [pool]);

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = pool
      .map(([symbol]) => ({ symbol, name: names[symbol], quote: quotes[symbol] as Quote | null | undefined }))
      .filter((r): r is Row => !!r.quote);
    if (tab === "winners") return all.filter(r => (r.quote.dp ?? 0) > 0).sort((a, b) => (b.quote.dp ?? 0) - (a.quote.dp ?? 0)).slice(0, 12);
    if (tab === "losers") return all.filter(r => (r.quote.dp ?? 0) < 0).sort((a, b) => (a.quote.dp ?? 0) - (b.quote.dp ?? 0)).slice(0, 12);
    if (tab === "active") return [...all].sort((a, b) => Math.abs(b.quote.dp ?? 0) - Math.abs(a.quote.dp ?? 0)).slice(0, 12);
    return all;
  }, [pool, quotes, names, tab]);

  const loadedCount = pool.filter(([s]) => quotes[s]).length;

  return (
    <section className="home-page">
      <header className="sectors-header">
        <h2>Markets</h2>
        <span className="muted small">Live prices by category · rankings use today's move</span>
      </header>

      <IndexStrip />
      <MarketBreadth />

      <div className="home-tabs" role="tablist">
        {RANKING_TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>{t.title}</button>
        ))}
        <button type="button" role="tab" aria-selected={tab === "crypto"} className={tab === "crypto" ? "active" : ""} onClick={() => setTab("crypto")}>Crypto</button>
        {BROWSE_CATEGORIES.map(c => (
          <button key={c.id} type="button" role="tab" aria-selected={tab === c.id} className={tab === c.id ? "active" : ""} onClick={() => setTab(c.id)}>{c.title}</button>
        ))}
      </div>

      <div className="home-layout">
        <div className="home-main">
          {tab === "crypto" && <CryptoTable />}
          {tab !== "crypto" && <>
          {tab === "active" && <p className="muted small">Ranked by size of today's price move. Real trading volume isn't available on the free data tier.</p>}
          {!rows.length && <p className="muted small">{loadedCount < pool.length ? `Loading live prices… ${loadedCount} of ${pool.length}` : "No data right now. The free data tier may be rate-limited; try another tab in a moment."}</p>}
          {rows.length > 0 && (
            <div className="crypto-table-scroll">
              <table className="crypto-table quotes-table">
                <thead><tr><th>Symbol</th><th>Price</th><th>Chg $</th><th>Chg %</th><th>Day range</th></tr></thead>
                <tbody>
                  {rows.map(r => {
                    const q = r.quote;
                    const pos = q.h !== q.l ? Math.max(0, Math.min(1, (q.c - q.l) / (q.h - q.l))) : 0.5;
                    return (
                      <tr key={r.symbol}>
                        <td><a href={`/?ticker=${encodeURIComponent(r.symbol)}`}><strong>{r.symbol}</strong></a> <span className="muted small">{r.name}</span></td>
                        <td>{fmtPrice(q.c)}</td>
                        <td className={changeClass(q.d)}>{q.d === null ? "—" : `${q.d >= 0 ? "+" : ""}${q.d.toFixed(2)}`}</td>
                        <td className={changeClass(q.dp)}>{fmtPct(q.dp)}</td>
                        <td><span className="day-range"><i style={{ left: `${(pos * 100).toFixed(0)}%` }} /></span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </>}
        </div>

        <aside className="home-side">
          <div className="home-card"><h4>Earnings this week</h4><EarningsCalendar /></div>
          <div className="home-card"><h4>Economic calendar</h4><EconCalendar /></div>
          <div className="home-card"><h4>Sectors today</h4><SectorHeatmap /></div>
          <div className="home-card"><h4>Currencies</h4><ForexStrip /></div>
          <TopNews />
          <DidYouKnow />
        </aside>
      </div>
    </section>
  );
}

function TopNews() {
  const [items, setItems] = useState<NewsItem[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    getNews("general").then(n => { if (live) setItems(n); });
    return () => { live = false; };
  }, []);
  return (
    <div className="home-news">
      <h4>Market news</h4>
      {items === undefined && <p className="muted small">Loading…</p>}
      {items === null && <p className="muted small">Couldn't load market news right now.</p>}
      {items && items.slice(0, 14).map((n, i) => (
        <a key={`${n.url}-${i}`} className="home-news-row" href={n.url} target="_blank" rel="noopener noreferrer">
          <strong>{n.headline}</strong>
          <span className="muted small">{n.source} · {timeAgo(n.datetime)}</span>
        </a>
      ))}
    </div>
  );
}

function DidYouKnow() {
  // The same topic all day, a new one tomorrow (seeded by the date, as in learn.js).
  const all = LEARN_CATEGORIES.flatMap(cat => cat.topics.map(topic => ({ cat, topic })));
  if (!all.length) return null;
  const dayNum = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
  const { cat, topic } = all[dayNum % all.length];
  return (
    <div className="home-dyk">
      <h4>Did you know</h4>
      <p><strong>{topic.title}:</strong> {topic.oneLiner}</p>
      <p className="muted small" dangerouslySetInnerHTML={{ __html: topic.body[0] }} />
      <a href={`/react-crypto/?page=learn#learn-topic-${topic.id}`} className="did-you-know-link">Read more in {cat.title} →</a>
    </div>
  );
}

