// components/RiskDashboard.tsx — the "Global risk dashboard" under the Market
// Data map (ports riskDashboard.js). Two halves: US market gauges from FRED
// (each with a sparkline and a rule-of-thumb reading), and a country scoreboard
// built from the World Bank data the map already loads. Clicking a scoreboard
// row opens that country's profile.

import { useEffect, useMemo, useState } from "react";
import { RISK_GROUPS, RISK_SERIES } from "../data/risk";
import { fetchSeries, levelFor, LEVEL_TEXT, type SeriesData } from "../lib/risk";
import { COUNTRY_LIST } from "../lib/markets";
import { WB_BY_KEY, type WbStore } from "../lib/worldBank";

type Loaded = Record<string, SeriesData | null | undefined>;

const delta = (a: number, b: number) => {
  const d = a - b;
  return `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(Math.abs(d) < 10 ? 2 : 1)}`;
};

export function RiskDashboard({ wbData, onSelect }: { wbData: Record<string, WbStore | undefined>; onSelect: (iso2: string) => void }) {
  const [loaded, setLoaded] = useState<Loaded>({});

  useEffect(() => {
    let live = true;
    RISK_SERIES.forEach(s => {
      fetchSeries(s).then(d => { if (live) setLoaded(prev => ({ ...prev, [s.id]: d })); }).catch(() => { if (live) setLoaded(prev => ({ ...prev, [s.id]: null })); });
    });
    return () => { live = false; };
  }, []);

  const gauges = RISK_SERIES.filter(s => !s.info && s.bands && loaded[s.id]);
  const levels = gauges.map(s => ({ s, ...levelFor(s, loaded[s.id]!) }));
  const hot = levels.filter(l => l.level === "elevated" || l.level === "high");

  return (
    <section className="market-risk">
      <div className="risk-summary">
        {levels.length === 0 ? <span className="muted small">Loading gauges…</span> : (
          <>
            <div className="risk-strip" title="One square per gauge">{levels.map(l => <i key={l.s.id} className={`level-${l.level}`} title={`${l.s.title}: ${l.label}`} />)}</div>
            <div className="risk-summary-text">
              <strong>{hot.length} of {levels.length}</strong> gauges are elevated or high
              {hot.length > 0 && <>: {hot.map(l => <span key={l.s.id} className={`risk-badge level-${l.level}`}>{l.s.title.split(" — ")[0]}</span>)}</>}
            </div>
          </>
        )}
      </div>

      {RISK_GROUPS.map(g => (
        <div key={g.id} className="risk-group">
          <div className="risk-group-head"><h4>{g.title}</h4><span className="muted small">{g.blurb}</span></div>
          <div className="risk-grid">
            {RISK_SERIES.filter(s => s.group === g.id).map(s => (
              <GaugeCard key={s.id} title={s.title} data={loaded[s.id]} loading={loaded[s.id] === undefined} series={s} />
            ))}
          </div>
        </div>
      ))}

      <div className="risk-group">
        <div className="risk-group-head"><h4>Country scoreboard</h4><span className="muted small">Inflation, growth, jobs, debt and stability across all tracked countries — World Bank, latest available year</span></div>
        <Scoreboard wbData={wbData} onSelect={onSelect} />
      </div>

      <details className="risk-guide">
        <summary>How to read this dashboard</summary>
        <p>Each gauge shows the latest value, a one-year sparkline, how it has changed, and a coloured reading based on <em>conventional rules of thumb</em>. The cutoffs are printed on every card. They are shorthand, not forecasts or ratings.</p>
        <p><strong>Markets vs economy:</strong> this is the fast-moving markets view (prices, spreads, volatility, updated daily). The Macro tab is the slower economy view.</p>
        <p><strong>Coverage:</strong> the gauges are US-published (FRED). Global coverage comes from the country scoreboard and the map's colour-by modes.</p>
      </details>
    </section>
  );
}

function GaugeCard({ title, data, loading, series }: { title: string; data: SeriesData | null | undefined; loading: boolean; series: (typeof RISK_SERIES)[number] }) {
  if (loading) return <div className="risk-card level-info risk-skeleton"><div className="risk-card-top"><span className="risk-title">{title}</span></div><p className="muted small">Loading…</p></div>;
  if (!data) return <div className="risk-card level-info"><div className="risk-card-top"><span className="risk-title">{title}</span></div><p className="muted small">Couldn't load this series right now.</p></div>;
  const { level, label } = levelFor(series, data);
  const unit = { d: "vs ~1 month ago", w: "vs ~1 month ago", m: "vs last reading" }[series.freq];
  const date = new Date(`${data.last.date}T12:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const levelColor = level === "info" ? "var(--risk-normal)" : `var(--risk-${level})`;
  return (
    <div className={`risk-card level-${level}`}>
      <div className="risk-card-top">
        <span className="risk-title">{title}</span>
        {label && <span className={`risk-badge level-${level}`}>{label}</span>}
      </div>
      <div className="risk-value">{series.fmt(data.last.value)} <span className="risk-date">{date}</span></div>
      <Spark values={data.asc.slice(-140).map(o => o.value)} color={levelColor} />
      <div className="risk-delta small muted">
        <span>{delta(data.last.value, data.prev.value)} {unit}</span>
        <span>{delta(data.last.value, data.yearAgo.value)} vs 1 year ago</span>
      </div>
      <p className="risk-explain">{series.explain}</p>
      {series.bandText && <p className="risk-bands small muted">{series.bandText}</p>}
      <a className="risk-src small" href={`https://fred.stlouisfed.org/series/${series.id}`} target="_blank" rel="noopener noreferrer">FRED · {series.id} ↗</a>
      <span className="sr-only">{LEVEL_TEXT[level]}</span>
    </div>
  );
}

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 240, h = 38;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`).join(" ");
  return <div className="risk-spark"><svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg></div>;
}

const SCORE_COLS: { key: string; label: string }[] = [
  { key: "infl", label: "Inflation" }, { key: "gdpg", label: "GDP growth" }, { key: "unemp", label: "Unemployment" },
  { key: "debt", label: "Govt debt / GDP" }, { key: "cab", label: "Current acct / GDP" }, { key: "polstab", label: "Political stability" },
];

function Scoreboard({ wbData, onSelect }: { wbData: Record<string, WbStore | undefined>; onSelect: (iso2: string) => void }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "infl", dir: -1 });

  const rows = useMemo(() => COUNTRY_LIST.filter(c => c.iso3 !== "TWN").map(c => {
    const vals: Record<string, number | null> = {};
    let flags = 0;
    SCORE_COLS.forEach(col => {
      const v = wbData[col.key]?.[c.iso3]?.value ?? null;
      vals[col.key] = v;
      const risk = WB_BY_KEY[col.key].risk;
      if (v !== null && risk && risk(v) === "bad") flags++;
    });
    return { c, vals, flags };
  }), [wbData]);

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = sort.key === "flags" ? a.flags : sort.key === "name" ? a.c.name : a.vals[sort.key];
    const bv = sort.key === "flags" ? b.flags : sort.key === "name" ? b.c.name : b.vals[sort.key];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === "string" && typeof bv === "string") return sort.dir * av.localeCompare(bv);
    return sort.dir * ((av as number) - (bv as number));
  }), [rows, sort]);

  const top = (key: string, dir: 1 | -1) => rows
    .filter(r => r.vals[key] !== null)
    .sort((a, b) => dir * ((a.vals[key] as number) - (b.vals[key] as number)))
    .slice(0, 3);

  if (!Object.keys(wbData).length) return <p className="muted small">Loading…</p>;

  const clickSort = (key: string) => setSort(s => ({ key, dir: s.key === key ? (s.dir * -1) as 1 | -1 : key === "name" ? 1 : -1 }));
  const spotlight: { title: string; list: ReturnType<typeof top>; key: string }[] = [
    { title: "Highest inflation", list: top("infl", -1), key: "infl" },
    { title: "Highest debt / GDP", list: top("debt", -1), key: "debt" },
    { title: "Weakest growth", list: top("gdpg", 1), key: "gdpg" },
    { title: "Largest current-account deficits", list: top("cab", 1), key: "cab" },
  ];

  return (
    <>
      <div className="score-spotlight">
        {spotlight.map(group => (
          <div key={group.title}>
            <span className="muted small">{group.title}</span>
            <div className="cp-similar">
              {group.list.map(r => (
                <button key={r.c.iso2} type="button" className="cp-chip" onClick={() => onSelect(r.c.iso2)}>
                  {r.c.flag} {r.c.name} <b>{WB_BY_KEY[group.key].fmt(r.vals[group.key] as number)}</b>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="crypto-table-scroll">
        <table className="crypto-table quotes-table score-table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => clickSort("name")}>Country</th>
              {SCORE_COLS.map(col => <th key={col.key} className="sortable-th" onClick={() => clickSort(col.key)}>{col.label}</th>)}
              <th className="sortable-th" onClick={() => clickSort("flags")} title="Number of indicators in the red zone (rule of thumb)">Red flags</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.c.iso2} className="score-row" onClick={() => onSelect(r.c.iso2)}>
                <td>{r.c.flag} <strong>{r.c.name}</strong></td>
                {SCORE_COLS.map(col => {
                  const v = r.vals[col.key];
                  const ind = WB_BY_KEY[col.key];
                  return (
                    <td key={col.key} className={v === null ? "muted" : ""}>
                      {v === null ? "—" : <>{ind.risk && <i className={`risk-dot risk-${ind.risk(v)}`} />}{ind.fmt(v)}</>}
                    </td>
                  );
                })}
                <td>{r.flags ? <span className={`flag-count flag-${Math.min(r.flags, 3)}`}>{r.flags}</span> : <span className="muted">0</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">Dot colours are rule-of-thumb reads (for example inflation above 10%, debt above 100% of GDP, a current-account deficit wider than 6% of GDP). Click a row for the full country profile. Taiwan isn't covered by the World Bank.</p>
    </>
  );
}
