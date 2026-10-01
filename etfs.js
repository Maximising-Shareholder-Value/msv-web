// etfs.js — the ETFs page (2026-09-27): every ETF the app tracks, organized
// into ~50 categories across 8 families (US market, sectors, themes, income,
// global equity, fixed income, commodities & currency, and the risky
// stuff), each opening the same dense live table + heatmap as the stock
// tabs. Replaces the single flat "ETFs" browse list.
//
// Every ticker below was live-checked against the real quote endpoint on
// 2026-09-27 (dead ones — e.g. the delisted Colombia/Nigeria/Egypt country
// ETFs, SPLG which is now SPYM — were dropped). Names are the fund's
// common name; where the exact legal name wasn't certain a short
// descriptive label is used instead. Expense ratios, holdings and AUM are
// NOT shown: they're paywalled on every free data source the project
// checked (see BLOCKERS.md). Prices load live per category, a few at a time
// (Finnhub's free tier is 60 calls/minute shared by all visitors).
//
// 2026-10-01: added a second "By Issuer" view (ETF_ISSUER_PREFIXES onward,
// near the bottom of this file) — the same universe above, grouped by the
// company that runs the fund (Vanguard, iShares, Schwab, JPMorgan, etc.)
// instead of by asset class/theme. Derived from each item's existing name
// string, not a separately maintained list — see that section's own
// comment before changing how categories above name their items.

const ETF_FAMILIES = [
  { id: "us", label: "US equity" },
  { id: "sector", label: "Sectors & industries" },
  { id: "theme", label: "Themes" },
  { id: "income", label: "Dividends & income" },
  { id: "global", label: "Global equity" },
  { id: "bond", label: "Fixed income" },
  { id: "commodity", label: "Commodities & currency" },
  { id: "alt", label: "Crypto, volatility & leveraged" },
];

const ETF_CATEGORIES = [
  // ---------------- US equity ----------------
  { id: "us-broad", family: "us", title: "US broad market", blurb: "The whole US stock market or its best-known indexes — the core building blocks of most portfolios.",
    items: [["SPY", "SPDR S&P 500"], ["VOO", "Vanguard S&P 500"], ["IVV", "iShares Core S&P 500"], ["SPYM", "SPDR Portfolio S&P 500"], ["VTI", "Vanguard Total Stock Market"], ["ITOT", "iShares Core S&P Total US"], ["SCHB", "Schwab US Broad Market"], ["DIA", "SPDR Dow Jones Industrial"], ["QQQ", "Invesco Nasdaq-100"], ["QQQM", "Invesco Nasdaq-100 (low cost)"], ["RSP", "Invesco S&P 500 Equal Weight"]] },
  { id: "us-size", family: "us", title: "US by company size", blurb: "Large, mid, small and micro caps behave differently: smaller companies tend to be more volatile and more sensitive to the economy and credit conditions.",
    items: [["IWM", "iShares Russell 2000 (small)"], ["IJR", "iShares Core S&P Small-Cap"], ["VB", "Vanguard Small-Cap"], ["MDY", "SPDR S&P MidCap 400"], ["IJH", "iShares Core S&P Mid-Cap"], ["VO", "Vanguard Mid-Cap"], ["IWC", "iShares Micro-Cap"], ["SPY", "SPDR S&P 500 (large)"], ["QQQ", "Nasdaq-100 (mega-cap growth)"]] },
  { id: "us-style", family: "us", title: "US styles & factors", blurb: "Value, growth, momentum, quality and low-volatility strategies — different ways of slicing the same market.",
    items: [["IVE", "iShares S&P 500 Value"], ["VTV", "Vanguard Value"], ["IWD", "iShares Russell 1000 Value"], ["SCHV", "Schwab US Large-Cap Value"], ["IVW", "iShares S&P 500 Growth"], ["VUG", "Vanguard Growth"], ["IWF", "iShares Russell 1000 Growth"], ["SCHG", "Schwab US Large-Cap Growth"], ["MTUM", "iShares MSCI USA Momentum"], ["QUAL", "iShares MSCI USA Quality"], ["USMV", "iShares MSCI USA Min Volatility"], ["SPLV", "Invesco S&P 500 Low Volatility"], ["LRGF", "iShares US Equity Factor"]] },

  // ---------------- Sectors & industries ----------------
  { id: "sec-spdr", family: "sector", title: "The 11 S&P 500 sectors", blurb: "The SPDR Select Sector ETFs — the standard way to trade each part of the US economy. The Sectors page goes much deeper on these.",
    items: [["XLK", "Technology"], ["XLF", "Financials"], ["XLE", "Energy"], ["XLV", "Health Care"], ["XLY", "Consumer Discretionary"], ["XLP", "Consumer Staples"], ["XLI", "Industrials"], ["XLU", "Utilities"], ["XLB", "Materials"], ["XLRE", "Real Estate"], ["XLC", "Communication Services"]] },
  { id: "sec-tech", family: "sector", title: "Technology & semiconductors", blurb: "Broad tech plus the chip and software niches.",
    items: [["XLK", "SPDR Technology"], ["VGT", "Vanguard Information Technology"], ["FTEC", "Fidelity MSCI IT"], ["IYW", "iShares US Technology"], ["SMH", "VanEck Semiconductor"], ["SOXX", "iShares Semiconductor"], ["IGV", "iShares Software"], ["FDN", "First Trust Internet"]] },
  { id: "sec-health", family: "sector", title: "Health care & biotech", blurb: "Drugmakers, biotech, devices and providers. Biotech ETFs are far more volatile than broad health care.",
    items: [["XLV", "SPDR Health Care"], ["VHT", "Vanguard Health Care"], ["IBB", "iShares Biotechnology"], ["XBI", "SPDR S&P Biotech"], ["ARKG", "ARK Genomic Revolution"], ["IHI", "iShares US Medical Devices"], ["XPH", "SPDR S&P Pharmaceuticals"], ["IHF", "iShares US Healthcare Providers"]] },
  { id: "sec-fin", family: "sector", title: "Financials", blurb: "Banks, regional banks, insurers, brokers and fintech.",
    items: [["XLF", "SPDR Financials"], ["VFH", "Vanguard Financials"], ["KBE", "SPDR S&P Bank"], ["KRE", "SPDR S&P Regional Banking"], ["KIE", "SPDR S&P Insurance"], ["IAI", "iShares Broker-Dealers & Exchanges"], ["FINX", "Global X FinTech"], ["ARKF", "ARK Fintech Innovation"]] },
  { id: "sec-energy", family: "sector", title: "Energy: oil & gas", blurb: "Oil and gas producers, drillers and pipelines. Tied to commodity prices and often to inflation.",
    items: [["XLE", "SPDR Energy"], ["VDE", "Vanguard Energy"], ["XOP", "SPDR Oil & Gas Exploration"], ["OIH", "VanEck Oil Services"], ["AMLP", "Alerian MLP (pipelines)"], ["FCG", "First Trust Natural Gas"]] },
  { id: "sec-consumer", family: "sector", title: "Consumer & retail", blurb: "Staples (defensive) and discretionary (cyclical) spending, retailers and homebuilders.",
    items: [["XLP", "SPDR Consumer Staples"], ["VDC", "Vanguard Consumer Staples"], ["XLY", "SPDR Consumer Discretionary"], ["VCR", "Vanguard Consumer Discretionary"], ["XRT", "SPDR Retail"], ["XHB", "SPDR Homebuilders"], ["ITB", "iShares Home Construction"], ["ONLN", "ProShares Online Retail"], ["IBUY", "Amplify Online Retail"], ["AWAY", "Travel technology"]] },
  { id: "sec-industrial", family: "sector", title: "Industrials, defense & transport", blurb: "Machinery, aerospace and defense, airlines, rails and infrastructure builders.",
    items: [["XLI", "SPDR Industrials"], ["VIS", "Vanguard Industrials"], ["ITA", "iShares US Aerospace & Defense"], ["XAR", "SPDR Aerospace & Defense"], ["IYT", "iShares Transportation"], ["JETS", "US Global Jets (airlines)"], ["PAVE", "Global X US Infrastructure"], ["UFO", "Procure Space"]] },
  { id: "sec-materials", family: "sector", title: "Materials & mining", blurb: "Metals, miners and materials — cyclical, and sensitive to China's demand and the US dollar.",
    items: [["XLB", "SPDR Materials"], ["XME", "SPDR Metals & Mining"], ["PICK", "iShares Global Metals & Mining"], ["GDX", "VanEck Gold Miners"], ["GDXJ", "VanEck Junior Gold Miners"], ["SIL", "Global X Silver Miners"], ["COPX", "Global X Copper Miners"], ["REMX", "VanEck Rare Earth & Strategic Metals"], ["SLX", "VanEck Steel"], ["MOO", "VanEck Agribusiness"], ["WOOD", "iShares Global Timber & Forestry"]] },
  { id: "sec-realestate", family: "sector", title: "Real estate (REITs)", blurb: "Property-owning trusts. Income-oriented and highly sensitive to interest rates.",
    items: [["VNQ", "Vanguard Real Estate"], ["XLRE", "SPDR Real Estate"], ["IYR", "iShares US Real Estate"], ["ICF", "iShares Cohen & Steers REIT"], ["REM", "iShares Mortgage Real Estate"], ["SRVR", "Data & infrastructure real estate"]] },
  { id: "sec-utilities", family: "sector", title: "Utilities, water & infrastructure", blurb: "Regulated, defensive, dividend-heavy businesses — and rate-sensitive like bonds.",
    items: [["XLU", "SPDR Utilities"], ["VPU", "Vanguard Utilities"], ["IGF", "iShares Global Infrastructure"], ["PHO", "Invesco Water Resources"], ["FIW", "First Trust Water"]] },

  // ---------------- Themes ----------------
  { id: "theme-ai", family: "theme", title: "AI & robotics", blurb: "Companies positioned to benefit from artificial intelligence and automation.",
    items: [["BOTZ", "Global X Robotics & AI"], ["AIQ", "Global X AI & Technology"], ["ROBO", "ROBO Global Robotics"], ["ARTY", "iShares Future AI & Tech"], ["ARKQ", "ARK Autonomous Tech & Robotics"], ["SMH", "VanEck Semiconductor"]] },
  { id: "theme-cyber", family: "theme", title: "Cybersecurity & cloud", blurb: "Security software and cloud computing.",
    items: [["CIBR", "First Trust Cybersecurity"], ["HACK", "Amplify Cybersecurity"], ["BUG", "Global X Cybersecurity"], ["SKYY", "First Trust Cloud Computing"], ["WCLD", "WisdomTree Cloud Computing"], ["CLOU", "Global X Cloud Computing"]] },
  { id: "theme-clean", family: "theme", title: "Clean energy & EVs", blurb: "Solar, wind, batteries and electric vehicles. Historically very volatile and rate-sensitive.",
    items: [["ICLN", "iShares Global Clean Energy"], ["TAN", "Invesco Solar"], ["QCLN", "First Trust Clean Edge Green Energy"], ["PBW", "Invesco WilderHill Clean Energy"], ["FAN", "First Trust Global Wind Energy"], ["LIT", "Global X Lithium & Battery Tech"], ["DRIV", "Global X Autonomous & Electric Vehicles"]] },
  { id: "theme-nuclear", family: "theme", title: "Uranium & nuclear", blurb: "Uranium miners and nuclear-power companies — a theme boosted by data-center electricity demand.",
    items: [["URA", "Global X Uranium"], ["NLR", "VanEck Uranium & Nuclear"], ["URNM", "Sprott Uranium Miners"]] },
  { id: "theme-innovation", family: "theme", title: "Innovation & disruptive tech", blurb: "Higher-risk, higher-growth baskets — ARK's funds are famously volatile.",
    items: [["ARKK", "ARK Innovation"], ["ARKW", "ARK Next Generation Internet"], ["ARKG", "ARK Genomic Revolution"], ["ARKF", "ARK Fintech"], ["ARKQ", "ARK Autonomous Tech"], ["ARKX", "ARK Space Exploration"], ["PRNT", "3D Printing"]] },
  { id: "theme-consumer", family: "theme", title: "Gaming, cannabis & lifestyle", blurb: "Niche consumer themes: sports betting, esports, cannabis and ESG-screened portfolios.",
    items: [["BETZ", "Roundhill Sports Betting & iGaming"], ["ESPO", "VanEck Video Gaming & Esports"], ["HERO", "Global X Video Games & Esports"], ["MJ", "Cannabis"], ["ESGU", "iShares ESG Aware USA"], ["SUSA", "iShares MSCI USA ESG Select"]] },

  // ---------------- Dividends & income ----------------
  { id: "inc-dividend", family: "income", title: "Dividend & dividend growth", blurb: "High-yield and dividend-growth strategies. A high yield can signal a beaten-down price, so quality matters as much as the number.",
    items: [["VYM", "Vanguard High Dividend Yield"], ["SCHD", "Schwab US Dividend Equity"], ["DVY", "iShares Select Dividend"], ["HDV", "iShares Core High Dividend"], ["SPYD", "SPDR S&P 500 High Dividend"], ["VIG", "Vanguard Dividend Appreciation"], ["DGRO", "iShares Core Dividend Growth"], ["NOBL", "ProShares S&P 500 Dividend Aristocrats"]] },
  { id: "inc-options", family: "income", title: "Option-income (covered call)", blurb: "Funds that sell options to pay out high monthly income — the trade-off is capped upside in strong rallies.",
    items: [["JEPI", "JPMorgan Equity Premium Income"], ["JEPQ", "JPMorgan Nasdaq Equity Premium Income"], ["QYLD", "Global X Nasdaq 100 Covered Call"]] },

  // ---------------- Global equity ----------------
  { id: "glob-developed", family: "global", title: "Developed markets ex-US", blurb: "Europe, Japan, Australia and other advanced economies outside the US.",
    items: [["EFA", "iShares MSCI EAFE"], ["VEA", "Vanguard FTSE Developed Markets"], ["IEFA", "iShares Core MSCI EAFE"], ["VGK", "Vanguard FTSE Europe"], ["EZU", "iShares MSCI Eurozone"], ["DXJ", "WisdomTree Japan Hedged Equity"], ["VPL", "Vanguard FTSE Pacific"]] },
  { id: "glob-em", family: "global", title: "Emerging markets & regions", blurb: "Fast-growing economies: broad EM funds, China, India, Latin America and Africa.",
    items: [["EEM", "iShares MSCI Emerging Markets"], ["VWO", "Vanguard FTSE Emerging Markets"], ["IEMG", "iShares Core MSCI Emerging Markets"], ["EMXC", "iShares MSCI EM ex-China"], ["FXI", "iShares China Large-Cap"], ["KWEB", "KraneShares China Internet"], ["EPI", "WisdomTree India Earnings"], ["ILF", "iShares Latin America 40"], ["AFK", "VanEck Africa"]] },
  { id: "glob-brics", family: "global", title: "BRICS countries", blurb: "Country ETFs for the BRICS members that have a US-listed ETF — each is a proxy for that market's stock index. Membership as of when this was written; verify before relying on it.", dynamicGroup: "brics" },
  { id: "glob-emcountries", family: "global", title: "Emerging-market countries", blurb: "Single-country ETFs for emerging markets. Country ETFs can be concentrated in a few sectors and swing with local currencies.", dynamicGroup: "emerging" },
  { id: "glob-dmcountries", family: "global", title: "Developed-market countries", blurb: "Single-country ETFs for developed markets.", dynamicGroup: "developed" },
  { id: "glob-frontier", family: "global", title: "Frontier & standalone markets", blurb: "Smaller, less liquid markets — more volatile and harder to trade.", dynamicGroup: "frontier" },

  // ---------------- Fixed income ----------------
  { id: "bond-treasury", family: "bond", title: "US Treasuries (by maturity)", blurb: "The safest US bonds. The longer the maturity, the more the price moves when interest rates change (higher 'duration').",
    items: [["SGOV", "iShares 0-3 Month Treasury"], ["BIL", "SPDR 1-3 Month T-Bill"], ["SHV", "iShares Short Treasury"], ["SHY", "iShares 1-3 Year Treasury"], ["IEI", "iShares 3-7 Year Treasury"], ["IEF", "iShares 7-10 Year Treasury"], ["TLH", "iShares 10-20 Year Treasury"], ["TLT", "iShares 20+ Year Treasury"], ["VGSH", "Vanguard Short-Term Treasury"], ["VGIT", "Vanguard Intermediate Treasury"], ["VGLT", "Vanguard Long-Term Treasury"], ["GOVT", "iShares US Treasury Bond"]] },
  { id: "bond-tips", family: "bond", title: "Inflation-protected (TIPS)", blurb: "Treasury bonds whose principal rises with inflation.",
    items: [["TIP", "iShares TIPS Bond"], ["SCHP", "Schwab US TIPS"], ["VTIP", "Vanguard Short-Term Inflation-Protected"], ["STIP", "iShares 0-5 Year TIPS"]] },
  { id: "bond-agg", family: "bond", title: "Aggregate & total bond market", blurb: "One-fund bond portfolios covering Treasuries, mortgages and corporates.",
    items: [["AGG", "iShares Core US Aggregate"], ["BND", "Vanguard Total Bond Market"], ["SCHZ", "Schwab US Aggregate"], ["BNDX", "Vanguard Total International Bond"], ["IAGG", "iShares Core International Aggregate"], ["MBB", "iShares Mortgage-Backed Securities"]] },
  { id: "bond-corp", family: "bond", title: "Investment-grade corporate", blurb: "Bonds from financially stronger companies — a little more yield than Treasuries, with modest credit risk.",
    items: [["LQD", "iShares Investment Grade Corporate"], ["VCIT", "Vanguard Intermediate Corporate"], ["VCSH", "Vanguard Short-Term Corporate"], ["IGSB", "iShares 1-5 Year Investment Grade"]] },
  { id: "bond-hy", family: "bond", title: "High yield & preferred", blurb: "Lower-rated ('junk') bonds, preferred stock and convertibles. Higher income, but they behave more like stocks in a downturn.",
    items: [["HYG", "iShares iBoxx High Yield"], ["JNK", "SPDR Bloomberg High Yield"], ["USHY", "iShares Broad USD High Yield"], ["SHYG", "iShares 0-5 Year High Yield"], ["PFF", "iShares Preferred & Income"], ["PGX", "Invesco Preferred"], ["CWB", "SPDR Bloomberg Convertible"]] },
  { id: "bond-muni-em", family: "bond", title: "Municipal & emerging-market debt", blurb: "Tax-exempt municipal bonds and government/corporate bonds from emerging economies.",
    items: [["MUB", "iShares National Muni"], ["VTEB", "Vanguard Tax-Exempt"], ["EMB", "iShares JPM USD Emerging Markets"], ["VWOB", "Vanguard Emerging Markets Government"], ["EMLC", "VanEck EM Local Currency"]] },
  { id: "bond-short", family: "bond", title: "Ultra-short & floating-rate", blurb: "Low interest-rate risk: very short maturities or coupons that reset with rates.",
    items: [["FLOT", "iShares Floating Rate Bond"], ["FLRN", "SPDR Investment Grade Floating Rate"], ["BSV", "Vanguard Short-Term Bond"], ["JPST", "JPMorgan Ultra-Short Income"], ["MINT", "PIMCO Enhanced Short Maturity"]] },

  // ---------------- Commodities & currency ----------------
  { id: "com-gold", family: "commodity", title: "Gold, silver & platinum", blurb: "Physical-metal funds hold actual bullion; miner funds (see Materials & mining) are a different, more volatile bet.",
    items: [["GLD", "SPDR Gold Shares"], ["IAU", "iShares Gold Trust"], ["GLDM", "SPDR Gold MiniShares"], ["SGOL", "abrdn Physical Gold"], ["SLV", "iShares Silver Trust"], ["SIVR", "abrdn Physical Silver"], ["PPLT", "abrdn Physical Platinum"], ["PALL", "abrdn Physical Palladium"]] },
  { id: "com-broad", family: "commodity", title: "Broad commodities", blurb: "Diversified baskets of energy, metals and agriculture. Most are futures-based, so returns can differ from spot prices (roll costs).",
    items: [["DBC", "Invesco DB Commodity Index"], ["GSG", "iShares S&P GSCI Commodity"], ["PDBC", "Invesco Optimum Yield Diversified Commodity"], ["USCI", "United States Commodity Index"]] },
  { id: "com-energy", family: "commodity", title: "Oil, gas & gasoline", blurb: "Futures-based funds: they track futures contracts, not the spot price, and can lose value over time when futures curves slope up ('contango').",
    items: [["USO", "United States Oil"], ["BNO", "United States Brent Oil"], ["UNG", "United States Natural Gas"], ["UGA", "United States Gasoline"]] },
  { id: "com-agri", family: "commodity", title: "Agriculture & base metals", blurb: "Grains, sugar, industrial metals and copper.",
    items: [["DBA", "Invesco DB Agriculture"], ["CORN", "Teucrium Corn"], ["WEAT", "Teucrium Wheat"], ["SOYB", "Teucrium Soybean"], ["CANE", "Teucrium Sugar"], ["DBB", "Invesco DB Base Metals"], ["CPER", "United States Copper"]] },
  { id: "com-currency", family: "commodity", title: "Currencies", blurb: "Funds that track the US dollar or single currencies against it.",
    items: [["UUP", "Invesco DB US Dollar Bullish"], ["UDN", "Invesco DB US Dollar Bearish"], ["FXE", "Invesco Euro"], ["FXY", "Invesco Japanese Yen"], ["FXB", "Invesco British Pound"], ["FXA", "Invesco Australian Dollar"], ["FXC", "Invesco Canadian Dollar"]] },

  // ---------------- Crypto, volatility & leveraged ----------------
  { id: "alt-crypto", family: "alt", title: "Bitcoin, Ethereum & crypto miners", blurb: "Spot bitcoin/ether ETFs hold the actual coins; BITO uses futures; BLOK and WGMI hold crypto-related companies.",
    items: [["IBIT", "iShares Bitcoin Trust"], ["FBTC", "Fidelity Wise Origin Bitcoin"], ["ARKB", "ARK 21Shares Bitcoin"], ["BITB", "Bitwise Bitcoin"], ["GBTC", "Grayscale Bitcoin Trust"], ["ETHA", "iShares Ethereum Trust"], ["FETH", "Fidelity Ethereum"], ["ETHE", "Grayscale Ethereum Trust"], ["BITO", "ProShares Bitcoin Strategy (futures)"], ["BLOK", "Blockchain companies"], ["WGMI", "Bitcoin miners"]] },
  { id: "alt-vol", family: "alt", title: "Volatility (VIX) products", blurb: "⚠ Risky: these hold VIX futures and lose value over time in calm markets. They are built for short-term hedging, not holding.",
    warn: true,
    items: [["VIXY", "ProShares VIX Short-Term Futures"], ["VXX", "iPath VIX Short-Term Futures ETN"], ["SVIX", "-1x Short VIX Futures"]] },
  { id: "alt-lev", family: "alt", title: "Leveraged & inverse", blurb: "⚠ Risky: these reset daily to deliver 2x or 3x (or the inverse) of ONE day's move. Over longer periods, compounding can make returns diverge sharply from the multiple. Built for short-term trading, not buy-and-hold.",
    warn: true,
    items: [["TQQQ", "ProShares 3x Nasdaq-100"], ["SQQQ", "ProShares 3x Inverse Nasdaq-100"], ["UPRO", "ProShares 3x S&P 500"], ["SPXL", "Direxion 3x S&P 500"], ["SPXS", "Direxion 3x Inverse S&P 500"], ["SOXL", "Direxion 3x Semiconductors"], ["SOXS", "Direxion 3x Inverse Semiconductors"], ["TMF", "Direxion 3x 20+ Yr Treasury"], ["TMV", "Direxion 3x Inverse 20+ Yr Treasury"]] },
];

// Country categories are built from countries.js so they can never drift out
// of sync with the map (only countries that have a live US-listed ETF).
function etfCategoryItems(cat) {
  if (cat.dynamicGroup) return COUNTRIES.filter(c => c.group === cat.dynamicGroup && c.etf).map(c => [c.etf, `${c.flag} ${c.name}`]);
  return cat.items;
}

const etfState = { selected: "us-broad", query: "", token: 0, view: "category" };
const ETF_ALL_INDEX = () => { const seen = new Map(); ETF_CATEGORIES.forEach(cat => etfCategoryItems(cat).forEach(([t, n]) => { if (!seen.has(t)) seen.set(t, { t, n, cats: [] }); seen.get(t).cats.push(cat.id); })); return [...seen.values()]; };

function renderEtfsPage() {
  const root = document.getElementById("etfsRoot");
  if (!root) return;
  if (!root.dataset.built) {
    root.dataset.built = "1";
    root.innerHTML = `
      <div class="etf-top">
        <input type="search" class="cd-search etf-search" id="etfSearch" placeholder="Search ${ETF_ALL_INDEX().length} ETFs by ticker or name…" autocomplete="off">
        <span class="muted small">${ETF_CATEGORIES.length} categories · every ticker live-checked · prices load live per category</span>
      </div>
      <div class="etf-search-results" id="etfSearchResults" hidden></div>
      <div class="chart-source-toggle" id="etfViewToggle">
        <button type="button" data-view="category" class="active">By Category</button>
        <button type="button" data-view="issuer">By Issuer <span class="card-subtitle">who runs the fund</span></button>
      </div>
      <div class="etf-families" id="etfFamilies"></div>
      <div class="etf-issuers" id="etfIssuers" hidden></div>
      <div id="etfCategory"></div>`;
    document.getElementById("etfSearch").addEventListener("input", e => { etfState.query = e.target.value; paintEtfSearch(); });
    document.getElementById("etfViewToggle").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      etfState.view = b.dataset.view;
      document.getElementById("etfViewToggle").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      document.getElementById("etfFamilies").hidden = etfState.view !== "category";
      document.getElementById("etfIssuers").hidden = etfState.view !== "issuer";
      if (etfState.view === "issuer") { paintEtfIssuers(); openEtfIssuer(etfState.selectedIssuer || buildEtfIssuerGroups()[0].issuer); }
      else { openEtfCategory(etfState.selected); }
    }));
    paintEtfFamilies();
    paintEtfIssuers();
  }
  paintEtfFamilies();
  openEtfCategory(etfState.selected);
}

function paintEtfFamilies() {
  const el = document.getElementById("etfFamilies");
  if (!el) return;
  el.innerHTML = ETF_FAMILIES.map(f => `
    <div class="etf-family"><div class="etf-family-title">${f.label}</div><div class="etf-chips">${ETF_CATEGORIES.filter(c => c.family === f.id).map(c => `<button type="button" data-cat="${c.id}" class="etf-chip${c.id === etfState.selected ? " active" : ""}${c.warn ? " warn" : ""}">${c.title}<span>${etfCategoryItems(c).length}</span></button>`).join("")}</div></div>`).join("");
  el.querySelectorAll(".etf-chip").forEach(b => b.addEventListener("click", () => { etfState.query = ""; const s = document.getElementById("etfSearch"); if (s) s.value = ""; paintEtfSearch(); openEtfCategory(b.dataset.cat); }));
}

function paintEtfSearch() {
  const box = document.getElementById("etfSearchResults");
  const q = etfState.query.trim().toLowerCase();
  if (!q) { box.hidden = true; box.innerHTML = ""; return; }
  const hits = ETF_ALL_INDEX().filter(x => x.t.toLowerCase().includes(q) || x.n.toLowerCase().includes(q)).slice(0, 24);
  box.hidden = false;
  box.innerHTML = hits.length ? hits.map(x => `<button type="button" class="etf-hit" data-t="${x.t}"><strong>${x.t}</strong><span>${x.n}</span><em>${x.cats.map(id => ETF_CATEGORIES.find(c => c.id === id).title).slice(0, 2).join(" · ")}</em></button>`).join("") : '<p class="muted small" style="padding:8px">No ETFs match. This list is curated — it isn\'t every ETF in existence.</p>';
  box.querySelectorAll(".etf-hit").forEach(b => b.addEventListener("click", () => loadTicker(b.dataset.t)));
}

function openEtfCategory(id) {
  const cat = ETF_CATEGORIES.find(c => c.id === id) || ETF_CATEGORIES[0];
  etfState.selected = cat.id;
  const token = ++etfState.token;
  document.querySelectorAll(".etf-chip").forEach(b => b.classList.toggle("active", b.dataset.cat === cat.id));
  const fam = ETF_FAMILIES.find(f => f.id === cat.family);
  const items = etfCategoryItems(cat).map(([symbol, name]) => ({ symbol, name, quote: getFreshCache(QUOTE_CACHE, symbol, QUOTE_TTL_MS) }));
  const el = document.getElementById("etfCategory");
  el.innerHTML = `
    <div class="etf-cat-head${cat.warn ? " warn" : ""}">
      <div><div class="muted small">${fam.label}</div><h3>${cat.title} <span class="ctag">${items.length} ETFs</span></h3><p>${cat.blurb}</p></div>
    </div>
    <div id="etfQuotes"></div>
    <p class="muted small etf-foot">Live prices via Finnhub, a few at a time. Click any row for that ETF's full page. Expense ratios, holdings and assets under management aren't shown — they're paywalled on every free data source checked. Not investment advice.</p>`;

  const target = document.getElementById("etfQuotes");
  const paint = () => { if (token === etfState.token) renderQuotesView(items.map(i => ({ ...i, quote: i.quote })), cat.warn ? "Leveraged, inverse and volatility products are designed for short-term trading. Their long-run returns can differ dramatically from the index multiple they advertise." : "", target); };
  paint();
  let sinceRepaint = 0;
  loadQuotesThrottled(items.map(i => i.symbol), (sym, q) => {
    const it = items.find(i => i.symbol === sym);
    if (it) it.quote = q;
    if (++sinceRepaint >= 3) { sinceRepaint = 0; paint(); }
  }, { concurrency: 3, gapMs: 300 }).then(() => paint());
}

// ---- By-issuer view (2026-10-01) ----
// A second way to browse the SAME ETF universe above — by the company
// that runs the fund, not by asset class/theme (Jozsua's request: "I
// know Vanguard has VOO, VOOG etc, Schwab has SCHG/SCHB/SCHD, JPMorgan
// has JEPI/JEPQ — I want this visualised simply").
//
// Issuer is DERIVED from each fund's existing name string rather than
// hand-tagging ~300 tickers a second time — this file already writes
// names consistently as "Vanguard X", "iShares Y", "SPDR Z" etc.
// (confirmed by inspection of every category, not assumed), so deriving
// it here means this view can never drift out of sync with
// ETF_CATEGORIES above. ETF_ISSUER_OVERRIDES covers the one place that
// convention breaks: the 11 S&P sector SPDRs (`sec-spdr` category) are
// written as short names ("Technology", not "SPDR Technology") since
// that category's own blurb already says SPDR. A ticker whose issuer
// can't be derived or overridden just doesn't appear in this view —
// deliberately, rather than guessing or mislabeling it.
const ETF_ISSUER_PREFIXES = [
  ["Vanguard", "Vanguard"],
  ["iShares", "BlackRock (iShares)"],
  ["SPDR", "State Street Global Advisors (SPDR)"],
  ["Schwab", "Charles Schwab"],
  ["Invesco", "Invesco"],
  ["JPMorgan", "JPMorgan"],
  ["ARK", "ARK Invest"],
  ["Global X", "Global X"],
  ["VanEck", "VanEck"],
  ["WisdomTree", "WisdomTree"],
  ["First Trust", "First Trust"],
  ["Fidelity", "Fidelity"],
  ["PIMCO", "PIMCO"],
  ["Direxion", "Direxion"],
  ["ProShares", "ProShares"],
];

const ETF_ISSUER_OVERRIDES = Object.fromEntries(
  ["XLK", "XLF", "XLE", "XLV", "XLY", "XLP", "XLI", "XLU", "XLB", "XLRE", "XLC"]
    .map(t => [t, "State Street Global Advisors (SPDR)"])
);

const ETF_ISSUER_INFO = {
  "Vanguard": "Investor-owned, so profits go back into lower fees rather than to outside shareholders — still the cheapest option on most of its core index funds. The second-largest ETF issuer by assets.",
  "BlackRock (iShares)": "The world's largest ETF issuer by assets under management, with the broadest lineup of any provider — a fund for nearly every asset class, country and niche strategy.",
  "State Street Global Advisors (SPDR)": "Launched SPY in 1993, the first-ever US ETF and still one of the most-traded securities in the world. Dominant in sector investing (the 11 Select Sector SPDRs) and gold (GLD).",
  "Charles Schwab": "Known for undercutting Vanguard and iShares by a basis point or two on core broad-market and factor funds — the house brand for Schwab's own brokerage, but tradable anywhere.",
  "Invesco": "Best known for QQQ, tracking the Nasdaq-100 and one of the most-traded ETFs in the world; also runs equal-weight and other smart-beta strategies.",
  "JPMorgan": "A newer entrant that built its ETF business around actively-managed income strategies — JEPI/JEPQ's covered-call approach became some of the most popular actively managed ETFs ever launched.",
  "ARK Invest": "Actively-managed, highly concentrated bets on disruptive innovation (genomics, fintech, robotics). Far more volatile than a typical index ETF — famous for huge run-ups and drawdowns alike.",
  "Global X": "Focused on thematic and income (covered-call) strategies — niches like robotics, uranium and options-income funds that broader issuers often don't cover.",
  "VanEck": "A specialist in commodities, miners and niche international exposure — gold/junior gold miners, semiconductors, and single-country funds broader issuers skip.",
  "WisdomTree": "Known for currency-hedged international funds (stripping out the effect of the dollar moving against foreign currencies) and dividend-weighted strategies.",
  "First Trust": "Runs a mix of thematic (cybersecurity, cloud, internet) and smart-beta strategies, often reweighted on a fixed schedule rather than passively tracking a cap-weighted index.",
  "Fidelity": "Entered ETFs more recently with very low-cost core and sector funds, leaning on the same scale that makes its mutual funds cheap.",
  "PIMCO": "A bond specialist — actively-managed fixed-income funds from one of the largest bond managers in the world.",
  "Direxion": "Leveraged and inverse funds (2x/3x daily) for short-term trading — not built to be held long-term; see the warning on this app's Leveraged & Inverse category.",
  "ProShares": "The original leveraged/inverse ETF issuer, plus some of the most popular short-volatility and inverse products (SQQQ, VIXY).",
};

function etfIssuerFor(ticker, name) {
  if (ETF_ISSUER_OVERRIDES[ticker]) return ETF_ISSUER_OVERRIDES[ticker];
  const hit = ETF_ISSUER_PREFIXES.find(([prefix]) => name.startsWith(prefix));
  return hit ? hit[1] : null;
}

// Built once per call from ETF_ALL_INDEX (not cached) so it always
// reflects whatever's currently in ETF_CATEGORIES above, same as every
// other derived view in this file.
function buildEtfIssuerGroups() {
  const byIssuer = new Map();
  ETF_ALL_INDEX().forEach(({ t, n }) => {
    const issuer = etfIssuerFor(t, n);
    if (!issuer) return;
    if (!byIssuer.has(issuer)) byIssuer.set(issuer, []);
    byIssuer.get(issuer).push({ symbol: t, name: n });
  });
  return [...byIssuer.entries()]
    .map(([issuer, items]) => ({ issuer, items }))
    .sort((a, b) => b.items.length - a.items.length);
}

function paintEtfIssuers() {
  const el = document.getElementById("etfIssuers");
  if (!el) return;
  const groups = buildEtfIssuerGroups();
  el.innerHTML = groups.map(g => `
    <div class="etf-issuer-card${g.issuer === etfState.selectedIssuer ? " active" : ""}" data-issuer="${escapeHtml(g.issuer)}">
      <div class="etf-issuer-head"><h4>${escapeHtml(g.issuer)}</h4><span class="ctag">${g.items.length} ${g.items.length === 1 ? "fund" : "funds"}</span></div>
      <p class="etf-issuer-blurb">${escapeHtml(ETF_ISSUER_INFO[g.issuer] || "")}</p>
    </div>`).join("");
  el.querySelectorAll(".etf-issuer-card").forEach(c => c.addEventListener("click", () => openEtfIssuer(c.dataset.issuer)));
}

function openEtfIssuer(issuer) {
  const groups = buildEtfIssuerGroups();
  const group = groups.find(g => g.issuer === issuer) || groups[0];
  etfState.selectedIssuer = group.issuer;
  const token = ++etfState.token;
  document.querySelectorAll(".etf-issuer-card").forEach(c => c.classList.toggle("active", c.dataset.issuer === group.issuer));
  const items = group.items.map(({ symbol, name }) => ({ symbol, name, quote: getFreshCache(QUOTE_CACHE, symbol, QUOTE_TTL_MS) }));
  const el = document.getElementById("etfCategory");
  el.innerHTML = `
    <div class="etf-cat-head">
      <div><div class="muted small">By issuer</div><h3>${escapeHtml(group.issuer)} <span class="ctag">${items.length} ETFs</span></h3><p>${escapeHtml(ETF_ISSUER_INFO[group.issuer] || "")}</p></div>
    </div>
    <div id="etfQuotes"></div>
    <p class="muted small etf-foot">Grouped by reading each fund's own name (this app writes ETF names as "Vanguard X", "iShares Y" etc. consistently) — not every issuer this app tracks is shown, only the ones with a clear, consistent name prefix. Live prices via Finnhub, a few at a time. Click any row for that ETF's full page. Not investment advice.</p>`;

  const target = document.getElementById("etfQuotes");
  const paint = () => { if (token === etfState.token) renderQuotesView(items.map(i => ({ ...i, quote: i.quote })), "", target); };
  paint();
  let sinceRepaint = 0;
  loadQuotesThrottled(items.map(i => i.symbol), (sym, q) => {
    const it = items.find(i => i.symbol === sym);
    if (it) it.quote = q;
    if (++sinceRepaint >= 3) { sinceRepaint = 0; paint(); }
  }, { concurrency: 3, gapMs: 300 }).then(() => paint());
}
