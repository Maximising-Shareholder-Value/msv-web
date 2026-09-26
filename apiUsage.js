// A personal "how close am I to each API's free-tier limit" panel (bottom
// of the sidebar) — for the user's own awareness while clicking around,
// not a precise live quota.
//
// It can only count requests THIS browser tab has sent (via apiCallLogs in
// script.js, fed by each API's URL helper) — it has no way to see calls
// from other tabs, other visitors, or the background edge cache. Every
// real limit is enforced server-side across everything hitting that API
// key (all visitors share the Worker's keys), so a fully accurate number
// isn't something the client can ever show. This is deliberately framed
// as an estimate (see the (est.) label and tooltip in index.html) rather
// than a precise countdown, to avoid implying more certainty than the
// data actually supports.
//
// Limits are each provider's published free-tier numbers: Finnhub 60/min,
// Twelve Data 8/min + 800/day (the free plan enforces both), CoinGecko 30/
// min (its Demo-key plan — the public no-key tier is stricter), FRED 120/
// min, Alpaca 1,000/min (Basic market-data plan). World Bank publishes no
// hard limit, so it shows a count with no bar.

const API_USAGE_WINDOW_MS = 60 * 1000;

const API_USAGE_ROWS = [
  { key: "finnhub", label: "Finnhub", limit: 60, per: "min" },
  { key: "twelvedata", label: "Twelve Data", limit: 8, per: "min" },
  { key: "twelvedata", label: "Twelve Data", limit: 800, per: "day" },
  { key: "coingecko", label: "CoinGecko", limit: 30, per: "min" },
  { key: "fred", label: "FRED", limit: 120, per: "min" },
  { key: "alpaca", label: "Alpaca", limit: 1000, per: "min" },
  { key: "worldbank", label: "World Bank", limit: null, per: "min" },
];

const apiUsageListEl = document.getElementById("apiUsageList");

if (apiUsageListEl) {
  apiUsageListEl.innerHTML = API_USAGE_ROWS.map(() => `
    <div class="api-usage-row">
      <div class="api-usage-row-top"><span class="api-usage-name"></span><span class="api-usage-text"></span></div>
      <div class="api-usage-bar"><div class="api-usage-fill"></div></div>
    </div>
  `).join("");
}

// Collapsible so short screens can hide the rows and keep more room for
// the nav — remembered across visits; defaults to collapsed on short
// windows (under 800px tall) where the full panel would crowd the menu.
const apiUsageWidgetEl = document.getElementById("apiUsageWidget");
const apiUsageToggleEl = document.getElementById("apiUsageToggle");
if (apiUsageWidgetEl && apiUsageToggleEl) {
  let collapsed = window.innerHeight < 800;
  try {
    const saved = localStorage.getItem("msv-usage-collapsed");
    if (saved !== null) collapsed = saved === "1";
  } catch { /* storage unavailable — fall back to the height default */ }
  const applyCollapsed = () => {
    apiUsageWidgetEl.classList.toggle("collapsed", collapsed);
    apiUsageToggleEl.setAttribute("aria-expanded", String(!collapsed));
  };
  applyCollapsed();
  apiUsageToggleEl.addEventListener("click", () => {
    collapsed = !collapsed;
    applyCollapsed();
    try { localStorage.setItem("msv-usage-collapsed", collapsed ? "1" : "0"); } catch { /* ignore */ }
  });
}

function renderApiUsage() {
  if (!apiUsageListEl) return;
  const now = Date.now();
  // Prune anything older than the trailing 60s window — keeps the log
  // arrays small and the counts accurate without a separate timer.
  Object.values(apiCallLogs).forEach(log => {
    while (log.length && now - log[0] > API_USAGE_WINDOW_MS) log.shift();
  });

  const rows = apiUsageListEl.children;
  API_USAGE_ROWS.forEach((cfg, i) => {
    const count = cfg.per === "day" ? getDailyCount(cfg.key) : apiCallLogs[cfg.key].length;
    const row = rows[i];
    row.querySelector(".api-usage-name").textContent = cfg.per === "day" ? `${cfg.label} (daily)` : cfg.label;
    row.querySelector(".api-usage-text").textContent = cfg.limit
      ? `${count.toLocaleString()} / ${cfg.limit.toLocaleString()} per ${cfg.per}`
      : `${count} per min · no hard limit`;

    const fill = row.querySelector(".api-usage-fill");
    const barWrap = row.querySelector(".api-usage-bar");
    barWrap.classList.toggle("hidden", !cfg.limit);
    if (!cfg.limit) return;
    const pct = Math.min(100, (count / cfg.limit) * 100);
    fill.style.width = `${pct}%`;
    fill.classList.toggle("api-usage-fill-warn", pct >= 75 && pct < 100);
    fill.classList.toggle("api-usage-fill-danger", pct >= 100);
  });
}

setInterval(renderApiUsage, 1000);
renderApiUsage();
