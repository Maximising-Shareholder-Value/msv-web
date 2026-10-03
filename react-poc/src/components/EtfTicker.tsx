// components/EtfTicker.tsx — the ETF layout on the ticker page. Ports the ETF
// branch of loadTicker() and renderETFPerformance() / renderETFTradingActivity()
// from script.js: the fund's name, issuer, ISIN and description; price performance
// and trading activity with the same tooltips; and the chart, options and filings,
// which work the same for funds.

import { useEffect, useState } from "react";
import { getFundProfile, metricValue, type FundProfile, type Metric, type Quote } from "../lib/finnhub";
import { issuerFor } from "../lib/etf";
import { ETF_ISSUER_INFO } from "../data/etfCategories";
import { IndicatorGrid, type IndicatorSpec } from "./Indicators";
import { PriceChart } from "./PriceChart";
import { Options } from "./Options";
import { Filings } from "./Filings";

export function EtfTicker({ symbol, quote, metric }: { symbol: string; quote: Quote; metric: Metric | null | undefined }) {
  const [fund, setFund] = useState<FundProfile | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setFund(undefined);
    getFundProfile(symbol).then(f => { if (live) setFund(f); });
    return () => { live = false; };
  }, [symbol]);

  const name = fund?.companyName ?? symbol;
  // SPY's legal name starts "State Street" rather than "SPDR", so the prefix rule misses it.
  const issuer = issuerFor(symbol, name) ?? (name.startsWith("State Street") ? "State Street Global Advisors (SPDR)" : null);
  const m = (k: string) => metricValue(metric, k);

  const performance: IndicatorSpec[] = [
    { label: "5-Day Return", value: m("5DayPriceReturnDaily"), defKey: "return5Day", percent: true },
    { label: "Month-to-Date Return", value: m("monthToDatePriceReturnDaily"), defKey: "returnMTD", percent: true },
    { label: "13-Week Return", value: m("13WeekPriceReturnDaily"), defKey: "return13Week", percent: true },
    { label: "26-Week Return", value: m("26WeekPriceReturnDaily"), defKey: "return26Week", percent: true },
    { label: "YTD Return", value: m("yearToDatePriceReturnDaily"), defKey: "ytdReturn", percent: true },
    { label: "52-Week Return", value: m("52WeekPriceReturnDaily"), defKey: "week52Return", percent: true },
  ];
  const activity: IndicatorSpec[] = [
    { label: "Beta", value: m("beta"), defKey: "beta" },
    { label: "3-Month Volatility", value: m("3MonthADReturnStd"), defKey: "volatility3Month" },
    { label: "Avg Volume (10-Day, M)", value: m("10DayAverageTradingVolume"), defKey: "avgVolume10Day" },
    { label: "Avg Volume (3-Month, M)", value: m("3MonthAverageTradingVolume"), defKey: "avgVolume3Month" },
  ];

  return (
    <>
      <section className="cp-section">
        <h4>About this fund</h4>
        {fund === undefined ? <p className="muted small">Loading fund details…</p> : (
          <>
            <dl className="ticker-facts">
              {issuer && <div><dt className="muted small">Fund issuer</dt><dd>{issuer}</dd></div>}
              {fund?.isin && <div><dt className="muted small">ISIN</dt><dd>{fund.isin}</dd></div>}
              {fund?.website && <div><dt className="muted small">Website</dt><dd><a href={fund.website} target="_blank" rel="noopener noreferrer">{fund.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></div>}
            </dl>
            {fund?.description
              ? <p className="small fund-description">{fund.description}</p>
              : issuer && ETF_ISSUER_INFO[issuer] && <p className="small muted">{ETF_ISSUER_INFO[issuer]}</p>}
            <p className="muted small">Expense ratio, holdings and fund size aren't shown: they're paywalled on every free data source this app checks.</p>
          </>
        )}
      </section>

      <section className="cp-section"><h4>Price performance</h4><IndicatorGrid items={performance} industry={null} /></section>
      <section className="cp-section"><h4>Trading activity &amp; risk</h4><IndicatorGrid items={activity} industry={null} /></section>
      <section className="cp-section"><h4>Price chart</h4><PriceChart symbol={symbol} /></section>
      <section className="cp-section"><h4>Options <span className="muted small">indicative quotes; expiries within 45 days</span></h4><Options symbol={symbol} price={quote.c} /></section>
      <section className="cp-section"><h4>SEC filings <span className="muted small">fund filings, such as portfolio holdings reports</span></h4><Filings symbol={symbol} /></section>
    </>
  );
}
