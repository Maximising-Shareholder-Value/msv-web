// components/MacroPage.tsx — the Macro page (React). Ports macro.js: the economy
// view by country. The US uses FRED's monthly and quarterly series; other
// countries use World Bank annual figures and governance scores. Pick one
// country, or compare up to four side by side. Any country the World Bank
// tracks can be searched for.

import { useEffect, useState } from "react";
import { MACRO_SERIES, MACRO_COUNTRIES, WB_ECON, WB_GOVERNANCE, wbLatest, fredLatest, wbCountryList, fmtReading, type Reading, type WbCountry } from "../lib/macro";

const MAX_COMPARE = 4;

interface Picked { iso3: string; label: string; flag: string; source: "fred" | "worldbank" }

export function MacroPage() {
  const [picked, setPicked] = useState<Picked>({ iso3: "USA", label: "United States", flag: "🇺🇸", source: "fred" });
  const [compare, setCompare] = useState(false);
  const [compareList, setCompareList] = useState<string[]>(["USA", "CHN"]);
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<WbCountry[] | null>(null);

  useEffect(() => {
    let live = true;
    wbCountryList().then(c => { if (live) setCountries(c); });
    return () => { live = false; };
  }, []);

  const matches = search.trim().length >= 2 && countries
    ? countries.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : [];
  const pick = (iso3: string, label: string, flag: string, source: "fred" | "worldbank") => setPicked({ iso3, label, flag, source });

  return (
    <section className="macro-page">
      <header className="sectors-header">
        <h2>Macro</h2>
        <span className="muted small">The economy by country: interest rates, inflation, jobs, growth and governance</span>
      </header>

      <div className="macro-controls">
        <div className="macro-country-picker">
          {MACRO_COUNTRIES.map(c => {
            const active = compare ? compareList.includes(c.iso3) : picked.iso3 === c.iso3;
            return (
              <button key={c.iso3} type="button" className={`macro-country-btn${active ? " active" : ""}`} onClick={() => {
                if (compare) setCompareList(l => l.includes(c.iso3) ? l.filter(x => x !== c.iso3) : l.length < MAX_COMPARE ? [...l, c.iso3] : l);
                else pick(c.iso3, c.label, c.flag, c.source as "fred" | "worldbank");
              }}>{c.flag} {c.label}</button>
            );
          })}
        </div>
        <div className="macro-search-row">
          <input type="search" className="news-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search any country…" aria-label="Search any country" />
          {matches.map(c => (
            <button key={c.iso3} type="button" className="macro-country-btn" onClick={() => {
              if (compare) setCompareList(l => l.includes(c.iso3) || l.length >= MAX_COMPARE ? l : [...l, c.iso3]);
              else pick(c.iso3, c.name, "🌐", "worldbank");
              setSearch("");
            }}>{c.name}</button>
          ))}
        </div>
        <label className="options-toggle"><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} /> Compare up to {MAX_COMPARE} countries</label>
      </div>

      {compare ? <CompareView iso3s={compareList} /> : <SingleCountry picked={picked} />}

      <p className="muted small">US figures are from the Federal Reserve (FRED) and update monthly or quarterly. Other countries are annual World Bank figures, with the latest year that has data. Governance scores run from about −2.5 (weak) to +2.5 (strong).</p>
    </section>
  );
}

function SingleCountry({ picked }: { picked: Picked }) {
  const [econ, setEcon] = useState<Reading[] | null>(null);
  const [gov, setGov] = useState<Reading[] | null>(null);

  useEffect(() => {
    let live = true;
    setEcon(null); setGov(null);
    if (picked.source === "fred") {
      Promise.all(MACRO_SERIES.map(s => fredLatest(s.id, s.params))).then(r => { if (live) setEcon(r); });
    } else {
      Promise.all(WB_ECON.map(i => wbLatest(picked.iso3, i.id))).then(r => { if (live) setEcon(r); });
      Promise.all(WB_GOVERNANCE.map(i => wbLatest(picked.iso3, i.id))).then(r => { if (live) setGov(r); });
    }
    return () => { live = false; };
  }, [picked]);

  if (picked.source === "fred") {
    return (
      <>
        <h3>{picked.flag} {picked.label}</h3>
        <div className="indicator-grid">
          {MACRO_SERIES.map((s, i) => <IndicatorTile key={s.id} label={s.label} reading={econ?.[i]} text={fmtReading(econ?.[i]?.value ?? null, s.unit, s.prefix ?? "")} loading={econ === null} />)}
        </div>
      </>
    );
  }
  return (
    <>
      <h3>{picked.flag} {picked.label}</h3>
      <div className="indicator-grid">
        {WB_ECON.map((i, idx) => <IndicatorTile key={i.id} label={i.label} reading={econ?.[idx]} text={fmtReading(econ?.[idx]?.value ?? null, i.unit, "", !!i.count, i.money)} loading={econ === null} />)}
      </div>
      <h4 className="macro-governance-title">Governance <span className="muted small">World Bank Worldwide Governance Indicators, roughly −2.5 (weak) to +2.5 (strong)</span></h4>
      <div className="indicator-grid">
        {WB_GOVERNANCE.map((g, idx) => <IndicatorTile key={g.id} label={g.label} reading={gov?.[idx]} text={fmtReading(gov?.[idx]?.value ?? null, "")} loading={gov === null} />)}
      </div>
    </>
  );
}

function IndicatorTile({ label, reading, text, loading }: { label: string; reading: Reading | undefined; text: string; loading: boolean }) {
  return (
    <div className="indicator">
      <div className="indicator-label"><span>{label}</span></div>
      <div className="indicator-value">{loading && !reading ? "…" : text}</div>
      {reading?.date && <div className="macro-date">As of {reading.date}</div>}
    </div>
  );
}

function CompareView({ iso3s }: { iso3s: string[] }) {
  const [rows, setRows] = useState<Record<string, Reading[]>>({});

  useEffect(() => {
    let live = true;
    setRows({});
    iso3s.forEach(iso3 => {
      const c = MACRO_COUNTRIES.find(x => x.iso3 === iso3);
      const load = c?.source === "fred"
        ? Promise.all(MACRO_SERIES.map(s => fredLatest(s.id, s.params)))
        : Promise.all(WB_ECON.map(i => wbLatest(iso3, i.id)));
      load.then(r => { if (live) setRows(prev => ({ ...prev, [iso3]: r })); });
    });
    return () => { live = false; };
  }, [iso3s.join(",")]);

  if (iso3s.length === 0) return <p className="muted">Pick up to {MAX_COMPARE} countries above to compare them side by side.</p>;
  const labelOf = (iso3: string) => MACRO_COUNTRIES.find(c => c.iso3 === iso3)?.label ?? iso3;
  const isUS = (iso3: string) => iso3 === "USA";
  const indicators: { label: string; unit: string; prefix: string; count: boolean; money: boolean }[] = isUS(iso3s[0])
    ? MACRO_SERIES.map(s => ({ label: s.label, unit: s.unit, prefix: s.prefix ?? "", count: false, money: false }))
    : WB_ECON.map(i => ({ label: i.label, unit: i.unit, prefix: "", count: !!i.count, money: i.money }));

  return (
    <div className="crypto-table-scroll">
      <table className="crypto-table macro-compare-table">
        <thead><tr><th>Indicator</th>{iso3s.map(i => <th key={i}>{labelOf(i)}</th>)}</tr></thead>
        <tbody>
          {indicators.map((ind, idx) => (
            <tr key={ind.label}>
              <td className="macro-compare-label">{ind.label}</td>
              {iso3s.map(i => {
                const r = rows[i]?.[idx];
                const v = r ? r.value : null;
                const text = !rows[i] ? "…" : fmtReading(v, ind.unit, ind.prefix, ind.count, ind.money);
                return <td key={i}>{text}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
