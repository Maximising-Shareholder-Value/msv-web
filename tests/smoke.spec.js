// One smoke test: does the site load, and can a ticker actually be
// searched, without any JS exception along the way?
//
// It does NOT hit the real Finnhub/Twelve Data/Wikipedia APIs — a shared
// free-tier key in CI would be flaky (rate limits) and this repo's real
// key lives only in the gitignored config.js, never in git. Instead every
// external call is intercepted with page.route() and answered with a
// small canned response, just enough shape for the app's own render
// functions to not throw. This tests "did our JS break", not "is
// Finnhub's API up" — that's the right boundary for a merge-blocking check.
const { test, expect } = require("@playwright/test");

test("home page loads and a stock ticker search renders the dashboard", async ({ page }) => {
  await page.route("https://finnhub.io/**", route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/v1/quote") {
      return route.fulfill({
        json: { c: 150.25, h: 152, l: 148, o: 149, pc: 148.5, d: 1.75, dp: 1.18, t: Math.floor(Date.now() / 1000) },
      });
    }
    if (pathname === "/api/v1/stock/profile2") {
      return route.fulfill({
        json: { name: "Apple Inc", ticker: "AAPL", exchange: "NASDAQ", finnhubIndustry: "Technology" },
      });
    }
    if (pathname === "/api/v1/stock/metric") {
      return route.fulfill({ json: { metric: {} } });
    }
    // recommendation, earnings, peers, news, filings, etc. — the app
    // treats all of these as optional (.catch(() => [])), array is safe
    return route.fulfill({ json: [] });
  });

  await page.route("https://api.twelvedata.com/**", route => route.fulfill({ json: { status: "ok", values: [] } }));
  await page.route("https://en.wikipedia.org/**", route => route.fulfill({ json: [] }));
  await page.route("https://api.coingecko.com/**", route => route.fulfill({ json: [] }));

  const pageErrors = [];
  page.on("pageerror", err => pageErrors.push(err));

  await page.goto("/");
  await expect(page.locator("#homeView")).toBeVisible();

  await page.fill("#tickerInput", "AAPL");
  await page.click("#searchBtn");

  await expect(page.locator("#dashboard")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#dashboard")).toContainText("AAPL");

  expect(pageErrors, `Uncaught JS errors during load/search: ${pageErrors.map(e => e.message).join("; ")}`).toEqual([]);
});
