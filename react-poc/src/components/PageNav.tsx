// components/PageNav.tsx — the strip of links shared by the React pages that
// sit beside the main $MSV site (Sectors, IPO calendar, News). Each one is a
// ?page= value handled in main.tsx.

const LINKS: { page: string; label: string }[] = [
  { page: "sectors", label: "Sectors" },
  { page: "etfs", label: "ETFs" },
  { page: "screener", label: "Screener" },
  { page: "market-data", label: "Market data" },
  { page: "market-intel", label: "Market intelligence" },
  { page: "learn", label: "Learn" },
  { page: "explore", label: "Explore" },
  { page: "ipo", label: "IPO calendar" },
  { page: "news", label: "Market news" },
];

export function PageNav({ current }: { current: string }) {
  return (
    <nav className="react-page-nav" aria-label="Pages">
      <a href="/" className="react-page-nav-back">← Back to $MSV</a>
      {LINKS.map(l => (
        <a key={l.page} href={`/app/?page=${l.page}`} className={l.page === current ? "active" : ""} aria-current={l.page === current ? "page" : undefined}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}
