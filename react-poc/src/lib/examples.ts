// lib/examples.ts — the "real-life example" paragraphs under each ticker-page
// section, ported from script.js. Each one turns a figure into a plain sentence
// about $100. Only numbers go into the HTML, so it's safe to render as HTML.

const sign = (v: number) => (v >= 0 ? "+" : "");
const dollars = (v: number) => `$${v.toFixed(2)}`;

export const valuationExample = (pe: number | null, pb: number | null): string[] => [
  pe !== null && pe > 0 && `Put $100 into this stock and you're claiming about <strong>${dollars(100 / pe)}</strong> of the company's annual earnings. That's the flip side of a P/E of ${pe.toFixed(1)}: you're paying $${pe.toFixed(0)} today for every $1 the company earns in a year.`,
  pb !== null && pb > 0 && `That same $100 also buys a claim on about <strong>${dollars(100 / pb)}</strong> of the company's net assets (what's left over if it sold everything and paid off all its debts). A P/B of ${pb.toFixed(1)} means you're paying $${pb.toFixed(0)} for every $1 of that.`,
].filter((s): s is string => typeof s === "string");

export const growthExample = (rev: number | null, eps: number | null): string[] => [
  rev !== null && `If this company made $100 in revenue this time last year, it's making about <strong>${dollars(100 * (1 + rev / 100))}</strong> now. That's what its ${sign(rev)}${rev.toFixed(1)}% year-over-year revenue growth means in practice.`,
  eps !== null && `If it earned $100 in profit per share last year, it's earning about <strong>${dollars(100 * (1 + eps / 100))}</strong> per share now. That's its ${sign(eps)}${eps.toFixed(1)}% year-over-year EPS growth.`,
].filter((s): s is string => typeof s === "string" && s.length > 0);

export const profitabilityExample = (gross: number | null, net: number | null, roe: number | null): string[] => [
  gross !== null && `For every $100 in sales, about <strong>${dollars(gross)}</strong> is left after just the direct cost of making the product or service (its gross margin). That's before rent, salaries, marketing and everything else.`,
  net !== null && `After all costs, including those overheads, interest and tax, it keeps about <strong>${dollars(net)}</strong> of every $100 in sales as actual profit (its net margin).`,
  roe !== null && `Separately, for every $100 shareholders have invested in the business, it generates about <strong>${dollars(roe)}</strong> back in profit each year (its return on equity).`,
].filter((s): s is string => typeof s === "string" && s.length > 0);

export const healthExample = (de: number | null, currentRatio: number | null): string[] => [
  de !== null && `For every $100 of the company's own money (shareholder equity), it has borrowed about <strong>${dollars(de * 100)}</strong> more from lenders and creditors. That's what a debt-to-equity ratio of ${de.toFixed(2)} means.`,
  currentRatio !== null && `For every $100 of bills it owes within the next year, it has about <strong>${dollars(currentRatio * 100)}</strong> in cash and assets that could be turned into cash within a year (its current ratio of ${currentRatio.toFixed(2)}).`,
].filter((s): s is string => typeof s === "string" && s.length > 0);

export const efficiencyExample = (turnover: number | null): string[] => (
  turnover !== null ? [`For every $100 tied up in the company's assets, it generates about <strong>${dollars(turnover * 100)}</strong> in annual sales. That's what an asset turnover of ${turnover.toFixed(2)} means.`] : []
);

export const riskExample = (coverage: number | null, payout: number | null): string[] => [
  coverage !== null && `Its annual operating profit could cover its interest payments about <strong>${coverage.toFixed(1)}x</strong> over. The higher this number, the more room it has before interest payments become a real strain.`,
  payout !== null && payout > 0 && `Of every $100 it earns in profit, it pays out about <strong>${dollars(payout)}</strong> as dividends and keeps the rest (a payout ratio of ${payout.toFixed(1)}%).`,
].filter((s): s is string => typeof s === "string" && s.length > 0);

export const dividendsExample = (yieldPct: number | null, divGrowth5Y: number | null): string[] => (
  yieldPct === null || yieldPct <= 0
    ? ["This company currently pays no meaningful dividend, so a $100 investment wouldn't generate cash income this way. Any return would have to come from the share price itself changing."]
    : [
        `Invest $100 in this stock today and you'd collect about <strong>${dollars(yieldPct)}</strong> per year in dividend payments alone (before taxes), separate from any gain or loss in the share price itself.`,
        divGrowth5Y !== null && `That payout has also been growing: if it paid $100 in dividends 5 years ago, it's paying about <strong>${dollars(100 * (1 + divGrowth5Y / 100))}</strong> now (${sign(divGrowth5Y)}${divGrowth5Y.toFixed(1)}% over 5 years).`,
      ].filter((s): s is string => typeof s === "string" && s.length > 0)
);

export const momentumExample = (ytd: number | null, week52: number | null): string[] => [
  ytd !== null && `$100 invested in this stock at the start of this calendar year would be worth about <strong>${dollars(100 * (1 + ytd / 100))}</strong> today, based on its ${sign(ytd)}${ytd.toFixed(1)}% year-to-date price move alone (not counting dividends).`,
  week52 !== null && `Over a full rolling 12 months, that same $100 would be worth about <strong>${dollars(100 * (1 + week52 / 100))}</strong>, based on its ${sign(week52)}${week52.toFixed(1)}% return over the past year.`,
].filter((s): s is string => typeof s === "string" && s.length > 0);

export const fundReturnExample = (week52: number | null): string[] => (
  week52 !== null ? [`$100 invested in this fund a year ago would be worth about <strong>${dollars(100 * (1 + week52 / 100))}</strong> today, based on its ${sign(week52)}${week52.toFixed(1)}% return over the past 12 months (not counting any dividends it paid out along the way).`] : []
);

export const fundBetaExample = (beta: number | null): string[] => (
  beta !== null && beta !== 1 ? [`If the overall market moved 10% (up or down), this fund has historically moved about <strong>${(beta * 10).toFixed(1)}%</strong>. That's what a beta of ${beta.toFixed(2)} means in practice.`] : []
);

export const cryptoRankExample = (rank: number | null): string[] => (
  rank !== null ? [`By total market value, this is currently the <strong>#${rank}</strong> largest cryptocurrency out of thousands that exist.`] : []
);

export const cryptoMonthExample = (pct30d: number | null): string[] => (
  pct30d !== null ? [`$100 put into this coin 30 days ago would be worth about <strong>${dollars(100 * (1 + pct30d / 100))}</strong> today, based on its ${sign(pct30d)}${pct30d.toFixed(1)}% move over that month.`] : []
);
