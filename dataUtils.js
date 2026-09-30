// dataUtils.js — small shared helpers for the data-heavy pages (Market Data,
// Sectors, ETFs, Crypto): a cached + throttled quote/metric fetcher, and a
// few formatters. Loaded after script.js (needs fetchJSON/finnhubUrl/isNum/
// formatCurrency) and before the pages that use it.
//
// Why a throttle: Finnhub's free tier is 60 requests/minute shared across
// every visitor of the deployed site. A page that shows 40-60 live prices
// can't fire them all in one burst — it queues them a few at a time, and
// anything already fetched in the last couple of minutes is reused instead
// of being requested again (the API usage panel in the sidebar shows the
// running count).

const QUOTE_CACHE = {};   // symbol -> { data, at }
const METRIC_CACHE = {};  // symbol -> { data, at }
const PROFILE_CACHE = {}; // symbol -> { data, at }
const QUOTE_TTL_MS = 2 * 60 * 1000;
const METRIC_TTL_MS = 15 * 60 * 1000;
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000; // company profiles (name, market cap, industry) barely change day to day
const inflight = {};

function getFreshCache(cache, symbol, ttl) {
  const hit = cache[symbol];
  return hit && Date.now() - hit.at < ttl ? hit.data : null;
}

// Cached quote, or null if it couldn't be fetched (a symbol with no data
// comes back with c === 0 from Finnhub, which we treat as "no quote").
async function fetchQuoteCached(symbol) {
  const hit = getFreshCache(QUOTE_CACHE, symbol, QUOTE_TTL_MS);
  if (hit) return hit;
  // Reuse quotes other parts of the app already loaded this session.
  const other = (typeof getCachedQuote === "function") ? getCachedQuote(symbol) : null;
  if (other && other.quote && !other.crypto) return other.quote;
  const key = `q:${symbol}`;
  if (inflight[key]) return inflight[key];
  inflight[key] = (async () => {
    try {
      const q = await fetchJSON(finnhubUrl("/quote", { symbol }));
      if (isNum(q.c) && q.c !== 0) { QUOTE_CACHE[symbol] = { data: q, at: Date.now() }; return q; }
      return null;
    } catch { return null; } finally { delete inflight[key]; }
  })();
  return inflight[key];
}

// ETF/stock metrics (performance periods, beta, 52-week range, volume).
async function fetchMetricCached(symbol) {
  const hit = getFreshCache(METRIC_CACHE, symbol, METRIC_TTL_MS);
  if (hit) return hit;
  const key = `m:${symbol}`;
  if (inflight[key]) return inflight[key];
  inflight[key] = (async () => {
    try {
      const r = await fetchJSON(finnhubUrl("/stock/metric", { symbol, metric: "all" }));
      const m = (r && r.metric) || null;
      if (m) METRIC_CACHE[symbol] = { data: m, at: Date.now() };
      return m;
    } catch { return null; } finally { delete inflight[key]; }
  })();
  return inflight[key];
}

// profile2 (company name, market cap, industry) — added for the Screener
// (2026-09-30), which needs market cap and there's no cheaper source for
// it than this endpoint (Finnhub's /stock/metric doesn't include it).
// Long TTL since this data is nearly static day to day, unlike a quote.
async function fetchProfileCached(symbol) {
  const hit = getFreshCache(PROFILE_CACHE, symbol, PROFILE_TTL_MS);
  if (hit) return hit;
  const key = `p:${symbol}`;
  if (inflight[key]) return inflight[key];
  inflight[key] = (async () => {
    try {
      const p = await fetchJSON(finnhubUrl("/stock/profile2", { symbol }));
      if (p && p.name) { PROFILE_CACHE[symbol] = { data: p, at: Date.now() }; return p; }
      return null;
    } catch { return null; } finally { delete inflight[key]; }
  })();
  return inflight[key];
}

// Runs async tasks a few at a time with a small gap between starts.
// `tasks` is an array of () => Promise. Calls onProgress(done, total).
async function runThrottled(tasks, { concurrency = 3, gapMs = 180, onProgress } = {}) {
  let next = 0, done = 0;
  const total = tasks.length;
  async function worker() {
    while (next < total) {
      const i = next++;
      try { await tasks[i](); } catch { /* one failure shouldn't stop the queue */ }
      done++;
      if (onProgress) onProgress(done, total);
      await new Promise(r => setTimeout(r, gapMs));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
}

// Loads live quotes for many symbols through the throttle, calling
// onEach(symbol, quote|null) as each one lands so the page can fill in
// progressively instead of waiting for all of them.
function loadQuotesThrottled(symbols, onEach, opts) {
  const unique = [...new Set(symbols)];
  return runThrottled(unique.map(sym => async () => {
    const q = await fetchQuoteCached(sym);
    if (onEach) onEach(sym, q);
  }), opts);
}

// ---- formatters ----
const fmtSigned = (v, d = 2, suffix = "") => (isNum(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(d)}${suffix}` : "—");
const fmtPctVal = (v, d = 2) => fmtSigned(v, d, "%");
const changeClass = v => (!isNum(v) ? "" : v >= 0 ? "positive" : "negative");

function fmtCompact(v, prefix = "") {
  if (!isNum(v)) return "—";
  const a = Math.abs(v), s = v < 0 ? "-" : "";
  if (a >= 1e12) return `${s}${prefix}${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${s}${prefix}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}${prefix}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${s}${prefix}${(a / 1e3).toFixed(1)}K`;
  return `${s}${prefix}${a.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// A tiny inline SVG line chart from an array of numbers (sparklines and the
// history charts on the country/sector/coin panels). `positive` colors the
// line by whether the last value is above the first.
function sparklineSvg(values, { width = 120, height = 32, stroke, fill = true, strokeWidth = 1.6 } = {}) {
  const pts = (values || []).filter(isNum);
  if (pts.length < 2) return "";
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const step = width / (pts.length - 1);
  const coords = pts.map((v, i) => [i * step, height - 2 - ((v - min) / span) * (height - 4)]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = pts[pts.length - 1] >= pts[0];
  const color = stroke || (up ? "var(--positive)" : "var(--negative)");
  const area = fill ? `<path d="${line} L${width},${height} L0,${height} Z" fill="${color}" opacity="0.12"/>` : "";
  return `<svg class="spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none" aria-hidden="true">${area}<path d="${line}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

// Larger labelled line chart (x labels = first/last, y range shown) for
// history panels. `series` = [{label, value}] oldest -> newest.
function lineChartSvg(series, { width = 360, height = 120, unit = "", color = "var(--accent)", decimals = 1 } = {}) {
  const pts = series.filter(p => isNum(p.value));
  if (pts.length < 2) return '<p class="muted small">Not enough history to chart.</p>';
  const vals = pts.map(p => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const pad = { l: 34, r: 8, t: 8, b: 18 };
  const w = width - pad.l - pad.r, h = height - pad.t - pad.b;
  const span = max - min || 1;
  const x = i => pad.l + (i / (pts.length - 1)) * w;
  const y = v => pad.t + h - ((v - min) / span) * h;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const zeroY = min < 0 && max > 0 ? y(0) : null;
  const f = v => Math.abs(v) >= 1000 ? fmtCompact(v) : v.toFixed(decimals);
  return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" preserveAspectRatio="xMidYMid meet">
    ${zeroY !== null ? `<line x1="${pad.l}" x2="${width - pad.r}" y1="${zeroY.toFixed(1)}" y2="${zeroY.toFixed(1)}" class="chart-zero"/>` : ""}
    <text x="${pad.l - 4}" y="${pad.t + 8}" text-anchor="end" class="chart-axis">${f(max)}${unit}</text>
    <text x="${pad.l - 4}" y="${height - pad.b}" text-anchor="end" class="chart-axis">${f(min)}${unit}</text>
    <text x="${pad.l}" y="${height - 4}" class="chart-axis">${pts[0].label}</text>
    <text x="${width - pad.r}" y="${height - 4}" text-anchor="end" class="chart-axis">${pts[pts.length - 1].label}</text>
    <path d="${line} L${x(pts.length - 1).toFixed(1)},${pad.t + h} L${pad.l},${pad.t + h} Z" fill="${color}" opacity="0.10"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(pts.length - 1).toFixed(1)}" cy="${y(pts[pts.length - 1].value).toFixed(1)}" r="3" fill="${color}"/>
  </svg>`;
}
