# Project History

A chronological record of how $MSV got to its current state — for future
collaborators who weren't here for any of this, and so Jozsua has one
place to point people instead of re-explaining it each time. This is the
**what-happened-when** view; day-to-day technical reasoning (why a
specific bug fix works the way it does, what a free-tier API will and
won't return) lives in each repo's own `CLAUDE.md`, not here.

Compiled from the real git history of the archived original repo and the
two current repos — not reconstructed from memory.

## Phase 1 — Built as one repo (2026-07-30 to 2026-08-27)

$MSV started as a single combined repo
([JozsuaHeng/Maximising-shareholder-value](https://github.com/JozsuaHeng/Maximising-shareholder-value),
now archived) containing both the frontend and the Cloudflare Worker
proxy, built in a fast, iterative run over about a month:

- **Jul 30** — initial commit: the core stock dashboard (search, deep-dive
  page, plain-English tooltips).
- **Jul 31** — first public deployment attempt (Cloudflare Pages
  Functions), then corrected to a real Cloudflare Worker; rate-limit
  resilience and a chart session-gap rendering bug fixed.
- **Aug 1** — lazy-loaded home page categories; ticker search autocomplete
  and side-by-side comparison view added.
- **Aug 4** — home page rebuilt as tabs; FRED Macro tab and CoinGecko
  crypto tab added; chart range semantics fixed; insider transactions
  added; a background pre-warming layer (KV + cron) added.
- **Aug 6-7** — a dense stretch of fixes and features: specific
  fetch-error messages, the 1W chart layout bug, candlestick toggle, the
  "What If You'd Invested?" calculator, self-explanatory SEC filings, a
  varied Outlook headline, **the KV/cron pre-warming layer removed again**
  in favor of simpler on-demand edge caching, a full homepage overhaul,
  the ranking universe trimmed to control API cost, and the first real
  geographic world map (replacing an earlier decorative graticule-only
  version).
- **Aug 8-27** — several rounds of world map redesign (callout boxes →
  floating stroke-outlined text → the current drop-shadow text approach),
  the sidebar ticker list briefly expanded to 30 then reverted to 20 after
  it broke the map's layout, a market breadth strip added, more macro
  indicators added to the Macro tab.
- **Sep 13** — ETF and crypto instrument types redesigned (previously
  rendered as a wall of "N/A" using the stock-shaped sections).

This phase is where almost all of the app's actual product surface got
built. See each current repo's `CLAUDE.md` for the technical detail
behind any of these — most of it is still directly relevant.

## Phase 2 — Split into the Maximising-Shareholder-Value org (2026-09-15)

**Sep 15** — the combined repo was split into two independently
deployable pieces once the project moved under a dedicated GitHub org and
outside collaboration became a real possibility:

- **[msv-web](https://github.com/Maximising-Shareholder-Value/msv-web)** —
  the frontend (this repo).
- **[msv-api](https://github.com/Maximising-Shareholder-Value/msv-api)** —
  the Cloudflare Worker backend/proxy.
- The old combined repo was archived; its old combined Worker deployment
  was deleted once the split was verified working.
- Git history was **not** carried over — both new repos started fresh.
  (This file exists partly to recover that lost continuity for anyone
  reading only the new repos.)
- `API_BASE_URL` (in `script.js`) was introduced as the one seam that
  lets the frontend call a separately-deployed backend instead of
  assuming same-origin `/api/xxx` paths.

## Phase 3 — Deployment hardening (2026-09-15 to 2026-09-18)

- **Sep 16** — `API_BASE_URL` pointed at the actually-deployed `msv-api`
  Worker (`https://msv-api.jozsua-heng.workers.dev`), verified with a live
  quote coming back through it.
- **Sep 18** — `wrangler.jsonc` added for static-assets-only deployment
  (msv-web has no server-side code of its own — it's a static site that
  calls out to msv-api).

## Phase 4 — CI introduced (2026-09-19)

- The first automated merge gate: a GitHub Actions workflow running a
  `node --check` syntax pass on every tracked JS file, plus a Playwright
  smoke test that loads the real home page and searches a ticker
  end-to-end (external APIs mocked via `page.route()`, so it needs no
  real API key and isn't at the mercy of rate limits).
- Landed as [PR #1](https://github.com/Maximising-Shareholder-Value/msv-web/pull/1),
  merged via admin override since branch protection requires 1 approving
  review and, as a solo project, there's no second person to approve it —
  worth revisiting once there's a real second contributor.
- Also surfaced that **Cloudflare Workers Builds** is already
  auto-connected to this repo and runs its own build check on every PR —
  discovered via the PR's checks, not something that had been
  deliberately wired up in this conversation.

## Phase 5 — Vision and roadmap defined (2026-09-19)

Jozsua laid out a much larger long-term direction for the app — supply
chain visualization (upstream/downstream company relationships), proper
indicators for every asset class instead of stock-shaped sections showing
N/A, a country-comparable macro/political dashboard, a general
"explain the concept" education layer, and an embedded AI research
companion modeled on how he actually researches trades himself. This was
run through a structured impact/effort prioritization pass — see
[ROADMAP.md](ROADMAP.md) for the resulting sequencing and
[TODO.md](TODO.md) for the concrete next actions.

## Phase 6 — Governance docs + homepage rework (2026-09-19)

This `.github/` folder was created as the single place to find project
context, history, the roadmap, and open API research — see
[README.md](README.md) for the index. The home page also got a content
pass (more explanatory copy, a "how to use" section) and the world
map/ticker strip's live Finnhub calls were replaced with placeholder data
so the homepage looks finished without spending free-tier API budget on
every single visit — see the note in [ROADMAP.md](ROADMAP.md) for the
tradeoff this involves and when to reverse it.

## Phase 7 — Home page polish round 2 (2026-09-19)

Same-day follow-up after Phase 6 shipped: the intro copy was made more
casual (dropped the formal "(via ETFs)" parenthetical for a lighter
tone), the inline "how to use" `<details>` accordion was replaced with a
proper paginated popup modal (5 slides, prev/next + dot navigation,
reusing the same overlay pattern as the existing indicator-tooltip
popup), and every browse category (Trending Tech, Blue Chip, Dividend
Payers, Growth, ETFs, Bond ETFs) got ~50% more tickers (12 → 18 each).
Two new feature ideas were also scoped into [TODO.md](TODO.md): a
Recently-Viewed sidebar column with categorization, and extending the
existing Compare feature to cover a fund's underlying holdings, not just
its price stats.

## Phase 8 — Pillar 1 audit: mostly already solved (2026-09-19)

Before building anything for the "multi-asset-class indicators" pillar,
ran a real audit against the live production site (not local assumptions)
across a stock, an index-fund ETF, a bond ETF, two commodity trust ETFs,
a futures-based commodity ETF, a sector ETF, and two crypto tickers.
Every single one rendered with zero N/A in any visible card — the
2026-09-13 ETF/crypto redesign already generalized cleanly to commodity
ETFs without any extra work being needed. The one N/A found (2 instances
in AAPL's Insider Transactions table) turned out to be a real missing
field in a specific SEC Form 4 filing, not a bug. Net result: this pillar
turned out to be far closer to "done" than the original roadmap assumed
— see [TODO.md](TODO.md) for what's genuinely left (individual bonds and
options, which have no free-tier data source at all, not a rendering gap
to fix).

## Phase 9 — Alpaca (options) + World Bank (multi-country macro) backends live (2026-09-21)

Jozsua created a free Alpaca paper-trading account (no funding, no ID
verification needed — that's only required for a live account) and
shared the API Key ID/Secret. Both keys were added as Cloudflare secrets
on `msv-api` and a new `/api/alpaca` route was added to `worker.js`
(header-based auth, its own `proxyAlpaca()` function since Alpaca
doesn't use the query-param-key pattern the other four APIs share). A
second new route, `/api/worldbank`, was added at the same time — World
Bank needs no signup or key at all, so this was zero setup on Jozsua's
side, just backend work. Both were deployed and tested against **real**
upstream data before merging: a live AAPL options chain with real
bid/ask came back through `/api/alpaca`, and real Singapore CPI
inflation + Indonesia GDP growth came back through `/api/worldbank`.
Shipped as [msv-api PR #1](https://github.com/Maximising-Shareholder-Value/msv-api/pull/1)
— the first PR in that repo since the org split.

This closes the backend half of two roadmap items (options data for
pillar 1, multi-country macro data for pillar 4) — the frontend UI for
either (an options view on the ticker page, a country-selectable macro
dashboard) is still unbuilt, tracked in [TODO.md](TODO.md).

---

*Add new phases here as they happen, most recent last — this is meant to
stay current, not be a one-time snapshot.*
