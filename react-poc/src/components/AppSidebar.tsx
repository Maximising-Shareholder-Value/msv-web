// components/AppSidebar.tsx — the site's sidebar, drawn in React for the React
// pages. Same groups, labels and icons as the sidebar in index.html
// (data/sidebar.ts). Each item goes to its React page when one exists, and to
// the same route on the main site otherwise.
//
// The main site still has its own sidebar and router; this one only moves
// visitors around between pages built in React and the pages still on the
// main site.

import { SIDEBAR_GROUPS } from "../data/sidebar";

// Items whose React page is built. Anything else opens on the main site.
const REACT_HREF: Record<string, string> = {
  home: "/react-crypto/?page=home",
  "explore-products": "/react-crypto/?page=explore",
  "stock-screener": "/react-crypto/?page=screener",
  "market-data": "/react-crypto/?page=market-data",
  "market-news": "/react-crypto/?page=news",
  learn: "/react-crypto/?page=learn",
  sectors: "/react-crypto/?page=sectors",
  "market-intelligence": "/react-crypto/?page=market-intel",
  etfs: "/react-crypto/?page=etfs",
  crypto: "/react-crypto/",
  "bitcoin-cycles": "/react-crypto/?tab=cycles",
  "crypto-news": "/react-crypto/?tab=news",
};

// The nav key each React page is highlighted under.
export function hrefFor(nav: string): string {
  return REACT_HREF[nav] ?? `/${nav}`;
}

export function AppSidebar({ current }: { current: string }) {
  return (
    <aside className="app-sidebar" aria-label="Site navigation">
      <div className="app-sidebar-scroll">
        <a className="app-sidebar-logo" href="/">
          <span className="app-sidebar-badge">$MSV</span>
          <span className="app-sidebar-fullname"><span>Maximising</span><span>Shareholder</span><span className="app-sidebar-fullname-accent">Value</span></span>
        </a>
        {SIDEBAR_GROUPS.map((group, gi) => (
          <div key={gi}>
            <nav className="app-nav-group">
              {group.map(item => (
                <a key={item.nav} className={`app-nav-item${item.nav === current ? " active" : ""}`} href={hrefFor(item.nav)} aria-current={item.nav === current ? "page" : undefined}>
                  <span className="app-nav-icon" dangerouslySetInnerHTML={{ __html: item.icon.replace(/^<span class="app-nav-icon">|<\/span>$/g, "") }} />
                  <span className="app-nav-label">{item.label}</span>
                </a>
              ))}
            </nav>
            {gi < SIDEBAR_GROUPS.length - 1 && <hr className="app-nav-divider" />}
          </div>
        ))}
      </div>
    </aside>
  );
}
