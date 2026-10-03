// components/TickerPage.tsx — the ticker deep-dive page, first slice (React).
// Covers the stock overview: header with price and move, the day's range and
// the 52-week range, company facts and the valuation figures. The rest of the
// page (growth, profitability, financial statements, filings, options, chart,
// news, tooltips) is still on the main site and is linked from here.
//
// ETFs and crypto have their own layouts on the main site, so they're pointed
// there for now.

import { useEffect, useState } from "react";
import { getQuote, getMetric, getCompanyProfile, metricValue, type Quote, type Metric, type CompanyProfile } from "../lib/finnhub";
import { fmtCompact, fmtPct, fmtPrice, changeClass } from "../lib/format";

const SECTIONS_ON_MAIN_SITE = [
  "Growth and profitability", "Financial health and efficiency", "Dividends and risk",
  "Financial statements", "Shares and ownership", "Insider transactions", "SEC filings",
  "Options", "Price chart", "Recommendations and earnings", "News and peers",
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
    return (
      <section className="ticker-page">
        <p>No live quote for <strong>{symbol}</strong>. Check the symbol, or try again in a minute if the free data tier is rate-limited.</p>
      </section>
    );
  }
  if (!profile) {
    return (
      <section className="ticker-page">
        <Header symbol={symbol} quote={quote} profile={null} />
        <p className="muted">{symbol} is an ETF, fund, or index, or it has no company profile. The ETF and crypto layouts are still on the main site.</p>
        <a className="cp-btn" href={`/?ticker=${encodeURIComponent(symbol)}`}>Open {symbol} on the main site →</a>
      </section>
    );
  }

  const low = metricValue(metric, "52WeekLow"), high = metricValue(metric, "52WeekHigh");
  const rangePos = low !== null && high !== null && high > low ? Math.max(0, Math.min(100, ((quote.c - low) / (high - low)) * 100)) : null;
  const pe = metricValue(metric, "peTTM"), pb = metricValue(metric, "pbAnnual");

  return (
    <section className="ticker-page">
      <Header symbol={symbol} quote={quote} profile={profile} />

      <div className="ticker-stats">
        {[["Open", quote.o], ["Day high", quote.h], ["Day low", quote.l], ["Prev close", quote.pc]].map(([label, v]) => (
          <div key={label as string} className="cp-stat"><span className="muted small">{label as string}</span><strong>{fmtPrice(v as number)}</strong></div>
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
          {[["Exchange", profile.exchange], ["Industry", profile.finnhubIndustry], ["Headquarters", profile.country], ["Listed (IPO)", profile.ipo]].map(([label, v]) => (
            v ? <div key={label as string}><dt className="muted small">{label as string}</dt><dd>{v}</dd></div> : null
          ))}
          {profile.weburl && <div><dt className="muted small">Website</dt><dd><a href={profile.weburl} target="_blank" rel="noopener noreferrer">{profile.weburl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></div>}
        </dl>
      </Section>

      <Section title="Valuation" sub="latest figures; hover tooltips are on the main site for now">
        <div className="ticker-valuation">
          {[
            ["P/E ratio", pe?.toFixed(2)],
            ["P/B ratio", pb?.toFixed(2)],
            ["EV/EBITDA", metricValue(metric, "evEbitdaTTM")?.toFixed(2)],
            ["Price / sales", metricValue(metric, "psTTM")?.toFixed(2)],
            ["Market cap", profile.marketCapitalization ? `$${fmtCompact(profile.marketCapitalization * 1e6)}` : undefined],
            ["EPS (TTM)", metricValue(metric, "epsTTM")?.toFixed(2)],
            ["Shares outstanding", profile.shareOutstanding ? `${fmtCompact(profile.shareOutstanding * 1e6)}` : undefined],
          ].map(([label, value]) => (
            <div key={label as string} className="ticker-card">
              <span className="muted small">{label}</span>
              <strong>{value ?? "—"}</strong>
            </div>
          ))}
        </div>
        {pe !== null && pe > 0 && (
          <p className="small">Put $100 into this stock and you're claiming about <strong>${(100 / pe).toFixed(2)}</strong> of the company's annual earnings. That's the flip side of a P/E of {pe.toFixed(1)}.</p>
        )}
      </Section>

      <Section title="Still on the main site">
        <p className="muted small">These sections of the ticker page haven't been ported yet. Each one opens on the main site for now:</p>
        <ul className="ticker-todo">{SECTIONS_ON_MAIN_SITE.map(s => <li key={s}><a href={`/?ticker=${encodeURIComponent(symbol)}`}>{s} →</a></li>)}</ul>
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
