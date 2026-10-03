// components/CountryProfile.tsx — the profile panel for one country on the
// Market Data page: market snapshot (live country-ETF price and performance),
// "What stands out", economy indicators with peer position, similar
// economies, World Bank history and governance scores. Ports renderCountryPanel()
// and its helpers in marketData.js.

import { useEffect, useState } from "react";
import type { Country } from "../lib/markets";
import { COUNTRY_LIST, exchangeStatus, localTime } from "../lib/markets";
import { getMetric, metricValue, type Metric, type Quote } from "../lib/finnhub";
import { WB_BY_KEY, WB_INDICATORS, peerStats, getHistory, getCountryValue, GOVERNANCE_INDICATORS, type SeriesPoint, type WbStore } from "../lib/worldBank";
import { fmtPct, fmtPrice, fmtCompact, changeClass } from "../lib/format";

type WbData = Record<string, WbStore | undefined>;

// Indicator groups as shown on the page (vanilla: KPI_GROUPS).
const KPI_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Economy", keys: ["gdp", "gdpg", "gdppc", "infl", "unemp", "rint", "money"] },
  { title: "Trade & external position", keys: ["cab", "trade", "exports", "fdi", "res", "fx"] },
  { title: "Fiscal", keys: ["debt"] },
  { title: "People & society", keys: ["pop", "urban", "life", "inet", "gini"] },
  { title: "Stability", keys: ["polstab"] },
];

const HISTORY = [
  { id: "NY.GDP.MKTP.KD.ZG", title: "GDP growth", unit: "%", color: "var(--accent)", decimals: 1 },
  { id: "FP.CPI.TOTL.ZG", title: "Inflation", unit: "%", color: "#f59e0b", decimals: 1 },
  { id: "SL.UEM.TOTL.ZS", title: "Unemployment", unit: "%", color: "#6366f1", decimals: 1 },
  { id: "NY.GDP.PCAP.CD", title: "GDP per capita (US$)", unit: "", color: "#0ea5e9", decimals: 0 },
  { id: "BN.CAB.XOKA.GD.ZS", title: "Current account (% of GDP)", unit: "%", color: "#ec4899", decimals: 1 },
  { id: "PA.NUS.FCRF", title: "Currency per US$", unit: "", color: "#8b5cf6", decimals: 1 },
];

interface Props {
  country: Country;
  quote: Quote | null | undefined;
  wbData: WbData;
  onSelect: (iso2: string) => void;
}

export function CountryProfile({ country, quote, wbData, onSelect }: Props) {
  const status = exchangeStatus(country);
  const metric = useMetric(country.etf);
  const isTaiwan = country.iso3 === "TWN";

  return (
    <div className="market-card">
      <div className="market-card-head">
        <span className="market-flag">{country.flag}</span>
        <div>
          <h3>{country.name} <span className="ctag">{country.group}</span></h3>
          <p className="muted small">
            {country.city}{country.ex ? ` · ${country.ex}` : ""}{country.g7 ? " · G7" : ""}
            {status && <> · <span className={status.isOpen ? "market-open" : "status-closed"}>● {status.isOpen ? "Open" : "Closed"}</span> ({country.open}–{country.close} local, now {country.tz ? localTime(country.tz) : ""})</>}
          </p>
          {country.note && <p className="muted small">{country.note}</p>}
        </div>
      </div>

      {country.etf && (
        <Section title="Market snapshot" sub={`${country.etf} · country ETF used as an index proxy`}>
          {quote === undefined ? <p className="muted small">Loading {country.etf}…</p> : quote ? (
            <div className="market-quote">
              <strong className="market-price">{fmtPrice(quote.c)}</strong>{" "}
              <span className={changeClass(quote.dp)}>{quote.d !== null ? `${quote.d >= 0 ? "+" : ""}${quote.d.toFixed(2)} ` : ""}({fmtPct(quote.dp)})</span>
              <div className="market-perf">
                {[["5D", "5DayPriceReturnDaily"], ["MTD", "monthToDatePriceReturnDaily"], ["YTD", "yearToDatePriceReturnDaily"], ["1Y", "52WeekPriceReturnDaily"]].map(([label, key]) => {
                  const v = metricValue(metric, key);
                  return <div key={label} className="market-perf-cell"><span className="muted small">{label}</span><strong className={changeClass(v)}>{fmtPct(v, 1)}</strong></div>;
                })}
              </div>
            </div>
          ) : <p className="muted small">Couldn't load a live {country.etf} quote right now (free-tier rate limit). It will retry on the next visit.</p>}
        </Section>
      )}

      {!isTaiwan && <Insights country={country} wbData={wbData} />}

      <Section title="Economy at a glance" sub="latest published figure · dot = rule-of-thumb read · bar = position among tracked countries">
        {isTaiwan ? <p className="muted small">The World Bank doesn't publish country data for Taiwan, so no economic indicators are available here.</p> : (
          KPI_GROUPS.map(g => (
            <div key={g.title} className="cp-kpi-group">
              <div className="cp-kpi-group-title">{g.title}</div>
              <div className="kpi-grid">{g.keys.map(k => <KpiCard key={k} indicatorKey={k} iso3={country.iso3} store={wbData[k]} />)}</div>
            </div>
          ))
        )}
      </Section>

      <SimilarEconomies country={country} wbData={wbData} onSelect={onSelect} />

      <Section title="History" sub="World Bank, annual">
        {isTaiwan ? <p className="muted small">No World Bank history for Taiwan.</p> : <History iso3={country.iso3} />}
      </Section>

      <Section title="Governance" sub="Worldwide Governance Indicators, −2.5 (weak) to +2.5 (strong)">
        {isTaiwan ? <p className="muted small">Not covered by the World Bank.</p> : <Governance iso3={country.iso3} />}
      </Section>

      <p className="muted small market-foot">
        Sources: World Bank Open Data (annual, latest year — often lags 1–2 years), Worldwide Governance Indicators, Finnhub (country ETF). Coloured dots are rules of thumb, not ratings.
      </p>
    </div>
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

function useMetric(etf: string | undefined): Metric | null | undefined {
  const [metric, setMetric] = useState<Metric | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setMetric(undefined);
    if (etf) getMetric(etf).then(m => { if (live) setMetric(m); });
    return () => { live = false; };
  }, [etf]);
  return metric;
}

function KpiCard({ indicatorKey, iso3, store }: { indicatorKey: string; iso3: string; store: WbStore | undefined }) {
  const ind = WB_BY_KEY[indicatorKey];
  if (!store) return <div className="kpi kpi-na"><div className="kpi-label">{ind.label}</div><div className="kpi-value muted">…</div><div className="kpi-sub muted">loading</div></div>;
  const d = store[iso3];
  if (!d) return <div className="kpi kpi-na"><div className="kpi-label">{ind.label}</div><div className="kpi-value muted">—</div><div className="kpi-sub muted">not published</div></div>;
  const ps = peerStats(store, iso3);
  const risk = ind.risk ? ind.risk(d.value) : null;
  const pos = ps && ps.max > ps.min ? ((ps.value - ps.min) / (ps.max - ps.min)) * 100 : null;
  return (
    <div className="kpi">
      <div className="kpi-label">{ind.label}</div>
      <div className="kpi-value">{risk && <i className={`risk-dot risk-${risk}`} />}{ind.fmt(d.value)}</div>
      {pos !== null && (
        <div className="kpi-peer" title={`Range across tracked countries: ${ind.fmt(ps!.min)} to ${ind.fmt(ps!.max)} · median ${ind.fmt(ps!.median)}`}>
          <span className="kpi-peer-track"><i style={{ left: `${pos.toFixed(0)}%` }} /></span>
        </div>
      )}
      <div className="kpi-sub muted">{ps ? `#${ps.rank} of ${ps.n} · ` : ""}{d.date}</div>
    </div>
  );
}

// Plain-English observations drawn from the same numbers as the cards.
function Insights({ country, wbData }: { country: Country; wbData: WbData }) {
  const out: string[] = [];
  const say = (key: string, fn: (ps: NonNullable<ReturnType<typeof peerStats>>, label: (v: number) => string) => string | null) => {
    const ps = peerStats(wbData[key], country.iso3);
    if (!ps) return;
    const text = fn(ps, WB_BY_KEY[key].fmt);
    if (text) out.push(text);
  };
  say("gdpg", (ps, f) => `Growth of ${f(ps.value)} is ${ps.value > ps.median ? "above" : "below"} the tracked-country median (${f(ps.median)}), ranked #${ps.rank} of ${ps.n}.`);
  say("infl", (ps, f) => ps.value > 10 ? `Inflation of ${f(ps.value)} is high by any standard. It erodes savings and usually forces tight monetary policy.` : `Inflation of ${f(ps.value)} against a median of ${f(ps.median)} (#${ps.rank} of ${ps.n}).`);
  say("unemp", (ps, f) => `Unemployment of ${f(ps.value)} is ${ps.value > ps.median ? "higher" : "lower"} than the median (${f(ps.median)}).`);
  say("debt", (ps, f) => ps.value > 100 ? `Government debt at ${f(ps.value)} of GDP is above the 100% level many analysts treat as a caution flag.` : `Government debt is ${f(ps.value)} of GDP (median ${f(ps.median)}).`);
  say("cab", (ps, f) => ps.value < -3 ? `A current-account deficit of ${f(ps.value)} of GDP means the country relies on foreign capital, a currency-risk factor.` : ps.value > 3 ? `A current-account surplus of ${f(ps.value)} of GDP means the country is a net lender to the rest of the world.` : null);
  say("res", (ps, f) => `Foreign-exchange reserves of ${f(ps.value)} rank #${ps.rank} of ${ps.n}, a buffer against currency and capital-flow shocks.`);
  say("polstab", (ps, f) => ps.value < -1 ? `Political stability scores ${f(ps.value)} (roughly −2.5 weak to +2.5 strong), a risk factor for investors.` : null);
  if (!out.length) return null;
  return (
    <Section title="What stands out" sub={`auto-generated from the data below, compared with the ${COUNTRY_LIST.length - 1} other tracked countries`}>
      <ul className="cp-insights">{out.map((b, i) => <li key={i}>{b}</li>)}</ul>
    </Section>
  );
}

function SimilarEconomies({ country, wbData, onSelect }: { country: Country; wbData: WbData; onSelect: (iso2: string) => void }) {
  const store = wbData.gdppc;
  const mine = store?.[country.iso3];
  if (!store || !mine) return null;
  const similar = COUNTRY_LIST
    .filter(x => x.iso3 !== country.iso3 && store[x.iso3])
    .sort((a, b) => Math.abs(Math.log(store[a.iso3].value / mine.value)) - Math.abs(Math.log(store[b.iso3].value / mine.value)))
    .slice(0, 5);
  if (!similar.length) return null;
  return (
    <Section title="Economies of similar income level">
      <div className="cp-similar">
        {similar.map(x => (
          <button key={x.iso2} type="button" className="cp-chip" onClick={() => onSelect(x.iso2)}>
            {x.flag} {x.name} <span className="muted">{fmtCompact(store[x.iso3].value, "$")}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

function History({ iso3 }: { iso3: string }) {
  const [series, setSeries] = useState<Record<string, SeriesPoint[] | null | undefined>>({});
  useEffect(() => {
    let live = true;
    HISTORY.forEach(h => {
      getHistory(iso3, h.id).then(s => { if (live) setSeries(prev => ({ ...prev, [h.id]: s })); }).catch(() => { if (live) setSeries(prev => ({ ...prev, [h.id]: null })); });
    });
    return () => { live = false; };
  }, [iso3]);
  return (
    <div className="cp-charts">
      {HISTORY.map(h => {
        const s = series[h.id];
        const last = s && s.length ? s[s.length - 1] : null;
        return (
          <div key={h.id} className="cp-chart">
            <div className="cp-chart-head">
              <strong>{h.title}</strong>
              {last ? <span>{last.value.toLocaleString(undefined, { maximumFractionDigits: h.decimals })}{h.unit} <span className="muted small">{last.label}</span></span> : <span className="muted small">{s === undefined ? "loading…" : "no data"}</span>}
            </div>
            {s && s.length > 1 && <Sparkline points={s.map(p => p.value)} color={h.color} />}
          </div>
        );
      })}
    </div>
  );
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 240, h = 48;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const d = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="cp-sparkline" preserveAspectRatio="none" aria-hidden="true"><polyline points={d} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function Governance({ iso3 }: { iso3: string }) {
  const [vals, setVals] = useState<Record<string, number | null | undefined>>({});
  useEffect(() => {
    let live = true;
    GOVERNANCE_INDICATORS.forEach(g => {
      getCountryValue(iso3, g.id).then(v => { if (live) setVals(prev => ({ ...prev, [g.id]: v })); }).catch(() => { if (live) setVals(prev => ({ ...prev, [g.id]: null })); });
    });
    return () => { live = false; };
  }, [iso3]);
  return (
    <div className="cp-gov">
      {GOVERNANCE_INDICATORS.map(g => {
        const v = vals[g.id];
        if (v === undefined) return <div key={g.id} className="gov-row"><span>{g.label}</span><span className="muted">…</span></div>;
        if (v === null) return <div key={g.id} className="gov-row"><span>{g.label}</span><span className="muted">—</span></div>;
        const pct = Math.max(0, Math.min(100, ((v + 2.5) / 5) * 100));
        const fill = v >= 0 ? { left: "50%", width: `${pct - 50}%` } : { left: `${pct}%`, width: `${50 - pct}%` };
        return (
          <div key={g.id} className="gov-row">
            <span>{g.label}</span>
            <span className="gov-track"><i className="gov-zero" /><i className={`gov-fill ${v >= 0 ? "pos" : "neg"}`} style={fill} /></span>
            <span className="small">{v.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

export { WB_INDICATORS };
