# React + TypeScript proof of concept — the Crypto page

The live $MSV Crypto page (`../crypto.js`) rebuilt as React components, to
compare the two approaches side by side. Started 2026-09-27. **Not deployed;
not linked from the live site.** It reuses `../style.css`, so it looks the same.

## Run it

```bash
cd react-poc
npm install        # first time only
npm run dev        # http://localhost:5173
npm run typecheck  # TypeScript check, no output files
npm run build      # production bundle into dist/
```

It calls the same deployed `msv-api` proxy as the live site, so no API keys
are needed locally.

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
