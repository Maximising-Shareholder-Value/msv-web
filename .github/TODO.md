# To-Do

Concrete, actionable items — see [ROADMAP.md](ROADMAP.md) for the
reasoning behind the ordering and [HISTORY.md](HISTORY.md) for what's
already been done. Check items off as they land; move finished groups
into HISTORY.md instead of just deleting them, so the record stays
intact.

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
- [ ] **What's actually left is narrower than originally scoped:**
      individual bonds and options have **zero free-tier data available
      anywhere** (not a rendering bug — there's nothing to render). The
      only real remaining decisions:
      - Confirm "browse bond ETFs instead of individual bonds" stays the
        answer (already the case today, seems right).
      - Decide whether options are worth pursuing via FlashAlpha (needs
        a live spike of its actual free-tier limits first — see
        [API_RESEARCH.md](API_RESEARCH.md)) or explicitly deprioritized.
- [ ] Still need Jozsua to clarify what "CDCs" meant in the original ask
      (2026-09-19) — likely a typo (CDs? CDS/credit default swaps?
      something else?) — in case it points at a real gap the audit above
      didn't think to test.

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

- [ ] Prototype against OECD SDMX or DBnomics first (both callable
      directly from the browser, no proxy needed — see
      [API_RESEARCH.md](API_RESEARCH.md)).
- [ ] Design the country-selector / comparison UI.
- [ ] Only add a World Bank proxy route on msv-api if OECD/DBnomics don't
      cover a country or indicator that's actually needed.

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
