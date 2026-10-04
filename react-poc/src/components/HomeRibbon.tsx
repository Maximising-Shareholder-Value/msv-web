// components/HomeRibbon.tsx — the top ribbon, frozen to the top of every page.
// Left: two market pills. One is your local time. The other is a market you pick
// (the US by default), with whether it's open right now and its local time.
// Right: recommended links, the notification bell, the light/dark toggle, Log in,
// and on phones a menu button that opens the sidebar.
// The theme uses the same saved choice as the rest of the site ("stockDashboardTheme").

import { useEffect, useState } from "react";
import { COUNTRY_LIST, exchangeStatus, localTime } from "../lib/markets";

const RECOMMENDED = [
  { label: "Stock Analysis", href: "/app/?page=home" },
  { label: "Market Data", href: "/app/?page=market-data" },
  { label: "Learn", href: "/app/?page=learn" },
  { label: "Market Intelligence", href: "/app/?page=market-intel" },
  { label: "Explore Products", href: "/app/?page=explore" },
];

const PICK_KEY = "msv-market-country";

function savedPick(): string {
  try {
    const v = localStorage.getItem(PICK_KEY);
    if (v && COUNTRY_LIST.some(c => c.iso2 === v)) return v;
  } catch { /* storage blocked: fall back to the US */ }
  return "US";
}

export function HomeRibbon() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
  );
  const [bellOpen, setBellOpen] = useState(false);
  const [pick, setPick] = useState(savedPick);
  const [now, setNow] = useState(() => Date.now());

  // Apply the theme and remember it, the same way the Crypto page does.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("stockDashboardTheme", theme); } catch { /* storage blocked: fine */ }
  }, [theme]);

  // Remember the picked market, and refresh the clocks every 30 seconds.
  useEffect(() => {
    try { localStorage.setItem(PICK_KEY, pick); } catch { /* storage blocked: fine */ }
  }, [pick]);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "your time zone";
  const localClock = new Date(now).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const country = COUNTRY_LIST.find(c => c.iso2 === pick);
  const status = country ? exchangeStatus(country) : null;

  return (
    <header className="hp-ribbon">
      <div className="tb-pills">
        <div className="tb-pill">
          <span className="tb-pill-label">Your local time</span>
          <strong className="tb-clock">{localClock}</strong>
          <span className="muted small">{localZone.replace(/_/g, " ")}</span>
        </div>
        <div className="tb-pill tb-market">
          <span className="tb-pill-label">Market</span>
          <select className="tb-select" value={pick} onChange={e => setPick(e.target.value)} aria-label="Pick a market">
            {COUNTRY_LIST.map(c => <option key={c.iso2} value={c.iso2}>{c.flag} {c.name}</option>)}
          </select>
          <span className={`tb-status ${status?.isOpen ? "open" : "closed"}`}>
            {status ? (status.isOpen ? "Open" : "Closed") : "No hours"}
          </span>
          {country?.tz && <span className="muted small">{localTime(country.tz)} there</span>}
        </div>
      </div>

      <div className="tb-right">
        <nav className="hp-ribbon-recommended" aria-label="Recommended links">
          {RECOMMENDED.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="hp-ribbon-tools">
          <button
            type="button"
            className="hp-ribbon-btn"
            aria-label="Notifications"
            aria-expanded={bellOpen}
            onClick={() => setBellOpen(open => !open)}
          >🔔</button>
          {bellOpen && (
            <div className="hp-bell-panel" role="dialog" aria-label="Notifications">
              <strong>No notifications yet</strong>
              <span className="muted small">Price and news alerts will arrive with accounts, which aren't built yet.</span>
            </div>
          )}
          <button
            type="button"
            className="hp-ribbon-btn"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}
          >{theme === "light" ? "🌙" : "☀️"}</button>
          <a className="tb-login" href="/app/?page=placeholder&key=login">Log in</a>
          <button
            type="button"
            className="tb-menu"
            aria-label="Open the menu"
            onClick={() => document.documentElement.classList.toggle("nav-open")}
          >☰</button>
        </div>
      </div>
    </header>
  );
}
