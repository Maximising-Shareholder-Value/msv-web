// data/filings.ts — plain-English names and descriptions for SEC filing types.
// Copied from ../../script.js (FILING_TYPE_INFO).

export const FILING_TYPE_INFO: Record<string, { name: string; desc: string }> = {
  "10-K": { name: "Annual Report", desc: "Full-year financial results, risk factors, and a detailed look at the whole business — the most complete filing a company makes, once a year." },
  "10-K/A": { name: "Annual Report (Amended)", desc: "A correction or update to a previously filed annual report." },
  "10-Q": { name: "Quarterly Report", desc: "Financial results for the past three months. Less detailed than the annual report; filed three times a year (the fourth quarter is covered by the 10-K instead)." },
  "10-Q/A": { name: "Quarterly Report (Amended)", desc: "A correction or update to a previously filed quarterly report." },
  "8-K": { name: "Major Event Notice", desc: "Filed within days of something significant happening — an acquisition, executive change, earnings release, or similar — whenever it occurs, not on a fixed schedule." },
  "DEF 14A": { name: "Proxy Statement", desc: "Sent to shareholders ahead of the annual meeting. Covers executive pay, board elections, and anything shareholders are being asked to vote on." },
  "DEFA14A": { name: "Proxy Statement (Additional)", desc: "Extra material related to an upcoming shareholder vote, filed alongside or after the main proxy statement." },
  "S-1": { name: "IPO Registration", desc: "Filed before a company's stock starts trading publicly, to register the shares with the SEC." },
  "S-3": { name: "Securities Registration", desc: "A streamlined filing for registering new stock or debt, used by companies that already file regularly." },
  "S-8": { name: "Employee Stock Plan Registration", desc: "Registers shares set aside for employee compensation plans (stock options, RSUs, etc.)." },
  "4": { name: "Insider Transaction", desc: "An individual insider — an executive, director, or major shareholder — reporting a purchase or sale of company stock." },
  "3": { name: "Initial Insider Ownership", desc: "An executive, director, or major shareholder's first report of how much company stock they own." },
  "SC 13G": { name: "Large Shareholder Disclosure", desc: "Filed by an investor who has passively acquired 5%+ of the company's shares." },
  "SC 13D": { name: "Large Shareholder Disclosure (Active)", desc: "Filed by an investor who has acquired 5%+ of the company's shares and may be seeking to influence the company." },
  "11-K": { name: "Employee Stock Plan Annual Report", desc: "Yearly financial report for the company's employee stock purchase or retirement plan." },
  // ETFs/funds file completely different forms than companies do (no 10-K,
  // no earnings) — these are the ones that actually show up for the ETFs
  // in this app's curated lists, confirmed via a live filings request.
  "NPORT-P": { name: "Portfolio Holdings Report", desc: "A monthly snapshot of exactly what the fund holds — every position, and how much of the fund's money is in each one." },
  "N-CEN": { name: "Annual Fund Census", desc: "A yearly operational report about the fund itself (service providers, share classes, etc.) — not its holdings or performance." },
  "N-30D": { name: "Shareholder Report", desc: "A periodic report to the fund's own shareholders covering performance and a summary of holdings, similar in spirit to a company's earnings report." },
  "497": { name: "Prospectus Supplement", desc: "An update to the fund's prospectus — the document describing its strategy, fees, and risks." },
  "497J": { name: "Prospectus Certification", desc: "A short filing certifying that a previously filed prospectus update meets SEC requirements." },
  "485BPOS": { name: "Registration Update", desc: "An update to the fund's core registration statement with the SEC — routine, not tied to any specific event." },
  "NSAR-U": { name: "Annual Report (Legacy Form)", desc: "An older annual reporting form for funds, since replaced by N-CEN — may still appear in older filing history." },
  "24F-2NT": { name: "Share Sales Notice", desc: "An annual notice of how many new shares the fund sold over the year, used to calculate SEC registration fees — a regulatory formality, not performance data." },
};
