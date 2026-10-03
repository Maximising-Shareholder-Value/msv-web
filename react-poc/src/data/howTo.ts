// data/howTo.ts — the how-to walkthrough slides. Copied from ../../home.js (HOW_TO_SLIDES).

export interface HowToSlide { icon: string; title: string; body: string }

export const HOW_TO_SLIDES: HowToSlide[] = [
  { icon: "🔍", title: "Search anything", body: `Type any company, ticker, or crypto symbol — "Apple", "AAPL", "BTC" — into the search box up top. You'll get price, valuation, financial health, analyst views, and a plain-English Outlook, all on one page.` },
  { icon: "❓", title: "Hover the (?) icons", body: "Every indicator on this site has one. Hover it for what the number means and why it matters, in plain English — no finance degree required." },
  { icon: "🗂️", title: "Browse for ideas", body: "No ticker in mind? Use the tabs below — Trending Tech, Blue Chip, ETFs, Bond ETFs, and more — or check Winners/Losers/Most Active for what's moving today." },
  { icon: "⚖️", title: "Compare side by side", body: "Use the Compare button up top to put up to 4 tickers side by side and see how they stack up against each other." },
  { icon: "🌎", title: "Check the bigger picture", body: "The Macro tab covers the economic backdrop — interest rates, inflation, unemployment — that moves the whole market, not just one stock." },
];

