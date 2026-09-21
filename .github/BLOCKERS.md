# Known Blockers

Things that are **not buildable right now**, and exactly why — so this
never has to be re-explained or re-discovered. If you ask for one of
these again, the answer is here, not a re-investigation. Each entry
stays until the blocker is actually resolved (a new data source found,
a permission granted, etc.) — then it moves to
[HISTORY.md](HISTORY.md) as a resolved note, not deleted.

## Data blockers (no free source exists)

### Individual bonds (any real bond data at all)
**Blocked since:** 2026-09-19. **Confirmed across:** Finnhub, EODHD, Tradier, Polygon/Massive, Financial Modeling Prep.
No vendor offers free, self-serve, individual-bond data (price, yield,
maturity, CUSIP lookup) — the closest thing that exists is Alpaca's
Broker API, which requires a business partnership application, not
reachable by a solo project. **Current answer:** browse bond ETFs
instead (already built, see the "Bond ETFs" home page category) — this
is the permanent answer unless the project ever pays for EODHD's bond
bundle (~$100/month).

### Bid / Ask price, on anything
**Blocked since:** project start (documented in the root `CLAUDE.md`
from early on). Finnhub's free `/quote` endpoint has never included
bid/ask, for any instrument type — stock, ETF, crypto, all the same.
Confirmed directly, not assumed. **No workaround found yet** — this
would need a different quote source entirely. Not researched further
as of 2026-09-21.

### Today's trading volume (not average volume — the live number)
**Blocked since:** 2026-09-21, surfaced while scoping the richer ETF
page. Finnhub's free `/quote` and `/stock/metric` don't return a
live/today's-volume field for any instrument type — confirmed via a
live request. 10-day and 3-month **average** volume ARE available and
already shown; today's actual volume is not.

### After-hours / pre-market ("overnight") price
**Blocked since:** project start (documented in root `CLAUDE.md`).
Neither Finnhub nor Twelve Data returns a premarket/extended-hours
price on their free tiers — confirmed directly (Twelve Data's
`extended_hours=true` param returns a byte-identical response with or
without it). **2026-09-21 decision:** show a clearly-labeled
placeholder for this instead of omitting it entirely, matching the
homepage world map's existing "Sample data" pattern — not real,
disclosed as such.

### ETF/fund "vital stats" — NAV, net assets/AUM, expense ratio, category, fund family, legal type, dividend yield
**Blocked since:** 2026-09-19, **partially unblockable as of 2026-09-21.**
Confirmed live that Finnhub's dedicated `/etf/*` endpoints
(profile/holdings/sector/country) are premium-gated — all four return
`"You don't have access to this resource."` — and `/stock/metric`
returns zero yield/NAV/AUM fields for ETFs. **The one real lead is
Financial Modeling Prep (FMP)**, which has the right endpoint shapes
(ETF Information, Holdings, Sector Weighting) on a free-signup tier —
but whether that specific data is included in the *free* 250/day tier
vs. gated to a paid plan is **unconfirmed**, because FMP's own docs
pages block automated fetching and secondhand sources disagree.
**What's needed to unblock this:** a free FMP API key (sign up at
[financialmodelingprep.com](https://site.financialmodelingprep.com) —
confirmed no credit card required, just email + password) shared here
so the specific endpoints can be tested live before committing to
building on them. **Status: still waiting on this key as of 2026-09-21**
— asked for it once already (see `HISTORY.md` Phase 8/`TODO.md`).

### ETF/fund top holdings, sector weightings, portfolio composition
**Same blocker as above** — same FMP endpoints, same missing key.

### Full official fund name + issuer, for any arbitrary searched ETF
**Partially blocked.** Finnhub's `profile2` returns empty `{}` for
ETFs (confirmed — this is literally how the app detects "this is an
ETF" today), so there's no live source for "Vanguard Total World Stock
ETF" as a proper name, or "Vanguard"/"iShares"/etc. as an issuer, for
an arbitrary ticker typed into search. **Workaround shipped
2026-09-21:** a small hand-curated lookup table
(`ETF_FUND_INFO` in `script.js`) covering the ~60 tickers already
featured in the home page's browse categories, with real names/issuers
looked up and verified. Anything outside that curated list still shows
generic info only. This is a real, permanent gap for the long tail —
fixing it properly needs the same FMP confirmation as the item above.

## Permission / access blockers

### Cloudflare notification settings
**Blocked since:** 2026-09-21. The Cloudflare API token available in
this environment (a `wrangler` OAuth token) does not include the
Notifications permission scope — confirmed via a live API call, which
returned a 403 Authentication error on the Notifications endpoint.
**Not fixable from here** — changing notification policies (e.g.
limiting Workers Builds emails to failures only) needs Jozsua to do it
himself in the Cloudflare dashboard (Settings → Notifications). Exact
steps are in `TODO.md`.

## What "blocked" does NOT mean

A blocker here means **no free/reachable path exists today**, not
"nobody looked." Each entry above was investigated with live requests
before being recorded — see the linked history/research docs for the
actual evidence. If a new free API, a new permission, or a paid budget
ever changes the picture, update the relevant entry here (move it to
"resolved" in HISTORY.md) rather than leaving a stale blocker on record.
