# React + TypeScript beta — the Crypto page

The live $MSV Crypto page (`../crypto.js`) rebuilt as React components, to
compare the two approaches side by side. Started 2026-09-27. It reuses
`../style.css`, so it looks the same.

**Deployed since 2026-09-30 (React migration Phase 1)** at
[msv-web.jozsua-heng.workers.dev/react-crypto/](https://msv-web.jozsua-heng.workers.dev/react-crypto/),
linked from the live Crypto page as a beta — **not yet the real Crypto page**,
just proof the build pipeline works end-to-end in production. See "Deploying
it" below before assuming the site auto-updates when this folder changes.

## Run it

```bash
cd react-poc
npm install        # first time only
npm run dev        # http://localhost:5173
npm run typecheck  # TypeScript check, no output files
npm run build      # production bundle into ../react-crypto/
```

It calls the same deployed `msv-api` proxy as the live site, so no API keys
are needed locally.

## Deploying it

There's still no CI/CD auto-build — `npm run build` here must be run **by
hand, before** `npx wrangler deploy` in `../`, any time this folder changes
and you want that change live. `vite.config.ts`'s `outDir` points at
`../react-crypto/` (a plain static folder msv-web deploys like any other,
gitignored since it's a build artifact — never edit its contents directly,
they get overwritten) rather than the default `dist/` inside this folder,
which `.assetsignore` deliberately excludes wholesale (source, node_modules,
config — none of that should ever be publicly fetchable). `base: "/react-
crypto/"` in the same config makes the built `index.html`'s asset URLs match
where it's actually served from. CI's `syntax-check`/`smoke-test` jobs don't
touch this folder; there's a separate `react-build` CI job that runs
`npm ci && npm run build` on every PR so a broken build fails before merge,
without needing a live API key (build-only, doesn't fetch real data).

## Layout

```
src/
  main.tsx              entry: mounts <App/> into #root, imports ../style.css
  App.tsx               page state (theme, favourites, selected coin, auto-refresh)
  lib/types.ts          TypeScript shapes of every API response
  lib/api.ts            fetch helpers + useAsync (load/error/refresh) + useLocalStorage
  lib/format.ts         pure number/date formatters
  components/           one file per piece of UI (table, chart, gauge, panel, …)
  poc.css               the few styles the POC adds
```

## Vanilla → React map

| Vanilla (`crypto.js`)                         | React                                   |
|-----------------------------------------------|-----------------------------------------|
| `innerHTML = \`…\`` strings                    | JSX components                          |
| `cryptoState` object + manual `paint…()` calls | `useState` — page redraws automatically |
| `loadCryptoX()` with try/catch each           | `useAsync` hook + `<Loadable>`          |
| `lineChartSvg()` string                       | `<LineChart>` (adds hover tooltip)      |
| global functions, script order matters        | `import` / `export`                     |

## New things the POC does that the vanilla page doesn't
Star favourites (saved in the browser) with a favourites filter, auto-refresh
with an "Updated Xs ago" counter, shareable `?coin=` URLs, a hover crosshair
on the price chart, and a dark/light toggle.

## Not ported yet
Crypto ETFs / crypto-stock quote tables (need the throttled Finnhub layer in
`../dataUtils.js`, which would be its own module here).
