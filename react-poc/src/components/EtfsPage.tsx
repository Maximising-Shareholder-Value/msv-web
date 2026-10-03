// components/EtfsPage.tsx — the ETFs page, React version. Ports etfs.js: every
// ETF the app tracks, grouped into categories under eight families, plus a
// search across all of them and a "By Issuer" view that groups the same funds
// by the company that runs them.
//
// Expense ratios, holdings and fund size (AUM) aren't shown: they're paywalled
// on every free data source this app has checked (see BLOCKERS.md).

import { useMemo, useState } from "react";
import { ETF_CATEGORIES } from "../data/etfCategories";
import { ETF_FAMILIES } from "../data/etfCategories";
import type { EtfCategory } from "../data/etfCategories";
import { allEtfs, categoryItems, issuerGroups, type EtfItem } from "../lib/etf";
import { useQuotes, type QuoteMap } from "../lib/useQuotes";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";

type View = "category" | "issuer";

const ALL = allEtfs();
const SEARCH_LIMIT = 60;

export function EtfsPage() {
  const [view, setView] = useState<View>("category");
  const [selectedCat, setSelectedCat] = useState("us-broad");
  const [selectedIssuer, setSelectedIssuer] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const searchResults = useMemo<EtfItem[]>(() => {
    if (!q) return [];
    return ALL.filter(e => `${e.symbol} ${e.name}`.toLowerCase().includes(q)).slice(0, SEARCH_LIMIT);
  }, [q]);

  return (
    <section className="etfs-page">
      <header className="sectors-header">
        <h2>ETFs</h2>
        <span className="muted small">{ALL.length} funds in {ETF_CATEGORIES.length} categories · live prices · click any fund for its full page</span>
      </header>

      <div className="news-toolbar">
        <div className="sectors-view-toggle" role="group" aria-label="How to browse">
          <button type="button" className={view === "category" ? "active" : ""} onClick={() => setView("category")}>By category</button>
          <button type="button" className={view === "issuer" ? "active" : ""} onClick={() => setView("issuer")}>By issuer</button>
        </div>
        <input type="search" className="news-search" placeholder="Search any ETF by ticker or name…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search ETFs" />
      </div>

      {q ? (
        <SearchResults results={searchResults} query={query} />
      ) : view === "category" ? (
        <CategoryView selectedCat={selectedCat} onSelect={setSelectedCat} />
      ) : (
        <IssuerView selectedIssuer={selectedIssuer} onSelect={setSelectedIssuer} />
      )}

      <p className="muted small etfs-foot">
        Prices are live via Finnhub, a few at a time. Expense ratios, holdings and fund size aren't shown because they're paywalled on every free data source checked. Not investment advice.
      </p>
    </section>
  );
}

/** A search across every ETF; the list is capped so the page stays light. */
function SearchResults({ results, query }: { results: EtfItem[]; query: string }) {
  const quotes = useQuotes(results.map(r => r.symbol));
  if (!results.length) return <p className="muted small">No tracked ETF matches “{query}”.</p>;
  return (
    <>
      <p className="muted small">{results.length} match{results.length === 1 ? "" : "es"}{results.length === SEARCH_LIMIT ? ` (showing the first ${SEARCH_LIMIT})` : ""}</p>
      <FundTable items={results} quotes={quotes} />
    </>
  );
}

function CategoryView({ selectedCat, onSelect }: { selectedCat: string; onSelect: (id: string) => void }) {
  const cat = ETF_CATEGORIES.find(c => c.id === selectedCat) ?? ETF_CATEGORIES[0];
  const items = categoryItems(cat).map(([symbol, name]) => ({ symbol, name }));
  const quotes = useQuotes(items.map(i => i.symbol));
  const family = ETF_FAMILIES.find(f => f.id === cat.family);

  return (
    <div className="etfs-layout">
      <nav className="etfs-families" aria-label="Categories">
        {ETF_FAMILIES.map(f => (
          <div key={f.id} className="etfs-family">
            <div className="etfs-family-title">{f.label}</div>
            {ETF_CATEGORIES.filter(c => c.family === f.id).map(c => (
              <button key={c.id} type="button" className={c.id === cat.id ? "active" : ""} onClick={() => onSelect(c.id)}>
                {c.title}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="etfs-main">
        <CategoryHead cat={cat} familyLabel={family?.label ?? ""} count={items.length} />
        <FundTable items={items} quotes={quotes} />
      </div>
    </div>
  );
}

function CategoryHead({ cat, familyLabel, count }: { cat: EtfCategory; familyLabel: string; count: number }) {
  return (
    <div className={`etfs-cat-head${cat.warn ? " warn" : ""}`}>
      <div className="muted small">{familyLabel}</div>
      <h3>{cat.title} <span className="ctag">{count} ETFs</span></h3>
      <p>{cat.blurb}</p>
    </div>
  );
}

function IssuerView({ selectedIssuer, onSelect }: { selectedIssuer: string | null; onSelect: (issuer: string) => void }) {
  const groups = useMemo(() => issuerGroups(), []);
  const group = groups.find(g => g.issuer === selectedIssuer) ?? groups[0];
  const quotes = useQuotes(group.items.map(i => i.symbol));

  return (
    <>
      <div className="etfs-issuer-grid">
        {groups.map(g => (
          <button key={g.issuer} type="button" className={`etfs-issuer-card${g.issuer === group.issuer ? " active" : ""}`} onClick={() => onSelect(g.issuer)}>
            <span className="etfs-issuer-head"><strong>{g.issuer}</strong><span className="ctag">{g.items.length} {g.items.length === 1 ? "fund" : "funds"}</span></span>
            <span className="muted small">{g.blurb}</span>
          </button>
        ))}
      </div>
      <div className="etfs-main">
        <h3>{group.issuer} <span className="ctag">{group.items.length} ETFs</span></h3>
        <p className="small">{group.blurb}</p>
        <FundTable items={group.items} quotes={quotes} />
        <p className="muted small">Grouped by reading each fund's name, so funds from issuers this app doesn't track aren't shown.</p>
      </div>
    </>
  );
}

function FundTable({ items, quotes }: { items: EtfItem[]; quotes: QuoteMap }) {
  if (!items.length) return <p className="muted small">No funds here.</p>;
  return (
    <div className="crypto-table-scroll">
      <table className="crypto-table quotes-table etfs-table">
        <thead>
          <tr><th>Ticker</th><th>Fund</th><th>Price</th><th>Day %</th><th>Prev close</th></tr>
        </thead>
        <tbody>
          {items.map(item => {
            const q = quotes[item.symbol];
            return (
              <tr key={item.symbol}>
                <td><a href={`/?ticker=${encodeURIComponent(item.symbol)}`}><strong>{item.symbol}</strong></a></td>
                <td className="etfs-fund-name">{item.name}</td>
                <td>{q === undefined ? "…" : q ? fmtPrice(q.c) : "—"}</td>
                <td className={changeClass(q?.dp)}>{q === undefined ? "…" : q ? fmtPct(q.dp) : "—"}</td>
                <td>{q ? fmtPrice(q.pc) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
