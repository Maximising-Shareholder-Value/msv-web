// supplyChain.js — Pillar 2+3: a layered, left-to-right dependency map of
// the AI infrastructure supply chain (rebuilt 2026-09-26 from the earlier
// node grid + card list, at Jozsua's request: "spider web ... lines and
// arrows ... which companies are dependent on which").
//
// HOW TO READ IT: columns run from the end user of AI (left) to the raw
// materials underneath everything (right). An arrow points from a company
// to something it DEPENDS ON.
//
// TWO KINDS OF LINK, kept visibly distinct (this app's "no fabricated
// data" standard):
// - SOLID = sourced. Transcribed verbatim from the governance repo's
//   SUPPLY_CHAIN_RESEARCH.md (SEC filings, official statements,
//   corroborated journalism), each with its own source + confidence — the
//   SUPPLY_CHAIN_RELATIONSHIPS array below, unchanged.
// - DASHED = inferred. The power/cooling and raw-material layers (and a
//   few well-known chip-design ties) were NOT part of that research pass;
//   they're the app's own structural reasoning from general industry
//   knowledge ("data centers need turbines and copper"), labelled
//   "Inferred" everywhere they appear — never stated as a sourced fact,
//   and no specific contract or figure is claimed for them.
// Not live market data: no price feed drives any of it. Depends on
// loadTicker()/fetchJSON()/finnhubUrl() (script.js).


const MI_LAYERS = [
  { title: "AI labs & apps" },
  { title: "Cloud & hyperscalers" },
  { title: "AI infrastructure" },
  { title: "Chips & power gear" },
  { title: "Foundry & memory" },
  { title: "Tools & raw materials" },
];

// `layer` = column (0 = closest to the AI end user). Array order within a
// layer is top-to-bottom on screen, hand-ordered to keep lines uncrossed.
const MI_NODES = [
  { id: "openai", label: "OpenAI", name: "OpenAI", ticker: null, layer: 0, role: "AI model company — private, no ticker" },
  { id: "anthropic", label: "Anthropic", name: "Anthropic", ticker: null, layer: 0, role: "AI model company — private, no ticker" },

  { id: "msft", label: "Microsoft", name: "Microsoft", ticker: "MSFT", layer: 1, role: "Hyperscaler / cloud, model investor" },
  { id: "googl", label: "Alphabet", name: "Alphabet (Google)", ticker: "GOOGL", layer: 1, role: "Hyperscaler / cloud, custom silicon" },
  { id: "amzn", label: "Amazon", name: "Amazon (AWS)", ticker: "AMZN", layer: 1, role: "Hyperscaler / cloud, custom silicon" },
  { id: "meta", label: "Meta", name: "Meta Platforms", ticker: "META", layer: 1, role: "Hyperscaler-scale AI infra buyer" },

  { id: "crwv", label: "CoreWeave", name: "CoreWeave", ticker: "CRWV", layer: 2, role: "GPU cloud infrastructure" },
  { id: "smci", label: "Supermicro", name: "Super Micro Computer", ticker: "SMCI", layer: 2, role: "GPU server systems integrator" },
  { id: "anet", label: "Arista", name: "Arista Networks", ticker: "ANET", layer: 2, role: "Data-center networking" },
  { id: "dlr", label: "Digital Realty", name: "Digital Realty", ticker: "DLR", layer: 2, role: "Data-center operator (leases space + power)" },
  { id: "eqix", label: "Equinix", name: "Equinix", ticker: "EQIX", layer: 2, role: "Data-center operator (colocation)" },

  { id: "nvda", label: "NVIDIA", name: "NVIDIA", ticker: "NVDA", layer: 3, role: "GPU / chip designer" },
  { id: "amd", label: "AMD", name: "AMD", ticker: "AMD", layer: 3, role: "GPU / chip designer" },
  { id: "avgo", label: "Broadcom", name: "Broadcom", ticker: "AVGO", layer: 3, role: "Custom ASIC co-design, networking silicon" },
  { id: "intc", label: "Intel", name: "Intel", ticker: "INTC", layer: 3, role: "Chip designer + foundry" },
  { id: "vrt", label: "Vertiv", name: "Vertiv", ticker: "VRT", layer: 3, role: "Data-center power & cooling equipment" },
  { id: "etn", label: "Eaton", name: "Eaton", ticker: "ETN", layer: 3, role: "Electrical power equipment (switchgear, UPS)" },
  { id: "gev", label: "GE Vernova", name: "GE Vernova", ticker: "GEV", layer: 3, role: "Gas turbines, grid & nuclear equipment" },

  { id: "tsm", label: "TSMC", name: "Taiwan Semiconductor (TSMC)", ticker: "TSM", layer: 4, role: "Chip foundry / manufacturer" },
  { id: "skh", label: "SK Hynix", name: "SK Hynix", ticker: null, layer: 4, role: "Memory (HBM) supplier — no US ticker (Korea Exchange only)" },
  { id: "mu", label: "Micron", name: "Micron", ticker: "MU", layer: 4, role: "Memory (HBM) supplier" },

  { id: "asml", label: "ASML", name: "ASML", ticker: "ASML", layer: 5, role: "Lithography equipment (EUV machines)" },
  { id: "fcx", label: "Freeport", name: "Freeport-McMoRan", ticker: "FCX", layer: 5, role: "Copper miner" },
  { id: "mp", label: "MP Materials", name: "MP Materials", ticker: "MP", layer: 5, role: "Rare-earth miner / magnets" },
  { id: "ccj", label: "Cameco", name: "Cameco", ticker: "CCJ", layer: 5, role: "Uranium miner (nuclear fuel)" },
  { id: "nem", label: "Newmont", name: "Newmont", ticker: "NEM", layer: 5, role: "Gold miner (a precious metal)" },
];


const SUPPLY_CHAIN_RELATIONSHIPS = [
  { a: "TSMC", b: "NVIDIA", relationship: "manufacturing-partner-of", description: "TSMC fabricates nearly all of NVIDIA's advanced GPUs on 5nm/4nm nodes; NVIDIA is projected to become TSMC's single largest customer in 2026, overtaking Apple.", source: "CNBC, “Nvidia set to supplant Apple as TSMC's largest customer” (Jan 26, 2026); reported consistently for years across outlets", confidence: "High" },
  { a: "ASML", b: "TSMC, Intel, Samsung", relationship: "supplier-of", description: "ASML is the sole global supplier of EUV lithography machines needed for leading-edge chips; TSMC, Intel and Samsung co-invested in ASML's R&D and historically held minority equity stakes.", source: "ASML company statements; Reuters/Techzine/Yahoo Finance coverage of High-NA EUV orders (Aug 2025–2026)", confidence: "High" },
  { a: "SK Hynix", b: "NVIDIA", relationship: "supplier-of", description: "SK Hynix is NVIDIA's primary HBM (high-bandwidth memory) supplier, holding ~62% HBM share in 2025 and a projected ~70% share of HBM4 for NVIDIA's upcoming Rubin platform.", source: "CNBC, “Nvidia-supplier SK Hynix readies production for cutting-edge HBM4” (Sept 12, 2025); SK Hynix Newsroom 2026 outlook", confidence: "High" },
  { a: "Micron", b: "NVIDIA", relationship: "supplier-of", description: "Secondary HBM supplier to NVIDIA — shipped HBM4 samples meeting NVIDIA's specs mid-2025 but trails SK Hynix (and Samsung) in contracted volume/share.", source: "Benzinga/TrendForce reporting, June–Dec 2025", confidence: "Medium", confidenceNote: "Early-stage/sample supply, not yet at SK Hynix's scale." },
  { a: "Super Micro Computer", b: "NVIDIA", relationship: "manufacturing-partner-of / customer-of", description: "Launch partner building NVIDIA-certified, rack-scale GPU server systems (e.g. GB200/GB300, Vera Rubin NVL4); revenue heavily dependent on NVIDIA GPU allocation.", source: "Supermicro/NVIDIA joint press releases (2025–2026); Fortune, Apr 2026", confidence: "High" },
  { a: "Arista Networks", b: "Microsoft, Meta", relationship: "supplier-of", description: "Arista's data-center switches used extensively by both; each has historically represented more than 10% of Arista's annual revenue, disclosed as a customer-concentration risk.", source: "Arista Networks Form 10-K filings (SEC EDGAR); Seeking Alpha/BofA note on 2025 revenue contribution", confidence: "High" },
  { a: "Broadcom", b: "Google (Alphabet)", relationship: "manufacturing-partner-of", description: "Broadcom has co-designed Google's custom TPU AI chips for seven generations since 2014; extended the custom-silicon/networking partnership through 2031.", source: "Tom's Hardware (May 2026); Broadcom investor 8-K / StockTitan filing summary", confidence: "High" },
  { a: "Broadcom", b: "OpenAI", relationship: "manufacturing-partner-of", description: "OpenAI co-designing its own AI accelerator chips, Broadcom manufacturing/deploying; deal covers up to 10 gigawatts of custom silicon, production starting H2 2026 through 2029.", source: "OpenAI/Broadcom joint press release (Oct 13, 2025); CNBC, Bloomberg", confidence: "High" },
  { a: "AMD", b: "OpenAI", relationship: "supplier-of", description: "AMD supplying up to 6 gigawatts of Instinct MI450 GPUs to OpenAI 2026–2030 (1GW tranche starting H2 2026); AMD expects $100B+ revenue over 4 years from the deal.", source: "AMD/OpenAI press release (Oct 6, 2025); CNBC, TechCrunch", confidence: "High" },
  { a: "OpenAI", b: "AMD", relationship: "major-investor-in", description: "Part of the chip-supply deal: AMD issued OpenAI warrants for up to 160 million AMD shares (vesting tied to deployment milestones/share price, up to ~10% stake potential).", source: "CNBC, “OpenAI looks to take 10% stake in AMD” (Oct 6, 2025)", confidence: "High" },
  { a: "NVIDIA", b: "OpenAI", relationship: "major-investor-in / infrastructure-provider-for", description: "NVIDIA agreed to invest up to $100 billion in OpenAI, funded progressively as OpenAI deploys at least 10 gigawatts of NVIDIA systems (~4-5 million GPUs).", source: "NVIDIA Newsroom joint release (Sept 22, 2025); Bloomberg, CNBC", confidence: "High" },
  { a: "Microsoft", b: "OpenAI", relationship: "major-investor-in / infrastructure-provider-for", description: "Microsoft committed $13B total to OpenAI ($11.9B funded as of mid-2025); OpenAI's API runs exclusively on Azure. Microsoft's FY2026 10-Q disclosed $24.1B in revenue tied to the OpenAI relationship.", source: "Microsoft FY2026 Form 10-Q/10-K; Microsoft Official Blog (Oct 28, 2025); CNBC, Neowin", confidence: "High" },
  { a: "Microsoft & NVIDIA", b: "Anthropic", relationship: "major-investor-in / infrastructure-provider-for", description: "Microsoft (up to $5B) and NVIDIA (up to $10B) investing in Anthropic; Anthropic committed to purchase $30B of Azure compute plus up to 1GW additional capacity, valuing Anthropic near $350B.", source: "Microsoft/NVIDIA/Anthropic joint announcement (Nov 18, 2025); Microsoft Official Blog, CNBC", confidence: "High" },
  { a: "NVIDIA", b: "CoreWeave", relationship: "major-investor-in / customer-of", description: "NVIDIA holds an equity stake (~1.2% at IPO), invested a further ~$2B in 2025, and signed a $6.3B deal to buy unused CoreWeave cloud capacity through April 2032. Microsoft, Meta and OpenAI also among CoreWeave's largest customers.", source: "CoreWeave IPO S-1 filing; CNBC, “CoreWeave's stock rallies on disclosure of $6.3 billion order from Nvidia” (Sept 15, 2025)", confidence: "High" },
  { a: "Amazon (AWS)", b: "NVIDIA", relationship: "customer-of / co-engineering-partner-of", description: "AWS deploying 2 million additional NVIDIA GPUs 2027–2028; Amazon's Annapurna Labs co-designing next-gen Trainium4 chips to interoperate with NVIDIA's NVLink Fusion in shared server racks.", source: "NVIDIA Newsroom / AWS joint announcement, re:Invent 2025", confidence: "High" },
  { a: "Meta Platforms", b: "NVIDIA", relationship: "customer-of", description: "Meta's AI buildout (2GW+ data-center program, ~$115–135B 2026 capex) relies heavily on NVIDIA GPUs (Blackwell, then Rubin) — one of NVIDIA's largest customers by volume.", source: "Tom's Hardware (Meta-NVIDIA deal coverage); CNBC (Feb 17, 2026)", confidence: "High" },
  { a: "Meta Platforms", b: "AMD", relationship: "customer-of", description: "Diversifying silicon supply by also deploying AMD MI450 chips alongside NVIDIA GPUs in FY2026 AI infrastructure.", source: "Enki AI / industry capex analysis, 2026", confidence: "Medium", confidenceNote: "Scale/contract terms less precisely reported than the NVIDIA relationship." },
  { a: "Intel (Foundry)", b: "Microsoft", relationship: "manufacturing-partner-of", description: "Intel Foundry secured Microsoft as a customer for its 18A process node, reportedly to manufacture Microsoft's custom “Maia 2” AI accelerator chip.", source: "Tom's Hardware, SemiWiki (2025)", confidence: "Medium", confidenceNote: "Trade-press reporting, not yet an explicit joint SEC/press disclosure of the Maia 2 tie." },
  { a: "Intel (Foundry)", b: "Amazon", relationship: "manufacturing-partner-of", description: "Reportedly smaller-scale foundry arrangement with Amazon for custom AI Fabric chips on the 18A node.", source: "Electronics Weekly, SemiWiki (2025)", confidence: "Medium", confidenceNote: "Lower confidence — volumes/specifics thinly sourced." },
  { a: "NVIDIA", b: "Microsoft / Meta / Google / Amazon", relationship: "customer-of", description: "NVIDIA's own SEC filings show customer concentration (4 direct customers = 61% of a recent quarter's revenue, top single customer ~22%), anonymized as “Customer A/B/C/D.” NVIDIA does not officially name them; multiple outlets have identified the likely hyperscalers as Microsoft, Meta, Google and Amazon.", source: "NVIDIA SEC filings (concentration language); CNBC, “Nvidia's top two mystery customers made up 39% of Q2 revenue” (Aug 28, 2025)", confidence: "Medium", confidenceNote: "The concentration disclosure itself is real and SEC-sourced. The specific company IDENTITIES behind “Customer A/B/C/D” are analyst/journalist inference, NOT confirmed by NVIDIA — reported/inferred, not a confirmed fact." },
];

// from = the company that DEPENDS; to = what it depends on.
// `rel` = index into SUPPLY_CHAIN_RELATIONSHIPS (sourced links); `text` is
// the short plain-English reason for inferred links.
const MI_EDGES = [
  // ---- Sourced (each one maps to a researched relationship above) ----
  { from: "nvda", to: "tsm", rel: 0 },
  { from: "tsm", to: "asml", rel: 1 },
  { from: "intc", to: "asml", rel: 1 },
  { from: "nvda", to: "skh", rel: 2 },
  { from: "nvda", to: "mu", rel: 3 },
  { from: "smci", to: "nvda", rel: 4 },
  { from: "msft", to: "anet", rel: 5 },
  { from: "meta", to: "anet", rel: 5 },
  { from: "googl", to: "avgo", rel: 6 },
  { from: "openai", to: "avgo", rel: 7 },
  { from: "openai", to: "amd", rel: 8 },
  { from: "openai", to: "nvda", rel: 10 },
  { from: "openai", to: "msft", rel: 11 },
  { from: "anthropic", to: "msft", rel: 12 },
  { from: "anthropic", to: "nvda", rel: 12 },
  { from: "crwv", to: "nvda", rel: 13 },
  { from: "msft", to: "crwv", rel: 13 },
  { from: "meta", to: "crwv", rel: 13 },
  { from: "openai", to: "crwv", rel: 13 },
  { from: "amzn", to: "nvda", rel: 14 },
  { from: "meta", to: "nvda", rel: 15 },
  { from: "meta", to: "amd", rel: 16 },
  { from: "msft", to: "intc", rel: 17 },
  { from: "amzn", to: "intc", rel: 18 },
  { from: "msft", to: "nvda", rel: 19 },
  { from: "googl", to: "nvda", rel: 19 },

  // ---- Inferred (structural reasoning — general industry knowledge) ----
  ...["msft", "googl", "amzn", "meta"].flatMap(c => [
    { from: c, to: "dlr", text: "Cloud providers rent large blocks of data-center space and power from operators like Digital Realty, alongside building their own." },
    { from: c, to: "eqix", text: "Cloud providers rent data-center space and interconnection from operators like Equinix, alongside building their own." },
  ]),
  { from: "amd", to: "tsm", text: "AMD designs chips but relies on a foundry — TSMC — to manufacture them (the \"fabless\" model; widely reported)." },
  { from: "avgo", to: "tsm", text: "Broadcom designs chips and relies on a foundry — TSMC — to manufacture them (the \"fabless\" model; widely reported)." },
  { from: "anet", to: "avgo", text: "Arista's switches are built around merchant switch chips, a large share of which come from Broadcom (widely reported)." },
  { from: "dlr", to: "vrt", text: "Data centers need power and cooling systems — the category Vertiv sells into. General industry structure, not a specific contract." },
  { from: "dlr", to: "etn", text: "Data centers need switchgear, backup power and transformers — the category Eaton sells into. General industry structure, not a specific contract." },
  { from: "dlr", to: "gev", text: "Data centers need large amounts of electricity; gas turbines and grid equipment (GE Vernova's category) are a major supply route. General industry structure." },
  { from: "eqix", to: "vrt", text: "Data centers need power and cooling systems — the category Vertiv sells into. General industry structure, not a specific contract." },
  { from: "eqix", to: "etn", text: "Data centers need switchgear, backup power and transformers — the category Eaton sells into. General industry structure, not a specific contract." },
  { from: "eqix", to: "gev", text: "Data centers need large amounts of electricity; gas turbines and grid equipment (GE Vernova's category) are a major supply route. General industry structure." },
  { from: "vrt", to: "fcx", text: "Copper is the core metal in power cables, busbars, cooling coils and motors." },
  { from: "etn", to: "fcx", text: "Copper is the core metal in transformers, switchgear and power cabling." },
  { from: "gev", to: "fcx", text: "Copper windings and cabling are central to generators, transformers and grid equipment." },
  { from: "gev", to: "mp", text: "Generators and motors commonly use rare-earth permanent magnets." },
  { from: "gev", to: "ccj", text: "Nuclear (including small modular reactors) is a growing power option for data centers, and reactors need uranium fuel." },
  { from: "tsm", to: "fcx", text: "Chips use copper for the microscopic wiring (interconnects) on the die." },
  { from: "tsm", to: "nem", text: "Gold is used in some semiconductor packaging and electrical contacts — a precious-metal input." },
];


function prettyRelationship(rel) {
  return rel.split(" / ").map(part => {
    const words = part.split("-");
    return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(" ");
  }).join(" / ");
}

// ---- Layout (SVG viewBox units; the whole diagram scales uniformly) ----
const MI_W = 1200, MI_H = 640, MI_R = 24; // canvas size, bubble radius
const MI_COL_X = MI_LAYERS.map((_, i) => 100 + i * 200);
const MI_ROW_GAP = 76, MI_CENTER_Y = 340;

const MI_BY_ID = Object.fromEntries(MI_NODES.map(n => [n.id, n]));
MI_LAYERS.forEach((_, layer) => {
  const col = MI_NODES.filter(n => n.layer === layer);
  col.forEach((n, i) => {
    n.x = MI_COL_X[layer];
    n.y = MI_CENTER_Y + (i - (col.length - 1) / 2) * MI_ROW_GAP;
  });
});

const miState = { selected: null, logosRequested: false };

function miEdgeInfo(e) {
  if (e.rel !== undefined) {
    const r = SUPPLY_CHAIN_RELATIONSHIPS[e.rel];
    return { basis: "sourced", text: r.description, source: r.source, confidence: r.confidence, note: r.confidenceNote, label: prettyRelationship(r.relationship) };
  }
  return { basis: "inferred", text: e.text, confidence: "Inferred", label: "Depends on" };
}

function miEdgePath(e) {
  const a = MI_BY_ID[e.from], b = MI_BY_ID[e.to];
  const x1 = a.x + MI_R, y1 = a.y;
  const x2 = b.x - MI_R - 5, y2 = b.y;
  const dx = Math.max(60, (x2 - x1) * 0.5);
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

function miInitials(n) {
  return n.ticker ? n.ticker.slice(0, 4) : n.label.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function buildMiSvg() {
  const svgNS = "http://www.w3.org/2000/svg";
  const parts = [];
  parts.push(`<svg class="mi-svg" viewBox="0 0 ${MI_W} ${MI_H}" role="img" aria-label="Dependency map of the AI infrastructure supply chain">`);
  parts.push(`<defs>
    <marker id="miArrowS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mi-arrow mi-arrow-sourced"/></marker>
    <marker id="miArrowI" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mi-arrow mi-arrow-inferred"/></marker>
    <clipPath id="miClip"><circle r="${MI_R - 5}"/></clipPath>
  </defs>`);

  // column headers + faint column guides
  MI_LAYERS.forEach((l, i) => {
    parts.push(`<text class="mi-col-title" x="${MI_COL_X[i]}" y="26" text-anchor="middle">${l.title}</text>`);
    parts.push(`<line class="mi-col-guide" x1="${MI_COL_X[i]}" y1="44" x2="${MI_COL_X[i]}" y2="${MI_H - 20}"/>`);
  });

  parts.push('<g class="mi-edges">');
  MI_EDGES.forEach((e, i) => {
    const inferred = e.rel === undefined;
    parts.push(`<path class="mi-edge ${inferred ? "mi-edge-inferred" : "mi-edge-sourced"}" data-i="${i}" data-from="${e.from}" data-to="${e.to}" d="${miEdgePath(e)}" marker-end="url(#${inferred ? "miArrowI" : "miArrowS"})"/>`);
  });
  parts.push("</g>");

  parts.push('<g class="mi-nodes">');
  MI_NODES.forEach(n => {
    parts.push(`<g class="mi-node" data-id="${n.id}" transform="translate(${n.x},${n.y})" tabindex="0" role="button" aria-label="${n.name}">
      <circle class="mi-node-bg" r="${MI_R}"/>
      <text class="mi-node-initials" y="4" text-anchor="middle">${miInitials(n)}</text>
      <image class="mi-node-logo" x="${-(MI_R - 5)}" y="${-(MI_R - 5)}" width="${(MI_R - 5) * 2}" height="${(MI_R - 5) * 2}" clip-path="url(#miClip)" preserveAspectRatio="xMidYMid meet" visibility="hidden"/>
      <circle class="mi-node-ring" r="${MI_R}"/>
      <text class="mi-node-label" y="${MI_R + 15}" text-anchor="middle">${n.label}</text>
    </g>`);
  });
  parts.push("</g></svg>");
  return parts.join("");
}

// ---- Logos: Finnhub /stock/profile2 `logo`, cached in localStorage ----
// 24 tickers would be a real chunk of Finnhub's 60/min budget on every
// visit, so logos are (a) cached for 30 days — logo URLs almost never
// change — and (b) only requested once the diagram scrolls into view.
const MI_LOGO_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function miCachedLogo(ticker) {
  try {
    const saved = JSON.parse(localStorage.getItem(`msv-logo-${ticker}`) || "null");
    if (saved && Date.now() - saved.t < MI_LOGO_TTL_MS) return saved.url || "";
  } catch { /* storage unavailable */ }
  return null;
}
function miSaveLogo(ticker, url) {
  try { localStorage.setItem(`msv-logo-${ticker}`, JSON.stringify({ url, t: Date.now() })); } catch { /* ignore */ }
}

function miApplyLogo(nodeId, url) {
  const g = document.querySelector(`.mi-node[data-id="${nodeId}"]`);
  if (!g || !url) return;
  const img = g.querySelector(".mi-node-logo");
  img.addEventListener("load", () => {
    img.setAttribute("visibility", "visible");
    g.querySelector(".mi-node-initials").setAttribute("visibility", "hidden");
  }, { once: true });
  img.setAttribute("href", url);
}

function miLoadLogos() {
  if (miState.logosRequested) return;
  miState.logosRequested = true;
  let delay = 0;
  MI_NODES.filter(n => n.ticker).forEach(n => {
    const cached = miCachedLogo(n.ticker);
    if (cached !== null) { miApplyLogo(n.id, cached); return; }
    setTimeout(async () => {
      try {
        const profile = await fetchJSON(finnhubUrl("/stock/profile2", { symbol: n.ticker }));
        miSaveLogo(n.ticker, profile.logo || "");
        miApplyLogo(n.id, profile.logo);
      } catch { /* leave initials */ }
    }, delay);
    delay += 120;
  });
}

// ---- Selection + info panel ----
function miSelect(id) {
  miState.selected = id;
  const root = document.getElementById("marketIntelContent");
  if (!root) return;
  const connected = new Set();
  if (id) {
    connected.add(id);
    MI_EDGES.forEach(e => { if (e.from === id) connected.add(e.to); if (e.to === id) connected.add(e.from); });
  }
  root.querySelector(".mi-svg").classList.toggle("mi-has-selection", !!id);
  root.querySelectorAll(".mi-node").forEach(g => {
    g.classList.toggle("mi-selected", g.dataset.id === id);
    g.classList.toggle("mi-connected", !!id && g.dataset.id !== id && connected.has(g.dataset.id));
  });
  root.querySelectorAll(".mi-edge").forEach(p => {
    const on = !!id && (p.dataset.from === id || p.dataset.to === id);
    p.classList.toggle("mi-edge-on", on);
    p.classList.toggle("mi-edge-out", on && p.dataset.from === id);
  });
  renderMiPanel();
}

function miEdgeRowHtml(e, otherId, direction) {
  const other = MI_BY_ID[otherId];
  const info = miEdgeInfo(e);
  return `
    <div class="mi-edge-row">
      <div class="mi-edge-row-head">
        <button type="button" class="mi-chip" data-select="${other.id}">${direction === "out" ? "→" : "←"} ${other.name}${other.ticker ? ` <span class="muted">${other.ticker}</span>` : ""}</button>
        <span class="mi-basis mi-basis-${info.basis}">${info.basis === "sourced" ? `Sourced · ${info.confidence}` : "Inferred"}</span>
      </div>
      <p class="mi-edge-text">${info.text}</p>
      ${info.note ? `<p class="mi-edge-note">${info.note}</p>` : ""}
      ${info.source ? `<p class="mi-edge-source">Source: ${info.source}</p>` : ""}
    </div>`;
}

function renderMiPanel() {
  const el = document.getElementById("marketIntelPanel");
  if (!el) return;
  const id = miState.selected;
  if (!id) {
    el.innerHTML = '<p class="muted small mi-hint">Click any bubble to see what it depends on and who relies on it. Click it again to open its stock page.</p>';
    return;
  }
  const n = MI_BY_ID[id];
  const outs = MI_EDGES.filter(e => e.from === id);
  const ins = MI_EDGES.filter(e => e.to === id);
  el.innerHTML = `
    <div class="mi-panel-head">
      <div>
        <h4>${n.name}${n.ticker ? ` <span class="ticker-badge">${n.ticker}</span>` : ""}</h4>
        <p class="muted small">${MI_LAYERS[n.layer].title} · ${n.role}</p>
      </div>
      ${n.ticker
        ? `<button type="button" class="mi-open-btn" data-open="${n.ticker}">Open ${n.ticker} stock page →</button>`
        : '<span class="muted small">Private / no US ticker — no stock page</span>'}
    </div>
    <div class="mi-panel-cols">
      <div>
        <h5>Depends on <span class="muted">(${outs.length})</span></h5>
        ${outs.length ? outs.map(e => miEdgeRowHtml(e, e.to, "out")).join("") : '<p class="muted small">Nothing further down the chain in this map — it sits at the base.</p>'}
      </div>
      <div>
        <h5>Relied on by <span class="muted">(${ins.length})</span></h5>
        ${ins.length ? ins.map(e => miEdgeRowHtml(e, e.from, "in")).join("") : '<p class="muted small">Nobody upstream in this map depends on it directly.</p>'}
      </div>
    </div>`;
  el.querySelectorAll("[data-select]").forEach(b => b.addEventListener("click", () => miSelect(b.dataset.select)));
  el.querySelector("[data-open]")?.addEventListener("click", ev => loadTicker(ev.currentTarget.dataset.open));
}

function renderMarketIntel() {
  const root = document.getElementById("marketIntelContent");
  if (!root) return;
  root.innerHTML = `
    <p class="mi-lead">Columns run from AI's end users (left) down to the raw materials underneath everything (right). <strong>An arrow points from a company to something it depends on.</strong></p>
    <div class="mi-legend">
      <span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" class="mi-legend-line-sourced"/></svg> Sourced — SEC filings, company statements, corroborated press</span>
      <span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" class="mi-legend-line-inferred"/></svg> Inferred — the app's own structural reasoning, not individually sourced</span>
    </div>
    <div class="mi-diagram-scroll">${buildMiSvg()}</div>
    <div id="marketIntelPanel" class="mi-panel"></div>
    <details class="mi-research">
      <summary>All ${SUPPLY_CHAIN_RELATIONSHIPS.length} researched relationships (full source trail)</summary>
      <div class="mi-research-list"></div>
    </details>`;

  // Bubble click: first click selects, clicking the selected bubble again
  // opens its stock page. Clicking empty space clears the selection.
  root.querySelector(".mi-svg").addEventListener("click", ev => {
    const g = ev.target.closest(".mi-node");
    if (!g) { miSelect(null); return; }
    const id = g.dataset.id;
    if (miState.selected === id) {
      const n = MI_BY_ID[id];
      if (n.ticker) loadTicker(n.ticker);
    } else {
      miSelect(id);
    }
  });
  root.querySelector(".mi-svg").addEventListener("keydown", ev => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const g = ev.target.closest(".mi-node");
    if (!g) return;
    ev.preventDefault();
    g.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  // The verbatim researched relationship cards, kept as the source trail.
  const list = root.querySelector(".mi-research-list");
  SUPPLY_CHAIN_RELATIONSHIPS.forEach(rel => {
    const card = document.createElement("div");
    card.className = "supply-chain-rel-card";
    card.innerHTML = `
      <div class="supply-chain-rel-header">
        <span class="supply-chain-rel-company">${rel.a}</span>
        <span class="supply-chain-rel-arrow">${prettyRelationship(rel.relationship)} →</span>
        <span class="supply-chain-rel-company">${rel.b}</span>
      </div>
      <p class="supply-chain-rel-desc">${rel.description}</p>
      ${rel.confidenceNote ? `<p class="supply-chain-rel-note">${rel.confidenceNote}</p>` : ""}
      <div class="supply-chain-rel-footer">
        <span class="supply-chain-rel-source">Source: ${rel.source}</span>
        <span class="supply-chain-confidence supply-chain-confidence-${rel.confidence.toLowerCase()}">${rel.confidence} confidence</span>
      </div>`;
    list.appendChild(card);
  });

  renderMiPanel();

  // Logos: only start fetching once the diagram is actually on screen.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); miLoadLogos(); }
    }, { rootMargin: "200px" });
    io.observe(root);
  } else {
    miLoadLogos();
  }
}
