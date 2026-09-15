# Contributing to msv-web

Thanks for taking a look. This is the frontend for $MSV — if you're
looking for the API proxy/backend code, that lives in
[msv-api](https://github.com/Maximising-Shareholder-Value/msv-api) instead.

## Before you start

Open an issue first for anything beyond a small fix, so effort isn't
duplicated and the approach can be agreed on before you write code.

## Local setup

See the README's "Setup in VS Code" section — copy `config.example.js` to
`config.js`, add your own free API keys, run via Live Server. No build
step, no `npm install`.

## Making a change

1. Fork the repo, branch off `main`.
2. Keep new features free-tier-aware — before wiring up a new endpoint or
   field, check it's actually available on the free tier of whatever API
   you're calling (a lot of this app's design comes from working around
   free-tier gaps that were confirmed directly, not assumed — see
   `CLAUDE.md`). If you're not sure, a quick `curl` against the real API
   with a free key beats guessing.
3. If a new feature only makes sense for stocks (not ETFs/crypto), make
   sure it degrades sensibly for the other two — see "Per-instrument-type
   analysis" in `CLAUDE.md` for the existing pattern
   (`getInstrumentType()`, `applyInstrumentTypeUI()`).
4. Test against real, live data before opening a PR — several past bugs
   in this app (chart session gaps, rate-limit handling) only showed up
   against real multi-day data, not a single mocked day.
5. Open a PR against `main`, describing what changed and why.

## Reporting a bug

Include: the ticker/tab that triggered it, what you expected, what
happened instead, and your browser console output if there's an error.
If it's a "shows N/A" or "shows nothing" bug, check whether it might be a
free-tier data gap rather than a real bug first (see `CLAUDE.md` for a
list of known gaps) — still worth reporting either way, just helps
triage faster.
