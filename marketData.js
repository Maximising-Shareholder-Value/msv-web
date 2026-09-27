// marketData.js — the Market Data page (2026-09-27): the country directory
// beside the map, and the country profile panel that opens below it when a
// country is clicked (on the map or in the list). The global risk
// dashboard lives in riskDashboard.js.
//
// Everything on the profile comes from sources the app already uses for
// free: World Bank (economy, history, governance — one multi-country
// request per indicator, cached in worldData), and Finnhub for the country
// ETF's quote + performance metrics (2 calls, fetched on click, cached).

const marketState = { selected: null, group: "all", query: "", directoryLoaded: false };

const GROUP_ORDER = ["brics", "developed", "emerging", "frontier"];

function isMarketDataPageActive() {
  const hv = document.getElementById("homeView");
  return hv && hv.dataset.focus === "market-data" && !hv.classList.contains("hidden");
}

// Called from the map (any page) and the directory. On the homepage it
// first navigates to the Market Data page, then selects the country.
function openCountry(iso2) {
  if (!isMarketDataPageActive()) navigateTo("market-data");
  selectCountry(iso2, { scroll: true });
}

// =====================================================================
// Directory (right-hand list)
// =====================================================================
function directoryRowHtml(c) {
  const status = getCountryStatus(c);
  const q = c.etf ? getFreshCache(QUOTE_CACHE, c.etf, QUOTE_TTL_MS) : null;
  const dot = status ? `<i class="cd-dot ${status.isOpen ? "open" : "closed"}" title="${status.isOpen ? "Market open" : "Market closed"}"></i>` : '<i class="cd-dot none" title="No session tracked"></i>';
  return `
    <button type="button" class="cd-row${marketState.selected === c.iso2 ? " selected" : ""}" data-iso2="${c.iso2}">
      <span class="cd-flag">${c.flag}</span>
      <span class="cd-name"><strong>${c.name}</strong><span class="muted">${c.etf || "macro only"} · ${c.city}</span></span>
      ${dot}
      <span class="cd-quote" data-etf="${c.etf || ""}">${q ? `${formatCurrency(q.c)} <b class="${changeClass(q.dp)}">${fmtPctVal(q.dp)}</b>` : (c.etf ? '<span class="muted">…</span>' : "")}</span>
    </button>`;
}

function renderCountryDirectory() {
  const el = document.getElementById("countryDirectory");
  if (!el) return;
  const q = marketState.query.trim().toLowerCase();
  const matches = c => {
    if (q && !`${c.name} ${c.city} ${c.etf || ""} ${c.iso2}`.toLowerCase().includes(q)) return false;
    if (marketState.group === "all") return true;
    if (marketState.group === "open") { const s = getCountryStatus(c); return !!(s && s.isOpen); }
    if (marketState.group === "g7") return !!c.g7;
    return c.group === marketState.group;
  };
  const chips = [["all", "All"], ["brics", "BRICS"], ["developed", "Developed"], ["emerging", "Emerging"], ["frontier", "Frontier"], ["g7", "G7"], ["open", "Open now"]];

  const body = GROUP_ORDER.map(gid => {
    const rows = COUNTRIES.filter(c => c.group === gid && matches(c));
    if (!rows.length) return "";
    const g = COUNTRY_GROUPS.find(x => x.id === gid);
    return `<div class="cd-group"><div class="cd-group-title" title="${g.blurb}">${g.label} <span class="muted">${rows.length}</span></div>${rows.map(directoryRowHtml).join("")}</div>`;
  }).join("") || '<p class="muted small" style="padding:10px">No countries match.</p>';

  el.innerHTML = `
    <div class="cd-head">
      <input type="search" class="cd-search" id="cdSearch" placeholder="Search countries, cities, ETFs…" value="${escapeHtml(marketState.query)}" autocomplete="off">
      <div class="cd-chips">${chips.map(([id, label]) => `<button type="button" data-group="${id}" class="${marketState.group === id ? "active" : ""}">${label}</button>`).join("")}</div>
    </div>
    <div class="cd-list">${body}</div>
    <p class="muted small cd-foot">Prices are live country-ETF quotes (index proxies); “…” loads in a moment. Sun–Thu markets are handled correctly.</p>`;

  el.querySelector("#cdSearch").addEventListener("input", e => {
    marketState.query = e.target.value;
    const pos = e.target.selectionStart;
    renderCountryDirectory();
    const again = document.getElementById("cdSearch");
    again.focus(); again.setSelectionRange(pos, pos);
  });
  el.querySelectorAll(".cd-chips button").forEach(b => b.addEventListener("click", () => { marketState.group = b.dataset.group; renderCountryDirectory(); }));
  el.querySelectorAll(".cd-row").forEach(r => r.addEventListener("click", () => selectCountry(r.dataset.iso2, { scroll: true })));
}

// Live ETF quotes for the whole directory, a few at a time, filling rows in
// as they arrive (each ETF is fetched at most once per 2 minutes).
function loadDirectoryQuotes() {
  const symbols = COUNTRIES.filter(c => c.etf).map(c => c.etf);
  loadQuotesThrottled(symbols, (sym, q) => {
    document.querySelectorAll(`.cd-quote[data-etf="${sym}"]`).forEach(cell => {
      cell.innerHTML = q ? `${formatCurrency(q.c)} <b class="${changeClass(q.dp)}">${fmtPctVal(q.dp)}</b>` : '<span class="muted">n/a</span>';
    });
  }, { concurrency: 3, gapMs: 200 });
}

// =====================================================================
// Page orchestration (called by the router each time Market Data opens)
// =====================================================================
function renderMarketDataPage() {
  renderCountryDirectory();
  if (!marketState.directoryLoaded) { marketState.directoryLoaded = true; loadDirectoryQuotes(); }
  else loadDirectoryQuotes(); // cheap: cached quotes are reused, stale ones refresh
  ensureWorldData(); ensureWorldMeta();
  if (typeof renderRiskDashboard === "function") renderRiskDashboard();
  if (!marketState.selected) renderCountryPanelHint();
}

function renderCountryPanelHint() {
  const el = document.getElementById("countryPanel");
  if (!el) return;
  el.innerHTML = `
    <div class="cp-empty">
      <h3>Country profile</h3>
      <p class="muted">Click any country on the map, or pick one from the list, to open a full profile here: its market snapshot, economy, history charts, governance scores and how it compares with the other ${COUNTRIES.length - 1} tracked countries.</p>
      <div class="cp-quick">${["US", "CN", "IN", "BR", "ID", "ZA", "MX", "DE"].map(i => `<button type="button" data-iso2="${i}">${COUNTRY_BY_ISO2[i].flag} ${COUNTRY_BY_ISO2[i].name}</button>`).join("")}</div>
    </div>`;
  el.querySelectorAll("[data-iso2]").forEach(b => b.addEventListener("click", () => selectCountry(b.dataset.iso2, { scroll: false })));
}

// =====================================================================
// Country profile panel
// =====================================================================
function selectCountry(iso2, { scroll } = {}) {
  const c = COUNTRY_BY_ISO2[iso2];
  if (!c) return;
  marketState.selected = iso2;
  setMapSelected(iso2);
  document.querySelectorAll(".cd-row").forEach(r => r.classList.toggle("selected", r.dataset.iso2 === iso2));
  renderCountryPanel(c);
  if (scroll) requestAnimationFrame(() => document.getElementById("countryPanelCard")?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

// Where a value sits among all tracked countries for an indicator.
function peerStats(key, iso3) {
  const store = worldData.latest[key] || {};
  const mine = store[iso3];
  const vals = Object.values(store).map(d => d.value).sort((a, b) => a - b);
  if (!mine || vals.length < 3) return null;
  const rank = vals.filter(v => v > mine.value).length + 1; // 1 = highest
  const median = vals[Math.floor(vals.length / 2)];
  return { value: mine.value, date: mine.date, rank, n: vals.length, min: vals[0], max: vals[vals.length - 1], median };
}

function kpiCardHtml(key, iso3) {
  const ind = WB_BY_KEY[key];
  const d = wbValue(key, iso3);
  if (!d && !worldData.latest[key]) return `<div class="kpi kpi-na"><div class="kpi-label">${ind.label}</div><div class="kpi-value muted">…</div><div class="kpi-sub muted">loading</div></div>`;
  if (!d) return `<div class="kpi kpi-na"><div class="kpi-label">${ind.label}</div><div class="kpi-value muted">—</div><div class="kpi-sub muted">not published</div></div>`;
  const ps = peerStats(key, iso3);
  const risk = ind.risk ? ind.risk(d.value) : "";
  const pos = ps && ps.max > ps.min ? ((ps.value - ps.min) / (ps.max - ps.min)) * 100 : null;
  return `
    <div class="kpi">
      <div class="kpi-label">${ind.label}</div>
      <div class="kpi-value">${risk ? `<i class="risk-dot risk-${risk}"></i>` : ""}${ind.fmt(d.value)}</div>
      ${pos !== null ? `<div class="kpi-peer" title="Range across tracked countries: ${ind.fmt(ps.min)} to ${ind.fmt(ps.max)} · median ${ind.fmt(ps.median)}"><span class="kpi-peer-track"><i style="left:${pos.toFixed(0)}%"></i></span></div>` : ""}
      <div class="kpi-sub muted">${ps ? `#${ps.rank} of ${ps.n} · ` : ""}${d.date}</div>
    </div>`;
}

const KPI_GROUPS = [
  { title: "Economy", keys: ["gdp", "gdpg", "gdppc", "infl", "unemp", "rint", "money"] },
  { title: "Trade & external position", keys: ["cab", "trade", "exports", "fdi", "res", "fx"] },
  { title: "Fiscal", keys: ["debt"] },
  { title: "People & society", keys: ["pop", "urban", "life", "inet", "gini"] },
  { title: "Stability", keys: ["polstab"] },
];

function insightBullets(c) {
  const out = [];
  const say = (key, fn) => { const ps = peerStats(key, c.iso3); if (ps) { const t = fn(ps, WB_BY_KEY[key]); if (t) out.push(t); } };
  say("gdpg", (ps, i) => `Growth of ${i.fmt(ps.value)} is ${ps.value > ps.median ? "above" : "below"} the tracked-country median (${i.fmt(ps.median)}) — ranked #${ps.rank} of ${ps.n}.`);
  say("infl", (ps, i) => ps.value > 10 ? `Inflation of ${i.fmt(ps.value)} is high by any standard — it erodes savings and usually forces tight monetary policy.` : `Inflation of ${i.fmt(ps.value)} vs a median of ${i.fmt(ps.median)} (#${ps.rank} highest of ${ps.n}).`);
  say("unemp", (ps, i) => `Unemployment of ${i.fmt(ps.value)} is ${ps.value > ps.median ? "higher" : "lower"} than the median (${i.fmt(ps.median)}).`);
  say("debt", (ps, i) => ps.value > 100 ? `Government debt at ${i.fmt(ps.value)} of GDP is above the 100% level many analysts treat as a caution flag.` : `Government debt is ${i.fmt(ps.value)} of GDP (median ${i.fmt(ps.median)}).`);
  say("cab", (ps, i) => ps.value < -3 ? `A current-account deficit of ${i.fmt(ps.value)} of GDP means the country relies on foreign capital to fund itself — a currency-risk factor.` : ps.value > 3 ? `A current-account surplus of ${i.fmt(ps.value)} of GDP means it earns more from the world than it spends.` : `The current account is roughly balanced (${i.fmt(ps.value)} of GDP).`);
  say("res", (ps, i) => `Foreign-exchange reserves of ${i.fmt(ps.value)} rank #${ps.rank} of ${ps.n} — a buffer against currency and capital-flow shocks.`);
  say("polstab", (ps, i) => ps.value < -1 ? `Political stability scores ${i.fmt(ps.value)} (roughly −2.5 weak to +2.5 strong) — a risk factor for investors.` : null);
  return out;
}

function similarEconomies(c) {
  const store = worldData.latest.gdppc || {};
  const mine = store[c.iso3];
  if (!mine) return [];
  return COUNTRIES.filter(x => x.iso3 !== c.iso3 && store[x.iso3])
    .sort((a, b) => Math.abs(Math.log(store[a.iso3].value / mine.value)) - Math.abs(Math.log(store[b.iso3].value / mine.value)))
    .slice(0, 5);
}

function renderCountryPanel(c) {
  const el = document.getElementById("countryPanel");
  if (!el) return;
  const status = getCountryStatus(c);
  el.innerHTML = `
    <div class="cp-head">
      <div>
        <h3>${c.flag} ${c.name} <span class="cp-tags">${groupTagHtml(c)}</span></h3>
        <p class="muted small" id="cpSubline">${c.city}${c.ex ? ` · ${c.ex}` : ""}${status ? ` · <span class="${status.isOpen ? "status-open" : "status-closed"}">● ${status.isOpen ? "Open" : "Closed"}</span> (${c.open}–${c.close} local)` : ""}</p>
        ${c.note ? `<p class="cp-note small">${c.note}</p>` : ""}
      </div>
      <div class="cp-actions">
        ${c.etf ? `<button type="button" class="cp-btn" id="cpOpenEtf">Open ${c.etf} page →</button>` : ""}
        <button type="button" class="cp-btn cp-btn-ghost" id="cpMacro">Compare in Macro tab</button>
        <button type="button" class="cp-btn cp-btn-ghost" id="cpClose">✕ Close</button>
      </div>
    </div>
    <div class="cp-section" id="cpMarket"><h4>Market snapshot</h4><div class="cp-market"><p class="muted small">${c.etf ? `Loading ${c.etf}…` : "No US-listed index ETF for this market — macro data only."}</p></div></div>
    <div class="cp-section" id="cpInsights" hidden><h4>What stands out <span class="card-subtitle">auto-generated from the data below — compared with the ${COUNTRIES.length - 1} other tracked countries</span></h4><ul class="cp-insights"></ul></div>
    <div class="cp-section" id="cpKpis"><h4>Economy at a glance <span class="card-subtitle">latest published figure · dot = rule-of-thumb read · bar = position among tracked countries</span></h4><div class="cp-kpi-groups"><p class="muted small">Loading World Bank data…</p></div></div>
    <div class="cp-section" id="cpHistory"><h4>History <span class="card-subtitle">World Bank, annual</span></h4><div class="cp-history"><p class="muted small">Loading history…</p></div></div>
    <div class="cp-section" id="cpGov"><h4>Governance <span class="card-subtitle">Worldwide Governance Indicators, −2.5 (weak) to +2.5 (strong)</span></h4><div class="cp-gov"><p class="muted small">Loading…</p></div></div>
    <div class="cp-section" id="cpSimilar" hidden><h4>Economies of similar income level</h4><div class="cp-similar"></div></div>
    <p class="muted small cp-foot">Sources: World Bank Open Data (annual figures, latest available year — often lags 1–2 years), Worldwide Governance Indicators, Finnhub (country ETF). Colored dots are conventional rules of thumb, not ratings or forecasts.</p>`;

  el.querySelector("#cpOpenEtf")?.addEventListener("click", () => loadTicker(c.etf));
  el.querySelector("#cpClose").addEventListener("click", () => { marketState.selected = null; setMapSelected(null); document.querySelectorAll(".cd-row.selected").forEach(r => r.classList.remove("selected")); renderCountryPanelHint(); });
  el.querySelector("#cpMacro").addEventListener("click", () => {
    presetMacro({ macroCustomCountry: c.iso3 === "USA" ? null : { iso3: c.iso3, name: c.name }, macroCountry: c.iso3 === "USA" ? "USA" : homeState.macroCountry, macroCompareMode: false });
    navigateTo("macro");
  });

  const stillSelected = () => marketState.selected === c.iso2;
  loadCountryMarket(c, stillSelected);
  // KPIs render immediately and refill as each World Bank indicator lands
  // (they arrive one at a time through the limiter in worldMarkets.js).
  renderCountryKpis(c);
  let repaint = 0;
  const onData = () => { if (!stillSelected()) { document.removeEventListener("worlddata", onData); return; } cancelAnimationFrame(repaint); repaint = requestAnimationFrame(() => renderCountryKpis(c)); };
  document.addEventListener("worlddata", onData);
  ensureWorldData().then(() => { if (stillSelected()) renderCountryKpis(c); document.removeEventListener("worlddata", onData); });
  ensureWorldMeta().then(() => { if (stillSelected()) { const m = worldData.meta[c.iso3]; const sub = el.querySelector("#cpSubline"); if (m && sub && !sub.dataset.meta) { sub.dataset.meta = "1"; sub.insertAdjacentHTML("beforeend", ` · ${m.region}${m.income ? ` · ${m.income}` : ""}${m.capital ? ` · capital ${m.capital}` : ""}`); } } });
  loadCountryHistory(c, stillSelected);
  loadCountryGovernance(c, stillSelected);
}

function renderCountryKpis(c) {
  const el = document.querySelector("#cpKpis .cp-kpi-groups");
  if (!el) return;
  if (c.iso3 === "TWN") { el.innerHTML = '<p class="muted">The World Bank doesn\'t publish country data for Taiwan, so no economic indicators are available here.</p>'; return; }
  el.innerHTML = KPI_GROUPS.map(g => `<div class="cp-kpi-group"><div class="cp-kpi-group-title">${g.title}</div><div class="kpi-grid">${g.keys.map(k => kpiCardHtml(k, c.iso3)).join("")}</div></div>`).join("");
  const bullets = insightBullets(c);
  if (bullets.length) {
    const box = document.getElementById("cpInsights");
    box.hidden = false;
    box.querySelector("ul").innerHTML = bullets.map(b => `<li>${b}</li>`).join("");
  }
  const sim = similarEconomies(c);
  if (sim.length) {
    const box = document.getElementById("cpSimilar");
    box.hidden = false;
    box.querySelector(".cp-similar").innerHTML = sim.map(x => `<button type="button" class="cp-chip" data-iso2="${x.iso2}">${x.flag} ${x.name} <span class="muted">${fmtCompact(wbValue("gdppc", x.iso3).value, "$")}</span></button>`).join("");
    box.querySelectorAll("[data-iso2]").forEach(b => b.addEventListener("click", () => selectCountry(b.dataset.iso2, { scroll: true })));
  }
}

// ---- market snapshot: quote + performance metrics of the country ETF ----
async function loadCountryMarket(c, stillSelected) {
  const el = document.querySelector("#cpMarket .cp-market");
  if (!el || !c.etf) return;
  const [q, m] = await Promise.all([fetchQuoteCached(c.etf), fetchMetricCached(c.etf)]);
  if (!stillSelected()) return;
  if (!q) { el.innerHTML = `<p class="muted small">Couldn't load a live ${c.etf} quote right now (free-tier rate limit) — try again in a minute.</p>`; return; }

  const range52 = m && isNum(m["52WeekLow"]) && isNum(m["52WeekHigh"]) && m["52WeekHigh"] > m["52WeekLow"]
    ? Math.max(0, Math.min(1, (q.c - m["52WeekLow"]) / (m["52WeekHigh"] - m["52WeekLow"]))) : null;
  const perf = m ? [["5D", m["5DayPriceReturnDaily"]], ["MTD", m["monthToDatePriceReturnDaily"]], ["3M", m["13WeekPriceReturnDaily"]], ["6M", m["26WeekPriceReturnDaily"]], ["YTD", m["yearToDatePriceReturnDaily"]], ["1Y", m["52WeekPriceReturnDaily"]]] : [];
  const stat = (label, val) => `<div class="cp-stat"><span>${label}</span><strong>${val}</strong></div>`;

  el.innerHTML = `
    <div class="cp-market-top">
      <div class="cp-price"><span class="cp-price-big">${formatCurrency(q.c)}</span> <span class="${changeClass(q.dp)}">${fmtSigned(q.d)} (${fmtPctVal(q.dp)})</span>
        <div class="muted small">${c.etf} · country ETF used as an index proxy · <span class="live-tag">live</span></div></div>
      <div class="cp-stats">${stat("Open", fmtNumOrDash(q.o))}${stat("Day high", fmtNumOrDash(q.h))}${stat("Day low", fmtNumOrDash(q.l))}${stat("Prev close", fmtNumOrDash(q.pc))}${m ? stat("Beta", isNum(m.beta) ? m.beta.toFixed(2) : "—") : ""}${m ? stat("Avg vol (10d)", isNum(m["10DayAverageTradingVolume"]) ? `${m["10DayAverageTradingVolume"].toFixed(2)}M` : "—") : ""}</div>
    </div>
    ${range52 !== null ? `<div class="cp-52w"><span class="small muted">52-week range</span><span class="small">${formatCurrency(m["52WeekLow"])}</span><span class="cp-52w-track"><i style="left:${(range52 * 100).toFixed(0)}%"></i></span><span class="small">${formatCurrency(m["52WeekHigh"])}</span></div>` : ""}
    ${perf.length ? `<div class="cp-perf">${perf.map(([l, v]) => `<div class="cp-perf-cell ${changeClass(v)}"><span>${l}</span><strong>${fmtPctVal(v, 1)}</strong></div>`).join("")}</div>` : ""}`;
}
const fmtNumOrDash = v => (isNum(v) ? formatCurrency(v) : "—");

// ---- history charts (World Bank annual series for this country) ----
const HISTORY_CHARTS = [
  { id: "NY.GDP.MKTP.KD.ZG", title: "GDP growth", unit: "%", color: "var(--accent)" },
  { id: "FP.CPI.TOTL.ZG", title: "Inflation", unit: "%", color: "#f59e0b" },
  { id: "SL.UEM.TOTL.ZS", title: "Unemployment", unit: "%", color: "#6366f1" },
  { id: "NY.GDP.PCAP.CD", title: "GDP per capita (US$)", unit: "", color: "#0ea5e9", decimals: 0 },
  { id: "BN.CAB.XOKA.GD.ZS", title: "Current account (% of GDP)", unit: "%", color: "#ec4899" },
  { id: "PA.NUS.FCRF", title: "Currency per US$", unit: "", color: "#8b5cf6", decimals: 1 },
];

async function loadCountryHistory(c, stillSelected) {
  const el = document.querySelector("#cpHistory .cp-history");
  if (!el) return;
  if (c.iso3 === "TWN") { el.innerHTML = '<p class="muted small">No World Bank history for Taiwan.</p>'; return; }
  const results = await Promise.allSettled(HISTORY_CHARTS.map(async h => {
    logApiCall("worldbank");
    const search = new URLSearchParams({ path: `/country/${c.iso3}/indicator/${h.id}`, format: "json", per_page: "40" });
    const data = await wbRetry(() => fetchJSON(`${API_BASE_URL}/api/worldbank?${search.toString()}`));
    const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
    return rows.filter(r => isNum(r.value)).map(r => ({ label: r.date, value: r.value })).reverse().slice(-30);
  }));
  if (!stillSelected()) return;
  el.innerHTML = `<div class="cp-charts">${HISTORY_CHARTS.map((h, i) => {
    const series = results[i].status === "fulfilled" ? results[i].value : [];
    const last = series[series.length - 1];
    const avg5 = series.slice(-5).reduce((s, p) => s + p.value, 0) / Math.max(1, Math.min(5, series.length));
    return `<div class="cp-chart"><div class="cp-chart-head"><strong>${h.title}</strong>${last ? `<span>${last.value.toLocaleString(undefined, { maximumFractionDigits: h.decimals ?? 1 })}${h.unit} <span class="muted small">${last.label}</span></span>` : ""}</div>${series.length > 1 ? lineChartSvg(series, { unit: h.unit, color: h.color, decimals: h.decimals ?? 1 }) : '<p class="muted small">Not published for this country.</p>'}${series.length > 4 ? `<div class="muted small">5-yr average ${avg5.toLocaleString(undefined, { maximumFractionDigits: h.decimals ?? 1 })}${h.unit}</div>` : ""}</div>`;
  }).join("")}</div>`;
}

// ---- governance bars (six WGI scores) ----
async function loadCountryGovernance(c, stillSelected) {
  const el = document.querySelector("#cpGov .cp-gov");
  if (!el) return;
  if (c.iso3 === "TWN") { el.innerHTML = '<p class="muted small">Not covered by the World Bank.</p>'; return; }
  const results = await Promise.allSettled(WORLD_BANK_GOVERNANCE_INDICATORS.map(ind => wbRetry(() => fetchWorldBankIndicator(ind, c.iso3))));
  if (!stillSelected()) return;
  el.innerHTML = WORLD_BANK_GOVERNANCE_INDICATORS.map((ind, i) => {
    const r = results[i];
    const v = r.status === "fulfilled" && isNum(r.value.value) ? r.value.value : null;
    if (v === null) return `<div class="gov-row"><span>${ind.label}</span><span class="muted">—</span></div>`;
    const pct = Math.max(0, Math.min(100, ((v + 2.5) / 5) * 100));
    return `<div class="gov-row"><span>${ind.label}</span><span class="gov-track"><i class="gov-zero"></i><i class="gov-fill ${v >= 0 ? "pos" : "neg"}" style="${v >= 0 ? `left:50%;width:${pct - 50}%` : `left:${pct}%;width:${50 - pct}%`}"></i></span><strong class="${v >= 0 ? "positive" : "negative"}">${v.toFixed(2)}</strong></div>`;
  }).join("");
}
