// components/ExplorePage.tsx — the Explore directory, in the main site's own markup
// and styles: each tile shows the same icon as its sidebar item, with a fallback icon
// for pages that have none, and a "Coming soon" badge for pages not built yet.

import { EXPLORE_DIRECTORY, EXPLORE_CATEGORIES, EXPLORE_ICON_FALLBACKS, DEFAULT_EXPLORE_ICON, type ExploreItem } from "../data/explore";
import { SIDEBAR_GROUPS } from "../data/sidebar";

// Pages that have a React version, and the ?page= value each one uses.
const REACT_PAGES: Record<string, string> = {
  home: "home", sectors: "sectors", etfs: "etfs", "stock-screener": "screener",
  "market-news": "news", "market-data": "market-data", "market-intelligence": "market-intel",
  learn: "learn", macro: "macro", "prediction-markets": "prediction-markets", compare: "compare",
  ipo: "ipo", "explore-products": "explore",
};

export function hrefFor(item: ExploreItem): string {
  const page = REACT_PAGES[item.nav];
  if (page) return `/app/?page=${page}`;
  return `/${item.nav}`;
}

const SIDEBAR_ICONS: Record<string, string> = Object.fromEntries(
  SIDEBAR_GROUPS.flat().map(i => [i.nav, i.icon]),
);

/** The tile's icon: the sidebar icon for its page (or the one it borrows), else a fallback. */
export function iconHtml(item: ExploreItem): string {
  const sidebar = SIDEBAR_ICONS[item.icon ?? item.nav];
  if (sidebar) return sidebar;
  const inner = EXPLORE_ICON_FALLBACKS[item.nav] ?? DEFAULT_EXPLORE_ICON;
  return `<span class="app-nav-icon"><svg viewBox="0 0 20 20">${inner}</svg></span>`;
}

/** One Explore tile, in the main site's markup. */
export function ExploreTile({ item }: { item: ExploreItem }) {
  const inner = (
    <>
      <span className="explore-icon-slot" style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: iconHtml(item) }} />
      <strong>{item.title}</strong>
      {!item.live && <span className="explore-tile-badge">Coming soon</span>}
      <span className="explore-tile-desc">{item.description}</span>
    </>
  );
  return item.live
    ? <a className="explore-tile" href={hrefFor(item)}>{inner}</a>
    : <div className="explore-tile soon">{inner}</div>;
}

export function ExplorePage() {
  return (
    <div className="card">
      <h2>Explore $MSV</h2>
      <p className="muted">Everything this app offers, in one place — including what's still on the way.</p>
      {EXPLORE_CATEGORIES.map(cat => {
        const items = cat.items.map(nav => EXPLORE_DIRECTORY.find(e => e.nav === nav)).filter((e): e is ExploreItem => !!e);
        if (!items.length) return null;
        return (
          <div key={cat.title} className="explore-category">
            <h3 className="explore-category-title">{cat.title}</h3>
            <div className="explore-grid">
              {items.map(item => <ExploreTile key={item.nav} item={item} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
