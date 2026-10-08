// components/HomeRibbon.tsx — the top ribbon, frozen to the top of every page.
// Left: two market pills. One is your local time. The other is a market you pick
// (the US by default), with whether it's open right now and its local time.
// Right: recommended links, the notification bell, the light/dark toggle, Log in,
// and on phones a menu button that opens the sidebar.
// The theme uses the same saved choice as the rest of the site ("stockDashboardTheme").
//
// On a narrower desktop window (found 2026-10-08 on a 15" MacBook Air: the ribbon wrapped
// onto two lines once the recommended links no longer fit beside the pills and buttons),
// the recommended links drop off the right end, one at a time, until everything fits back on
// one line — see the "keep the ribbon on one line" effect below. Below 760px the links are
// hidden entirely by CSS already (the ribbon becomes the phone layout), so this never runs
// there; it only matters for the desktop/tablet range.

import { useEffect, useRef, useState } from "react";
import { COUNTRY_LIST, exchangeStatus, localTime } from "../lib/markets";

const RECOMMENDED = [
  { label: "Stock Analysis", href: "/app/?page=stock-analysis" },
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
  const ribbonRef = useRef<HTMLElement>(null);
  const recRef = useRef<HTMLElement>(null);

  // Keep the ribbon on one line: whenever it would wrap, drop recommended links off the
  // right end (the ones still shown stay in RECOMMENDED's order) until it fits again, then
  // add them back as the window widens. Re-measured on any width change via ResizeObserver
  // on .app-main, not on the ribbon itself — hiding a link changes the ribbon's own size, and
  // watching that would fight itself.
  //
  // To check whether it fits: neither forcing `nowrap` (the flex children shrink to absorb
  // the overflow instead of genuinely overflowing, so scrollWidth never shows it) nor adding
  // up each piece's own measured width by hand (flexbox's real wrap decision uses each flex
  // item's own automatic minimum size, not its rendered content width — the arithmetic kept
  // saying "fits" a good 80px before it actually did) matched what the browser does. Instead,
  // just ask the browser directly: hide links one at a time and check the real rendered
  // position after each one — the pills and the right-hand group sit near-enough the same
  // top when they're genuinely on one line (small differences are just `align-items: center`
  // centring items of different heights); once it wraps, the gap is a full row, tens of px.
  useEffect(() => {
    const appMain = ribbonRef.current?.closest(".app-main");
    if (!appMain) return;
    let frame = 0;
    const fit = () => {
      const ribbon = ribbonRef.current, rec = recRef.current;
      const pills = ribbon?.querySelector<HTMLElement>(".tb-pills");
      const right = ribbon?.querySelector<HTMLElement>(".tb-right");
      if (!ribbon || !rec || !pills || !right) return;
      const links = Array.from(rec.querySelectorAll<HTMLAnchorElement>("a"));
      links.forEach(a => { a.style.display = ""; });
      const oneLine = () => Math.abs(pills.getBoundingClientRect().top - right.getBoundingClientRect().top) < 10;
      for (let i = links.length - 1; i >= 0 && !oneLine(); i--) links[i].style.display = "none";
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(appMain);
    fit();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

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
    <header className="hp-ribbon" ref={ribbonRef}>
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
        <nav className="hp-ribbon-recommended" aria-label="Recommended links" ref={recRef}>
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
