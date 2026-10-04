// components/SiteFooter.tsx — the site footer on the homepage: logo, social links,
// a short sitemap, and a legal ribbon underneath.
// PLACEHOLDER: every link, social button and the copyright line is a stand-in.
// Their targets are "#" until the real pages and accounts exist.

const SOCIALS = [
  { label: "X", glyph: "X" },
  { label: "LinkedIn", glyph: "in" },
  { label: "YouTube", glyph: "▶" },
  { label: "Instagram", glyph: "IG" },
  { label: "Reddit", glyph: "r/" },
  { label: "GitHub", glyph: "GH" },
];

const SITEMAP: { title: string; links: string[] }[] = [
  { title: "Markets", links: ["Markets today", "Global markets", "Market news", "Sectors", "ETFs", "Crypto"] },
  { title: "Tools", links: ["Stock Analysis", "Screener", "Compare", "Market Data", "Prediction Markets", "Ask $MSV AI Anaiyst"] },
  { title: "Learn", links: ["Learn", "How to use $MSV", "Explore products", "Economic calendar", "Market Intelligence"] },
  { title: "Company", links: ["About us", "Contact us", "Subscription", "Support", "Roadmap"] },
];

const LEGAL = [
  "Terms of Service",
  "Contact us",
  "About us",
  "Subscription",
  "Support",
  "Terms of Use",
  "Privacy",
  "Sources",
  "Disclaimers",
];

export function SiteFooter() {
  return (
    <footer className="ft">
      <div className="ft-main">
        <div className="ft-brand">
          {/* The same logo lockup as the sidebar's, so the brand matches everywhere. */}
          <div className="app-sidebar-logo ft-logo-lockup">
            <span className="app-sidebar-badge">$MSV</span>
            <span className="app-sidebar-fullname"><span>Maximising</span><span>Shareholder</span><span className="app-sidebar-fullname-accent">Value</span></span>
          </div>
          <p className="muted small">A plain-English market dashboard for stocks, ETFs, sectors, crypto and the economy. Not investment advice.</p>
          <ul className="ft-socials" aria-label="Social media">
            {SOCIALS.map(s => (
              <li key={s.label}><a href="#" aria-label={s.label} title={s.label}>{s.glyph}</a></li>
            ))}
          </ul>
        </div>
        <nav className="ft-sitemap" aria-label="Sitemap">
          {SITEMAP.map(col => (
            <div key={col.title} className="ft-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(link => <li key={link}><a href="#">{link}</a></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="ft-legal">
        <ul>
          {LEGAL.map(item => <li key={item}><a href="#">{item}</a></li>)}
        </ul>
        <span className="muted small">© 2026 $MSV. All rights reserved.</span>
      </div>
    </footer>
  );
}
