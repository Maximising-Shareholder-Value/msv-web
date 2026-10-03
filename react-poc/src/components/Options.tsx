// components/Options.tsx — the options chain on the ticker page. Ports loadOptions(),
// renderOptionsView() and buildOptionsTableHtml() from script.js: pick an expiry,
// see the nine strikes nearest the price (or all of them), bid and ask for calls
// and puts, and optionally the last trade and volume. Indicative quotes only.

import { useEffect, useMemo, useState } from "react";
import { getOptions, type OptionRow } from "../lib/options";
import { fmtPrice } from "../lib/format";

const fmtExpiry = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function Options({ symbol, price }: { symbol: string; price: number }) {
  const [rows, setRows] = useState<OptionRow[] | null | undefined>(undefined);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    let live = true;
    setRows(undefined); setExpiry(null); setShowAll(false);
    getOptions(symbol, price).then(r => { if (live) setRows(r); });
    return () => { live = false; };
    // The chain is fetched once per ticker; a price move alone doesn't refetch it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const expiries = useMemo(() => (rows ? [...new Set(rows.map(r => r.expiry))].sort() : []), [rows]);
  if (rows === undefined) return <p className="muted small">Loading options…</p>;
  if (rows === null) return <p className="muted small">Couldn't load options data right now.</p>;
  if (rows.length === 0) return <p className="muted">No options data available for this symbol.</p>;

  const current = expiry && expiries.includes(expiry) ? expiry : expiries[0];
  const forExpiry = rows.filter(r => r.expiry === current);
  const allStrikes = [...new Set(forExpiry.map(r => r.strike))].sort((a, b) => a - b);
  const nearest = [...allStrikes].sort((a, b) => Math.abs(a - price) - Math.abs(b - price)).slice(0, 9).sort((a, b) => a - b);
  const strikes = showAll ? allStrikes : nearest;
  const byStrike = new Map<number, { call?: Snap; put?: Snap }>();
  forExpiry.forEach(r => {
    const entry = byStrike.get(r.strike) ?? {};
    entry[r.type] = r.snap;
    byStrike.set(r.strike, entry);
  });
  const closest = strikes.length ? Math.min(...strikes.map(s => Math.abs(s - price))) : 0;

  return (
    <>
      {expiries.length > 1 && (
        <div className="options-expiry-row">
          {expiries.map(e => <button key={e} type="button" className={`options-expiry-btn${e === current ? " active" : ""}`} onClick={() => { setExpiry(e); setShowAll(false); }}>{fmtExpiry(e)}</button>)}
        </div>
      )}
      <p className="muted small">{expiries.length > 1 ? "Expiration" : "Nearest available expiration"}: <strong>{current ? fmtExpiry(current) : "—"}</strong> · {strikes.length} of {allStrikes.length} strikes</p>
      <div className="options-controls">
        {allStrikes.length > nearest.length && <label className="options-toggle"><input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} /> Show all {allStrikes.length} strikes</label>}
        <label className="options-toggle"><input type="checkbox" checked={showActivity} onChange={e => setShowActivity(e.target.checked)} /> Show last trade &amp; volume</label>
      </div>

      <div className="options-table-scroll">
        <table className="options-table">
          <thead>
            <tr><th colSpan={showActivity ? 4 : 2}>Call</th><th /><th colSpan={showActivity ? 4 : 2}>Put</th></tr>
            <tr>{showActivity && <th>Last</th>}{showActivity && <th>Vol</th>}<th>Bid</th><th>Ask</th><th>Strike</th><th>Bid</th><th>Ask</th>{showActivity && <th>Last</th>}{showActivity && <th>Vol</th>}</tr>
          </thead>
          <tbody>
            {strikes.map(s => {
              const c = byStrike.get(s)?.call, p = byStrike.get(s)?.put;
              const atm = Math.abs(s - price) === closest;
              const money = (v: number | undefined) => (typeof v === "number" ? fmtPrice(v) : "--");
              const activity = (snap?: Snap) => showActivity && (<><td>{money(snap?.latestTrade?.p)}</td><td>{typeof snap?.dailyBar?.v === "number" ? snap.dailyBar.v.toLocaleString() : "--"}</td></>);
              return (
                <tr key={s} className={atm ? "options-atm-row" : ""}>
                  {activity(c)}
                  <td>{money(c?.latestQuote?.bp)}</td>
                  <td>{money(c?.latestQuote?.ap)}</td>
                  <td className="options-strike-cell">{fmtPrice(s)}</td>
                  <td>{money(p?.latestQuote?.bp)}</td>
                  <td>{money(p?.latestQuote?.ap)}</td>
                  {activity(p)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small">Bid and ask are indicative quotes, not guaranteed tradeable prices. Greeks and implied volatility aren't available on this free data feed, so they aren't shown.</p>
    </>
  );
}

type Snap = OptionRow["snap"];
