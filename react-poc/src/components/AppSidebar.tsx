// components/AppSidebar.tsx — the site's sidebar, drawn in React for the React
// pages. Same groups, labels and icons as the sidebar in index.html
// (data/sidebar.ts). Each item goes to its React page when one exists, and to
// the same route on the main site otherwise.
//
// The main site still has its own sidebar and router; this one only moves
// visitors around between pages built in React and the pages still on the
// main site.

import { useEffect, useState } from "react";
import { SIDEBAR_GROUPS } from "../data/sidebar";
import { usageNow } from "../lib/apiUsage";

// Items whose React page is built. Anything else opens on the main site.
const REACT_HREF: Record<string, string> = {
  home: "/app/?page=home",
  "explore-products": "/app/?page=explore",
  "stock-screener": "/app/?page=screener",
  "market-data": "/app/?page=market-data",
  "market-news": "/app/?page=news",
  learn: "/app/?page=learn",
  sectors: "/app/?page=sectors",
  "market-intelligence": "/app/?page=market-intel",
  etfs: "/app/?page=etfs",
  compare: "/app/?page=compare",
  "prediction-markets": "/app/?page=prediction-markets",
  "stock-analysis": "/app/?page=stock-analysis",
  watchlist: "/app/?page=watchlist",
  macro: "/app/?page=macro",
  "create-account": "/app/?page=placeholder&key=create-account",
  login: "/app/?page=placeholder&key=login",
  premium: "/app/?page=placeholder&key=premium",
  ai: "/app/?page=placeholder&key=ai",
  performance: "/app/?page=placeholder&key=performance",
  "portfolio-builder": "/app/?page=placeholder&key=portfolio-builder",
  "portfolio-health-check": "/app/?page=placeholder&key=portfolio-health-check",
  crypto: "/app/",
  "bitcoin-cycles": "/app/?tab=cycles",
  "crypto-news": "/app/?tab=news",
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
        <ApiUsage />
      </div>
    </aside>
  );
}

// The data-usage panel from the main site's sidebar: how many requests this tab has
// made to each provider, against the free-tier limits. An estimate, per tab.
function ApiUsage() {
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 2000); return () => clearInterval(id); }, []);
  return (
    <div className="api-usage-panel">
      <div className="api-usage-title">API usage <span className="muted">(est., this tab)</span></div>
      {usageNow().map(row => (
        <div key={row.key + row.per} className="api-usage-line">
          <span>{row.label}</span>
          <span className="muted">{row.limit ? `${row.count} / ${row.limit} ${row.per}` : `${row.count}/min`}</span>
          {row.limit && <span className="api-usage-bar"><i className={row.count / row.limit > 0.8 ? "hot" : ""} style={{ width: `${Math.min(100, (row.count / row.limit) * 100)}%` }} /></span>}
        </div>
      ))}
    </div>
  );
}
