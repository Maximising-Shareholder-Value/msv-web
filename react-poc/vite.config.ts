import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the "build tool": in development it serves the files instantly
// and refreshes the browser on every save; for production it bundles
// everything into a few optimised files. The React plugin teaches it JSX.
//
// Production build config (2026-09-30, React migration Phase 1): this
// needs to ship as real static files inside msv-web's own deploy, at
// /react-crypto/ — not buried under react-poc/dist/, which
// .assetsignore deliberately excludes wholesale (source, node_modules,
// config). `outDir` points OUTSIDE this folder, at a new sibling
// msv-web/react-crypto/ that .assetsignore never touches, so it deploys
// like any other static file the moment it exists on disk. `base` must
// match — every asset URL the built index.html references needs the
// /react-crypto/ prefix, or the browser requests them from the wrong
// path once live. Neither setting affects `npm run dev` (still plain
// http://localhost:5173/, unchanged) — both are gated to `command ===
// "build"`.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/react-crypto/" : "/",
  build: {
    outDir: "../react-crypto",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // Let this project import the vanilla site's ../style.css, so the POC
    // looks identical to the live site (same colours, same classes).
    fs: { allow: [".."] },
  },
}));
