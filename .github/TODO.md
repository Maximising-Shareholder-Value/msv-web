# To-Do

This is the working checklist — the actual, specific next steps, broken
down small enough that each one is a real thing someone could sit down
and do, not a vague goal. If [ROADMAP.md](ROADMAP.md) is "what are we
building and why," this file is "okay, so what do I actually do Monday
morning." Items get a `[x]` and a short note on how/when they were
finished rather than being deleted once done — that note then usually
gets folded into [HISTORY.md](HISTORY.md) too, so nothing about a
finished item is ever fully lost, just moved to where it belongs.

## Pillar 1: multi-asset-class indicators

- [x] **Audit which real ticker searches currently return N/A-heavy
      pages — done 2026-09-19, against the live production site (real
      data, not assumptions).** Tested AAPL (stock), VOO (index fund
      ETF), TLT (bond ETF), GLD/USO (commodity trust ETFs), UNG (futures-
      based commodity ETF), URA (uranium miners ETF), BTC/ETH (crypto) —
      **every one of them renders clean, with zero N/A in any visible
      card.** The one N/A found (AAPL's Insider Transactions table, 2
      instances) is a real, individual SEC Form 4 filing missing a
      `transactionPrice` field on 2 specific rows — correct behavior, not
      a bug. **Conclusion: the 2026-09-13 ETF/crypto redesign already
      solved this pillar for every asset type that has real free-tier
      data behind it** — commodity ETFs (both trust-structured like GLD
      and futures-based like UNG) were already covered by the same
      `getInstrumentType()` logic without any extra work needed.
- [x] Also confirmed: searching a symbol with genuinely zero coverage
      (tested a real Treasury CUSIP) degrades gracefully — stays on the
      home view with a status message, no crash, no broken dashboard.
- [x] ~~Clarify what "CDCs" meant in the original ask~~ — dropped,
      2026-09-19, per Jozsua ("let's ignore CDCs for now").
- [x] **Researched whether one source covers both bonds and options —
      done 2026-09-19, see [API_RESEARCH.md](API_RESEARCH.md) for the
      full comparison (EODHD, Alpaca, Tradier, Polygon/Massive).
      Conclusion: no free/hobby-accessible source covers both** — EODHD
      has both but paywalled (~$100/mo bundle); Alpaca has both but
      bonds specifically requires a business-level "Broker API"
      partnership, not reachable by a solo project. Treat as two
      separate decisions:
      - **Options: Alpaca's Trading API** — genuinely free, self-serve
        (email signup, free paper account, no funding/approval), real
        options chains. This replaces FlashAlpha as the lead candidate.
      - **Bonds: still no free path anywhere.** "Browse via bond ETFs"
        stays the answer unless the project ever wants to pay ~$100/mo.
- [x] **Alpaca backend proxy — done and live, 2026-09-21.** Jozsua
      created a free paper-trading account and shared the API Key
      ID/Secret. Added as Cloudflare secrets on `msv-api`
      (`ALPACA_API_KEY_ID`/`ALPACA_API_SECRET_KEY`), plus a new
      `/api/alpaca` route (`proxyAlpaca()` in `worker.js`, header-based
      auth) proxying `data.alpaca.markets/v1beta1`. Deployed and tested
      live: a real AAPL options chain with real bid/ask came back
      through the proxy. See msv-api's `CLAUDE.md` for the implementation
      detail.
- [ ] **Still open: the actual options UI on msv-web.** The backend can
      now serve real options data, but nothing on the frontend requests
      or displays it yet — no "Options" section on the ticker page, no
      way to browse strikes/expirations. This is the next real piece of
      work, not yet scoped in detail (needs a design decision on what an
      options view should even look like for a beginner-friendly app —
      full chain table? a few key strikes only? worth discussing before
      building blind).

## ETF/index fund page enhancements (scoped 2026-09-19)

Blocked on confirming a free data source — see the "Fund overview,
holdings & sector weighting" section in
[API_RESEARCH.md](API_RESEARCH.md). Finnhub's ETF-specific endpoints are
confirmed premium-gated (live-tested), so this needs a new vendor.
**Next concrete step: sign up for a free FMP key (email only, no card)
and test the ETF Holdings/Sector Weighting/Information endpoints live**
— same pattern as the Alpaca options decision. Also worth testing
whether Twelve Data's existing key (already in use for charts) unlocks
their Fundamentals/ETF endpoints before adding FMP as a second vendor.

Once a source is confirmed, this covers three asks:
- [ ] **"About the fund" overview section** for ETFs/index funds
      (parallel to the stock "About the Company" card) — category (e.g.
      Large Blend), fund family, net assets/AUM, NAV, expense ratio,
      yield, legal type, YTD daily total return.
- [ ] **Holdings + sector weighting** section — top holdings and sector
      breakdown for ETFs.
- [ ] **New indicator audit result (2026-09-19):** cross-checked
      Jozsua's requested indicator list against what's already live —
      previous close, open, day high/low, 52-week range (+ gauge), avg
      volume (10-day/3-month), beta, and period returns (5-day through
      52-week) **are already shown for ETFs today**, confirmed via a
      live `/stock/metric` request that returned exactly those fields
      and nothing else. Genuinely missing, confirmed not available on
      any currently-used free source: **bid, ask, today's volume** (a
      general free-tier gap, not ETF-specific — Finnhub's free quote
      endpoint has never included these, for any instrument type), and
      the fund-classification cluster above (NAV, AUM, expense ratio,
      category, fund family, legal type, yield) blocked on the same
      FMP/Twelve Data confirmation. Add `(?)` tooltip definitions for
      whichever of these actually get built, matching the existing
      pattern in `definitions.js`.

## Embedded side-by-side comparison (scoped 2026-09-19)

A Compare feature already exists as its own page (`compare.js`) — this
is a **different** ask: a comparison section embedded directly on the
individual stock/ETF deep-dive page itself, showing similar assets in
the same class/industry/sector side by side without leaving the page.
Needs a design decision (which "similar assets" get picked
automatically — same-sector peers via Finnhub's `/stock/peers` for
stocks? same `BROWSE_CATEGORIES` bucket for ETFs?) before building.

## Pillar 5: explain-the-concept education layer

- [ ] Pick the first 3-5 concepts to cover (e.g. "what a rate hike means,
      by sector" is the one already discussed) and draft the plain-English
      copy before writing any code — this is mostly a writing task.
- [ ] Decide where it lives in the UI (tooltip-style like existing
      indicator definitions, or a dedicated "Learn" section) — small
      product decision, worth a quick check-in rather than guessing.

## Pillar 2+3: supply chain visualization pilot

- [ ] Pick the pilot theme (AI infrastructure is the natural first choice
      — it's Jozsua's own recurring research interest per the attached
      Claude conversations from 2026-09-19).
- [ ] Curate 5-10 companies and their real upstream/downstream
      relationships — this is a research task, likely LLM-assisted but
      needs human verification per company, not a live feed.
- [ ] Decide the data format (static JSON shipped with the frontend is
      the simplest starting point — no new backend needed).
- [ ] Design the actual visualization (this is the "sexy visual" ask —
      worth a dedicated design pass once the data shape is known, not
      before).

## Pillar 4: multi-country macro dashboard

- [x] **World Bank backend proxy — done and live, 2026-09-21.** Jozsua
      chose World Bank directly (broadest country coverage) rather than
      starting with OECD/DBnomics as originally suggested. No key/signup
      needed at all — confirmed it has zero CORS support of its own
      (same as FRED), so it's proxied via a new `/api/worldbank` route on
      `msv-api` (reuses the existing generic `proxy()` function). Tested
      live: real Singapore CPI inflation and real Indonesia GDP growth
      both came back correctly.
- [ ] **Still open: the actual macro dashboard UI on msv-web.** The
      existing Macro tab (`home.js`) is hardcoded to US-only FRED series
      — needs a country selector, a way to fetch/display World Bank
      indicators per country, and ideally a comparison view (2+ countries
      side by side, matching the original ask). Not yet scoped in detail.
- [ ] OECD SDMX/DBnomics (callable directly from the browser, no proxy
      needed) remain an option to add later for countries/indicators
      World Bank doesn't cover well — not blocking, since World Bank
      alone already covers virtually every country.

## Pillar 6: AI research companion — validation step only, for now

- [ ] Ship a small set of **static** curated research threads (same
      shape as the two conversations that inspired this) as a taste test,
      before building any live LLM integration.
- [ ] Only after that: decide a cost model (who pays per query, any usage
      caps) before wiring up real API calls.

## Home page enhancements (not tied to a big pillar, but real asks)

- [ ] **Recently Viewed as a sidebar column.** Currently a horizontal row
      above the tabs (`renderRecentlyViewed()` in `home.js`) — Jozsua
      wants this reworked into a left- or right-hand column, with the
      ability to organize/categorize the entries rather than just a flat
      recency list (2026-09-19 ask). Needs a design decision on what
      "organize/categorize" means concretely (manual tags? auto-grouped
      by asset type? a watchlist rather than just recently-viewed?)
      before building — worth a quick check-in rather than guessing.
- [ ] **Compare, extended.** A Compare feature already exists
      (`compare.js`, up to 4 tickers side by side, reuses the same
      sector/traffic-light logic as the deep-dive page) — Jozsua's
      2026-09-19 ask adds "underlying assets" to what gets compared,
      which the current version doesn't do (e.g. an ETF/index fund's
      actual holdings/composition, not just its price stats). Needs
      research into whether Finnhub's free tier (or any source in
      [API_RESEARCH.md](API_RESEARCH.md)) exposes fund holdings at all
      before promising this.

## Homepage feature recommendations (brainstormed 2026-09-19, not yet chosen)

Asked for "an extensive range of recommendations" to consider adding —
these are options, not commitments. Roughly ordered by how cheap/easy
each would be given the app's existing zero-cost architecture:

- **Upcoming earnings calendar strip** — Finnhub's `/calendar/earnings`
  is already used per-ticker (deep-dive page); a homepage-wide version
  ("who reports this week") is the same endpoint, no new data source.
- **Economic calendar** (next Fed meeting, next CPI/jobs report date) —
  pairs naturally with the Macro tab; FRED doesn't provide calendar
  dates directly, would need a small curated/hand-maintained list rather
  than a live feed (dates are known well in advance, low maintenance).
- **A real watchlist**, separate from Recently Viewed — user manually
  adds/removes tickers, stored in `localStorage` (same zero-backend
  pattern already used for theme and recently-viewed). Natural pairing
  with the "Recently Viewed as a sidebar column" item above.
- **Sector performance heatmap** (not per-stock — per-sector, e.g. using
  the `XL*` sector ETFs already in the ETFs browse category) — cheap,
  reuses tickers already fetched or easily added.
- **"Did you know" rotating fact** tied to Pillar 5 (the education
  layer) — a small, free way to surface bite-sized learning content on
  every visit once that content exists.
- **Currency/FX strip** (USD/SGD, USD/AUD, etc.) — Twelve Data supports
  forex; would need to confirm free-tier forex coverage before building
  (Finnhub's free tier explicitly does NOT cover forex — see the root
  `CLAUDE.md` — so this would lean on Twelve Data or a new source).
- **Trending/most-searched tickers this week** — needs some form of
  shared counter across visitors, which the current architecture doesn't
  have (everything today is per-browser, no shared backend state) — the
  one item here that's a real architecture addition, not just more UI.

## Standalone items

- [x] CI: JS syntax check + Playwright smoke test on every PR — done
      2026-09-19, see [HISTORY.md](HISTORY.md).
- [x] Governance docs (this folder) — done 2026-09-19.
- [x] Home page: more explanatory copy + a "how to use" popup (paginated
      modal, not inline) — done 2026-09-19.
- [x] Home page: world map / ticker strip switched to placeholder data —
      done 2026-09-19, see the tradeoff note in [ROADMAP.md](ROADMAP.md).
- [x] Browse categories bumped ~50% more tickers each (12 → 18 per
      category) — done 2026-09-19.
- [x] "What's New" in-app popup (`changelog.js`, 🔔 in header) — done
      2026-09-21, see HISTORY.md Phase 10. **Keep this updated going
      forward, same discipline as HISTORY.md/TODO.md** — add a new dated
      entry to `CHANGELOG` in `changelog.js` whenever a real
      user-visible change ships.
- [x] Intro copy rewritten in a more professional/editorial tone — done
      2026-09-21.
- [x] Global Markets map/sidebar trimmed to countries-only (20 → 13
      tickers) — done 2026-09-21.
- [x] New "Commodities" browse category (18 tickers) — done 2026-09-21.
- [x] Governance doc intros simplified/elaborated — done 2026-09-21.
- [x] "What's New" badge swapped from an auto-popup to a quiet red dot
      on the bell, cleared on click — done 2026-09-21 (the auto-popup
      was more intrusive than intended).
- [x] **Six-pillars breakdown — done 2026-09-21**, see the "Pillar
      breakdown" section in [ROADMAP.md](ROADMAP.md) for the full detail
      (sub-parts, status, effort, open decisions per pillar).
- [ ] **Still open: which pillar(s) to actually start building, and at
      what pace.** The breakdown above is what's needed to make that
      call — waiting on Jozsua's decision, not yet started.
- [ ] Quagmire hub page link to $MSV — checked 2026-09-19, currently
      live and correctly pointing at
      `https://msv-web.jozsua-heng.workers.dev/` (verified via a real
      HTTP request, page title, and `wrangler deployments list`). Need
      Jozsua to clarify what "the new link on Cloudflare" refers to
      before changing anything — possibly a custom domain not set up
      yet, or a different Cloudflare account than the one currently
      deployed to.
- [ ] Custom domain for $MSV (optional, cosmetic — from the original
      "Moving forward with $MSV" list, not urgent).
