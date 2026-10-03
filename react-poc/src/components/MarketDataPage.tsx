// components/MarketDataPage.tsx — the Market Data page (React). Ports the
// vanilla page: the world map on top (colour it by a World Bank indicator),
// and below it the country directory (dropdown or full list) beside the
// country profile for whichever country is selected.
//
// The selected country is kept in the URL (?country=JP) so it can be shared.

import { useState } from "react";
import { COUNTRY_LIST, COUNTRY_GROUPS, GROUP_ORDER, exchangeStatus, type Country } from "../lib/markets";
import { useQuotes, type QuoteMap } from "../lib/useQuotes";
import { useWorldData } from "../lib/useWorldData";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";
import { WorldMap } from "./WorldMap";
import { CountryProfile } from "./CountryProfile";
import { RiskDashboard } from "./RiskDashboard";

const ETF_SYMBOLS = COUNTRY_LIST.filter(c => c.etf).map(c => c.etf as string);

export function MarketDataPage() {
  const [view, setView] = useState<"dropdown" | "list">("dropdown");
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(location.search).get("country"));
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("groups");
  const quotes = useQuotes(ETF_SYMBOLS);
  const wbData = useWorldData();

  const pick = (iso2: string | null) => {
    setSelected(iso2);
    const url = new URL(location.href);
    if (iso2) url.searchParams.set("country", iso2); else url.searchParams.delete("country");
    history.replaceState(null, "", url);
  };
  const country = COUNTRY_LIST.find(c => c.iso2 === selected) ?? null;

  return (
    <section className="market-page">
      <header className="sectors-header">
        <h2>Market Data</h2>
        <span className="muted small">{COUNTRY_LIST.length} tracked countries · live country-ETF prices · World Bank data</span>
      </header>

      <div className="market-map-card">
        <WorldMap selected={selected} onSelect={pick} quotes={quotes} mode={mode} onMode={setMode} wbData={wbData} />
        <OpenSummary />
      </div>

      <div className="market-layout">
        <aside className="market-directory">
          <div className="sectors-view-toggle" role="group" aria-label="Country picker style">
            <button type="button" className={view === "dropdown" ? "active" : ""} onClick={() => setView("dropdown")}>Dropdown</button>
            <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Full list</button>
          </div>
          {view === "dropdown" ? (
            <select className="market-select" value={selected ?? ""} onChange={e => pick(e.target.value || null)} aria-label="Choose a country">
              <option value="">Choose a country…</option>
              {GROUP_ORDER.map(gid => {
                const g = COUNTRY_GROUPS.find(x => x.id === gid);
                const rows = COUNTRY_LIST.filter(c => c.group === gid);
                if (!rows.length || !g) return null;
                return (
                  <optgroup key={gid} label={`${g.label} (${rows.length})`}>
                    {rows.map(c => <option key={c.iso2} value={c.iso2}>{c.flag} {c.name} · {c.etf || "macro only"}</option>)}
                  </optgroup>
                );
              })}
            </select>
          ) : (
            <DirectoryList selected={selected} onSelect={pick} group={group} setGroup={setGroup} query={query} setQuery={setQuery} quotes={quotes} />
          )}
        </aside>

        <main className="market-profile">
          {country
            ? <CountryProfile country={country} quote={country.etf ? quotes[country.etf] : undefined} wbData={wbData} onSelect={pick} />
            : <p className="muted market-hint">Click a country on the map, or pick one from the list, to open its profile: market snapshot, economy, history and governance.</p>}
        </main>
      </div>

      <RiskDashboard wbData={wbData} onSelect={pick} />

      <p className="muted small market-foot">
        Prices are live country-ETF quotes, used as stand-ins for each market's index. Economic figures are annual World Bank data, latest year available (often 1–2 years old). Not investment advice.
      </p>
    </section>
  );
}

function OpenSummary() {
  const sessions = COUNTRY_LIST.map(c => exchangeStatus(c)).filter((s): s is { isOpen: boolean; hhmm: string } => s !== null);
  const open = sessions.filter(s => s.isOpen).length;
  return <p className="muted small market-summary">{open} of {sessions.length} exchanges currently open · {COUNTRY_LIST.length} countries tracked</p>;
}

function DirectoryList({ selected, onSelect, group, setGroup, query, setQuery, quotes }: {
  selected: string | null;
  onSelect: (iso2: string) => void;
  group: string;
  setGroup: (g: string) => void;
  query: string;
  setQuery: (q: string) => void;
  quotes: QuoteMap;
}) {
  const q = query.trim().toLowerCase();
  const chips: [string, string][] = [["all", "All"], ["brics", "BRICS"], ["developed", "Developed"], ["emerging", "Emerging"], ["frontier", "Frontier"], ["g7", "G7"], ["open", "Open now"]];
  const matches = (c: Country) => {
    if (q && !`${c.name} ${c.city} ${c.etf || ""} ${c.iso2}`.toLowerCase().includes(q)) return false;
    if (group === "all") return true;
    if (group === "open") return !!exchangeStatus(c)?.isOpen;
    if (group === "g7") return !!c.g7;
    return c.group === group;
  };
  return (
    <>
      <input type="search" className="news-search" placeholder="Search countries, cities, ETFs…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search countries" />
      <div className="market-chips">
        {chips.map(([id, label]) => <button key={id} type="button" className={group === id ? "active" : ""} onClick={() => setGroup(id)}>{label}</button>)}
      </div>
      <div className="market-list">
        {GROUP_ORDER.map(gid => {
          const rows = COUNTRY_LIST.filter(c => c.group === gid && matches(c));
          if (!rows.length) return null;
          const g = COUNTRY_GROUPS.find(x => x.id === gid);
          return (
            <div key={gid}>
              <div className="market-group-title">{g?.label} <span className="muted">{rows.length}</span></div>
              {rows.map(c => {
                const status = exchangeStatus(c);
                const quote = c.etf ? quotes[c.etf] : undefined;
                return (
                  <button key={c.iso2} type="button" className={`market-row${selected === c.iso2 ? " selected" : ""}`} onClick={() => onSelect(c.iso2)}>
                    <span>{c.flag}</span>
                    <span className="market-row-name"><strong>{c.name}</strong><span className="muted small">{c.etf || "macro only"} · {c.city}</span></span>
                    <span className={`market-dot ${status ? (status.isOpen ? "open" : "closed") : "none"}`} title={status ? (status.isOpen ? "Market open" : "Market closed") : "No session tracked"} />
                    <span className="small">{quote === undefined ? (c.etf ? "…" : "") : quote ? <>{fmtPrice(quote.c)} <b className={changeClass(quote.dp)}>{fmtPct(quote.dp)}</b></> : "—"}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
