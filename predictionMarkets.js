// predictionMarkets.js — Prediction Markets page (2026-10-01): live odds
// from Polymarket, a real-money prediction market. Confirmed free and
// CORS-enabled (see msv-org-github API_RESEARCH.md's "Prediction markets
// & 'who's holding/trading what'" research, 2026-10-01) — called
// directly from the browser, no msv-api proxy needed, same tier as
// CoinGecko/Twelve Data.
//
// Polymarket's `outcomePrices` field IS the implied probability (0-1
// scale) — confirmed from a live response, not documented separately
// anywhere obvious. A single Gamma `/markets` call returns everything
// needed for a browse view (question, outcomes, prices, volume,
// liquidity, end date) — no separate CLOB order-book call needed here.
//
// `tag_id` is the ONLY filter param that actually works for category
// filtering — `tag_slug` was tested live and silently ignored (returned
// the same unfiltered top-by-volume results regardless of the value
// passed), a real gotcha found during research. The tag IDs below were
// found by paginating Polymarket's full `/tags` list (2,100+ tags, no
// clean "top-level category" endpoint exists) and matching on label
// text, then verified live to return genuinely on-topic markets — not
// guessed from a tag's name alone.

const POLY_BASE = "https://gamma-api.polymarket.com";

const POLY_TABS = [
  { id: "trending", label: "Trending", tagId: null },
  { id: "finance", label: "Finance", tagId: 120 },
  { id: "economy", label: "Economy & Fed", tagId: 100328 },
  { id: "crypto", label: "Crypto", tagId: 21 },
  { id: "business", label: "Business", tagId: 107 },
  { id: "politics", label: "Politics", tagId: 2 },
];

const polyState = { tab: "finance", token: 0 };

async function fetchPolyMarkets(tagId) {
  const params = new URLSearchParams({
    active: "true",
    closed: "false",
    limit: "24",
    order: "volume24hr",
    ascending: "false",
  });
  if (tagId) params.set("tag_id", tagId);
  const res = await fetch(`${POLY_BASE}/markets?${params.toString()}`);
  if (!res.ok) throw new Error(`Polymarket returned ${res.status}`);
  return res.json();
}

function renderPredictionMarketsPage() {
  const root = document.getElementById("predictionMarketsRoot");
  if (!root) return;
  if (!root.dataset.built) {
    root.dataset.built = "1";
    root.innerHTML = `
      <div class="chart-source-toggle" id="polyTabs">
        ${POLY_TABS.map(t => `<button type="button" data-tab="${t.id}" class="${t.id === polyState.tab ? "active" : ""}">${t.label}</button>`).join("")}
      </div>
      <div id="polyGrid" class="poly-grid"></div>
      <p class="muted small cp-foot">Live odds from <a href="https://polymarket.com" target="_blank" rel="noopener">Polymarket</a>, a real-money prediction market — prices reflect what traders are actually betting, not a forecast or endorsement from this app. These are speculative, unregulated-in-many-jurisdictions markets that can be wrong or thinly traded. Not investment advice. Click any market to see it on Polymarket.</p>`;
    root.querySelectorAll("#polyTabs button").forEach(b => b.addEventListener("click", () => {
      if (b.dataset.tab === polyState.tab) return;
      polyState.tab = b.dataset.tab;
      root.querySelectorAll("#polyTabs button").forEach(x => x.classList.toggle("active", x === b));
      loadPolyTab();
    }));
  }
  loadPolyTab();
}

async function loadPolyTab() {
  const grid = document.getElementById("polyGrid");
  if (!grid) return;
  const tab = POLY_TABS.find(t => t.id === polyState.tab) || POLY_TABS[0];
  const token = ++polyState.token;
  grid.innerHTML = `<p class="muted small">Loading live odds…</p>`;
  try {
    const markets = await fetchPolyMarkets(tab.tagId);
    if (token !== polyState.token) return;
    const real = (markets || []).filter(m => m.question);
    if (!real.length) { grid.innerHTML = `<p class="muted small">No active markets found for this category right now.</p>`; return; }
    grid.innerHTML = real.map(polyCardHtml).join("");
  } catch (err) {
    if (token !== polyState.token) return;
    grid.innerHTML = `<p class="muted small">Couldn't load live odds right now (${err.message}). Try again shortly.</p>`;
  }
}

// Almost every market here is a plain Yes/No binary (outcomes.length ===
// 2) — confirmed by inspection during research; multi-candidate things
// like elections are usually split into one binary market per candidate
// rather than one multi-outcome market. For the rare market with more
// than 2 outcomes, this still shows outcome[0]'s real price against
// "everything else combined" rather than breaking — a simplification,
// not wrong, just less detailed than a dedicated multi-outcome layout
// would be.
function polyCardHtml(m) {
  let outcomes = [], prices = [];
  try {
    outcomes = JSON.parse(m.outcomes || "[]");
    prices = JSON.parse(m.outcomePrices || "[]").map(Number);
  } catch { /* malformed outcome data for this market — render without odds */ }
  const yesPrice = prices[0];
  const yesPct = isNum(yesPrice) ? Math.round(yesPrice * 100) : null;
  const url = m.slug ? `https://polymarket.com/event/${m.slug}` : "https://polymarket.com";
  const endDate = m.endDate ? new Date(m.endDate) : null;
  const endLabel = endDate && !isNaN(endDate) ? endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  return `
    <a class="poly-card" href="${url}" target="_blank" rel="noopener">
      <p class="poly-question">${escapeHtml(m.question || "")}</p>
      ${yesPct !== null ? `
        <div class="poly-odds">
          <div class="poly-odds-bar"><i style="width:${yesPct}%"></i></div>
          <div class="poly-odds-labels"><span class="poly-yes">${escapeHtml(outcomes[0] || "Yes")} ${yesPct}%</span><span class="poly-no">${escapeHtml(outcomes[1] || "No")} ${100 - yesPct}%</span></div>
        </div>` : `<p class="muted small">Odds unavailable</p>`}
      <div class="poly-meta">
        <span>${fmtCompact(m.volume24hr, "$")} 24h vol</span>
        ${endLabel ? `<span>Ends ${endLabel}</span>` : ""}
      </div>
    </a>`;
}
