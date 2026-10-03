// components/TickerPage.tsx — the ticker deep-dive page (React). Covers the stock
// overview (header, price, ranges, company facts) and the financial sections:
// valuation, growth, profitability, financial health, efficiency, risk,
// dividends and momentum, with the same indicator cards, traffic lights and
// tooltips as the main site.
//
// Still on the main site, linked from here: the price chart, financial
// statements, ownership and insider transactions, SEC filings, options,
// recommendations and earnings, news and peers. ETFs and crypto also stay on
// the main site for now.

import { useEffect, useState } from "react";
import { getQuote, getMetric, getCompanyProfile, metricValue, type Quote, type Metric, type CompanyProfile } from "../lib/finnhub";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";
import { IndicatorGrid, type IndicatorSpec } from "./Indicators";

const STILL_ON_MAIN_SITE = [
  "Price chart (with indicators)", "Financial statements", "Shares and ownership", "Insider transactions",
  "SEC filings", "Options", "Analyst recommendations and earnings", "News and peers",
];

export function TickerPage({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
  const [profile, setProfile] = useState<CompanyProfile | null | undefined>(undefined);
  const [metric, setMetric] = useState<Metric | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setQuote(undefined); setProfile(undefined); setMetric(undefined);
    getQuote(symbol).then(q => { if (live) setQuote(q); });
    getCompanyProfile(symbol).then(p => { if (live) setProfile(p); });
    getMetric(symbol).then(m => { if (live) setMetric(m); });
    return () => { live = false; };
  }, [symbol]);

  if (profile === undefined || quote === undefined) {
    return <section className="ticker-page"><p className="muted">Loading {symbol}…</p></section>;
  }
  if (!quote) {
    return <section className="ticker-page"><p>No live quote for <strong>{symbol}</strong>. Check the symbol, or try again in a minute if the free data tier is rate-limited.</p></section>;
  }
  if (!profile) {
    return (
      <section className="ticker-page">
        <Header symbol={symbol} quote={quote} profile={null} />
        <p className="muted">{symbol} is an ETF, fund or index, or has no company profile. The ETF layout is still on the main site.</p>
        <a className="cp-btn" href={`/?ticker=${encodeURIComponent(symbol)}`}>Open {symbol} on the main site →</a>
      </section>
    );
  }

  const low = metricValue(metric, "52WeekLow"), high = metricValue(metric, "52WeekHigh");
  const rangePos = low !== null && high !== null && high > low ? Math.max(0, Math.min(100, ((quote.c - low) / (high - low)) * 100)) : null;
  const industry = profile.finnhubIndustry ?? null;
  const m = (k: string) => metricValue(metric, k);

  const valuation: IndicatorSpec[] = [
    { label: "P/E Ratio", value: m("peTTM"), defKey: "peRatio" },
    { label: "P/B Ratio", value: m("pbAnnual"), defKey: "pbRatio" },
    { label: "EV/EBITDA", value: m("evEbitdaTTM"), defKey: "evEbitda" },
    { label: "EV/Revenue", value: m("evRevenueTTM"), defKey: "evRevenue" },
    { label: "Market Cap ($M)", value: profile.marketCapitalization ?? null, defKey: "marketCap" },
    { label: "EPS (TTM)", value: m("epsTTM"), defKey: "epsTTM" },
    { label: "Shares Outstanding (M)", value: profile.shareOutstanding ?? null, defKey: "sharesOutstanding" },
    { label: "Price/Sales (TTM)", value: m("psTTM"), defKey: "priceToSales" },
    { label: "Price/Cash Flow (TTM)", value: m("pcfShareTTM"), defKey: "priceToCashFlow" },
  ];
  const growth: IndicatorSpec[] = [
    { label: "Revenue Growth (TTM YoY)", value: m("revenueGrowthTTMYoy"), defKey: "revenueGrowth", percent: true },
    { label: "EPS Growth (TTM YoY)", value: m("epsGrowthTTMYoy"), defKey: "epsGrowth", percent: true },
    { label: "Revenue Growth (5Y)", value: m("revenueGrowth5Y"), defKey: "revenueGrowth", percent: true },
    { label: "EPS Growth (5Y)", value: m("epsGrowth5Y"), defKey: "epsGrowth", percent: true },
    { label: "Revenue Growth (Quarterly YoY)", value: m("revenueGrowthQuarterlyYoy"), defKey: "revenueGrowth", percent: true },
    { label: "EPS Growth (Quarterly YoY)", value: m("epsGrowthQuarterlyYoy"), defKey: "epsGrowth", percent: true },
  ];
  const profitability: IndicatorSpec[] = [
    { label: "Gross Margin", value: m("grossMarginTTM"), defKey: "grossMargin", percent: true },
    { label: "Operating Margin", value: m("operatingMarginTTM"), defKey: "operatingMargin", percent: true },
    { label: "Net Margin", value: m("netProfitMarginTTM"), defKey: "netMargin", percent: true },
    { label: "Return on Equity", value: m("roeTTM"), defKey: "roe", percent: true },
    { label: "Return on Assets", value: m("roaTTM"), defKey: "roa", percent: true },
    { label: "Return on Investment", value: m("roiTTM"), defKey: "roi", percent: true },
    { label: "Gross Margin (5Y avg)", value: m("grossMargin5Y"), defKey: "grossMargin", percent: true },
    { label: "Operating Margin (5Y avg)", value: m("operatingMargin5Y"), defKey: "operatingMargin", percent: true },
    { label: "Net Margin (5Y avg)", value: m("netProfitMargin5Y"), defKey: "netMargin", percent: true },
  ];
  const health: IndicatorSpec[] = [
    { label: "Quick Ratio", value: m("quickRatioAnnual"), defKey: "quickRatio" },
    { label: "Current Ratio", value: m("currentRatioAnnual"), defKey: "currentRatio" },
    { label: "Debt/Equity", value: m("totalDebt/totalEquityAnnual"), defKey: "debtToEquity" },
  ];
  const efficiency: IndicatorSpec[] = [
    { label: "Asset Turnover", value: m("assetTurnoverTTM"), defKey: "assetTurnover" },
    { label: "Inventory Turnover", value: m("inventoryTurnoverTTM"), defKey: "inventoryTurnover" },
    { label: "Receivables Turnover", value: m("receivablesTurnoverTTM"), defKey: "receivablesTurnover" },
  ];
  const risk: IndicatorSpec[] = [
    { label: "Interest Coverage", value: m("netInterestCoverageAnnual"), defKey: "interestCoverage" },
    { label: "Long-Term Debt/Equity", value: m("longTermDebt/equityAnnual"), defKey: "ltDebtToEquity" },
    { label: "Dividend Payout Ratio", value: m("payoutRatioAnnual"), defKey: "payoutRatio", percent: true },
  ];
  const dividends: IndicatorSpec[] = [
    { label: "Dividend Yield", value: m("dividendYieldIndicatedAnnual"), defKey: "dividendYield", percent: true },
    { label: "Dividend Per Share", value: m("dividendPerShareTTM"), defKey: "dividendPerShare" },
    { label: "5Y Dividend Growth", value: m("dividendGrowthRate5Y"), defKey: "dividendGrowth5Y", percent: true },
  ];
  const momentum: IndicatorSpec[] = [
    { label: "YTD Return", value: m("yearToDatePriceReturnDaily"), defKey: "ytdReturn", percent: true },
    { label: "52-Week Return", value: m("52WeekPriceReturnDaily"), defKey: "week52Return", percent: true },
    { label: "vs. S&P 500 (13-wk)", value: m("priceRelativeToS&P50013Week"), defKey: "priceVsSP500", percent: true },
    { label: "Beta", value: m("beta"), defKey: "beta" },
  ];

  return (
    <section className="ticker-page">
      <Header symbol={symbol} quote={quote} profile={profile} />

      <div className="ticker-stats">
        {([["Open", quote.o], ["Day high", quote.h], ["Day low", quote.l], ["Prev close", quote.pc]] as [string, number][]).map(([label, v]) => (
          <div key={label} className="cp-stat"><span className="muted small">{label}</span><strong>{fmtPrice(v)}</strong></div>
        ))}
      </div>

      {low !== null && high !== null && (
        <div className="sectors-range">
          <span className="muted small">52-week range</span>
          <span>{fmtPrice(low)}</span>
          <div className="sectors-range-bar">{rangePos !== null && <span style={{ left: `${rangePos}%` }} />}</div>
          <span>{fmtPrice(high)}</span>
        </div>
      )}

      <Section title="Company facts">
        <dl className="ticker-facts">
          {([["Exchange", profile.exchange], ["Industry", profile.finnhubIndustry], ["Headquarters", profile.country], ["Listed (IPO)", profile.ipo]] as [string, string | undefined][]).map(([label, v]) => (
            v ? <div key={label}><dt className="muted small">{label}</dt><dd>{v}</dd></div> : null
          ))}
          {profile.weburl && <div><dt className="muted small">Website</dt><dd><a href={profile.weburl} target="_blank" rel="noopener noreferrer">{profile.weburl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></div>}
        </dl>
      </Section>

      <Section title="Valuation" sub="colour dots compare each figure with typical ranges for this company's sector"><IndicatorGrid items={valuation} industry={industry} /></Section>
      <Section title="Growth"><IndicatorGrid items={growth} industry={industry} /></Section>
      <Section title="Profitability"><IndicatorGrid items={profitability} industry={industry} /></Section>
      <Section title="Financial health"><IndicatorGrid items={health} industry={industry} /></Section>
      <Section title="Efficiency"><IndicatorGrid items={efficiency} industry={industry} /></Section>
      <Section title="Risk"><IndicatorGrid items={risk} industry={industry} /></Section>
      <Section title="Dividends"><IndicatorGrid items={dividends} industry={industry} /></Section>
      <Section title="Momentum"><IndicatorGrid items={momentum} industry={industry} /></Section>

      <Section title="Still on the main site">
        <p className="muted small">These sections of the ticker page haven't been ported yet. Each opens on the main site for now:</p>
        <ul className="ticker-todo">{STILL_ON_MAIN_SITE.map(s => <li key={s}><a href={`/?ticker=${encodeURIComponent(symbol)}`}>{s} →</a></li>)}</ul>
      </Section>
    </section>
  );
}

function Header({ symbol, quote, profile }: { symbol: string; quote: Quote; profile: CompanyProfile | null }) {
  const change = quote.d ?? 0;
  const pct = quote.dp ?? 0;
  return (
    <header className="ticker-header">
      {profile?.logo && <img className="ticker-logo" src={profile.logo} alt="" />}
      <div>
        <h2>{profile?.name ?? symbol} <span className="ticker-badge">{symbol}</span></h2>
        <p className="muted small">{profile?.exchange ?? "ETF or fund"}{profile?.finnhubIndustry ? ` · ${profile.finnhubIndustry}` : ""}</p>
      </div>
      <div className="ticker-price">
        <strong>{fmtPrice(quote.c)}</strong>
        <span className={changeClass(change)}>{change >= 0 ? "+" : ""}{change.toFixed(2)} ({fmtPct(pct)})</span>
      </div>
    </header>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="cp-section">
      <h4>{title} {sub && <span className="muted small">{sub}</span>}</h4>
      {children}
    </section>
  );
}

