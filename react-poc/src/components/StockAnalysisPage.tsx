// components/StockAnalysisPage.tsx — the Stock Analysis page (React). Its own page,
// not the homepage: the top gainers, top losers, and browse-by-category tables,
// with a heading and the sidebar, so the sidebar item lands on real content.
// The tables come from StockTables.tsx, shared with the homepage. Ribbon, search
// and footer match the homepage (added 2026-10-08 — they were missing before,
// unlike every other page).

import { AppSidebar } from "./AppSidebar";
import { HomeRibbon } from "./HomeRibbon";
import { HomeSearch } from "./HomeSearch";
import { SiteFooter } from "./SiteFooter";
import { MoversAndBrowse } from "./StockTables";

export function StockAnalysisPage() {
  return (
    <div className="app-shell">
      <AppSidebar current="stock-analysis" />
      <div className="app-main home-main-frame">
        <div className="hp">
          <HomeRibbon />
          <HomeSearch />
          <section className="hp-section hp-about-section">
            <header className="hp-section-head">
              <h2>Stock Analysis</h2>
              <p className="muted">Today's biggest movers among the most-followed US stocks, and the live prices for each category. Click a ticker for its full analysis.</p>
            </header>
          </section>
          <MoversAndBrowse />
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
