// components/Filings.tsx — the SEC filings list on the ticker page. Ports
// renderFilings() from script.js: 10-K, 10-Q and 8-K come first, each with a
// plain-English name and description, linking to the filing on EDGAR. Three
// show at first, and the rest expand on request.

import { useEffect, useState } from "react";
import { getFilings, type SecFiling } from "../lib/finnhub";
import { FILING_TYPE_INFO } from "../data/filings";

const PRIORITY: Record<string, number> = { "10-K": 0, "10-Q": 1, "8-K": 2 };
const COLLAPSED = 3;

function infoFor(form: string) {
  if (FILING_TYPE_INFO[form]) return FILING_TYPE_INFO[form];
  if (form.startsWith("424B")) return { name: "Prospectus", desc: "Details the terms of a securities offering: what's being sold, at what price, and to whom." };
  return { name: form || "SEC Filing", desc: "A filing type this dashboard doesn't have a plain-English description for yet. Open it on EDGAR to see the actual content." };
}

export function Filings({ symbol }: { symbol: string }) {
  const [filings, setFilings] = useState<SecFiling[] | null | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    let live = true;
    setFilings(undefined); setShowAll(false);
    getFilings(symbol).then(f => { if (live) setFilings(f); });
    return () => { live = false; };
  }, [symbol]);

  if (filings === undefined) return <p className="muted small">Loading filings…</p>;
  if (filings === null) return <p className="muted small">Couldn't load SEC filings right now.</p>;
  if (filings.length === 0) return <p className="muted">No SEC filings found for this symbol (common for non-US-listed companies).</p>;

  const sorted = [...filings]
    .sort((a, b) => b.filedDate.localeCompare(a.filedDate))
    .sort((a, b) => (PRIORITY[a.form] ?? 9) - (PRIORITY[b.form] ?? 9))
    .slice(0, 8);
  const shown = showAll ? sorted : sorted.slice(0, COLLAPSED);
  const extra = sorted.length - COLLAPSED;

  return (
    <>
      <div className="filings-list">
        {shown.map((f, i) => {
          const info = infoFor(f.form);
          return (
            <a key={`${f.form}-${f.filedDate}-${i}`} className="filing-item" href={f.filingUrl || f.reportUrl} target="_blank" rel="noopener noreferrer">
              <div className="filing-item-top">
                <span className="filing-form">{f.form || "?"}</span>
                <span className="filing-name">{info.name}</span>
                <span className="filing-date">{f.filedDate ? f.filedDate.slice(0, 10) : "--"}</span>
              </div>
              <p className="filing-desc">{info.desc}</p>
              <span className="filing-link-cue">View the actual filing on SEC EDGAR ↗</span>
            </a>
          );
        })}
      </div>
      {!showAll && extra > 0 && <button type="button" className="filings-expand-btn" onClick={() => setShowAll(true)}>Show {extra} more filing{extra === 1 ? "" : "s"}</button>}
      <p className="muted small">The descriptions explain what each filing type generally contains. This page doesn't pull out sections like risk factors; 10-Ks and other filings are long, so open the filing for the detail.</p>
    </>
  );
}
