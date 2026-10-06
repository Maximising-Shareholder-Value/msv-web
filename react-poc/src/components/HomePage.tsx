// components/HomePage.tsx — the homepage: one long page, top to bottom.
// 1. What $MSV is, and what the site covers
// 2. Global markets: the map, country selection and the country's profile
// 3. Gainers and losers, with the full quote columns
// 4. Browse by category, and the crypto table
// 5. Sectors, earnings, the economic calendar and the news
// 6. Currencies, the learn topics, the explore pages, and your lists
// Every section is in the page flow, so it reads like a front page.

import { useRef, useState } from "react";
import { LEARN_CATEGORIES } from "../data/learn";
import { EXPLORE_DIRECTORY, EXPLORE_CATEGORIES } from "../data/explore";
import { IndexStrip, ForexStrip, EconCalendar } from "./HomeWidgets";
import { HomeNews } from "./HomeNews";
import { HomeGlance, MarketsTodayNote } from "./HomeGlance";
import { HomeSectors } from "./HomeSectors";
import { MarketBreadth, EarningsCalendar, CryptoTable } from "./HomeMore";
import { RecentlyViewed, Watchlist } from "./HomeLists";
import { WorldMap } from "./WorldMap";
import { CountryExplorer } from "./CountryExplorer";
import { HomeRibbon } from "./HomeRibbon";
import { HomeSearch } from "./HomeSearch";
import { HomeMarketIntel } from "./HomeMarketIntel";
import { HomeHowTo } from "./HomeHowTo";
import { SiteFooter } from "./SiteFooter";
import { hrefFor as exploreHrefFor } from "./ExplorePage";
import { Section, MoversAndBrowse } from "./StockTables";

// One simple line icon per Explore category, so each group reads as its own block.
const ICON_OPEN = `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`;
const EXPLORE_COLORS: Record<string, string> = {
  "Get Started": "#0ea5e9",
  "Stock Analysis": "#10b981",
  "Market Outlook": "#6366f1",
  "Market Intelligence": "#f59e0b",
  "Portfolio Tools": "#ec4899",
  "Learn & Premium": "#8b5cf6",
};
const EXPLORE_ICONS: Record<string, string> = {
  "Get Started": `${ICON_OPEN}<path d="M5 17V3"/><path d="M5 4h9l-2 3 2 3H5"/></svg>`,
  "Stock Analysis": `${ICON_OPEN}<line x1="5" y1="17" x2="5" y2="11"/><line x1="10" y1="17" x2="10" y2="7"/><line x1="15" y1="17" x2="15" y2="4"/></svg>`,
  "Market Outlook": `${ICON_OPEN}<circle cx="10" cy="10" r="7"/><ellipse cx="10" cy="10" rx="3" ry="7"/><line x1="3" y1="10" x2="17" y2="10"/></svg>`,
  "Market Intelligence": `${ICON_OPEN}<circle cx="5" cy="10" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="15" cy="15" r="2"/><line x1="7" y1="9" x2="13" y2="6"/><line x1="7" y1="11" x2="13" y2="14"/></svg>`,
  "Portfolio Tools": `${ICON_OPEN}<rect x="3" y="6" width="14" height="10" rx="1.5"/><path d="M7 6V4.5h6V6"/></svg>`,
  "Learn & Premium": `${ICON_OPEN}<path d="M3 4h5a2 2 0 0 1 2 2v11a2 1.5 0 0 0-2-1.5H3z"/><path d="M17 4h-5a2 2 0 0 0-2 2v11a2 1.5 0 0 1 2-1.5h5z"/></svg>`,
};

export function HomePage() {
  // The country shown in the panel below the map. A map click also scrolls down to that panel.
  const [iso2, setIso2] = useState("US");
  const countryRef = useRef<HTMLDivElement>(null);
  const pickFromMap = (code: string) => {
    setIso2(code);
    countryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="hp">
      <HomeRibbon />
      <HomeSearch />

      {/* 1. What $MSV is. The sign-up box runs the same height as the intro text. */}
      <section className="hp-section hp-about-section" id="about">
        <div className="hp-about">
          <div className="hp-about-text">
            <header className="hp-section-head">
              <h2>Markets today</h2>
              <p className="muted">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            </header>
            <p className="hp-lede">$MSV is a plain-English market dashboard. It gives you the full picture on any stock, ETF or crypto ticker: the numbers, what they mean, and where the company stands against its sector.</p>
            <MarketsTodayNote />
            <p>Use it to see what's moving around the world, dig into a single company, compare names side by side, browse ETFs and sectors, follow the economic calendar, and learn the terms as you go. Nothing here is investment advice.</p>
          </div>
          <div className="hp-signup">
            <span className="hp-signup-badge">Free · coming soon</span>
            <p className="hp-signup-label">Create a free account</p>
            <p className="muted small">Accounts are being built. Once they're live, your data follows you from visit to visit.</p>
            <ul className="hp-signup-list">
              <li>A watchlist and your recently viewed tickers, kept between visits</li>
              <li>Price and news alerts for the tickers you follow</li>
              <li>Your theme and default country, on every page</li>
            </ul>
            <div className="hp-signup-social">
              <button type="button" className="hp-social" disabled>Continue with Google</button>
              <button type="button" className="hp-social" disabled>Continue with Apple</button>
            </div>
            <a className="hp-btn" href="/app/?page=placeholder&key=create-account">Create Free Account</a>
          </div>
        </div>
        <HomeGlance />
      </section>

      {/* Market news, with pictures, between the intro and the map */}
      <Section id="news" title="Market news" lead="The latest headlines from the Finnhub news wire.">
        <HomeNews />
      </Section>

      {/* 2. Global markets: country bubbles, the map, the breadth bar, then the country panel */}
      <Section id="global" title="Global markets" lead="Click a country on the map, or pick one below, for its market hours, live index price and economy.">
        <div className="hp-strip"><IndexStrip /></div>
        <p className="hp-map-hint">Hover a country to highlight it, then click to select it. Its details open below the map.</p>
        <WorldMap selected={iso2} onSelect={pickFromMap} quotes={{}} mode="groups" onMode={() => {}} wbData={{}} showModes={false} />
        <div className="hp-breadth"><MarketBreadth /></div>
        <div ref={countryRef} className="hp-country-anchor">
          <CountryExplorer iso2={iso2} onPick={setIso2} />
        </div>
      </Section>

      {/* 3. Gainers, losers and browse, shared with the Stock Analysis page */}
      <MoversAndBrowse />
      <Section id="crypto" title="Crypto" lead="The largest coins, with market size and distance from their all-time highs.">
        <CryptoTable />
      </Section>

      {/* 5. Sectors, earnings, calendar, news */}
      <Section id="sectors" title="Sectors today" lead="Each tile is a sector's tracking ETF. The bar shows how far it moved today. Switch to industries and themes for the finer detail, or click a tile for its page.">
        <HomeSectors />
      </Section>
      <div className="hp-two">
        <Section id="earnings" title="Earnings this week" lead="Companies reporting in the next seven days.">
          <EarningsCalendar />
        </Section>
        <Section id="calendar" title="Economic calendar" lead="Inflation, jobs and Fed dates, from the official schedules.">
          <EconCalendar />
        </Section>
      </div>
      {/* 5b. Market intelligence: a small view of the AI supply chain */}
      <Section id="intel" title="Market intelligence" lead="How the AI supply chain fits together, from the chips to the apps. The full map has the sourced links and the inferred ones, labelled.">
        <HomeMarketIntel />
      </Section>

      {/* 6. Currencies, learn, explore, your lists */}
      <Section id="currencies" title="Currencies" lead="Major pairs, from Twelve Data.">
        <ForexStrip />
      </Section>
      <Section id="learn" title="Learn" lead="Short, plain-English lessons on the terms you'll meet across the site.">
        <div className="hp-learn-grid">
          {LEARN_CATEGORIES.filter(c => c.topics.length > 0).map((c, i) => (
            <a key={c.id} className="hp-learn-card" href="/app/?page=learn">
              <span className="hp-learn-index">{String(i + 1).padStart(2, "0")}</span>
              <strong>{c.title}</strong>
              <span className="muted small">{c.blurb}</span>
              <span className="hp-learn-meta">{c.topics.length} lessons · {c.topics.slice(0, 2).map(t => t.title).join(" · ")}</span>
            </a>
          ))}
        </div>
      </Section>
      <Section id="explore" title="Explore $MSV" lead="Every page on the site, grouped by what it's for.">
        <p className="hp-explore-count">
          {EXPLORE_DIRECTORY.filter(e => e.live).length} pages are live, and {EXPLORE_DIRECTORY.filter(e => !e.live).length} are on the roadmap. They're grouped below by what they're for.
        </p>
        <div className="hp-explore-cols">
          {EXPLORE_CATEGORIES.map(cat => (
            <div key={cat.title} className="hp-explore-col">
              <h4>
                <span
                  className="hp-explore-icon"
                  style={{ color: EXPLORE_COLORS[cat.title], background: `color-mix(in srgb, ${EXPLORE_COLORS[cat.title]} 16%, transparent)` }}
                  dangerouslySetInnerHTML={{ __html: EXPLORE_ICONS[cat.title] ?? "" }}
                />
                {cat.title}
              </h4>
              <ul>
                {cat.items.map(nav => {
                  const item = EXPLORE_DIRECTORY.find(e => e.nav === nav);
                  if (!item) return null;
                  return (
                    <li key={nav}>
                      {item.live
                        ? <a href={exploreHrefFor(item)}>{item.title}</a>
                        : <span className="muted">{item.title} <em>soon</em></span>}
                      <span className="hp-explore-desc">{item.description}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="hp-more"><a href="/app/?page=explore">See every page →</a></p>
      </Section>

      {/* 7. Your lists, a fact to learn from, and the walkthrough */}
      <div className="hp-trio">
        <Section id="lists" title="Your lists" lead="Recently viewed tickers and your watchlist. Star a ticker's page to add it to the watchlist.">
          <div className="hp-lists">
            <RecentlyViewed />
            <Watchlist />
            <div className="hp-suggest">
              <span className="hp-suggest-label">Start with one of these</span>
              <div className="hp-suggest-chips">
                {["AAPL", "NVDA", "MSFT", "SPY", "TLT"].map(s => (
                  <a key={s} href={`/app/?page=ticker&symbol=${s}`}>{s}</a>
                ))}
              </div>
            </div>
          </div>
        </Section>
        <Section id="dyk" title="Did you know" lead="A lesson from Learn, picked for today.">
          <DidYouKnow />
        </Section>
      </div>
      <Section id="how-to" title="How to use $MSV" lead="Five steps to get the most out of the site.">
        <HomeHowTo />
      </Section>
      <SiteFooter />
    </div>
  );
}

/** One lesson from Learn, the same for everyone on a given day: its idea, a worked example, and a tip. */
function DidYouKnow() {
  const all = LEARN_CATEGORIES.flatMap(cat => cat.topics.map(topic => ({ cat, topic })));
  if (!all.length) return null;
  const dayNum = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
  const { cat, topic } = all[dayNum % all.length];
  return (
    <div className="hp-dyk">
      <span className="hp-dyk-cat">{cat.title}</span>
      <strong className="hp-dyk-title">{topic.title}</strong>
      <p className="hp-dyk-idea">{topic.oneLiner}</p>
      <p className="muted small" dangerouslySetInnerHTML={{ __html: topic.body[0] }} />
      <div className="hp-dyk-example">
        <span className="hp-dyk-label">Example</span>
        <p dangerouslySetInnerHTML={{ __html: topic.example }} />
      </div>
      <a href="/app/?page=learn" className="hp-link">Read the full lesson →</a>
    </div>
  );
}

