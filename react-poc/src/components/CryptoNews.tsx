import type { AsyncState } from "../lib/api";
import type { NewsItem } from "../lib/types";
import { Loadable } from "./Loadable";

const timeAgo = (unixSeconds: number) => {
  const mins = Math.max(0, Math.round((Date.now() - unixSeconds * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

function NewsFeed({ state }: { state: AsyncState<NewsItem[]> }) {
  return (
    <div className="card-inner">
      <h4>Latest crypto news <span className="card-subtitle">Finnhub news wire · real articles, updated live</span></h4>
      <Loadable state={state} what="news">
        {items => (
          <div className="news-list">
            {items.slice(0, 20).map((n, i) => (
              <a key={n.url + i} className="news-row" href={n.url} target="_blank" rel="noopener noreferrer">
                {n.image ? <img src={n.image} alt="" className="news-thumb" loading="lazy" /> : <span className="news-thumb news-thumb-blank" />}
                <span className="news-body">
                  <strong>{n.headline}</strong>
                  <span className="news-meta">{n.source} · {timeAgo(n.datetime)}</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </Loadable>
    </div>
  );
}

// Curated, dated, hand-checked reference — not a live feed. Facts and links
// verified 2026-09-27; this space moves fast, so treat dates as "as of"
// rather than current-forever.
const TRACKER: { date: string; title: string; body: string; url: string }[] = [
  {
    date: "2026-09-15", title: "US market-structure bill (CLARITY Act) stalls in the Senate",
    body: "A cloture vote failed 49–50 (11 short of the 60 needed), so the Senate never reached debate on the bill's contents. It had passed the House in July 2025 (294–134) and would split crypto oversight between the SEC and CFTC with a clear commodity-vs-security test. Comprehensive passage is now considered unlikely before 2027.",
    url: "https://www.cnbc.com/2026/09/01/crypto-enters-september-with-policy-gamble-hanging-by-a-thread.html",
  },
  {
    date: "2026-07-01", title: "EU's MiCA transition window closes",
    body: "The EU's single crypto rulebook (Markets in Crypto-Assets) had let existing firms keep operating under old national permissions during a grandfathering period. That window closed, so crypto firms now need full MiCA authorization to operate across the EU.",
    url: "https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica",
  },
  {
    date: "2026 (ongoing)", title: "GENIUS Act (US stablecoin law) moving through implementation",
    body: "The US's first federal stablecoin statute requires regulators to issue implementing rules; the OCC, FDIC and Treasury have all published proposed rules in 2026. The law takes effect January 18, 2027, or 120 days after final rules, whichever is earlier.",
    url: "https://www.federalregister.gov/documents/2026/08/18/2026-16796/genius-act-regulations-on-payment-stablecoin-issuance-offer-and-sale",
  },
  {
    date: "2026", title: "UAE and Hong Kong consolidate as crypto hubs",
    body: "Dubai and Abu Dhabi's VARA (Virtual Assets Regulatory Authority) — a dedicated, tech-first regulator separate from traditional finance — has made the UAE a leading jurisdiction for crypto firms. Hong Kong has similarly built out its own licensing regime and reasserted itself as a major hub in the region.",
    url: "https://www.kucoin.com/blog/en-the-12-global-leaders-in-crypto-adoption-and-regulation-for-2026",
  },
  {
    date: "2026", title: "Stablecoins move to the center of global regulation",
    body: "Twelve G20 economies now address stablecoins through existing or proposed legislation, a sharp rise from a few years ago — stablecoins have gone from a niche DeFi tool to a mainstream regulatory priority worldwide.",
    url: "https://www.kucoin.com/blog/en-the-12-global-leaders-in-crypto-adoption-and-regulation-for-2026",
  },
  {
    date: "2026", title: "Legal status varies sharply by country",
    body: "Per one widely cited industry tracker covering 75 countries, crypto is legal in 45 of them, partially restricted in 20, and generally banned in 10 — regulation remains a patchwork, not a global standard.",
    url: "https://coinlaw.io/crypto-regulation-by-country-statistics/",
  },
];

function AdoptionTracker() {
  return (
    <div className="card-inner">
      <h4>Regulation &amp; adoption tracker <span className="card-subtitle">curated, hand-checked reference — not a live feed — verified 2026-09-27</span></h4>
      <div className="tracker-list">
        {TRACKER.map(t => (
          <a key={t.title} className="tracker-row" href={t.url} target="_blank" rel="noopener noreferrer">
            <span className="tracker-date">{t.date}</span>
            <span className="tracker-body"><strong>{t.title}</strong><span>{t.body}</span></span>
          </a>
        ))}
      </div>
      <p className="muted small">This list is a snapshot, not exhaustive — crypto policy moves fast across ~190 countries. Each row links to a real source; check the date before treating anything here as current.</p>
    </div>
  );
}

export function CryptoNews({ news }: { news: AsyncState<NewsItem[]> }) {
  return (
    <>
      <AdoptionTracker />
      <NewsFeed state={news} />
    </>
  );
}
