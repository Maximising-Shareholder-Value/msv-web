// changelog.js — a short, plain-English list of what's changed in $MSV
// recently. Powers the "What's New" popup (🔔 in the header) and its
// auto-open-once-per-new-entry behavior. Written for people using the
// app, not developers — see .github/HISTORY.md for the fuller,
// technical version of the same story. Update this array whenever a
// real change ships; same ongoing discipline as HISTORY.md, just a
// different audience and a shorter entry per item.
const CHANGELOG = [
  {
    date: "2026-09-21",
    items: [
      "Real options data (bid/ask, expirations) now flows through the backend — an on-page Options view is coming next.",
      "Macro data can now cover any country, not just the US — a country-picker view is coming next.",
      "Homepage: friendlier intro copy, a proper step-by-step \"How to use $MSV\" guide, and more tickers to browse in every category.",
      "Global Markets map now shows countries only — indexes and commodities moved into their own browse categories, including a new Commodities category.",
    ],
  },
  {
    date: "2026-09-19",
    items: [
      "Added automatic checks (CI) that catch broken code before it reaches the live site.",
      "ETFs, bond ETFs, and commodity ETFs now get their own proper set of numbers instead of showing blank \"N/A\" everywhere.",
    ],
  },
];

const WHATS_NEW_SEEN_KEY = "msvWhatsNewLastSeen";

function formatChangelogDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initWhatsNew() {
  const trigger = document.getElementById("whatsNewTrigger");
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

  function open() {
    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");
    try { localStorage.setItem(WHATS_NEW_SEEN_KEY, CHANGELOG[0].date); } catch {
      // localStorage unavailable (e.g. private browsing) — just skip remembering
    }
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

  // Auto-open once per new entry — but not on a visitor's very first-ever
  // visit, since there's nothing to "catch up on" before they've even
  // seen the app once. lastSeen is a plain ISO date string, so a normal
  // string comparison is enough to tell "older" from "newer".
  let lastSeen = null;
  try { lastSeen = localStorage.getItem(WHATS_NEW_SEEN_KEY); } catch {
    // localStorage unavailable — just skip the auto-open behavior
  }
  if (lastSeen === null) {
    try { localStorage.setItem(WHATS_NEW_SEEN_KEY, CHANGELOG[0].date); } catch { /* ignore */ }
  } else if (lastSeen < CHANGELOG[0].date) {
    open();
  }
}

initWhatsNew();
