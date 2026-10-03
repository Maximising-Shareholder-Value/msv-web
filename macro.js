// macro.js — the Macro tab: country-level economic indicators (FRED for
// the US, World Bank for everyone else). Extracted from home.js
// 2026-10-02 — every other comparably-sized feature in this codebase
// already lives in its own file (sectors.js, etfs.js, marketData.js,
// riskDashboard.js, ...); this ~425-line block had been growing inside
// home.js since 2026-09-21 instead, making that file the one outlier.
// Pure move, no logic changes. Loads before marketData.js (which calls
// fetchWorldBankIndicator()/reads WORLD_BANK_GOVERNANCE_INDICATORS at
// call time, inside its country-governance panel), and before home.js
// (whose ROUTES table and switchTab() call renderMacroTab() at call
// time, when the user actually opens the Macro tab).

// ---- Macro tab (FRED for the US, World Bank for everyone else) ----
// US stays on FRED deliberately — it's monthly/quarterly and far more
// current than World Bank's mostly-annual series, so switching the US
// itself over would be a real regression, not just a broader feature.
// World Bank only covers the other 4 default countries (pillar 4,
// 2026-09-21) — see .github (org repo) ROADMAP.md/TODO.md for the
// country/indicator decisions this was scoped against.
const MACRO_SERIES = [
  { id: "FEDFUNDS", label: "Fed Funds Rate", unit: "%", params: {} },
  { id: "CPIAUCSL", label: "Inflation (CPI, YoY)", unit: "%", params: { units: "pc1" } },
  { id: "UNRATE", label: "Unemployment Rate", unit: "%", params: {} },
  { id: "DGS10", label: "10-Year Treasury Yield", unit: "%", params: {} },
  // Added 2026-08-27 — same FRED key, only fetched when this tab is
  // opened (already lazy), so more indicators here don't add any
  // always-on cost, just more content when someone actually visits.
  { id: "MORTGAGE30US", label: "30-Year Mortgage Rate", unit: "%", params: {} },
  { id: "M2SL", label: "M2 Money Supply (YoY)", unit: "%", params: { units: "pc1" } },
  { id: "UMCSENT", label: "Consumer Sentiment", unit: "", params: {} },
  { id: "DCOILWTICO", label: "Crude Oil (WTI)", unit: "", prefix: "$", params: {} },
];

// Default country set decided 2026-09-21 (Jozsua picked "major global
// economies" over featuring his own footprint) — a full country picker
// for anywhere else is a later fast-follow, not this first pass.
const MACRO_COUNTRIES = [
  { iso3: "USA", label: "United States", flag: "🇺🇸", source: "fred" },
  { iso3: "CHN", label: "China", flag: "🇨🇳", source: "worldbank" },
  { iso3: "DEU", label: "Germany", flag: "🇩🇪", source: "worldbank" },
  { iso3: "JPN", label: "Japan", flag: "🇯🇵", source: "worldbank" },
  { iso3: "GBR", label: "United Kingdom", flag: "🇬🇧", source: "worldbank" },
];

// World Bank indicator codes. The original 4 (GDP growth/inflation/
// unemployment/current account) were chosen after live-testing several
// candidates: policy/lending interest rates (FR.INR.RINR, FR.INR.LEND)
// come back null for the US/UK/Germany/Japan in recent years (World
// Bank's own reporting gap for advanced economies, confirmed directly),
// so a rate indicator was swapped for current account balance instead.
//
// Split into two tiers (2026-09-24, pillar 4 expansion):
// - HOVER: small, shown in the world map's hover popup for all 13
//   tracked countries — kept short so the popup stays glanceable.
// - ECON/GOVERNANCE: the fuller set shown only in the Macro tab itself,
//   which isn't size-constrained the way a hover popup is.
// Governance codes are World Bank's Worldwide Governance Indicators
// (source database 3, not the default WDI database) — confirmed live
// 2026-09-24 for all 5 default countries. Note the real codes are
// prefixed `GOV_WGI_` (e.g. `GOV_WGI_CC.EST`) — the bare `CC.EST`/
// `PV.EST`/etc. codes sometimes seen referenced elsewhere don't exist in
// World Bank's default indicator catalog and return a real "not found"
// error if queried as-is; this was checked directly before shipping, not
// assumed. Never referenced or researched anywhere in this codebase
// before this pass — see the org's BLOCKERS.md/TODO.md for the trail.
const WORLD_BANK_HOVER_INDICATORS = [
  { id: "NY.GDP.MKTP.KD.ZG", label: "GDP Growth", unit: "%" },
  { id: "FP.CPI.TOTL.ZG", label: "Inflation (CPI, YoY)", unit: "%" },
  { id: "SL.UEM.TOTL.ZS", label: "Unemployment Rate", unit: "%" },
  { id: "BN.CAB.XOKA.GD.ZS", label: "Current Account Balance", unit: "% of GDP" },
  { id: "GOV_WGI_PV.EST", label: "Political Stability", unit: "" },
];
const WORLD_BANK_ECON_INDICATORS = [
  { id: "NY.GDP.MKTP.KD.ZG", label: "GDP Growth", unit: "%" },
  { id: "FP.CPI.TOTL.ZG", label: "Inflation (CPI, YoY)", unit: "%" },
  { id: "SL.UEM.TOTL.ZS", label: "Unemployment Rate", unit: "%" },
  { id: "BN.CAB.XOKA.GD.ZS", label: "Current Account Balance", unit: "% of GDP" },
  { id: "NY.GDP.PCAP.CD", label: "GDP per Capita", formatter: v => formatCompactUsd(v) },
  { id: "NE.RSB.GNFS.ZS", label: "Trade Balance", unit: "% of GDP" },
  { id: "GC.DOD.TOTL.GD.ZS", label: "Government Debt", unit: "% of GDP" },
  { id: "FI.RES.TOTL.CD", label: "Total Reserves", formatter: v => formatCompactUsd(v) },
  { id: "SP.POP.TOTL", label: "Population", formatter: v => v.toLocaleString() },
];
const WORLD_BANK_GOVERNANCE_INDICATORS = [
  { id: "GOV_WGI_VA.EST", label: "Voice & Accountability", unit: "" },
  { id: "GOV_WGI_PV.EST", label: "Political Stability", unit: "" },
  { id: "GOV_WGI_GE.EST", label: "Government Effectiveness", unit: "" },
  { id: "GOV_WGI_RQ.EST", label: "Regulatory Quality", unit: "" },
  { id: "GOV_WGI_RL.EST", label: "Rule of Law", unit: "" },
  { id: "GOV_WGI_CC.EST", label: "Control of Corruption", unit: "" },
];

function worldBankUrl(indicatorId, countryIso3) {
  logApiCall("worldbank");
  const search = new URLSearchParams({
    path: `/country/${countryIso3}/indicator/${indicatorId}`,
    format: "json",
    per_page: "6", // a few years back, in case the latest is null
  });
  return `${API_BASE_URL}/api/worldbank?${search.toString()}`;
}

// Figures are annual, so "as of" means the most recent year World Bank
// has a real (non-null) value for, not necessarily this year — picks the
// first non-null entry from a small recent-years page rather than
// assuming the latest year is populated.
async function fetchWorldBankIndicator(ind, countryIso3) {
  const data = await fetchJSON(worldBankUrl(ind.id, countryIso3));
  const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
  const latest = rows.find(row => isNum(row.value));
  return latest ? { value: latest.value, date: latest.date } : { value: null, date: null };
}

// One-time fetch of every country World Bank tracks (confirmed ~295 rows,
// most of which are real countries; aggregate/region/income-group rows
// carry region.value === "Aggregates" and are filtered out — confirmed
// directly against a live response before shipping). Powers the Macro
// tab's free-text search, which sits alongside the 5 "Featured" quick
// picks rather than replacing them.
let worldBankCountryListPromise = null;
function fetchWorldBankCountryList() {
  if (!worldBankCountryListPromise) {
    logApiCall("worldbank");
    const search = new URLSearchParams({ path: "/country", format: "json", per_page: "320" });
    worldBankCountryListPromise = fetchJSON(`${API_BASE_URL}/api/worldbank?${search.toString()}`)
      .then(data => {
        const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
        return rows
          .filter(c => c.region && c.region.value !== "Aggregates")
          .map(c => ({ iso3: c.id, name: c.name }));
      })
      .catch(() => []);
  }
  return worldBankCountryListPromise;
}

// A country picked via the free-text search only carries {iso3, name} —
// no flag, and MACRO_COUNTRIES doesn't know about it. This small cache
// remembers a display flag/label for any country this session has shown,
// so compare-mode chips and table headers always have something sensible
// to show regardless of how the country was picked.
function recordCountryInfo(iso3, label, flag) {
  homeState.countryInfoCache[iso3] = { label, flag: flag || "🌐" };
}
function lookupCountryInfo(iso3) {
  if (homeState.countryInfoCache[iso3]) return homeState.countryInfoCache[iso3];
  const known = MACRO_COUNTRIES.find(c => c.iso3 === iso3);
  if (known) return { label: known.label, flag: known.flag };
  return { label: iso3, flag: "🌐" };
}

// The country currently driving the single-country view — a free-text
// search pick (homeState.macroCustomCountry) takes priority over the 5
// quick-pick defaults. US is always FRED-backed regardless of how it was
// selected (matches the existing MACRO_COUNTRIES entry for consistency).
function getActiveMacroCountry() {
  if (homeState.macroCustomCountry) {
    const c = homeState.macroCustomCountry;
    return { iso3: c.iso3, label: c.name, flag: "🌐", source: c.iso3 === "USA" ? "fred" : "worldbank" };
  }
  return MACRO_COUNTRIES.find(c => c.iso3 === homeState.macroCountry) || MACRO_COUNTRIES[0];
}

function toggleMacroCompareCountry(iso3, name, flag) {
  const idx = homeState.macroCompareCountries.indexOf(iso3);
  if (idx >= 0) {
    homeState.macroCompareCountries.splice(idx, 1);
  } else {
    if (homeState.macroCompareCountries.length >= 4) return; // same cap as the Compare feature
    homeState.macroCompareCountries.push(iso3);
    const known = MACRO_COUNTRIES.find(c => c.iso3 === iso3);
    recordCountryInfo(iso3, name || known?.label || iso3, flag || known?.flag);
  }
  renderMacroTab();
}

// Builds the shared controls block (quick picks + search + compare
// toggle + compare chips) — appended at the top of every macro render,
// single-country or comparison alike.
function buildMacroControls() {
  const wrap = document.createElement("div");
  wrap.className = "macro-controls";

  const pickerRow = document.createElement("div");
  pickerRow.className = "macro-country-picker";
  MACRO_COUNTRIES.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";
    const active = homeState.macroCompareMode
      ? homeState.macroCompareCountries.includes(c.iso3)
      : (!homeState.macroCustomCountry && homeState.macroCountry === c.iso3);
    btn.className = "macro-country-btn" + (active ? " active" : "");
    btn.textContent = `${c.flag} ${c.label}`;
    btn.addEventListener("click", () => {
      if (homeState.macroCompareMode) {
        toggleMacroCompareCountry(c.iso3, c.label, c.flag);
      } else {
        if (!homeState.macroCustomCountry && homeState.macroCountry === c.iso3) return;
        homeState.macroCustomCountry = null;
        homeState.macroCountry = c.iso3;
        renderMacroTab();
      }
    });
    pickerRow.appendChild(btn);
  });
  wrap.appendChild(pickerRow);

  const searchWrap = document.createElement("div");
  searchWrap.className = "macro-search-wrap";
  searchWrap.innerHTML = `
    <input type="text" class="macro-country-search" id="macroCountrySearch" placeholder="Search any other country (World Bank covers ~200)..." autocomplete="off">
    <div class="macro-country-suggestions hidden" id="macroCountrySuggestions"></div>
  `;
  wrap.appendChild(searchWrap);

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "options-toggle macro-compare-toggle";
  toggleLabel.innerHTML = `<input type="checkbox" id="macroCompareToggle" ${homeState.macroCompareMode ? "checked" : ""}> Compare countries side by side (up to 4)`;
  wrap.appendChild(toggleLabel);

  if (homeState.macroCompareMode && homeState.macroCompareCountries.length > 0) {
    const chipsRow = document.createElement("div");
    chipsRow.className = "macro-compare-chips";
    chipsRow.innerHTML = homeState.macroCompareCountries.map(iso3 => {
      const info = lookupCountryInfo(iso3);
      return `<span class="macro-compare-chip">${info.flag} ${info.label}<button type="button" class="macro-compare-chip-remove" data-iso3="${iso3}" aria-label="Remove ${info.label}">×</button></span>`;
    }).join("");
    wrap.appendChild(chipsRow);
    wrap.querySelectorAll(".macro-compare-chip-remove").forEach(btn => {
      btn.addEventListener("click", () => toggleMacroCompareCountry(btn.dataset.iso3));
    });
  }

  const searchInput = searchWrap.querySelector("#macroCountrySearch");
  const suggestionsBox = searchWrap.querySelector("#macroCountrySuggestions");
  let searchDebounce = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) { suggestionsBox.classList.add("hidden"); suggestionsBox.innerHTML = ""; return; }
    searchDebounce = setTimeout(async () => {
      const list = await fetchWorldBankCountryList();
      // The debounce/fetch above can resolve after renderMacroTab() has
      // already torn down and rebuilt these controls (e.g. the loading
      // state finished, or a country switch re-rendered) — writing into a
      // detached suggestionsBox would be invisible and silently do
      // nothing useful. Bail if this instance is no longer in the page.
      if (!document.body.contains(suggestionsBox)) return;
      const matches = list.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8);
      if (matches.length === 0) {
        suggestionsBox.innerHTML = '<p class="muted small" style="padding:8px 10px;margin:0;">No matches.</p>';
        suggestionsBox.classList.remove("hidden");
        return;
      }
      suggestionsBox.innerHTML = matches.map(c => `<button type="button" class="macro-country-suggestion" data-iso3="${c.iso3}" data-name="${c.name}">${c.name}</button>`).join("");
      suggestionsBox.classList.remove("hidden");
      suggestionsBox.querySelectorAll(".macro-country-suggestion").forEach(btn => {
        btn.addEventListener("click", () => {
          searchInput.value = "";
          suggestionsBox.classList.add("hidden");
          suggestionsBox.innerHTML = "";
          if (homeState.macroCompareMode) {
            toggleMacroCompareCountry(btn.dataset.iso3, btn.dataset.name);
          } else {
            homeState.macroCustomCountry = { iso3: btn.dataset.iso3, name: btn.dataset.name };
            renderMacroTab();
          }
        });
      });
    }, 300);
  });

  wrap.querySelector("#macroCompareToggle").addEventListener("change", e => {
    homeState.macroCompareMode = e.target.checked;
    if (homeState.macroCompareMode && homeState.macroCompareCountries.length === 0) {
      const current = getActiveMacroCountry();
      homeState.macroCompareCountries = [current.iso3];
      recordCountryInfo(current.iso3, current.label, current.flag);
    }
    renderMacroTab();
  });

  return wrap;
}

function buildIndicatorCard(label, value, unit, prefix, dateLabel, formatter) {
  const card = document.createElement("div");
  card.className = "indicator";
  const labelEl = document.createElement("div");
  labelEl.className = "indicator-label";
  labelEl.textContent = label;
  const valueEl = document.createElement("div");
  valueEl.className = "indicator-value";
  card.appendChild(labelEl);
  if (isNum(value)) {
    valueEl.textContent = formatter ? formatter(value) : `${prefix || ""}${value.toFixed(2)}${unit || ""}`;
    card.appendChild(valueEl);
    const dateNote = document.createElement("div");
    dateNote.className = "macro-date";
    dateNote.textContent = `As of ${dateLabel}`;
    card.appendChild(dateNote);
  } else {
    valueEl.textContent = "N/A";
    card.appendChild(valueEl);
  }
  return card;
}

function buildIndicatorGrid(indicators, results) {
  const grid = document.createElement("div");
  grid.className = "grid macro-grid";
  results.forEach((r, i) => {
    const ind = indicators[i];
    const ok = r.status === "fulfilled" && isNum(r.value.value);
    grid.appendChild(buildIndicatorCard(ind.label, ok ? r.value.value : null, ind.unit, ind.prefix, ok ? r.value.date : null, ind.formatter));
  });
  return grid;
}

async function renderMacroTab() {
  const myToken = ++homeState.macroRenderToken;
  homeContentEl.innerHTML = "";
  homeContentEl.appendChild(buildMacroControls());
  const loading = document.createElement("p");
  loading.className = "muted";
  loading.textContent = "Loading...";
  homeContentEl.appendChild(loading);

  if (homeState.macroCompareMode) {
    await renderMacroCompareView(myToken);
    return;
  }

  const country = getActiveMacroCountry();

  if (country.source === "fred") {
    if (typeof FRED_API_KEY === "undefined" || !FRED_API_KEY || FRED_API_KEY === "YOUR_FRED_KEY_HERE") {
      loading.textContent = "Add a free FRED API key to config.js to enable this tab (Fed funds rate, inflation, unemployment, 10-year treasury yield). See README.md.";
      return;
    }

    const results = await Promise.allSettled(MACRO_SERIES.map(async series => {
      const data = await fetchJSON(fredUrl(series.id, series.params));
      const obs = data.observations && data.observations[0];
      return { value: obs ? parseFloat(obs.value) : null, date: obs ? obs.date : null };
    }));
    if (myToken !== homeState.macroRenderToken) return; // switched away while this was in flight

    homeContentEl.innerHTML = "";
    homeContentEl.appendChild(buildMacroControls());
    homeContentEl.appendChild(buildIndicatorGrid(MACRO_SERIES, results));

    const note = document.createElement("p");
    note.className = "muted small home-note";
    note.textContent = "US economic indicators from the Federal Reserve (FRED). These update monthly or quarterly, not daily — don't expect them to move on every visit.";
    homeContentEl.appendChild(note);
    return;
  }

  // World Bank path — genuinely free, no key needed (see .github repo's
  // API_RESEARCH.md). Economic and Governance indicators fetched in
  // parallel, shown as two separate grids.
  const [econResults, govResults] = await Promise.all([
    Promise.allSettled(WORLD_BANK_ECON_INDICATORS.map(ind => fetchWorldBankIndicator(ind, country.iso3))),
    Promise.allSettled(WORLD_BANK_GOVERNANCE_INDICATORS.map(ind => fetchWorldBankIndicator(ind, country.iso3))),
  ]);
  if (myToken !== homeState.macroRenderToken) return;

  homeContentEl.innerHTML = "";
  homeContentEl.appendChild(buildMacroControls());
  homeContentEl.appendChild(buildIndicatorGrid(WORLD_BANK_ECON_INDICATORS, econResults));

  const govHeading = document.createElement("h4");
  govHeading.className = "supply-chain-section-title macro-governance-title";
  govHeading.innerHTML = `Governance <span class="card-subtitle">World Bank Worldwide Governance Indicators — roughly -2.5 (weak) to +2.5 (strong)</span>`;
  homeContentEl.appendChild(govHeading);
  homeContentEl.appendChild(buildIndicatorGrid(WORLD_BANK_GOVERNANCE_INDICATORS, govResults));

  const note = document.createElement("p");
  note.className = "muted small home-note";
  note.textContent = `${country.label}'s economic and governance indicators from the World Bank. These are annual figures, not monthly like the US/FRED tab — "as of" the most recent year with real data, which can lag a year or more.`;
  homeContentEl.appendChild(note);
}

// Economic indicators only (not Governance) — keeps the comparison table
// a manageable width; the fuller governance breakdown stays a
// single-country feature for now (noted in TODO.md as a possible
// fast-follow, not built this round).
async function renderMacroCompareView(myToken) {
  const countries = homeState.macroCompareCountries;
  if (countries.length === 0) {
    homeContentEl.innerHTML = "";
    homeContentEl.appendChild(buildMacroControls());
    homeContentEl.appendChild(Object.assign(document.createElement("p"), { className: "muted", textContent: "Pick up to 4 countries above to compare them side by side." }));
    return;
  }

  const perCountry = await Promise.all(countries.map(async iso3 => ({
    iso3,
    results: await Promise.allSettled(WORLD_BANK_ECON_INDICATORS.map(ind => fetchWorldBankIndicator(ind, iso3))),
  })));
  if (myToken !== homeState.macroRenderToken) return;

  const table = document.createElement("table");
  table.className = "macro-compare-table";
  table.innerHTML = `<thead><tr><th>Indicator</th>${countries.map(iso3 => {
    const info = lookupCountryInfo(iso3);
    return `<th>${info.flag} ${info.label}</th>`;
  }).join("")}</tr></thead>`;

  const tbody = document.createElement("tbody");
  WORLD_BANK_ECON_INDICATORS.forEach((ind, i) => {
    const row = document.createElement("tr");
    const cells = perCountry.map(pc => {
      const r = pc.results[i];
      const ok = r.status === "fulfilled" && isNum(r.value.value);
      const text = ok ? (ind.formatter ? ind.formatter(r.value.value) : `${ind.prefix || ""}${r.value.value.toFixed(2)}${ind.unit || ""}`) : "N/A";
      return `<td>${text}</td>`;
    }).join("");
    row.innerHTML = `<td class="macro-compare-label">${ind.label}</td>${cells}`;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  const scroll = document.createElement("div");
  scroll.className = "macro-compare-table-scroll";
  scroll.appendChild(table);

  homeContentEl.innerHTML = "";
  homeContentEl.appendChild(buildMacroControls());
  homeContentEl.appendChild(scroll);
  homeContentEl.appendChild(Object.assign(document.createElement("p"), {
    className: "muted small home-note",
    textContent: "Economic indicators from the World Bank, side by side. Governance indicators (Voice & Accountability, Political Stability, etc.) are shown in the single-country view.",
  }));
}
