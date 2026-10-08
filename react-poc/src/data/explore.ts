// data/explore.ts — the Explore directory: every page the app offers, grouped into
// categories, with a flag for pages not built yet. Copied from ../../home.js
// (EXPLORE_DIRECTORY and EXPLORE_CATEGORIES).

export interface ExploreItem { title: string; description: string; nav: string; live: boolean; icon?: string }
export interface ExploreCategory { title: string; items: string[] }

export const EXPLORE_DIRECTORY: ExploreItem[] = [
  { title: "Home", description: "Markets, stocks, news, and more.", nav: "home", live: true },
  { title: "Create Free Account", description: "Save your data across visits.", nav: "create-account", live: false },
  { title: "Log In", description: "Access your account.", nav: "login", live: false },
  { title: "Compare", description: "Up to 4 tickers side by side.", nav: "compare", live: true },
  { title: "How to use $MSV", description: "A 5-step walkthrough.", nav: "how-to", live: true, icon: "learn" },
  { title: "What's New", description: "Recent changes to the app.", nav: "whats-new", live: true, icon: "market-news" },

  { title: "Stock Analysis", description: "Winners, losers, most active.", nav: "stock-analysis", live: true },
  { title: "Winners", description: "Today's biggest gainers.", nav: "winners", live: true, icon: "performance" },
  { title: "Losers", description: "Today's biggest decliners.", nav: "losers", live: true, icon: "stock-analysis" },
  { title: "Most Active", description: "Largest moves of the day.", nav: "most-active", live: true, icon: "stock-analysis" },
  { title: "Trending Tech", description: "Big-tech and software names.", nav: "trending-tech", live: true, icon: "market-intelligence" },
  { title: "Blue Chip", description: "Established household names.", nav: "blue-chip", live: true, icon: "etfs" },
  { title: "Dividend Payers", description: "Income-focused stocks.", nav: "dividend-payers", live: true, icon: "premium" },
  { title: "Growth Stocks", description: "Faster-growing companies.", nav: "growth-stocks", live: true, icon: "performance" },
  { title: "Earnings Calendar", description: "Who reports this week.", nav: "earnings-calendar", live: true, icon: "market-news" },
  { title: "Stock Ideas", description: "Curated ideas with a thesis.", nav: "stock-ideas", live: false },
  { title: "Stock Sentiment", description: "Analyst/news sentiment per ticker.", nav: "stock-sentiment", live: false },
  { title: "Analyst Upgrades & Downgrades", description: "Rating-change feed.", nav: "analyst-actions", live: false },
  { title: "Stock Screener", description: "Filter by price, market cap, P/E and more (MVP, curated universe).", nav: "stock-screener", live: true },
  { title: "Insider Activity Feed", description: "Market-wide insider trades.", nav: "insider-activity", live: false },
  { title: "Short Interest", description: "Most heavily shorted stocks.", nav: "short-interest", live: false },

  { title: "Macro", description: "Rates, inflation, GDP by country.", nav: "macro", live: true },
  { title: "US Economy", description: "Fed funds, CPI, jobs, yields.", nav: "us-economy", live: true, icon: "macro" },
  { title: "Global Economy", description: "Compare the big four economies.", nav: "global-economy", live: true, icon: "compare" },
  { title: "Governance & Politics", description: "Stability, rule of law, corruption.", nav: "governance", live: true, icon: "macro" },
  { title: "Economic Calendar", description: "Fed, CPI, jobs, GDP dates.", nav: "economic-calendar", live: true, icon: "market-news" },
  { title: "Indexes", description: "S&P 500, Nasdaq, Dow, Russell.", nav: "indexes", live: true },
  { title: "ETFs", description: "42 categories, ~290 ETFs, live prices.", nav: "etfs", live: true },
  { title: "Bonds", description: "Treasury, corporate and global bond ETFs.", nav: "bonds", live: true },
  { title: "Commodities", description: "Gold, oil, grains, metals.", nav: "commodities", live: true },
  { title: "Precious Metals", description: "Gold, silver, platinum.", nav: "precious-metals", live: false },
  { title: "Energy Markets", description: "Oil, gas and power.", nav: "energy-markets", live: false },
  { title: "Forex", description: "Currency pairs (data available).", nav: "forex", live: false },
  { title: "Crypto", description: "Top 100 coins, DeFi, stablecoins, Fear & Greed.", nav: "crypto", live: true },
  { title: "Crypto Cycles", description: "Rainbow chart, Stock-to-Flow, halvings.", nav: "bitcoin-cycles", live: true },
  { title: "Crypto News", description: "News feed + regulation/adoption tracker.", nav: "crypto-news", live: true },
  { title: "Options Explorer", description: "Cross-market options screen.", nav: "options-explorer", live: false },
  { title: "Prediction Markets", description: "Live Polymarket odds on finance, economy, crypto and more.", nav: "prediction-markets", live: true },
  { title: "Notable Trades", description: "What members of Congress are buying and selling, from official disclosures.", nav: "notable-trades", live: true },

  { title: "Market Intelligence", description: "Who depends on whom in AI.", nav: "market-intelligence", live: true },
  { title: "Energy & Power Map", description: "Grid supply-chain map.", nav: "energy-theme", live: false, icon: "market-intelligence" },
  { title: "EV & Battery Map", description: "EV supply-chain map.", nav: "ev-theme", live: false, icon: "market-intelligence" },
  { title: "Defense & Aerospace Map", description: "Defense supply-chain map.", nav: "defense-theme", live: false, icon: "market-intelligence" },
  { title: "Market Data", description: "42-country map, risk dashboard, country profiles.", nav: "market-data", live: true },
  { title: "Sectors", description: "11 sectors + 52 industries, full breakdowns.", nav: "sectors", live: true },
  { title: "Market News", description: "Latest market headlines.", nav: "market-news", live: true },

  { title: "Watchlist", description: "Tickers you're tracking.", nav: "watchlist", live: true },
  { title: "Recently Viewed", description: "Your last looked-up tickers.", nav: "recently-viewed", live: true, icon: "watchlist" },
  { title: "Portfolio Builder", description: "Build and track a portfolio.", nav: "portfolio-builder", live: false },
  { title: "Portfolio Health Check", description: "Diagnose your portfolio.", nav: "portfolio-health-check", live: false },
  { title: "Performance", description: "Asset-class comparison.", nav: "performance", live: false },
  { title: "Price Alerts", description: "Notify me at a price.", nav: "price-alerts", live: false },
  { title: "Dividend Tracker", description: "Upcoming dividends.", nav: "dividend-tracker", live: false },

  { title: "Learn", description: "Plain-English explainers.", nav: "learn", live: true },
  { title: "Glossary", description: "Every term, explained.", nav: "glossary", live: true, icon: "learn" },
  { title: "Premium", description: "A paid tier — coming eventually.", nav: "premium", live: false },
];

// Named groupings for the Explore Products page — each `nav` here must
// have an EXPLORE_DIRECTORY entry above. An item appears once; order here
// is display order.
export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { title: "Get Started", items: ["home", "create-account", "login", "compare", "how-to", "whats-new"] },
  { title: "Stock Analysis", items: ["stock-analysis", "winners", "losers", "most-active", "trending-tech", "blue-chip", "dividend-payers", "growth-stocks", "earnings-calendar", "stock-ideas", "stock-sentiment", "analyst-actions", "stock-screener", "insider-activity", "short-interest"] },
  { title: "Market Outlook", items: ["macro", "us-economy", "global-economy", "governance", "economic-calendar", "indexes", "etfs", "bonds", "commodities", "precious-metals", "energy-markets", "forex", "crypto", "options-explorer", "prediction-markets", "notable-trades"] },
  { title: "Market Intelligence", items: ["market-intelligence", "energy-theme", "ev-theme", "defense-theme", "market-data", "sectors", "market-news"] },
  { title: "Portfolio Tools", items: ["watchlist", "recently-viewed", "portfolio-builder", "portfolio-health-check", "performance", "price-alerts", "dividend-tracker"] },
  { title: "Learn & Premium", items: ["learn", "glossary", "premium"] },
];


// Fallback icons for Explore tiles whose page has no sidebar item (from home.js EXPLORE_ICON_FALLBACKS).
export const EXPLORE_ICON_FALLBACKS: Record<string, string> = {
  "stock-ideas": '<circle cx="10" cy="8" r="4.3"/><line x1="8.3" y1="15" x2="11.7" y2="15"/><line x1="8.8" y1="17" x2="11.2" y2="17"/><line x1="10" y1="3.5" x2="10" y2="1.8"/>',
  "stock-sentiment": '<path d="M3,5 H17 V13 H8 L4.5,16 V13 H3 Z"/>',
  "analyst-actions": '<line x1="6" y1="16" x2="6" y2="4"/><polyline points="3.5,7 6,4 8.5,7"/><line x1="14" y1="4" x2="14" y2="16"/><polyline points="11.5,13 14,16 16.5,13"/>',
  "precious-metals": '<ellipse cx="10" cy="6" rx="6" ry="2.3"/><path d="M4,6 V14 C4,15.3 6.7,16.3 10,16.3 C13.3,16.3 16,15.3 16,14 V6"/><path d="M4,10 C4,11.3 6.7,12.3 10,12.3 C13.3,12.3 16,11.3 16,10"/>',
  "forex": '<line x1="3" y1="7" x2="15" y2="7"/><polyline points="12,4 15,7 12,10"/><line x1="17" y1="13" x2="5" y2="13"/><polyline points="8,10 5,13 8,16"/>',
  "indexes": '<circle cx="10" cy="10" r="7.3"/><path d="M10,10 L10,3.5 A6.5,6.5 0 0 1 15.7,13.2 Z"/>',
  "bonds": '<rect x="4" y="3" width="12" height="14" rx="1.2"/><line x1="7" y1="7" x2="13" y2="7"/><line x1="7" y1="10" x2="13" y2="10"/><line x1="7" y1="13" x2="10.5" y2="13"/>',
  "commodities": '<rect x="4" y="5" width="12" height="10" rx="1.5"/><line x1="4" y1="8.5" x2="16" y2="8.5"/><line x1="4" y1="11.5" x2="16" y2="11.5"/>',
};
export const DEFAULT_EXPLORE_ICON = '<circle cx="10" cy="10" r="3"/>';
