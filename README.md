# $MSV

A stock/ETF/crypto research dashboard built for beginners: search any
ticker for valuation, technicals (RSI/MACD/chart), financials, and SEC
filings — every number comes with a plain-English tooltip explaining what
it means.

("$MSV" = "Maximising Shareholder Value" — a tongue-in-cheek name, hover
the logo in the header for the joke.)

Plain HTML/CSS/JS. No build tools, no npm install.

This is the **frontend**. The backend (a Cloudflare Worker proxying
Finnhub/Twelve Data/FRED/CoinGecko) lives in a separate repo:
[msv-api](https://github.com/Maximising-Shareholder-Value/msv-api).

## Setup in VS Code

1. Open this folder in VS Code.
2. Get a free API key at [finnhub.io/register](https://finnhub.io/register) (required).
3. Optionally get a free key at [twelvedata.com/pricing](https://twelvedata.com/pricing) (price chart), [fredaccount.stlouisfed.org/apikeys](https://fredaccount.stlouisfed.org/apikeys) (Macro tab), and/or [coingecko.com/en/developers/dashboard](https://www.coingecko.com/en/developers/dashboard) (higher crypto rate limit — the Crypto tab works without this one). Each just disables its own feature gracefully if skipped.
4. Copy `config.example.js` to `config.js` and paste your key(s) in. (`config.js` is gitignored — your real keys never get committed.)
5. Install the **Live Server** extension (Extensions panel → search "Live Server"). Needed because opening `index.html` directly blocks the API calls (CORS); Live Server runs it on `localhost` instead.
6. Right-click `index.html` → "Open with Live Server".

Locally, this calls Finnhub/Twelve Data/CoinGecko directly using your own
`config.js` keys. FRED has no CORS support at all, so even local dev
routes FRED calls through the deployed backend (see `FRED_PROXY_BASE` in
`home.js`) — that one feature needs the backend reachable even offline of
a full deploy.

## What's on it

A tabbed home page — a world map of major exchanges (live open/closed
status, no API calls beyond the tickers already fetched), curated
categories (stocks, ETFs, bond ETFs, crypto), dynamically-ranked
Winners/Losers/Most Active, a Macro tab (8 FRED indicators), a
grid/heatmap view toggle, and market news. Only the tab you're looking at
gets fetched. Search (with autocomplete) a ticker for a full deep-dive:
price chart with RSI/MACD/volume/support-resistance, SMA/EMA overlays,
and candlesticks; a "What If You'd Invested?" historical-return
calculator; valuation/growth/profitability/dividend/momentum indicators
with sector-aware traffic lights (stocks), price-performance/trading-
activity metrics (ETFs), or market-cap/supply/ATH stats (crypto, via
CoinGecko); real financial statements and SEC filings; analyst
recommendations; similar companies; and a rule-based (not AI) outlook.
Or compare up to 4 tickers side by side. Light/dark themes,
mobile-friendly.

## Files

- `index.html` / `style.css` / `script.js` — page + main logic, including
  per-instrument-type rendering (stock/ETF/crypto get different analysis
  sections — see `getInstrumentType()` in `script.js`)
- `home.js` — the tabbed home page (categories, Winners/Losers/Most
  Active, Macro, heatmap, world map ticker data)
- `worldMarkets.js` — the world map of major exchanges
- `chart.js` — the price chart and technical-analysis panels
- `invest.js` — the "What If You'd Invested?" calculator
- `clock.js` — header clock (timezone + market hours)
- `apiUsage.js` — the client-side Finnhub usage estimate widget
- `autocomplete.js` — ticker search suggestions dropdown
- `compare.js` — side-by-side stock comparison view
- `definitions.js` — tooltip text + formulas
- `sectorRules.js` — sector-aware traffic-light thresholds
- `analysis.js` — the rule-based Outlook logic (stock/ETF/crypto variants)
- `changelog.js` — the "What's New" popup (🔔 in the header) and its
  plain-English list of recent changes
- `roadmap.html` — an internal-only visual status page for the 6 roadmap
  pillars (not linked from the main nav — full detail in `ROADMAP.md` at
  [github.com/Maximising-Shareholder-Value/.github](https://github.com/Maximising-Shareholder-Value/.github))
- `config.js` (gitignored) / `config.example.js` (template) — API keys

## Deploying publicly (Cloudflare Workers static assets)

Locally, the app calls Finnhub/Twelve Data/CoinGecko directly using
`config.js`. For a public URL, that file is gitignored on purpose —
anyone visiting a plain static site could otherwise view-source your
keys. Instead:

1. Deploy [msv-api](https://github.com/Maximising-Shareholder-Value/msv-api)
   first (it needs the real keys as Cloudflare secrets) and note its
   deployed URL.
2. Set `API_BASE_URL` in `script.js` to that URL.
3. Deploy this repo with `npx wrangler deploy` (uses `wrangler.jsonc`'s
   `assets.directory` config — a plain static-assets Worker, not
   Cloudflare Pages, despite this section's old wording; no
   Worker/build step needed either way). **Never deploy without the
   tracked `.assetsignore` file present** — see `CLAUDE.md`'s "Deploy
   safety" section for why (it was confirmed live to otherwise upload
   `.git/` and `node_modules/` as public files).

The deployed site then calls `API_BASE_URL + /api/finnhub` etc.
automatically (the app detects it's not running on `localhost`) — your
keys stay in the backend's Cloudflare secrets, never in this repo or the
browser.

GitHub Pages can't do this on its own — it only serves static files, no
server-side proxy — but works fine for *this* repo specifically since all
the actual API-key handling lives in the separate `msv-api` Worker; this
repo really is just static files calling an external API.

## Notes

- **Rate limits**: Finnhub's free tier is 60 calls/min, shared across
  everyone hitting the backend — a ticker search uses a handful of calls,
  so avoid rapid-firing searches. The header's "Finnhub Usage" widget
  gives a rough live estimate (see `apiUsage.js` for why it's an
  estimate, not an exact shared counter).
- **API keys are visible client-side when run locally** (view-source,
  network tab) — fine for personal use on your own machine. The deployed
  version doesn't have this problem — see above.
- Some data isn't available on free tiers (premarket price, institutional
  ownership, executives, ETF/crypto fundamentals in the traditional
  sense) — see `CLAUDE.md` for what was checked and why, and how ETF/
  crypto pages are handled differently as a result.
