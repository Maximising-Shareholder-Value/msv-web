// components/HomeNews.tsx — market news on the homepage as compact, one-line links:
// a small picture, the headline on one line, then the source and time. Fifteen
// stories in three columns. Same Finnhub general feed as the News page. A story
// without a picture (or whose picture fails to load) gets a small coloured tile
// with the source's initial.

import { useEffect, useState } from "react";
import { getNews } from "../lib/finnhub";
import type { NewsItem } from "../lib/types";

const timeAgo = (unixSeconds: number) => {
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

function Thumb({ item }: { item: NewsItem }) {
  const [broken, setBroken] = useState(false);
  if (!item.image || broken) {
    return <span className="hp-news-thumb hp-news-fallback" aria-hidden="true">{item.source.charAt(0).toUpperCase()}</span>;
  }
  return <img className="hp-news-thumb" src={item.image} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

export function HomeNews() {
  const [items, setItems] = useState<NewsItem[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    getNews("general").then(n => { if (live) setItems(n); });
    return () => { live = false; };
  }, []);

  if (items === undefined) return <p className="muted small">Loading the latest headlines…</p>;
  if (items === null || !items.length) return <p className="muted small">Couldn't load market news right now.</p>;

  return (
    <ul className="hp-news-lines">
      {items.slice(0, 15).map((n, i) => (
        <li key={`${n.url}-${i}`}>
          <a className="hp-news-line" href={n.url} target="_blank" rel="noopener noreferrer">
            <Thumb item={n} />
            <span className="hp-news-line-text">
              <strong>{n.headline}</strong>
              <span className="muted small">{n.source} · {timeAgo(n.datetime)}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
