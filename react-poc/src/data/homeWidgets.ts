// data/homeWidgets.ts — the homepage's index strip (static sample quotes), sector
// tiles, forex pairs and the hand-maintained economic calendar. Copied from
// ../../home.js (lines 158–274).

export const MARKET_TICKERS = [
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
export const MARKET_TICKERS_SAMPLE = {
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
export const SECTOR_ETFS = [
  ["XLK", "Technology"], ["XLF", "Financials"], ["XLE", "Energy"],
  ["XLV", "Health Care"], ["XLY", "Consumer Discretionary"], ["XLP", "Consumer Staples"],
  ["XLI", "Industrials"], ["XLU", "Utilities"], ["XLB", "Materials"],
  ["XLRE", "Real Estate"], ["XLC", "Communication Services"],
];

// 2026-10-02 homepage addition: Finnhub's free tier has zero forex
// coverage (unchanged — see root CLAUDE.md), but Twelve Data's free tier
// DOES support forex quotes, confirmed live 2026-09-24 (see TODO.md's
// homepage-brainstorm list) and re-confirmed directly against production
// before building this (EUR/USD, USD/SGD, USD/JPY all returned real
// quotes). 6 major pairs, one person's-currency-first ordering (USD
// pairs people actually look up, not alphabetical).
export const FOREX_PAIRS = [
  ["EUR/USD", "Euro"], ["GBP/USD", "British Pound"], ["USD/JPY", "Japanese Yen"],
  ["USD/SGD", "Singapore Dollar"], ["USD/AUD", "Australian Dollar"], ["USD/CHF", "Swiss Franc"],
];

// Hand-maintained on purpose (2026-09-19 roadmap note: "dates are known
// well in advance, low maintenance" — not worth a live feed for this).
// Expanded 2026-09-26 (Jozsua: "more dates, clickable links"). Every date
// below was read directly off the publisher's own schedule page that day,
// not guessed — and each row links to that same page:
// - FOMC: federalreserve.gov/monetarypolicy/fomccalendars.htm
// - CPI / PPI / Jobs report / JOLTS: bls.gov/schedule/news_release/*.htm
// - GDP / Personal Income & Outlays (PCE inflation): bea.gov/news/schedule
// BLS/BEA only publish a few months ahead, so this list ends around the
// year-end. Update it periodically — there's no automatic expiry, so a
// stale list just quietly stops being useful rather than erroring.
export const ECON_SOURCES = {
  fomc: { cat: "Fed", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
  cpi: { cat: "Inflation", url: "https://www.bls.gov/schedule/news_release/cpi.htm" },
  ppi: { cat: "Inflation", url: "https://www.bls.gov/schedule/news_release/ppi.htm" },
  pce: { cat: "Inflation", url: "https://www.bea.gov/news/schedule" },
  jobs: { cat: "Jobs", url: "https://www.bls.gov/schedule/news_release/empsit.htm" },
  jolts: { cat: "Jobs", url: "https://www.bls.gov/schedule/news_release/jolts.htm" },
  gdp: { cat: "Growth", url: "https://www.bea.gov/news/schedule" },
};
export const ECON_CALENDAR_EVENTS = [
  { date: "2026-09-30", label: "GDP, Q2 (third estimate)", src: "gdp" },
  { date: "2026-09-30", label: "PCE inflation — Personal Income & Outlays (Aug.)", src: "pce" },
  { date: "2026-10-02", label: "Jobs report (Sept. data)", src: "jobs" },
  { date: "2026-10-14", label: "CPI Release (Sept. data)", src: "cpi" },
  { date: "2026-10-15", label: "PPI Release (Sept. data)", src: "ppi" },
  { date: "2026-10-27", label: "FOMC Meeting begins", src: "fomc" },
  { date: "2026-10-28", label: "FOMC Rate Decision", src: "fomc" },
  { date: "2026-10-29", label: "GDP, Q3 (advance estimate)", src: "gdp" },
  { date: "2026-10-29", label: "PCE inflation — Personal Income & Outlays (Sept.)", src: "pce" },
  { date: "2026-11-03", label: "JOLTS job openings (Sept. data)", src: "jolts" },
  { date: "2026-11-06", label: "Jobs report (Oct. data)", src: "jobs" },
  { date: "2026-11-10", label: "CPI Release (Oct. data)", src: "cpi" },
  { date: "2026-11-13", label: "PPI Release (Oct. data)", src: "ppi" },
  { date: "2026-11-25", label: "GDP, Q3 (second estimate)", src: "gdp" },
  { date: "2026-11-25", label: "PCE inflation — Personal Income & Outlays (Oct.)", src: "pce" },
  { date: "2026-12-01", label: "JOLTS job openings (Oct. data)", src: "jolts" },
  { date: "2026-12-04", label: "Jobs report (Nov. data)", src: "jobs" },
  { date: "2026-12-08", label: "FOMC Meeting begins", src: "fomc" },
  { date: "2026-12-09", label: "FOMC Rate Decision", src: "fomc" },
  { date: "2026-12-10", label: "CPI Release (Nov. data)", src: "cpi" },
  { date: "2026-12-15", label: "PPI Release (Nov. data)", src: "ppi" },
  { date: "2026-12-23", label: "GDP, Q3 (third estimate)", src: "gdp" },
  { date: "2026-12-23", label: "PCE inflation — Personal Income & Outlays (Nov.)", src: "pce" },
  { date: "2027-01-26", label: "FOMC Meeting begins", src: "fomc" },
  { date: "2027-01-27", label: "FOMC Rate Decision", src: "fomc" },
];

