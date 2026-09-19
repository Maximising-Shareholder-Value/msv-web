// Playwright config for the one smoke test in tests/smoke.spec.js.
// webServer starts a plain static file server (no build step — this repo
// serves raw HTML/CSS/JS) and Playwright waits for it before running.
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "npx http-server -p 4173 -c-1 .",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
