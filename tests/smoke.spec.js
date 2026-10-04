// One smoke test: does the main site (the React app at /app/) load, and does
// a ticker page render, without any JS exception along the way?
//
// It does NOT hit the real Finnhub/Twelve Data/Wikipedia APIs — a shared
// free-tier key in CI would be flaky (rate limits) and this repo's real
// key lives only in the gitignored config.js, never in git. Instead every
// external call is intercepted with page.route() and answered with a
// small canned response, just enough shape for the app's own render
// functions to not throw. This tests "did our JS break", not "is
// Finnhub's API up" — that's the right boundary for a merge-blocking check.
//
// The React app fetches Finnhub through the msv-api proxy, so the mock
// targets that host (not finnhub.io directly).
const { test, expect } = require("@playwright/test");

const API = "https://msv-api.jozsua-heng.workers.dev";

test("root redirects into the React app and a ticker page renders", async ({ page }) => {
  // Playwright checks routes newest-first, so the broad catch-all goes first
  // and the specific Finnhub mock after it wins for those requests.
  await page.route(`${API}/**`, route => route.fulfill({ json: [] }));

  await page.route(`${API}/api/finnhub**`, route => {
    const path = new URL(route.request().url()).searchParams.get("path");
    if (path === "/quote") {
      return route.fulfill({
        json: { c: 150.25, h: 152, l: 148, o: 149, pc: 148.5, d: 1.75, dp: 1.18, t: Math.floor(Date.now() / 1000) },
      });
    }
    if (path === "/stock/profile2") {
      return route.fulfill({
        json: { name: "Apple Inc", ticker: "AAPL", exchange: "NASDAQ", finnhubIndustry: "Technology" },
      });
    }
    if (path === "/stock/metric") {
      return route.fulfill({ json: { metric: {} } });
    }
    // recommendation, earnings, peers, news, filings, etc. — the app
    // treats all of these as optional, so an empty array is safe
    return route.fulfill({ json: [] });
  });

  await page.route("https://api.twelvedata.com/**", route => route.fulfill({ json: { status: "ok", values: [] } }));
  await page.route("https://en.wikipedia.org/**", route => route.fulfill({ json: [] }));
  await page.route("https://api.coingecko.com/**", route => route.fulfill({ json: [] }));

  const pageErrors = [];
  page.on("pageerror", err => pageErrors.push(err));

  // The root page should forward visitors into the React app's home page.
  await page.goto("/");
  await page.waitForURL(/\/app\/\?page=home/);
  await expect(page.locator("#root > *").first()).toBeVisible();

  // A ticker page should render its header with the symbol badge.
  await page.goto("/app/?page=ticker&symbol=AAPL");
  await expect(page.locator(".ticker-badge")).toHaveText("AAPL", { timeout: 15_000 });
  await expect(page.locator(".ticker-page h2")).toContainText("Apple Inc");

  expect(pageErrors, `Uncaught JS errors during load/search: ${pageErrors.map(e => e.message).join("; ")}`).toEqual([]);
});
