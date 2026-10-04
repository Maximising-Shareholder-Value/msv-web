// data/placeholders.ts — the "Coming soon" pages: icon, title and the plain-English
// description of what each one will be. Copied from ../../home.js (PLACEHOLDER_INFO).

export interface PlaceholderInfo { icon: string; title: string; description: string; includes?: string[] }

export const PLACEHOLDER_INFO: Record<string, PlaceholderInfo> = {
  // Working name "Ask $MSV AI Anaiyst". The spelling is intentional. The icon is a small inline SVG logo, not an emoji.
  "ai": {
    icon: "<svg viewBox=\"0 0 48 48\" width=\"64\" height=\"64\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"44\" height=\"44\" rx=\"12\" style=\"fill:var(--accent,#10b981)\"/><path d=\"M13.5,34 L24,12.5 L34.5,34\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"4.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><line x1=\"18.4\" y1=\"26.4\" x2=\"29.6\" y2=\"26.4\" stroke=\"#ffffff\" stroke-width=\"3.4\" stroke-linecap=\"round\"/><polyline points=\"30,15.6 35.4,10.2 35.4,16.6\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    title: "Ask $MSV AI Anaiyst",
    description: "The native AI analyst for $MSV. Ask it questions in plain English about stocks, ETFs, sectors and the markets, the way you'd ask Claude. Not built yet.",
    includes: [
      "Plain-English answers about any ticker on $MSV, using its live numbers",
      "Sector and market questions, such as \"why did energy fall today?\"",
      "Every answer shows the data it used and when it was fetched",
      "Clear limits: no buy or sell advice, and it says when data isn't available",
      "Follow-up questions within one conversation",
    ],
  },
  "create-account": { icon: "🆕", title: "Create Free Account", description: "User accounts aren't built yet — this needs real authentication and a backend to store anything per-user. On the roadmap, not started." },
  "login": { icon: "🔑", title: "Log In", description: "Depends on accounts existing first — see Create Free Account." },
  "performance": { icon: "📈", title: "Performance", description: "A planned asset-class performance comparison — stocks vs. bonds vs. commodities vs. crypto returns over time. Distinct from the Sectors heatmap. Not built yet." },
  "portfolio-builder": { icon: "🧱", title: "Portfolio Builder", description: "Depends on accounts existing first — a portfolio needs to belong to someone." },
  "portfolio-health-check": { icon: "🩺", title: "Portfolio Health Check", description: "Depends on Portfolio Builder existing first." },
  // Added 2026-09-24 for the Explore Products retaxonomy (see EXPLORE_CATEGORIES) —
  // real gaps worth naming even before they're built, not filler.
  "premium": { icon: "💎", title: "Premium", description: "A planned paid tier — not built yet. What's included and pricing haven't been decided." },
  "stock-ideas": { icon: "💡", title: "Stock Ideas", description: "Curated stock ideas with a stated thesis — not built yet; needs an editorial or screening process behind it." },
  "stock-sentiment": { icon: "💬", title: "Stock Sentiment", description: "Aggregated analyst/news sentiment per ticker — no free sentiment data source has been vetted yet." },
  "analyst-actions": { icon: "🔀", title: "Analyst Upgrades & Downgrades", description: "A feed of recent rating changes across tickers — distinct from the per-ticker Analyst Recommendations trend chart already on the ticker page. Finnhub's free tier hasn't been checked for a ratings-change feed yet." },
  "precious-metals": { icon: "🥇", title: "Precious Metals", description: "A dedicated gold/silver/platinum/palladium view — today these tickers only live mixed into the general Commodities browse category." },
  "forex": { icon: "💱", title: "Forex", description: "A 6-pair snapshot (EUR/USD, GBP/USD, USD/JPY, USD/SGD, USD/AUD, USD/CHF) now lives on the homepage's Currency card — but a full dedicated Forex page/category, like the Sectors or ETFs pages have, isn't built yet." },
  "insider-activity": { icon: "🕵️", title: "Insider Activity Feed", description: "A market-wide feed of recent insider buying and selling. Each ticker page already shows its own insider transactions — a cross-market feed isn't built yet." },
  "short-interest": { icon: "📉", title: "Short Interest", description: "Which stocks are most heavily shorted. No free short-interest source has been vetted yet." },
  "energy-markets": { icon: "🛢️", title: "Energy Markets", description: "A dedicated oil, gas and power view. Today these only exist as tickers inside the Commodities category." },
  "options-explorer": { icon: "🎯", title: "Options Explorer", description: "Screen and compare options across tickers. Each stock's own page already has a live options chain — a cross-market explorer isn't built yet." },
  "energy-theme": { icon: "⚡", title: "Energy & Power Map", description: "A dependency map of the power and grid supply chain, like the AI infrastructure one. Not researched yet." },
  "ev-theme": { icon: "🔋", title: "EV & Battery Map", description: "A dependency map of the electric-vehicle and battery supply chain. Not researched yet." },
  "defense-theme": { icon: "🛡️", title: "Defense & Aerospace Map", description: "A dependency map of the defense and aerospace supply chain. Not researched yet." },
  "price-alerts": { icon: "🔔", title: "Price Alerts", description: "Get notified when a ticker crosses a level. Needs accounts and a backend first — see Create Free Account." },
  "dividend-tracker": { icon: "💵", title: "Dividend Tracker", description: "Upcoming dividends across your watchlist. Needs a dividend-calendar data source that hasn't been vetted." },
};
