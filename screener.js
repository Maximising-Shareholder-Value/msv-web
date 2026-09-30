// screener.js — Stock Screener (MVP, 2026-09-30). Filter/sort stocks by
// price, today's % change, market cap and P/E, Webull-style, then jump to
// the real ticker page for anything interesting.
//
// SCOPE, read before expanding this: a real multi-stock screener was
// deliberately ruled out at project start (see root CLAUDE.md) because
// Finnhub's free tier (60 calls/min, shared across every visitor, no bulk
// screener endpoint) can't support scanning a large universe on demand.
// That constraint hasn't changed. This MVP works within it by reusing the
// same curated, already-live-checked stock tickers from BROWSE_CATEGORIES
// (home.js) — the four *stock* categories only (Trending Tech, Blue Chip,
// Dividend Payers, Growth); the ETF/Bond ETF/Commodities categories are
// excluded since market cap/P/E don't apply to them the same way. That's
// ~70 tickers, not the whole market — labelled as such in the UI. A
// broader-market version is possible if Financial Modeling Prep's Stock
// Screener endpoint turns out to be genuinely free-tier accessible (not
// yet confirmed live — see msv-org-github TODO.md).
//
// Cost: quote + metric + profile2 per ticker (~70 × 3 ≈ 210 calls),
// throttled through the same dataUtils.js cache used everywhere else in
// this app — paid once per cache window (profile2 cached 24h, metric
// 15min, quote 2min) and shared across every visitor via msv-api's edge
// cache, not once per page view.

const SCREENER_CATEGORY_IDS = ["trending-tech", "blue-chip", "dividend-payers", "growth"];

function screenerUniverse() {
  const seen = new Set();
  const rows = [];
  BROWSE_CATEGORIES.filter(c => SCREENER_CATEGORY_IDS.includes(c.id)).forEach(cat => {
    cat.items.forEach(([symbol, name]) => {
      if (seen.has(symbol)) return;
      seen.add(symbol);
      rows.push({ symbol, name, category: cat.title });
    });
  });
  return rows;
}

const screenerState = {
  rows: null,
  loaded: false,
  loading: false,
  loadedCount: 0,
  filters: { category: "all", cap: "all", minPrice: "", maxPrice: "", direction: "all", maxPe: "" },
  sortKey: "marketCap",
  sortDir: -1,
};

const SCREENER_CAP_BUCKETS = [
  ["mega", "Mega ($200B+)", v => v >= 200_000],
  ["large", "Large ($10B–$200B)", v => v >= 10_000 && v < 200_000],
  ["mid", "Mid ($2B–$10B)", v => v >= 2_000 && v < 10_000],
  ["small", "Small (<$2B)", v => v < 2_000],
];
function screenerCapBucket(marketCapMillions) {
  if (!isNum(marketCapMillions)) return null;
  const hit = SCREENER_CAP_BUCKETS.find(([, , test]) => test(marketCapMillions));
  return hit ? hit[0] : null;
}

// Each ticker needs 3 separate Finnhub calls (quote, metric, profile2 —
// there's no bulk endpoint on the free tier). Those are queued as 3
// INDIVIDUAL jobs each, not bundled per-ticker behind Promise.all, so the
// throttle below governs the real raw-call rate directly. Deliberately
// conservative (concurrency 2, 1.2s gap ≈ 100 calls/min) since this
// shares Finnhub's 60/min free-tier budget with every other visitor and
// page on the live deployment — a cold first load of the full ~70-stock
// universe (≈210 calls) takes a couple of minutes; cached afterward
// (quote 2min, metric 15min, profile 24h — see dataUtils.js) for anyone
// who loads the page in that window. Renders progressively as data
// arrives rather than blocking on a spinner, so it's usable immediately.
async function ensureScreenerData() {
  if (screenerState.loaded || screenerState.loading) return;
  screenerState.loading = true;
  const universe = screenerUniverse();
  screenerState.rows = universe.map(r => ({ ...r, quote: null, metric: null, marketCap: null }));
  const bySymbol = Object.fromEntries(screenerState.rows.map(r => [r.symbol, r]));
  screenerState.loadedCount = 0;

  const jobs = [];
  universe.forEach(({ symbol }) => {
    jobs.push(async () => { bySymbol[symbol].quote = await fetchQuoteCached(symbol); });
    jobs.push(async () => { bySymbol[symbol].metric = await fetchMetricCached(symbol); });
    jobs.push(async () => { bySymbol[symbol].marketCap = (await fetchProfileCached(symbol))?.marketCapitalization ?? null; });
  });
  screenerState.totalJobs = jobs.length;
  renderScreenerTable(); // paint the skeleton (all "--") immediately, don't wait on the first batch

  let sinceRepaint = 0;
  await runThrottled(jobs.map(job => async () => {
    await job();
    screenerState.loadedCount++;
    sinceRepaint++;
    if (sinceRepaint >= 9) { sinceRepaint = 0; renderScreenerTable(); } // repaint every ~3 tickers' worth, not on every single call
  }), { concurrency: 2, gapMs: 1200 });

  screenerState.loaded = true;
  screenerState.loading = false;
  renderScreenerTable();
}

function screenerFilteredRows() {
  const f = screenerState.filters;
  const minPrice = f.minPrice === "" ? null : parseFloat(f.minPrice);
  const maxPrice = f.maxPrice === "" ? null : parseFloat(f.maxPrice);
  const maxPe = f.maxPe === "" ? null : parseFloat(f.maxPe);
  return (screenerState.rows || []).filter(r => {
    if (f.category !== "all" && r.category !== f.category) return false;
    if (f.cap !== "all" && screenerCapBucket(r.marketCap) !== f.cap) return false;
    const price = r.quote?.c;
    if (minPrice !== null && (!isNum(price) || price < minPrice)) return false;
    if (maxPrice !== null && (!isNum(price) || price > maxPrice)) return false;
    const pct = r.quote?.dp;
    if (f.direction === "gainers" && (!isNum(pct) || pct <= 0)) return false;
    if (f.direction === "losers" && (!isNum(pct) || pct >= 0)) return false;
    if (maxPe !== null && (!isNum(r.metric?.peTTM) || r.metric.peTTM > maxPe)) return false;
    return true;
  });
}

const SCREENER_COLUMNS = [
  { key: "symbol", label: "Symbol", get: r => r.symbol, text: true },
  { key: "price", label: "Price", get: r => r.quote?.c },
  { key: "pct", label: "Chg %", get: r => r.quote?.dp },
  { key: "marketCap", label: "Market Cap", get: r => r.marketCap },
  { key: "pe", label: "P/E", get: r => r.metric?.peTTM },
  { key: "category", label: "Category", get: r => r.category, text: true },
];

function screenerRowHtml(r) {
  const pct = r.quote?.dp;
  const dir = !isNum(pct) ? "" : pct >= 0 ? "positive" : "negative";
  return `
    <td><strong>${displaySymbol(r.symbol)}</strong> <span class="muted small quote-name">${escapeHtml(r.name)}</span></td>
    <td>${fmtNum(r.quote?.c)}</td>
    <td class="${dir}">${isNum(pct) ? `${pct >= 0 ? "▲" : "▼"} ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "--"}</td>
    <td>${fmtCompact(r.marketCap != null ? r.marketCap * 1e6 : null, "$")}</td>
    <td>${isNum(r.metric?.peTTM) ? r.metric.peTTM.toFixed(1) : "--"}</td>
    <td>${escapeHtml(r.category)}</td>
  `;
}

function renderScreenerTable() {
  const host = document.getElementById("screenerTableRoot");
  if (!host) return;
  const rows = screenerFilteredRows();
  const { sortKey, sortDir } = screenerState;
  const col = SCREENER_COLUMNS.find(c => c.key === sortKey);
  if (col) {
    rows.sort((a, b) => {
      const av = col.get(a), bv = col.get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return col.text ? sortDir * String(av).localeCompare(String(bv)) : sortDir * (av - bv);
    });
  }

  host.innerHTML = `
    <div class="crypto-table-scroll">
      <table class="crypto-table quotes-table">
        <thead><tr>${SCREENER_COLUMNS.map(c => `<th data-key="${c.key}" class="sortable-th${c.key === sortKey ? " sorted" : ""}">${c.label}<span class="sort-arrow">${c.key === sortKey ? (sortDir === 1 ? " ▲" : " ▼") : ""}</span></th>`).join("")}</tr></thead>
        <tbody>${rows.map(r => `<tr class="crypto-table-row" data-symbol="${r.symbol}">${screenerRowHtml(r)}</tr>`).join("")}</tbody>
      </table>
    </div>
    <p class="muted small screener-count">${rows.length} of ${screenerState.rows.length} stocks match${screenerState.loading ? ` — loading live data… ${Math.round((screenerState.loadedCount / screenerState.totalJobs) * 100)}%` : ""}.</p>
  `;
  host.querySelectorAll(".sortable-th").forEach(th => th.addEventListener("click", () => {
    if (screenerState.sortKey === th.dataset.key) screenerState.sortDir = -screenerState.sortDir;
    else { screenerState.sortKey = th.dataset.key; screenerState.sortDir = th.dataset.key === "symbol" ? 1 : -1; }
    renderScreenerTable();
  }));
  host.querySelectorAll(".crypto-table-row").forEach(row => row.addEventListener("click", () => loadTicker(row.dataset.symbol)));
}

function screenerFilterBarHtml() {
  const categories = [...new Set(BROWSE_CATEGORIES.filter(c => SCREENER_CATEGORY_IDS.includes(c.id)).map(c => c.title))];
  const f = screenerState.filters;
  return `
    <div class="screener-filters">
      <label>Category
        <select id="screenerCategory">
          <option value="all">All categories</option>
          ${categories.map(c => `<option value="${c}" ${f.category === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Market cap
        <select id="screenerCap">
          <option value="all">Any size</option>
          ${SCREENER_CAP_BUCKETS.map(([id, label]) => `<option value="${id}" ${f.cap === id ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label>Price min <input type="number" id="screenerMinPrice" value="${f.minPrice}" placeholder="0" min="0"></label>
      <label>Price max <input type="number" id="screenerMaxPrice" value="${f.maxPrice}" placeholder="Any" min="0"></label>
      <label>Today
        <select id="screenerDirection">
          <option value="all" ${f.direction === "all" ? "selected" : ""}>Up or down</option>
          <option value="gainers" ${f.direction === "gainers" ? "selected" : ""}>Gainers only</option>
          <option value="losers" ${f.direction === "losers" ? "selected" : ""}>Losers only</option>
        </select>
      </label>
      <label>Max P/E <input type="number" id="screenerMaxPe" value="${f.maxPe}" placeholder="Any" min="0"></label>
      <button type="button" id="screenerResetBtn" class="screener-reset-btn">Reset filters</button>
    </div>`;
}

function wireScreenerFilters() {
  const bind = (id, field, parse = v => v) => {
    const el = document.getElementById(id);
    el?.addEventListener("input", () => { screenerState.filters[field] = parse(el.value); renderScreenerTable(); });
    el?.addEventListener("change", () => { screenerState.filters[field] = parse(el.value); renderScreenerTable(); });
  };
  bind("screenerCategory", "category");
  bind("screenerCap", "cap");
  bind("screenerMinPrice", "minPrice");
  bind("screenerMaxPrice", "maxPrice");
  bind("screenerDirection", "direction");
  bind("screenerMaxPe", "maxPe");
  document.getElementById("screenerResetBtn")?.addEventListener("click", () => {
    screenerState.filters = { category: "all", cap: "all", minPrice: "", maxPrice: "", direction: "all", maxPe: "" };
    renderScreenerPage();
  });
}

function renderScreenerPage() {
  const filterRoot = document.getElementById("screenerFilterRoot");
  const tableRoot = document.getElementById("screenerTableRoot");
  if (!filterRoot || !tableRoot) return;
  filterRoot.innerHTML = screenerFilterBarHtml();
  wireScreenerFilters();
  if (!screenerState.loaded) ensureScreenerData();
  else renderScreenerTable();
}
