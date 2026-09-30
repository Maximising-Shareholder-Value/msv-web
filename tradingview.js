// tradingview.js — optional TradingView "Advanced Real-Time Chart" widget,
// offered as an alternative to the app's own custom chart (chart.js) on
// the ticker deep-dive page. Free to embed, no API key or account needed
// — TradingView supplies its own data feed, so this costs nothing extra
// and doesn't touch the Finnhub/Twelve Data quota.
//
// LICENSE NOTE (read before removing the toggle or the disclosure text):
// TradingView's free widget terms (tradingview.com/policies/) require the
// attribution bar to stay visible (they enforce this with bans/legal
// action, confirmed 2026-09-30) AND restrict free use to non-commercial
// sites — "we do not permit commercial usage of any of our services or
// APIs [without] separate agreement." $MSV has no subscriptions/ads today
// so this is fine, but if that changes, this widget needs either a paid
// TradingView agreement or removal in favor of the in-house chart.js
// chart (which has zero licensing restriction). Don't strip the
// attribution or hide it with CSS either way.

let tvScriptPromise = null;
function loadTradingViewScript() {
  if (window.TradingView) return Promise.resolve();
  if (tvScriptPromise) return tvScriptPromise;
  tvScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/tv.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Couldn't load the TradingView widget script."));
    document.head.appendChild(s);
  });
  return tvScriptPromise;
}

// Crypto symbols already arrive in Finnhub's "EXCHANGE:PAIR" format (e.g.
// BINANCE:BTCUSDT), which is the same convention TradingView itself uses
// — passed straight through. Plain stock/ETF tickers are passed without
// an exchange prefix; the widget resolves those via its own symbol
// search, which is correct for the vast majority of US-listed tickers
// this app searches.
const tvState = { source: "custom", symbol: null };

async function renderTradingViewWidget(symbol) {
  const container = document.getElementById("tvChartContainer");
  if (!container) return;
  container.innerHTML = '<p class="muted small">Loading TradingView chart...</p>';
  try {
    await loadTradingViewScript();
  } catch (err) {
    container.innerHTML = `<p class="muted small">${err.message}</p>`;
    return;
  }
  if (tvState.symbol !== symbol || tvState.source !== "tradingview") return; // stale by the time the script loaded
  container.innerHTML = "";
  new TradingView.widget({
    autosize: true,
    symbol,
    interval: "D",
    timezone: "Etc/UTC",
    theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
    style: "1",
    locale: "en",
    enable_publishing: false,
    allow_symbol_change: false,
    container_id: "tvChartContainer",
  });
}

// Called once per ticker load (script.js, alongside initChart) — resets
// the toggle to "MSV Chart" by default and wires the buttons for this symbol.
function initChartSourceToggle(symbol) {
  tvState.symbol = symbol;
  tvState.source = "custom";

  const customBtn = document.getElementById("chartSourceCustomBtn");
  const tvBtn = document.getElementById("chartSourceTvBtn");
  const customArea = document.getElementById("customChartArea");
  const tvArea = document.getElementById("tvChartArea");
  if (!customBtn || !tvBtn || !customArea || !tvArea) return;

  customArea.classList.remove("hidden");
  tvArea.classList.add("hidden");
  customBtn.classList.add("active");
  tvBtn.classList.remove("active");

  customBtn.onclick = () => {
    tvState.source = "custom";
    customBtn.classList.add("active");
    tvBtn.classList.remove("active");
    customArea.classList.remove("hidden");
    tvArea.classList.add("hidden");
  };
  tvBtn.onclick = () => {
    tvState.source = "tradingview";
    tvBtn.classList.add("active");
    customBtn.classList.remove("active");
    tvArea.classList.remove("hidden");
    customArea.classList.add("hidden");
    renderTradingViewWidget(symbol);
  };
}

// If the theme changes while the TradingView chart is the active one,
// re-render it — the widget doesn't restyle live, only at creation.
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("themeToggle");
  themeToggleBtn?.addEventListener("click", () => {
    if (tvState.source === "tradingview" && tvState.symbol) renderTradingViewWidget(tvState.symbol);
  });
});
