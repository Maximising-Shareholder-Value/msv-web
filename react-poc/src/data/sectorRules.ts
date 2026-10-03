// data/sectorRules.ts — sector buckets, typical ranges and labels for the ticker page's
// traffic lights. Data copied from ../../../sectorRules.js; the logic is in lib/sectorRules.ts.

export type Bucket = string;
export type Range = [number | null, number | null];

export const SECTOR_BUCKETS: Record<string, string> = {
  technology: "Technology",
  banking: "Banking & Financial Services",
  insurance: "Insurance",
  real_estate: "Real Estate",
  utilities: "Utilities",
  energy: "Energy",
  aerospace_defense: "Aerospace, Defense & Space",
  healthcare: "Healthcare & Pharmaceuticals",
  consumer_staples: "Consumer Staples",
  consumer_cyclical: "Consumer Discretionary",
  industrials: "Industrials",
  communication: "Communication & Media",
  materials: "Materials & Mining",
  default: "this company's sector",
};


export const INDUSTRY_BUCKET_RULES: [RegExp, Bucket][] = [
  [/aerospace|defense|space/i, "aerospace_defense"],
  [/bank|capital markets|credit/i, "banking"],
  [/insurance/i, "insurance"],
  [/real estate|reit/i, "real_estate"],
  [/utilit/i, "utilities"],
  [/oil|gas|energy|coal/i, "energy"],
  [/software|semiconductor|technology|internet|computer|electronics|it services/i, "technology"],
  [/health|pharma|biotech|medical/i, "healthcare"],
  [/beverage|food|household|personal products|tobacco|grocery/i, "consumer_staples"],
  [/retail|apparel|auto|leisure|hotel|restaurant|entertainment \(consumer\)|homebuilding/i, "consumer_cyclical"],
  [/industrial|machinery|transportation|airlines|construction|aerospace/i, "industrials"],
  [/telecommunication|media|broadcasting|publishing/i, "communication"],
  [/metal|mining|chemical|material|steel/i, "materials"],
];


export const THRESHOLDS: Record<string, Record<string, { good: Range }>> = {
  peRatio: {
    default: { good: [10, 25] },
    technology: { good: [15, 45] },
    banking: { good: [7, 13] },
    insurance: { good: [7, 14] },
    utilities: { good: [12, 20] },
    real_estate: { good: [10, 22] },
    energy: { good: [8, 16] },
    aerospace_defense: { good: [12, 26] },
    healthcare: { good: [12, 30] },
    consumer_staples: { good: [15, 25] },
    consumer_cyclical: { good: [10, 25] },
    industrials: { good: [12, 22] },
    communication: { good: [10, 22] },
    materials: { good: [8, 18] },
  },
  pbRatio: {
    default: { good: [1, 3] },
    technology: { good: [2, 12] },
    banking: { good: [0.8, 1.8] },
    insurance: { good: [0.8, 1.6] },
    real_estate: { good: [0.8, 2] },
    utilities: { good: [1, 2 ] },
    healthcare: { good: [2, 8] },
    communication: { good: [1.5, 5] },
  },
  debtToEquity: {
    default: { good: [0, 1] },
    utilities: { good: [0.8, 2 ] },
    real_estate: { good: [0.8, 2.5] },
    energy: { good: [0.3, 1.2] },
    technology: { good: [0, 0.6] },
    healthcare: { good: [0, 0.8] },
    industrials: { good: [0.2, 1.2] },
    aerospace_defense: { good: [0.2, 1.2] },
    consumer_staples: { good: [0.2, 1.2] },
  },
  roe: {
    default: { good: [12, null] },
    technology: { good: [18, null] },
    banking: { good: [10, null] },
    insurance: { good: [8, null] },
    utilities: { good: [8, null] },
    real_estate: { good: [6, null] },
    energy: { good: [8, null] },
  },
  netMargin: {
    default: { good: [10, null] },
    technology: { good: [15, null] },
    banking: { good: [20, null] },
    consumer_cyclical: { good: [4, null] },
    consumer_staples: { good: [6, null] },
    industrials: { good: [6, null] },
    energy: { good: [6, null] },
    materials: { good: [5, null] },
  },
  grossMargin: {
    default: { good: [35, null] },
    technology: { good: [60, null] },
    consumer_cyclical: { good: [20, null] },
    consumer_staples: { good: [25, null] },
    industrials: { good: [20, null] },
    energy: { good: [20, null] },
    materials: { good: [15, null] },
  },
  operatingMargin: {
    default: { good: [12, null] },
    technology: { good: [20, null] },
    consumer_cyclical: { good: [5, null] },
    consumer_staples: { good: [10, null] },
    industrials: { good: [8, null] },
  },
  currentRatio: {
    default: { good: [1.2, 3] },
    consumer_cyclical: { good: [0.8, 2] },
    consumer_staples: { good: [0.8, 2] },
    industrials: { good: [1, 2.5] },
  },
  quickRatio: {
    default: { good: [0.8, 2.5] },
    consumer_cyclical: { good: [0.4, 1.5] },
    consumer_staples: { good: [0.4, 1.5] },
  },
  dividendYield: {
    default: { good: [1, 5] },
    technology: { good: [0, 2] },
    healthcare: { good: [0, 3] },
    utilities: { good: [3, 6] },
    real_estate: { good: [3, 7] },
    energy: { good: [2, 6] },
    consumer_staples: { good: [2, 5] },
  },
  revenueGrowth: {
    default: { good: [5, null] },
    technology: { good: [15, null] },
    utilities: { good: [1, null] },
    consumer_staples: { good: [2, null] },
    energy: { good: [0, null] },
  },
  epsGrowth: {
    default: { good: [5, null] },
    technology: { good: [12, null] },
    utilities: { good: [1, null] },
  },
  evEbitda: {
    default: { good: [null, 14] },
    technology: { good: [null, 25] },
    utilities: { good: [null, 12] },
    real_estate: { good: [null, 18] },
  },
  evRevenue: {
    default: { good: [null, 4] },
    technology: { good: [null, 12] },
  },
};

// Fields where the ratio doesn't really apply to certain buckets
// (e.g. quick/current ratio for banks/insurers, who don't carry
// "inventory" or typical current-liability structures).

export const NOT_APPLICABLE: Record<string, string[]> = {
  quickRatio: ["banking", "insurance"],
  currentRatio: ["banking", "insurance"],
};

export const TRAFFIC_LABELS: Record<string, string> = {
  good: "Typical range",
  warning: "Slightly outside typical",
  serious: "Well outside typical",
  critical: "Far outside typical",
};

// Builds the dynamic sentence that replaces the static "In this sector"
// text with one grounded in the specific company just searched.
