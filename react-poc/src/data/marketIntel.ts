// data/marketIntel.ts — the AI infrastructure supply-chain map: layers, companies,
// researched relationships and inferred links. Copied verbatim from ../../supplyChain.js
// (lines 26–198). Sourced links come from SUPPLY_CHAIN_RELATIONSHIPS; dashed links
// are the app's own inferred reasoning and are labelled as such.

export const MI_LAYERS = [
  { title: "AI labs & apps" },
  { title: "Cloud & hyperscalers" },
  { title: "AI infrastructure" },
  { title: "Chips & power gear" },
  { title: "Foundry & memory" },
  { title: "Tools & raw materials" },
];

// `layer` = column (0 = closest to the AI end user). Array order within a
// layer is top-to-bottom on screen, hand-ordered to keep lines uncrossed.
export const MI_NODES = [
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


export const SUPPLY_CHAIN_RELATIONSHIPS = [
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
export const MI_EDGES = [
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


// ---- One-line summaries + key figures for the researched relationships ----
// Written from each relationship's own `description` above (nothing added):
// the wall of text is still there, one click away, but the table view leads
// with a scannable summary and the headline number. Index = position in
// SUPPLY_CHAIN_RELATIONSHIPS.
export const MI_REL_META = [
  { short: "TSMC makes nearly all of NVIDIA's advanced GPUs; NVIDIA is set to become TSMC's largest customer in 2026.", fig: "#1 customer" },
  { short: "ASML is the only supplier of EUV lithography machines; TSMC, Intel and Samsung co-invested in its R&D.", fig: "Sole EUV supplier" },
  { short: "SK Hynix is NVIDIA's main supplier of HBM (high-bandwidth memory), with ~62% share and ~70% projected for HBM4.", fig: "~62% HBM share" },
  { short: "Secondary HBM supplier — shipped HBM4 samples in 2025 but trails SK Hynix in contracted volume.", fig: "HBM4 samples" },
  { short: "Launch partner building NVIDIA-certified rack-scale GPU servers; revenue depends heavily on NVIDIA GPU allocation.", fig: "GB200 / GB300" },
  { short: "Arista's data-center switches are used by both; each has been more than 10% of Arista's revenue (a disclosed concentration risk).", fig: ">10% of revenue each" },
  { short: "Broadcom has co-designed Google's custom TPU chips for seven generations; the partnership runs through 2031.", fig: "7 generations" },
  { short: "OpenAI is co-designing its own accelerator chips with Broadcom; production starts in H2 2026.", fig: "Up to 10 GW" },
  { short: "AMD will supply Instinct MI450 GPUs to OpenAI from 2026 to 2030 and expects $100B+ of revenue from the deal.", fig: "6 GW · $100B+" },
  { short: "Part of the chip deal: AMD issued OpenAI warrants for up to 160 million AMD shares (~10% potential stake).", fig: "160M warrants" },
  { short: "NVIDIA agreed to invest up to $100B in OpenAI as OpenAI deploys at least 10 GW of NVIDIA systems.", fig: "$100B · 10 GW" },
  { short: "Microsoft has committed $13B to OpenAI; OpenAI's API runs exclusively on Azure; $24.1B of Microsoft revenue is tied to it.", fig: "$13B invested" },
  { short: "Microsoft (up to $5B) and NVIDIA (up to $10B) are investing in Anthropic, which committed to buy $30B of Azure compute.", fig: "$30B Azure" },
  { short: "NVIDIA holds a stake in CoreWeave and agreed to buy $6.3B of its unused cloud capacity through 2032.", fig: "$6.3B order" },
  { short: "AWS is deploying 2 million more NVIDIA GPUs in 2027–28 while co-designing Trainium4 to work alongside NVIDIA hardware.", fig: "2M GPUs" },
  { short: "Meta's 2 GW+ AI buildout (~$115–135B of 2026 capex) relies heavily on NVIDIA GPUs.", fig: "$115–135B capex" },
  { short: "Meta also deploys AMD MI450 chips alongside NVIDIA to diversify supply.", fig: "MI450" },
  { short: "Intel Foundry won Microsoft as a customer for its 18A process, reportedly for the custom 'Maia 2' AI chip.", fig: "18A node" },
  { short: "Reportedly a smaller foundry arrangement with Amazon for custom AI chips on 18A — thinly sourced.", fig: "18A node" },
  { short: "NVIDIA discloses that four unnamed customers were 61% of a recent quarter's revenue; press infers they are the big hyperscalers.", fig: "61% of revenue" },
];

// ---- Other industries (placeholders — NOT built, no data invented) ----
// Chips above the map. Only AI & Semiconductors is a real, sourced map. The
// rest describe what a future map would show; the company names are
// illustrative examples of each layer (well-known participants), not
// researched or sourced relationships, and are labelled that way.
export const MI_INDUSTRIES = [
  { id: "ai", label: "AI & Semiconductors", live: true },
  { id: "energy", label: "Energy & Power", layers: ["Oil, gas & uranium producers", "Pipelines, LNG & refiners", "Utilities & power generators", "Grid equipment", "Businesses & households"], examples: ["ExxonMobil", "Chevron", "Cheniere", "Kinder Morgan", "NextEra", "Duke Energy", "GE Vernova", "Eaton"], chokepoints: "Oil shipping lanes such as the Strait of Hormuz, LNG export terminals, and multi-year lead times for large transformers.", why: "Every other industry sits downstream of energy — and AI's power appetite is now reshaping it." },
  { id: "ev", label: "Automotive & EV Batteries", layers: ["Lithium, nickel, cobalt & graphite miners", "Refiners & cell makers", "Battery packs & auto makers", "Charging & dealers"], examples: ["Albemarle", "SQM", "CATL", "LG Energy Solution", "Panasonic", "Tesla", "BYD", "Toyota"], chokepoints: "Battery-cell and graphite processing is concentrated in China; cobalt mining is concentrated in the DR Congo.", why: "The biggest physical supply-chain shift in autos in a century." },
  { id: "defense", label: "Defense & Aerospace", layers: ["Titanium, rare earths & specialty metals", "Engines, avionics, munitions & sensors", "Prime contractors", "Governments"], examples: ["Lockheed Martin", "RTX", "Northrop Grumman", "Boeing", "General Dynamics"], chokepoints: "Solid rocket motors, rare-earth magnets and a handful of sole-source engine and sensor suppliers.", why: "Concentrated suppliers and government-funded demand make dependencies unusually visible." },
  { id: "pharma", label: "Pharma & Healthcare", layers: ["Chemical & API ingredient makers", "Contract manufacturers (CDMOs)", "Drug developers", "Wholesalers & pharmacy managers", "Hospitals & patients"], examples: ["Lonza", "Thermo Fisher", "Pfizer", "Eli Lilly", "McKesson", "Cencora"], chokepoints: "Active-ingredient production concentrated in India and China; limited sterile-injectable capacity.", why: "Drug shortages come from exactly these hidden dependencies." },
  { id: "consumer", label: "Consumer & Retail", layers: ["Raw materials & factories", "Brands", "Freight & logistics", "Retailers", "Consumers"], examples: ["Nike", "Apple", "Procter & Gamble", "Walmart", "Amazon", "Target"], chokepoints: "Container ports and a small number of shipping lines.", why: "Shows how tariffs, shipping costs and inventory swings reach shelves." },
  { id: "food", label: "Food & Agriculture", layers: ["Fertilizer, seed & chemicals", "Farmers & commodity traders", "Food processors", "Grocers & restaurants"], examples: ["Nutrien", "Corteva", "ADM", "Bunge", "Nestlé", "Kraft Heinz"], chokepoints: "Potash and nitrogen fertilizer supply; grain export corridors like the Black Sea.", why: "Links weather, energy prices and geopolitics to food inflation." },
  { id: "finance", label: "Financial Plumbing", layers: ["Merchants & consumers", "Card networks & payment apps", "Processors & banks", "Clearing houses & settlement", "Central banks"], examples: ["Visa", "Mastercard", "PayPal", "Fiserv", "JPMorgan", "DTCC"], chokepoints: "A small number of clearing and settlement utilities that nearly everything routes through.", why: "The infrastructure nobody sees until it breaks." },
  { id: "telecom", label: "Telecom & Space", layers: ["Chips, satellites & launch", "Network equipment", "Carriers & satellite operators", "Apps & devices"], examples: ["Rocket Lab", "Ericsson", "Nokia", "Cisco", "Verizon", "AT&T"], chokepoints: "Radio spectrum, subsea cables and launch capacity.", why: "Connectivity is the layer under every digital business." },
  { id: "minerals", label: "Critical Minerals", layers: ["Mines", "Processors & refiners", "Component makers", "Chips, EVs, defense & energy"], examples: ["Freeport-McMoRan", "MP Materials", "Albemarle", "Cameco"], chokepoints: "Refining and processing capacity — often far more concentrated than mining itself.", why: "The deepest layer beneath most other maps here." },
  { id: "shipping", label: "Shipping & Logistics", layers: ["Ports & canals", "Container lines & tankers", "Freight forwarders", "Manufacturers & retailers"], examples: ["Maersk", "DHL", "Kuehne+Nagel", "FedEx", "UPS"], chokepoints: "The Suez and Panama canals and the Strait of Malacca.", why: "Where geopolitics turns into delivery times and prices." },
  { id: "realestate", label: "Real Estate & Construction", layers: ["Cement, steel & lumber", "Builders & developers", "Lenders", "Buyers & tenants"], examples: ["Vulcan Materials", "D.R. Horton", "Lennar", "Prologis"], chokepoints: "Interest rates, land availability and building-material costs.", why: "Ties mortgage rates and material costs to housing supply." },
];

