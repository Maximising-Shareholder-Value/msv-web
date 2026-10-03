// components/ExplorePage.tsx — the Explore directory. Ports showExploreProducts()
// from home.js: every page the app offers, grouped into categories, with
// "Coming soon" tiles for pages not built yet.
//
// A tile goes to its React page when one exists; otherwise it goes to the same
// route on the main site, which the vanilla router still handles.

import { EXPLORE_DIRECTORY, EXPLORE_CATEGORIES, type ExploreItem } from "../data/explore";

// Pages that have a React version, and the ?page= value each one uses.
const REACT_PAGES: Record<string, string> = {
  home: "home",
  sectors: "sectors",
  etfs: "etfs",
  "stock-screener": "screener",
  "market-news": "news",
  "market-data": "market-data",
  "market-intelligence": "market-intel",
  learn: "learn",
};

function hrefFor(item: ExploreItem): string {
  const page = REACT_PAGES[item.nav];
  if (page) return `/react-crypto/?page=${page}`;
  return `/${item.nav}`;
}

export function ExplorePage() {
  const byNav = new Map(EXPLORE_DIRECTORY.map(item => [item.nav, item]));
  return (
    <section className="explore-page">
      <header className="sectors-header">
        <h2>Explore $MSV</h2>
        <span className="muted small">Everything this app offers in one place, including what's still on the way</span>
      </header>
      {EXPLORE_CATEGORIES.map(cat => (
        <div key={cat.title} className="explore-category">
          <h3 className="explore-category-title">{cat.title}</h3>
          <div className="explore-grid">
            {cat.items.map(navKey => {
              const item = byNav.get(navKey);
              if (!item) return null;
              const inner = (
                <>
                  <strong>{item.title}</strong>
                  {!item.live && <span className="explore-tile-badge">Coming soon</span>}
                  <span className="explore-tile-desc">{item.description}</span>
                </>
              );
              return item.live
                ? <a key={navKey} className="explore-tile" href={hrefFor(item)}>{inner}</a>
                : <div key={navKey} className="explore-tile soon" aria-disabled="true">{inner}</div>;
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
