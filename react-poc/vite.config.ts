import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the "build tool": in development it serves the files instantly
// and refreshes the browser on every save; for production it bundles
// everything into a few optimised files. The React plugin teaches it JSX.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Let this project import the vanilla site's ../style.css, so the POC
    // looks identical to the live site (same colours, same classes).
    fs: { allow: [".."] },
  },
});
