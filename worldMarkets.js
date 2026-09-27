// worldMarkets.js — the "Global Markets" map: a real, geographically
// accurate world map (worldmap.svg — public domain CIA World Factbook base
// map via Wikimedia Commons) with a marker per tracked country, live
// open/closed status computed from real timezone data via Intl (zero network
// calls), country tinting/choropleth from World Bank data, and a hover
// popup. Clicking a country opens its full profile (marketData.js).
//
// Rebuilt 2026-09-27: 13 -> 42 countries (countries.js), a corrected map
// projection (see MAP_PROJECTION in countries.js — the old one put Mumbai,
// Johannesburg and São Paulo in the ocean), multiple colour-by modes, and a
// hover popup with ~10 World Bank indicators fetched ONCE for every country
// (one request per indicator, not per country — the World Bank API accepts
// `USA;CHN;IND;...` and `mrnev=1` = "most recent non-empty value").
//
// Trading hours are each exchange's normal weekday regular session in local
// time — doesn't account for local public holidays (no free data source for
// that used elsewhere in this app either), so "open" means "within normal
// hours", not a guarantee it's not a holiday closure today.

function getExchangeStatus(ex) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ex.tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(new Date());
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  const hhmm = `${map.hour === "24" ? "00" : map.hour}:${map.minute}`;
  const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
  const tradingDays = ex.days || [1, 2, 3, 4, 5];
  const isOpen = tradingDays.includes(dayIdx) && hhmm >= ex.open && hhmm <= ex.close;
  return { isOpen, hhmm };
}

// Country status: null when its session hours aren't known.
function getCountryStatus(c) {
  if (!c.open) return null;
  return getExchangeStatus({ tz: c.tz, open: c.open, close: c.close, days: c.days });
}

// Used by script.js's ticker deep-dive page (right column) — looks up
// this stock's own listing exchange by country and returns its live
// open/closed status, or null if it's not a tracked exchange.
function getHomeMarketStatus(countryCode) {
  const ex = EXCHANGES.find(e => e.country === countryCode);
  if (!ex) return null;
  return { ex, ...getExchangeStatus(ex) };
}

// "Which market opens/closes next?" — zero extra API cost, pure client-
// side arithmetic over the same trading-hours data the map markers
// already use. Used by home.js's market breadth strip (Mon-Fri markets
// only — the Sun-Thu ones would need their own weekend arithmetic).
const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const minutesOfDay = hhmm => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

function daysUntilNextWeekday(dayIdx) {
  let offset = 1, idx = (dayIdx + 1) % 7;
  while (idx === 0 || idx === 6) { offset++; idx = (idx + 1) % 7; }
  return offset;
}

function getNextMarketEvent() {
  const now = new Date();
  const events = EXCHANGES.filter(ex => ORIGINAL_13.includes(ex.country)).map(ex => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ex.tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
    }).formatToParts(now);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    const hhmm = `${map.hour === "24" ? "00" : map.hour}:${map.minute}`;
    const dayIdx = DAY_ORDER.indexOf(map.weekday);
    const isWeekday = dayIdx >= 1 && dayIdx <= 5;
    const nowMin = minutesOfDay(hhmm);
    const openMin = minutesOfDay(ex.open);
    const closeMin = minutesOfDay(ex.close);
    const isOpen = isWeekday && nowMin >= openMin && nowMin <= closeMin;

    let diffMin, label;
    if (isOpen) {
      diffMin = closeMin - nowMin;
      label = "closes";
    } else {
      label = "opens";
      diffMin = (isWeekday && nowMin < openMin)
        ? openMin - nowMin
        : daysUntilNextWeekday(dayIdx) * 1440 - nowMin + openMin;
    }
    return { ex, label, diffMin };
  });
  events.sort((a, b) => a.diffMin - b.diffMin);
  return events[0];
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

// =====================================================================
// World Bank data for every tracked country — fetched once, shared by the
// hover popup, the choropleth, the directory and the country panel.
// `risk` = a rule-of-thumb colour (good/warn/bad) — conventional cutoffs
// for a quick read, not a forecast or a rating.
// =====================================================================
const WB_INDICATORS = [
  { key: "gdp", id: "NY.GDP.MKTP.CD", label: "GDP", fmt: v => fmtCompact(v, "$") },
  { key: "gdpg", id: "NY.GDP.MKTP.KD.ZG", label: "GDP growth", fmt: v => fmtPctVal(v, 1), risk: v => (v < 0 ? "bad" : v < 2 ? "warn" : "good") },
  { key: "gdppc", id: "NY.GDP.PCAP.CD", label: "GDP per capita", fmt: v => fmtCompact(v, "$") },
  { key: "infl", id: "FP.CPI.TOTL.ZG", label: "Inflation", fmt: v => `${v.toFixed(1)}%`, risk: v => (v > 10 ? "bad" : v > 5 || v < 0 ? "warn" : "good") },
  { key: "unemp", id: "SL.UEM.TOTL.ZS", label: "Unemployment", fmt: v => `${v.toFixed(1)}%`, risk: v => (v > 12 ? "bad" : v > 7 ? "warn" : "good") },
  { key: "debt", id: "GC.DOD.TOTL.GD.ZS", label: "Govt debt / GDP", fmt: v => `${v.toFixed(0)}%`, risk: v => (v > 100 ? "bad" : v > 60 ? "warn" : "good") },
  { key: "cab", id: "BN.CAB.XOKA.GD.ZS", label: "Current account / GDP", fmt: v => fmtPctVal(v, 1), risk: v => (v < -6 ? "bad" : v < -3 ? "warn" : "good") },
  { key: "trade", id: "NE.TRD.GNFS.ZS", label: "Trade / GDP", fmt: v => `${v.toFixed(0)}%` },
  { key: "fdi", id: "BX.KLT.DINV.WD.GD.ZS", label: "FDI inflows / GDP", fmt: v => `${v.toFixed(1)}%` },
  { key: "res", id: "FI.RES.TOTL.CD", label: "FX reserves", fmt: v => fmtCompact(v, "$") },
  { key: "pop", id: "SP.POP.TOTL", label: "Population", fmt: v => fmtCompact(v) },
  { key: "urban", id: "SP.URB.TOTL.IN.ZS", label: "Urban population", fmt: v => `${v.toFixed(0)}%` },
  { key: "life", id: "SP.DYN.LE00.IN", label: "Life expectancy", fmt: v => `${v.toFixed(1)} yrs` },
  { key: "inet", id: "IT.NET.USER.ZS", label: "Internet users", fmt: v => `${v.toFixed(0)}%` },
  { key: "fx", id: "PA.NUS.FCRF", label: "Currency per US$", fmt: v => (v >= 100 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v.toFixed(2)) },
  { key: "exports", id: "NE.EXP.GNFS.ZS", label: "Exports / GDP", fmt: v => `${v.toFixed(0)}%` },
  { key: "money", id: "FM.LBL.BMNY.GD.ZS", label: "Broad money / GDP", fmt: v => `${v.toFixed(0)}%` },
  { key: "rint", id: "FR.INR.RINR", label: "Real interest rate", fmt: v => fmtPctVal(v, 1) },
  { key: "gini", id: "SI.POV.GINI", label: "Inequality (Gini)", fmt: v => v.toFixed(1) },
  { key: "polstab", id: "GOV_WGI_PV.EST", label: "Political stability", fmt: v => v.toFixed(2), risk: v => (v < -1 ? "bad" : v < 0 ? "warn" : "good") },
];
const WB_BY_KEY = Object.fromEntries(WB_INDICATORS.map(i => [i.key, i]));

const worldData = { latest: {}, meta: {}, promises: {}, metaPromise: null };

// Taiwan isn't covered by the World Bank at all (confirmed live), so it's
// left out of the request rather than making every call carry a dead code.
const wbCountryParam = () => COUNTRIES.filter(c => c.iso3 !== "TWN").map(c => c.iso3).join(";");

function wbMultiUrl(path, extra) {
  logApiCall("worldbank");
  const search = new URLSearchParams({ path, format: "json", per_page: "100", ...extra });
  return `${API_BASE_URL}/api/worldbank?${search.toString()}`;
}

// The World Bank API (and the Worker in front of it) throttles bursts:
// firing all ~20 indicator requests at once made roughly a third of them
// fail or crawl (measured 2026-09-27; a single request takes ~1.5s). So
// requests run through a small limiter (4 at a time) and retry twice.
let wbActive = 0;
const wbWaiting = [];
function wbLimit(fn) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      wbActive++;
      try { resolve(await fn()); } catch (e) { reject(e); } finally { wbActive--; const next = wbWaiting.shift(); if (next) next(); }
    };
    if (wbActive < 4) run(); else wbWaiting.push(run);
  });
}
async function wbRetry(fn, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await wbLimit(fn); } catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 700 * (i + 1))); }
  }
  throw lastErr;
}

function ensureWorldIndicator(key) {
  const ind = WB_BY_KEY[key];
  if (worldData.promises[key]) return worldData.promises[key];
  worldData.promises[key] = wbRetry(() => fetchJSON(wbMultiUrl(`/country/${wbCountryParam()}/indicator/${ind.id}`, { mrnev: "1" })))
    .then(data => {
      const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
      const store = (worldData.latest[key] = {});
      rows.forEach(r => { if (isNum(r.value)) store[r.countryiso3code] = { value: r.value, date: r.date }; });
      document.dispatchEvent(new CustomEvent("worlddata", { detail: key }));
      return store;
    })
    .catch(() => { delete worldData.promises[key]; worldData.latest[key] = worldData.latest[key] || {}; return {}; });
  return worldData.promises[key];
}

function ensureWorldData(keys) {
  return Promise.all((keys || WB_INDICATORS.map(i => i.key)).map(ensureWorldIndicator));
}

function ensureWorldMeta() {
  if (worldData.metaPromise) return worldData.metaPromise;
  worldData.metaPromise = wbRetry(() => fetchJSON(wbMultiUrl(`/country/${wbCountryParam()}`)))
    .then(data => {
      const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
      rows.forEach(r => {
        worldData.meta[r.id] = {
          capital: r.capitalCity || "", region: (r.region && r.region.value || "").trim(),
          income: r.incomeLevel && r.incomeLevel.value || "", lending: r.lendingType && r.lendingType.value || "",
        };
      });
      return worldData.meta;
    })
    .catch(() => { worldData.metaPromise = null; return {}; });
  return worldData.metaPromise;
}

const wbValue = (key, iso3) => (worldData.latest[key] || {})[iso3] || null;

// ---- shared tag helpers ----
function groupTagHtml(c) {
  const g = COUNTRY_GROUPS.find(x => x.id === c.group);
  const tags = [`<span class="ctag ctag-${c.group}">${g ? g.label : ""}</span>`];
  if (c.group === "brics") tags[0] = `<span class="ctag ctag-brics">BRICS${c.brics && c.brics !== "founding" ? ` · ${c.brics}` : ""}</span>`;
  if (c.g7) tags.push('<span class="ctag ctag-g7">G7</span>');
  return tags.join("");
}

// =====================================================================
// Map rendering
// =====================================================================
let worldMapSvgRoot = null; // cached after the first fetch+inject
let mapColorMode = "groups";
const MAP_SELECTED = { iso2: null };

const GROUP_TINT = {
  brics: "color-mix(in srgb, var(--accent) 42%, var(--bg-surface-2))",
  developed: "color-mix(in srgb, #6366f1 30%, var(--bg-surface-2))",
  emerging: "color-mix(in srgb, #f59e0b 34%, var(--bg-surface-2))",
  frontier: "color-mix(in srgb, #ec4899 30%, var(--bg-surface-2))",
};
const GROUP_DOT_TINT = { brics: "var(--accent)", developed: "#6366f1", emerging: "#f59e0b", frontier: "#ec4899" };

function countryShapes(iso2) {
  return worldMapSvgRoot ? worldMapSvgRoot.querySelectorAll(`[class~="${iso2.toLowerCase()}"]`) : [];
}

async function renderWorldMarkets() {
  const container = document.getElementById("worldMarketsMap");
  if (!container) return;

  if (!worldMapSvgRoot) {
    try {
      const res = await fetch("worldmap.svg");
      const text = await res.text();
      container.innerHTML = text;
      worldMapSvgRoot = container.querySelector("svg");
      if (!worldMapSvgRoot) throw new Error("no <svg> root in worldmap.svg");
      worldMapSvgRoot.classList.add("world-markets-svg");
      worldMapSvgRoot.removeAttribute("width");
      worldMapSvgRoot.removeAttribute("height");
      worldMapSvgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
    } catch {
      container.innerHTML = '<p class="muted small">Couldn\'t load the world map.</p>';
      return;
    }
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const vb = worldMapSvgRoot.viewBox.baseVal;
  const r = vb.width * 0.0036;

  let markersLayer = worldMapSvgRoot.querySelector("#exchangeMarkersLayer");
  if (markersLayer) markersLayer.remove();
  markersLayer = document.createElementNS(svgNS, "g");
  markersLayer.setAttribute("id", "exchangeMarkersLayer");

  let openCount = 0, sessionCount = 0;

  COUNTRIES.forEach(c => {
    const status = getCountryStatus(c);
    if (status) { sessionCount++; if (status.isOpen) openCount++; }
    const isOpen = !!(status && status.isOpen);
    const x = mapLonToX(c.lon), y = mapLatToY(c.lat);

    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "exchange-marker map-hoverable-country" + (MAP_SELECTED.iso2 === c.iso2 ? " map-selected-dot" : ""));
    g.setAttribute("data-iso2", c.iso2);

    const dotGroup = document.createElementNS(svgNS, "g");
    dotGroup.setAttribute("transform", `translate(${x}, ${y})`);
    if (isOpen) {
      const pulse = document.createElementNS(svgNS, "circle");
      pulse.setAttribute("r", r * 1.7);
      pulse.setAttribute("class", "exchange-pulse");
      dotGroup.appendChild(pulse);
    }
    // Invisible larger hit target so small countries are easy to hover/click.
    const hit = document.createElementNS(svgNS, "circle");
    hit.setAttribute("r", r * 2.4);
    hit.setAttribute("fill", "transparent");
    dotGroup.appendChild(hit);
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("r", r);
    dot.setAttribute("class", "exchange-dot");
    dot.setAttribute("fill", isOpen ? "var(--positive)" : (status ? "var(--text-muted)" : GROUP_DOT_TINT[c.group]));
    dotGroup.appendChild(dot);
    g.appendChild(dotGroup);

    if (c.label) {
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", x + c.label.dx * 2.2);
      text.setAttribute("y", y + c.label.dy * 2.2);
      text.setAttribute("text-anchor", c.label.anchor || "start");
      text.setAttribute("class", "exchange-float-title");
      text.textContent = `${c.flag} ${c.city}`;
      g.appendChild(text);
    }

    bindCountryHover(g, c);
    markersLayer.appendChild(g);
  });

  worldMapSvgRoot.appendChild(markersLayer);

  const summaryEl = document.getElementById("worldMarketsSummary");
  if (summaryEl) summaryEl.textContent = `${openCount} of ${sessionCount} exchanges currently open · ${COUNTRIES.length} countries tracked`;

  // Country shapes are part of the cached SVG (fetched once), so their
  // hover/click bindings and tint only need setting up once.
  if (!worldMapSvgRoot.dataset.hoversAttached) {
    COUNTRIES.forEach(c => {
      countryShapes(c.iso2).forEach(el => { el.classList.add("map-hoverable-country"); bindCountryHover(el, c); });
    });
    worldMapSvgRoot.dataset.hoversAttached = "true";
    applyMapColorMode();
  }
}

// =====================================================================
// Hover popup
// =====================================================================
let hoverPopupEl = null;
let hoverHideTimer = null;
let hoverCountry = null;
let hoverQuoteTimer = null;

function bindCountryHover(el, c) {
  el.addEventListener("mouseenter", () => showCountryHover(c));
  el.addEventListener("mousemove", positionHoverPopup);
  el.addEventListener("mouseleave", scheduleHideHover);
  el.addEventListener("click", () => { if (typeof openCountry === "function") openCountry(c.iso2); });
}

function popupQuoteHtml(c) {
  if (!c.etf) return `<div class="map-hover-index muted">${c.note || "No US-listed index ETF for this market."}</div>`;
  const live = getFreshCache(QUOTE_CACHE, c.etf, QUOTE_TTL_MS);
  const sample = (ORIGINAL_13.includes(c.iso2) && homeState.marketTickers) ? homeState.marketTickers[c.etf] : null;
  const q = live || sample;
  const tag = live ? '<span class="live-tag">live</span>' : sample ? '<span class="sample-tag">sample</span>' : "";
  if (!q) return `<div class="map-hover-index">${c.etf} <span class="muted">— loading price…</span></div>`;
  const dp = q.dp ?? 0;
  return `<div class="map-hover-index">${c.etf} ${formatCurrency(q.c)} <span class="${changeClass(dp)}">${fmtPctVal(dp)}</span> ${tag}<span class="muted small"> · country ETF</span></div>`;
}

function popupHtml(c) {
  const status = getCountryStatus(c);
  const meta = worldData.meta[c.iso3];
  const now = status ? new Date().toLocaleTimeString("en-US", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", hour12: false }) : null;
  const statusHtml = status
    ? `<span class="${status.isOpen ? "status-open" : "status-closed"}">● ${status.isOpen ? "Open" : "Closed"}</span> · ${now} local · ${c.open}–${c.close}`
    : '<span class="muted">Session hours not tracked</span>';

  const cells = ["gdp", "gdpg", "gdppc", "infl", "unemp", "debt", "cab", "trade", "pop", "polstab"].map(key => {
    const ind = WB_BY_KEY[key];
    const v = c.iso3 === "TWN" ? null : wbValue(key, c.iso3);
    const loadingKey = c.iso3 !== "TWN" && !worldData.latest[key];
    const dot = v && ind.risk ? `<i class="risk-dot risk-${ind.risk(v.value)}"></i>` : "";
    return `<div class="map-hover-cell"><span>${ind.label}</span><strong>${v ? dot + ind.fmt(v.value) : (loadingKey ? '<span class="muted">…</span>' : "—")}</strong></div>`;
  }).join("");
  const loading = "";

  return `
    <div class="map-hover-title">${c.flag} ${c.name}</div>
    <div class="map-hover-tags">${groupTagHtml(c)}${meta && meta.income ? `<span class="ctag">${meta.income}</span>` : ""}</div>
    <div class="map-hover-sub muted small">${c.city}${c.ex ? ` · ${c.ex}` : ""}${meta && meta.capital && meta.capital !== c.city ? ` · capital ${meta.capital}` : ""}</div>
    <div class="map-hover-status small">${statusHtml}</div>
    ${popupQuoteHtml(c)}
    <div class="map-hover-grid">${cells}</div>
    ${loading}
    <div class="map-hover-foot small">Click for the full country profile ↓</div>`;
}

function showCountryHover(c) {
  clearTimeout(hoverHideTimer);
  hoverPopupEl = hoverPopupEl || document.getElementById("mapHoverPopup");
  if (!hoverPopupEl) return;
  hoverCountry = c;
  hoverPopupEl.innerHTML = popupHtml(c);
  hoverPopupEl.classList.remove("hidden");

  // Economic data + country metadata: fetched once for ALL countries the
  // first time anything is hovered, then reused.
  Promise.all([ensureWorldData(["gdp", "gdpg", "gdppc", "infl", "unemp", "debt", "cab", "trade", "pop", "polstab"]), ensureWorldMeta()])
    .then(() => { if (hoverCountry === c && !hoverPopupEl.classList.contains("hidden")) hoverPopupEl.innerHTML = popupHtml(c); });
  const refreshPopup = () => { if (hoverCountry === c && hoverPopupEl && !hoverPopupEl.classList.contains("hidden")) hoverPopupEl.innerHTML = popupHtml(c); };
  document.addEventListener("worlddata", refreshPopup, { once: true });

  // Live ETF price after a short dwell, so sweeping the mouse across the
  // map doesn't fire a quote request for every country it crosses.
  clearTimeout(hoverQuoteTimer);
  if (c.etf && !getFreshCache(QUOTE_CACHE, c.etf, QUOTE_TTL_MS)) {
    hoverQuoteTimer = setTimeout(() => {
      if (hoverCountry !== c) return;
      fetchQuoteCached(c.etf).then(() => { if (hoverCountry === c && !hoverPopupEl.classList.contains("hidden")) hoverPopupEl.innerHTML = popupHtml(c); });
    }, 450);
  }
}

function positionHoverPopup(e) {
  if (!hoverPopupEl || hoverPopupEl.classList.contains("hidden")) return;
  const offset = 16;
  const popupWidth = hoverPopupEl.offsetWidth || 300;
  const popupHeight = hoverPopupEl.offsetHeight || 260;
  // Popup is position:fixed inside a zoomed page — client coords are in
  // unzoomed pixels, so divide the zoom back out.
  const zoom = parseFloat(getComputedStyle(document.body).zoom) * parseFloat(getComputedStyle(document.getElementById("homeView") || document.body).zoom || 1) || 1;
  const vw = window.innerWidth / zoom, vh = window.innerHeight / zoom;
  let left = e.clientX / zoom + offset;
  if (left + popupWidth > vw - 12) left = e.clientX / zoom - offset - popupWidth;
  let top = e.clientY / zoom + offset;
  if (top + popupHeight > vh - 12) top = Math.max(8, vh - popupHeight - 12);
  hoverPopupEl.style.left = `${left}px`;
  hoverPopupEl.style.top = `${top}px`;
}

function scheduleHideHover() {
  clearTimeout(hoverQuoteTimer);
  hoverHideTimer = setTimeout(() => {
    hoverCountry = null;
    if (hoverPopupEl) hoverPopupEl.classList.add("hidden");
  }, 80);
}

// =====================================================================
// Colour-by modes: group tint (default) or a World Bank indicator
// choropleth. Land paths persist across the 30s marker re-render, so a
// tint applied once stays put.
// =====================================================================
const MAP_MODES = [
  { id: "groups", label: "Groups" },
  { id: "gdpg", label: "GDP growth", scale: { kind: "diverging", max: 8 } },
  { id: "infl", label: "Inflation", scale: { kind: "warm", max: 15 } },
  { id: "unemp", label: "Unemployment", scale: { kind: "warm", max: 16 } },
  { id: "debt", label: "Govt debt", scale: { kind: "warm", max: 140 } },
  { id: "cab", label: "Current account", scale: { kind: "diverging", max: 10 } },
  { id: "polstab", label: "Political stability", scale: { kind: "diverging", max: 1.8 } },
  { id: "gdppc", label: "GDP per capita", scale: { kind: "log" } },
];

function scaleColor(scale, v, logRange) {
  const mix = (varName, pct) => `color-mix(in srgb, ${varName} ${Math.round(pct)}%, var(--bg-surface-2))`;
  if (scale.kind === "diverging") {
    const t = Math.min(Math.abs(v) / scale.max, 1) * 62;
    return v >= 0 ? mix("var(--positive)", t) : mix("var(--negative)", t);
  }
  if (scale.kind === "warm") {
    if (v < 0) return mix("#3b82f6", Math.min(Math.abs(v) / 5, 1) * 40);
    return mix("var(--negative)", Math.min(v / scale.max, 1) * 62);
  }
  const t = (Math.log10(Math.max(v, 1)) - logRange.min) / (logRange.max - logRange.min || 1);
  return mix("var(--accent)", Math.max(0, Math.min(1, t)) * 62);
}

function clearMapTint() {
  if (!worldMapSvgRoot) return;
  worldMapSvgRoot.querySelectorAll(".choropleth-tinted").forEach(el => { el.style.fill = ""; el.classList.remove("choropleth-tinted"); });
}

let mapColorToken = 0;
async function applyMapColorMode() {
  const token = ++mapColorToken;
  clearMapTint();
  if (!worldMapSvgRoot) return;
  const legend = document.getElementById("mapLegend");
  const paint = (c, color) => countryShapes(c.iso2).forEach(el => { el.style.fill = color; el.classList.add("choropleth-tinted"); });

  if (mapColorMode === "groups") {
    COUNTRIES.forEach(c => paint(c, GROUP_TINT[c.group]));
    if (legend) legend.innerHTML = COUNTRY_GROUPS.map(g => `<span class="map-legend-item"><i style="background:${GROUP_DOT_TINT[g.id]}"></i>${g.label}</span>`).join("") + '<span class="map-legend-item"><i class="legend-open"></i>Market open</span><span class="map-legend-item"><i class="legend-closed"></i>Closed</span>';
    return;
  }

  const mode = MAP_MODES.find(m => m.id === mapColorMode);
  if (legend) legend.innerHTML = '<span class="muted small">Loading World Bank data…</span>';
  await ensureWorldData([mode.id]);
  if (token !== mapColorToken) return; // user switched modes while this loaded

  const store = worldData.latest[mode.id] || {};
  const vals = COUNTRIES.map(c => store[c.iso3] && store[c.iso3].value).filter(isNum);
  const logRange = mode.scale.kind === "log" ? { min: Math.log10(Math.max(Math.min(...vals), 1)), max: Math.log10(Math.max(...vals, 1)) } : null;
  COUNTRIES.forEach(c => {
    const d = store[c.iso3];
    paint(c, d ? scaleColor(mode.scale, d.value, logRange) : "color-mix(in srgb, var(--text-muted) 14%, var(--bg-surface-2))");
  });

  if (legend) {
    const ind = WB_BY_KEY[mode.id];
    const stops = mode.scale.kind === "diverging" ? ["var(--negative)", "var(--bg-surface-2)", "var(--positive)"]
      : mode.scale.kind === "warm" ? ["var(--bg-surface-2)", "var(--negative)"] : ["var(--bg-surface-2)", "var(--accent)"];
    const lo = mode.scale.kind === "diverging" ? `−${mode.scale.max}` : mode.scale.kind === "warm" ? "0" : fmtCompact(Math.min(...vals), "$");
    const hi = mode.scale.kind === "log" ? fmtCompact(Math.max(...vals), "$") : (mode.scale.kind === "diverging" ? `+${mode.scale.max}` : `${mode.scale.max}+`);
    legend.innerHTML = `<span class="map-legend-title">${ind.label}</span><span class="small muted">${lo}</span><span class="map-legend-bar" style="background:linear-gradient(90deg, ${stops.map(s => `color-mix(in srgb, ${s} 62%, var(--bg-surface-2))`).join(", ")})"></span><span class="small muted">${hi}</span><span class="map-legend-item"><i class="legend-nodata"></i>No data</span><span class="small muted">latest available year per country</span>`;
  }
}

function initMapColorToggle() {
  const el = document.getElementById("mapColorToggle");
  if (!el) return;
  el.innerHTML = `<span class="map-color-label">Color by</span>` + MAP_MODES.map(m => `<button type="button" data-mode="${m.id}" class="${m.id === mapColorMode ? "active" : ""}">${m.label}</button>`).join("");
  el.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      mapColorMode = btn.dataset.mode;
      el.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === btn));
      applyMapColorMode();
    });
  });
}

// Marks the selected country on the map (called by marketData.js).
function setMapSelected(iso2) {
  if (!worldMapSvgRoot) return;
  worldMapSvgRoot.querySelectorAll(".map-selected").forEach(el => el.classList.remove("map-selected"));
  MAP_SELECTED.iso2 = iso2;
  if (iso2) countryShapes(iso2).forEach(el => el.classList.add("map-selected"));
  worldMapSvgRoot.querySelectorAll(".map-selected-dot").forEach(el => el.classList.remove("map-selected-dot"));
  const dotG = worldMapSvgRoot.querySelector(`#exchangeMarkersLayer g[data-iso2="${iso2}"]`);
  if (dotG) dotG.classList.add("map-selected-dot");
}

initMapColorToggle();
renderWorldMarkets();
setInterval(renderWorldMarkets, 30000);
