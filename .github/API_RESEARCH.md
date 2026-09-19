# Finance & Macro Data API Research

Researched 2026-09-19 for the roadmap's multi-asset-class (pillar 1) and
multi-country macro (pillar 4) work. Where possible, claims here are
**confirmed by a live request**, not just taken from a blog post — this
repo's own `CLAUDE.md` has a strong "confirmed directly, not assumed"
culture around free-tier claims (they change, and secondhand summaries
get them wrong often), so this doc keeps that standard.

## Currently in use

| Source | Used for | Free tier | CORS (browser-callable?) |
|---|---|---|---|
| Finnhub | Stocks, ETFs, quotes, recs, earnings, news | 60 calls/min | Yes (confirmed, already used directly in local dev) |
| Twelve Data | Price charts | 800/day, 8/min | Yes (confirmed, already used directly in local dev) |
| CoinGecko | Crypto | Public tier, no key needed for basic use | Yes (confirmed, already used directly in local dev) |
| FRED | US-only macro (rates, CPI, unemployment, etc.) | Free, needs a key | **No** — this is why it's the one API always proxied through msv-api, even in local dev |

## Candidates for multi-asset-class coverage (pillar 1)

| Source | What it adds | Free tier | Notes |
|---|---|---|---|
| **Financial Modeling Prep (FMP)** | Broad fundamentals + bonds/commodities reference data alongside prices | 250 calls/day, 500MB/30-day bandwidth cap | Broadest single alternative if Finnhub's free tier gap on bonds ever needs a second source rather than just substituting bond ETFs (current approach) |
| **EOD Historical Data (EODHD)** | Global exchange coverage, long historical data, has an options add-on | Free tier exists but is limited; options data is a paid add-on | Better fit as a future paid upgrade than a free-tier swap |
| **Alpha Vantage** | General market data | 5 calls/min, 15-min delay | Rate limit is too low to be a serious Finnhub replacement, not worth adopting for its own sake |
| **FlashAlpha** | **Options chains** (bid/ask, IV, Greeks, open interest) | Has a free tier (exact limits not confirmed — check before building on it) | The only *free* options-with-Greeks source found; everything else (Intrinio, Databento, EODHD's options add-on) is paid. Worth a spike before committing pillar 1's options coverage to it. |

**Reality check on bonds and options specifically:** neither has a clean
free live-data source. Individual bonds have zero coverage on Finnhub's
free tier (confirmed, documented in `CLAUDE.md` already) — the existing
"show bond ETFs instead" approach on the home page browse category is
still the pragmatic answer, not a gap to fix with a new API. Options are
similar: FlashAlpha is the only free option, unverified at production
scale. Recommendation: don't block pillar 1 on solving these two — ship
real indicators for commodities/index funds/bonds-as-ETFs first (all
achievable with existing Finnhub/Twelve Data access), and treat options
as a distinct, smaller follow-up once FlashAlpha's actual limits are
confirmed by a live test.

### Follow-up: is there ONE source for both bonds and options? (2026-09-19)

Asked specifically — researched four more candidates looking for a
single vendor covering both, to avoid juggling two separate
integrations. Short answer: **no free or self-serve-accessible source
covers both.** Every vendor that has both bundles them differently:

| Source | Bonds | Options | Verdict |
|---|---|---|---|
| **EODHD** | Real corporate + government bond data via ISIN/CUSIP | Via a paid marketplace add-on | Both exist, but **both are paid** — the "ALL-IN-ONE" bundle (EOD + Fundamentals + Calendar + Bonds) is $99.99/month, options is a separate paid add-on on top. Free tier (20 calls/day) includes neither. |
| **Alpaca** | Real US Treasury bills + 500+ corporate bonds | **Free** — confirmed live via their docs: full options trading + real-time/historical options data through the standard self-serve Trading API, enabled by default on a free paper account (just an email signup, no funding, no approval) | **Bonds require the separate "Broker API," which needs a business partnership/application — not reachable by a solo hobby project.** Options, however, is genuinely free and self-serve. |
| **Tradier** | Not offered at all | Real-time data requires a *funded* live brokerage account; sandbox gives delayed data only | Doesn't solve either half cleanly for a free/hobby setup |
| **Polygon.io (now branded Massive)** | **Not offered at all** — confirmed via their live pricing page (stocks, options, indices, currencies, futures — no bonds/fixed-income product exists) | Free tier exists for stocks (5 calls/min) but options-specific free tier wasn't disclosed on the pricing page | Options-focused only, no bonds story at any price |

**Practical recommendation:** treat bonds and options as two separate
decisions, not one:
- **Options** — **Alpaca's Trading API is the answer**, and it's
  actually better than the FlashAlpha lead from the first pass: fully
  free, self-serve (email signup, free paper account, no funding or
  approval needed), real-time and historical options chains. Update:
  supersedes the FlashAlpha spike as the next step if/when options
  coverage gets built.
- **Bonds** — still a genuine free-tier dead end everywhere checked.
  The only way to get real individual-bond data is to either pay EODHD
  ~$100/month (which would also happen to unlock options from the same
  vendor, undercutting the case for Alpaca) or pursue a business-level
  partnership (Alpaca Broker API) — neither fits a hobby project's
  zero-cost architecture. **"Browse via bond ETFs instead" remains the
  right call** unless real revenue ever justifies a paid data bill.

## Candidates for multi-country macro (pillar 4)

FRED is Federal Reserve data — **US only** by definition. Two genuinely
free, multi-country alternatives were found and CORS-tested live today:

| Source | Coverage | Free tier | CORS | How to integrate |
|---|---|---|---|---|
| **World Bank Open Data API** | Any country, GDP/inflation/unemployment/20,000+ indicators | Free, **no API key at all** | **No** — confirmed via a live request from a `localhost` origin, no `Access-Control-Allow-Origin` header came back | Needs a new proxy route on msv-api, same pattern as FRED today |
| **OECD SDMX API** | ~38 OECD member countries, GDP/CPI/trade/labor | Free, **no API key at all** | **Yes** — confirmed live: the response echoed back `access-control-allow-origin: <the calling origin>` | Can be called **directly from the browser**, no backend proxy needed — cheaper to build than FRED was |
| **DBnomics** | Aggregates ECB, IMF, World Bank, OECD, Eurostat, FRED into one API | Free, no key needed for basic queries | **Yes** — confirmed live, same CORS-echo behavior as OECD | Worth considering as a single integration point instead of wiring up World Bank/OECD/ECB separately — trades a little flexibility for a lot less integration work |

**Recommendation when pillar 4 starts:** prototype against OECD SDMX or
DBnomics first specifically *because* they don't need the msv-api proxy
detour — that's a real complexity reduction versus how the FRED tab was
built. Fall back to World Bank (proxied) only for countries/indicators
OECD doesn't cover.

## Sources

- [Best Free Stock Market APIs and Data Tools in 2026 (DEV Community)](https://dev.to/nexgendata/best-free-stock-market-apis-and-data-tools-in-2026-a-developers-honest-comparison-1926)
- [12 Must-Have Financial Market APIs for Real-Time Insights in 2026 (HackerNoon)](https://hackernoon.com/12-must-have-financial-market-apis-for-real-time-insights-in-2026)
- [Best Financial Data APIs in 2026 (nb-data)](https://www.nb-data.com/p/best-financial-data-apis-in-2026)
- [Options Chain API - Real-Time Greeks, IV, Open Interest (FlashAlpha)](https://flashalpha.com/articles/options-chain-api-real-time-greeks-open-interest)
- [Options Chain Data Providers: Free and Real-Time Sources (Oyamori)](https://oyamori.com/learning/options-chain-data-providers/)
- [FMP API Review: Pricing, Free Tier & Limits (2026) (Find My Moat)](https://www.findmymoat.com/tools/financial-modeling-prep-fmp)
- [5 Free APIs for Global Economic Data in 2026 (DEV Community)](https://dev.to/sotwdata/5-free-apis-for-global-economic-data-in-2026-no-api-key-needed-1ocf)
- [Indicator API Queries (World Bank Data Help Desk)](https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries)
- [OECD SDMX API documentation](https://data.oecd.org/api/sdmx-ml-documentation/)
- CORS support for World Bank/OECD/DBnomics: confirmed directly via live `curl` requests with an `Origin` header on 2026-09-19, not taken from any of the above sources (none of them documented it clearly).
- [Tradier Market Data docs](https://docs.tradier.com/docs/market-data)
- [Alpaca Fixed Income docs](https://docs.alpaca.markets/us/docs/fixed-income) — confirms Broker-API-only gating for bonds
- [Alpaca Options Trading docs](https://docs.alpaca.markets/us/docs/options-trading) — confirms free self-serve paper-account access
- [Alpaca expands fixed income to corporate bonds (Alpaca blog)](https://alpaca.markets/blog/alpaca-expands-fixed-income-offering-to-include-corporate-bonds/)
- [Massive (Polygon.io) pricing](https://massive.com/pricing) — confirms no bonds/fixed-income product exists
