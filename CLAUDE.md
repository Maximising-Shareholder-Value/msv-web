# CLAUDE.md

> This file is the technical reference (how the code works, why specific
> bugs were fixed the way they were, data-source quirks). For the
> long-term vision, architecture roadmap, project history, known
> blockers, and an actionable to-do list, see the org's governance hub:
> [github.com/Maximising-Shareholder-Value/.github](https://github.com/Maximising-Shareholder-Value/.github).

## Name

The app is called **$MSV** ("Maximising Shareholder Value" — a joke name;
the dashboard itself is genuinely useful). Favicon is an emerald circular
badge with "MSV" lettering (a simplified version without an uptick-arrow
accent that was tried and dropped — illegible at 16px, tested visually
before shipping).

**One logo total, in the sidebar only** (`.app-sidebar-badge`,
index.html) — a header copy (`.brand-lockup`) used to exist too, but was
removed 2026-09-24 at Jozsua's request ("there should only be one $MSV
logo"); click-to-home moved from that header element onto the sidebar
logo instead (wired in home.js's `initAppSidebar()`, since the sidebar
doesn't exist until home.js runs). The sidebar badge itself was
originally fixed-color (`#06120d` background, not theme-aware) so it
"looked the same in both themes" — but a fixed dark chip reads as an odd
near-black hole once sitting on the light theme's white page background,
which is what "looks weird in light mode" (Jozsua's report, 2026-09-24)
turned out to mean. Fixed by switching it to the theme's own
`--accent`/`--accent-contrast` custom properties (the same pairing
`#searchBtn` already uses) — still a solid, brand-colored badge, but one
that correctly swaps between the dark and light theme's own accent
colors instead of staying fixed.

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
the Company" description Finnhub doesn't provide, as the fallback when
FMP (below) doesn't have or can't return a fund-specific one. Gracefully
shows "No company description available... (common for ETFs and crypto,
which aren't operating companies)" when there's no company name to look
up at all.

**Financial Modeling Prep free tier** (added 2026-09-30) — real ETF fund
name/description/website/ISIN/CUSIP/beta for ANY ticker via `/profile`
(`fetchFmpEtfProfile()` in script.js), confirmed live — genuinely better
than the ~60-ticker curated `ETF_FUND_INFO` + Wikipedia-issuer-fallback
this app used before, since it's an actual fund-specific write-up, not a
generic issuer article. Optional (works the same as before without a
key, same pattern as Twelve Data/CoinGecko). Confirmed real CORS support
via a live request, so it's called directly in local dev like Finnhub/
Twelve Data. **Does NOT unlock NAV/AUM/expense ratio/holdings/sector
weighting** — those specific endpoints were confirmed paywalled on this
same key (`/stable/etf/holdings`, `/stable/etf/info` both return
"Restricted Endpoint"; `/stable/etf/sector-weighting` returns an empty
array even for SPY/QQQ) — see msv-org-github BLOCKERS.md, that "coming
soon"/parked status is unchanged. **Free tier is 250 requests/day, the
tightest budget of any key this app uses** — `/profile` is cached 24h at
the msv-api edge (see that repo's `cacheTTL()`) specifically because of
this, and it has its own usage row in the sidebar's API usage panel
(`apiUsage.js`).

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

## TradingView widgets (`tradingview.js`, added 2026-09-30)

Two SEPARATE free TradingView widgets, embedded two different ways —
don't assume one pattern covers both if extending either:

- **Chart** (ticker page, `#chartSourceToggle`): the classic `tv.js` +
  `new TradingView.widget({...})` constructor pattern. Toggled against
  the in-house `chart.js` chart; also gives crypto tickers a working
  chart for the first time (chart.js never supported crypto candles —
  Finnhub's `BINANCE:BTCUSDT` format happens to match TradingView's own
  `EXCHANGE:PAIR` syntax, passed straight through).
- **Screener** (`#screenerSourceToggle`, `screener.js`'s page):
  TradingView's newer self-initializing `embed-widget-screener.js` —
  no constructor call; you inject a `<script>` tag whose *text content*
  is a JSON config object, and it renders itself into the nearest
  `.tradingview-widget-container__widget` div. Config keys (`market`,
  `defaultColumn`, `colorTheme`, etc.) were confirmed directly from the
  widget's own loader script, not guessed from a mocked-up example.
  `market: "america"` scopes it to US stocks — real whole-market
  coverage, unlike the MSV Screener MVP's ~70-ticker curated universe it
  sits next to.

**Same license terms apply to both** (confirmed from tradingview.com/
policies/): the attribution bar can't be hidden or removed, and free use
is restricted to **non-commercial** sites — "we do not permit commercial
usage of any of our services or APIs [without] separate agreement." Fine
today (no subscriptions/ads on $MSV); if that changes, both widgets need
either a paid TradingView agreement or removal in favor of their
in-house equivalents (chart.js's chart works standalone; the MSV
Screener MVP already exists independently). See msv-org-github
BLOCKERS.md's "Standing watch-items" — revisit before any monetization.

## Config / secrets

`config.js` holds the real Finnhub/Twelve Data/FRED/CoinGecko/FMP keys
for **local dev only** and is gitignored. `config.example.js` is the
tracked template. The deployed site never uses `config.js` at all — it
calls the `msv-api` backend instead, which holds the real keys as
Cloudflare secrets (see that repo).

## Deploy safety: `.assetsignore` is not optional

`wrangler.jsonc`'s `assets.directory` is `"./"` — the whole repo root.
**Confirmed live, 2026-09-24:** deploying without a `.assetsignore` file
uploads literally everything as a publicly fetchable static asset,
including `.git/` (full commit history, branch names, refs) and
`node_modules/.cache/wrangler/wrangler-account.json` (Cloudflare account
ID + email — not an auth token, but still not meant to be public). This
happened on a real deploy before `.assetsignore` existed; both were
directly confirmed fetchable at `https://msv-web.jozsua-heng.workers.dev/.git/config`
before being fixed. `.assetsignore` (tracked, at the repo root) now
excludes `.git`, `.github`, `node_modules`, `.wrangler`, `test-results`,
`playwright-report`, `config.js`, and `wrangler.jsonc` itself — **never
remove or bypass this file**, and if the assets directory or repo
structure ever changes, re-audit what's excluded before the next deploy.

**Verifying it actually worked is trickier than it looks**, because
`not_found_handling: "single-page-application"` (see below) makes
*every* unmatched path return HTTP 200 with the app shell — checking
only the status code (`curl -o /dev/null -w "%{http_code}"`) will always
show 200 whether a path is properly excluded or genuinely still exposed.
Check the response **body** instead: a `<!DOCTYPE html>...$MSV` shell
means it's correctly falling through (excluded), while real file content
means it's still exposed. Also worth knowing: a redeploy that uploads
zero new bytes (`wrangler deploy` prints "No updated asset files to
upload") can still take a few seconds for Cloudflare's edge cache
(`cf-cache-status`) to stop serving the previous version's response for
a given path — don't conclude a fix failed from one immediate check.

## Layout gotchas (2026-09-26)

- **`body { zoom: 1.1 }` breaks `100vh`.** Anything sized off the viewport
  inside the zoomed body renders 10% too tall — the sidebar's bottom (API
  usage panel) was cut off because of exactly this. The zoom now lives in
  `--page-zoom` and viewport-sized things divide it back out
  (`calc(100vh / var(--page-zoom))`, see `.app-sidebar`, `.app-shell`,
  `.dashboard-right`). Use the same pattern for any new viewport-height
  element. The sidebar is a fixed-height column: `.app-sidebar-scroll`
  (nav, scrolls) + `.app-sidebar-footer` (API usage + disclaimer, pinned).
- **Stock/ETF tabs** (Winners/Losers/Most Active + every browse category)
  render one shared view: `renderQuotesView()` in home.js — a sortable
  dense table (`buildQuotesTable`) plus `buildStockHeatmap`. Browse
  categories now fetch live quotes on demand (`ensureBrowseQuotes`, cached
  per session, in-flight promise shared) — they used to be zero-cost
  name-only chips. Tiles are uniform size (not sized by market cap: that
  would need a profile2 call per ticker).
- **Market Intelligence is not a tab.** It's its own container
  (`#marketIntelCard`, `data-home-section="market-intelligence"`) rendered
  by `renderMarketIntel()` in supplyChain.js: an SVG dependency graph
  (`MI_LAYERS`/`MI_NODES`/`MI_EDGES`). Solid edges map to the researched
  `SUPPLY_CHAIN_RELATIONSHIPS` (sourced); dashed edges are the app's own
  structural reasoning and are labelled "Inferred" — keep that distinction
  if adding nodes, never present an inferred link as sourced. Logos come
  from Finnhub `/stock/profile2`, cached 30 days in localStorage and only
  fetched once the diagram scrolls into view (24 tickers would otherwise
  eat the 60/min Finnhub budget).
- **Calendar dates** (`ECON_CALENDAR_EVENTS`) were read directly off the
  Fed / BLS / BEA schedule pages on 2026-09-26; each row links to its
  source page. Extend them periodically (they only publish months ahead).

## Batch of 2026-09-27: new pages and their files

Still no build step: each file is a plain `<script>` sharing globals, so
**script order in index.html matters** — a file may only use another
file's functions at *call* time, but any top-level `const` that reads a
global from a later file will throw (this bit `crypto.js`, which loads
before `home.js`'s `CRYPTO_COINGECKO_IDS`; it now looks it up lazily).
Order: config, definitions, changelog, sectorRules, analysis, clock,
script, dataUtils, apiUsage, countries, worldMarkets, marketData,
riskDashboard, supplyChain, sectors, etfs, crypto, home, learn, chart,
tradingview, invest, autocomplete, compare.

- `countries.js` — the 42-country table (`iso2` = worldmap.svg class,
  `etf` = live-verified US-listed country ETF), group tags (BRICS,
  developed, emerging, frontier, G7) and the map projection. The basemap
  is **not** a standard equirectangular fit: `X = 7.6407*lon + 1270.42`,
  `Y = -7.7154*lat + 757.56`, derived from country bbox centres and
  checked by testing each dot with `isPointInFill`. Use `mapLonToX`/
  `mapLatToY`; never hand-place dots.
- `dataUtils.js` — shared throttled+cached fetch layer
  (`fetchQuoteCached`, `fetchMetricCached`, `loadQuotesThrottled`;
  quote TTL 2 min, metric TTL 15 min), formatters, `sparklineSvg`,
  `lineChartSvg`. Finnhub's free tier is 60/min shared, so **any page that
  loads many tickers must go through this**, not raw `fetchJSON`.
- `worldMarkets.js` / `marketData.js` / `riskDashboard.js` — the Market
  Data page (map, hover card, country profile, risk dashboard). World Bank
  is called one indicator at a time using the multi-country `;` syntax
  (`mrnev=1`); bursts get throttled, so `wbLimit` (4 at once) + `wbRetry`
  (3 tries). Taiwan isn't covered by the World Bank. Risk bands are
  rules of thumb, always shown as such — never forecasts.
- `sectors.js` — 11 sectors + 52 industries/themes, each tracked by an ETF
  (a *proxy*; sector ETF holdings aren't free). "Representative companies"
  are a **curated list, explicitly not live holdings**; all were
  live-quote-checked 2026-09-27 and dead ones pruned (delisted/acquired:
  EA, CMA, MRO, CTRA, ABB, …; SQ→XYZ, FI→FISV).
- `etfs.js` — 42 categories / ~290 ETFs in 8 families; every ticker
  live-checked. Expense ratio, holdings and AUM are paywalled (see
  BLOCKERS.md), so not shown.
- `crypto.js` — CoinGecko (via msv-api): `/global`, `/coins/markets`
  (top 100 with sparkline + 1h/24h/7d/30d/1y changes in one call),
  `/search/trending`, `/coins/categories`, `/coins/{id}` + `market_chart`.
  alternative.me (Fear & Greed) and DefiLlama (chain TVL, stablecoins) are
  called **directly from the browser** (both CORS-open, no key) — so they
  don't appear in the API-usage panel. CoinGecko's free tier returns
  **empty** community/developer data (verified 2026-09-27), so the coin
  panel doesn't show them.
- Routing: `sectors`, `etfs`, `crypto`, `market-data` are page-only cards
  (`data-page-only="true"`, section key in `data-home-section`) shown by
  `showHomeFocused()`. `indexes`/`bonds`/`commodities` are shortcuts into
  ETF categories. The stock pill row is shown only for stock tabs
  (`STOCK_PILL_TABS`).
- **Gotcha when bulk-editing data files with scripts:** `sectors.js`
  mixes `reps: ["A","B"]` (industries) and `reps: [["A","Name"],…]`
  (sectors). A naive regex mangled it once; use bracket matching.
- Sidebar: `Crypto` now sits in its own group (with two "Soon"
  placeholders, `bitcoin-cycles` and `crypto-news`) between `macro` and
  `portfolio-builder`, previewing content that only exists in
  `react-poc/` so far.

## React proof of concept (`react-poc/`, 2026-09-27) — Phase 1 deployed 2026-09-30

The Crypto page rebuilt in React + TypeScript (Vite), approved as a first
step towards migrating the whole frontend. Its own `package.json`/
`node_modules`, and `react-poc`'s *source* is listed in `.assetsignore` so
`wrangler deploy` never uploads it. Run with `cd react-poc && npm run dev`
(localhost:5173); it calls the same deployed `msv-api` proxy, so no local
API keys are needed. See `react-poc/README.md` for the file layout and the
vanilla-to-React mapping.

**React migration Phase 1 — build pipeline proven in production
(2026-09-30):** `npm run build` (inside `react-poc/`) now outputs to a new
sibling folder `msv-web/react-crypto/` (not the default `react-poc/dist/`,
which stays excluded wholesale by `.assetsignore`) — see `vite.config.ts`'s
`outDir`/`base` settings. `react-crypto/` is a plain top-level static
folder like any other, gitignored (it's a build artifact, regenerated
before each deploy that includes it — **there's no CI/CD auto-build yet**,
`npm run build` must be run by hand before `npx wrangler deploy` whenever
this changes). Deployed and verified live: real data renders at
[msv-web.jozsua-heng.workers.dev/react-crypto/](https://msv-web.jozsua-heng.workers.dev/react-crypto/)
(confirmed via a real browser check, zero console errors), and — just as
important — `react-poc/`'s actual source/config/node_modules were
confirmed still NOT publicly fetchable afterward (checked the response
*body*, not just status code, same discipline as the `.assetsignore`
verification story above, since the SPA fallback returns 200 for
literally everything). Linked from the live Crypto page as a clearly
labelled beta, **not yet a replacement** for the real page. A new
`react-build` CI job (`.github/workflows/ci.yml`) runs `npm ci && npm run
build` inside `react-poc/` on every PR so a broken build fails before
merge — build-only, doesn't need a real API key since Vite never executes
the code, just bundles it.

**Next phase (not started):** migrate a real page's actual functionality
into this pipeline — Crypto itself is the natural first candidate, since
its POC already exists; see the org's TODO.md for the fuller page-by-page
migration order (Sectors/ETFs/Screener/Market Data next, ticker deep-dive
page last).

Grew same-day from a straight rebuild into 8 tabs (Overview, Markets,
Exchanges, DeFi, Stablecoins, Crypto Cycles, News, Learn) once Jozsua
asked for it to be "flooded with more data." Notable pieces:
- **Movers ("why did this move")** (`components/Movers.tsx`): a coin's
  24h move is explained either by a real news article actually matched to
  it, or a plainly labelled data signal (unusual volume, trending,
  reversal) — never a guessed cause. `matchNews()` uses **word-boundary**
  regex, not a plain substring search — a straight `.includes()` first
  version matched the coin "Quant" to an unrelated article mentioning
  "quantum" cryptography, found and fixed before shipping. If extending
  this, keep the word-boundary approach for any new short/common-word
  coin names.
- **Crypto Cycles** (renamed 2026-09-30 from "Bitcoin Cycles" — same tab,
  component/file names unchanged: `components/BitcoinCycles.tsx`,
  `lib/bitcoin.ts`) — a Bitcoin Rainbow Chart and Stock-to-Flow model.
  Both are pure
  deterministic math (the halving schedule and a published log-regression
  formula), computable for any date with **zero API calls** — only the
  actual price line needs fetched data, and CoinGecko's free plan caps
  history at 365 days (confirmed live, 2026-09-27: `days=max` returns a
  PRO-only error). So the bands/S2F curve are drawn across the full
  2015–2040ish range for visual context, while the real price line only
  covers the last year — labelled as such. Both models are shown as
  well-known community tools with explicit "not a prediction" caveats,
  consistent with this project's no-fabricated-forecasts rule (see "No
  fabricated forecasts" above).
- **News tab** (`components/CryptoNews.tsx`): a live Finnhub crypto feed
  (`finnhubNews()` in `lib/api.ts`, via the same msv-api proxy) plus a
  hand-written, dated "Regulation & Adoption tracker." Every tracker fact
  (CLARITY Act, GENIUS Act, MiCA, UAE/Hong Kong) was checked with a live
  web search before writing, not pulled from training data — crypto
  policy moves too fast to trust a knowledge cutoff. Re-verify dates
  before reusing this content later.
- State lives in the URL (`?tab=`, `?coin=`) and `localStorage`
  (favourites, theme, auto-refresh) — no backend.

## Fixed: `config.js` 404 was throwing a console error (found and fixed 2026-09-27)

`index.html` always had `<script src="config.js">`; in production that
file doesn't exist on purpose (see "Config / secrets" above). Before
`not_found_handling: "single-page-application"` was added (2026-09-24)
this was a plain, silent 404. After that, a missing path returned the
full HTML app shell with a 200 instead — and a `<script>` tag fed HTML
instead of JS throws `Uncaught SyntaxError: Unexpected token '<'` instead
of failing silently. Confirmed harmless either way (nothing in production
reads `FINNHUB_API_KEY`; every reference to the four config constants
elsewhere is either `typeof`-guarded or sits behind an `IS_LOCAL_DEV &&`
short-circuit that's `false` in production), but it was a real, visible
console error on every production page load.

**Fix:** the `<script src="config.js">` tag was replaced with a tiny
inline script that only `document.write`s that tag when
`location.hostname` is `localhost`/`127.0.0.1`/empty — the same check
`IS_LOCAL_DEV` uses. Production now never requests `config.js` at all, so
the SPA fallback never gets a chance to hand it HTML. Doesn't touch
`.assetsignore` or the SPA fallback setting. If `IS_LOCAL_DEV`'s hostname
list in script.js ever changes, update this inline script's copy too —
it's duplicated (deliberately — it has to run before `script.js` loads).
