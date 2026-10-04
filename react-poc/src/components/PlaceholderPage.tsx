// components/PlaceholderPage.tsx — the "Coming soon" pages (create account, login,
// performance, premium, portfolio tools and the rest). Shows the same icon, title
// and description as the main site's placeholder pages (data/placeholders.ts).

import { PLACEHOLDER_INFO } from "../data/placeholders";

export function PlaceholderPage({ pageKey }: { pageKey: string }) {
  const info = PLACEHOLDER_INFO[pageKey];
  if (!info) return <section className="placeholder-page"><p className="muted">That page doesn't exist yet.</p></section>;
  return (
    <section className="placeholder-page">
      <div className="card placeholder-card">
        {/* Icons are static strings from data/placeholders.ts: an emoji or a small inline SVG. */}
        <span className="placeholder-icon" dangerouslySetInnerHTML={{ __html: info.icon }} />
        <span className="placeholder-badge">Coming soon</span>
        <h2>{info.title}</h2>
        <p>{info.description}</p>
        {info.includes && (
          <>
            <h3 className="placeholder-includes-title">What it will include</h3>
            <ul className="placeholder-includes">
              {info.includes.map(item => <li key={item}>{item}</li>)}
            </ul>
          </>
        )}
        <a className="placeholder-home-btn" href="/app/?page=home">← Back to Home</a>
      </div>
    </section>
  );
}
