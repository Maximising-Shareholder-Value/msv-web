# To-Do

Concrete, actionable items — see [ROADMAP.md](ROADMAP.md) for the
reasoning behind the ordering and [HISTORY.md](HISTORY.md) for what's
already been done. Check items off as they land; move finished groups
into HISTORY.md instead of just deleting them, so the record stays
intact.

## Up next — Pillar 1: multi-asset-class indicators

- [ ] Audit which real ticker searches currently return N/A-heavy pages —
      test a handful of real bonds, commodity ETFs, and index funds
      against the live app and note exactly what's missing, rather than
      assuming from the code alone. (ETF and crypto instrument types were
      already redesigned 2026-09-13 — confirm they're actually solid
      before assuming this pillar starts from zero.)
- [ ] Clarify what "CDCs" referred to in the original ask (2026-09-19) —
      likely a typo (CDs? CDS/credit default swaps? something else?) —
      before building indicators for the wrong asset class.
- [ ] Decide the bonds approach: individual bonds have zero free-tier
      Finnhub coverage (confirmed) — likely stays "browse via bond ETFs"
      rather than a new data source. Confirm this is still the right call
      rather than silently re-deciding it mid-build.
- [ ] Spike FlashAlpha's actual free-tier limits (a live request, not the
      marketing page) before committing to it for options — see
      [API_RESEARCH.md](API_RESEARCH.md).
- [ ] Build/extend `getInstrumentType()` and `applyInstrumentTypeUI()` for
      whatever gaps the audit above actually finds.

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

## Small, standalone items (not tied to a pillar)

- [x] CI: JS syntax check + Playwright smoke test on every PR — done
      2026-09-19, see [HISTORY.md](HISTORY.md).
- [x] Governance docs (this folder) — done 2026-09-19.
- [ ] Home page: more explanatory copy + a "how to use" section — in
      progress 2026-09-19.
- [ ] Home page: world map / ticker strip switched to placeholder data —
      in progress 2026-09-19, see the tradeoff note in
      [ROADMAP.md](ROADMAP.md).
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
