// lib/secForm4.ts — tech-leader/company-insider trades (SEC Form 4), Tier 2 of the "notable
// figures" trading page (Tier 1 is congressional trading — lib/bargo.ts). Source: SEC EDGAR,
// the official, free record of what a company's OWN officers/directors/10%+ owners do with
// THEIR OWN company's stock. Real, deliberate scope limit, not a gap: Elon Musk's filings cover
// Tesla AND SpaceX (he's an officer/director at both) — confirmed live, 2026-10-11, while
// verifying the CIK list below — not "everything Musk personally invests in." Nothing here
// assumes one person files under only one company.
//
// Two SEC hosts are involved (confirmed live, 2026-10-08/11, see msv-org-github's
// API_RESEARCH.md): `data.sec.gov/submissions/...` lists a person's filings and has real CORS
// support, so it's called directly from here. The actual transaction numbers live in a separate
// ownership XML under `www.sec.gov/Archives/edgar/data/...`, which has none (SEC's Akamai bot
// protection) — that goes through the msv-api `/api/sec-archive` proxy, which also attaches the
// required User-Agent header (see msv-api/worker.js's SEC_USER_AGENT var).
//
// Path quirk found while building this: the submissions JSON's `primaryDocument` field for a
// Form 4 is usually something like "xslF345X06/wk-form4_123.xml" — that `xslXXX/` folder is
// SEC's human-readable, XSLT-rendered HTML VIEW of the filing (confirmed live: fetching that
// exact path returns an HTML document, not XML). The real raw XML sits at the accession root
// under the same filename with that folder stripped — see rawXmlPath() below.

import { trackedFetch } from "./apiUsage";
import { createLimiter } from "./limit";

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";
const SUBMISSIONS_BASE = "https://data.sec.gov/submissions";

export interface TrackedInsider { name: string; cik: string }

// Curated list — each CIK confirmed live, 2026-10-11, by checking the issuer actually named in
// that person's own recent Form 4 filings, not just a name-search match: SEC's company search
// by name alone returned 4 different "Timothy Cook"s, and the wrong one would have silently
// shown someone else's trades under Apple's CEO's name. See msv-org-github/HISTORY.md for the
// verification notes, including the one surprise: Michael Dell's most recent filings are for
// his other MSD-affiliated boards, not Dell Technologies itself, until further back in his
// filing history.
export const TRACKED_INSIDERS: TrackedInsider[] = [
  { name: "Elon Musk", cik: "0001494730" },
  { name: "Mark Zuckerberg", cik: "0001548760" },
  { name: "Jeff Bezos", cik: "0001043298" },
  { name: "Tim Cook", cik: "0001214156" },
  { name: "Satya Nadella", cik: "0001513142" },
  { name: "Jensen Huang", cik: "0001197649" },
  { name: "Sundar Pichai", cik: "0001534753" },
  { name: "Jamie Dimon", cik: "0001195345" },
  { name: "Larry Ellison", cik: "0000901999" },
  { name: "Michael Dell", cik: "0000908724" },
];

export interface InsiderTransaction {
  insiderName: string;
  insiderCik: string;
  issuerName: string;
  ticker: string;
  filingDate: string;
  transactionDate: string;
  code: string;
  codeLabel: string;
  acquiredDisposed: "A" | "D" | "";
  shares: number | null;
  pricePerShare: number | null;
  sharesOwnedAfter: number | null;
  isDerivative: boolean;
  officerTitle: string;
  isDirector: boolean;
  isTenPercentOwner: boolean;
  filingUrl: string;
}

// SEC Form 4's own transaction-code table — only codes that actually show up for this tracked
// group get a plain-English label; anything else falls back to the raw code so nothing is
// silently mislabeled as something it isn't.
const CODE_LABELS: Record<string, string> = {
  P: "Open-market buy",
  S: "Open-market sale",
  A: "Grant/award",
  M: "Option exercise",
  F: "Tax withholding",
  G: "Gift",
  C: "Conversion",
  D: "Sold back to company",
  X: "Option exercise",
  J: "Other (see filing)",
  K: "Equity swap",
  U: "Tender of shares",
};
export function codeLabel(code: string): string { return CODE_LABELS[code] ?? code; }

function rawXmlPath(primaryDocument: string): string {
  return primaryDocument.replace(/^xsl[^/]+\//, "");
}

// SEC asks for roughly <=10 requests/sec. A cold page load fans this out across up to 10
// tracked people at once, each needing both a filings-list request and per-filing document
// requests — all of it shares this one limiter so the total never exceeds the cap, not just the
// document requests. Same helper lib/worldBank.ts uses for the same reason against a different
// host.
const limited = createLimiter(4);

interface SecFiling { accessionNumber: string; primaryDocument: string; filingDate: string }

async function fetchFilingsList(cik: string): Promise<SecFiling[]> {
  const res = await limited(() => trackedFetch(`${SUBMISSIONS_BASE}/CIK${cik}.json`));
  if (!res.ok) throw new Error(`SEC submissions returned ${res.status}`);
  const data = await res.json();
  const fr = data?.filings?.recent;
  if (!fr) return [];
  const out: SecFiling[] = [];
  for (let i = 0; i < fr.form.length; i++) {
    if (fr.form[i] === "4") {
      out.push({ accessionNumber: fr.accessionNumber[i], primaryDocument: fr.primaryDocument[i], filingDate: fr.filingDate[i] });
    }
  }
  return out;
}

function textOf(el: Element | Document, selector: string): string {
  return el.querySelector(selector)?.textContent?.trim() ?? "";
}
function numOf(el: Element | Document, selector: string): number | null {
  const v = textOf(el, selector);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function boolOf(el: Element | Document, selector: string): boolean {
  const v = textOf(el, selector);
  return v === "true" || v === "1";
}

async function fetchAndParseFiling(insider: TrackedInsider, filing: SecFiling): Promise<InsiderTransaction[]> {
  const cikNum = String(parseInt(insider.cik, 10));
  const accNoDashes = filing.accessionNumber.replace(/-/g, "");
  const path = `/${cikNum}/${accNoDashes}/${rawXmlPath(filing.primaryDocument)}`;
  const res = await limited(() => trackedFetch(`${API_BASE}/api/sec-archive?path=${encodeURIComponent(path)}`));
  if (!res.ok) throw new Error(`SEC archive returned ${res.status}`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  const issuerName = textOf(doc, "issuer > issuerName") || "—";
  const ticker = textOf(doc, "issuer > issuerTradingSymbol") || "—";
  const rel = doc.querySelector("reportingOwner > reportingOwnerRelationship");
  const officerTitle = rel ? textOf(rel, "officerTitle") : "";
  const isDirector = rel ? boolOf(rel, "isDirector") : false;
  const isTenPercentOwner = rel ? boolOf(rel, "isTenPercentOwner") : false;
  const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoDashes}/`;

  const rows: InsiderTransaction[] = [];
  const collect = (selector: string, isDerivative: boolean) => {
    doc.querySelectorAll(selector).forEach(txn => {
      const code = textOf(txn, "transactionCoding > transactionCode");
      if (!code) return;
      rows.push({
        insiderName: insider.name,
        insiderCik: insider.cik,
        issuerName,
        ticker,
        filingDate: filing.filingDate,
        transactionDate: textOf(txn, "transactionDate > value"),
        code,
        codeLabel: codeLabel(code),
        acquiredDisposed: (textOf(txn, "transactionAcquiredDisposedCode > value") as "A" | "D" | "") || "",
        shares: numOf(txn, "transactionShares > value"),
        pricePerShare: numOf(txn, "transactionPricePerShare > value"),
        sharesOwnedAfter: numOf(txn, "postTransactionAmounts > sharesOwnedFollowingTransaction > value"),
        isDerivative,
        officerTitle,
        isDirector,
        isTenPercentOwner,
        filingUrl,
      });
    });
  };
  collect("nonDerivativeTable > nonDerivativeTransaction", false);
  collect("derivativeTable > derivativeTransaction", true);
  return rows;
}

/** Most recent `limit` Form 4 filings' transactions for one tracked person (a filing can list
 * more than one transaction line, so this can return more rows than `limit`). */
export async function fetchInsiderTransactions(insider: TrackedInsider, limit = 5): Promise<InsiderTransaction[]> {
  const filings = (await fetchFilingsList(insider.cik)).slice(0, limit);
  const results = await Promise.all(filings.map(f => fetchAndParseFiling(insider, f).catch(() => [] as InsiderTransaction[])));
  return results.flat();
}

/** Every tracked person's most recent few filings, merged and sorted by filing date descending
 * — the page's default "recent activity" feed. */
export async function fetchAllRecentInsiderTransactions(perPersonLimit = 5): Promise<InsiderTransaction[]> {
  const all = await Promise.all(TRACKED_INSIDERS.map(p => fetchInsiderTransactions(p, perPersonLimit).catch(() => [] as InsiderTransaction[])));
  return all.flat().sort((a, b) => b.filingDate.localeCompare(a.filingDate));
}
