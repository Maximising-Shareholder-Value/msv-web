# CLAUDE.md

## Name

The app is called **$MSV** ("Maximising Shareholder Value" — a joke name;
the dashboard itself is genuinely useful). Logo is an emerald circular
badge with "MSV" lettering and a small uptick-arrow accent, styled after
coin/badge-style crypto logos (e.g. CoinMarketCap) per the user's request
— fixed-color (not currentColor), so it looks the same in both themes.
Favicon is a simplified version without the arrow accent (illegible at
16px with it — tested visually before shipping).

## What this repo is

The **frontend** for $MSV: a home page of browsable stock/ETF/bond-ETF/
crypto categories, a world map of major exchanges, plus a single-stock
"deep-dive" view — price, valuation/performance/market-stats (varies by
instrument type — see "Per-instrument-type analysis" below), analyst
recommendation trends, recent earnings, similar companies, and a
rule-based plain-English outlook — all on one page, two-column layout
(full analysis on the left, recommendations + outlook sticky on the
right), with hover (?) tooltips explaining every term in plain English.

The **backend** — a Cloudflare Worker proxying Finnhub/Twelve Data/FRED/
CoinGecko so real API keys never reach the browser — lives in a separate
repo, [msv-api](https://github.com/Maximising-Shareholder-Value/msv-api).
See its own CLAUDE.md for backend-specific history (caching, the removed
KV pre-warming layer, CORS, secrets).

It is **not** a multi-stock screener/filter tool — that was considered and
deliberately scoped out in favor of one-ticker-at-a-time depth.

Plain HTML/CSS/JS. No build tools, no npm install, no framework. Runs via
the VS Code "Live Server" extension (see README.md for why).

## History: split from a combined repo (2026-09)

This started as one repo containing both this frontend and `worker.js` —
one Cloudflare Worker deployment served both. Split into `msv-web` +
`msv-api` once the project moved under a GitHub org and outside
collaboration became a real possibility. Key thing that changed:
`finnhubUrl()`, `twelveDataUrl()` (chart.js), `coingeckoUrl()`, and
`FRED_PROXY_BASE` (home.js) all route their "deployed" branch through one
`API_BASE_URL` constant (declared in `script.js`, near `IS_LOCAL_DEV`)
instead of a bare relative `/api/xxx` path — relative paths only work
when the frontend and the proxy are the same deployment, which is no
longer guaranteed. `API_BASE_URL` needs to be set to wherever `msv-api`
is actually deployed. Started fresh in the new repo rather than splitting
git history.

## Data sources

**Finnhub free tier** (https://finnhub.io) — the primary source. Known
free-tier limits that shaped this build:
- Historical price candles (`/stock/candle`) are unreliable/blocked for US
  stocks on the free plan — confirmed directly via live requests, not
  assumed. Also confirmed blocked: crypto candles, and forex quotes/candles
  entirely (not just charts).
- No bid/ask endpoint, no company description field, no bonds, no options
  data on free tier — all confirmed via live requests, not faked.
- For ETFs specifically: `/stock/profile2` and `/stock/metric` return
  real data, just not company-fundamentals-shaped data — no P/E, margins,
  earnings, but real price-return history (5-day/monthly/13-week/26-week/
  YTD/52-week), beta, volatility, and average volume. `/stock/earnings`,
  `/financials-reported`, `/insider-transactions`, `/peers`,
  `/recommendation` all come back empty for ETFs (confirmed directly).
  `/stock/filings` DOES work for ETFs, just with fund-specific forms
  (NPORT-P, N-CEN, 497, etc.) instead of 10-Ks.
- For crypto (symbols containing `:`, e.g. `BINANCE:BTCUSDT`): Finnhub
  returns literally nothing beyond a bare quote — profile2 and metric
  both come back as empty objects (confirmed directly).
- Recommendation trends, earnings surprises, peers, and company-news ARE
  available free and are used for stocks (Analyst Recommendations, Recent
  Earnings, Similar Stocks, Latest News sections).

**Twelve Data free tier** (https://twelvedata.com) — added specifically
because Finnhub blocks historical candles. Confirmed via live request to
have real CORS support, unlike Yahoo's unofficial chart endpoint (no CORS
headers) or Stooq (bot-verification wall, no CORS). 800 requests/day
free, optional — chart card degrades gracefully without a key. Doesn't
support crypto candles either — crypto tickers show "not supported for
this symbol format" on the chart (a deliberate scope boundary, not a bug
— see "Per-instrument-type analysis" below).

**CoinGecko** (https://coingecko.com) — used for the homepage Crypto tab
AND the crypto deep-dive page (Market Stats/Performance/All-Time High-Low
sections), completely separate quota from Finnhub. Confirmed real CORS
support and a genuine batch endpoint (`/coins/markets`). The deep-dive
page fetches the fuller `/coins/{id}` endpoint (market cap, rank, volume,
circulating/max supply, ATH/ATL with dates, multi-period % change) —
`flattenCoinGeckoDetail()` in script.js flattens its nested
`market_data.<field>.usd` shape into what the render functions expect.
Only works for the 6 coins curated in `CRYPTO_COINGECKO_IDS` (home.js);
other crypto symbols still get a working price via Finnhub's quote but no
detailed stats, disclosed rather than shown as blank N/A.

**Wikipedia REST API** (no key needed, CORS-enabled) — powers the "About
the Company" description Finnhub doesn't provide. Gracefully shows "No
company description available... (common for ETFs and crypto, which
aren't operating companies)" when there's no company name to look up.

## Home page asset-class substitutions

"Bonds" category shows major bond ETFs (TLT, BND, AGG, etc.) instead of
individual bonds — Finnhub's free plan has zero bonds data. "Crypto" tab
uses CoinGecko instead of Finnhub (see above) — options-chain data isn't
realistically available free anywhere, so that category was replaced
with Crypto instead.

## Per-instrument-type analysis (stock / ETF / crypto)

`getInstrumentType(symbol, profile)` in script.js detects which of the
three a searched ticker is: crypto is unambiguous (`:` in the symbol);
ETF is detected live — a real company's `profile2` always has at least a
`name`, an ETF's comes back empty. `applyInstrumentTypeUI(type)` hides
the 9 sections that are empty for both ETF and crypto (Growth,
Profitability, Dividends, Recent Earnings, Financial Statements, Shares
Breakdown, Insider Transactions, Similar Stocks, Analyst Recommendations)
and retitles Valuation/Financial Health/52-Week Range per type:

- **Stock**: Valuation, Financial Health, 52-Week Range (unchanged).
- **ETF**: Valuation → "Price Performance" (`renderETFPerformance`),
  Financial Health → "Trading Activity & Risk" (`renderETFTradingActivity`),
  52-Week Range unchanged. New ETF-specific Outlook
  (`generateETFOutlook` in analysis.js) off actual performance/beta data.
- **Crypto**: Valuation → "Market Stats" (`renderCryptoMarketStats`),
  Financial Health → "Performance" (`renderCryptoPerformance`), 52-Week
  Range → "All-Time High / Low" (`renderCryptoRange`, reusing the same
  gauge visualization via `renderRangeGaugeGeneric`). New crypto-specific
  Outlook (`generateCryptoOutlook`). Loads via a completely separate
  `loadCryptoTicker()` path — deliberately does NOT call
  `loadSecondaryData()` (which fires 7 Finnhub calls all guaranteed empty
  for crypto); instead makes exactly 2 Finnhub calls (quote + a
  `/news?category=crypto` fetch, since company-news doesn't make sense
  for a `BINANCE:XXX`-format symbol).

If adding a new section to the stock deep-dive page, decide up front
whether it applies to ETF/crypto too — if not, add its section id to
`NON_STOCK_HIDDEN_SECTIONS` in script.js rather than letting it render a
wall of N/A.

## The "AI Outlook" section

This is **rule-based synthesis**, not a live LLM call — `analysis.js` turns
the fetched numbers into plain-English takeaways using fixed thresholds
(e.g. P/E > 30 reads as "premium valuation" for stocks). Not connected to
any AI API, costs nothing to run. Three variants: `generateOutlook`
(stock), `generateETFOutlook`, `generateCryptoOutlook` — see above.

## No fabricated forecasts

Confirmed directly that Finnhub's free tier has no analyst price-target or
forward EPS/revenue-estimate endpoints. When forecasts were requested,
the "Price Reference Points" card was built instead of inventing numbers:
it just re-expresses the stock's own real 52-week high/low as reference
points plus a beta-based volatility note, explicitly labeled "historical,
not a forecast." The "What If You'd Invested?" calculator's forward
projection (see below) follows the same rule — heavily caveated as
illustrative/historical, explicitly not a prediction. Don't add
speculative price targets or soften these caveats without a real,
disclosed forward-looking data source behind them.

## Sector-aware traffic lights & tooltips

`sectorRules.js` maps Finnhub's `finnhubIndustry` string to a smaller set
of buckets with rough threshold ranges per indicator. `getTrafficLight()`
drives the colored dot on indicator cards; `getSectorSentence()` drives
the dynamic sentence injected into the tooltip, grounded in the actual
company's detected industry. Only applies to stocks — ETF/crypto have no
`finnhubIndustry`, so `currentIndustry` stays `null` for them and the
dynamic sentence is skipped automatically (no special-casing needed).
Traffic-light labels are phrased as distance-from-typical rather than
good/bad, since landing outside the typical range isn't always bad (e.g.
Current/Quick Ratio far above typical is unusual, not weak).

## Chart (`chart.js`)

Twelve Data `time_series` with a range→interval map (1H/4H/1D/1W/3M/6M —
each range means what its label says, e.g. "1H" = last 60 one-minute
bars, not "100 hourly bars"; a past bug had this backwards and it made
every range look chaotic). RSI/MACD computed client-side; support/
resistance is a simple local-extrema clustering heuristic, explicitly
labeled as such. Candlestick toggle (`drawCandles()`) uses OHLC arrays
already captured from the same response. Charts only support plain
ticker symbols (stocks/ETFs) — crypto (`:` in the symbol) shows "not
supported for this format" rather than attempting a call that would fail
(Twelve Data doesn't support crypto candles either).

**x-axis**: intraday ranges (1H/4H/1D) use time-proportional positioning
(`getXMapper`) so overnight gaps show as a real jump — but 1W specifically
uses index-based spacing like the daily ranges (3M/6M), NOT
time-proportional: only ~6.5 of every 24 hours is real trading time, so a
time-proportional axis let the 4 overnight/weekend gaps eat most of the
width and squeezed each day's actual bars into a thin sliver (this is
what made "1W looks really weird" — found and fixed 2026-08-06). If a
future range spans multiple days at intraday granularity, it needs this
same index-based treatment.

**Session shading** (pre-market/after-hours bands): gated to
`chartState.range === "1D" || "4H"` only — drawing one shaded pair per
calendar day present in the series is harmless for a single session but
created a wall of stripes on 1W (5 days). Twelve Data's free tier ignores
`extended_hours=true` entirely (confirmed byte-identical response with/
without it) — the bands mark time windows, not real extended-hours price
data, and shouldn't be represented otherwise without upgrading the plan.

**Line vs candlestick line-drawing**: any line-drawing feature (price
line, SMA/EMA overlays, RSI/MACD panel lines) needs segment-aware
handling via `isSessionGap()`/`getSegments()` — anything that draws a
continuous line across an overnight/weekend gap without this connects
yesterday's close straight to today's open, which reads as a crash that
never happened.

## "What If You'd Invested?" (`invest.js`)

One years-ago slider (1–10) drives two numbers from the same historical
window: a real backward-looking result (what a past investment actually
did, using real closing prices) and an illustrative forward projection
(what a new investment could grow to if that same historical annualized
growth rate continued — heavily caveated, not a prediction). One extra
Twelve Data `time_series` call (`outputsize: 2600`, ~10 years of daily
bars), fired alongside the chart's own load. Historical dividend data
isn't available on the free tier of either data source (confirmed
directly) — both numbers are **price return only**, disclosed in the UI
rather than fabricating a dividend-reinvestment assumption. Not available
for crypto (same symbol-format check as the chart).

## World map (`worldMarkets.js`)

A real, geographically-accurate world map (`worldmap.svg` — public domain,
CIA World Factbook base map, equirectangular projection) with 13 major
exchange markers placed using real latitude/longitude, live open/closed
status computed entirely client-side via `Intl` (zero network calls,
correctly skips weekends via `daysUntilNextWeekday()`). Each marker shows
city name + a representative country ETF's ticker/price/% (Finnhub has no
live foreign index data on the free tier, so a country ETF stands in —
same reasoning as the homepage's other index proxies). These ETF quotes
are fetched once by `home.js` (`MARKET_TICKERS`) and shared with both the
map markers and the sidebar list — one fetch pass serves two UI surfaces.

**Design history worth knowing before changing this again**: went through
several rounds — a decorative graticule-only map → a real geographic map
with dark bordered/shadowed callout boxes (too cluttered, boxes too
small to read) → boxes removed entirely, replaced with stroke-outlined
floating text (still read as "boxy" because a thick stroke on dense text
visually merges into a blob, AND the text was ~9px on an actual screen
despite being "28px" in the SVG's viewBox units — viewBox is ~2752 units
wide but typically renders to ~900px, a ~0.33x scale factor easy to
underestimate when testing at an extra-wide browser viewport) → current
version uses a soft drop-shadow for contrast instead of a stroke outline,
with roughly doubled font sizes, verified at a realistic ~1200px browser
width, not the wider viewport used earlier in testing. If revisiting this
again: check actual rendered pixel size (viewBox size × real render
scale), not just the number in the CSS/SVG attribute, and prefer
drop-shadow over stroke-outline for text-over-image contrast — stroke
merges adjacent glyphs at typical text density, drop-shadow doesn't.

Country-highlighting (tinting the whole landmass of an open exchange)
was tried and removed — with 7-8 of 13 exchanges open at once, whole-
country fills painted huge chunks of the map simultaneously and read as
cluttered; the pulse ring already on each open dot carries that signal
with far less visual weight. Also removed: a lon/lat grid overlay, for
the same declutter reason.

**Market breadth strip** (below the map): computed for free from the
same `MARKET_TICKERS` quotes already fetched — up/down counts, best/
worst mover, and a "Next: <city> opens/closes in Xh Ym" line
(`getNextMarketEvent()`, pure client-side arithmetic over the same
trading-hours data the markers use). Zero additional API cost.

**Sidebar ticker list**: kept at 20 tickers deliberately, not more —
briefly expanded to 30, which made the sidebar taller than the map's own
aspect-ratio height and (since they share a flex row with
`align-items: stretch`) stretched the map's container past what its SVG
actually needed, creating a visible empty gap below the map graphic.
Reverted. If more tickers are wanted again, it needs a layout change
(e.g. a 3rd column, or an independently-scrolling sidebar) first, not
just appending to the list.

## Rate-limit resilience

- **Edge caching + refresh-on-demand**: handled in msv-api, not here —
  see that repo's CLAUDE.md. This repo just calls the proxy and trusts it
  to cache sensibly.
- **Staggered home page loads**: each category's fetch is delayed by
  `categoryIndex * 200ms` rather than firing everything in the same
  instant.
- **Lazy tab loading**: the tabbed home page (`home.js`) only fetches the
  active tab's data, cached in `homeState.quotes` for the session.
  Winners/Losers/Most Active need every category's data to rank, so
  visiting one for the first time triggers fetching whatever categories
  aren't loaded yet. Default tab is a cheap static browse category, not a
  dynamic (ranked) one.
- **Browse categories are genuinely zero-cost**: `BROWSE_CATEGORIES`
  (6 categories × 12 items) shows name + ticker only, no live quotes at
  all — deliberately kept separate from `RANKING_STOCK_SYMBOLS` (the
  smaller set actually used for Winners/Losers/Most Active), so the
  ranking cost doesn't grow just because the browse lists did.
- **API usage widget** (`apiUsage.js`): a client-side estimate of Finnhub
  usage against the 60/min limit, based on requests THIS BROWSER TAB
  initiated — not a precise shared counter (some requests get served
  from the backend's edge cache and never reach Finnhub at all), an
  upper-bound estimate.

## Search autocomplete + comparison view

**Autocomplete** (`autocomplete.js`): debounced 300ms. Its keydown
listener is registered on the **capture** phase specifically so it can
pre-empt the plain "Enter → search" listener regardless of registration
order — worth remembering for any future multi-listener-on-one-element
situation.

**Comparison** (`compare.js`): up to 4 tickers side by side, reuses
`getSectorBucket()`/`getTrafficLight()`/`TRAFFIC_LABELS` per-column and
`showTooltip()` from script.js — same definitions used everywhere else,
so numbers stay consistent with the single-ticker deep-dive view.

Both `compareView` and `dashboard`/`homeView` are mutually exclusive —
if a new top-level view is ever added, it needs to be hidden from both
`goHome()` and `loadTicker()`'s view-toggling too.

## Fetch error messages

`fetchJSON()` attaches the HTTP status to thrown errors (`err.status`),
and the catch blocks use `describeFetchError()` for a specific message:
429 → rate limit (temporary, wait ~30s); 401/403 → check your API key
(different wording for local vs. deployed); anything else → generic,
points at the console. Keep this pattern for any new fetch call site that
shows errors directly to the user — a transient rate-limit blip
shouldn't look identical to a genuinely broken setup.

## CI (2026-09-19)

`.github/workflows/ci.yml` runs on every PR into `main` (and on push to
`main`) with two jobs:

- **syntax-check**: `node --check` against every tracked `.js` file.
  Catches typos/broken syntax instantly, no dependencies installed.
- **smoke-test**: a single Playwright test (`tests/smoke.spec.js`) that
  serves the repo with a plain static server, loads the home page, and
  searches a ticker (AAPL) — then asserts the deep-dive dashboard
  (`#dashboard`) actually renders and no uncaught JS error fired.

The smoke test does **not** call the real Finnhub/Twelve Data/Wikipedia
APIs — `page.route()` intercepts those requests and returns small canned
JSON instead. Reasoning: a shared free-tier key in a public repo's CI
would be flaky (rate limits, and no real key exists in git anyway — the
real one is gitignored `config.js`, local-only). This tests "did our own
JS break", not "is Finnhub up right now", which is the right thing for a
merge gate to check. If a fetched field's shape changes and a render
function needs updating, extend the mocked response in
`tests/smoke.spec.js` to match rather than skipping the check.

`package.json` exists **only** to pin `@playwright/test` and `http-server`
as dev tooling for this test — the app itself still has no build step and
deploys as plain static files (see "Deploying publicly" in README.md). If
Cloudflare's dashboard build settings ever auto-detect this `package.json`
and try to run a build command, set that build command to empty/none —
nothing here needs building.

## Config / secrets

`config.js` holds the real Finnhub/Twelve Data/FRED/CoinGecko keys for
**local dev only** and is gitignored. `config.example.js` is the tracked
template. The deployed site never uses `config.js` at all — it calls the
`msv-api` backend instead, which holds the real keys as Cloudflare
secrets (see that repo).
