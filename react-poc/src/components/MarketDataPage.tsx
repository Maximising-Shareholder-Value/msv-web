// components/MarketDataPage.tsx — the Market Data page, first slice (React).
// Ports the country directory and profile from marketData.js: pick a country
// from a dropdown (or the full searchable list), see its market hours and
// whether it's open, and its live country-ETF price.
//
// NOT YET PORTED (still on the main site): the world map, the macro indicator
// charts from the World Bank, and the risk dashboard.

import { useState } from "react";
import { COUNTRY_LIST, COUNTRY_GROUPS, GROUP_ORDER, exchangeStatus, localTime, type Country } from "../lib/markets";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";

type View = "dropdown" | "list";

const ETF_SYMBOLS = COUNTRY_LIST.filter(c => c.etf).map(c => c.etf as string);

export function MarketDataPage() {
  const [view, setView] = useState<View>("dropdown");
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(location.search).get("country"));
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const quotes = useQuotes(ETF_SYMBOLS);

  const country = COUNTRY_LIST.find(c => c.iso2 === selected) ?? null;

  return (
    <section className="market-page">
      <header className="sectors-header">
        <h2>Market Data</h2>
        <span className="muted small">{COUNTRY_LIST.length} tracked countries · live country-ETF prices · market hours shown in local time</span>
      </header>

      <div className="market-layout">
        <aside className="market-directory">
          <div className="sectors-view-toggle" role="group" aria-label="Country picker style">
            <button type="button" className={view === "dropdown" ? "active" : ""} onClick={() => setView("dropdown")}>Dropdown</button>
            <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Full list</button>
          </div>
          {view === "dropdown" ? (
            <select className="market-select" value={selected ?? ""} onChange={e => setSelected(e.target.value || null)} aria-label="Choose a country">
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
            <DirectoryList selected={selected} onSelect={setSelected} group={group} setGroup={setGroup} query={query} setQuery={setQuery} quotes={quotes} />
          )}
        </aside>

        <main className="market-profile">
          {country ? <CountryProfile country={country} quote={country.etf ? quotes[country.etf] : undefined} /> : (
            <p className="muted">Pick a country to see its market hours, whether it's open right now, and its live index proxy price.</p>
          )}
        </main>
      </div>

      <p className="muted small market-foot">
        Not on this page yet: the world map, the macro indicator charts and the risk dashboard. Those are still on the main site. Prices are live country-ETF quotes, used as stand-ins for each market's index. Not investment advice.
      </p>
    </section>
  );
}

function DirectoryList({ selected, onSelect, group, setGroup, query, setQuery, quotes }: {
  selected: string | null;
  onSelect: (iso2: string) => void;
  group: string;
  setGroup: (g: string) => void;
  query: string;
  setQuery: (q: string) => void;
  quotes: Record<string, { c: number; dp: number | null } | null | undefined>;
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
        {!COUNTRY_LIST.some(matches) && <p className="muted small">No countries match.</p>}
      </div>
    </>
  );
}

function CountryProfile({ country, quote }: { country: Country; quote: { c: number; d: number | null; dp: number | null; h: number; l: number; pc: number } | null | undefined }) {
  const status = exchangeStatus(country);
  return (
    <div className="market-card">
      <div className="market-card-head">
        <span className="market-flag">{country.flag}</span>
        <div>
          <h3>{country.name}</h3>
          <p className="muted small">{country.ex || "No exchange tracked"} · {country.city}{country.g7 ? " · G7" : ""}</p>
        </div>
      </div>

      <dl className="market-facts">
        <div><dt>Market status</dt><dd>{status ? (status.isOpen ? <span className="market-open">Open now</span> : "Closed") : "—"}</dd></div>
        <div><dt>Local time</dt><dd>{country.tz ? localTime(country.tz) : "—"}</dd></div>
        <div><dt>Trading hours (local)</dt><dd>{country.open && country.close ? `${country.open}–${country.close}` : "—"}</dd></div>
        <div><dt>Index proxy</dt><dd>{country.etf ? <a href={`/?ticker=${encodeURIComponent(country.etf)}`}>{country.etf} ↗</a> : "None (macro data only)"}</dd></div>
      </dl>

      <div className="market-quote">
        {country.etf ? (
          quote === undefined ? <p className="muted small">Loading {country.etf}…</p>
          : quote ? (
            <>
              <strong className="market-price">{fmtPrice(quote.c)}</strong>{" "}
              <span className={changeClass(quote.dp)}>{fmtPct(quote.dp)}</span>
              <p className="muted small">Day range {fmtPrice(quote.l)} – {fmtPrice(quote.h)} · previous close {fmtPrice(quote.pc)}</p>
            </>
          ) : <p className="muted small">No live quote for {country.etf} right now.</p>
        ) : <p className="muted small">This market has no US-listed index ETF, so there's no live price. Macro data is on the main site.</p>}
      </div>
    </div>
  );
}
