// sectors.js — the Sectors page (2026-09-27): a performance heatmap of the 11
// S&P 500 sectors plus ~50 industry/theme ETFs, a sortable data table, and
// a detail panel that opens when a sector or industry is clicked.
//
// WHAT'S LIVE vs CURATED, so nothing is mistaken for something it isn't:
// - Prices and performance (1D, 5D, month, 3M, 6M, YTD, 1Y, beta, 52-week
//   range, volume) are LIVE, from each sector's tracking ETF via Finnhub's
//   quote + metric endpoints (every ticker here was live-checked on
//   2026-09-27). An ETF is a proxy for its sector, not the sector itself.
// - Descriptions, "what drives it", "what to watch", the cyclical/defensive
//   character, and the "representative companies" lists are CURATED general
//   knowledge — well-known large participants, NOT the ETF's live holdings
//   (ETF holdings data is paywalled on every free tier the project checked;
//   see BLOCKERS.md). The panel labels them that way.
//
// Finnhub's free tier is 60 calls/minute shared by every visitor, so the page
// loads in stages through the throttle in dataUtils.js: the 11 sectors and
// the S&P 500 benchmark first, industries after (progressively), and the
// per-ETF performance metrics only for the sectors — or for whatever you
// click, or when you press "Load all performance data".

const SECTORS = [
  { id: "tech", name: "Technology", etf: "XLK",
    desc: "Software, semiconductors, hardware, IT services and networking — the companies building the digital economy and, increasingly, AI.",
    drivers: ["AI and data-center spending by the big cloud companies", "Corporate IT budgets and the software subscription cycle", "Semiconductor supply, pricing and export rules", "Interest rates — long-dated growth earnings are valued lower when yields rise"],
    watch: ["Cloud providers' capital-spending guidance", "Semiconductor inventory and lead times", "10-year real yield (Market Data page)"],
    character: "Growth · rate-sensitive · cyclical in hardware, steadier in software",
    reps: [["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "NVIDIA"], ["AVGO", "Broadcom"], ["ORCL", "Oracle"], ["CRM", "Salesforce"], ["AMD", "AMD"], ["ADBE", "Adobe"]],
    industries: [
      { id: "semis", name: "Semiconductors", etf: "SMH", desc: "Chip designers, foundries and equipment makers.", reps: ["NVDA", "TSM", "AVGO", "AMD", "ASML", "MU", "INTC", "QCOM"] },
      { id: "software", name: "Software", etf: "IGV", desc: "Enterprise and consumer software and cloud applications.", reps: ["MSFT", "ORCL", "CRM", "ADBE", "NOW", "INTU", "PLTR"] },
      { id: "cyber", name: "Cybersecurity", etf: "CIBR", desc: "Companies selling network, endpoint and identity security.", reps: ["CRWD", "FTNT", "ZS", "CSCO", "NET", "OKTA", "CHKP"] },
      { id: "cloud", name: "Cloud Computing", etf: "SKYY", desc: "Cloud infrastructure and software-as-a-service providers.", reps: ["MSFT", "AMZN", "GOOGL", "ORCL", "CRM", "SNOW", "NET", "MDB"] },
      { id: "ai", name: "AI & Robotics", etf: "BOTZ", desc: "Robotics, automation and AI-related hardware and software.", reps: ["NVDA", "ISRG", "KEYS", "TER", "PATH", "SYM"] },
      { id: "aietf", name: "AI & Big Data", etf: "AIQ", desc: "A broader basket of artificial-intelligence and big-data beneficiaries.", reps: ["NVDA", "MSFT", "GOOGL", "META", "AMZN", "TSM", "PLTR", "SNOW"] },
    ] },
  { id: "comm", name: "Communication Services", etf: "XLC",
    desc: "Telecom carriers, internet platforms, streaming, media and video games.",
    drivers: ["Digital advertising demand", "Streaming subscriber growth and content costs", "Carrier pricing, network spending and subscriber churn", "Regulation of large internet platforms"],
    watch: ["Advertising spending trends", "Streaming subscriber and pricing news", "Telecom capital spending"],
    character: "Mixed — growth in internet platforms, defensive in telecom",
    reps: [["GOOGL", "Alphabet"], ["META", "Meta"], ["NFLX", "Netflix"], ["DIS", "Disney"], ["T", "AT&T"], ["VZ", "Verizon"], ["TMUS", "T-Mobile"], ["CMCSA", "Comcast"]],
    industries: [
      { id: "internet", name: "Internet & Media", etf: "FDN", desc: "Large internet, e-commerce and online-media companies.", reps: ["AMZN", "META", "NFLX", "GOOGL", "BKNG", "UBER", "SHOP", "DASH"] },
      { id: "gaming", name: "Video Games & Esports", etf: "ESPO", desc: "Game developers, platforms and esports businesses.", reps: ["NVDA", "RBLX", "TTWO", "SONY", "NTES", "U", "AMD"] },
      { id: "entertainment", name: "Leisure & Entertainment", etf: "PEJ", desc: "Cruise lines, casinos, theme parks and live events.", reps: ["DIS", "CCL", "RCL", "LVS", "MAR", "LYV", "WYNN", "MGM"] },
    ] },
  { id: "disc", name: "Consumer Discretionary", etf: "XLY",
    desc: "Non-essential spending: e-commerce, autos, homebuilding, restaurants, apparel and travel.",
    drivers: ["Consumer confidence, jobs and wage growth", "Interest rates and credit availability (autos, housing)", "Tariffs and import costs", "Gas and food prices squeezing budgets"],
    watch: ["Retail sales and consumer sentiment", "Mortgage rates", "Auto loan delinquencies"],
    character: "Cyclical — rises with consumer spending, falls in downturns",
    reps: [["AMZN", "Amazon"], ["TSLA", "Tesla"], ["HD", "Home Depot"], ["MCD", "McDonald's"], ["NKE", "Nike"], ["LOW", "Lowe's"], ["SBUX", "Starbucks"], ["BKNG", "Booking"]],
    industries: [
      { id: "retail", name: "Retail", etf: "XRT", desc: "Equal-weighted basket of US retailers, big and small.", reps: ["AMZN", "WMT", "COST", "TGT", "HD", "LOW", "TJX", "ROST"] },
      { id: "homebuilders", name: "Homebuilders", etf: "XHB", desc: "Homebuilders and home-related suppliers.", reps: ["DHI", "LEN", "PHM", "NVR", "TOL", "HD", "LOW", "BLDR"] },
      { id: "ecommerce", name: "Online Retail", etf: "ONLN", desc: "Companies that sell primarily online.", reps: ["AMZN", "SHOP", "MELI", "EBAY", "ETSY", "W", "CHWY", "BABA"] },
      { id: "autos", name: "Autos", etf: "CARZ", desc: "Vehicle makers and suppliers.", reps: ["TSLA", "TM", "F", "GM", "HMC", "STLA", "RACE", "BYDDY"] },
      { id: "travel", name: "Travel & Vacation", etf: "AWAY", desc: "Online travel, hotels and booking platforms.", reps: ["BKNG", "ABNB", "EXPE", "MAR", "HLT", "TRIP", "UBER", "LYFT"] },
    ] },
  { id: "staples", name: "Consumer Staples", etf: "XLP",
    desc: "Everyday necessities: food, beverages, household products, tobacco and big-box grocery/discount retail.",
    drivers: ["Pricing power versus input costs", "Volume trends and private-label competition", "Currency effects for multinationals", "Investors seeking safety when growth slows"],
    watch: ["Commodity and packaging costs", "Grocery price inflation", "Defensive rotation (money moving out of growth)"],
    character: "Defensive — steady demand in most economic conditions",
    reps: [["PG", "Procter & Gamble"], ["KO", "Coca-Cola"], ["PEP", "PepsiCo"], ["COST", "Costco"], ["WMT", "Walmart"], ["PM", "Philip Morris"], ["MDLZ", "Mondelez"], ["CL", "Colgate-Palmolive"]],
    industries: [] },
  { id: "health", name: "Health Care", etf: "XLV",
    desc: "Drugmakers, biotech, medical devices, insurers and care providers.",
    drivers: ["Drug approvals and patent expirations", "Drug-pricing and Medicare/Medicaid policy", "Aging demographics", "Innovation cycles such as GLP-1 obesity drugs"],
    watch: ["FDA decisions and trial results", "Policy and pricing headlines", "Managed-care cost trends"],
    character: "Defensive-growth — steady demand, event-driven risk",
    reps: [["LLY", "Eli Lilly"], ["UNH", "UnitedHealth"], ["JNJ", "Johnson & Johnson"], ["ABBV", "AbbVie"], ["MRK", "Merck"], ["TMO", "Thermo Fisher"], ["ABT", "Abbott"], ["PFE", "Pfizer"]],
    industries: [
      { id: "biotech", name: "Biotech (equal-weight)", etf: "XBI", desc: "Small and mid-sized biotech, heavily driven by trial outcomes.", reps: ["VRTX", "REGN", "MRNA", "BIIB", "ALNY", "INCY", "NBIX", "BMRN"] },
      { id: "bigbiotech", name: "Biotech (large-cap)", etf: "IBB", desc: "Larger, more established biotech companies.", reps: ["VRTX", "AMGN", "GILD", "REGN", "BIIB", "MRNA", "ILMN", "ALNY"] },
      { id: "pharma", name: "Pharmaceuticals", etf: "XPH", desc: "Drug developers and specialty pharma.", reps: ["LLY", "JNJ", "MRK", "PFE", "BMY", "ABBV", "ZTS", "VTRS"] },
      { id: "devices", name: "Medical Devices", etf: "IHI", desc: "Device, diagnostics and surgical-equipment makers.", reps: ["ABT", "ISRG", "MDT", "SYK", "BSX", "EW", "DXCM", "ZBH"] },
      { id: "providers", name: "Care Providers & Insurers", etf: "IHF", desc: "Health insurers, hospital operators and services.", reps: ["UNH", "ELV", "CI", "HCA", "CVS", "HUM", "CNC", "MOH"] },
    ] },
  { id: "fin", name: "Financials", etf: "XLF",
    desc: "Banks, insurers, asset managers, payment networks and capital-markets firms.",
    drivers: ["The yield curve — banks earn the spread between long and short rates", "Credit quality (loan defaults)", "Capital-markets activity: IPOs, M&A, trading", "Bank regulation"],
    watch: ["Yield curve slope (Market Data page)", "Credit spreads", "Loan-loss provisions"],
    character: "Cyclical — tied to growth, rates and credit",
    reps: [["JPM", "JPMorgan"], ["V", "Visa"], ["MA", "Mastercard"], ["BAC", "Bank of America"], ["WFC", "Wells Fargo"], ["GS", "Goldman Sachs"], ["MS", "Morgan Stanley"], ["AXP", "American Express"]],
    industries: [
      { id: "banks", name: "Banks", etf: "KBE", desc: "Large and mid-sized banks.", reps: ["JPM", "BAC", "WFC", "C", "USB", "PNC", "TFC", "SCHW"] },
      { id: "regional", name: "Regional Banks", etf: "KRE", desc: "Smaller US banks — sensitive to deposits and commercial real estate.", reps: ["FITB", "HBAN", "RF", "KEY", "CFG", "MTB", "ZION"] },
      { id: "insurance", name: "Insurance", etf: "KIE", desc: "Property, casualty, life and reinsurance companies.", reps: ["PGR", "TRV", "ALL", "CB", "AIG", "MET", "PRU", "AFL"] },
      { id: "capmkts", name: "Capital Markets", etf: "IAI", desc: "Brokers, exchanges and investment banks.", reps: ["GS", "MS", "SCHW", "CME", "ICE", "SPGI", "MCO", "IBKR"] },
      { id: "fintech", name: "Fintech", etf: "FINX", desc: "Payments, digital banking and financial-software innovators.", reps: ["PYPL", "XYZ", "FISV", "FIS", "GPN", "AFRM", "TOST", "SOFI"] },
      { id: "blockchain", name: "Blockchain & Digital Assets", etf: "BLOK", desc: "Companies tied to blockchain technology and crypto.", reps: ["COIN", "MSTR", "MARA", "RIOT", "HOOD", "XYZ", "PYPL", "IBM"] },
    ] },
  { id: "energy", name: "Energy", etf: "XLE",
    desc: "Oil and gas producers, refiners, pipelines and oilfield services.",
    drivers: ["Crude oil and natural gas prices", "OPEC+ production decisions and geopolitics", "Refining margins", "Global demand, especially from China and India"],
    watch: ["WTI crude (Market Data page)", "OPEC+ announcements", "US inventory and rig-count data"],
    character: "Cyclical / commodity-driven — often moves with inflation",
    reps: [["XOM", "ExxonMobil"], ["CVX", "Chevron"], ["COP", "ConocoPhillips"], ["SLB", "SLB"], ["EOG", "EOG Resources"], ["MPC", "Marathon Petroleum"], ["PSX", "Phillips 66"], ["OXY", "Occidental"]],
    industries: [
      { id: "ep", name: "Oil & Gas Exploration", etf: "XOP", desc: "Producers most directly tied to oil and gas prices.", reps: ["COP", "EOG", "OXY", "DVN", "FANG", "APA"] },
      { id: "services", name: "Oil Services", etf: "OIH", desc: "Drillers and oilfield-service providers.", reps: ["SLB", "HAL", "BKR", "NOV", "FTI", "RIG", "TS", "WHD"] },
      { id: "cleanenergy", name: "Clean Energy", etf: "ICLN", desc: "Global renewable-energy producers and equipment makers.", reps: ["FSLR", "ENPH", "VWDRY", "PLUG", "BEP", "SEDG", "RUN", "ORA"] },
      { id: "solar", name: "Solar", etf: "TAN", desc: "Solar panel makers, installers and developers.", reps: ["FSLR", "ENPH", "NXT", "SEDG", "RUN", "ARRY", "CSIQ", "JKS"] },
      { id: "wind", name: "Wind", etf: "FAN", desc: "Wind-turbine makers and wind-power operators.", reps: ["GEV", "VWDRY", "NEE", "BEP", "CWEN", "ORA"] },
      { id: "uranium", name: "Uranium", etf: "URA", desc: "Uranium miners and nuclear-fuel-related companies.", reps: ["CCJ", "NXE", "UEC", "DNN", "URG", "LEU", "SRUUF", "UUUU"] },
      { id: "nuclear", name: "Nuclear Energy", etf: "NLR", desc: "Nuclear power operators, equipment and fuel companies.", reps: ["CEG", "CCJ", "BWXT", "VST", "LEU", "SMR", "OKLO", "NNE"] },
    ] },
  { id: "ind", name: "Industrials", etf: "XLI",
    desc: "Aerospace and defense, machinery, transportation, construction and business services.",
    drivers: ["Corporate capital spending and manufacturing activity", "Infrastructure and defense budgets", "Air travel and freight volumes", "Supply-chain disruptions and input costs"],
    watch: ["Manufacturing PMIs", "Government infrastructure and defense spending", "Freight and airline traffic data"],
    character: "Cyclical — tracks the business investment cycle",
    reps: [["GE", "GE Aerospace"], ["CAT", "Caterpillar"], ["RTX", "RTX"], ["HON", "Honeywell"], ["UNP", "Union Pacific"], ["BA", "Boeing"], ["LMT", "Lockheed Martin"], ["DE", "Deere"]],
    industries: [
      { id: "defense", name: "Aerospace & Defense", etf: "ITA", desc: "Defense primes, aircraft and aerospace suppliers.", reps: ["RTX", "BA", "LMT", "GD", "NOC", "GE", "TDG", "HWM"] },
      { id: "space", name: "Aerospace (equal-weight)", etf: "XAR", desc: "An equal-weighted mix of large and small aerospace and defense firms.", reps: ["RKLB", "AXON", "KTOS", "HEI", "TDG", "LDOS", "CW", "HII"] },
      { id: "transport", name: "Transportation", etf: "IYT", desc: "Railroads, trucking, airlines and shipping.", reps: ["UNP", "UPS", "FDX", "CSX", "NSC", "DAL", "UAL", "ODFL"] },
      { id: "airlines", name: "Airlines", etf: "JETS", desc: "US and global airlines — highly sensitive to fuel and demand.", reps: ["DAL", "UAL", "AAL", "LUV", "ALK", "JBLU", "RYAAY", "SKYW"] },
      { id: "infra", name: "US Infrastructure", etf: "PAVE", desc: "Companies that build and supply US infrastructure.", reps: ["PWR", "URI", "VMC", "MLM", "DE", "CAT", "EMR", "NUE"] },
    ] },
  { id: "materials", name: "Materials", etf: "XLB",
    desc: "Chemicals, metals and mining, construction materials, paper and packaging.",
    drivers: ["Global manufacturing demand, especially China", "Commodity prices and the US dollar", "Energy costs for chemical makers", "Construction activity"],
    watch: ["Copper price as a growth signal", "US dollar index (Market Data page)", "China industrial data"],
    character: "Cyclical / commodity-driven",
    reps: [["LIN", "Linde"], ["SHW", "Sherwin-Williams"], ["FCX", "Freeport-McMoRan"], ["NEM", "Newmont"], ["APD", "Air Products"], ["ECL", "Ecolab"], ["NUE", "Nucor"], ["DOW", "Dow"]],
    industries: [
      { id: "mining", name: "Metals & Mining", etf: "XME", desc: "Steel, aluminum, coal and diversified miners.", reps: ["FCX", "NEM", "NUE", "STLD", "AA", "CLF", "CENX", "HCC"] },
      { id: "gold", name: "Gold Miners", etf: "GDX", desc: "Producers of gold — often a hedge against inflation and fear.", reps: ["NEM", "AEM", "GOLD", "FNV", "WPM", "KGC", "AU", "GFI"] },
      { id: "juniorgold", name: "Junior Gold Miners", etf: "GDXJ", desc: "Smaller, higher-risk gold and silver miners.", reps: ["AGI", "EQX", "OGC", "BTG", "IAG", "CDE", "HL"] },
      { id: "silver", name: "Silver Miners", etf: "SIL", desc: "Silver producers, sensitive to both precious- and industrial-metal demand.", reps: ["WPM", "PAAS", "AG", "CDE", "HL", "FSM", "EXK"] },
      { id: "copper", name: "Copper Miners", etf: "COPX", desc: "Copper producers — copper is a bellwether for global growth and electrification.", reps: ["FCX", "SCCO", "TECK", "BHP", "RIO", "HBM"] },
      { id: "steel", name: "Steel", etf: "SLX", desc: "Steelmakers and iron-ore miners.", reps: ["NUE", "STLD", "CLF", "MT", "TX", "RS", "CMC", "RIO"] },
      { id: "lithium", name: "Lithium & Batteries", etf: "LIT", desc: "Lithium miners and battery makers for EVs and storage.", reps: ["ALB", "SQM", "TSLA", "ENS"] },
      { id: "rareearth", name: "Rare Earths & Strategic Metals", etf: "REMX", desc: "Rare-earth, lithium and other strategic-metal producers.", reps: ["MP", "ALB", "SQM", "LAC", "SGML"] },
      { id: "agri", name: "Agribusiness", etf: "MOO", desc: "Fertilizer, seed, farm equipment and crop-trading companies.", reps: ["DE", "ZTS", "NTR", "CTVA", "ADM", "TSN", "MOS", "CF"] },
      { id: "timber", name: "Timber & Forestry", etf: "WOOD", desc: "Forestry, paper and lumber producers.", reps: ["WY", "RYN", "UFPI", "SLVM", "MERC", "SJ"] },
    ] },
  { id: "realestate", name: "Real Estate", etf: "XLRE",
    desc: "REITs owning offices, warehouses, apartments, cell towers, data centers and shopping centers.",
    drivers: ["Interest rates — REITs compete with bonds for income investors", "Occupancy and rent growth", "Property values and financing costs", "Demand shifts such as remote work and e-commerce"],
    watch: ["10-year Treasury yield (Market Data page)", "Mortgage rates", "Commercial-property vacancy data"],
    character: "Rate-sensitive · income-oriented · property-cycle driven",
    reps: [["PLD", "Prologis"], ["AMT", "American Tower"], ["EQIX", "Equinix"], ["WELL", "Welltower"], ["SPG", "Simon Property"], ["O", "Realty Income"], ["PSA", "Public Storage"], ["DLR", "Digital Realty"]],
    industries: [
      { id: "reit", name: "US REITs", etf: "VNQ", desc: "The broad US real-estate investment trust universe.", reps: ["PLD", "AMT", "EQIX", "WELL", "SPG", "O", "PSA", "DLR"] },
      { id: "mreit", name: "Mortgage REITs", etf: "REM", desc: "REITs that hold mortgages rather than buildings.", reps: ["AGNC", "NLY", "STWD", "BXMT", "RITM", "ABR", "TWO", "MFA"] },
      { id: "datacenter", name: "Data Centers & Tech Real Estate", etf: "SRVR", desc: "Data centers, cell towers and digital infrastructure.", reps: ["EQIX", "DLR", "AMT", "CCI", "SBAC", "IRM", "UNIT"] },
    ] },
  { id: "utilities", name: "Utilities", etf: "XLU",
    desc: "Electric, gas and water utilities, plus independent power producers.",
    drivers: ["Interest rates — utilities are often treated as bond proxies", "Regulated rates and allowed returns", "Power demand growth from electrification and data centers", "Fuel costs and weather"],
    watch: ["10-year Treasury yield (Market Data page)", "Electricity demand forecasts", "Rate-case decisions"],
    character: "Defensive · rate-sensitive · dividend-oriented",
    reps: [["NEE", "NextEra Energy"], ["SO", "Southern Co."], ["DUK", "Duke Energy"], ["CEG", "Constellation"], ["AEP", "AEP"], ["SRE", "Sempra"], ["D", "Dominion"], ["XEL", "Xcel"]],
    industries: [
      { id: "water", name: "Water", etf: "PHO", desc: "Water utilities, treatment and infrastructure companies.", reps: ["XYL", "WAT", "AWK", "PNR", "ECL", "WTRG", "FERG", "MWA"] },
      { id: "globalinfra", name: "Global Infrastructure", etf: "IGF", desc: "Utilities, pipelines, airports and toll roads worldwide.", reps: ["NEE", "ENB", "TRP", "WMB", "SO", "DUK", "CNI"] },
    ] },
];

const SECTOR_BENCHMARK = "SPY";
const SECTOR_ITEMS = [];
SECTORS.forEach(sec => {
  SECTOR_ITEMS.push({ id: sec.id, name: sec.name, etf: sec.etf, type: "sector", parent: null, desc: sec.desc, sec });
  sec.industries.forEach(ind => SECTOR_ITEMS.push({ id: `${sec.id}:${ind.id}`, name: ind.name, etf: ind.etf, type: "industry", parent: sec.id, desc: ind.desc, ind, sec }));
});
const SECTOR_ITEM_BY_ID = Object.fromEntries(SECTOR_ITEMS.map(i => [i.id, i]));

// Each sector/industry here tracks via exactly ONE proxy ETF — but
// etfs.js's ETF_CATEGORIES often groups several ETFs around that same
// theme (e.g. tech's XLK sits alongside VGT/FTEC/IYW/SMH/SOXX/IGV/FDN in
// its "Technology & semiconductors" category). Added 2026-10-01 so
// clicking a sector/industry can show those other options too, not just
// the single tracking ETF — Jozsua's request. Reads etfs.js's data at
// CALL time, not at file-load time (etfs.js loads after this file — see
// this app's own documented script-order gotcha in CLAUDE.md), so this
// must only be called from inside a function, never at this file's top
// level. Excludes the "sec-spdr" category on purpose: its 11 items are
// one-ETF-per-sector (the same shape this page already shows), not
// multiple funds on the same theme, so including it would just echo
// sibling sectors back as if they were "more options for this one".
function sectorRelatedEtfs(etfTicker) {
  if (typeof ETF_CATEGORIES === "undefined") return [];
  const cat = ETF_CATEGORIES.find(c => c.id !== "sec-spdr" && !c.dynamicGroup && c.items.some(([t]) => t === etfTicker));
  return cat ? cat.items.filter(([t]) => t !== etfTicker) : [];
}

const sectorsState = { view: "sectors", selected: null, sort: { key: "d1", dir: -1 }, started: false, allMetricsRequested: false };

// ---------------- data access ----------------
const secQuote = etf => getFreshCache(QUOTE_CACHE, etf, 10 * 60 * 1000);
const secMetric = etf => getFreshCache(METRIC_CACHE, etf, METRIC_TTL_MS);
const M = (m, k) => (m && isNum(m[k]) ? m[k] : null);

const SEC_COLS = [
  { key: "name", label: "Sector / industry", get: i => i.name, text: true },
  { key: "etf", label: "ETF", get: i => i.etf, text: true },
  { key: "price", label: "Price", get: i => secQuote(i.etf)?.c },
  { key: "d1", label: "1D", get: i => secQuote(i.etf)?.dp, pct: true },
  { key: "d5", label: "5D", get: i => M(secMetric(i.etf), "5DayPriceReturnDaily"), pct: true },
  { key: "mtd", label: "MTD", get: i => M(secMetric(i.etf), "monthToDatePriceReturnDaily"), pct: true },
  { key: "m3", label: "3M", get: i => M(secMetric(i.etf), "13WeekPriceReturnDaily"), pct: true },
  { key: "m6", label: "6M", get: i => M(secMetric(i.etf), "26WeekPriceReturnDaily"), pct: true },
  { key: "ytd", label: "YTD", get: i => M(secMetric(i.etf), "yearToDatePriceReturnDaily"), pct: true },
  { key: "y1", label: "1Y", get: i => M(secMetric(i.etf), "52WeekPriceReturnDaily"), pct: true },
  { key: "rel", label: "YTD vs S&P", get: i => { const a = M(secMetric(i.etf), "yearToDatePriceReturnDaily"), b = M(secMetric(SECTOR_BENCHMARK), "yearToDatePriceReturnDaily"); return a !== null && b !== null ? a - b : null; }, pct: true },
  { key: "beta", label: "Beta", get: i => M(secMetric(i.etf), "beta"), fmt: v => v.toFixed(2) },
  { key: "range", label: "52W range", get: i => { const q = secQuote(i.etf), m = secMetric(i.etf); const lo = M(m, "52WeekLow"), hi = M(m, "52WeekHigh"); return q && lo !== null && hi !== null && hi > lo ? (q.c - lo) / (hi - lo) : null; }, range: true },
  { key: "vol", label: "Avg vol 10d", get: i => M(secMetric(i.etf), "10DayAverageTradingVolume"), fmt: v => `${v.toFixed(1)}M` },
];

// ---------------- page ----------------
function renderSectorsPage() {
  const root = document.getElementById("sectorsRoot");
  if (!root) return;
  if (!root.dataset.built) {
    root.dataset.built = "1";
    root.innerHTML = `
      <div class="sec-toolbar">
        <div class="sec-summary" id="secSummary"></div>
        <div class="sec-seg" id="secViewSeg">
          <button type="button" data-view="sectors" class="active">11 Sectors</button>
          <button type="button" data-view="industries">${SECTOR_ITEMS.filter(i => i.type === "industry").length} Industries & themes</button>
          <button type="button" data-view="all">All</button>
        </div>
      </div>
      <div class="sec-legend"><span>−4%</span><span class="stock-heatmap-legend-bar"></span><span>+4%</span><span class="muted small">tile color = today's move in the sector's tracking ETF · click a tile for the full breakdown</span></div>
      <div id="secHeatmap"></div>`;
    document.querySelectorAll("#secViewSeg button").forEach(b => b.addEventListener("click", () => {
      sectorsState.view = b.dataset.view;
      document.querySelectorAll("#secViewSeg button").forEach(x => x.classList.toggle("active", x === b));
      paintSectorHeatmap(); paintSectorTable();
    }));
    document.getElementById("secTableRoot").innerHTML = `
      <div class="sec-table-head">
        <h3>All sectors & industries — data table <span class="card-subtitle">click a column to sort · click a row for the breakdown</span></h3>
        <div class="sec-table-actions"><span class="muted small" id="secProgress"></span><button type="button" class="cp-btn cp-btn-ghost" id="secLoadAll">Load performance data for all industries</button></div>
      </div>
      <div class="crypto-table-scroll"><table class="crypto-table quotes-table sec-table" id="secTable"></table></div>
      <p class="muted small">Performance columns come from Finnhub's ETF metrics (price return, not total return). They load for the 11 sectors automatically and for any industry you open — or press the button to load every industry (about one call each, paced to respect the free tier's 60/min).</p>`;
    document.getElementById("secLoadAll").addEventListener("click", loadAllSectorMetrics);
  }
  paintSectorHeatmap(); paintSectorTable(); paintSectorSummary();
  if (!sectorsState.started) { sectorsState.started = true; startSectorLoading(); }
  else refreshStaleSectorQuotes();
  if (sectorsState.selected) renderSectorDetail(sectorsState.selected);
}

function visibleSectorItems() {
  if (sectorsState.view === "sectors") return SECTOR_ITEMS.filter(i => i.type === "sector");
  if (sectorsState.view === "industries") return SECTOR_ITEMS.filter(i => i.type === "industry");
  return SECTOR_ITEMS;
}

// Stage 1: sectors + benchmark (fast). Stage 2: industries (paced).
async function startSectorLoading() {
  const sectorEtfs = [SECTOR_BENCHMARK, ...SECTOR_ITEMS.filter(i => i.type === "sector").map(i => i.etf)];
  await loadQuotesThrottled(sectorEtfs, () => { paintSectorHeatmap(); paintSectorTable(); paintSectorSummary(); }, { concurrency: 3, gapMs: 250 });
  // performance metrics for the 11 sectors + the benchmark (12 calls)
  loadSectorMetrics(sectorEtfs);
  const indEtfs = SECTOR_ITEMS.filter(i => i.type === "industry").map(i => i.etf);
  loadQuotesThrottled(indEtfs, () => { paintSectorHeatmap(); paintSectorTable(); }, { concurrency: 2, gapMs: 900 });
}
function refreshStaleSectorQuotes() {
  loadQuotesThrottled(SECTOR_ITEMS.map(i => i.etf), () => { paintSectorHeatmap(); paintSectorTable(); paintSectorSummary(); }, { concurrency: 2, gapMs: 700 });
}
function loadSectorMetrics(etfs) {
  return runThrottled([...new Set(etfs)].map(etf => async () => { await fetchMetricCached(etf); paintSectorTable(); if (sectorsState.selected && SECTOR_ITEM_BY_ID[sectorsState.selected]?.etf === etf) renderSectorDetail(sectorsState.selected); }), { concurrency: 2, gapMs: 900 });
}
async function loadAllSectorMetrics() {
  if (sectorsState.allMetricsRequested) return;
  sectorsState.allMetricsRequested = true;
  const btn = document.getElementById("secLoadAll"), prog = document.getElementById("secProgress");
  btn.disabled = true;
  const etfs = SECTOR_ITEMS.map(i => i.etf).filter(e => !secMetric(e));
  let done = 0;
  await runThrottled(etfs.map(etf => async () => { await fetchMetricCached(etf); done++; prog.textContent = `${done}/${etfs.length} loaded`; paintSectorTable(); }), { concurrency: 2, gapMs: 900 });
  prog.textContent = "All performance data loaded";
}

function paintSectorSummary() {
  const el = document.getElementById("secSummary");
  if (!el) return;
  const secs = SECTOR_ITEMS.filter(i => i.type === "sector").map(i => ({ i, q: secQuote(i.etf) })).filter(x => x.q);
  if (secs.length < 3) { el.innerHTML = '<span class="muted small">Loading sector prices…</span>'; return; }
  const sorted = [...secs].sort((a, b) => b.q.dp - a.q.dp);
  const up = secs.filter(x => x.q.dp > 0).length;
  el.innerHTML = `<span><strong class="positive">${up}</strong> of ${secs.length} sectors up</span><span>Leader <strong class="positive">${sorted[0].i.name} ${fmtPctVal(sorted[0].q.dp)}</strong></span><span>Laggard <strong class="negative">${sorted[sorted.length - 1].i.name} ${fmtPctVal(sorted[sorted.length - 1].q.dp)}</strong></span>`;
}

// Uniform-size tiles (fixed row height) so no tile is bigger than another.
function paintSectorHeatmap() {
  const el = document.getElementById("secHeatmap");
  if (!el) return;
  const tile = it => {
    const q = secQuote(it.etf);
    const bg = q ? heatColorScaled(q.dp, 4) : "var(--bg-surface-2)";
    return `<button type="button" class="sec-tile${sectorsState.selected === it.id ? " selected" : ""}" data-id="${it.id}" style="background:${bg}" title="${it.name} (${it.etf})">
      <span class="sec-tile-name">${it.name}</span>
      <span class="sec-tile-bottom"><span class="sec-tile-etf">${it.etf}</span><span class="sec-tile-pct">${q ? fmtPctVal(q.dp) : "…"}</span></span></button>`;
  };
  const items = visibleSectorItems();
  let html;
  if (sectorsState.view === "sectors") {
    html = `<div class="sec-grid">${[...items].sort((a, b) => (secQuote(b.etf)?.dp ?? -99) - (secQuote(a.etf)?.dp ?? -99)).map(tile).join("")}</div>`;
  } else {
    html = SECTORS.map(sec => {
      const rows = items.filter(i => (i.type === "sector" ? i.id : i.parent) === sec.id);
      if (!rows.length) return "";
      return `<div class="sec-group"><div class="sec-group-title">${sec.name}</div><div class="sec-grid">${[...rows].sort((a, b) => (secQuote(b.etf)?.dp ?? -99) - (secQuote(a.etf)?.dp ?? -99)).map(tile).join("")}</div></div>`;
    }).join("");
  }
  el.innerHTML = html;
  el.querySelectorAll(".sec-tile").forEach(t => t.addEventListener("click", () => openSector(t.dataset.id)));
}

// Like heatColor() but with a tighter scale (sectors rarely move more than ±4%).
function heatColorScaled(pct, range) {
  const clamped = Math.max(-range, Math.min(range, pct || 0));
  const intensity = 0.16 + (Math.abs(clamped) / range) * 0.6;
  return clamped >= 0 ? `rgba(27,175,122,${intensity})` : `rgba(208,59,59,${intensity})`;
}

function paintSectorTable() {
  const table = document.getElementById("secTable");
  if (!table) return;
  const { key, dir } = sectorsState.sort;
  const col = SEC_COLS.find(c => c.key === key) || SEC_COLS[3];
  const rows = [...SECTOR_ITEMS].sort((a, b) => {
    const av = col.get(a), bv = col.get(b);
    if (av == null && bv == null) return 0; if (av == null) return 1; if (bv == null) return -1;
    return col.text ? dir * String(av).localeCompare(String(bv)) : dir * (av - bv);
  });
  table.innerHTML = `<thead><tr>${SEC_COLS.map(c => `<th data-key="${c.key}" class="sortable-th${c.key === key ? " sorted" : ""}">${c.label}<span class="sort-arrow">${c.key === key ? (dir === 1 ? " ▲" : " ▼") : ""}</span></th>`).join("")}</tr></thead><tbody>${rows.map(it => `<tr data-id="${it.id}" class="crypto-table-row${sectorsState.selected === it.id ? " selected-row" : ""}">${SEC_COLS.map(c => {
    const v = c.get(it);
    if (c.key === "name") return `<td class="${it.type === "industry" ? "sec-indent" : ""}"><strong>${it.name}</strong>${it.type === "industry" ? `<span class="muted small"> · ${it.sec.name}</span>` : ""}</td>`;
    if (c.key === "etf") return `<td>${it.etf}</td>`;
    if (v == null) return '<td class="muted">—</td>';
    if (c.key === "price") return `<td>${formatCurrency(v)}</td>`;
    if (c.pct) return `<td class="${changeClass(v)}">${fmtPctVal(v, 2)}</td>`;
    if (c.range) return `<td class="quote-range-cell"><span class="day-range" title="Position within the 52-week range"><span class="day-range-marker" style="left:${(v * 100).toFixed(0)}%"></span></span></td>`;
    return `<td>${c.fmt ? c.fmt(v) : v}</td>`;
  }).join("")}</tr>`).join("")}</tbody>`;
  table.querySelectorAll("th").forEach(th => th.addEventListener("click", () => {
    const k = th.dataset.key;
    sectorsState.sort = { key: k, dir: sectorsState.sort.key === k ? -sectorsState.sort.dir : (k === "name" || k === "etf" ? 1 : -1) };
    paintSectorTable();
  }));
  table.querySelectorAll("tbody tr").forEach(tr => tr.addEventListener("click", () => openSector(tr.dataset.id, true)));
}

// ---------------- detail panel ----------------
function openSector(id, scroll) {
  sectorsState.selected = id;
  paintSectorHeatmap(); paintSectorTable();
  renderSectorDetail(id);
  const card = document.getElementById("sectorDetailCard");
  card.hidden = false;
  card.classList.remove("hidden");
  requestAnimationFrame(() => card.scrollIntoView({ behavior: "smooth", block: "start" }));
}

function renderSectorDetail(id) {
  const it = SECTOR_ITEM_BY_ID[id];
  const el = document.getElementById("sectorDetail");
  if (!it || !el) return;
  const sec = it.sec;
  const isSector = it.type === "sector";
  const q = secQuote(it.etf), m = secMetric(it.etf), sm = secMetric(SECTOR_BENCHMARK);
  const reps = isSector ? sec.reps : it.ind.reps.map(t => [t, t]);

  const perfKeys = [["5D", "5DayPriceReturnDaily"], ["MTD", "monthToDatePriceReturnDaily"], ["3M", "13WeekPriceReturnDaily"], ["6M", "26WeekPriceReturnDaily"], ["YTD", "yearToDatePriceReturnDaily"], ["1Y", "52WeekPriceReturnDaily"]];
  const rel = perfKeys.map(([label, k]) => ({ label, a: M(m, k), b: M(sm, k) })).filter(x => x.a !== null && x.b !== null);
  const relMax = Math.max(...rel.flatMap(x => [Math.abs(x.a), Math.abs(x.b)]), 1);

  const subIndustries = isSector ? sec.industries : [];
  const siblings = !isSector ? SECTOR_ITEMS.filter(x => x.parent === it.parent && x.id !== it.id) : [];
  const relatedEtfs = sectorRelatedEtfs(it.etf);

  el.innerHTML = `
    <div class="cp-head">
      <div>
        <h3>${it.name} <span class="ctag">${it.etf}</span> ${isSector ? '<span class="ctag ctag-brics">Sector</span>' : `<span class="ctag ctag-developed">Industry · ${sec.name}</span>`}</h3>
        <p class="muted small">${it.desc}</p>
      </div>
      <div class="cp-actions">
        <button type="button" class="cp-btn" id="secOpenEtf">Open ${it.etf} page →</button>
        ${!isSector ? `<button type="button" class="cp-btn cp-btn-ghost" id="secUp">↑ ${sec.name}</button>` : ""}
        <button type="button" class="cp-btn cp-btn-ghost" id="secClose">✕ Close</button>
      </div>
    </div>

    <div class="cp-section" style="margin-top:8px;border-top:none;padding-top:0"><h4>Price & performance <span class="card-subtitle">${it.etf} — a tracking ETF, used as a proxy for the ${isSector ? "sector" : "industry"}</span></h4>
      ${q ? `<div class="cp-market-top"><div class="cp-price"><span class="cp-price-big">${formatCurrency(q.c)}</span> <span class="${changeClass(q.dp)}">${fmtSigned(q.d)} (${fmtPctVal(q.dp)})</span><div class="muted small"><span class="live-tag">live</span></div></div>
        <div class="cp-stats">${[["Open", q.o], ["Day high", q.h], ["Day low", q.l], ["Prev close", q.pc]].map(([l, v]) => `<div class="cp-stat"><span>${l}</span><strong>${fmtNumOrDash(v)}</strong></div>`).join("")}${m ? `<div class="cp-stat"><span>Beta</span><strong>${M(m, "beta") !== null ? m.beta.toFixed(2) : "—"}</strong></div><div class="cp-stat"><span>Avg vol (10d)</span><strong>${M(m, "10DayAverageTradingVolume") !== null ? m["10DayAverageTradingVolume"].toFixed(1) + "M" : "—"}</strong></div>` : ""}</div></div>` : '<p class="muted small">Loading price…</p>'}
      ${m ? `<div class="cp-perf">${perfKeys.map(([l, k]) => `<div class="cp-perf-cell ${changeClass(M(m, k))}"><span>${l}</span><strong>${fmtPctVal(M(m, k), 1)}</strong></div>`).join("")}</div>` : '<p class="muted small" id="secMetricLoading">Loading performance history…</p>'}
      ${m && M(m, "52WeekLow") !== null && M(m, "52WeekHigh") !== null && q ? `<div class="cp-52w"><span class="small muted">52-week range</span><span class="small">${formatCurrency(m["52WeekLow"])}</span><span class="cp-52w-track"><i style="left:${(Math.max(0, Math.min(1, (q.c - m["52WeekLow"]) / (m["52WeekHigh"] - m["52WeekLow"]))) * 100).toFixed(0)}%"></i></span><span class="small">${formatCurrency(m["52WeekHigh"])}</span></div>` : ""}
    </div>

    ${relatedEtfs.length ? `<div class="cp-section"><h4>Other ETFs tracking this ${isSector ? "sector" : "industry"} <span class="card-subtitle">${relatedEtfs.length} more besides ${it.etf} — live prices</span></h4>
      <div class="crypto-table-scroll"><table class="crypto-table quotes-table"><thead><tr><th>Ticker</th><th>Fund</th><th>Price</th><th>Chg %</th></tr></thead><tbody id="secRelatedEtfsBody">${relatedEtfs.map(([t, n]) => `<tr class="crypto-table-row" data-symbol="${t}"><td><strong>${t}</strong></td><td class="muted small">${n}</td><td class="rel-etf-price muted">…</td><td class="rel-etf-chg"></td></tr>`).join("")}</tbody></table></div>
      <p class="muted small">Not ranked by market cap or assets under management — that data is paywalled on every free source this app checked (see BLOCKERS.md). Order shown is this app's own curated list, not a ranking.</p>
    </div>` : ""}

    ${rel.length ? `<div class="cp-section"><h4>Versus the S&P 500 <span class="card-subtitle">${it.etf} (green) against SPY (grey) — who's leading?</span></h4><div class="rel-bars">${rel.map(x => `<div class="rel-row"><span class="rel-label">${x.label}</span><span class="rel-track"><i class="rel-spy" style="width:${(Math.abs(x.b) / relMax) * 48}%;${x.b >= 0 ? "left:50%" : `right:50%`}"></i><i class="rel-sec ${x.a >= 0 ? "pos" : "neg"}" style="width:${(Math.abs(x.a) / relMax) * 48}%;${x.a >= 0 ? "left:50%" : "right:50%"}"></i><i class="rel-zero"></i></span><span class="rel-val ${changeClass(x.a - x.b)}">${fmtSigned(x.a - x.b, 1, " pts")}</span></div>`).join("")}</div><p class="muted small">Right column = sector minus S&P 500. Positive means the sector has outperformed the market over that period.</p></div>` : ""}

    <div class="cp-section"><h4>What drives it</h4>
      ${isSector ? `<ul class="cp-insights">${sec.drivers.map(d => `<li>${d}</li>`).join("")}</ul>
        <div class="sec-facts"><div><span class="muted small">Character</span><strong>${sec.character}</strong></div><div><span class="muted small">What to watch</span><strong>${sec.watch.join(" · ")}</strong></div></div>`
        : `<p class="small" style="line-height:1.6;color:var(--text-secondary)">${it.desc} It sits inside <strong>${sec.name}</strong>, so it shares that sector's drivers: ${sec.drivers.slice(0, 3).join("; ").toLowerCase()}. Industry ETFs are usually narrower and more volatile than their parent sector.</p>
        <div class="sec-facts"><div><span class="muted small">Parent sector character</span><strong>${sec.character}</strong></div></div>`}
    </div>

    ${subIndustries.length ? `<div class="cp-section"><h4>Industries inside ${it.name}</h4><div class="sec-grid sec-grid-small">${subIndustries.map(ind => { const iq = secQuote(ind.etf); return `<button type="button" class="sec-tile" data-id="${sec.id}:${ind.id}" style="background:${iq ? heatColorScaled(iq.dp, 4) : "var(--bg-surface-2)"}"><span class="sec-tile-name">${ind.name}</span><span class="sec-tile-bottom"><span class="sec-tile-etf">${ind.etf}</span><span class="sec-tile-pct">${iq ? fmtPctVal(iq.dp) : "…"}</span></span></button>`; }).join("")}</div></div>` : ""}
    ${siblings.length ? `<div class="cp-section"><h4>Other industries in ${sec.name}</h4><div class="sec-grid sec-grid-small">${siblings.map(s => { const iq = secQuote(s.etf); return `<button type="button" class="sec-tile" data-id="${s.id}" style="background:${iq ? heatColorScaled(iq.dp, 4) : "var(--bg-surface-2)"}"><span class="sec-tile-name">${s.name}</span><span class="sec-tile-bottom"><span class="sec-tile-etf">${s.etf}</span><span class="sec-tile-pct">${iq ? fmtPctVal(iq.dp) : "…"}</span></span></button>`; }).join("")}</div></div>` : ""}

    <div class="cp-section"><h4>Representative companies <span class="card-subtitle">curated well-known names in this ${isSector ? "sector" : "industry"} — NOT the ETF's live holdings, which aren't available on the free tier · live prices</span></h4>
      <div class="crypto-table-scroll"><table class="crypto-table quotes-table"><thead><tr><th>Company</th><th>Price</th><th>Chg %</th><th>Day range</th></tr></thead><tbody id="secRepsBody">${reps.map(([t, n]) => `<tr class="crypto-table-row" data-symbol="${t}"><td><strong>${t}</strong> <span class="muted small">${n === t ? "" : n}</span></td><td class="rep-price muted">…</td><td class="rep-chg"></td><td class="rep-range"></td></tr>`).join("")}</tbody></table></div>
    </div>
    <p class="muted small cp-foot">Prices and performance: Finnhub (ETF quote + metrics; price return, not total return). Descriptions, drivers and company lists are curated general knowledge, not investment advice or a forecast.</p>`;

  el.querySelector("#secOpenEtf").addEventListener("click", () => loadTicker(it.etf));
  el.querySelector("#secClose").addEventListener("click", () => { sectorsState.selected = null; document.getElementById("sectorDetailCard").hidden = true; document.getElementById("sectorDetailCard").classList.add("hidden"); paintSectorHeatmap(); paintSectorTable(); });
  el.querySelector("#secUp")?.addEventListener("click", () => openSector(it.parent));
  el.querySelectorAll(".sec-tile").forEach(t => t.addEventListener("click", () => openSector(t.dataset.id)));

  // Load whatever's missing for this selection (metric + representative quotes).
  if (!m) fetchMetricCached(it.etf).then(() => { if (sectorsState.selected === id) { renderSectorDetail(id); paintSectorTable(); } });
  if (!sm) fetchMetricCached(SECTOR_BENCHMARK).then(() => { if (sectorsState.selected === id) renderSectorDetail(id); });
  if (!q) fetchQuoteCached(it.etf).then(() => { if (sectorsState.selected === id) renderSectorDetail(id); });
  const body = el.querySelector("#secRepsBody");
  loadQuotesThrottled(reps.map(r => r[0]), (sym, qq) => {
    const row = body && body.querySelector(`tr[data-symbol="${sym}"]`);
    if (!row || !qq) return;
    row.querySelector(".rep-price").textContent = formatCurrency(qq.c);
    row.querySelector(".rep-price").classList.remove("muted");
    const c = row.querySelector(".rep-chg"); c.textContent = fmtPctVal(qq.dp); c.className = `rep-chg ${changeClass(qq.dp)}`;
    const pos = quoteRangePos(qq);
    row.querySelector(".rep-range").innerHTML = pos === null ? "" : `<span class="day-range"><span class="day-range-marker" style="left:${(pos * 100).toFixed(0)}%"></span></span>`;
  }, { concurrency: 2, gapMs: 500 });
  body && body.querySelectorAll("tr").forEach(tr => tr.addEventListener("click", () => loadTicker(tr.dataset.symbol)));

  const relBody = el.querySelector("#secRelatedEtfsBody");
  if (relBody) {
    loadQuotesThrottled(relatedEtfs.map(([t]) => t), (sym, qq) => {
      const row = relBody.querySelector(`tr[data-symbol="${sym}"]`);
      if (!row || !qq) return;
      row.querySelector(".rel-etf-price").textContent = formatCurrency(qq.c);
      row.querySelector(".rel-etf-price").classList.remove("muted");
      const c = row.querySelector(".rel-etf-chg"); c.textContent = fmtPctVal(qq.dp); c.className = `rel-etf-chg ${changeClass(qq.dp)}`;
    }, { concurrency: 2, gapMs: 500 });
    relBody.querySelectorAll("tr").forEach(tr => tr.addEventListener("click", () => loadTicker(tr.dataset.symbol)));
  }
}
