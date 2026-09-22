// supplyChain.js — Pillar 2+3: a real, sourced (but NOT live-data) look at
// how companies in the AI infrastructure stack are actually connected.
// Every node and relationship here is transcribed verbatim from the
// project governance repo's SUPPLY_CHAIN_RESEARCH.md, a research pass
// that prioritized SEC filings, then official company statements, then
// corroborated journalism — see that doc for the full sourcing writeup.
// This is deliberately NOT presented as live market data: no price feed
// drives any of it, and every relationship shows its own source and
// confidence rating rather than being stated as flat fact, per this
// app's "no fabricated data" standard. Depends on homeContentEl
// (home.js) and loadTicker() (script.js).

const SUPPLY_CHAIN_NODES = [
  { name: "NVIDIA", ticker: "NVDA", role: "GPU / chip designer" },
  { name: "Taiwan Semiconductor (TSMC)", ticker: "TSM", role: "Chip foundry / manufacturer" },
  { name: "AMD", ticker: "AMD", role: "GPU / chip designer" },
  { name: "Intel", ticker: "INTC", role: "Chip designer + foundry" },
  { name: "Microsoft", ticker: "MSFT", role: "Hyperscaler / cloud, model investor" },
  { name: "Alphabet (Google)", ticker: "GOOGL", role: "Hyperscaler / cloud, custom silicon" },
  { name: "Amazon", ticker: "AMZN", role: "Hyperscaler / cloud, custom silicon" },
  { name: "Meta Platforms", ticker: "META", role: "Hyperscaler-scale AI infra buyer" },
  { name: "Broadcom", ticker: "AVGO", role: "Custom ASIC co-design, networking" },
  { name: "Micron", ticker: "MU", role: "Memory (HBM) supplier" },
  { name: "Arista Networks", ticker: "ANET", role: "Data-center networking" },
  { name: "Super Micro Computer", ticker: "SMCI", role: "GPU server systems integrator" },
  { name: "ASML", ticker: "ASML", role: "Lithography equipment" },
  { name: "CoreWeave", ticker: "CRWV", role: "GPU cloud infrastructure" },
  { name: "SK Hynix", ticker: null, role: "Memory (HBM) supplier — no US ticker (Korea Exchange only)" },
  { name: "OpenAI", ticker: null, role: "AI model company — private, no ticker" },
  { name: "Anthropic", ticker: null, role: "AI model company — private, no ticker" },
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

function prettyRelationship(rel) {
  return rel.split(" / ").map(part => {
    const words = part.split("-");
    return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(" ");
  }).join(" / ");
}

function findNodeTicker(name) {
  const node = SUPPLY_CHAIN_NODES.find(n => name.includes(n.name) || n.name.includes(name));
  return node ? node.ticker : null;
}

function renderSupplyChainTab() {
  homeContentEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "supply-chain-wrap";

  wrap.innerHTML = `
    <div class="supply-chain-disclosure">
      <p><strong>Pilot: AI infrastructure.</strong> This is research, not a live feed — every relationship below is sourced (SEC filings, official company statements, or corroborated journalism) and rated by confidence, rather than stated as flat fact. Two relationships involve OpenAI and Anthropic, which are private companies with no public ticker — shown here for context, with no price data attached.</p>
    </div>

    <h4 class="supply-chain-section-title">Companies in this pilot</h4>
    <div class="supply-chain-nodes"></div>

    <h4 class="supply-chain-section-title">Relationships <span class="card-subtitle">${SUPPLY_CHAIN_RELATIONSHIPS.length} sourced connections</span></h4>
    <div class="supply-chain-relationships"></div>
  `;

  const nodesEl = wrap.querySelector(".supply-chain-nodes");
  SUPPLY_CHAIN_NODES.forEach(node => {
    const chip = document.createElement(node.ticker ? "button" : "div");
    if (node.ticker) chip.type = "button";
    chip.className = "supply-chain-node" + (node.ticker ? "" : " no-ticker");
    chip.innerHTML = `<strong>${node.name}</strong><span class="muted">${node.ticker ? node.ticker : "No ticker"}</span><span class="supply-chain-node-role">${node.role}</span>`;
    if (node.ticker) chip.addEventListener("click", () => loadTicker(node.ticker));
    nodesEl.appendChild(chip);
  });

  const relEl = wrap.querySelector(".supply-chain-relationships");
  SUPPLY_CHAIN_RELATIONSHIPS.forEach(rel => {
    const aTicker = findNodeTicker(rel.a);
    const bTicker = findNodeTicker(rel.b);
    const card = document.createElement("div");
    card.className = "supply-chain-rel-card";
    card.innerHTML = `
      <div class="supply-chain-rel-header">
        <span class="supply-chain-rel-company${aTicker ? " linkable" : ""}" data-ticker="${aTicker || ""}">${rel.a}</span>
        <span class="supply-chain-rel-arrow">${prettyRelationship(rel.relationship)} →</span>
        <span class="supply-chain-rel-company${bTicker ? " linkable" : ""}" data-ticker="${bTicker || ""}">${rel.b}</span>
      </div>
      <p class="supply-chain-rel-desc">${rel.description}</p>
      ${rel.confidenceNote ? `<p class="supply-chain-rel-note">${rel.confidenceNote}</p>` : ""}
      <div class="supply-chain-rel-footer">
        <span class="supply-chain-rel-source">Source: ${rel.source}</span>
        <span class="supply-chain-confidence supply-chain-confidence-${rel.confidence.toLowerCase()}">${rel.confidence} confidence</span>
      </div>
    `;
    card.querySelectorAll(".linkable").forEach(el => {
      el.addEventListener("click", () => loadTicker(el.dataset.ticker));
    });
    relEl.appendChild(card);
  });

  homeContentEl.appendChild(wrap);
}
