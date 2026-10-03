// components/IpoPage.tsx — upcoming and recent IPOs from Finnhub's IPO
// calendar. Shows listings from two weeks ago up to the chosen horizon.
//
// SPAC flag: a SPAC is a blank-cheque shell company that raises money to buy
// a business later. Finnhub doesn't say which listings are SPACs, so the flag
// is a best guess from the company name ("Acquisition", "Blank Check", "SPAC").
// It can miss some or flag a few that aren't, so it's labelled as a guess.

import { useState } from "react";
import { getIpoCalendar, type IpoRow } from "../lib/finnhub";
import { useAsync } from "../lib/api";
import { Loadable } from "./Loadable";
import { fmtCompact, fmtDate } from "../lib/format";

const HORIZONS = [30, 60, 90];
const LOOKBACK_DAYS = 14;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const looksLikeSpac = (name: string) => /acquisition|blank[ -]?check|\bspac\b/i.test(name);

const STATUS_LABEL: Record<string, string> = { priced: "Priced", expected: "Expected", filed: "Filed", withdrawn: "Withdrawn" };

export function IpoPage() {
  const [days, setDays] = useState(30);
  const [hideSpacs, setHideSpacs] = useState(false);
  const from = isoDate(addDays(-LOOKBACK_DAYS));
  const to = isoDate(addDays(days));

  const ipos = useAsync(async () => {
    const rows = await getIpoCalendar(from, to);
    if (rows === null) throw new Error("the IPO calendar didn't respond — rate limit or a temporary outage");
    return rows;
  }, [from, to]);

  return (
    <section className="ipo-page">
      <header className="sectors-header">
        <h2>IPO Calendar</h2>
        <span className="muted small">US listings from {fmtDate(from)} to {fmtDate(to)} · Finnhub</span>
      </header>

      <div className="news-toolbar">
        <div className="sectors-view-toggle" role="group" aria-label="How far ahead to show">
          {HORIZONS.map(h => (
            <button key={h} type="button" className={h === days ? "active" : ""} onClick={() => setDays(h)}>Next {h} days</button>
          ))}
        </div>
        <label className="ipo-toggle">
          <input type="checkbox" checked={hideSpacs} onChange={e => setHideSpacs(e.target.checked)} /> Hide likely SPACs
        </label>
      </div>

      <Loadable state={ipos} what="IPO calendar">
        {rows => <IpoTable rows={rows} hideSpacs={hideSpacs} />}
      </Loadable>

      <p className="muted small ipo-foot">
        “Expected” means the date is set but the price isn't. “Filed” means the company has filed to list but has no date yet. Dates and prices change often; check the exchange or the company's filing before acting on any of them. This is information, not investment advice.
      </p>
    </section>
  );
}

function IpoTable({ rows, hideSpacs }: { rows: IpoRow[]; hideSpacs: boolean }) {
  const shown = rows
    .filter(r => !hideSpacs || !looksLikeSpac(r.name))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!shown.length) return <p className="muted small">No IPOs in this window{hideSpacs ? " once likely SPACs are hidden" : ""}.</p>;

  return (
    <div className="crypto-table-scroll">
      <table className="crypto-table quotes-table">
        <thead>
          <tr>
            <th>Date</th><th>Company</th><th>Ticker</th><th>Exchange</th><th>Price</th><th>Shares offered</th><th>Deal size</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={`${r.name}-${i}`}>
              <td>{fmtDate(r.date)}</td>
              <td>
                {r.name}
                {looksLikeSpac(r.name) && <span className="ctag ipo-spac-tag" title="Name suggests a blank-cheque company (SPAC). A guess from the name.">likely SPAC</span>}
              </td>
              <td><strong>{r.symbol || "—"}</strong></td>
              <td className="muted">{r.exchange}</td>
              <td>{r.price ? `$${r.price}` : "—"}</td>
              <td>{fmtCompact(r.numberOfShares)}</td>
              <td>{r.totalSharesValue ? `$${fmtCompact(r.totalSharesValue)}` : "—"}</td>
              <td>{STATUS_LABEL[r.status] ?? r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
