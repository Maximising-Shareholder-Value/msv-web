// components/WatchlistPage.tsx — the Watchlist page (React). Lists the tickers you
// starred (☆ on a ticker page) with their live price, and lets you remove them.
// Recently viewed sits underneath. Both read the same browser-stored lists as the
// rest of the site (lib/storage.ts), so a change here shows up everywhere.

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Section } from "./StockTables";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";
import { readList, writeList, WATCHLIST_KEY, type StoredTicker } from "../lib/storage";
import { RecentlyViewed } from "./HomeLists";

export function WatchlistPage() {
  const [list, setList] = useState<StoredTicker[]>(() => readList(WATCHLIST_KEY));
  const quotes = useQuotes(list.map(t => t.symbol));

  const remove = (symbol: string) => {
    const next = list.filter(t => t.symbol !== symbol);
    writeList(WATCHLIST_KEY, next);
    setList(next);
  };

  return (
    <div className="app-shell">
      <AppSidebar current="watchlist" />
      <div className="app-main home-main-frame">
        <div className="hp">
          <section className="hp-section hp-about-section">
            <header className="hp-section-head">
              <h2>Watchlist</h2>
              <p className="muted">The tickers you've starred, with their live prices. Star a ticker's page to add it here.</p>
            </header>
          </section>

          <Section id="watchlist" title="Your watchlist" lead={list.length ? `${list.length} ticker${list.length === 1 ? "" : "s"}` : undefined}>
            {list.length === 0 ? (
              <p className="muted small">Nothing here yet. Open a ticker and press ☆ to add it.</p>
            ) : (
              <div className="hp-table-scroll">
                <table className="hp-table">
                  <thead>
                    <tr><th>Symbol</th><th>Name</th><th className="num">Price</th><th className="num">Change %</th><th className="num">Day high</th><th className="num">Day low</th><th /></tr>
                  </thead>
                  <tbody>
                    {list.map(t => {
                      const q = quotes[t.symbol];
                      return (
                        <tr key={t.symbol}>
                          <td><a href={`/app/?page=ticker&symbol=${encodeURIComponent(t.symbol)}`}><strong>{t.symbol}</strong></a></td>
                          <td className="muted">{t.name}</td>
                          <td className="num">{q ? fmtPrice(q.c) : "…"}</td>
                          <td className={`num ${q ? changeClass(q.dp) : ""}`}>{q ? fmtPct(q.dp) : "…"}</td>
                          <td className="num">{q ? fmtPrice(q.h) : "…"}</td>
                          <td className="num">{q ? fmtPrice(q.l) : "…"}</td>
                          <td className="num"><button type="button" className="cp-btn cp-btn-ghost" aria-label={`Remove ${t.symbol} from watchlist`} onClick={() => remove(t.symbol)}>Remove</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section id="recent" title="Recently viewed" lead="Tickers you've opened lately.">
            <RecentlyViewed />
          </Section>
        </div>
      </div>
    </div>
  );
}
