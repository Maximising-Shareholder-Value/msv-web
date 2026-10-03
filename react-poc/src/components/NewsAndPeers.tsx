// components/NewsAndPeers.tsx — recent company headlines and similar companies
// for the ticker page. Ports renderNews() and renderPeers() from script.js.
// Peers link to their own ticker pages.

import { useEffect, useState } from "react";
import { getCompanyNews, getPeers, type CompanyNewsItem } from "../lib/finnhub";

const timeAgo = (unixSeconds: number) => {
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

export function NewsAndPeers({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<CompanyNewsItem[] | null | undefined>(undefined);
  const [peers, setPeers] = useState<string[] | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setNews(undefined); setPeers(undefined);
    getCompanyNews(symbol).then(n => { if (live) setNews(n); });
    getPeers(symbol).then(p => { if (live) setPeers(p); });
    return () => { live = false; };
  }, [symbol]);

  return (
    <div className="news-peers">
      <div>
        <h5>Latest headlines</h5>
        {news === undefined && <p className="muted small">Loading…</p>}
        {news === null && <p className="muted small">Couldn't load headlines right now.</p>}
        {news && news.length === 0 && <p className="muted small">No recent headlines for {symbol}.</p>}
        {news && news.map((n, i) => (
          <a key={`${n.url}-${i}`} className="home-news-row" href={n.url} target="_blank" rel="noopener noreferrer">
            <strong>{n.headline}</strong>
            <span className="muted small">{n.source} · {timeAgo(n.datetime)}</span>
          </a>
        ))}
      </div>
      <div>
        <h5>Similar companies</h5>
        {peers === undefined && <p className="muted small">Loading…</p>}
        {peers && peers.length === 0 && <p className="muted small">No peers listed.</p>}
        {peers && peers.length > 0 && (
          <div className="recently-viewed-row">
            {peers.map(p => <a key={p} className="recently-viewed-chip" href={`/react-crypto/?page=ticker&symbol=${encodeURIComponent(p)}`}><strong>{p}</strong></a>)}
          </div>
        )}
      </div>
    </div>
  );
}
