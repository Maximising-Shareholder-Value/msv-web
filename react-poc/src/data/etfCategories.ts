// data/etfCategories.ts — the ETF universe, grouped by theme. Copied verbatim
// from ../../etfs.js. Country categories (dynamicGroup) are built from
// countries.js on the vanilla site and are left out here.

export interface EtfCategory {
  id: string;
  family: string;
  title: string;
  blurb: string;
  items?: [string, string][];
  dynamicGroup?: string;
  warn?: boolean;
}

export const ETF_CATEGORIES: EtfCategory[] = [
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
