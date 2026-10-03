// components/HomePage.tsx — the homepage: one long page, top to bottom.
// 1. What $MSV is, and what the site covers
// 2. Global markets: the map, country selection and the country's profile
// 3. Gainers and losers, with the full quote columns
// 4. Browse by category, and the crypto table
// 5. Sectors, earnings, the economic calendar and the news
// 6. Currencies, the learn topics, the explore pages, and your lists
// Every section is in the page flow, so it reads like a front page.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BROWSE_CATEGORIES, RANKING_STOCK_SYMBOLS } from "../data/home";
import { LEARN_CATEGORIES } from "../data/learn";
import { EXPLORE_DIRECTORY } from "../data/explore";
import { COUNTRY_LIST, exchangeStatus, localTime, type Country } from "../lib/markets";
import { getNews, type Quote } from "../lib/finnhub";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";
import type { NewsItem } from "../lib/types";
import { IndexStrip, SectorHeatmap, ForexStrip, EconCalendar } from "./HomeWidgets";
import { MarketBreadth, EarningsCalendar, CryptoTable } from "./HomeMore";
import { RecentlyViewed, Watchlist, HowTo } from "./HomeLists";
import { WorldMap } from "./WorldMap";
import { ExploreTile } from "./ExplorePage";

interface Row { symbol: string; name: string; quote: Quote }

const FEATURED = ["sectors", "etfs", "stock-screener", "market-data", "market-intelligence", "macro", "prediction-markets", "compare", "market-news", "ipo", "explore-products"];

const timeAgo = (unixSeconds: number) => {
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

/** One section of the page: a heading, a one-line explanation, then its content. */
function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="hp-section" id={id}>
      <header className="hp-section-head">
        <h2>{title}</h2>
        {lead && <p className="muted">{lead}</p>}
      </header>
      {children}
    </section>
  );
}

/** A full table of quotes, with the columns the ticker pages use. */
function QuoteTable({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <p className="muted small">{empty}</p>;
  return (
    <div className="hp-table-scroll">
      <table className="hp-table">
        <thead>
          <tr><th>Symbol</th><th>Name</th><th className="num">Price</th><th className="num">Change</th><th className="num">Change %</th><th className="num">Prev close</th><th className="num">Day high</th><th className="num">Day low</th><th>Day range</th></tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const q = r.quote;
            const pos = q.h !== q.l ? Math.max(0, Math.min(100, ((q.c - q.l) / (q.h - q.l)) * 100)) : 50;
            return (
              <tr key={r.symbol}>
                <td><a href={`/app/?page=ticker&symbol=${encodeURIComponent(r.symbol)}`}><strong>{r.symbol}</strong></a></td>
                <td className="muted">{r.name}</td>
                <td className="num">{fmtPrice(q.c)}</td>
                <td className={`num ${changeClass(q.d)}`}>{q.d === null ? "—" : `${q.d >= 0 ? "+" : ""}${q.d.toFixed(2)}`}</td>
                <td className={`num ${changeClass(q.dp)}`}>{fmtPct(q.dp)}</td>
                <td className="num">{fmtPrice(q.pc)}</td>
                <td className="num">{fmtPrice(q.h)}</td>
                <td className="num">{fmtPrice(q.l)}</td>
                <td><span className="hp-range"><i style={{ left: `${pos}%` }} /></span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function HomePage() {
  const [cat, setCat] = useState("trending-tech");
  const category = BROWSE_CATEGORIES.find(c => c.id === cat) ?? BROWSE_CATEGORIES[0];
  const rankingQuotes = useQuotes(RANKING_STOCK_SYMBOLS.map(([s]) => s));
  const browseQuotes = useQuotes(category.items.map(([s]) => s));

  const { gainers, losers } = useMemo(() => {
    const all: Row[] = RANKING_STOCK_SYMBOLS
      .map(([symbol, name]) => ({ symbol, name, quote: rankingQuotes[symbol] }))
      .filter((r): r is Row => !!r.quote);
    const byMove = [...all].sort((a, b) => (b.quote.dp ?? 0) - (a.quote.dp ?? 0));
    return {
      gainers: byMove.filter(r => (r.quote.dp ?? 0) > 0).slice(0, 10),
      losers: [...byMove].reverse().filter(r => (r.quote.dp ?? 0) < 0).slice(0, 10),
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
      {/* 1. What $MSV is */}
      <Section id="about" title="Markets today" lead={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}>
        <div className="hp-about">
          <div className="hp-about-text">
            <p className="hp-lede">$MSV is a plain-English market dashboard. It gives you the full picture on any stock, ETF or crypto ticker: the numbers, what they mean, and where the company stands against its sector.</p>
            <p>Use it to see what's moving around the world, dig into a single company, compare names side by side, browse ETFs and sectors, follow the economic calendar, and learn the terms as you go. Nothing here is investment advice.</p>
            <div className="hp-about-links">
              <a className="hp-btn" href="#global">Global markets</a>
              <a className="hp-btn hp-btn-ghost" href="#how-to">How to use $MSV</a>
              <a className="hp-btn hp-btn-ghost" href="/app/?page=learn">New to investing? Start here</a>
            </div>
          </div>
          <div className="hp-about-side">
            <MarketBreadth />
            <div className="hp-signup">
              <p className="hp-signup-label">Create a free account</p>
              <p className="muted small">Save your watchlist and preferences across visits.</p>
              <a className="hp-btn" href="/app/?page=placeholder&key=create-account">Create Free Account</a>
              <span className="muted small">Coming soon: accounts aren't built yet.</span>
            </div>
          </div>
        </div>
        <div className="hp-strip"><IndexStrip /></div>
      </Section>

      {/* 2. Global markets */}
      <Section id="global" title="Global markets" lead="Click a country on the map, or pick one below, for its market hours, live index price and economy.">
        <WorldMap selected={null} onSelect={iso2 => { location.href = `/app/?page=market-data&country=${iso2}`; }} quotes={{}} mode="groups" onMode={() => {}} wbData={{}} showModes={false} />
        <CountryPicker />
      </Section>

      {/* 3. Gainers and losers */}
      <Section id="movers" title="Top gainers" lead="The biggest rises among the most-followed US stocks and ETFs today.">
        <QuoteTable rows={gainers} empty="Loading live prices…" />
      </Section>
      <Section id="losers" title="Top losers" lead="The biggest falls among the same names today.">
        <QuoteTable rows={losers} empty="Loading live prices…" />
      </Section>

      {/* 4. Browse */}
      <Section id="browse" title="Browse by category" lead="Pick a category to see its live prices.">
        <div className="hp-chips" role="tablist">
          {BROWSE_CATEGORIES.map(c => (
            <button key={c.id} type="button" role="tab" aria-selected={c.id === cat} className={c.id === cat ? "active" : ""} onClick={() => setCat(c.id)}>{c.title}</button>
          ))}
        </div>
        <QuoteTable rows={browseRows} empty="Loading live prices…" />
      </Section>
      <Section id="crypto" title="Crypto" lead="The largest coins, with market size and distance from their all-time highs.">
        <CryptoTable />
      </Section>

      {/* 5. Sectors, earnings, calendar, news */}
      <Section id="sectors" title="Sectors today" lead="The eleven US sectors, coloured by today's move in their tracking ETF. Click through on the Sectors page.">
        <SectorHeatmap />
      </Section>
      <div className="hp-two">
        <Section id="earnings" title="Earnings this week" lead="Companies reporting in the next seven days.">
          <EarningsCalendar />
        </Section>
        <Section id="calendar" title="Economic calendar" lead="Inflation, jobs and Fed dates, from the official schedules.">
          <EconCalendar />
        </Section>
      </div>
      <Section id="news" title="Market news" lead="The latest headlines from the Finnhub news wire.">
        <TopNews />
      </Section>

      {/* 6. Currencies, learn, explore, your lists */}
      <Section id="currencies" title="Currencies" lead="Major pairs, from Twelve Data.">
        <ForexStrip />
      </Section>
      <Section id="learn" title="Learn" lead="Plain-English explanations of what you're looking at across the site.">
        <div className="explore-grid">
          {LEARN_CATEGORIES.filter(c => c.topics.length > 0).map(c => (
            <a key={c.id} className="explore-tile" href="/app/?page=learn">
              <span className="learn-category-icon">{c.icon}</span>
              <strong>{c.title}</strong>
              <span className="explore-tile-desc">{c.blurb}</span>
            </a>
          ))}
        </div>
      </Section>
      <Section id="explore" title="Explore $MSV" lead="Every part of the site.">
        <div className="explore-grid">
          {featured.map(item => <ExploreTile key={item.nav} item={item} />)}
        </div>
        <p className="hp-more"><a href="/app/?page=explore">See every page →</a></p>
      </Section>
      <div className="hp-two">
        <Section id="lists" title="Your lists" lead="Recently viewed tickers and your watchlist.">
          <RecentlyViewed />
          <Watchlist />
        </Section>
        <Section id="dyk" title="Did you know">
          <DidYouKnow />
        </Section>
      </div>
      <Section id="how-to" title="How to use $MSV" lead="A short walkthrough.">
        <HowTo />
      </Section>
    </div>
  );
}

/** Pick a country: its market status, local time, hours, and the live price of its index proxy. */
function CountryPicker() {
  const [iso2, setIso2] = useState("US");
  const country: Country | undefined = COUNTRY_LIST.find(c => c.iso2 === iso2);
  const quote = useQuotes(country?.etf ? [country.etf] : [])[country?.etf ?? ""];
  const status = country ? exchangeStatus(country) : null;
  return (
    <div className="hp-country">
      <label className="hp-country-pick">
        <span className="muted small">Country</span>
        <select value={iso2} onChange={e => setIso2(e.target.value)}>
          {COUNTRY_LIST.map(c => <option key={c.iso2} value={c.iso2}>{c.flag} {c.name}</option>)}
        </select>
      </label>
      {country && (
        <div className="hp-country-card">
          <div>
            <strong>{country.flag} {country.name}</strong>
            <p className="muted small">{country.ex || "No exchange tracked"} · {country.city}</p>
          </div>
          <div>
            <span className="muted small">Market</span>
            <strong className={status?.isOpen ? "positive" : ""}>{status ? (status.isOpen ? "Open now" : "Closed") : "—"}</strong>
            {country.tz && <p className="muted small">Local time {localTime(country.tz)}{country.open && country.close ? ` · hours ${country.open}–${country.close}` : ""}</p>}
          </div>
          <div>
            <span className="muted small">{country.etf ? `${country.etf} (index proxy)` : "No index ETF"}</span>
            <strong>{country.etf ? (quote ? `${fmtPrice(quote.c)} ${fmtPct(quote.dp)}` : "Loading…") : "Macro data only"}</strong>
          </div>
          <a className="hp-btn" href={`/app/?page=market-data&country=${country.iso2}`}>Open the {country.name} profile</a>
        </div>
      )}
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
    <div className="hp-news-grid">
      {items.slice(0, 12).map((n, i) => (
        <a key={`${n.url}-${i}`} className="hp-news-row" href={n.url} target="_blank" rel="noopener noreferrer">
          <strong>{n.headline}</strong>
          <span className="muted small">{n.source} · {timeAgo(n.datetime)}</span>
        </a>
      ))}
    </div>
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

