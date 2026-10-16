// lib/sec13F.ts — Tier 3 of Trading Insider: what tracked institutional managers hold, from
// their official quarterly SEC 13F filings. Unlike Tiers 1-2 (individual trades), a 13F is a
// full snapshot of a manager's US equity holdings as of a quarter-end date, filed up to 45 days
// after the quarter closes — so this is never "what they just did," always "their position as of
// the last quarter they had to report."
//
// Same two-SEC-host setup as Form 4 (see secForm4.ts): the filings list
// (data.sec.gov/submissions/...) has real CORS support and is called directly; the actual
// holdings table lives in a separate infotable.xml under www.sec.gov/Archives/edgar/data/...,
// which has none — confirmed live, 2026-10-16, it's the SAME flat /<cik>/<accession>/<file>
// shape Form 4 uses, so the existing msv-api `/api/sec-archive` proxy already covers it. Zero
// new backend route needed for this half.
//
// A 13F identifies each position by CUSIP, not ticker — that's the genuinely new piece. CUSIP ->
// ticker goes through the new `/api/openfigi` proxy (msv-api), since OpenFIGI has no CORS of its
// own either (confirmed live). Its free, unauthenticated tier caps a single request at 10
// mapping jobs (HTTP 413 above that, found by testing directly — not the "100" figure cited in
// some docs, which is a registered-key figure) — resolveTickers() below batches accordingly.
//
// Real gotcha confirmed live, 2026-10-16, while picking which entity to track for Bill Ackman:
// his original Pershing Square Capital Management CIK (1336528) now only files 13F-NT (a notice
// that holdings are reported jointly elsewhere) — zero real holdings data. The actual filings
// moved to a newer entity, "Pershing Square Inc." (CIK 2026053), confirmed by its 13F-HR
// containing his known real positions (Howard Hughes, Hertz, Uber, Brookfield). Use that CIK, not
// the older one, if this list is ever re-verified.
//
// Second gotcha, also confirmed live: under SEC's current rules the `<value>` field in a 13F's
// infoTable is already in WHOLE DOLLARS, not thousands — older guides describing a pre-2023
// "value is in thousands" convention are out of date. Verified against Scion's real Halliburton
// position (2,500,000 shares, value 61,500,000 -> $24.60/share, a real HAL price range; treating
// it as thousands would imply a nonsensical $24,600/share).
//
// Third gotcha: the holdings-table file is NOT always named "infotable.xml" — that's just the
// filename Scion's/Ackman's/ARK's filing agents happen to use. Berkshire's latest 13F-HR (filed
// via a different agent) names it "56757.xml" instead. Confirmed live there's no way to predict
// this from the accession number alone, so every filing's real document list is looked up first
// via SEC's own `index.json` for that accession folder — also on the Akamai-protected host, also
// covered by the existing `/api/sec-archive` proxy (same flat path shape) — and the one .xml file
// that isn't primary_doc.xml (the cover page, always present) is treated as the holdings table.

import { trackedFetch } from "./apiUsage";
import { createLimiter } from "./limit";

const API_BASE = "https://msv-api.jozsua-heng.workers.dev";
const SUBMISSIONS_BASE = "https://data.sec.gov/submissions";

export interface TrackedManager { name: string; fundName: string; cik: string }

// Each CIK confirmed live, 2026-10-16, against that entity's own most recent 13F-HR (a real
// Holdings Report, not a 13F-NT notice) and sanity-checked against known real positions — same
// diligence as Tier 2's TRACKED_INSIDERS list.
export const TRACKED_MANAGERS: TrackedManager[] = [
  { name: "Warren Buffett", fundName: "Berkshire Hathaway", cik: "0001067983" },
  { name: "Michael Burry", fundName: "Scion Asset Management", cik: "0001649339" },
  { name: "Bill Ackman", fundName: "Pershing Square", cik: "0002026053" },
  { name: "Cathie Wood", fundName: "ARK Investment Management", cik: "0001697748" },
];

export interface Holding {
  nameOfIssuer: string;
  titleOfClass: string;
  cusip: string;
  ticker: string | null;
  valueUsd: number;        // already whole dollars, see file header
  shares: number | null;
  shareType: string;       // "SH" (shares) or "PRN" (principal amount)
  putCall: string | null;  // "Call" / "Put" for an options position, null for a plain holding
}

export interface ManagerHoldings {
  manager: TrackedManager;
  filingDate: string;
  periodOfReport: string;  // the quarter-end date this snapshot is as of
  holdings: Holding[];     // sorted by valueUsd descending
  totalValueUsd: number;
}

interface Sec13FFiling { accessionNumber: string; filingDate: string; periodOfReport: string }

// Shared with secForm4.ts's own reasoning: SEC asks for roughly <=10 requests/sec, so every
// request against either SEC host from this feature goes through one small concurrency cap.
const secLimited = createLimiter(4);
// OpenFIGI's confirmed real limit is 25 requests/min — a lower concurrency cap here leaves
// headroom for other visitors sharing the same msv-api deployment.
const figiLimited = createLimiter(3);

async function fetchLatest13F(cik: string): Promise<Sec13FFiling | null> {
  const res = await secLimited(() => trackedFetch(`${SUBMISSIONS_BASE}/CIK${cik}.json`));
  if (!res.ok) throw new Error(`SEC submissions returned ${res.status}`);
  const data = await res.json();
  const fr = data?.filings?.recent;
  if (!fr) return null;
  for (let i = 0; i < fr.form.length; i++) {
    // 13F-HR is a real Holdings Report. 13F-HR/A is an amendment to one — also real holdings
    // data, kept. 13F-NT ("Notice") means this filer's holdings are reported jointly under a
    // different CIK and carries no infoTable at all — skipped, same reasoning as the Ackman
    // CIK gotcha in the file header.
    if (fr.form[i] === "13F-HR" || fr.form[i] === "13F-HR/A") {
      return {
        accessionNumber: fr.accessionNumber[i],
        filingDate: fr.filingDate[i],
        periodOfReport: fr.reportDate[i],
      };
    }
  }
  return null;
}

function textOf(el: Element, selector: string): string {
  return el.querySelector(selector)?.textContent?.trim() ?? "";
}
function numOf(el: Element, selector: string): number | null {
  const v = textOf(el, selector);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface DirectoryItem { name: string }

/** The real filename of a filing's holdings-table XML — not always "infotable.xml", see the file
 * header's third gotcha. Looks up the accession folder's real file list via SEC's own
 * `index.json` and picks the one `.xml` file that isn't `primary_doc.xml` (the cover page). */
async function findInfoTableFilename(cikNum: string, accNoDashes: string): Promise<string | null> {
  const path = `/${cikNum}/${accNoDashes}/index.json`;
  const res = await secLimited(() => trackedFetch(`${API_BASE}/api/sec-archive?path=${encodeURIComponent(path)}`));
  if (!res.ok) return null;
  const data: { directory?: { item?: DirectoryItem[] } } = await res.json();
  const items = data.directory?.item ?? [];
  const infoTable = items.find(i => i.name.endsWith(".xml") && i.name !== "primary_doc.xml");
  return infoTable?.name ?? null;
}

async function fetchAndParseInfoTable(cik: string, filing: Sec13FFiling): Promise<Omit<Holding, "ticker">[]> {
  const cikNum = String(parseInt(cik, 10));
  const accNoDashes = filing.accessionNumber.replace(/-/g, "");
  const filename = await findInfoTableFilename(cikNum, accNoDashes);
  if (!filename) return [];
  const path = `/${cikNum}/${accNoDashes}/${filename}`;
  const res = await secLimited(() => trackedFetch(`${API_BASE}/api/sec-archive?path=${encodeURIComponent(path)}`));
  if (!res.ok) throw new Error(`SEC archive returned ${res.status}`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  const rows: Omit<Holding, "ticker">[] = [];
  doc.querySelectorAll("infoTable").forEach(row => {
    const cusip = textOf(row, "cusip");
    if (!cusip) return;
    rows.push({
      nameOfIssuer: textOf(row, "nameOfIssuer") || "—",
      titleOfClass: textOf(row, "titleOfClass") || "—",
      cusip,
      valueUsd: numOf(row, "value") ?? 0,
      shares: numOf(row, "shrsOrPrnAmt > sshPrnamt"),
      shareType: textOf(row, "shrsOrPrnAmt > sshPrnamtType") || "SH",
      putCall: textOf(row, "putCall") || null,
    });
  });
  return rows;
}

interface OpenFigiEntry { ticker?: string; exchCode?: string }

/** CUSIP -> best-guess US ticker, or null if OpenFIGI has no mapping. Batches at 10 per request
 * (OpenFIGI's own confirmed per-request cap on the free tier) and dedupes repeated CUSIPs across
 * a filing (e.g. the same issuer appearing in two titleOfClass rows) into one lookup each. */
async function resolveTickers(cusips: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(cusips)];
  const out = new Map<string, string | null>();
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 10) chunks.push(unique.slice(i, i + 10));

  await Promise.all(chunks.map(chunk => figiLimited(async () => {
    try {
      const res = await trackedFetch(`${API_BASE}/api/openfigi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cusips: chunk }),
      });
      if (!res.ok) { chunk.forEach(c => out.set(c, null)); return; }
      const body: { data?: OpenFigiEntry[] }[] = await res.json();
      chunk.forEach((cusip, i) => {
        const entries = body[i]?.data;
        if (!entries || entries.length === 0) { out.set(cusip, null); return; }
        // Prefer the US composite listing (exchCode "US") over a foreign cross-listing of the
        // same security — several of these entries can share one CUSIP across exchanges.
        const best = entries.find(e => e.exchCode === "US") ?? entries[0];
        out.set(cusip, best.ticker ?? null);
      });
    } catch {
      chunk.forEach(c => out.set(c, null));
    }
  })));
  return out;
}

/** One manager's latest 13F, with tickers resolved where OpenFIGI has a mapping. Returns null if
 * no real Holdings Report is on file (e.g. a 13F-NT-only filer, or a lookup failure). */
export async function fetchLatestHoldings(manager: TrackedManager): Promise<ManagerHoldings | null> {
  const filing = await fetchLatest13F(manager.cik);
  if (!filing) return null;
  const rawRows = await fetchAndParseInfoTable(manager.cik, filing);
  if (rawRows.length === 0) return null;

  const tickers = await resolveTickers(rawRows.map(r => r.cusip));
  const holdings: Holding[] = rawRows
    .map(r => ({ ...r, ticker: tickers.get(r.cusip) ?? null }))
    .sort((a, b) => b.valueUsd - a.valueUsd);
  const totalValueUsd = holdings.reduce((s, h) => s + h.valueUsd, 0);

  return { manager, filingDate: filing.filingDate, periodOfReport: filing.periodOfReport, holdings, totalValueUsd };
}

/** Every tracked manager's latest holdings, fetched in parallel. A manager that fails or has no
 * real Holdings Report comes back null in its slot rather than dropping the whole list. */
export async function fetchAllLatestHoldings(): Promise<(ManagerHoldings | null)[]> {
  return Promise.all(TRACKED_MANAGERS.map(m => fetchLatestHoldings(m).catch(() => null)));
}
