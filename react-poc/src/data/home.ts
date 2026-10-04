// data/home.ts — the homepage's browse categories and the ranking universe for the
// Winners / Losers / Most Active tabs. Copied from ../../home.js (lines 73–105).

import type { BrowseCategory } from "./screener";

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { id: "trending-tech", title: "Trending Tech", accent: "#6366f1", items: [["AAPL", "Apple"], ["MSFT", "Microsoft"], ["GOOGL", "Alphabet"], ["AMZN", "Amazon"], ["NVDA", "Nvidia"], ["META", "Meta"], ["ORCL", "Oracle"], ["ADBE", "Adobe"], ["INTC", "Intel"], ["CSCO", "Cisco"], ["UBER", "Uber"], ["ABNB", "Airbnb"], ["PYPL", "PayPal"], ["NOW", "ServiceNow"], ["PANW", "Palo Alto Networks"], ["MU", "Micron"], ["QCOM", "Qualcomm"], ["SPOT", "Spotify"], ["CRM", "Salesforce"], ["AMAT", "Applied Materials"], ["LRCX", "Lam Research"], ["ANET", "Arista Networks"], ["WDAY", "Workday"], ["ADSK", "Autodesk"]] },
  { id: "blue-chip", title: "Blue Chip", accent: "#0ea5e9", items: [["JNJ", "Johnson & Johnson"], ["PG", "Procter & Gamble"], ["KO", "Coca-Cola"], ["JPM", "JPMorgan Chase"], ["V", "Visa"], ["WMT", "Walmart"], ["MCD", "McDonald's"], ["DIS", "Disney"], ["HD", "Home Depot"], ["UNH", "UnitedHealth"], ["COST", "Costco"], ["PEP", "PepsiCo"], ["MA", "Mastercard"], ["NKE", "Nike"], ["MRK", "Merck"], ["ABT", "Abbott Labs"], ["LOW", "Lowe's"], ["TXN", "Texas Instruments"], ["BAC", "Bank of America"], ["GS", "Goldman Sachs"], ["CAT", "Caterpillar"], ["HON", "Honeywell"], ["UPS", "UPS"], ["CL", "Colgate-Palmolive"]] },
  { id: "dividend-payers", title: "Dividend Payers", accent: "#f59e0b", items: [["T", "AT&T"], ["XOM", "ExxonMobil"], ["VZ", "Verizon"], ["PFE", "Pfizer"], ["MO", "Altria"], ["IBM", "IBM"], ["CVX", "Chevron"], ["MMM", "3M"], ["KMI", "Kinder Morgan"], ["O", "Realty Income"], ["D", "Dominion Energy"], ["SO", "Southern Company"], ["ED", "Consolidated Edison"], ["MDT", "Medtronic"], ["GILD", "Gilead Sciences"], ["BMY", "Bristol-Myers Squibb"], ["NEE", "NextEra Energy"], ["WEC", "WEC Energy"], ["PM", "Philip Morris International"], ["DUK", "Duke Energy"], ["AEP", "American Electric Power"], ["PSA", "Public Storage"], ["SYY", "Sysco"], ["ADM", "Archer-Daniels-Midland"]] },
  { id: "growth", title: "Growth", accent: "#ec4899", items: [["TSLA", "Tesla"], ["NFLX", "Netflix"], ["SHOP", "Shopify"], ["PLTR", "Palantir"], ["CRWD", "CrowdStrike"], ["AMD", "AMD"], ["RBLX", "Roblox"], ["DDOG", "Datadog"], ["ZS", "Zscaler"], ["NET", "Cloudflare"], ["SNOW", "Snowflake"], ["ROKU", "Roku"], ["COIN", "Coinbase"], ["MDB", "MongoDB"], ["U", "Unity"], ["HOOD", "Robinhood"], ["SOFI", "SoFi"], ["APP", "AppLovin"], ["AFRM", "Affirm"], ["DKNG", "DraftKings"], ["UPST", "Upstart"], ["TTD", "The Trade Desk"], ["BILL", "BILL Holdings"], ["ASAN", "Asana"]] },
  { id: "etfs", title: "ETFs", accent: "#14b8a6", items: [["SPY", "S&P 500"], ["QQQ", "Nasdaq 100"], ["VTI", "Total Market"], ["DIA", "Dow Jones"], ["IWM", "Russell 2000"], ["VOO", "S&P 500 (Vanguard)"], ["ARKK", "ARK Innovation"], ["XLK", "Technology Sector"], ["XLF", "Financial Sector"], ["XLE", "Energy Sector"], ["EFA", "Developed Markets"], ["EEM", "Emerging Markets"], ["XLV", "Health Care Sector"], ["XLY", "Consumer Discretionary"], ["XLI", "Industrials Sector"], ["XLU", "Utilities Sector"], ["XLB", "Materials Sector"], ["XLRE", "Real Estate Sector"], ["XLC", "Communication Services Sector"], ["VGT", "Technology (Vanguard)"], ["SCHD", "Dividend Equity (Schwab)"], ["VUG", "Growth (Vanguard)"]] },
  { id: "bond-etfs", title: "Bond ETFs", accent: "#8b5cf6", items: [["TLT", "20+Y Treasury"], ["BND", "Total Bond Market"], ["AGG", "US Aggregate Bond"], ["HYG", "High Yield Corp"], ["IEF", "7-10Y Treasury"], ["LQD", "Investment Grade Corp"], ["MUB", "National Muni Bond"], ["SHY", "1-3Y Treasury"], ["VCIT", "Intermediate Corp Bond"], ["EMB", "Emerging Markets Bond"], ["JNK", "High Yield Bond"], ["BIV", "Intermediate-Term Bond"], ["TIP", "TIPS (Inflation-Protected)"], ["SPTL", "Long-Term Treasury"], ["VGIT", "Intermediate Treasury"], ["FLOT", "Floating Rate Bond"], ["PFF", "Preferred Stock"], ["BSV", "Short-Term Bond"], ["VTEB", "Tax-Exempt Muni Bond"], ["SPIB", "Intermediate Corp Bond (SPDR)"], ["VCSH", "Short-Term Corp Bond"], ["IGSB", "Short-Term Corp Bond (iShares)"]] },
  // Added 2026-09-21 at Jozsua's request — commodities used to be mixed
  // into the world map's ticker strip (GLD/USO alongside country ETFs),
  // which didn't make sense once that strip became countries-only (see
  // MARKET_TICKERS below). All commodity exposure lives here now instead.
  { id: "commodities", title: "Commodities", accent: "#d97706", items: [["GLD", "Gold"], ["SLV", "Silver"], ["PPLT", "Platinum"], ["PALL", "Palladium"], ["USO", "Oil (WTI Crude)"], ["BNO", "Oil (Brent Crude)"], ["UNG", "Natural Gas"], ["DBA", "Agriculture"], ["CORN", "Corn"], ["WEAT", "Wheat"], ["SOYB", "Soybeans"], ["CANE", "Sugar"], ["JO", "Coffee"], ["CPER", "Copper"], ["URA", "Uranium Miners"], ["DBC", "Broad Commodities"], ["GSG", "Broad Commodities (GSCI)"], ["PDBC", "Broad Commodities (Diversified)"], ["SGOL", "Gold (abrdn)"], ["COPX", "Copper Miners"], ["DBB", "Base Metals"], ["WOOD", "Timber & Forestry"]] },
  // Added 2026-10-04: sector-level categories. Every ticker was live-checked against the msv-api Finnhub proxy the same day (non-zero price).
  { id: "semiconductors", title: "Semiconductors", accent: "#0891b2", items: [["NVDA", "NVIDIA"], ["TSM", "TSMC"], ["AVGO", "Broadcom"], ["AMD", "AMD"], ["ASML", "ASML"], ["MU", "Micron"], ["INTC", "Intel"], ["QCOM", "Qualcomm"]] },
  { id: "healthcare", title: "Healthcare", accent: "#16a34a", items: [["LLY", "Eli Lilly"], ["JNJ", "Johnson & Johnson"], ["UNH", "UnitedHealth"], ["ABBV", "AbbVie"], ["MRK", "Merck"], ["TMO", "Thermo Fisher"]] },
  { id: "financials", title: "Financials", accent: "#2563eb", items: [["JPM", "JPMorgan"], ["BAC", "Bank of America"], ["WFC", "Wells Fargo"], ["GS", "Goldman Sachs"], ["MS", "Morgan Stanley"], ["BLK", "BlackRock"]] },
  { id: "energy", title: "Energy", accent: "#b45309", items: [["XOM", "ExxonMobil"], ["CVX", "Chevron"], ["COP", "ConocoPhillips"], ["SLB", "SLB"], ["EOG", "EOG Resources"]] },
  { id: "staples", title: "Consumer Staples", accent: "#65a30d", items: [["PG", "Procter & Gamble"], ["KO", "Coca-Cola"], ["PEP", "PepsiCo"], ["WMT", "Walmart"], ["COST", "Costco"]] },
  { id: "industrials", title: "Industrials", accent: "#64748b", items: [["GE", "GE Aerospace"], ["CAT", "Caterpillar"], ["HON", "Honeywell"], ["UNP", "Union Pacific"], ["RTX", "RTX"]] },
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

export const RANKING_STOCK_SYMBOLS: [string, string][] = [
  ["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "Nvidia"], ["META", "Meta"],
  ["JNJ", "Johnson & Johnson"], ["PG", "Procter & Gamble"], ["JPM", "JPMorgan Chase"], ["WMT", "Walmart"],
  ["T", "AT&T"], ["XOM", "ExxonMobil"], ["PFE", "Pfizer"], ["IBM", "IBM"],
  ["TSLA", "Tesla"], ["NFLX", "Netflix"], ["PLTR", "Palantir"], ["AMD", "AMD"],
  ["SPY", "S&P 500"], ["QQQ", "Nasdaq 100"], ["VTI", "Total Market"], ["VOO", "S&P 500 (Vanguard)"],
  ["TLT", "20+Y Treasury"], ["BND", "Total Bond Market"], ["HYG", "High Yield Corp"], ["LQD", "Investment Grade Corp"],
];

