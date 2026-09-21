# $MSV Roadmap

## The vision, in plain language

$MSV started as "look up a stock and understand it" (single-ticker
deep-dive, plain-English tooltips). The long-term direction is bigger:
a **research and education tool** that shows not just what a company's
numbers are, but *how it fits into the world* — who it depends on to
operate, who depends on it, and what's happening in the broader economy
that will push its price around next. The mental model: today the app
answers "what is this stock's P/E ratio and what does that mean?" —
the goal is for it to also answer "why does an interest rate hike matter
to this specific company, three steps removed?"

This document is the living plan for getting there — it's meant to be
read start-to-finish by someone brand new to the project, plain enough
that no prior context is assumed. It's a "plan," not a promise: as
priorities shift, this file gets updated to match, rather than left to
go stale. Three ways to think about the three governance docs together:
this one (ROADMAP.md) is the **destination and the route**, "what are we
building and in what order." [TODO.md](TODO.md) is the **packing
list**, "what specifically needs doing next." [HISTORY.md](HISTORY.md)
is the **trip log**, "what's already happened."

## Current architecture (as of 2026-09-21)

```mermaid
graph TD
    U["Visitor's browser"] -->|loads static site| W["msv-web<br/>(static HTML/CSS/JS, no build step)"]
    W -->|"/api/finnhub, /api/twelvedata,<br/>/api/coingecko, /api/fred,<br/>/api/alpaca, /api/worldbank"| A["msv-api<br/>(Cloudflare Worker, holds real API keys)"]
    A --> FH["Finnhub<br/>(stocks, ETFs, recs, earnings, news)"]
    A --> TD["Twelve Data<br/>(price charts)"]
    A --> CG["CoinGecko<br/>(crypto)"]
    A --> FR["FRED<br/>(US-only macro: rates, CPI, unemployment)"]
    A --> AL["Alpaca<br/>(options chains — backend live, no frontend UI yet)"]
    A --> WB["World Bank<br/>(multi-country macro — backend live, no frontend UI yet)"]

    style U fill:#1baf7a,color:#fff
    style W fill:#3ddc84,color:#000
    style A fill:#3ddc84,color:#000
    style AL fill:#3ddc84,color:#000
    style WB fill:#3ddc84,color:#000
```

Two repos, both under the `Maximising-Shareholder-Value` GitHub org:
**msv-web** (this repo, the frontend) and
**[msv-api](https://github.com/Maximising-Shareholder-Value/msv-api)**
(the backend proxy — keeps real API keys server-side). Everything today
is **zero marginal cost** — every data source is a free tier, and the
only thing that scales with visitors is how close you get to those free
rate limits. Alpaca and World Bank were added 2026-09-21 (see
[HISTORY.md](HISTORY.md) Phase 9) — both proxy routes are live and
tested against real data, but nothing on the frontend calls them yet.

## Where the roadmap items plug in

```mermaid
graph TD
    A["msv-api<br/>(Cloudflare Worker)"]
    W["msv-web<br/>(static frontend)"]

    A --> FH["Finnhub / Twelve Data / CoinGecko / FRED<br/>(live, in use)"]
    A --> AL["Alpaca<br/>(live, backend only — no options UI yet)"]
    A --> WB["World Bank<br/>(live, backend only — no macro-dashboard UI yet)"]
    W -.->|"direct, has CORS —<br/>confirmed live, not yet added"| OECD["OECD SDMX<br/>optional 2nd macro source"]
    W -.->|curated, hand/LLM-researched,<br/>shipped as static JSON, not a live API| SC[("Supply chain<br/>relationship data")]
    A -.->|"real $/query —<br/>breaks the zero-cost model"| LLM["Claude API<br/>AI research companion"]

    style A fill:#3ddc84,color:#000
    style W fill:#3ddc84,color:#000
    style AL fill:#3ddc84,color:#000
    style WB fill:#3ddc84,color:#000
    style OECD fill:#f59e0b,color:#000
    style SC fill:#ec4899,color:#fff
    style LLM fill:#e66767,color:#fff
```

Green = live today. Orange = a candidate new data source, same zero-cost
model, not yet added. Pink = not a live API at all — curated content
that ships as data files. Red = the one piece that genuinely costs real
money per use and needs a cost decision before it's built, not just an
engineering decision.

## The pillars (what "the vision" breaks down into)

| # | Pillar | What it means concretely |
|---|---|---|
| 1 | **Multi-asset-class indicators** | Bonds, options, commodities, crypto, ETFs, index funds each get real indicators suited to *that* asset type, instead of inheriting stock-shaped sections that show N/A. Extends the existing `getInstrumentType()` / `applyInstrumentTypeUI()` pattern already used for stock/ETF/crypto. |
| 2 | **Supply chain visualization** | A visual map of a company's upstream suppliers and downstream buyers — e.g. an AI data center operator depends on turbine manufacturers and transformer makers, who depend on electrical-grid suppliers and rare-earth/raw-material miners. No free live API provides this; it has to be curated per company/theme. |
| 3 | **Education layer tied to the supply chain maps** | Plain-English explanations of *why* those dependencies exist — not just "here's the chart," but "here's why this matters and how to think about it." Bundled with #2, not separable from it. |
| 4 | **Macro/political dashboard, multi-country** | Select or compare countries: elections, bills, monetary policy, rate cycles, "what this means for the average person." Today's Macro tab is US-only (FRED). World Bank and OECD both offer genuinely free, no-API-key, multi-country data — see [API_RESEARCH.md](API_RESEARCH.md). |
| 5 | **General "explain the concept" layer** | E.g. "what does a Fed rate hike mean, split by category, for the average person" — for someone learning markets from scratch. Can mostly reuse the existing rule-based pattern in `analysis.js` (fixed thresholds → plain-English text) that already powers the Outlook section. |
| 6 | **Embedded AI research companion** | A chat-style research assistant inside the app, modeled on how Jozsua already researches trades in Claude conversations (see the two conversations referenced when this was scoped, 2026-09-19). The only pillar that requires a live LLM API and breaks the current zero-cost architecture — needs a validation step and a cost model before committing to the full build. |

## Pillar breakdown (what each one actually involves, 2026-09-21)

The table above is the one-line version. Here's each pillar broken into
its real sub-parts, what's already done vs. still open, roughly how much
work is left, and what decisions are still needed before building
further — so "build pillar N" can mean something concrete rather than a
vague goal.

### Pillar 1 — Multi-asset-class indicators — ~90% done

- ✅ Stock/ETF/crypto/commodity-ETF/bond-ETF indicators — confirmed
  working via a live audit (2026-09-19).
- ✅ Options **data**, on the backend — Alpaca proxy live (2026-09-21).
- ⬜ Options **UI** on the ticker page — nothing on msv-web calls the
  Alpaca endpoint yet. This is genuinely the only piece left. Concretely
  needs: an `alpacaUrl()` helper (same pattern as `finnhubUrl()`), a
  fetch for the searched ticker's options snapshots, a default
  expiration + strike range to show (all of them would be overwhelming
  — likely "nearest expiration, a handful of strikes around the current
  price"), and a rendering function for a chain-style table or a
  simplified card view.
- 🚫 Individual bonds — not a build task, a dead end. No free data
  source exists anywhere (confirmed across 4 vendors). "Browse bond ETFs
  instead" stays the permanent answer.
- **Open decision:** full options chain table, or a simplified
  "a few key strikes" view? A beginner-friendly app probably wants the
  simplified version, but worth confirming before building either.
- **Effort to finish:** medium — a self-contained UI feature, no new
  data source needed, most of the hard part (getting real data flowing)
  is already done.

### Pillars 2+3 — Supply chain visualization + its education layer — 0% done

The most novel pillar, and the most work, because none of it can be
pulled from a live API — it has to be researched and curated by hand
(LLM-assisted, human-verified).

- ⬜ Pick a pilot theme — AI infrastructure is the natural first choice
  (it's Jozsua's own recurring research interest, per the two Claude
  conversations that helped scope this whole roadmap).
- ⬜ Curate 5-10 real companies within that theme and their actual
  upstream/downstream relationships (who supplies them, who buys from
  them) — a research task, not an engineering one.
- ⬜ Decide the data shape — almost certainly a static JSON file shipped
  with the frontend (no new backend needed), since this data changes
  slowly and doesn't need to be "live."
- ⬜ Design the actual visualization — the "sexy visual" part. Options
  range from a simple layered list (supplier → company → buyer) to an
  interactive node/link diagram. Worth a dedicated design pass once a
  few real companies' data exists to design *against*, not before.
- ⬜ Write the plain-English "why this matters" copy for each
  relationship shown — this is pillar 3, bundled in since the
  visualization and its explanation are really one feature, not two.
- **Open decisions:** confirm the pilot theme; pick a visual style;
  decide how many "levels" deep to go (just direct suppliers, or
  suppliers' suppliers too?).
- **Effort:** high, and ongoing — curation cost scales with how many
  companies/themes get covered, this doesn't get "finished" so much as
  "expanded over time" once the pilot proves worth it.

### Pillar 4 — Multi-country macro dashboard — backend done, frontend 0%

- ✅ World Bank data, on the backend — proxy live (2026-09-21), tested
  with real Singapore/Indonesia data.
- ⬜ A country selector in the UI (today's Macro tab has no way to pick
  a country at all — it's hardcoded to US/FRED data).
- ⬜ Fetching and displaying World Bank indicators for whichever country
  gets picked.
- ⬜ A comparison view — 2 (or more) countries side by side, which was
  part of the original ask, not just a single-country swap.
- **Open decisions:** which countries to default to/feature; which
  indicators to prioritize (GDP, inflation, unemployment are the obvious
  starting set — World Bank has 20,000+, far too many to show at once);
  UI pattern for picking a country (dropdown? search box? a short list
  of common ones plus "other"?).
- **Effort:** medium — structurally similar to the existing US Macro
  tab, just needs the country dimension added.

### Pillar 5 — Explain-the-concept education layer — 0% done

- ⬜ Pick the first 3-5 concepts to cover (e.g. "what a rate hike means,
  by sector" was already discussed as a natural first one).
- ⬜ Write the plain-English explanation for each — this is mostly a
  writing task, not an engineering one.
- ⬜ Decide where it lives in the UI — reusing the existing tooltip-style
  pattern (like indicator definitions), or a dedicated "Learn" section.
- **Open decisions:** the concept list; placement.
- **Effort:** low-to-medium — architecturally, this can mostly reuse the
  existing rule-based pattern in `analysis.js` (fixed thresholds →
  plain-English text) that already powers the Outlook section. The real
  cost is writing good, accurate explanations, not code.

### Pillar 6 — Embedded AI research companion — 0% done, deliberately last

- ⬜ Validate the idea cheaply first — ship a few **static** curated
  research threads (in the spirit of the two Claude conversations that
  originally inspired this) before building anything live.
- ⬜ Decide a cost model — this is the only pillar that requires a live
  LLM API, meaning real, ongoing, per-query cost. Someone has to pay for
  that as usage grows, which is a business decision, not an engineering
  one.
- ⬜ Only after both of those: build the actual live integration.
- **Open decisions:** is this worth the ongoing cost at all, and if so,
  who bears it (a usage cap? a paid tier? absorbed as a cost of running
  the app?).
- **Effort:** high, plus the only pillar with a real dollar cost that
  scales with usage — the reason it's sequenced last, not first.

## Recommended sequence

This came out of a structured impact/effort pass (impact = how much
difference it makes if done well; effort = time/complexity, including
data-sourcing and curation work, not just code):

1. **Pillar 1 — multi-asset-class indicators.** High impact, low effort:
   reuses existing architecture and API keys you already have, fixes a
   visibly broken thing (N/A everywhere), zero new cost. **Do this
   first.** — **Status: mostly done.** A live audit (2026-09-19) found
   ETFs/commodities/crypto already render clean. Options data is now
   live on the backend (Alpaca, 2026-09-21); the options UI on
   msv-web is the one piece still open. See [TODO.md](TODO.md).
2. **Pillar 5 — explain-the-concept layer.** High impact, low-to-medium
   effort: mostly writing, reusing the existing Outlook pattern. This is
   the connective tissue that makes every later data-heavy feature
   (supply chains, macro) actually land for a beginner instead of just
   showing more numbers.
3. **Pillars 2+3 — supply chain visualization + education, as a pilot.**
   High impact, high effort: start with **one theme** (AI infrastructure
   — already Jozsua's own recurring research interest) and ~5-10
   companies, hand-curated. Prove the format earns its curation cost
   before expanding to more themes.
4. **Pillar 4 — multi-country macro.** Medium impact, high effort: same
   *kind* of work as the US Macro tab, at higher effort (new data
   sources, comparison UI). Do after the education layer exists, so the
   numbers this tab shows aren't just numbers. — **Status: backend
   done.** World Bank proxy is live (2026-09-21, no key needed). The
   country-selectable dashboard UI on msv-web is still unbuilt.
5. **Pillar 6 — AI research companion.** High impact, but impact is
   **uncertain** and effort is high, plus it's the only pillar with a
   real ongoing dollar cost. Validate cheaply first — e.g. ship a few
   *static* curated research threads (in the same spirit as the two
   conversations that inspired this) before wiring up live LLM calls with
   a real per-query cost and a decision about who pays for it as usage
   grows.

Nothing here is dropped — pillar 6 specifically is "not yet," not
"never." Revisit once pillars 1-5 give the app enough of its own
structured data that an AI companion has something real to reason over.

## Design principle worth protecting

Everything in $MSV today runs on free tiers and costs nothing to operate
regardless of how many people use it (rate limits aside). Pillars 1-5 all
preserve that. Pillar 6 is the one exception, and should be treated as a
deliberate, explicit decision to leave that model — not something that
creeps in accidentally (e.g. via one "quick" LLM-powered feature added
without thinking about what happens at 100 simultaneous users).

## Placeholder-data decision (home page, 2026-09-19)

The world map and ticker sidebar strip (`MARKET_TICKERS` in `home.js`)
used to fire 20 live Finnhub quote calls on **every single home page
visit**, unconditionally — the single biggest fixed per-visit API cost
in the app. As the home page gets more visually complete (more detail,
a "how to use" section), that fixed cost was worth removing: those
sections now show clearly-labeled placeholder data instead of live
quotes. Winners/Losers/Most Active/Crypto/Macro tabs are untouched —
they're already lazy (only fetch when a visitor actually clicks that
tab), so they don't carry the same "cost on every visit" problem.
**Reverse this** (wire the map/strip back to live data) once either:
real visitor traffic justifies the API cost, or a paid/higher-limit tier
is in place for one of the underlying data sources.
