import { useEffect, useState } from "react";
import { coingecko, finnhubNews, useAsync, useLocalStorage } from "./lib/api";
import type { Coin, GlobalStats } from "./lib/types";
import { BitcoinCycles } from "./components/BitcoinCycles";
import { CoinPanel } from "./components/CoinPanel";
import { CoinsTable } from "./components/CoinsTable";
import { Crypto101 } from "./components/Crypto101";
import { CryptoNews } from "./components/CryptoNews";
import { Derivatives } from "./components/Derivatives";
import { Protocols, YieldPools } from "./components/DefiDeep";
import { Dominance } from "./components/Dominance";
import { Exchanges } from "./components/Exchanges";
import { FearGreed } from "./components/FearGreed";
import { Loadable } from "./components/Loadable";
import { MarketBreadth } from "./components/MarketBreadth";
import { MarketStrip } from "./components/MarketStrip";
import { Categories, Defi, Stablecoins } from "./components/MarketBoxes";
import { Movers } from "./components/Movers";
import { Tabs, type Tab } from "./components/Tabs";
import { Trending } from "./components/Trending";

const REFRESH_MS = 60_000;
const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "markets", label: "Markets" },
  { id: "exchanges", label: "Exchanges" },
  { id: "defi", label: "DeFi" },
  { id: "stablecoins", label: "Stablecoins" },
  { id: "cycles", label: "Crypto Cycles" },
  { id: "news", label: "News" },
  { id: "learn", label: "Learn" },
];

/** "Updated 12s ago" that re-renders itself every second. */
function useSecondsSince(t: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  return t ? Math.max(0, Math.round((now - t) / 1000)) : null;
}

export function App() {
  // ---- state: things that change, and when they change the page re-draws ----
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("poc-theme", "light");
  const [autoRefresh, setAutoRefresh] = useLocalStorage<boolean>("poc-auto-refresh", true);
  const [favourites, setFavourites] = useLocalStorage<string[]>("poc-favourites", ["bitcoin", "ethereum"]);
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get("tab") || "overview");
  // The selected coin lives in the URL (?coin=bitcoin) so it can be shared/bookmarked.
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(location.search).get("coin"));
  const [trendingIds, setTrendingIds] = useState<string[]>([]);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  useEffect(() => {
    const url = new URL(location.href);
    if (selected) url.searchParams.set("coin", selected); else url.searchParams.delete("coin");
    url.searchParams.set("tab", tab);
    history.replaceState(null, "", url);
    if (selected) requestAnimationFrame(() => document.getElementById("coin-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [selected, tab]);

  const coins = useAsync(
    () => coingecko<Coin[]>("/coins/markets", { vs_currency: "usd", order: "market_cap_desc", per_page: "100", page: "1", sparkline: "true", price_change_percentage: "1h,24h,7d,30d,1y" }),
    [],
    autoRefresh ? REFRESH_MS : undefined,
  );
  const age = useSecondsSince(coins.updatedAt);

  // Shared across Overview (movers, trending) and the News tab, so it's
  // fetched once, not once per component.
  const news = useAsync(() => finnhubNews("crypto"), []);
  const globalStats = useAsync(() => coingecko<GlobalStats>("/global"), [], autoRefresh ? REFRESH_MS : undefined);
  const btc = coins.data?.find(c => c.id === "bitcoin") ?? null;

  const toggleFavourite = (id: string) => setFavourites(f => (f.includes(id) ? f.filter(x => x !== id) : [...f, id]));
  const openCoin = (id: string) => { setSelected(id); setTab("markets"); };

  return (
    <main className="poc-page">
      <div className="poc-banner">
        <div>
          <strong>React + TypeScript proof of concept</strong>
          <span className="muted small"> — the Crypto page rebuilt as components. Same data, same styling as the live site.</span>
        </div>
        <div className="poc-controls">
          <span className="muted small">{coins.loading && !coins.data ? "Loading…" : age !== null ? `Updated ${age}s ago` : ""}</span>
          <label className="poc-toggle"><input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> Auto-refresh (60s)</label>
          <button type="button" className="cp-btn cp-btn-ghost" onClick={coins.reload}>Refresh now</button>
          <button type="button" className="cp-btn cp-btn-ghost" onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</button>
        </div>
      </div>

      <div className="card">
        <h3>Crypto <span className="card-subtitle">market overview, coins, exchanges, DeFi, stablecoins, Bitcoin cycles and news</span></h3>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "overview" && (
          <>
            <MarketStrip refreshMs={autoRefresh ? REFRESH_MS : undefined} />
            <div className="cr-row2"><FearGreed /><Trending onSelect={openCoin} news={news.data} onTrendingIds={setTrendingIds} /></div>
            <Loadable state={coins} what="coins">
              {list => (
                <>
                  <div className="cr-grid2">
                    <MarketBreadth coins={list} />
                    <Dominance coins={list} globalTotal={globalStats.data?.data.total_market_cap.usd ?? null} />
                  </div>
                  <Movers coins={list} news={news.data} trendingIds={trendingIds} onSelect={openCoin} />
                </>
              )}
            </Loadable>
          </>
        )}

        {tab === "markets" && (
          <>
            <Loadable state={coins} what="coins">
              {list => <CoinsTable coins={list} selectedId={selected} onSelect={setSelected} favourites={favourites} onToggleFavourite={toggleFavourite} />}
            </Loadable>
            {/* key={selected}: a new coin gets a fresh panel instead of briefly showing the old one */}
            {selected && <CoinPanel key={selected} id={selected} onClose={() => setSelected(null)} />}
            <Derivatives />
          </>
        )}

        {tab === "exchanges" && <Exchanges />}

        {tab === "defi" && (
          <>
            <div className="cr-grid2"><Categories /><Defi /></div>
            <Protocols />
            <YieldPools />
          </>
        )}

        {tab === "stablecoins" && <Stablecoins />}

        {tab === "cycles" && <BitcoinCycles btcPrice={btc?.current_price ?? null} btcSupply={btc?.circulating_supply ?? null} />}

        {tab === "news" && <CryptoNews news={news} />}

        {tab === "learn" && <Crypto101 />}
      </div>
    </main>
  );
}
