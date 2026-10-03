// components/Financials.tsx — the income-statement summary on the ticker page.
// Ports renderFinancials() and its helpers from script.js: the last four
// quarters' revenue, gross profit, operating income and net income, in USD
// millions, taken from each company's own SEC-filed report.

import { useEffect, useState } from "react";
import { getFinancials, type FinancialFiling, type ReportItem } from "../lib/finnhub";

// Finnhub's XBRL names vary by filer, so each line item tries a few known variants.
const REVENUE = ["us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax", "us-gaap_Revenues", "us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax"];
const GROSS = ["us-gaap_GrossProfit"];
const OPERATING = ["us-gaap_OperatingIncomeLoss"];
const NET = ["us-gaap_NetIncomeLoss", "us-gaap_ProfitLoss"];

function findConcept(items: ReportItem[] | undefined, candidates: string[]): number | undefined {
  if (!items) return undefined;
  for (const name of candidates) {
    const match = items.find(i => i.concept === name);
    if (match && Number.isFinite(match.value)) return match.value;
  }
  return undefined;
}

const millions = (v: number | undefined) => (v === undefined ? "N/A" : `${(v / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}M`);

export function Financials({ symbol }: { symbol: string }) {
  const [filings, setFilings] = useState<FinancialFiling[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setFilings(undefined);
    getFinancials(symbol).then(f => { if (live) setFilings(f); });
    return () => { live = false; };
  }, [symbol]);

  if (filings === undefined) return <p className="muted small">Loading financial statements…</p>;
  if (filings === null) return <p className="muted small">Couldn't load financial statements right now.</p>;
  const recent = filings
    .filter(f => f.report && Array.isArray(f.report.ic))
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .slice(0, 4);
  if (recent.length === 0) return <p className="muted">No detailed financial-statement data available for this symbol.</p>;

  return (
    <>
      <div className="earnings-table financials-table">
        <div className="earnings-row earnings-header"><div>Period end</div><div>Revenue</div><div>Gross profit</div><div>Operating income</div><div>Net income</div></div>
        {recent.map(f => {
          const ic = f.report?.ic;
          return (
            <div key={f.endDate} className="earnings-row">
              <div>{f.endDate.slice(0, 10)}</div>
              <div>{millions(findConcept(ic, REVENUE))}</div>
              <div>{millions(findConcept(ic, GROSS))}</div>
              <div>{millions(findConcept(ic, OPERATING))}</div>
              <div>{millions(findConcept(ic, NET))}</div>
            </div>
          );
        })}
      </div>
      <p className="muted small">Figures in USD millions, taken from each company's own SEC-filed reports (via Finnhub). Not adjusted or estimated.</p>
    </>
  );
}
