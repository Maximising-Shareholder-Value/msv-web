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
  { title: "Market Outlook", items: ["macro", "us-economy", "global-economy", "governance", "economic-calendar", "indexes", "etfs", "bonds", "commodities", "precious-metals", "energy-markets", "forex", "crypto", "options-explorer", "prediction-markets"] },
  { title: "Market Intelligence & Data", items: ["market-intelligence", "energy-theme", "ev-theme", "defense-theme", "market-data", "sectors", "market-news"] },
  { title: "Portfolio Tools", items: ["watchlist", "recently-viewed", "portfolio-builder", "portfolio-health-check", "performance", "price-alerts", "dividend-tracker"] },
  { title: "Learn & Premium", items: ["learn", "glossary", "premium"] },
];

