// riskDashboard.js — the "Global risk dashboard" under the world map on the
// Market Data page (2026-09-27). Two halves:
//
// 1. US-published, market-priced gauges from FRED (via the msv-api proxy,
//    every series live-checked before being added): volatility & fear, rate
//    risk, inflation risk, credit & recession risk, dollar & oil. Each card
//    shows the latest value, a 1-year sparkline, recent changes, a plain-
//    English "what this means" and a colored reading.
// 2. A country scoreboard from the World Bank (already loaded for the map):
//    inflation, growth, unemployment, debt, current account and political
//    stability for every tracked country, sortable, with risk-flag chips.
//
// HOW THE COLORED READINGS WORK: each gauge has conventional rule-of-thumb
// bands (e.g. VIX below 15 is "calm", above 30 is "high stress"; a
// negative 10Y-2Y yield spread is an "inverted" curve). They are widely
// used shorthand, NOT forecasts or ratings, and they're listed on every
// card so nothing is hidden. Sources are linked on each card.
//
// This is the "markets" view — fast-moving, price-based risk gauges.
// The Macro tab is the "economy" view — slower fundamentals by country.

// level: "calm" | "normal" | "elevated" | "high" | "info". `bands` are
// ascending [upperBound, level, label]; the last band has no bound.
// `rel: true` = bands apply to value / trailing-1-year-average instead.
const RISK_GROUPS = [
  { id: "fear", title: "Fear & volatility", blurb: "How nervous are investors right now?" },
  { id: "rates", title: "Interest-rate risk", blurb: "Where rates are, and what the yield curve is signalling." },
  { id: "inflation", title: "Inflation risk", blurb: "What markets and the data say about prices." },
  { id: "credit", title: "Credit & recession risk", blurb: "Stress in lending markets and the labor market." },
  { id: "fx", title: "Dollar & oil", blurb: "The two prices that ripple through the global economy." },
];

const RISK_SERIES = [
  { group: "fear", id: "VIXCLS", title: "VIX — market fear gauge", freq: "d", fmt: v => v.toFixed(1),
    bands: [[15, "calm", "Calm"], [20, "normal", "Normal"], [30, "elevated", "Elevated"], [Infinity, "high", "High stress"]],
    bandText: "Calm <15 · Normal 15–20 · Elevated 20–30 · High >30",
    explain: "The market's expected 30-day swing in the S&P 500, implied by option prices. It jumps when investors rush to buy protection." },
  { group: "fear", id: "STLFSI4", title: "Financial Stress Index", freq: "w", fmt: v => v.toFixed(2),
    bands: [[0, "calm", "Below-average stress"], [1, "elevated", "Above average"], [Infinity, "high", "High stress"]],
    bandText: "0 = average stress · below 0 calm · above 1 high",
    explain: "The St. Louis Fed's blend of 18 weekly market readings (rates, spreads, volatility). Zero means average stress." },
  { group: "fear", id: "USEPUINDXD", title: "US policy uncertainty", freq: "d", rel: true, fmt: v => v.toFixed(0),
    bands: [[0.8, "calm", "Quiet"], [1.3, "normal", "Normal"], [2, "elevated", "Elevated"], [Infinity, "high", "Very high"]],
    bandText: "Compared with its own 1-year average: <0.8× quiet · 0.8–1.3× normal · 1.3–2× elevated · >2× very high",
    explain: "Counts newspaper coverage of policy uncertainty (taxes, trade, regulation, the Fed). It spikes around elections, shutdowns and crises." },
  { group: "fear", id: "GEPUCURRENT", title: "Global policy uncertainty", freq: "m", rel: true, fmt: v => v.toFixed(0),
    bands: [[0.8, "calm", "Quiet"], [1.3, "normal", "Normal"], [2, "elevated", "Elevated"], [Infinity, "high", "Very high"]],
    bandText: "Compared with its own 1-year average: <0.8× quiet · 0.8–1.3× normal · 1.3–2× elevated · >2×",
    explain: "The same idea, GDP-weighted across ~20 major economies — a gauge of global political and policy risk." },

  { group: "rates", id: "DFF", title: "Fed funds rate (effective)", freq: "d", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "The overnight rate the Fed steers. It anchors borrowing costs across the economy." },
  { group: "rates", id: "DGS2", title: "2-year Treasury yield", freq: "d", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "Reflects where markets expect the Fed's policy rate to average over the next two years." },
  { group: "rates", id: "DGS10", title: "10-year Treasury yield", freq: "d", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "The benchmark long-term rate. It drives mortgage rates and the value of long-dated assets, including stocks." },
  { group: "rates", id: "T10Y2Y", title: "Yield curve: 10Y minus 2Y", freq: "d", fmt: v => `${v.toFixed(2)} pts`,
    bands: [[0, "high", "Inverted"], [0.5, "elevated", "Flat"], [Infinity, "calm", "Normal slope"]],
    bandText: "Below 0 inverted (a classic recession warning) · 0–0.5 flat · above 0.5 normal",
    explain: "When short-term rates exceed long-term rates the curve is 'inverted' — it has preceded most US recessions, though with long, variable lags." },
  { group: "rates", id: "T10Y3M", title: "Yield curve: 10Y minus 3M", freq: "d", fmt: v => `${v.toFixed(2)} pts`,
    bands: [[0, "high", "Inverted"], [0.5, "elevated", "Flat"], [Infinity, "calm", "Normal slope"]],
    bandText: "Below 0 inverted · 0–0.5 flat · above 0.5 normal",
    explain: "The version of the curve the New York Fed's recession model uses. Inversion = markets expect rate cuts ahead." },
  { group: "rates", id: "DFII10", title: "10Y real yield (inflation-adjusted)", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[0, "calm", "Negative (loose)"], [1, "normal", "Low"], [2, "elevated", "Restrictive"], [Infinity, "high", "Very restrictive"]],
    bandText: "<0 loose · 0–1 low · 1–2 restrictive · >2 very restrictive",
    explain: "Yield after stripping out expected inflation. High real yields squeeze valuations and borrowers; negative ones are stimulative." },
  { group: "rates", id: "MORTGAGE30US", title: "30-year mortgage rate", freq: "w", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "What US home buyers actually pay (weekly, Freddie Mac). A direct read on rate pain for households." },

  { group: "inflation", id: "T10YIE", title: "10Y breakeven inflation", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[1.5, "normal", "Low expectations"], [2.5, "calm", "Anchored near 2%"], [3, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<1.5 low · 1.5–2.5 anchored · 2.5–3 elevated · >3 high",
    explain: "The inflation rate the bond market is pricing in over 10 years (Treasury yield minus TIPS yield)." },
  { group: "inflation", id: "T5YIFR", title: "5Y5Y forward inflation expectation", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[1.5, "normal", "Low expectations"], [2.5, "calm", "Anchored near 2%"], [3, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<1.5 low · 1.5–2.5 anchored · 2.5–3 elevated · >3 high",
    explain: "Expected inflation for the five years starting five years from now — the Fed's favorite check on whether expectations stay anchored." },
  { group: "inflation", id: "CPIAUCSL", title: "CPI inflation (YoY)", freq: "m", extra: { units: "pc1" }, fmt: v => `${v.toFixed(1)}%`,
    bands: [[2, "calm", "Low"], [3, "normal", "Near target"], [5, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<2 low · 2–3 near target · 3–5 elevated · >5 high",
    explain: "The headline change in consumer prices over the past 12 months." },
  { group: "inflation", id: "PCEPILFE", title: "Core PCE inflation (YoY)", freq: "m", extra: { units: "pc1" }, fmt: v => `${v.toFixed(1)}%`,
    bands: [[2, "calm", "Low"], [2.5, "normal", "Near target"], [3.5, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<2 low · 2–2.5 near target · 2.5–3.5 elevated · >3.5 high",
    explain: "The Fed's preferred inflation measure, excluding food and energy." },

  { group: "credit", id: "BAMLH0A0HYM2", title: "High-yield credit spread", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[3.5, "calm", "Tight (calm)"], [5, "normal", "Normal"], [8, "elevated", "Stressed"], [Infinity, "high", "Distress"]],
    bandText: "<3.5 tight · 3.5–5 normal · 5–8 stressed · >8 distress",
    explain: "The extra yield risky (junk) companies pay over Treasuries. It widens fast when lenders get scared." },
  { group: "credit", id: "BAMLC0A0CM", title: "Investment-grade credit spread", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[1.2, "calm", "Tight (calm)"], [1.8, "normal", "Normal"], [2.5, "elevated", "Stressed"], [Infinity, "high", "Distress"]],
    bandText: "<1.2 tight · 1.2–1.8 normal · 1.8–2.5 stressed · >2.5 distress",
    explain: "The extra yield safer corporate borrowers pay. Moves less than junk, so a rise here signals broad stress." },
  { group: "credit", id: "RECPROUSM156N", title: "US recession probability", freq: "m", fmt: v => `${v.toFixed(1)}%`,
    bands: [[10, "calm", "Low"], [30, "normal", "Moderate"], [50, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<10 low · 10–30 moderate · 30–50 elevated · >50 high",
    explain: "A model-based probability (smoothed, Chauvet–Piger) that the US economy is currently in recession. Published with a lag." },
  { group: "credit", id: "SAHMREALTIME", title: "Sahm Rule indicator", freq: "m", fmt: v => `${v.toFixed(2)} pts`,
    bands: [[0.3, "calm", "Calm"], [0.5, "elevated", "Approaching"], [Infinity, "high", "Triggered"]],
    bandText: "Rises toward 0.5 = the rule that has flagged the start of past recessions",
    explain: "Compares the recent unemployment rate with its 12-month low; a jump of 0.5+ points has coincided with past recessions." },

  { group: "fx", id: "DTWEXBGS", title: "US dollar index (broad)", freq: "d", fmt: v => v.toFixed(1), info: true,
    explain: "The dollar against a basket of trading partners. A strong dollar tightens conditions for emerging markets and dollar borrowers." },
  { group: "fx", id: "DCOILWTICO", title: "Crude oil (WTI, $/barrel)", freq: "d", fmt: v => `$${v.toFixed(2)}`, info: true,
    explain: "A key input cost and inflation driver; spikes usually follow supply shocks or geopolitical events." },
];

const RISK_LEVEL_LABEL = { calm: "Calm", normal: "Normal", elevated: "Elevated", high: "High", info: "" };
const riskState = { data: {}, loaded: false, loading: false, sort: { key: "infl", dir: -1 } };

function fredWindowParams(s) {
  const start = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  return { observation_start: start, limit: "500", ...(s.extra || {}) };
}

async function fetchRiskSeries(s) {
  const data = await fetchJSON(fredUrl(s.id, fredWindowParams(s)));
  const obs = (data.observations || []).map(o => ({ date: o.date, value: parseFloat(o.value) })).filter(o => isNum(o.value)); // desc
  if (!obs.length) return null;
  const asc = [...obs].reverse();
  const last = obs[0];
  const back = { d: 21, w: 4, m: 1 }[s.freq];
  const yr = { d: 252, w: 52, m: 12 }[s.freq];
  const prev = obs[Math.min(back, obs.length - 1)];
  const yearAgo = obs.length > yr ? obs[yr] : obs[obs.length - 1];
  const avg1y = asc.slice(-yr).reduce((sum, o) => sum + o.value, 0) / Math.min(yr, asc.length);
  return { last, prev, yearAgo, avg1y, asc };
}

function riskLevelFor(s, d) {
  if (s.info || !s.bands) return { level: "info", label: "" };
  const v = s.rel ? d.last.value / d.avg1y : d.last.value;
  const band = s.bands.find(b => v < b[0]) || s.bands[s.bands.length - 1];
  return { level: band[1], label: band[2] };
}

function riskCardHtml(s, d) {
  if (!d) return `<div class="risk-card level-info"><div class="risk-card-top"><span class="risk-title">${s.title}</span></div><p class="muted small">Couldn't load this series right now.</p></div>`;
  const { level, label } = riskLevelFor(s, d);
  const dt = new Date(`${d.last.date}T12:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const delta = (a, b) => (isNum(a) && isNum(b) ? `${a - b >= 0 ? "+" : "−"}${Math.abs(a - b).toFixed(Math.abs(a - b) < 10 ? 2 : 1)}` : "—");
  const unitLabel = { d: "vs ~1 month ago", w: "vs ~1 month ago", m: "vs last reading" }[s.freq];
  return `
    <div class="risk-card level-${level}">
      <div class="risk-card-top"><span class="risk-title">${s.title}</span>${label ? `<span class="risk-badge level-${level}">${label}</span>` : ""}</div>
      <div class="risk-value">${s.fmt(d.last.value)} <span class="risk-date">${dt}</span></div>
      <div class="risk-spark">${sparklineSvg(d.asc.slice(-140).map(o => o.value), { width: 240, height: 38, stroke: `var(--risk-${level === "info" ? "normal" : level})` })}</div>
      <div class="risk-delta small muted"><span>${delta(d.last.value, d.prev.value)} ${unitLabel}</span><span>${delta(d.last.value, d.yearAgo.value)} vs 1 year ago</span></div>
      <p class="risk-explain">${s.explain}</p>
      ${s.bandText ? `<p class="risk-bands small muted">${s.bandText}</p>` : ""}
      <a class="risk-src small" href="https://fred.stlouisfed.org/series/${s.id}" target="_blank" rel="noopener noreferrer">FRED · ${s.id} ↗</a>
    </div>`;
}

function renderRiskSummary() {
  const el = document.getElementById("riskSummary");
  if (!el) return;
  const gauges = RISK_SERIES.filter(s => !s.info && s.bands && riskState.data[s.id]);
  if (!gauges.length) { el.innerHTML = '<span class="muted small">Loading gauges…</span>'; return; }
  const levels = gauges.map(s => ({ s, ...riskLevelFor(s, riskState.data[s.id]) }));
  const hot = levels.filter(l => l.level === "elevated" || l.level === "high");
  el.innerHTML = `
    <div class="risk-strip" title="One square per gauge">${levels.map(l => `<i class="level-${l.level}" title="${l.s.title}: ${l.label}"></i>`).join("")}</div>
    <div class="risk-summary-text"><strong>${hot.length} of ${levels.length}</strong> gauges are elevated or high${hot.length ? ": " + hot.map(l => `<span class="risk-badge level-${l.level}">${l.s.title.split(" — ")[0].split(" (")[0]} · ${l.label}</span>`).join(" ") : " — conditions look calm on these measures."}</div>`;
}

async function renderRiskDashboard() {
  const root = document.getElementById("riskDashboard");
  if (!root) return;
  if (!root.dataset.built) {
    root.dataset.built = "1";
    root.innerHTML = `
      <div class="risk-summary" id="riskSummary"><span class="muted small">Loading gauges…</span></div>
      ${RISK_GROUPS.map(g => `
        <div class="risk-group">
          <div class="risk-group-head"><h4>${g.title}</h4><span class="muted small">${g.blurb}</span></div>
          <div class="risk-grid" data-group="${g.id}">${RISK_SERIES.filter(s => s.group === g.id).map(s => `<div class="risk-card level-info risk-skeleton" data-series="${s.id}"><div class="risk-card-top"><span class="risk-title">${s.title}</span></div><p class="muted small">Loading…</p></div>`).join("")}</div>
        </div>`).join("")}
      <div class="risk-group">
        <div class="risk-group-head"><h4>Country scoreboard</h4><span class="muted small">Inflation, growth, jobs, debt and stability across all tracked countries — World Bank, latest available year</span></div>
        <div id="riskScoreboard"><p class="muted small">Loading…</p></div>
      </div>
      <details class="risk-guide"><summary>How to read this dashboard</summary>
        <p>Each gauge shows the latest value, a one-year sparkline, how it has changed, and a colored reading based on <em>conventional rules of thumb</em> (the cutoffs are printed on every card). They are shorthand for “is this unusual?”, not predictions — a gauge can stay “elevated” for a long time, and crises rarely announce themselves.</p>
        <p><strong>Markets vs economy:</strong> this page is the fast-moving <em>markets</em> view (prices, spreads, volatility — updated daily). The Macro tab is the slower <em>economy</em> view (growth, jobs, inflation by country).</p>
        <p><strong>Coverage:</strong> the gauges are US-published (FRED); global coverage comes from the country scoreboard and the map's colour-by modes. Free data doesn't include the MOVE bond-volatility index, PMIs or credit-default-swap prices.</p>
      </details>`;
  }

  // Scoreboard uses the World Bank data the map already loads.
  ensureWorldData(["infl", "gdpg", "unemp", "debt", "cab", "polstab"]).then(renderScoreboard);

  const stale = !riskState.loaded || Date.now() - riskState.loaded > 30 * 60 * 1000;
  if (!stale || riskState.loading) { renderRiskSummary(); return; }
  riskState.loading = true;
  await Promise.allSettled(RISK_SERIES.map(async s => {
    let d = null;
    try { d = await fetchRiskSeries(s); } catch { d = null; }
    riskState.data[s.id] = d;
    const card = root.querySelector(`.risk-card[data-series="${s.id}"]`);
    if (card) card.outerHTML = riskCardHtml(s, d);
    renderRiskSummary();
  }));
  riskState.loading = false;
  riskState.loaded = Date.now();
}

// ---------------- country scoreboard ----------------
const SCORE_COLS = [
  { key: "infl", label: "Inflation" }, { key: "gdpg", label: "GDP growth" }, { key: "unemp", label: "Unemployment" },
  { key: "debt", label: "Govt debt / GDP" }, { key: "cab", label: "Current acct / GDP" }, { key: "polstab", label: "Political stability" },
];

function renderScoreboard() {
  const el = document.getElementById("riskScoreboard");
  if (!el) return;
  const rows = COUNTRIES.filter(c => c.iso3 !== "TWN").map(c => {
    const vals = {}; let flags = 0;
    SCORE_COLS.forEach(col => {
      const d = wbValue(col.key, c.iso3);
      vals[col.key] = d ? d.value : null;
      if (d && WB_BY_KEY[col.key].risk && WB_BY_KEY[col.key].risk(d.value) === "bad") flags++;
    });
    return { c, vals, flags };
  });

  const { key, dir } = riskState.sort;
  rows.sort((a, b) => {
    const av = key === "flags" ? a.flags : key === "name" ? a.c.name : a.vals[key];
    const bv = key === "flags" ? b.flags : key === "name" ? b.c.name : b.vals[key];
    if (av == null) return 1; if (bv == null) return -1;
    return key === "name" ? dir * String(av).localeCompare(String(bv)) : dir * (av - bv);
  });

  const top = (k, dirn, n = 3) => rows.filter(r => r.vals[k] != null).sort((a, b) => dirn * (a.vals[k] - b.vals[k])).slice(0, n)
    .map(r => `<button type="button" class="cp-chip" data-iso2="${r.c.iso2}">${r.c.flag} ${r.c.name} <b>${WB_BY_KEY[k].fmt(r.vals[k])}</b></button>`).join("");
  const spotlight = `
    <div class="score-spotlight">
      <div><span class="muted small">Highest inflation</span>${top("infl", -1)}</div>
      <div><span class="muted small">Highest debt / GDP</span>${top("debt", -1)}</div>
      <div><span class="muted small">Weakest growth</span>${top("gdpg", 1)}</div>
      <div><span class="muted small">Largest current-account deficits</span>${top("cab", 1)}</div>
    </div>`;

  const head = `<tr><th data-key="name">Country</th>${SCORE_COLS.map(col => `<th data-key="${col.key}">${col.label}</th>`).join("")}<th data-key="flags" title="Number of indicators in the red zone (rule-of-thumb)">Red flags</th></tr>`;
  const body = rows.map(r => `<tr data-iso2="${r.c.iso2}"><td>${r.c.flag} <strong>${r.c.name}</strong> <span class="ctag ctag-${r.c.group} ctag-mini">${r.c.group === "brics" ? "BRICS" : r.c.group === "developed" ? "DM" : r.c.group === "emerging" ? "EM" : "FM"}</span></td>${SCORE_COLS.map(col => {
    const v = r.vals[col.key]; const ind = WB_BY_KEY[col.key];
    return `<td class="${v == null ? "muted" : ""}">${v == null ? "—" : `${ind.risk ? `<i class="risk-dot risk-${ind.risk(v)}"></i>` : ""}${ind.fmt(v)}`}</td>`;
  }).join("")}<td>${r.flags ? `<span class="flag-count flag-${Math.min(r.flags, 3)}">${r.flags}</span>` : '<span class="muted">0</span>'}</td></tr>`).join("");

  el.innerHTML = `${spotlight}<div class="crypto-table-scroll"><table class="crypto-table quotes-table score-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>
    <p class="muted small">Dot colors are rule-of-thumb reads (e.g. inflation above 10%, debt above 100% of GDP, a current-account deficit wider than 6% of GDP). Click a row for the full country profile. Taiwan isn't covered by the World Bank.</p>`;
  el.querySelectorAll("thead th").forEach(th => {
    th.classList.add("sortable-th");
    th.addEventListener("click", () => {
      const k = th.dataset.key;
      riskState.sort = { key: k, dir: riskState.sort.key === k ? -riskState.sort.dir : (k === "name" ? 1 : -1) };
      renderScoreboard();
    });
  });
  el.querySelectorAll("tbody tr").forEach(tr => tr.addEventListener("click", () => selectCountry(tr.dataset.iso2, { scroll: true })));
  el.querySelectorAll(".score-spotlight [data-iso2]").forEach(b => b.addEventListener("click", () => selectCountry(b.dataset.iso2, { scroll: true })));
}
