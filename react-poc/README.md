# React + TypeScript — the Crypto page

The real $MSV Crypto page, rebuilt as React components (the old vanilla
version, `crypto.js`, was retired 2026-10-02). It reuses `../style.css`, so
it looks the same as the rest of the site, and shares the main site's
`stockDashboardTheme` localStorage key so the light/dark toggle stays in
sync between pages.

**Live since 2026-09-30, became the real page 2026-10-02 (React migration
Phase 3, page 1)** at
[msv-web.jozsua-heng.workers.dev/app/](https://msv-web.jozsua-heng.workers.dev/app/)
— the sidebar's Crypto / Crypto Cycles / Crypto News items all navigate
here now (a real browser navigation, not an in-app SPA route, since this
is a separate static build with its own routing). See "Deploying it" below
before assuming the site auto-updates when this folder changes.

## Run it

```bash
cd react-poc
npm install        # first time only
npm run dev        # http://localhost:5173
npm run typecheck  # TypeScript check, no output files
npm run build      # production bundle into ../app/
```

It calls the same deployed `msv-api` proxy as the live site, so no API keys
are needed locally.

## Deploying it

There's still no CI/CD auto-build — `npm run build` here must be run **by
hand, before** `npx wrangler deploy` in `../`, any time this folder changes
and you want that change live. `vite.config.ts`'s `outDir` points at
`../app/` (a plain static folder msv-web deploys like any other,
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
