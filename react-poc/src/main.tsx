import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
// The vanilla site's stylesheet, reused as-is so both versions look the same.
import "../../style.css";
import "./poc.css";
import { App } from "./App";
import { SectorsPage } from "./components/SectorsPage";
import { IpoPage } from "./components/IpoPage";
import { NewsPage } from "./components/NewsPage";
import { EtfsPage } from "./components/EtfsPage";
import { ScreenerPage } from "./components/ScreenerPage";
import { MarketDataPage } from "./components/MarketDataPage";
import { MarketIntelPage } from "./components/MarketIntelPage";
import { LearnPage } from "./components/LearnPage";
import { HomePage } from "./components/HomePage";
import { StockAnalysisPage } from "./components/StockAnalysisPage";
import { WatchlistPage } from "./components/WatchlistPage";
import { ExplorePage } from "./components/ExplorePage";
import { TickerPage } from "./components/TickerPage";
import { ComparePage } from "./components/ComparePage";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { PredictionMarketsPage } from "./components/PredictionMarketsPage";
import { MacroPage } from "./components/MacroPage";
import { PageNav } from "./components/PageNav";
import { AppSidebar } from "./components/AppSidebar";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";

// One build, several pages. The page is picked from the query string
// (?page=sectors, ?page=ipo, ?page=news); anything else shows the Crypto page.
// A query string rather than a path, because the live site's single-page
// fallback would serve the main site's index.html for /app/sectors.
const page = new URLSearchParams(location.search).get("page");

// Each page gets its own browser-tab title. The Crypto page keeps its own, set in index.html.
const TITLES: Record<string, string> = {
  sectors: "Sectors", etfs: "ETFs", screener: "Stock Screener", ipo: "IPO Calendar", news: "Market News", "market-data": "Market Data", "market-intel": "Market Intelligence", learn: "Learn", home: "Markets", "stock-analysis": "Stock Analysis", watchlist: "Watchlist", explore: "Explore", compare: "Compare", macro: "Macro", ticker: "Ticker", placeholder: "Coming soon", "prediction-markets": "Prediction Markets",
};
if (page && TITLES[page]) document.title = `$MSV — ${TITLES[page]}`;

// Light or dark, for every page. The same saved choice the old site uses
// ("stockDashboardTheme"); with none saved, follow the system setting. Done here,
// before anything renders, because only the Crypto page used to set it.
(function applySavedTheme() {
  let theme: string | null = null;
  try { theme = localStorage.getItem("stockDashboardTheme"); } catch { /* storage blocked: fall through */ }
  if (theme !== "light" && theme !== "dark") theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);
})();

// The three new pages share a nav bar linking them together.
function Framed({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppSidebar current={current} />
      <div className="app-main">
        <SiteHeader />
        <PageNav current={current} />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}

function CurrentPage() {
  if (page === "sectors") return <Framed current="sectors"><SectorsPage /></Framed>;
  if (page === "ipo") return <Framed current="ipo"><IpoPage /></Framed>;
  if (page === "news") return <Framed current="news"><NewsPage /></Framed>;
  if (page === "etfs") return <Framed current="etfs"><EtfsPage /></Framed>;
  if (page === "screener") return <Framed current="screener"><ScreenerPage /></Framed>;
  if (page === "market-data") return <Framed current="market-data"><MarketDataPage /></Framed>;
  if (page === "market-intel") return <Framed current="market-intel"><MarketIntelPage /></Framed>;
  if (page === "learn") return <Framed current="learn"><LearnPage /></Framed>;
  if (page === "stock-analysis") return <StockAnalysisPage />;
  if (page === "watchlist") return <WatchlistPage />;
  if (page === "home") return (
    <div className="app-shell">
      <AppSidebar current="home" />
      <div className="app-main home-main-frame"><HomePage /></div>
    </div>
  );
  // The sidebar item's key is "explore-products"; the top nav's is "explore".
  if (page === "explore") return (
    <div className="app-shell">
      <AppSidebar current="explore-products" />
      <div className="app-main"><SiteHeader /><PageNav current="explore" /><ExplorePage /><SiteFooter /></div>
    </div>
  );
  if (page === "placeholder") { const key = new URLSearchParams(location.search).get("key") ?? ""; return <Framed current={key}><PlaceholderPage pageKey={key} /></Framed>; }
  if (page === "macro") return <Framed current="macro"><MacroPage /></Framed>;
  if (page === "prediction-markets") return <Framed current="prediction-markets"><PredictionMarketsPage /></Framed>;
  if (page === "compare") return <Framed current="compare"><ComparePage /></Framed>;
  if (page === "ticker") return <Framed current="ticker"><TickerPage symbol={(new URLSearchParams(location.search).get("symbol") ?? "AAPL").toUpperCase()} /></Framed>;
  return <Framed current="crypto"><App /></Framed>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrentPage />
  </StrictMode>,
);
