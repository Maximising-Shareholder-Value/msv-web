// Bitcoin's issuance schedule is public and deterministic — anyone can derive
// it from the protocol rules, no data source needed. GENESIS_DATE and the
// four real halvings below are historical fact; everything after the last
// real halving is a *projection* assuming the ~10-minute average block time
// holds (it has, closely, for 15+ years, but future dates are estimates,
// clearly marked below).
export const GENESIS_DATE = Date.UTC(2009, 0, 3);
const BLOCKS_PER_DAY = 144; // ~10 min/block
const HALVING_INTERVAL_BLOCKS = 210_000;
const HALVING_INTERVAL_DAYS = HALVING_INTERVAL_BLOCKS / BLOCKS_PER_DAY; // ~1458 days (~4 years)

// [date, reward starting that day, is this halving observed or projected?]
export const HALVINGS: { date: number; reward: number; observed: boolean }[] = [
  { date: GENESIS_DATE, reward: 50, observed: true },
  { date: Date.UTC(2012, 10, 28), reward: 25, observed: true },
  { date: Date.UTC(2016, 6, 9), reward: 12.5, observed: true },
  { date: Date.UTC(2020, 4, 11), reward: 6.25, observed: true },
  { date: Date.UTC(2024, 3, 20), reward: 3.125, observed: true },
];
// Extend forward with projected halvings every ~4 years until 2040.
(function extend() {
  let last = HALVINGS[HALVINGS.length - 1];
  while (last.date < Date.UTC(2040, 0, 1)) {
    const date = last.date + HALVING_INTERVAL_DAYS * 86_400_000;
    last = { date, reward: last.reward / 2, observed: false };
    HALVINGS.push(last);
  }
})();

const daysSince = (fromMs: number, toMs: number) => (toMs - fromMs) / 86_400_000;

/** The block reward in effect on a given date. */
export function rewardAt(dateMs: number): number {
  let reward = HALVINGS[0].reward;
  for (const h of HALVINGS) { if (dateMs >= h.date) reward = h.reward; else break; }
  return reward;
}

/**
 * Approximate circulating supply on a date, by summing full eras of
 * (blocks/day * days in era * that era's reward) plus a partial current era.
 * This is the same method public Stock-to-Flow calculators use — it isn't
 * an audited ledger count, but it tracks the real number closely because
 * Bitcoin's actual average block time has stayed close to 10 minutes.
 */
export function supplyAt(dateMs: number): number {
  let supply = 0;
  for (let i = 0; i < HALVINGS.length; i++) {
    const eraStart = HALVINGS[i].date;
    const eraEnd = HALVINGS[i + 1] ? HALVINGS[i + 1].date : dateMs;
    if (dateMs <= eraStart) break;
    const end = Math.min(eraEnd, dateMs);
    const days = Math.max(0, daysSince(eraStart, end));
    supply += days * BLOCKS_PER_DAY * HALVINGS[i].reward;
  }
  return supply;
}

/** Annualized new supply ("flow") on a date, from the reward in effect then. */
export function flowAt(dateMs: number): number {
  return rewardAt(dateMs) * BLOCKS_PER_DAY * 365;
}

export function stockToFlowAt(dateMs: number): number {
  return supplyAt(dateMs) / flowAt(dateMs);
}

/** PlanB's original 2019 Stock-to-Flow model price: exp(-1.84) * S2F^3.36. */
export function s2fModelPrice(s2f: number): number {
  return Math.exp(-1.84) * Math.pow(s2f, 3.36);
}

export function nextHalving(now = Date.now()) {
  return HALVINGS.find(h => h.date > now) ?? HALVINGS[HALVINGS.length - 1];
}

// --- Rainbow chart: a widely-shared logarithmic regression fit to BTC's
// full price history (the version popularized by blockchaincenter.net).
// Coefficients get periodically refit by whoever maintains a given version
// of the chart, so treat these as "a" commonly used fit, not an exact or
// official constant.
const RAINBOW_A = 2.6521;
const RAINBOW_B = -18.163;

export function rainbowLog10(dateMs: number): number {
  const days = Math.max(1, daysSince(GENESIS_DATE, dateMs));
  return RAINBOW_A * Math.log(days) + RAINBOW_B;
}

export interface RainbowBand { label: string; color: string; offset: number }

// 9 boundary lines -> 8 filled bands between them, bottom (undervalued,
// per this model) to top (overvalued, per this model).
export const RAINBOW_BANDS: RainbowBand[] = [
  { label: "Basically a fire sale", color: "#3730a3", offset: -1.2 },
  { label: "BUY!", color: "#1d4ed8", offset: -0.9 },
  { label: "Accumulate", color: "#0891b2", offset: -0.6 },
  { label: "Still cheap", color: "#0d9488", offset: -0.3 },
  { label: "HODL!", color: "#16a34a", offset: 0 },
  { label: "Is this a bubble?", color: "#ca8a04", offset: 0.3 },
  { label: "FOMO intensifies", color: "#ea580c", offset: 0.6 },
  { label: "Sell. Seriously, SELL!", color: "#dc2626", offset: 0.9 },
  { label: "Maximum bubble territory", color: "#991b1b", offset: 1.2 },
];

export function bandPriceAt(dateMs: number, offset: number): number {
  return Math.pow(10, rainbowLog10(dateMs) + offset);
}

/** Which band a real price falls into on a given date, for a "you are here" read. */
export function bandForPrice(dateMs: number, price: number): RainbowBand {
  const logPrice = Math.log10(price);
  const base = rainbowLog10(dateMs);
  let match = RAINBOW_BANDS[0];
  for (const b of RAINBOW_BANDS) { if (logPrice >= base + b.offset) match = b; }
  return match;
}
