// components/Ownership.tsx — ownership and insider trading for the ticker page.
// Ports renderOwnership() and renderInsiderTransactions() from script.js.
// Institutional holdings need a paid Finnhub plan, so that part is a note with
// a free route (SEC 13F/13D/13G filings). Insider trades are the free Form 4
// data, shown with their size as a share of the company.

import { useEffect, useState } from "react";
import { getInsiderTrades, type InsiderTrade } from "../lib/finnhub";
import { fmtPrice } from "../lib/format";

export function Ownership({ symbol, sharesOutstandingMillions }: { symbol: string; sharesOutstandingMillions: number | null | undefined }) {
  return (
    <div className="ownership">
      <p className="muted small">
        Institutional ownership (who holds the biggest stakes) needs a paid Finnhub plan, so it isn't shown here. For a free route, a company's 13F, 13D and 13G filings disclose its large holders and are public on the SEC's EDGAR site.
      </p>
      <Insiders symbol={symbol} sharesOutstandingMillions={sharesOutstandingMillions} />
    </div>
  );
}

function Insiders({ symbol, sharesOutstandingMillions }: { symbol: string; sharesOutstandingMillions: number | null | undefined }) {
  const [trades, setTrades] = useState<InsiderTrade[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setTrades(undefined);
    getInsiderTrades(symbol).then(t => { if (live) setTrades(t); });
    return () => { live = false; };
  }, [symbol]);

  if (trades === undefined) return <p className="muted small">Loading insider trades…</p>;
  if (trades === null) return <p className="muted small">Couldn't load insider trades right now.</p>;
  if (trades.length === 0) return <p className="muted">No insider transaction data available for this symbol (common for companies that don't file with the SEC).</p>;

  const totalShares = sharesOutstandingMillions ? sharesOutstandingMillions * 1e6 : null;
  const rows = [...trades].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)).slice(0, 8);
  return (
    <>
      <div className="earnings-table insider-table">
        <div className="earnings-row earnings-header"><div>Insider</div><div>Date</div><div>Shares changed</div><div>% of shares out.</div><div>Price</div></div>
        {rows.map((t, i) => {
          const acquired = typeof t.change === "number" ? t.change > 0 : null;
          const pct = totalShares && typeof t.change === "number" ? (t.change / totalShares) * 100 : null;
          const cls = acquired === null ? "" : acquired ? "positive" : "negative";
          return (
            <div key={`${t.name}-${t.transactionDate}-${i}`} className="earnings-row">
              <div>{t.name || "--"}</div>
              <div>{t.transactionDate || "--"}</div>
              <div className={cls}>{typeof t.change === "number" ? `${t.change >= 0 ? "+" : ""}${t.change.toLocaleString()}` : "N/A"}</div>
              <div className={cls}>{pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(4)}%` : "N/A"}</div>
              <div>{t.transactionPrice && t.transactionPrice > 0 ? fmtPrice(t.transactionPrice) : "N/A"}</div>
            </div>
          );
        })}
      </div>
      <p className="muted small">From SEC Form 4 filings (executives and directors reporting their own trades). Many are routine: scheduled vesting, tax payments, pre-planned trading programmes.</p>
    </>
  );
}
