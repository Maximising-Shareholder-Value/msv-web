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
import { ExplorePage } from "./components/ExplorePage";
import { TickerPage } from "./components/TickerPage";
import { ComparePage } from "./components/ComparePage";
import { PageNav } from "./components/PageNav";
import { AppSidebar } from "./components/AppSidebar";

// One build, several pages. The page is picked from the query string
// (?page=sectors, ?page=ipo, ?page=news); anything else shows the Crypto page.
// A query string rather than a path, because the live site's single-page
// fallback would serve the main site's index.html for /react-crypto/sectors.
const page = new URLSearchParams(location.search).get("page");

// Each page gets its own browser-tab title. The Crypto page keeps its own, set in index.html.
const TITLES: Record<string, string> = {
  sectors: "Sectors", etfs: "ETFs", screener: "Stock Screener", ipo: "IPO Calendar", news: "Market News", "market-data": "Market Data", "market-intel": "Market Intelligence", learn: "Learn", home: "Markets", explore: "Explore", compare: "Compare",
};
if (page && TITLES[page]) document.title = `$MSV — ${TITLES[page]}`;

// The three new pages share a nav bar linking them together.
function Framed({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppSidebar current={current} />
      <div className="app-main">
        <PageNav current={current} />
        {children}
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
  if (page === "home") return <Framed current="home"><HomePage /></Framed>;
  if (page === "explore") return <Framed current="explore"><ExplorePage /></Framed>;
  if (page === "compare") return <Framed current="compare"><ComparePage /></Framed>;
  if (page === "ticker") return <Framed current="ticker"><TickerPage symbol={(new URLSearchParams(location.search).get("symbol") ?? "AAPL").toUpperCase()} /></Framed>;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrentPage />
  </StrictMode>,
);
