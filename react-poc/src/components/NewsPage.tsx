// components/NewsPage.tsx — market news, widened from the crypto-only feed.
// Four Finnhub categories (general, mergers, crypto, forex) and a search box.
// Each category is one request, cached for 5 minutes in lib/finnhub.ts.

import { useState } from "react";
import { getNews } from "../lib/finnhub";
import { useAsync } from "../lib/api";
import { Loadable } from "./Loadable";

const CATEGORIES: { id: string; label: string; blurb: string }[] = [
  { id: "general", label: "All market news", blurb: "Top stories across markets" },
  { id: "merger", label: "Mergers & deals", blurb: "Acquisitions, mergers and related regulatory filings" },
  { id: "crypto", label: "Crypto", blurb: "Digital assets, exchanges and regulation" },
  { id: "forex", label: "Forex", blurb: "Currencies and FX market wraps (Finnhub's forex feed is thin, so this list is often short)" },
];

const timeAgo = (unixSeconds: number) => {
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

export function NewsPage() {
  const [category, setCategory] = useState("general");
  const [query, setQuery] = useState("");
  const news = useAsync(async () => {
    const items = await getNews(category);
    if (items === null) throw new Error("the news feed didn't respond — rate limit or a temporary outage");
    return items;
  }, [category]);

  const current = CATEGORIES.find(c => c.id === category)!;
  const q = query.trim().toLowerCase();

  return (
    <section className="news-page">
      <header className="sectors-header">
        <h2>Market News</h2>
        <span className="muted small">Finnhub news wire · real articles, linked to their source</span>
      </header>

      <div className="news-toolbar">
        <div className="sectors-view-toggle" role="group" aria-label="News category">
          {CATEGORIES.map(c => (
            <button key={c.id} type="button" className={c.id === category ? "active" : ""} onClick={() => setCategory(c.id)}>{c.label}</button>
          ))}
        </div>
        <input
          type="search"
          className="news-search"
          placeholder="Filter headlines, sources…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Filter news"
        />
      </div>
      <p className="muted small">{current.blurb}</p>

      <Loadable state={news} what="market news">
        {items => {
          const shown = items.filter(n => !q || `${n.headline} ${n.summary} ${n.source}`.toLowerCase().includes(q));
          if (!shown.length) return <p className="muted small">{q ? "No headlines match that filter." : "No headlines in this category right now."}</p>;
          return (
            <div className="news-list">
              {shown.slice(0, 60).map((n, i) => (
                <a key={`${n.url}-${i}`} className="news-row" href={n.url} target="_blank" rel="noopener noreferrer">
                  {n.image ? <img src={n.image} alt="" className="news-thumb" loading="lazy" /> : <span className="news-thumb news-thumb-blank" />}
                  <span className="news-body">
                    <strong>{n.headline}</strong>
                    {n.summary && !n.summary.toLowerCase().startsWith(n.headline.toLowerCase().slice(0, 40)) && <span className="news-summary">{n.summary.length > 220 ? `${n.summary.slice(0, 220)}…` : n.summary}</span>}
                    <span className="news-meta">{n.source} · {timeAgo(n.datetime)}</span>
                  </span>
                </a>
              ))}
            </div>
          );
        }}
      </Loadable>
    </section>
  );
}
