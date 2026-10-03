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
        <span className="placeholder-icon">{info.icon}</span>
        <span className="placeholder-badge">Coming soon</span>
        <h2>{info.title}</h2>
        <p>{info.description}</p>
        <a className="placeholder-home-btn" href="/app/?page=home">← Back to Home</a>
      </div>
    </section>
  );
}
