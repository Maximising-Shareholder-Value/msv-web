// components/PredictionMarketsPage.tsx — live odds from Polymarket (React). Ports
// predictionMarkets.js: tabs by topic, one card per market with its Yes/No odds,
// 24-hour volume and end date, each linking to the market on Polymarket. Polymarket
// is a real-money market, so these are what traders are betting, not forecasts.

import { useEffect, useState } from "react";
import { fmtCompact } from "../lib/format";

const POLY_BASE = "https://gamma-api.polymarket.com";
const TABS = [
  { id: "trending", label: "Trending", tagId: null },
  { id: "finance", label: "Finance", tagId: 120 },
  { id: "economy", label: "Economy & Fed", tagId: 100328 },
  { id: "crypto", label: "Crypto", tagId: 21 },
  { id: "business", label: "Business", tagId: 107 },
  { id: "politics", label: "Politics", tagId: 2 },
];

interface PolyMarket { question?: string; slug?: string; outcomes?: string; outcomePrices?: string; volume24hr?: number; endDate?: string }

async function fetchMarkets(tagId: number | null): Promise<PolyMarket[]> {
  const p = new URLSearchParams({ active: "true", closed: "false", limit: "24", order: "volume24hr", ascending: "false" });
  if (tagId) p.set("tag_id", String(tagId));  // tag_id works; tag_slug is silently ignored by the API
  const res = await fetch(`${POLY_BASE}/markets?${p.toString()}`);
  if (!res.ok) throw new Error(`Polymarket returned ${res.status}`);
  return res.json();
}

export function PredictionMarketsPage() {
  const [tab, setTab] = useState("finance");
  const [markets, setMarkets] = useState<PolyMarket[] | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const t = TABS.find(x => x.id === tab) ?? TABS[0];
    setMarkets(undefined); setError(null);
    fetchMarkets(t.tagId)
      .then(m => { if (live) setMarkets(m.filter(x => x.question)); })
      .catch(e => { if (live) { setError(e.message); setMarkets(null); } });
    return () => { live = false; };
  }, [tab]);

  return (
    <section className="poly-page">
      <header className="sectors-header">
        <h2>Prediction Markets</h2>
        <span className="muted small">Live odds from Polymarket</span>
      </header>
      <div className="home-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} className={t.id === tab ? "active" : ""} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      {markets === undefined && <p className="muted small">Loading live odds…</p>}
      {error && <p className="muted small">Couldn't load live odds right now ({error}). Try again shortly.</p>}
      {markets && markets.length === 0 && <p className="muted small">No active markets found for this category right now.</p>}
      {markets && markets.length > 0 && (
        <div className="poly-grid">{markets.map((m, i) => <PolyCard key={`${m.slug}-${i}`} m={m} />)}</div>
      )}
      <p className="muted small">Polymarket is a real-money prediction market. Prices reflect what traders are betting, not a forecast from this app. Not investment advice.</p>
    </section>
  );
}

function PolyCard({ m }: { m: PolyMarket }) {
  let outcomes: string[] = [], prices: number[] = [];
  try {
    outcomes = JSON.parse(m.outcomes || "[]");
    prices = JSON.parse(m.outcomePrices || "[]").map(Number);
  } catch { /* malformed odds for this market: show it without them */ }
  const yes = prices[0];
  const pct = typeof yes === "number" && Number.isFinite(yes) ? Math.round(yes * 100) : null;
  const url = m.slug ? `https://polymarket.com/event/${m.slug}` : "https://polymarket.com";
  const end = m.endDate ? new Date(m.endDate) : null;
  const endLabel = end && !isNaN(end.getTime()) ? end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  return (
    <a className="poly-card" href={url} target="_blank" rel="noopener noreferrer">
      <p className="poly-question">{m.question}</p>
      {pct !== null ? (
        <div className="poly-odds">
          <div className="poly-odds-bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="poly-odds-labels"><span className="poly-yes">{outcomes[0] || "Yes"} {pct}%</span><span className="poly-no">{outcomes[1] || "No"} {100 - pct}%</span></div>
        </div>
      ) : <p className="muted small">Odds unavailable</p>}
      <div className="poly-meta">
        <span>{fmtCompact(m.volume24hr ?? null, "$")} 24h vol</span>
        {endLabel && <span>Ends {endLabel}</span>}
      </div>
    </a>
  );
}
