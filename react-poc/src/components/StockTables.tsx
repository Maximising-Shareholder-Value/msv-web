// components/StockTables.tsx — the stock quote tables shared by the homepage and the
// Stock Analysis page: Top gainers, Top losers, and Browse by category. One place
// holds the data and the table, so both pages always show the same numbers.

import { useMemo, useState, type ReactNode } from "react";
import { BROWSE_CATEGORIES, RANKING_STOCK_SYMBOLS } from "../data/home";
import type { Quote } from "../lib/finnhub";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";

export interface Row { symbol: string; name: string; quote: Quote }

/** One section of a page: a heading, a one-line explanation, then its content. */
export function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="hp-section" id={id}>
      <header className="hp-section-head">
        <h2>{title}</h2>
        {lead && <p className="muted">{lead}</p>}
      </header>
      {children}
    </section>
  );
}

/** A full table of quotes, with the columns the ticker pages use. */
export function QuoteTable({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <p className="muted small">{empty}</p>;
  return (
    <div className="hp-table-scroll">
      <table className="hp-table">
        <thead>
          <tr><th>Symbol</th><th>Name</th><th className="num">Price</th><th className="num">Change</th><th className="num">Change %</th><th className="num">Prev close</th><th className="num">Day high</th><th className="num">Day low</th><th>Day range</th></tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const q = r.quote;
            const pos = q.h !== q.l ? Math.max(0, Math.min(100, ((q.c - q.l) / (q.h - q.l)) * 100)) : 50;
            return (
              <tr key={r.symbol}>
                <td><a href={`/app/?page=ticker&symbol=${encodeURIComponent(r.symbol)}`}><strong>{r.symbol}</strong></a></td>
                <td className="muted">{r.name}</td>
                <td className="num">{fmtPrice(q.c)}</td>
                <td className={`num ${changeClass(q.d)}`}>{q.d === null ? "—" : `${q.d >= 0 ? "+" : ""}${q.d.toFixed(2)}`}</td>
                <td className={`num ${changeClass(q.dp)}`}>{fmtPct(q.dp)}</td>
                <td className="num">{fmtPrice(q.pc)}</td>
                <td className="num">{fmtPrice(q.h)}</td>
                <td className="num">{fmtPrice(q.l)}</td>
                <td><span className="hp-range"><i style={{ left: `${pos}%` }} /></span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Top gainers, top losers and browse-by-category, as three sections. */
export function MoversAndBrowse() {
  const [cat, setCat] = useState("trending-tech");
  const category = BROWSE_CATEGORIES.find(c => c.id === cat) ?? BROWSE_CATEGORIES[0];
  const rankingQuotes = useQuotes(RANKING_STOCK_SYMBOLS.map(([s]) => s));
  const browseQuotes = useQuotes(category.items.map(([s]) => s));

  const { gainers, losers } = useMemo(() => {
    const all: Row[] = RANKING_STOCK_SYMBOLS
      .map(([symbol, name]) => ({ symbol, name, quote: rankingQuotes[symbol] }))
      .filter((r): r is Row => !!r.quote);
    const byMove = [...all].sort((a, b) => (b.quote.dp ?? 0) - (a.quote.dp ?? 0));
    return {
      gainers: byMove.filter(r => (r.quote.dp ?? 0) > 0).slice(0, 10),
      losers: [...byMove].reverse().filter(r => (r.quote.dp ?? 0) < 0).slice(0, 10),
    };
  }, [rankingQuotes]);

  const browseRows: Row[] = category.items
    .map(([symbol, name]) => ({ symbol, name, quote: browseQuotes[symbol] }))
    .filter((r): r is Row => !!r.quote);

  return (
    <>
      <Section id="movers" title="Top gainers" lead="The biggest rises among the most-followed US stocks and ETFs today.">
        <QuoteTable rows={gainers} empty="Loading live prices…" />
      </Section>
      <Section id="losers" title="Top losers" lead="The biggest falls among the same names today.">
        <QuoteTable rows={losers} empty="Loading live prices…" />
      </Section>
      <Section id="browse" title="Browse by category" lead="Pick a category to see its live prices.">
        <div className="hp-chips" role="tablist">
          {BROWSE_CATEGORIES.map(c => (
            <button key={c.id} type="button" role="tab" aria-selected={c.id === cat} className={c.id === cat ? "active" : ""} onClick={() => setCat(c.id)}>{c.title}</button>
          ))}
        </div>
        <QuoteTable rows={browseRows} empty="Loading live prices…" />
      </Section>
    </>
  );
}
