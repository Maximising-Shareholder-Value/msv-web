// changelog.js — a short, plain-English list of what's changed in $MSV
// recently. Powers the "What's New" popup (🔔 in the header) and its
// red-dot-until-seen badge. Written for people using the app, not
// developers — see HISTORY.md in the project's governance repo
// (github.com/Maximising-Shareholder-Value/.github) for the fuller,
// technical version of the same story. Update this array whenever a
// real change ships; same ongoing discipline, just a different audience
// and a shorter entry per item.
// `date` is a full timestamp now (2026-09-21), not just a day — Jozsua
// asked for the What's New popup to show when things actually shipped,
// not just which day. Each entry's timestamp is the real time of its
// last/most-recent change (pulled from actual git commit times, not
// invented), grouped by day so the popup stays scannable rather than
// showing a header per commit.
const CHANGELOG = [
  {
    date: "2026-09-24T18:00:00+08:00",
    items: [
      "Sidebar links now take you to a real page with its own address — you can bookmark it, share it, or use your browser's back/forward buttons like normal.",
      "\"Supply Chain\" is now called \"Market Intelligence\" everywhere, and the home page has a new preview of it with real company logos.",
      "There's now just one $MSV logo (in the sidebar), and it no longer looks off in light mode.",
      "\"Explore Products\" is now organized into categories (Stock Analysis, Market Outlook, Portfolio Tools, and more) instead of one long list, plus a new \"Premium\" section (coming soon).",
      "Options now let you pick a different expiration date, see every strike price (not just the closest few), and optionally show last trade price and volume.",
      "The Macro tab can now search any country World Bank tracks, compare up to 4 countries side by side, and shows new governance indicators (political stability, rule of law, and more) alongside the economic ones.",
      "The world map can now color countries by GDP growth or inflation, and the São Paulo marker no longer sits out in the ocean.",
    ],
  },
  {
    date: "2026-09-23T11:50:00+08:00",
    items: [
      "New hero section on the home page, with a \"Create a free account\" panel (Coming Soon).",
      "Market News is now two compact columns — Top Headlines and Latest News — instead of one big list.",
      "Winners/Losers/Most Active now show as a clean table (Symbol, Price, Change) instead of tiles — the Heatmap view option is still there too.",
    ],
  },
  {
    date: "2026-09-23T11:20:00+08:00",
    items: [
      "Sidebar icons are now clean line-style icons instead of emoji, and the $MSV logo at the top is smaller.",
    ],
  },
  {
    date: "2026-09-23T10:21:00+08:00",
    items: [
      "A new sidebar is back — this time it stays with you on every page, not just the home page, with 18 destinations organized into Account, Explore, and Your Tools sections.",
      "New \"Explore Products\" page — a full directory of everything $MSV offers, including what's still being built.",
      "\"Stock Analysis\", \"Market Data\", \"Sectors\", and \"Market Intelligence\" are now their own dedicated sections instead of sitting in one long tab row.",
      "A few new sections are visible but marked \"Coming Soon\" for now: Create Free Account, Log In, Performance, Portfolio Builder, and Portfolio Health Check.",
    ],
  },
  {
    date: "2026-09-22T19:14:00+08:00",
    items: [
      "Removed the left sidebar — Watchlist and Recently Viewed now live as cards on the home page instead.",
      "New \"Supply Chain\" tab — a real, sourced look at how 17 companies in the AI infrastructure space (NVIDIA, TSMC, Microsoft, OpenAI, and others) are actually connected, with a source and confidence rating on every relationship shown.",
    ],
  },
  {
    date: "2026-09-22T18:20:00+08:00",
    items: [
      "New: a real Watchlist — tap the ☆ on any ticker page to track it, view/remove it from the sidebar.",
      "New: \"Did You Know\" card on the home page — a rotating tip pulled from the Learn hub.",
      "New: Economic Calendar (real FOMC/CPI dates) and Earnings This Week, right on the home page.",
      "New: Sector Performance heatmap — see all 11 market sectors at a glance.",
    ],
  },
  {
    date: "2026-09-22T18:08:00+08:00",
    items: [
      "Fixed the collapsed sidebar — it now shows a clean row of icon-only shortcuts (Learn/Compare/Macro) instead of an empty, half-clipped strip.",
    ],
  },
  {
    date: "2026-09-22T17:07:00+08:00",
    items: [
      "New collapsible sidebar on the home page — quick ticker search, quick links to Learn/Compare/Macro, and Recently Viewed (moved here from its old spot above the tabs).",
      "Learn now has its own banner near the top of the home page instead of sitting in the tab row next to Winners/Losers/browse categories.",
      "More home page modules (a real Watchlist, sector heatmap, economic/earnings calendars, a rotating Learn tip) are coming in a follow-up update.",
    ],
  },
  {
    date: "2026-09-22T16:21:00+08:00",
    items: [
      "Learn tab is now complete — added the final 3 categories: Macro & the Economy (rate hikes, inflation, GDP, unemployment), Options 101 (calls, puts, strikes, premiums), and Putting It Together (diversification, risk tolerance, reading the Outlook, red flags to watch for).",
      "That's all 5 planned Learn categories now live, each with plain-English explanations and simple diagrams — nothing left showing \"Coming soon\".",
    ],
  },
  {
    date: "2026-09-22T15:50:00+08:00",
    items: [
      "Learn tab: new \"Reading the Numbers\" category — Valuation, Growth, Profitability & Efficiency, Financial Health & Risk, and Dividends, each explained in plain English with its own simple diagram, going deeper than the (?) tooltips on the ticker page.",
    ],
  },
  {
    date: "2026-09-22T11:56:00+08:00",
    items: [
      "New \"Learn\" tab on the home page — plain-English explanations of what a stock, ETF, bond ETF, and crypto actually are, each with a simple diagram and a real example, for anyone starting from zero.",
      "More Learn topics (reading the numbers, macro/the economy, options, and how to put it all together) are coming in future updates — you'll see them listed as \"Coming soon\" for now.",
    ],
  },
  {
    date: "2026-09-22T11:29:00+08:00",
    items: [
      "Two new sections on the stock ticker page: Risk (interest coverage, long-term debt/equity, dividend payout ratio) and Efficiency (asset, inventory, and receivables turnover).",
      "Profitability now also shows Return on Assets, Return on Investment, and 5-year average margins alongside the existing figures.",
      "Growth now also shows quarter-over-quarter growth, not just year-over-year and 5-year.",
      "Valuation now also shows Price/Sales and Price/Cash-Flow.",
      "All of the above are stock-only (hidden for ETFs and crypto, same as the existing Growth/Profitability sections) and each has its own plain-English (?) guide.",
    ],
  },
  {
    date: "2026-09-21T20:20:00+08:00",
    items: [
      "Global Markets: hover any highlighted country on the map for its index price and an economic snapshot (GDP growth, inflation, unemployment) in one popup.",
      "The map itself is cleaner now — prices moved into that hover popup instead of sitting permanently under every label (they were already duplicated in the sidebar list anyway).",
      "The sidebar list now shows a flag next to each country's name.",
      "The Macro tab can now show China, Germany, Japan, or the UK, not just the US — pick a country from the new row of buttons.",
      "The whole site is now ~10% bigger and uses more of the browser window's width on larger screens.",
      "Added a simplified Options view on the ticker page — nearest expiration, the strikes closest to today's price, with a plain-English (?) guide for anyone new to options.",
      "ETF/index fund pages now show the fund's real name and issuer (e.g. \"Vanguard S&P 500 ETF\" — Vanguard), plus a real description where one's available.",
      "Added an After-Hours price field (clearly marked as a sample — no free data source provides a real one yet).",
      "Homepage: friendlier intro copy, a proper step-by-step \"How to use $MSV\" guide, and more tickers to browse in every category.",
      "Global Markets map now shows countries only — indexes and commodities moved into their own browse categories, including a new Commodities category.",
      "This \"What's New\" bell now shows a small red dot (with a date and time on each update) instead of popping up automatically every time.",
    ],
  },
  {
    date: "2026-09-19T15:59:00+08:00",
    items: [
      "Added automatic checks (CI) that catch broken code before it reaches the live site.",
      "ETFs, bond ETFs, and commodity ETFs now get their own proper set of numbers instead of showing blank \"N/A\" everywhere.",
    ],
  },
];

const WHATS_NEW_SEEN_KEY = "msvWhatsNewLastSeen";

function formatChangelogDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function initWhatsNew() {
  const trigger = document.getElementById("whatsNewTrigger");
  const badge = document.getElementById("whatsNewBadge");
  const overlay = document.getElementById("whatsNewOverlay");
  const modal = document.getElementById("whatsNewModal");
  const closeBtn = document.getElementById("whatsNewClose");
  const listEl = document.getElementById("whatsNewList");
  if (!trigger || !overlay || !modal || CHANGELOG.length === 0) return;

  listEl.innerHTML = CHANGELOG.map(entry => `
    <div class="whats-new-entry">
      <div class="whats-new-date">${formatChangelogDate(entry.date)}</div>
      <ul>${entry.items.map(item => `<li>${item}</li>`).join("")}</ul>
    </div>
  `).join("");

  function markSeen() {
    badge.classList.add("hidden");
    try { localStorage.setItem(WHATS_NEW_SEEN_KEY, CHANGELOG[0].date); } catch {
      // localStorage unavailable (e.g. private browsing) — just skip remembering
    }
  }
  function open() {
    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");
    markSeen();
  }
  function close() {
    overlay.classList.add("hidden");
    modal.classList.add("hidden");
  }

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
  });

  // A quiet red dot on the bell — not an intrusive auto-popup — for
  // anyone (Jozsua or a teammate) whose FIRST visit lands after a new
  // entry was added. Skipped on a genuinely first-ever visit to the
  // site, since there's nothing to "catch up on" before seeing the app
  // even once. lastSeen is a plain ISO date string, so a normal string
  // comparison is enough to tell "older" from "newer".
  let lastSeen = null;
  try { lastSeen = localStorage.getItem(WHATS_NEW_SEEN_KEY); } catch {
    // localStorage unavailable — just skip the badge behavior
  }
  if (lastSeen === null) {
    try { localStorage.setItem(WHATS_NEW_SEEN_KEY, CHANGELOG[0].date); } catch { /* ignore */ }
  } else if (lastSeen < CHANGELOG[0].date) {
    badge.classList.remove("hidden");
  }
}

initWhatsNew();
