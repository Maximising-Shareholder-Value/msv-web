// data/sectors.ts — the sector + industry taxonomy for the Sectors page.
// Copied verbatim from ../../sectors.js (the vanilla page's data), so the two
// stay in step until the vanilla page is retired. Descriptions, drivers and
// "representative companies" are CURATED general knowledge, not live holdings.

export interface Industry {
  id: string;
  name: string;
  etf: string;
  desc: string;
  reps: string[];
}

export interface Sector {
  id: string;
  name: string;
  etf: string;
  desc: string;
  drivers: string[];
  watch: string[];
  character: string;
  reps: [string, string][];
  industries: Industry[];
}

export const SECTOR_BENCHMARK = "SPY";

export const SECTORS: Sector[] = [
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
