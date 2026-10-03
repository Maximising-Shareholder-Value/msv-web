// components/HomePage.tsx — the homepage: a showcase of everything the site does.
// A summary header and the introduction, then the world map and top news, the
// market movers (three short lists), a browse panel with the crypto table, the
// sectors, earnings, the economic calendar, the currencies, the learn banner, the
// explore tiles and the personal lists. Every card has a capped height, so no one
// section can crowd out the others.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BROWSE_CATEGORIES, RANKING_STOCK_SYMBOLS } from "../data/home";
import { LEARN_CATEGORIES } from "../data/learn";
import { EXPLORE_DIRECTORY } from "../data/explore";
import { getNews, type Quote } from "../lib/finnhub";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";
import type { NewsItem } from "../lib/types";
import { IndexStrip, SectorHeatmap, ForexStrip, EconCalendar } from "./HomeWidgets";
import { MarketBreadth, EarningsCalendar, CryptoTable } from "./HomeMore";
import { RecentlyViewed, Watchlist, HowTo } from "./HomeLists";
import { WorldMap } from "./WorldMap";
import { hrefFor } from "./ExplorePage";

interface Row { symbol: string; name: string; quote: Quote }

const FEATURED = ["sectors", "etfs", "stock-screener", "market-data", "market-intelligence", "learn", "macro", "prediction-markets", "compare", "market-news", "ipo", "explore-products"];

const timeAgo = (unixSeconds: number) => {
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

/** A card with a heading, an optional note, and content that scrolls inside a fixed height. */
function Card({ title, note, children, className = "", scroll = false }: { title: string; note?: string; children: ReactNode; className?: string; scroll?: boolean }) {
  return (
    <section className={`hp-card ${className}`}>
      <header className="hp-card-head">
        <h3>{title}</h3>
        {note && <span className="muted small">{note}</span>}
      </header>
      <div className={scroll ? "hp-card-body hp-scroll" : "hp-card-body"}>{children}</div>
    </section>
  );
}

/** A short table: symbol, price and today's move. */
function MiniTable({ rows, limit, empty }: { rows: Row[]; limit: number; empty: string }) {
  if (!rows.length) return <p className="muted small">{empty}</p>;
  return (
    <table className="hp-mini">
      <tbody>
        {rows.slice(0, limit).map(r => (
          <tr key={r.symbol}>
            <td><a href={`/app/?page=ticker&symbol=${encodeURIComponent(r.symbol)}`}><strong>{r.symbol}</strong></a> <span className="muted small">{r.name}</span></td>
            <td className="num">{fmtPrice(r.quote.c)}</td>
            <td className={`num ${changeClass(r.quote.dp)}`}>{fmtPct(r.quote.dp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HomePage() {
  // Movers come from the ranking list; the browse panel from the chosen category.
  const [cat, setCat] = useState("trending-tech");
  const category = BROWSE_CATEGORIES.find(c => c.id === cat) ?? BROWSE_CATEGORIES[0];
  const rankingQuotes = useQuotes(RANKING_STOCK_SYMBOLS.map(([s]) => s));
  const browseQuotes = useQuotes(category.items.map(([s]) => s));

  const movers = useMemo(() => {
    const all: Row[] = RANKING_STOCK_SYMBOLS
      .map(([symbol, name]) => ({ symbol, name, quote: rankingQuotes[symbol] }))
      .filter((r): r is Row => !!r.quote);
    const byMove = [...all].sort((a, b) => (b.quote.dp ?? 0) - (a.quote.dp ?? 0));
    return {
      winners: byMove.filter(r => (r.quote.dp ?? 0) > 0),
      losers: [...byMove].reverse().filter(r => (r.quote.dp ?? 0) < 0),
      active: [...all].sort((a, b) => Math.abs(b.quote.dp ?? 0) - Math.abs(a.quote.dp ?? 0)),
    };
  }, [rankingQuotes]);

  const browseRows: Row[] = category.items
    .map(([symbol, name]) => ({ symbol, name, quote: browseQuotes[symbol] }))
    .filter((r): r is Row => !!r.quote);

  const featured = FEATURED
    .map(nav => EXPLORE_DIRECTORY.find(e => e.nav === nav))
    .filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <div className="hp">
      <header className="hp-hero">
        <div className="hp-hero-text">
          <h1>Markets today</h1>
          <p className="muted small">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <p className="hp-intro">$MSV gives you the full picture on any stock, ETF or crypto ticker: valuation, financial health, and a plain-English read on where it stands, so you understand what you're buying, not just its price.</p>
          <div className="hp-hero-actions">
            <a className="hp-btn" href="#how-to">How to use $MSV</a>
            <a className="hp-btn hp-btn-ghost" href="/app/?page=learn">New to investing? Start here</a>
          </div>
        </div>
        <div className="hp-hero-side">
          <MarketBreadth />
          <div className="hp-signup">
            <p className="hp-signup-label">Create a free account</p>
            <p className="muted small">Save your watchlist and preferences across visits.</p>
            <a className="hp-btn" href="/app/?page=placeholder&key=create-account">Create Free Account</a>
            <span className="muted small">Coming soon: accounts aren't built yet.</span>
          </div>
        </div>
      </header>

      <div className="hp-strip"><IndexStrip /></div>

      <div className="hp-row hp-row-map">
        <Card title="World markets" note="Click a country for its market profile" className="hp-map">
          <WorldMap selected={null} onSelect={iso2 => { location.href = `/app/?page=market-data&country=${iso2}`; }} quotes={{}} mode="groups" onMode={() => {}} wbData={{}} showModes={false} />
        </Card>
        <Card title="Top news" note="Finnhub news wire" className="hp-news" scroll>
          <TopNews />
        </Card>
      </div>

      <div className="hp-row hp-row-movers">
        <Card title="Top gainers" className="hp-mover"><MiniTable rows={movers.winners} limit={5} empty="Loading live prices…" /></Card>
        <Card title="Top losers" className="hp-mover"><MiniTable rows={movers.losers} limit={5} empty="Loading live prices…" /></Card>
      </div>

      <div className="hp-row hp-row-browse">
        <Card title="Browse" note={category.title} className="hp-browse">
          <div className="hp-chips" role="tablist">
            {BROWSE_CATEGORIES.map(c => (
              <button key={c.id} type="button" role="tab" aria-selected={c.id === cat} className={c.id === cat ? "active" : ""} onClick={() => setCat(c.id)}>{c.title}</button>
            ))}
          </div>
          <MiniTable rows={browseRows} limit={8} empty="Loading live prices…" />
        </Card>
      </div>

      <div className="hp-row hp-row-crypto">
        <Card title="Crypto" note="CoinGecko" className="hp-crypto"><CryptoTable /></Card>
      </div>

      <div className="hp-row hp-row-3">
        <Card title="Sectors today" note="via tracking ETFs"><SectorHeatmap /></Card>
        <Card title="Earnings this week" scroll><EarningsCalendar /></Card>
        <Card title="Economic calendar" scroll><EconCalendar /></Card>
      </div>

      <div className="hp-row hp-row-4">
        <Card title="Currencies"><ForexStrip /></Card>
        <Card title="Your lists"><RecentlyViewed /><Watchlist /></Card>
        <Card title="Did you know" className="hp-dyk hp-scroll"><DidYouKnow /></Card>
        <section className="hp-card hp-howto" id="how-to"><header className="hp-card-head"><h3>How to use $MSV</h3></header><div className="hp-card-body"><HowTo /></div></section>
      </div>

      <section className="hp-explore">
        <header className="hp-card-head"><h3>Explore $MSV</h3><a className="muted small" href="/app/?page=explore">See everything →</a></header>
        <div className="hp-tiles">
          {featured.map(item => (
            <a key={item.nav} className={`hp-tile${item.live ? "" : " soon"}`} href={item.live ? hrefFor(item) : "#"}>
              <strong>{item.title}</strong>
              <span className="muted small">{item.description}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="hp-row hp-row-learn">
        {LEARN_CATEGORIES.filter(c => c.topics.length > 0).slice(0, 4).map(c => (
          <a key={c.id} className="hp-tile" href="/app/?page=learn"><span className="hp-tile-icon">{c.icon}</span><strong>{c.title}</strong><span className="muted small">{c.blurb}</span></a>
        ))}
      </div>
    </div>
  );
}

function TopNews() {
  const [items, setItems] = useState<NewsItem[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    getNews("general").then(n => { if (live) setItems(n); });
    return () => { live = false; };
  }, []);
  if (items === undefined) return <p className="muted small">Loading…</p>;
  if (items === null) return <p className="muted small">Couldn't load market news right now.</p>;
  return (
    <>
      {items.slice(0, 12).map((n, i) => (
        <a key={`${n.url}-${i}`} className="hp-news-row" href={n.url} target="_blank" rel="noopener noreferrer">
          <strong>{n.headline}</strong>
          <span className="muted small">{n.source} · {timeAgo(n.datetime)}</span>
        </a>
      ))}
    </>
  );
}

function DidYouKnow() {
  const all = LEARN_CATEGORIES.flatMap(cat => cat.topics.map(topic => ({ cat, topic })));
  if (!all.length) return null;
  const dayNum = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
  const { cat, topic } = all[dayNum % all.length];
  return (
    <>
      <p><strong>{topic.title}:</strong> {topic.oneLiner}</p>
      <p className="muted small" dangerouslySetInnerHTML={{ __html: topic.body[0] }} />
      <a href="/app/?page=learn" className="hp-link">Read more in {cat.title} →</a>
    </>
  );
}
