// crypto.js — the Crypto page (2026-09-27), rebuilt from the old 6-coin table
// into a full crypto dashboard. Everything here is free and live-checked:
//
// - CoinGecko (via the msv-api proxy): /global market stats, the top-100
//   coins table (multi-period % changes + 7-day sparklines in ONE request),
//   /search/trending, /coins/categories, and per-coin /coins/{id} +
//   /market_chart for the detail panel. (CoinGecko's free plan no longer
//   returns developer/community stats, so those aren't shown.)
// - alternative.me: the Crypto Fear & Greed Index (public, CORS-enabled).
// - DefiLlama: DeFi total-value-locked by blockchain and the stablecoin
//   market (public, CORS-enabled, no key).
// - Finnhub: live quotes for crypto ETFs and crypto-related stocks.
//
// Not financial advice; crypto is volatile and largely unregulated. Nothing
// here is a forecast.

const cryptoState = { rows: [], sort: { key: "market_cap_rank", dir: 1 }, pageSize: 25, query: "", selected: null, loaded: false, range: 90 };

// Built on demand: CRYPTO_COINGECKO_IDS lives in home.js, which loads after this file.
const cgTickerFor = id => Object.keys(CRYPTO_COINGECKO_IDS).find(sym => CRYPTO_COINGECKO_IDS[sym] === id);

const stripHtml = html => { try { return new DOMParser().parseFromString(html || "", "text/html").body.textContent.trim(); } catch { return ""; } };
const cgMoney = v => (isNum(v) ? (v >= 1 ? `$${v.toLocaleString(undefined, { maximumFractionDigits: v >= 100 ? 2 : 4 })}` : `$${v.toPrecision(3)}`) : "—");

function renderCryptoPage() {
  const root = document.getElementById("cryptoRoot");
  if (!root) return;
  if (!root.dataset.built) {
    root.dataset.built = "1";
    root.innerHTML = `
      <div class="cr-strip" id="crStrip"><span class="muted small">Loading market overview…</span></div>
      <div class="cr-row2">
        <div class="cr-box" id="crFear"><h4>Fear &amp; Greed</h4><p class="muted small">Loading…</p></div>
        <div class="cr-box" id="crTrending"><h4>Trending now</h4><p class="muted small">Loading…</p></div>
      </div>
      <div class="cr-table-head">
        <h3>Top coins <span class="card-subtitle">live, by market cap · click a column to sort · click a coin for its full profile</span></h3>
        <div class="cr-controls">
          <input type="search" class="cd-search" id="crSearch" placeholder="Search coins…" autocomplete="off">
          <div class="cd-chips" id="crSize">${[25, 50, 100].map(n => `<button type="button" data-n="${n}" class="${n === cryptoState.pageSize ? "active" : ""}">Top ${n}</button>`).join("")}</div>
        </div>
      </div>
      <div id="crTable"><p class="muted small">Loading coins…</p></div>
      <div class="card-inner hidden" id="crCoinPanelWrap"><div id="crCoinPanel"></div></div>
      <div class="cr-grid2">
        <div class="cr-box" id="crCategories"><h4>Crypto sectors <span class="card-subtitle">CoinGecko categories, by market cap — they overlap (one coin can sit in several)</span></h4><p class="muted small">Loading…</p></div>
        <div class="cr-box" id="crDefi"><h4>DeFi: value locked by blockchain <span class="card-subtitle">DefiLlama · total value locked (TVL)</span></h4><p class="muted small">Loading…</p></div>
      </div>
      <div class="cr-box" id="crStable"><h4>Stablecoins <span class="card-subtitle">DefiLlama · dollar-pegged tokens — the "cash" of crypto</span></h4><p class="muted small">Loading…</p></div>
      <div class="cr-box" id="crTradfi"><h4>Crypto in traditional markets <span class="card-subtitle">live quotes — spot ETFs, and stocks tied to crypto</span></h4><div id="crTradfiBody"></div></div>
      <div class="cr-box" id="crEdu"></div>`;
    document.getElementById("crSearch").addEventListener("input", e => { cryptoState.query = e.target.value; paintCryptoTable(); });
    document.querySelectorAll("#crSize button").forEach(b => b.addEventListener("click", () => {
      cryptoState.pageSize = Number(b.dataset.n);
      document.querySelectorAll("#crSize button").forEach(x => x.classList.toggle("active", x === b));
      paintCryptoTable();
    }));
    renderCryptoEdu();
  }
  if (cryptoState.loaded) return;
  cryptoState.loaded = true;
  loadCryptoGlobal(); loadCryptoFear(); loadCryptoTrending(); loadCryptoCoins(); loadCryptoCategories(); loadCryptoDefi(); loadCryptoStable(); loadCryptoTradfi();
}

// ---------------- market overview strip ----------------
async function loadCryptoGlobal() {
  const el = document.getElementById("crStrip");
  try {
    const d = (await fetchJSON(coingeckoUrl("/global"))).data;
    const chg = d.market_cap_change_percentage_24h_usd;
    const cell = (label, value, sub) => `<div class="cr-stat"><span>${label}</span><strong>${value}</strong>${sub ? `<em>${sub}</em>` : ""}</div>`;
    el.innerHTML = `
      ${cell("Total market cap", fmtCompact(d.total_market_cap.usd, "$"), `<b class="${changeClass(chg)}">${fmtPctVal(chg)}</b> 24h`)}
      ${cell("24h volume", fmtCompact(d.total_volume.usd, "$"), "all coins")}
      ${cell("Bitcoin dominance", `${d.market_cap_percentage.btc.toFixed(1)}%`, "share of total market cap")}
      ${cell("Ethereum dominance", `${d.market_cap_percentage.eth.toFixed(1)}%`, "")}
      ${cell("Active coins", d.active_cryptocurrencies.toLocaleString(), `${d.markets.toLocaleString()} markets`)}`;
  } catch { el.innerHTML = '<span class="muted small">Couldn\'t load the market overview right now (CoinGecko rate limit) — try again in a minute.</span>'; }
}

// ---------------- fear & greed ----------------
async function loadCryptoFear() {
  const el = document.getElementById("crFear");
  try {
    const data = (await (await fetch("https://api.alternative.me/fng/?limit=31")).json()).data;
    const now = Number(data[0].value);
    const seg = [[25, "#dc2626"], [45, "#f97316"], [55, "#eab308"], [75, "#84cc16"], [100, "#16a34a"]];
    // half-circle gauge: 0 (left) .. 100 (right)
    const polar = (v, r) => { const a = Math.PI * (1 - v / 100); return [110 + r * Math.cos(a), 110 - r * Math.sin(a)]; };
    let prev = 0;
    const arcs = seg.map(([to, color]) => { const [x1, y1] = polar(prev, 90), [x2, y2] = polar(to, 90); const d = `M${x1.toFixed(1)},${y1.toFixed(1)} A90,90 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`; prev = to; return `<path d="${d}" stroke="${color}" stroke-width="16" fill="none"/>`; }).join("");
    const [nx, ny] = polar(now, 74);
    const at = i => (data[i] ? `${data[i].value} <span class="muted">${data[i].value_classification}</span>` : "—");
    el.innerHTML = `<h4>Fear &amp; Greed <span class="card-subtitle">alternative.me · 0 = extreme fear, 100 = extreme greed</span></h4>
      <div class="cr-fear">
        <svg viewBox="0 0 220 128" class="cr-gauge">${arcs}<line x1="110" y1="110" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round"/><circle cx="110" cy="110" r="6" fill="var(--text-primary)"/><text x="110" y="100" text-anchor="middle" class="cr-gauge-num">${now}</text></svg>
        <div class="cr-fear-side"><strong class="cr-fear-label">${data[0].value_classification}</strong>
          <div class="cr-fear-rows"><span>Yesterday</span><b>${at(1)}</b><span>Last week</span><b>${at(7)}</b><span>Last month</span><b>${at(30)}</b></div>
          ${sparklineSvg(data.map(x => Number(x.value)).reverse(), { width: 160, height: 34, stroke: "var(--accent)" })}<div class="muted small">30-day history</div></div>
      </div>
      <p class="muted small">A composite of volatility, momentum, social media, dominance and trends. Extreme readings have often — not always — marked short-term turning points.</p>`;
  } catch { el.innerHTML = '<h4>Fear &amp; Greed</h4><p class="muted small">Couldn\'t load the index right now.</p>'; }
}

async function loadCryptoTrending() {
  const el = document.getElementById("crTrending");
  try {
    const d = await fetchJSON(coingeckoUrl("/search/trending"));
    const coins = (d.coins || []).slice(0, 7).map(c => c.item);
    el.innerHTML = `<h4>Trending now <span class="card-subtitle">most searched on CoinGecko in the last 24h</span></h4>
      <div class="cr-trend">${coins.map((c, i) => { const p = c.data && c.data.price_change_percentage_24h && c.data.price_change_percentage_24h.usd; return `<button type="button" class="cr-trend-row" data-id="${c.id}"><span class="cr-rank">${i + 1}</span><img src="${c.thumb}" alt="" width="22" height="22"><span class="cr-trend-name"><strong>${c.name}</strong><span class="muted">${c.symbol}${c.market_cap_rank ? ` · #${c.market_cap_rank}` : ""}</span></span><span class="${changeClass(p)}">${isNum(p) ? fmtPctVal(p, 1) : ""}</span></button>`; }).join("")}</div>`;
    el.querySelectorAll(".cr-trend-row").forEach(b => b.addEventListener("click", () => openCoin(b.dataset.id)));
  } catch { el.innerHTML = '<h4>Trending now</h4><p class="muted small">Couldn\'t load trending coins right now.</p>'; }
}

// ---------------- coins table ----------------
const CR_COLS = [
  { key: "market_cap_rank", label: "#", get: r => r.market_cap_rank },
  { key: "name", label: "Coin", get: r => r.name, text: true },
  { key: "current_price", label: "Price", get: r => r.current_price },
  { key: "h1", label: "1h", get: r => r.price_change_percentage_1h_in_currency, pct: true },
  { key: "h24", label: "24h", get: r => r.price_change_percentage_24h_in_currency ?? r.price_change_percentage_24h, pct: true },
  { key: "d7", label: "7d", get: r => r.price_change_percentage_7d_in_currency, pct: true },
  { key: "d30", label: "30d", get: r => r.price_change_percentage_30d_in_currency, pct: true },
  { key: "y1", label: "1y", get: r => r.price_change_percentage_1y_in_currency, pct: true },
  { key: "market_cap", label: "Market cap", get: r => r.market_cap },
  { key: "total_volume", label: "24h volume", get: r => r.total_volume },
  { key: "vm", label: "Vol / cap", get: r => (r.market_cap ? r.total_volume / r.market_cap : null) },
  { key: "supply", label: "Circulating", get: r => (r.max_supply ? r.circulating_supply / r.max_supply : null) },
  { key: "ath", label: "From ATH", get: r => r.ath_change_percentage, pct: true },
  { key: "spark", label: "7d chart", get: () => null, nosort: true },
];

async function loadCryptoCoins() {
  try {
    const data = await fetchJSON(coingeckoUrl("/coins/markets", { vs_currency: "usd", order: "market_cap_desc", per_page: "100", page: "1", sparkline: "true", price_change_percentage: "1h,24h,7d,30d,1y" }));
    cryptoState.rows = Array.isArray(data) ? data : [];
    paintCryptoTable();
  } catch { document.getElementById("crTable").innerHTML = '<p class="muted small">Couldn\'t load coins right now (CoinGecko\'s free tier is rate-limited) — try again in a minute.</p>'; }
}

function paintCryptoTable() {
  const el = document.getElementById("crTable");
  if (!el) return;
  if (!cryptoState.rows.length) return;
  const q = cryptoState.query.trim().toLowerCase();
  const col = CR_COLS.find(c => c.key === cryptoState.sort.key) || CR_COLS[0];
  let rows = cryptoState.rows.slice(0, cryptoState.pageSize);
  if (q) rows = cryptoState.rows.filter(r => `${r.name} ${r.symbol}`.toLowerCase().includes(q)).slice(0, 100);
  rows = [...rows].sort((a, b) => { const av = col.get(a), bv = col.get(b); if (av == null) return 1; if (bv == null) return -1; return col.text ? cryptoState.sort.dir * String(av).localeCompare(String(bv)) : cryptoState.sort.dir * (av - bv); });
  const pct = v => (isNum(v) ? `<td class="${changeClass(v)}">${v >= 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(v > 100 || v < -100 ? 0 : 1)}%</td>` : '<td class="muted">—</td>');
  el.innerHTML = `<div class="crypto-table-scroll"><table class="crypto-table quotes-table cr-table"><thead><tr>${CR_COLS.map(c => `<th data-key="${c.key}" class="${c.nosort ? "" : "sortable-th"}${c.key === cryptoState.sort.key ? " sorted" : ""}">${c.label}${c.key === cryptoState.sort.key ? (cryptoState.sort.dir === 1 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr></thead><tbody>${rows.map(r => {
    const vm = r.market_cap ? r.total_volume / r.market_cap : null;
    const sup = r.max_supply ? r.circulating_supply / r.max_supply : null;
    return `<tr class="crypto-table-row${cryptoState.selected === r.id ? " selected-row" : ""}" data-id="${r.id}">
      <td class="muted">${r.market_cap_rank ?? ""}</td>
      <td><span class="cr-coin"><img src="${r.image}" alt="" width="20" height="20" loading="lazy"><strong>${r.name}</strong><span class="muted small">${r.symbol.toUpperCase()}</span></span></td>
      <td>${cgMoney(r.current_price)}</td>
      ${pct(r.price_change_percentage_1h_in_currency)}${pct(r.price_change_percentage_24h_in_currency ?? r.price_change_percentage_24h)}${pct(r.price_change_percentage_7d_in_currency)}${pct(r.price_change_percentage_30d_in_currency)}${pct(r.price_change_percentage_1y_in_currency)}
      <td>${fmtCompact(r.market_cap, "$")}</td><td>${fmtCompact(r.total_volume, "$")}</td>
      <td class="${vm !== null && vm > 0.3 ? "" : "muted"}">${vm !== null ? `${(vm * 100).toFixed(1)}%` : "—"}</td>
      <td>${sup !== null ? `<span class="cr-supply" title="${(sup * 100).toFixed(0)}% of max supply in circulation"><i style="width:${Math.min(100, sup * 100)}%"></i></span>` : '<span class="muted small">no cap</span>'}</td>
      ${pct(r.ath_change_percentage)}
      <td class="cr-spark">${r.sparkline_in_7d ? sparklineSvg(r.sparkline_in_7d.price.filter((_, i) => i % 3 === 0), { width: 110, height: 28 }) : ""}</td></tr>`;
  }).join("")}</tbody></table></div>
  <p class="muted small">Vol / cap = how much of the coin's value traded in 24h (high = very active). Circulating bar = supply issued so far as a share of the maximum (none = no fixed cap). From ATH = distance below the all-time high.</p>`;
  el.querySelectorAll("thead th.sortable-th").forEach(th => th.addEventListener("click", () => {
    const k = th.dataset.key;
    cryptoState.sort = { key: k, dir: cryptoState.sort.key === k ? -cryptoState.sort.dir : (k === "name" || k === "market_cap_rank" ? 1 : -1) };
    paintCryptoTable();
  }));
  el.querySelectorAll("tbody tr").forEach(tr => tr.addEventListener("click", () => openCoin(tr.dataset.id)));
}

// ---------------- coin detail ----------------
async function openCoin(id) {
  cryptoState.selected = id;
  paintCryptoTable();
  const wrap = document.getElementById("crCoinPanelWrap");
  const el = document.getElementById("crCoinPanel");
  wrap.classList.remove("hidden");
  el.innerHTML = '<p class="muted">Loading coin profile…</p>';
  requestAnimationFrame(() => wrap.scrollIntoView({ behavior: "smooth", block: "start" }));
  try {
    const d = await fetchJSON(coingeckoUrl(`/coins/${id}`, { localization: "false", tickers: "false", community_data: "false", developer_data: "false", sparkline: "false" }));
    if (cryptoState.selected !== id) return;
    renderCoinPanel(d);
    loadCoinChart(id);
  } catch { el.innerHTML = '<p class="muted small">Couldn\'t load this coin right now (CoinGecko rate limit) — try again in a minute.</p>'; }
}

function renderCoinPanel(d) {
  const el = document.getElementById("crCoinPanel");
  const md = d.market_data || {};
  const usd = o => (o && isNum(o.usd) ? o.usd : null);
  const desc = stripHtml(d.description && d.description.en);
  const links = d.links || {};
  const home = (links.homepage || []).find(Boolean);
  const supplyPct = md.max_supply ? md.circulating_supply / md.max_supply : null;
  const perf = [["1h", md.price_change_percentage_1h_in_currency && md.price_change_percentage_1h_in_currency.usd], ["24h", md.price_change_percentage_24h], ["7d", md.price_change_percentage_7d], ["14d", md.price_change_percentage_14d], ["30d", md.price_change_percentage_30d], ["60d", md.price_change_percentage_60d], ["200d", md.price_change_percentage_200d], ["1y", md.price_change_percentage_1y]];
  const stat = (l, v) => `<div class="cp-stat"><span>${l}</span><strong>${v}</strong></div>`;
  const ticker = cgTickerFor(d.id);
  const dt = s => (s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
  el.innerHTML = `
    <div class="cp-head">
      <div class="cr-coin-title"><img src="${d.image && d.image.large}" alt="" width="44" height="44"><div><h3>${d.name} <span class="ctag">${(d.symbol || "").toUpperCase()}</span> ${d.market_cap_rank ? `<span class="ctag ctag-brics">Rank #${d.market_cap_rank}</span>` : ""}</h3>
        <div class="cr-cats">${(d.categories || []).filter(Boolean).slice(0, 5).map(c => `<span class="ctag">${c}</span>`).join("")}</div></div></div>
      <div class="cp-actions">${ticker ? `<button type="button" class="cp-btn" id="crOpenTicker">Open full page →</button>` : ""}${home ? `<a class="cp-btn cp-btn-ghost cr-link" href="${home}" target="_blank" rel="noopener noreferrer">Website ↗</a>` : ""}<button type="button" class="cp-btn cp-btn-ghost" id="crCloseCoin">✕ Close</button></div>
    </div>
    <div class="cp-market-top">
      <div class="cp-price"><span class="cp-price-big">${cgMoney(usd(md.current_price))}</span> <span class="${changeClass(md.price_change_percentage_24h)}">${fmtPctVal(md.price_change_percentage_24h)} 24h</span><div class="muted small"><span class="live-tag">live</span> CoinGecko</div></div>
      <div class="cp-stats">${stat("Market cap", fmtCompact(usd(md.market_cap), "$"))}${stat("Fully diluted", fmtCompact(usd(md.fully_diluted_valuation), "$"))}${stat("24h volume", fmtCompact(usd(md.total_volume), "$"))}${stat("24h high", cgMoney(usd(md.high_24h)))}${stat("24h low", cgMoney(usd(md.low_24h)))}</div>
    </div>
    <div class="cp-section"><h4>Price chart <span class="card-subtitle" id="crRangeSub"></span></h4>
      <div class="chart-range-row" id="crRange">${[[7, "7D"], [30, "30D"], [90, "90D"], [365, "1Y"]].map(([n, l]) => `<button type="button" data-d="${n}" class="${n === cryptoState.range ? "active" : ""}">${l}</button>`).join("")}</div>
      <div id="crChart"><p class="muted small">Loading chart…</p></div></div>
    <div class="cp-section"><h4>Performance</h4><div class="cp-perf">${perf.map(([l, v]) => `<div class="cp-perf-cell ${changeClass(v)}"><span>${l}</span><strong>${isNum(v) ? fmtPctVal(v, 1) : "—"}</strong></div>`).join("")}</div></div>
    <div class="cp-section"><h4>Supply & records</h4>
      <div class="cp-stats cr-wide">${stat("Circulating supply", fmtCompact(md.circulating_supply))}${stat("Total supply", md.total_supply ? fmtCompact(md.total_supply) : "—")}${stat("Max supply", md.max_supply ? fmtCompact(md.max_supply) : "None (no fixed cap)")}${stat("All-time high", `${cgMoney(usd(md.ath))} <span class="muted small">${dt(md.ath_date && md.ath_date.usd)}</span>`)}${stat("From ATH", fmtPctVal(usd(md.ath_change_percentage), 1))}${stat("All-time low", `${cgMoney(usd(md.atl))} <span class="muted small">${dt(md.atl_date && md.atl_date.usd)}</span>`)}${stat("Genesis date", d.genesis_date || "—")}${stat("Consensus / algorithm", d.hashing_algorithm || "—")}${stat("Block time", d.block_time_in_minutes ? `${d.block_time_in_minutes} min` : "—")}${stat("Community sentiment", isNum(d.sentiment_votes_up_percentage) ? `${d.sentiment_votes_up_percentage.toFixed(0)}% bullish` : "—")}</div>
      ${supplyPct !== null ? `<div class="cp-52w"><span class="small muted">Supply issued</span><span class="cp-52w-track"><i style="left:${Math.min(100, supplyPct * 100).toFixed(0)}%"></i></span><span class="small">${(supplyPct * 100).toFixed(0)}% of max</span></div>` : ""}
    </div>
    ${desc ? `<div class="cp-section"><h4>About ${d.name}</h4><p class="cr-desc" id="crDesc">${escapeHtml(desc.length > 700 ? desc.slice(0, 700) + "…" : desc)}</p>${desc.length > 700 ? '<button type="button" class="did-you-know-link" id="crMore">Read more</button>' : ""}</div>` : ""}
    <p class="muted small cp-foot">Data: CoinGecko. Crypto is volatile and largely unregulated; this is information, not advice.</p>`;
  el.querySelector("#crCloseCoin").addEventListener("click", () => { cryptoState.selected = null; document.getElementById("crCoinPanelWrap").classList.add("hidden"); paintCryptoTable(); });
  el.querySelector("#crOpenTicker")?.addEventListener("click", () => loadTicker(ticker));
  el.querySelector("#crMore")?.addEventListener("click", e => { document.getElementById("crDesc").textContent = desc; e.target.remove(); });
  el.querySelectorAll("#crRange button").forEach(b => b.addEventListener("click", () => { cryptoState.range = Number(b.dataset.d); el.querySelectorAll("#crRange button").forEach(x => x.classList.toggle("active", x === b)); loadCoinChart(d.id); }));
}

async function loadCoinChart(id) {
  const box = document.getElementById("crChart");
  if (!box) return;
  box.innerHTML = '<p class="muted small">Loading chart…</p>';
  try {
    const d = await fetchJSON(coingeckoUrl(`/coins/${id}/market_chart`, { vs_currency: "usd", days: String(cryptoState.range) }));
    if (cryptoState.selected !== id) return;
    const prices = d.prices || [];
    const step = Math.max(1, Math.floor(prices.length / 120));
    const series = prices.filter((_, i) => i % step === 0 || i === prices.length - 1).map(p => ({ label: new Date(p[0]).toLocaleDateString(undefined, { month: "short", day: "numeric" }), value: p[1] }));
    const first = series[0] && series[0].value, last = series[series.length - 1] && series[series.length - 1].value;
    const chg = first ? ((last - first) / first) * 100 : null;
    document.getElementById("crRangeSub").innerHTML = chg === null ? "" : `<span class="${changeClass(chg)}">${fmtPctVal(chg, 1)}</span> over this period`;
    box.innerHTML = lineChartSvg(series, { width: 760, height: 220, color: chg >= 0 ? "var(--positive)" : "var(--negative)", decimals: last < 1 ? 4 : last < 100 ? 2 : 0 });
  } catch { box.innerHTML = '<p class="muted small">Couldn\'t load the chart right now.</p>'; }
}

// ---------------- sectors / DeFi / stablecoins / tradfi ----------------
async function loadCryptoCategories() {
  const el = document.getElementById("crCategories");
  try {
    const d = (await fetchJSON(coingeckoUrl("/coins/categories"))).filter(c => c.market_cap).sort((a, b) => b.market_cap - a.market_cap).slice(0, 18);
    el.innerHTML = `<h4>Crypto sectors <span class="card-subtitle">CoinGecko categories, by market cap — they overlap (one coin can sit in several)</span></h4>
      <table class="crypto-table quotes-table"><thead><tr><th>Sector</th><th>Market cap</th><th>24h</th><th>24h volume</th><th>Top coins</th></tr></thead><tbody>${d.map(c => `<tr><td><strong>${c.name}</strong></td><td>${fmtCompact(c.market_cap, "$")}</td><td class="${changeClass(c.market_cap_change_24h)}">${fmtPctVal(c.market_cap_change_24h, 1)}</td><td>${fmtCompact(c.volume_24h, "$")}</td><td>${(c.top_3_coins || []).map(u => `<img src="${u}" alt="" width="18" height="18" class="cr-mini">`).join("")}</td></tr>`).join("")}</tbody></table>`;
  } catch { el.innerHTML = '<h4>Crypto sectors</h4><p class="muted small">Couldn\'t load categories right now.</p>'; }
}

async function loadCryptoDefi() {
  const el = document.getElementById("crDefi");
  try {
    const chains = (await (await fetch("https://api.llama.fi/v2/chains")).json()).sort((a, b) => b.tvl - a.tvl);
    const total = chains.reduce((s, c) => s + (c.tvl || 0), 0);
    const top = chains.slice(0, 10), max = top[0].tvl;
    el.innerHTML = `<h4>DeFi: value locked by blockchain <span class="card-subtitle">DefiLlama · total value locked (TVL)</span></h4>
      <div class="cr-total">Total DeFi TVL <strong>${fmtCompact(total, "$")}</strong> across ${chains.length} chains</div>
      ${top.map(c => `<div class="mi-rank-row cr-defi-row"><span class="mi-rank-name">${c.name}</span><span class="mi-rank-bar"><i style="width:${(c.tvl / max) * 100}%"></i></span><b>${fmtCompact(c.tvl, "$")}</b></div>`).join("")}
      <p class="muted small">TVL is the dollar value of assets deposited in a chain's lending, trading and staking apps — a measure of usage, not profit or safety.</p>`;
  } catch { el.innerHTML = '<h4>DeFi</h4><p class="muted small">Couldn\'t load DeFi data right now.</p>'; }
}

async function loadCryptoStable() {
  const el = document.getElementById("crStable");
  try {
    const list = (await (await fetch("https://stablecoins.llama.fi/stablecoins?includePrices=false")).json()).peggedAssets
      .map(a => ({ name: a.name, symbol: a.symbol, cap: a.circulating && a.circulating.peggedUSD || 0, week: a.circulatingPrevWeek && a.circulatingPrevWeek.peggedUSD || 0, mech: a.pegMechanism, type: a.pegType }))
      .filter(a => a.type === "peggedUSD" || !a.type).sort((a, b) => b.cap - a.cap);
    const total = list.reduce((s, a) => s + a.cap, 0);
    const top = list.slice(0, 8);
    const mechLabel = { "fiat-backed": "Backed by cash & Treasuries", "crypto-backed": "Backed by crypto collateral", algorithmic: "Algorithmic" };
    el.innerHTML = `<h4>Stablecoins <span class="card-subtitle">DefiLlama · dollar-pegged tokens — the "cash" of crypto</span></h4>
      <div class="cr-total">Dollar stablecoins outstanding <strong>${fmtCompact(total, "$")}</strong></div>
      <table class="crypto-table quotes-table"><thead><tr><th>Stablecoin</th><th>Circulating</th><th>Share</th><th>7d change</th><th>How it's backed</th></tr></thead><tbody>${top.map(a => { const wk = a.week ? ((a.cap - a.week) / a.week) * 100 : null; return `<tr><td><strong>${a.symbol}</strong> <span class="muted small">${a.name}</span></td><td>${fmtCompact(a.cap, "$")}</td><td>${((a.cap / total) * 100).toFixed(1)}%</td><td class="${changeClass(wk)}">${wk === null ? "—" : fmtPctVal(wk, 2)}</td><td class="muted small">${mechLabel[a.mech] || a.mech || "—"}</td></tr>`; }).join("")}</tbody></table>
      <p class="muted small">Stablecoins aim to hold $1, but can "depeg" if reserves are questioned. Growth in supply is often read as money waiting on the sidelines.</p>`;
  } catch { el.innerHTML = '<h4>Stablecoins</h4><p class="muted small">Couldn\'t load stablecoin data right now.</p>'; }
}

const CRYPTO_ETFS = [["IBIT", "iShares Bitcoin Trust"], ["FBTC", "Fidelity Wise Origin Bitcoin"], ["ARKB", "ARK 21Shares Bitcoin"], ["BITB", "Bitwise Bitcoin"], ["GBTC", "Grayscale Bitcoin Trust"], ["ETHA", "iShares Ethereum Trust"], ["FETH", "Fidelity Ethereum"], ["ETHE", "Grayscale Ethereum Trust"], ["BITO", "ProShares Bitcoin Strategy (futures)"]];
const CRYPTO_STOCKS = [["COIN", "Coinbase"], ["MSTR", "Strategy (MicroStrategy)"], ["MARA", "MARA Holdings"], ["RIOT", "Riot Platforms"], ["HOOD", "Robinhood"], ["CLSK", "CleanSpark"], ["HUT", "Hut 8"], ["CIFR", "Cipher Mining"], ["BTBT", "Bit Digital"], ["GLXY", "Galaxy Digital"]];

function loadCryptoTradfi() {
  const body = document.getElementById("crTradfiBody");
  if (!body) return;
  body.innerHTML = '<h5 class="mi-section-title" style="margin-top:0">Spot & futures ETFs</h5><div id="crEtfQ"></div><h5 class="mi-section-title">Crypto-related stocks</h5><div id="crStockQ"></div>';
  const run = (list, target) => {
    const items = list.map(([symbol, name]) => ({ symbol, name, quote: null }));
    const paint = () => renderQuotesView(items, "", document.getElementById(target));
    paint();
    let n = 0;
    return loadQuotesThrottled(list.map(l => l[0]), (sym, q) => { const it = items.find(i => i.symbol === sym); if (it) it.quote = q; if (++n % 3 === 0) paint(); }, { concurrency: 2, gapMs: 700 }).then(paint);
  };
  // stagger the two lists so they don't burst together
  run(CRYPTO_ETFS, "crEtfQ").then(() => run(CRYPTO_STOCKS, "crStockQ"));
}

// ---------------- education ----------------
function renderCryptoEdu() {
  const el = document.getElementById("crEdu");
  const items = [
    ["Market cap", "Price × circulating supply. It measures a coin's size, not how much you could actually sell it for — thinly traded coins can't be sold at their headline value."],
    ["Dominance", "A coin's share of the total crypto market cap. Bitcoin dominance rising usually means investors are favoring the 'safer' major coin over smaller ones."],
    ["Circulating, total & max supply", "Circulating = coins available now. Max = the hard cap, if any (Bitcoin's is 21 million). 'Fully diluted' value assumes every future coin already exists — useful for spotting coins with lots of supply still to unlock."],
    ["Halving", "Bitcoin's built-in schedule cuts the reward for creating new blocks in half roughly every four years (every 210,000 blocks), slowing the rate of new supply. Many traders watch these dates, but price effects are debated."],
    ["Proof of Work vs Proof of Stake", "Two ways a network agrees on who's right. Proof of Work (Bitcoin) uses energy-hungry mining; Proof of Stake (Ethereum, Solana and others) has validators lock up coins as collateral and is far less energy-intensive."],
    ["Stablecoins", "Tokens designed to stay at $1, backed by cash/Treasuries or crypto collateral. They're how most trading and DeFi happens — and their main risk is losing the peg if reserves are questioned."],
    ["DeFi & TVL", "Decentralized finance apps (lending, trading, staking) run by code instead of companies. TVL — total value locked — counts the assets deposited in them. It's a usage gauge, not a profit or safety measure."],
    ["Layer 1 vs Layer 2", "Layer 1s (Bitcoin, Ethereum, Solana) are base blockchains. Layer 2s (like Base or Arbitrum) sit on top to make transactions cheaper and faster while settling back to the base chain."],
    ["Fear & Greed", "A sentiment composite. Extreme fear can mean panic selling (sometimes an opportunity); extreme greed can mean froth. It's a mood gauge, not a prediction."],
    ["Drawdowns & ATH", "Crypto assets have repeatedly fallen 70–90% from their all-time highs. 'From ATH' shows how far below its record a coin sits today."],
    ["Custody & risk", "Coins on an exchange are an IOU from the exchange; coins in your own wallet are only as safe as your private keys. Exchange failures, hacks and scams have caused large losses."],
    ["Liquidity", "Small coins can have very few buyers. A big order can move the price a lot, and you may not be able to exit at the quoted price. Check 24h volume relative to market cap."],
  ];
  el.innerHTML = `<h4>Crypto 101 <span class="card-subtitle">plain-English basics for everything on this page</span></h4><div class="cr-edu">${items.map(([t, b]) => `<details><summary>${t}</summary><p>${b}</p></details>`).join("")}</div><p class="muted small">Educational only — not financial advice. Crypto is highly volatile and rules vary by country.</p>`;
}
