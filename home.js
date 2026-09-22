// home.js — tabbed home page: curated browse categories, dynamically-
// computed Winners/Losers/Most Active, Crypto, a Macro tab (FRED), and a
// grid/heatmap view toggle. Depends on finnhubUrl()/fetchJSON()/isNum()/
// formatCurrency()/displaySymbol()/loadTicker()/renderNews() from
// script.js, so this file must load after it.
//
// Two different kinds of tab, deliberately decoupled:
// - BROWSE_CATEGORIES: name + ticker only, no live data fetched at all —
//   so these can be as long a list as makes sense with zero API cost.
//   Click through to the real deep-dive page for actual numbers.
// - Winners/Losers/Most Active/Crypto: need real quotes to be meaningful
//   at all, so they draw from a smaller, separate RANKING_STOCK_SYMBOLS
//   universe (the original curated ~36) — kept small specifically to
//   control API cost, independent of how long the browse lists get.

const CRYPTO_COINGECKO_IDS = {
  "BINANCE:BTCUSDT": "bitcoin",
  "BINANCE:ETHUSDT": "ethereum",
  "BINANCE:SOLUSDT": "solana",
  "BINANCE:XRPUSDT": "ripple",
  "BINANCE:DOGEUSDT": "dogecoin",
  "BINANCE:ADAUSDT": "cardano",
};
const CRYPTO_ITEMS = Object.keys(CRYPTO_COINGECKO_IDS).map(symbol => [symbol, { bitcoin: "Bitcoin", ethereum: "Ethereum", solana: "Solana", ripple: "XRP", dogecoin: "Dogecoin", cardano: "Cardano" }[CRYPTO_COINGECKO_IDS[symbol]]]);

// FRED has no CORS support at all (confirmed directly), so unlike
// Finnhub/Twelve Data/CoinGecko, it can't be called directly even from
// local dev — this always goes through the deployed Worker. Falls back to
// the current combined deployment's URL when API_BASE_URL (script.js)
// hasn't been set to a separately-deployed backend yet — once it is, FRED
// follows automatically, same as the other three proxied APIs.
const FRED_PROXY_BASE = API_BASE_URL || "https://maximising-shareholder-value.jozsua-heng.workers.dev";

function coingeckoUrl(path, params) {
  const search = new URLSearchParams(params || {});
  if (IS_LOCAL_DEV) {
    if (typeof COINGECKO_API_KEY !== "undefined" && COINGECKO_API_KEY && COINGECKO_API_KEY !== "YOUR_COINGECKO_KEY_HERE") {
      search.set("x_cg_demo_api_key", COINGECKO_API_KEY);
    }
    return `https://api.coingecko.com/api/v3${path}?${search.toString()}`;
  }
  search.set("path", path);
  return `${API_BASE_URL}/api/coingecko?${search.toString()}`;
}

function fredUrl(seriesId, extraParams) {
  const search = new URLSearchParams({
    path: "/series/observations",
    series_id: seriesId,
    file_type: "json",
    sort_order: "desc",
    limit: "1",
    ...extraParams,
  });
  return `${FRED_PROXY_BASE}/api/fred?${search.toString()}`;
}

// Browsable only — no quotes ever fetched for these, so length is free.
// `accent` — a fixed decorative color per category (not theme-swapped,
// same idea as the logo badge) purely so the zero-cost browse grid reads
// as more distinct/designed instead of every category looking identical.
// Not a status color (doesn't mean good/bad), just a visual identifier.
// Each category bumped ~50% (12 -> 18 items, 2026-09-19) at Jozsua's
// request to make the homepage feel fuller — still zero API cost, this is
// name+ticker only (see the file-level comment above).
const BROWSE_CATEGORIES = [
  { id: "trending-tech", title: "Trending Tech", accent: "#6366f1", items: [["AAPL", "Apple"], ["MSFT", "Microsoft"], ["GOOGL", "Alphabet"], ["AMZN", "Amazon"], ["NVDA", "Nvidia"], ["META", "Meta"], ["ORCL", "Oracle"], ["ADBE", "Adobe"], ["INTC", "Intel"], ["CSCO", "Cisco"], ["UBER", "Uber"], ["ABNB", "Airbnb"], ["PYPL", "PayPal"], ["NOW", "ServiceNow"], ["PANW", "Palo Alto Networks"], ["MU", "Micron"], ["QCOM", "Qualcomm"], ["SPOT", "Spotify"]] },
  { id: "blue-chip", title: "Blue Chip", accent: "#0ea5e9", items: [["JNJ", "Johnson & Johnson"], ["PG", "Procter & Gamble"], ["KO", "Coca-Cola"], ["JPM", "JPMorgan Chase"], ["V", "Visa"], ["WMT", "Walmart"], ["MCD", "McDonald's"], ["DIS", "Disney"], ["HD", "Home Depot"], ["UNH", "UnitedHealth"], ["COST", "Costco"], ["PEP", "PepsiCo"], ["MA", "Mastercard"], ["NKE", "Nike"], ["MRK", "Merck"], ["ABT", "Abbott Labs"], ["LOW", "Lowe's"], ["TXN", "Texas Instruments"]] },
  { id: "dividend-payers", title: "Dividend Payers", accent: "#f59e0b", items: [["T", "AT&T"], ["XOM", "ExxonMobil"], ["VZ", "Verizon"], ["PFE", "Pfizer"], ["MO", "Altria"], ["IBM", "IBM"], ["CVX", "Chevron"], ["MMM", "3M"], ["KMI", "Kinder Morgan"], ["O", "Realty Income"], ["D", "Dominion Energy"], ["SO", "Southern Company"], ["ED", "Consolidated Edison"], ["MDT", "Medtronic"], ["GILD", "Gilead Sciences"], ["BMY", "Bristol-Myers Squibb"], ["NEE", "NextEra Energy"], ["WEC", "WEC Energy"]] },
  { id: "growth", title: "Growth", accent: "#ec4899", items: [["TSLA", "Tesla"], ["NFLX", "Netflix"], ["SHOP", "Shopify"], ["PLTR", "Palantir"], ["CRWD", "CrowdStrike"], ["AMD", "AMD"], ["RBLX", "Roblox"], ["DDOG", "Datadog"], ["ZS", "Zscaler"], ["NET", "Cloudflare"], ["SNOW", "Snowflake"], ["ROKU", "Roku"], ["COIN", "Coinbase"], ["MDB", "MongoDB"], ["U", "Unity"], ["HOOD", "Robinhood"], ["SOFI", "SoFi"], ["APP", "AppLovin"]] },
  { id: "etfs", title: "ETFs", accent: "#14b8a6", items: [["SPY", "S&P 500"], ["QQQ", "Nasdaq 100"], ["VTI", "Total Market"], ["DIA", "Dow Jones"], ["IWM", "Russell 2000"], ["VOO", "S&P 500 (Vanguard)"], ["ARKK", "ARK Innovation"], ["XLK", "Technology Sector"], ["XLF", "Financial Sector"], ["XLE", "Energy Sector"], ["EFA", "Developed Markets"], ["EEM", "Emerging Markets"], ["XLV", "Health Care Sector"], ["XLY", "Consumer Discretionary"], ["XLI", "Industrials Sector"], ["XLU", "Utilities Sector"]] },
  { id: "bond-etfs", title: "Bond ETFs", accent: "#8b5cf6", items: [["TLT", "20+Y Treasury"], ["BND", "Total Bond Market"], ["AGG", "US Aggregate Bond"], ["HYG", "High Yield Corp"], ["IEF", "7-10Y Treasury"], ["LQD", "Investment Grade Corp"], ["MUB", "National Muni Bond"], ["SHY", "1-3Y Treasury"], ["VCIT", "Intermediate Corp Bond"], ["EMB", "Emerging Markets Bond"], ["JNK", "High Yield Bond"], ["BIV", "Intermediate-Term Bond"], ["TIP", "TIPS (Inflation-Protected)"], ["SPTL", "Long-Term Treasury"], ["VGIT", "Intermediate Treasury"], ["FLOT", "Floating Rate Bond"], ["PFF", "Preferred Stock"], ["BSV", "Short-Term Bond"]] },
  // Added 2026-09-21 at Jozsua's request — commodities used to be mixed
  // into the world map's ticker strip (GLD/USO alongside country ETFs),
  // which didn't make sense once that strip became countries-only (see
  // MARKET_TICKERS below). All commodity exposure lives here now instead.
  { id: "commodities", title: "Commodities", accent: "#d97706", items: [["GLD", "Gold"], ["SLV", "Silver"], ["PPLT", "Platinum"], ["PALL", "Palladium"], ["USO", "Oil (WTI Crude)"], ["BNO", "Oil (Brent Crude)"], ["UNG", "Natural Gas"], ["DBA", "Agriculture"], ["CORN", "Corn"], ["WEAT", "Wheat"], ["SOYB", "Soybeans"], ["CANE", "Sugar"], ["JO", "Coffee"], ["CPER", "Copper"], ["URA", "Uranium Miners"], ["DBC", "Broad Commodities"], ["GSG", "Broad Commodities (GSCI)"], ["PDBC", "Broad Commodities (Diversified)"]] },
];

// Small, curated universe used ONLY to rank Winners/Losers/Most Active —
// the original 6-per-category set, kept separate from the (now much
// longer) browse lists above so ranking cost doesn't grow with them.
// Trimmed from 6 to 4 per category (36 -> 24 symbols, 2026-08-07) to cut
// real Finnhub usage — this is the single biggest cost center in the app
// (a first-ever visit to Winners/Losers/Most Active fires one quote call
// per symbol here, all at once). ETF/bond rows lost DIA/IWM and AGG/IEF
// specifically since DIA/IWM are already covered by the homepage's index
// strip (home.js loadIndexStrip) — no loss of information, just no
// double-fetching the same names two different ways.
const RANKING_STOCK_SYMBOLS = [
  ["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "Nvidia"], ["META", "Meta"],
  ["JNJ", "Johnson & Johnson"], ["PG", "Procter & Gamble"], ["JPM", "JPMorgan Chase"], ["WMT", "Walmart"],
  ["T", "AT&T"], ["XOM", "ExxonMobil"], ["PFE", "Pfizer"], ["IBM", "IBM"],
  ["TSLA", "Tesla"], ["NFLX", "Netflix"], ["PLTR", "Palantir"], ["AMD", "AMD"],
  ["SPY", "S&P 500"], ["QQQ", "Nasdaq 100"], ["VTI", "Total Market"], ["VOO", "S&P 500 (Vanguard)"],
  ["TLT", "20+Y Treasury"], ["BND", "Total Bond Market"], ["HYG", "High Yield Corp"], ["LQD", "Investment Grade Corp"],
];

const DYNAMIC_TABS = [
  { id: "winners", title: "Winners" },
  { id: "losers", title: "Losers" },
  { id: "active", title: "Most Active" },
];

const homeState = {
  activeTab: "trending-tech", // cheap default — a browse category costs zero API calls
  viewMode: "grid",
  quotes: {}, // ranking-universe symbol -> { symbol, name, quote }
  rankingLoaded: false,
  cryptoLoaded: false,
  marketTickers: {}, // symbol -> quote, from MARKET_TICKERS — read by worldMarkets.js too
  macroCountry: "USA", // ISO3 — which country the Macro tab is showing
};

const homeTabsEl = document.getElementById("homeTabs");
const homeContentEl = document.getElementById("homeContent");
const homeViewToggleEl = document.getElementById("homeViewToggle");
const homeNewsListEl = document.getElementById("homeNewsList");
const indexStripEl = document.getElementById("indexStrip");
const recentlyViewedRowEl = document.getElementById("recentlyViewedRow");
const recentlyViewedEmptyNoteEl = document.getElementById("recentlyViewedEmptyNote");
const watchlistRowEl = document.getElementById("watchlistRow");
const watchlistEmptyNoteEl = document.getElementById("watchlistEmptyNote");
const marketBreadthEl = document.getElementById("marketBreadth");
const learnBannerEl = document.getElementById("learnBanner");
const econCalendarContentEl = document.getElementById("econCalendarContent");
const earningsCalendarContentEl = document.getElementById("earningsCalendarContent");
const sectorHeatmapContentEl = document.getElementById("sectorHeatmapContent");

// One shared ticker list feeds BOTH the index strip AND the world map's
// per-exchange markers (worldMarkets.js reads homeState.marketTickers by
// symbol) — one render pass serves two UI surfaces. Country ETFs stand in
// for each exchange's real index since Finnhub's free tier doesn't offer
// live foreign indices (same reasoning as the original US-index proxies).
//
// Countries only (2026-09-21) — this used to also carry US indexes
// (QQQ/DIA/IWM), commodities (GLD/USO), and regional baskets (EFA/EEM),
// which didn't belong on a "which country's market is open" map/strip.
// Those seven moved into the ETFs/Commodities browse categories instead
// (see BROWSE_CATEGORIES above) — one ticker per country/exchange here
// now, matching worldMarkets.js's 13-entry EXCHANGES list 1:1.
// 3rd element is the flag, added 2026-09-21 so the sidebar list can show
// it alongside the country name (matches the flags already used on the
// map's own markers, in worldMarkets.js's EXCHANGES array).
const MARKET_TICKERS = [
  ["SPY", "United States", "🇺🇸"],
  ["EWC", "Canada", "🇨🇦"],
  ["EWZ", "Brazil", "🇧🇷"],
  ["EWU", "United Kingdom", "🇬🇧"],
  ["EWQ", "France", "🇫🇷"],
  ["EWG", "Germany", "🇩🇪"],
  ["EZA", "South Africa", "🇿🇦"],
  ["INDA", "India", "🇮🇳"],
  ["EWS", "Singapore", "🇸🇬"],
  ["MCHI", "China", "🇨🇳"],
  ["EWH", "Hong Kong", "🇭🇰"],
  ["EWJ", "Japan", "🇯🇵"],
  ["EWA", "Australia", "🇦🇺"],
];

// Illustrative sample prices/% changes — NOT live data. This used to fire
// 20 real Finnhub quote calls on every single home page visit regardless
// of whether the visitor did anything (the single biggest fixed API cost
// in the app). Replaced 2026-09-19 with a static snapshot so the map and
// sidebar look complete without spending free-tier budget just for
// someone loading the home page — see .github/ROADMAP.md for the
// tradeoff and when to reverse this. Shape matches Finnhub's real /quote
// response (`c` = price, `dp` = % change) so worldMarkets.js and
// renderMarketBreadth() don't need to know the difference.
const MARKET_TICKERS_SAMPLE = {
  SPY: { c: 748.32, dp: 0.42 },
  EWC: { c: 44.90, dp: 0.31 }, EWZ: { c: 33.27, dp: -0.67 },
  EWU: { c: 39.55, dp: 0.18 }, EWQ: { c: 42.03, dp: -0.22 },
  EWG: { c: 38.71, dp: 0.55 }, EZA: { c: 47.62, dp: -0.11 },
  INDA: { c: 55.48, dp: 0.73 }, EWS: { c: 27.19, dp: 0.09 },
  MCHI: { c: 58.34, dp: -0.94 }, EWH: { c: 24.86, dp: -0.42 },
  EWJ: { c: 76.20, dp: 0.61 }, EWA: { c: 26.55, dp: 0.14 },
};
// 2026-08-14 added 10 more (South Korea/Taiwan/Mexico/Switzerland/
// Netherlands/Spain/Italy/Indonesia/Silver/Natural Gas) to "fill up" this
// list; reverted 2026-08-27 — the taller sidebar stretched the map's flex
// row height, and since the SVG uses preserveAspectRatio to hold its own
// aspect ratio, the extra container height just became a visible empty
// gap below the actual map graphic rather than more visible content. Back
// to 20 so the sidebar roughly matches the map's natural height. If more
// tickers are wanted again, they need a layout change (e.g. a 3rd column,
// or letting the sidebar scroll independently) to avoid reintroducing the
// gap, not just appending to this array.

// The 11 SPDR Select Sector ETFs — the standard free way to see "how is
// each S&P 500 sector doing today" without a paid sector-index feed.
// Independent of BROWSE_CATEGORIES' "etfs" list (which only has 7 of
// these, chosen for general browsing, not as a complete/ordered set for
// a heatmap) — this list needs all 11, specifically.
const SECTOR_ETFS = [
  ["XLK", "Technology"], ["XLF", "Financials"], ["XLE", "Energy"],
  ["XLV", "Health Care"], ["XLY", "Consumer Discretionary"], ["XLP", "Consumer Staples"],
  ["XLI", "Industrials"], ["XLU", "Utilities"], ["XLB", "Materials"],
  ["XLRE", "Real Estate"], ["XLC", "Communication Services"],
];

// Hand-maintained on purpose (2026-09-19 roadmap note: "dates are known
// well in advance, low maintenance" — not worth a live feed for this).
// Every date below is a real, sourced date, not guessed:
// - FOMC meeting dates: federalreserve.gov's published 2026 schedule.
// - CPI release dates: bls.gov's published release schedule.
// Update this array periodically as dates pass / new ones are announced
// — there's no automatic expiry, so a stale list will just quietly stop
// being useful rather than erroring.
const ECON_CALENDAR_EVENTS = [
  { date: "2026-10-14", label: "CPI Release (Sept. data)", source: "bls.gov" },
  { date: "2026-10-27", label: "FOMC Meeting begins", source: "federalreserve.gov" },
  { date: "2026-10-28", label: "FOMC Rate Decision", source: "federalreserve.gov" },
  { date: "2026-11-10", label: "CPI Release (Oct. data)", source: "bls.gov" },
  { date: "2026-12-08", label: "FOMC Meeting begins", source: "federalreserve.gov" },
  { date: "2026-12-09", label: "FOMC Rate Decision", source: "federalreserve.gov" },
  { date: "2026-12-10", label: "CPI Release (Nov. data)", source: "bls.gov" },
];

function initHome() {
  buildTabs();
  buildViewToggle();
  switchTab(homeState.activeTab);
  loadMarketNews();
  loadMarketTickers();
  renderRecentlyViewed();
  renderWatchlist();
  renderEconCalendar();
  loadEarningsCalendar();
  loadSectorHeatmap();
  initHomeLayout();
}

// Learn banner wiring. The homepage briefly had a collapsible left
// sidebar (quick search, quick links, Watchlist/Recently Viewed) —
// Jozsua asked for it to be removed (2026-09-22, "it looks so bad").
// Watchlist and Recently Viewed moved into the main grid as their own
// cards instead; the sidebar's Quick Search and Quick Links were dropped
// entirely rather than relocated, since they duplicated things that
// already exist elsewhere (the header's own search box, the Learn
// banner, the Compare button, and the Macro tab).
function initHomeLayout() {
  learnBannerEl.addEventListener("click", () => goToHomeTab("learn"));
}

// Switches to the home view (if not already there) and selects a tab —
// used by the Learn banner and the Did You Know card's "Read more" link,
// both of which can be clicked from within the home view itself.
function goToHomeTab(tabId) {
  dashboard.classList.add("hidden");
  document.getElementById("compareView").classList.add("hidden");
  homeView.classList.remove("hidden");
  switchTab(tabId);
}

// Synchronous now (no fetch) — reads MARKET_TICKERS_SAMPLE instead of
// calling Finnhub. Clicking a chip still opens the real, live ticker page
// via loadTicker(); only this homepage snapshot is static.
function loadMarketTickers() {
  const results = MARKET_TICKERS.map(([symbol]) => {
    const quote = MARKET_TICKERS_SAMPLE[symbol];
    return quote ? { symbol, quote } : null;
  });

  indexStripEl.innerHTML = MARKET_TICKERS.map(([symbol, name, flag]) => {
    const quote = MARKET_TICKERS_SAMPLE[symbol];
    const dp = quote ? (quote.dp ?? 0) : 0;
    const valueClass = quote ? (dp >= 0 ? "positive" : "negative") : "muted";
    const valueText = quote ? `${formatCurrency(quote.c)} (${dp >= 0 ? "+" : ""}${dp.toFixed(2)}%)` : "···";
    return `<div class="index-chip" data-symbol="${symbol}"><span class="index-chip-name">${flag ? `${flag} ` : ""}${name}</span><span class="index-chip-value ${valueClass}">${valueText}</span></div>`;
  }).join("");

  results.forEach(r => { if (r) homeState.marketTickers[r.symbol] = r.quote; });

  Array.from(indexStripEl.children).forEach(chip => {
    chip.addEventListener("click", () => loadTicker(chip.dataset.symbol));
  });

  if (typeof renderWorldMarkets === "function") renderWorldMarkets();
  renderMarketBreadth(results.filter(Boolean));
}

// Zero extra API cost — reuses the same 20 quotes already fetched above.
// A quick "how's the world doing today" pulse using data that's fetched
// unconditionally anyway (unlike the ranking-tab universe, which stays
// lazy on purpose).
function renderMarketBreadth(results) {
  if (!marketBreadthEl) return;
  if (results.length === 0) { marketBreadthEl.innerHTML = ""; return; }

  const up = results.filter(r => (r.quote.dp ?? 0) > 0).length;
  const down = results.filter(r => (r.quote.dp ?? 0) < 0).length;
  const flat = results.length - up - down;
  const upPct = (up / results.length) * 100;

  const sorted = [...results].sort((a, b) => (b.quote.dp ?? 0) - (a.quote.dp ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const bestName = MARKET_TICKERS.find(([s]) => s === best.symbol)?.[1] || best.symbol;
  const worstName = MARKET_TICKERS.find(([s]) => s === worst.symbol)?.[1] || worst.symbol;

  let nextEventHtml = "";
  if (typeof getNextMarketEvent === "function") {
    const next = getNextMarketEvent();
    nextEventHtml = `<span class="muted">Next: <strong>${next.ex.city} ${next.label}</strong> in ${formatDuration(next.diffMin)}</span>`;
  }

  marketBreadthEl.innerHTML = `
    <div class="market-breadth-bar" title="${up} up · ${down} down · ${flat} flat, out of ${results.length} tracked global tickers">
      <div class="market-breadth-fill" style="width:${upPct}%"></div>
    </div>
    <div class="market-breadth-stats">
      <span><strong class="positive">${up}</strong> up · <strong class="negative">${down}</strong> down <span class="muted">(of ${results.length} tracked)</span></span>
      <span class="muted">Best: <strong class="positive">${bestName} ${(best.quote.dp ?? 0) >= 0 ? "+" : ""}${(best.quote.dp ?? 0).toFixed(1)}%</strong> · Worst: <strong class="negative">${worstName} ${(worst.quote.dp ?? 0).toFixed(1)}%</strong></span>
      ${nextEventHtml}
    </div>
  `;
}

// Zero API cost — hand-maintained real dates (see ECON_CALENDAR_EVENTS
// above for sourcing). Shows the next 4 upcoming events from today.
function renderEconCalendar() {
  if (!econCalendarContentEl) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = ECON_CALENDAR_EVENTS.filter(e => e.date >= todayStr).slice(0, 4);
  if (upcoming.length === 0) {
    econCalendarContentEl.innerHTML = '<p class="muted">No upcoming events on the list right now.</p>';
    return;
  }
  econCalendarContentEl.innerHTML = upcoming.map(e => {
    const d = new Date(`${e.date}T12:00:00Z`);
    const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `
      <div class="econ-calendar-row">
        <span class="econ-calendar-date">${dateLabel}</span>
        <span class="econ-calendar-label">${e.label}</span>
      </div>
    `;
  }).join("");
}

// One Finnhub call for the whole upcoming week (not per-symbol) — cheap.
// Finnhub's /calendar/earnings returns EVERY company reporting in the
// date range, including many microcaps/OTC tickers with no name attached
// (confirmed live) — filtered down to symbols this app already has a
// real name for (RANKING_STOCK_SYMBOLS + BROWSE_CATEGORIES), so the
// homepage shows recognizable companies, not a wall of unknown tickers.
function buildKnownSymbolNames() {
  const map = {};
  RANKING_STOCK_SYMBOLS.forEach(([symbol, name]) => { map[symbol] = name; });
  BROWSE_CATEGORIES.forEach(cat => cat.items.forEach(([symbol, name]) => { map[symbol] = name; }));
  return map;
}

function loadEarningsCalendar() {
  if (!earningsCalendarContentEl) return;
  const from = new Date();
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = d => d.toISOString().slice(0, 10);

  fetchJSON(finnhubUrl("/calendar/earnings", { from: fmt(from), to: fmt(to) }))
    .then(data => renderEarningsCalendar(data.earningsCalendar || []))
    .catch(() => { earningsCalendarContentEl.innerHTML = '<p class="muted">Couldn\'t load the earnings calendar right now.</p>'; });
}

function renderEarningsCalendar(items) {
  const knownNames = buildKnownSymbolNames();
  const known = items
    .filter(item => knownNames[item.symbol])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  if (known.length === 0) {
    earningsCalendarContentEl.innerHTML = '<p class="muted">No well-known companies reporting in the next 7 days.</p>';
    return;
  }

  earningsCalendarContentEl.innerHTML = known.map(item => {
    const d = new Date(`${item.date}T12:00:00Z`);
    const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const hourLabel = item.hour === "bmo" ? "Before open" : item.hour === "amc" ? "After close" : "";
    return `
      <button type="button" class="earnings-calendar-row" data-symbol="${item.symbol}">
        <span class="earnings-calendar-name"><strong>${knownNames[item.symbol]}</strong><span class="muted">${item.symbol}</span></span>
        <span class="earnings-calendar-meta">${dateLabel}${hourLabel ? ` · ${hourLabel}` : ""}</span>
      </button>
    `;
  }).join("");

  earningsCalendarContentEl.querySelectorAll(".earnings-calendar-row").forEach(row => {
    row.addEventListener("click", () => loadTicker(row.dataset.symbol));
  });
}

// 11 quote calls, staggered (same pattern as ensureRankingLoaded) — the
// only genuinely new live-data cost in phase 2 alongside the earnings
// calendar's one call. Fires once on home page load, cached for the
// session (no re-fetch on every tab switch).
let sectorHeatmapLoaded = false;
function loadSectorHeatmap() {
  if (!sectorHeatmapContentEl || sectorHeatmapLoaded) return;
  sectorHeatmapLoaded = true;
  const results = [];
  Promise.all(SECTOR_ETFS.map(([symbol, name], i) => new Promise(resolve => {
    setTimeout(async () => {
      try {
        const q = await fetchJSON(finnhubUrl("/quote", { symbol }));
        if (isNum(q.c) && q.c !== 0) results.push({ symbol, name, dp: q.dp ?? 0 });
      } catch {
        // leave this sector out of the heatmap rather than showing a wrong number
      }
      resolve();
    }, i * 40);
  }))).then(() => renderSectorHeatmap(results));
}

function renderSectorHeatmap(results) {
  if (results.length === 0) {
    sectorHeatmapContentEl.innerHTML = '<p class="muted">Couldn\'t load sector data right now.</p>';
    return;
  }
  const sorted = [...results].sort((a, b) => b.dp - a.dp);
  const maxAbs = Math.max(...sorted.map(r => Math.abs(r.dp)), 1);

  sectorHeatmapContentEl.innerHTML = `
    <div class="sector-heatmap-grid">
      ${sorted.map(r => {
        const intensity = Math.min(Math.abs(r.dp) / maxAbs, 1);
        const bg = r.dp >= 0
          ? `color-mix(in srgb, var(--positive) ${(intensity * 55).toFixed(0)}%, var(--bg-surface-2))`
          : `color-mix(in srgb, var(--negative) ${(intensity * 55).toFixed(0)}%, var(--bg-surface-2))`;
        return `
          <button type="button" class="sector-heatmap-tile" data-symbol="${r.symbol}" style="background:${bg}">
            <span class="sector-heatmap-name">${r.name}</span>
            <span class="sector-heatmap-value">${r.dp >= 0 ? "+" : ""}${r.dp.toFixed(2)}%</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
  sectorHeatmapContentEl.querySelectorAll(".sector-heatmap-tile").forEach(tile => {
    tile.addEventListener("click", () => loadTicker(tile.dataset.symbol));
  });
}

// Zero API cost — reads what script.js already saved to localStorage
// after each successful ticker load. Name-only chips, same as browse
// categories, so revisiting one is free until actually clicked.
function renderRecentlyViewed() {
  const recent = getRecentlyViewed();
  recentlyViewedEmptyNoteEl?.classList.toggle("hidden", recent.length > 0);
  if (recent.length === 0) {
    recentlyViewedRowEl.classList.add("hidden");
    recentlyViewedRowEl.innerHTML = "";
    return;
  }
  recentlyViewedRowEl.classList.remove("hidden");
  recentlyViewedRowEl.innerHTML = "";
  recent.forEach(({ symbol, name }) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "recently-viewed-chip";
    chip.innerHTML = `<strong>${symbol}</strong><span class="muted">${name}</span>`;
    chip.addEventListener("click", () => loadTicker(symbol));
    recentlyViewedRowEl.appendChild(chip);
  });
}

// Zero API cost, same as Recently Viewed — no live price shown, just
// name/symbol. Called on init and again by toggleWatchlist() (script.js)
// whenever the ☆ on a ticker page is clicked, so the homepage card stays
// in sync without a page reload.
function renderWatchlist() {
  const list = getWatchlist();
  watchlistEmptyNoteEl.classList.toggle("hidden", list.length > 0);
  if (list.length === 0) {
    watchlistRowEl.classList.add("hidden");
    watchlistRowEl.innerHTML = "";
    return;
  }
  watchlistRowEl.classList.remove("hidden");
  watchlistRowEl.innerHTML = "";
  list.forEach(({ symbol, name }) => {
    const chip = document.createElement("div");
    chip.className = "recently-viewed-chip watchlist-chip";
    chip.innerHTML = `
      <button type="button" class="watchlist-chip-main"><strong>${symbol}</strong><span class="muted">${name}</span></button>
      <button type="button" class="watchlist-chip-remove" aria-label="Remove ${symbol} from watchlist" title="Remove">×</button>
    `;
    chip.querySelector(".watchlist-chip-main").addEventListener("click", () => loadTicker(symbol));
    chip.querySelector(".watchlist-chip-remove").addEventListener("click", () => toggleWatchlist(symbol, name));
    watchlistRowEl.appendChild(chip);
  });
}

function buildTabs() {
  homeTabsEl.innerHTML = "";
  // "learn" is deliberately NOT in this list (2026-09-22) — Jozsua asked
  // for it to stop sitting as a peer of Winners/Losers/browse categories,
  // so it moved to its own banner (learnBanner, wired in initHomeLayout()
  // below) instead of a tab pill. switchTab("learn") still works exactly
  // the same either way — only how you GET there changed.
  const allTabs = [...DYNAMIC_TABS, ...BROWSE_CATEGORIES, { id: "crypto", title: "Crypto" }, { id: "supply-chain", title: "Supply Chain" }, { id: "macro", title: "Macro" }];
  allTabs.forEach(tab => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "home-tab" + (tab.id === homeState.activeTab ? " active" : "");
    btn.textContent = tab.title;
    btn.dataset.tabId = tab.id;
    btn.addEventListener("click", () => switchTab(tab.id));
    homeTabsEl.appendChild(btn);
  });
}

function buildViewToggle() {
  homeViewToggleEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      homeState.viewMode = btn.dataset.mode;
      homeViewToggleEl.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === btn));
      renderActiveTab();
    });
  });
}

async function switchTab(tabId) {
  homeState.activeTab = tabId;
  Array.from(homeTabsEl.children).forEach(btn => btn.classList.toggle("active", btn.dataset.tabId === tabId));
  learnBannerEl?.classList.toggle("active", tabId === "learn");

  if (tabId === "macro") {
    homeViewToggleEl.classList.add("hidden");
    renderMacroTab();
    return;
  }

  if (tabId === "supply-chain") {
    homeViewToggleEl.classList.add("hidden");
    renderSupplyChainTab();
    return;
  }

  if (tabId === "learn") {
    homeViewToggleEl.classList.add("hidden");
    renderLearnTab();
    return;
  }

  const isDynamic = DYNAMIC_TABS.some(t => t.id === tabId);
  const isCrypto = tabId === "crypto";

  // Grid/Heatmap only makes sense for the stock ranking tabs — browse
  // categories have no live % change to color by, and crypto has its own
  // dedicated table (buildCryptoTable) instead of the grid/heatmap tiles.
  homeViewToggleEl.classList.toggle("hidden", !isDynamic);

  if (!isDynamic && !isCrypto) {
    renderBrowseCategory(tabId);
    return;
  }

  homeContentEl.innerHTML = '<p class="muted">Loading...</p>';
  if (isDynamic) {
    await ensureRankingLoaded();
  } else {
    await ensureCryptoLoaded();
  }

  // The user may have clicked a different tab while this one was still
  // loading — only render if this is still the tab they're looking at.
  if (homeState.activeTab === tabId) renderActiveTab();
}

function renderBrowseCategory(tabId) {
  const cat = BROWSE_CATEGORIES.find(c => c.id === tabId);
  homeContentEl.innerHTML = "";
  if (!cat) return;
  homeContentEl.appendChild(buildSimpleGrid(cat.items, cat.accent));
}

async function ensureRankingLoaded() {
  if (homeState.rankingLoaded) return;
  await Promise.all(RANKING_STOCK_SYMBOLS.map(([symbol, name], i) => new Promise(resolve => {
    setTimeout(async () => {
      try {
        const q = await fetchJSON(finnhubUrl("/quote", { symbol }));
        if (isNum(q.c) && q.c !== 0) homeState.quotes[symbol] = { symbol, name, quote: q };
      } catch {
        // leave this symbol unset — it just won't appear in rankings
      }
      resolve();
    }, i * 30); // light stagger across the ranking universe
  })));
  await ensureCryptoLoaded(); // crypto is part of the ranking pool too
  homeState.rankingLoaded = true;
}

async function ensureCryptoLoaded() {
  if (homeState.cryptoLoaded) return;
  try {
    // /coins/markets instead of /simple/price — same single-call cost
    // (still one request for all 6 coins), but returns market cap, 24h
    // volume, circulating/max supply, and all-time-high/low — genuinely
    // crypto-specific data with no real stock equivalent, versus the old
    // endpoint's bare price + 24h change.
    const ids = CRYPTO_ITEMS.map(([symbol]) => CRYPTO_COINGECKO_IDS[symbol]).join(",");
    const data = await fetchJSON(coingeckoUrl("/coins/markets", { vs_currency: "usd", ids, order: "market_cap_desc" }));
    const byId = {};
    (Array.isArray(data) ? data : []).forEach(coin => { byId[coin.id] = coin; });
    CRYPTO_ITEMS.forEach(([symbol, name]) => {
      const coin = byId[CRYPTO_COINGECKO_IDS[symbol]];
      if (coin && isNum(coin.current_price)) {
        homeState.quotes[symbol] = {
          symbol, name,
          quote: { c: coin.current_price, dp: coin.price_change_percentage_24h ?? 0 },
          crypto: coin,
        };
      }
    });
    homeState.cryptoLoaded = true;
  } catch {
    // leave crypto symbols unset
  }
}

function renderActiveTab() {
  const tabId = homeState.activeTab;
  let items;

  if (tabId === "crypto") {
    items = CRYPTO_ITEMS.map(([symbol]) => homeState.quotes[symbol]).filter(Boolean);
  } else if (tabId === "winners" || tabId === "losers" || tabId === "active") {
    const all = Object.values(homeState.quotes);
    if (tabId === "winners") {
      items = all.filter(q => (q.quote.dp ?? 0) > 0).sort((a, b) => (b.quote.dp ?? 0) - (a.quote.dp ?? 0)).slice(0, 12);
    } else if (tabId === "losers") {
      items = all.filter(q => (q.quote.dp ?? 0) < 0).sort((a, b) => (a.quote.dp ?? 0) - (b.quote.dp ?? 0)).slice(0, 12);
    } else {
      items = [...all].sort((a, b) => Math.abs(b.quote.dp ?? 0) - Math.abs(a.quote.dp ?? 0)).slice(0, 12);
    }
  } else {
    homeContentEl.innerHTML = "";
    return;
  }

  homeContentEl.innerHTML = "";

  if (items.length === 0) {
    homeContentEl.innerHTML = '<p class="muted">No data available right now — this can happen if the free data tier is temporarily rate-limited. Try switching tabs again in a moment.</p>';
    return;
  }

  // Crypto gets its own table instead of the plain price/% tiles used for
  // stocks — market cap, volume, supply, and distance from all-time-high
  // are the numbers people actually look for with crypto and don't have
  // a real stock-page equivalent, so reusing the stock tile made the tab
  // feel thin. buildGrid/buildHeatmap stay unused for crypto now.
  homeContentEl.appendChild(tabId === "crypto" ? buildCryptoTable(items) : (homeState.viewMode === "heatmap" ? buildHeatmap(items) : buildGrid(items)));

  if (tabId === "active") {
    const note = document.createElement("p");
    note.className = "muted small home-note";
    note.textContent = "Ranked by size of today's price move — real trading volume isn't available on the free data tier.";
    homeContentEl.appendChild(note);
  }
}

function formatCompactUsd(v) {
  if (!isNum(v)) return "N/A";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString()}`;
}

function formatCompactSupply(v) {
  if (!isNum(v)) return "N/A";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toLocaleString();
}

function buildCryptoTable(items) {
  const wrap = document.createElement("div");
  wrap.className = "crypto-table-scroll";
  const table = document.createElement("table");
  table.className = "crypto-table";

  const theadRow = ["Coin", "Price", "24h", "Market Cap", "24h Volume", "Circulating Supply", "From All-Time High"];
  table.innerHTML = `<thead><tr>${theadRow.map(h => `<th>${h}</th>`).join("")}</tr></thead>`;

  const tbody = document.createElement("tbody");
  items
    .slice()
    .sort((a, b) => (b.crypto?.market_cap ?? 0) - (a.crypto?.market_cap ?? 0))
    .forEach(({ symbol, name, quote, crypto }) => {
      const row = document.createElement("tr");
      row.className = "crypto-table-row";
      row.addEventListener("click", () => loadTicker(symbol));

      const dp = quote.dp ?? 0;
      const athPct = crypto && isNum(crypto.ath_change_percentage) ? crypto.ath_change_percentage : null;
      const supplyPct = crypto && isNum(crypto.circulating_supply) && isNum(crypto.max_supply) && crypto.max_supply > 0
        ? (crypto.circulating_supply / crypto.max_supply) * 100 : null;

      row.innerHTML = `
        <td><strong>${name}</strong> <span class="muted small">${crypto?.symbol ? crypto.symbol.toUpperCase() : displaySymbol(symbol)}</span></td>
        <td>${formatCurrency(quote.c)}</td>
        <td class="${dp >= 0 ? "positive" : "negative"}">${dp >= 0 ? "+" : ""}${dp.toFixed(2)}%</td>
        <td>${formatCompactUsd(crypto?.market_cap)}${crypto?.market_cap_rank ? ` <span class="muted small">#${crypto.market_cap_rank}</span>` : ""}</td>
        <td>${formatCompactUsd(crypto?.total_volume)}</td>
        <td>${formatCompactSupply(crypto?.circulating_supply)}${supplyPct !== null ? ` <span class="muted small">(${supplyPct.toFixed(0)}% of max)</span>` : ""}</td>
        <td class="${athPct !== null && athPct >= -1 ? "positive" : ""}">${athPct !== null ? `${athPct.toFixed(1)}%` : "N/A"}</td>
      `;
      tbody.appendChild(row);
    });
  table.appendChild(tbody);
  wrap.appendChild(table);

  const note = document.createElement("p");
  note.className = "muted small home-note";
  note.textContent = "Market cap, volume, supply, and all-time-high data via CoinGecko. \"From All-Time High\" shows how far below (or, rarely, above) each coin's record price it's currently trading.";

  const outer = document.createElement("div");
  outer.appendChild(wrap);
  outer.appendChild(note);
  return outer;
}

// Name + ticker only — no quote, no fetch. Used for the browse categories.
function buildSimpleGrid(items, accent) {
  const row = document.createElement("div");
  row.className = "home-chip-row home-chip-row-tab";
  items.forEach(([symbol, name]) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "home-chip home-chip-simple";
    if (accent) chip.style.setProperty("--chip-accent", accent);
    chip.innerHTML = `
      <span class="home-chip-name">${name}</span>
      <span class="home-chip-symbol">${displaySymbol(symbol)}</span>
    `;
    chip.addEventListener("click", () => loadTicker(symbol));
    row.appendChild(chip);
  });
  return row;
}

function buildGrid(items) {
  const row = document.createElement("div");
  row.className = "home-chip-row home-chip-row-tab";
  items.forEach(({ symbol, name, quote }) => {
    const chip = document.createElement("button");
    chip.type = "button";
    const change = quote.dp ?? 0;
    const up = change >= 0;
    chip.className = "home-chip " + (up ? "chip-up" : "chip-down");
    chip.innerHTML = `
      <span class="home-chip-name">${name}</span>
      <span class="home-chip-symbol">${displaySymbol(symbol)}</span>
      <span class="home-chip-price ${up ? "positive" : "negative"}">
        <span class="home-chip-arrow">${up ? "▲" : "▼"}</span>${formatCurrency(quote.c)}
        <span class="home-chip-pct">${up ? "+" : ""}${change.toFixed(1)}%</span>
      </span>
    `;
    chip.addEventListener("click", () => loadTicker(symbol));
    row.appendChild(chip);
  });
  return row;
}

function buildHeatmap(items) {
  const grid = document.createElement("div");
  grid.className = "heatmap-grid";
  items.forEach(({ symbol, name, quote }) => {
    const change = quote.dp ?? 0;
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "heatmap-tile";
    tile.style.background = heatColor(change);
    tile.title = `${name} — ${formatCurrency(quote.c)}`;
    tile.innerHTML = `
      <span class="heatmap-symbol">${displaySymbol(symbol)}</span>
      <span class="heatmap-change">${change >= 0 ? "+" : ""}${change.toFixed(1)}%</span>
    `;
    tile.addEventListener("click", () => loadTicker(symbol));
    grid.appendChild(tile);
  });
  return grid;
}

// Uniform tile size (not sized by market cap like a "real" treemap would
// be — that needs profile2 data for every symbol shown, doubling
// requests for a homepage feature). Color intensity carries the signal.
function heatColor(changePct) {
  const clamped = Math.max(-8, Math.min(8, changePct || 0));
  const intensity = 0.18 + (Math.abs(clamped) / 8) * 0.6;
  return clamped >= 0 ? `rgba(27,175,122,${intensity})` : `rgba(208,59,59,${intensity})`;
}

// ---- Macro tab (FRED for the US, World Bank for everyone else) ----
// US stays on FRED deliberately — it's monthly/quarterly and far more
// current than World Bank's mostly-annual series, so switching the US
// itself over would be a real regression, not just a broader feature.
// World Bank only covers the other 4 default countries (pillar 4,
// 2026-09-21) — see .github (org repo) ROADMAP.md/TODO.md for the
// country/indicator decisions this was scoped against.
const MACRO_SERIES = [
  { id: "FEDFUNDS", label: "Fed Funds Rate", unit: "%", params: {} },
  { id: "CPIAUCSL", label: "Inflation (CPI, YoY)", unit: "%", params: { units: "pc1" } },
  { id: "UNRATE", label: "Unemployment Rate", unit: "%", params: {} },
  { id: "DGS10", label: "10-Year Treasury Yield", unit: "%", params: {} },
  // Added 2026-08-27 — same FRED key, only fetched when this tab is
  // opened (already lazy), so more indicators here don't add any
  // always-on cost, just more content when someone actually visits.
  { id: "MORTGAGE30US", label: "30-Year Mortgage Rate", unit: "%", params: {} },
  { id: "M2SL", label: "M2 Money Supply (YoY)", unit: "%", params: { units: "pc1" } },
  { id: "UMCSENT", label: "Consumer Sentiment", unit: "", params: {} },
  { id: "DCOILWTICO", label: "Crude Oil (WTI)", unit: "", prefix: "$", params: {} },
];

// Default country set decided 2026-09-21 (Jozsua picked "major global
// economies" over featuring his own footprint) — a full country picker
// for anywhere else is a later fast-follow, not this first pass.
const MACRO_COUNTRIES = [
  { iso3: "USA", label: "United States", flag: "🇺🇸", source: "fred" },
  { iso3: "CHN", label: "China", flag: "🇨🇳", source: "worldbank" },
  { iso3: "DEU", label: "Germany", flag: "🇩🇪", source: "worldbank" },
  { iso3: "JPN", label: "Japan", flag: "🇯🇵", source: "worldbank" },
  { iso3: "GBR", label: "United Kingdom", flag: "🇬🇧", source: "worldbank" },
];

// World Bank indicator codes — chosen after live-testing several
// candidates: policy/lending interest rates (FR.INR.RINR, FR.INR.LEND)
// come back null for the US/UK/Germany/Japan in recent years (World
// Bank's own reporting gap for advanced economies, confirmed directly),
// so a rate indicator was swapped for current account balance, which
// has real recent data for all 5 countries.
const WORLD_BANK_INDICATORS = [
  { id: "NY.GDP.MKTP.KD.ZG", label: "GDP Growth", unit: "%" },
  { id: "FP.CPI.TOTL.ZG", label: "Inflation (CPI, YoY)", unit: "%" },
  { id: "SL.UEM.TOTL.ZS", label: "Unemployment Rate", unit: "%" },
  { id: "BN.CAB.XOKA.GD.ZS", label: "Current Account Balance", unit: "% of GDP" },
];

function worldBankUrl(indicatorId, countryIso3) {
  const search = new URLSearchParams({
    path: `/country/${countryIso3}/indicator/${indicatorId}`,
    format: "json",
    per_page: "6", // a few years back, in case the latest is null
  });
  return `${API_BASE_URL}/api/worldbank?${search.toString()}`;
}

function buildMacroCountryPicker() {
  const row = document.createElement("div");
  row.className = "macro-country-picker";
  MACRO_COUNTRIES.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "macro-country-btn" + (c.iso3 === homeState.macroCountry ? " active" : "");
    btn.textContent = `${c.flag} ${c.label}`;
    btn.addEventListener("click", () => {
      if (homeState.macroCountry === c.iso3) return;
      homeState.macroCountry = c.iso3;
      renderMacroTab();
    });
    row.appendChild(btn);
  });
  return row;
}

function buildIndicatorCard(label, value, unit, prefix, dateLabel) {
  const card = document.createElement("div");
  card.className = "indicator";
  const labelEl = document.createElement("div");
  labelEl.className = "indicator-label";
  labelEl.textContent = label;
  const valueEl = document.createElement("div");
  valueEl.className = "indicator-value";
  card.appendChild(labelEl);
  if (isNum(value)) {
    valueEl.textContent = `${prefix || ""}${value.toFixed(2)}${unit}`;
    card.appendChild(valueEl);
    const dateNote = document.createElement("div");
    dateNote.className = "macro-date";
    dateNote.textContent = `As of ${dateLabel}`;
    card.appendChild(dateNote);
  } else {
    valueEl.textContent = "N/A";
    card.appendChild(valueEl);
  }
  return card;
}

async function renderMacroTab() {
  const country = MACRO_COUNTRIES.find(c => c.iso3 === homeState.macroCountry) || MACRO_COUNTRIES[0];

  homeContentEl.innerHTML = "";
  homeContentEl.appendChild(buildMacroCountryPicker());
  const loading = document.createElement("p");
  loading.className = "muted";
  loading.textContent = "Loading...";
  homeContentEl.appendChild(loading);

  if (country.source === "fred") {
    if (typeof FRED_API_KEY === "undefined" || !FRED_API_KEY || FRED_API_KEY === "YOUR_FRED_KEY_HERE") {
      loading.textContent = "Add a free FRED API key to config.js to enable this tab (Fed funds rate, inflation, unemployment, 10-year treasury yield). See README.md.";
      return;
    }

    const results = await Promise.allSettled(MACRO_SERIES.map(async series => {
      const data = await fetchJSON(fredUrl(series.id, series.params));
      const obs = data.observations && data.observations[0];
      return { value: obs ? parseFloat(obs.value) : null, date: obs ? obs.date : null };
    }));
    if (homeState.macroCountry !== country.iso3) return; // switched countries while this was in flight

    const grid = document.createElement("div");
    grid.className = "grid macro-grid";
    results.forEach((r, i) => {
      const series = MACRO_SERIES[i];
      const ok = r.status === "fulfilled" && isNum(r.value.value);
      grid.appendChild(buildIndicatorCard(series.label, ok ? r.value.value : null, series.unit, series.prefix, ok ? r.value.date : null));
    });

    homeContentEl.innerHTML = "";
    homeContentEl.appendChild(buildMacroCountryPicker());
    homeContentEl.appendChild(grid);

    const note = document.createElement("p");
    note.className = "muted small home-note";
    note.textContent = "US economic indicators from the Federal Reserve (FRED). These update monthly or quarterly, not daily — don't expect them to move on every visit.";
    homeContentEl.appendChild(note);
    return;
  }

  // World Bank path — genuinely free, no key needed (see .github repo's
  // API_RESEARCH.md). Figures are annual, so "As of" here means the
  // most recent year World Bank has a real (non-null) value for, not
  // necessarily this year — picks the first non-null entry from a small
  // recent-years page rather than assuming the latest year is populated.
  const results = await Promise.allSettled(WORLD_BANK_INDICATORS.map(async ind => {
    const data = await fetchJSON(worldBankUrl(ind.id, country.iso3));
    const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
    const latest = rows.find(row => isNum(row.value));
    return latest ? { value: latest.value, date: latest.date } : { value: null, date: null };
  }));
  if (homeState.macroCountry !== country.iso3) return;

  const grid = document.createElement("div");
  grid.className = "grid macro-grid";
  results.forEach((r, i) => {
    const ind = WORLD_BANK_INDICATORS[i];
    const ok = r.status === "fulfilled" && isNum(r.value.value);
    grid.appendChild(buildIndicatorCard(ind.label, ok ? r.value.value : null, ind.unit, null, ok ? r.value.date : null));
  });

  homeContentEl.innerHTML = "";
  homeContentEl.appendChild(buildMacroCountryPicker());
  homeContentEl.appendChild(grid);

  const note = document.createElement("p");
  note.className = "muted small home-note";
  note.textContent = `${country.label}'s economic indicators from the World Bank. These are annual figures, not monthly like the US/FRED tab — "as of" the most recent year with real data, which can lag a year or more.`;
  homeContentEl.appendChild(note);
}

const NEWS_CATEGORY_COLORS = {
  business: "#1baf7a", general: "#7ea0ff", forex: "#e0ab2e", crypto: "#c77dff", merger: "#e66767", technology: "#3ddc84",
};

function loadMarketNews() {
  fetchJSON(finnhubUrl("/news", { category: "general" }))
    .then(items => renderHomeNews(items.slice(0, 9)))
    .catch(() => { homeNewsListEl.innerHTML = '<p class="muted">Couldn\'t load market news right now.</p>'; });
}

// Richer visual treatment than the plain list used elsewhere (ticker-page
// company news) — same /news response, no extra API cost, just using
// more of what Finnhub already returns (image, category) plus a featured
// "hero" story up top. Falls back to a colored initial-letter badge if an
// item has no image or its image fails to load.
function renderHomeNews(items) {
  homeNewsListEl.innerHTML = "";
  if (!items || items.length === 0) {
    homeNewsListEl.innerHTML = '<p class="muted">No recent news found.</p>';
    return;
  }

  const sorted = [...items].sort((a, b) => b.datetime - a.datetime);
  const [hero, ...rest] = sorted;

  const wrap = document.createElement("div");
  wrap.className = "home-news-wrap";

  wrap.appendChild(buildNewsCard(hero, true));

  const grid = document.createElement("div");
  grid.className = "home-news-grid";
  rest.forEach(item => grid.appendChild(buildNewsCard(item, false)));
  wrap.appendChild(grid);

  homeNewsListEl.appendChild(wrap);
}

function buildNewsCard(item, isHero) {
  const source = item.source || "Unknown";
  const card = document.createElement("a");
  card.className = isHero ? "home-news-hero" : "home-news-card";
  card.href = item.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const media = document.createElement("div");
  media.className = isHero ? "home-news-hero-media" : "home-news-card-media";
  if (item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => { media.innerHTML = ""; media.style.background = colorFromString(source); media.textContent = source.charAt(0).toUpperCase(); };
    media.appendChild(img);
  } else {
    media.style.background = colorFromString(source);
    media.textContent = source.charAt(0).toUpperCase();
  }
  card.appendChild(media);

  const body = document.createElement("div");
  body.className = "home-news-body";

  const metaRow = document.createElement("div");
  metaRow.className = "home-news-meta-row";
  if (item.category) {
    const catBadge = document.createElement("span");
    catBadge.className = "home-news-category";
    catBadge.style.color = NEWS_CATEGORY_COLORS[item.category] || "var(--accent)";
    catBadge.style.borderColor = NEWS_CATEGORY_COLORS[item.category] || "var(--accent)";
    catBadge.textContent = item.category;
    metaRow.appendChild(catBadge);
  }
  const metaText = document.createElement("span");
  metaText.className = "muted small";
  metaText.textContent = `${source} · ${formatRelativeTime(new Date((item.datetime || 0) * 1000))}`;
  metaRow.appendChild(metaText);

  const headline = document.createElement("div");
  headline.className = isHero ? "home-news-hero-headline" : "home-news-card-headline";
  headline.textContent = item.headline || "";

  body.appendChild(metaRow);
  body.appendChild(headline);
  if (isHero && item.summary) {
    const summary = document.createElement("p");
    summary.className = "home-news-hero-summary muted small";
    summary.textContent = item.summary;
    body.appendChild(summary);
  }
  card.appendChild(body);

  return card;
}

// ---- "How to use $MSV" modal — paginated, left/right through 5 slides ----
const HOW_TO_SLIDES = [
  { icon: "🔍", title: "Search anything", body: `Type any company, ticker, or crypto symbol — "Apple", "AAPL", "BTC" — into the search box up top. You'll get price, valuation, financial health, analyst views, and a plain-English Outlook, all on one page.` },
  { icon: "❓", title: "Hover the (?) icons", body: "Every indicator on this site has one. Hover it for what the number means and why it matters, in plain English — no finance degree required." },
  { icon: "🗂️", title: "Browse for ideas", body: "No ticker in mind? Use the tabs below — Trending Tech, Blue Chip, ETFs, Bond ETFs, and more — or check Winners/Losers/Most Active for what's moving today." },
  { icon: "⚖️", title: "Compare side by side", body: "Use the Compare button up top to put up to 4 tickers side by side and see how they stack up against each other." },
  { icon: "🌎", title: "Check the bigger picture", body: "The Macro tab covers the economic backdrop — interest rates, inflation, unemployment — that moves the whole market, not just one stock." },
];

function initHowToModal() {
  const trigger = document.getElementById("howToTrigger");
  const overlay = document.getElementById("howToModalOverlay");
  const modal = document.getElementById("howToModal");
  const closeBtn = document.getElementById("howToModalClose");
  const prevBtn = document.getElementById("howToPrev");
  const nextBtn = document.getElementById("howToNext");
  const slidesEl = document.getElementById("howToSlides");
  const dotsEl = document.getElementById("howToDots");
  if (!trigger || !overlay || !modal) return;

  let index = 0;

  slidesEl.innerHTML = HOW_TO_SLIDES.map((s, i) => `
    <div class="how-to-slide${i === 0 ? " active" : ""}" data-slide="${i}">
      <div class="how-to-slide-icon">${s.icon}</div>
      <div class="how-to-slide-num">${i + 1} / ${HOW_TO_SLIDES.length}</div>
      <h3>${s.title}</h3>
      <p>${s.body}</p>
    </div>
  `).join("");

  dotsEl.innerHTML = HOW_TO_SLIDES.map((_, i) =>
    `<button type="button" class="how-to-dot${i === 0 ? " active" : ""}" data-slide="${i}" aria-label="Go to step ${i + 1}"></button>`
  ).join("");

  const slideEls = slidesEl.querySelectorAll(".how-to-slide");
  const dotEls = dotsEl.querySelectorAll(".how-to-dot");

  function showSlide(i) {
    index = Math.max(0, Math.min(HOW_TO_SLIDES.length - 1, i));
    slideEls.forEach((el, idx) => el.classList.toggle("active", idx === index));
    dotEls.forEach((el, idx) => el.classList.toggle("active", idx === index));
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === HOW_TO_SLIDES.length - 1 ? "Done ✓" : "Next ›";
  }

  function open() {
    showSlide(0);
    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");
  }
  function close() {
    overlay.classList.add("hidden");
    modal.classList.add("hidden");
  }

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);
  prevBtn.addEventListener("click", () => showSlide(index - 1));
  nextBtn.addEventListener("click", () => (index === HOW_TO_SLIDES.length - 1 ? close() : showSlide(index + 1)));
  dotEls.forEach(dot => dot.addEventListener("click", () => showSlide(parseInt(dot.dataset.slide, 10))));
  document.addEventListener("keydown", e => {
    if (modal.classList.contains("hidden")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") showSlide(index + 1);
    if (e.key === "ArrowLeft") showSlide(index - 1);
  });
}

initHome();
initHowToModal();
