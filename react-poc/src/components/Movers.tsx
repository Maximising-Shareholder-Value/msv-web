import { useMemo } from "react";
import { changeClass, fmtPct } from "../lib/format";
import type { Coin, NewsItem } from "../lib/types";

/**
 * "Why" isn't guessed — it's one of two honest things: a real news article
 * that actually mentions the coin (matched by name/symbol), or a plainly
 * labeled data observation (volume spike, trending) that correlates with
 * the move without claiming to be its cause.
 */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function matchNews(coin: { name: string; symbol: string }, news: NewsItem[] | null): NewsItem | null {
  if (!news) return null;
  const name = coin.name.toLowerCase();
  const symbol = coin.symbol.toLowerCase();
  // Word-boundary matching, not a plain substring search — a coin named
  // "Quant" would otherwise "match" any article mentioning "quantum"
  // (found live: a post-quantum-cryptography story), which is exactly the
  // kind of false "why" this feature exists to avoid.
  const nameRe = name.length >= 3 ? new RegExp(`\\b${escapeRegex(name)}\\b`) : null;
  const symbolRe = symbol.length >= 3 ? new RegExp(`\\b${escapeRegex(symbol)}\\b`) : null;
  if (!nameRe && !symbolRe) return null;
  return news.find(n => {
    const text = `${n.headline} ${n.summary}`.toLowerCase();
    return (nameRe && nameRe.test(text)) || (symbolRe && symbolRe.test(text));
  }) ?? null;
}

function signalFor(coin: Coin, coins: Coin[], trendingIds: Set<string>): string | null {
  const ratios = coins.filter(c => c.market_cap > 0).map(c => c.total_volume / c.market_cap).sort((a, b) => a - b);
  const median = ratios[Math.floor(ratios.length / 2)] || 0.05;
  const myRatio = coin.market_cap > 0 ? coin.total_volume / coin.market_cap : 0;
  const notes: string[] = [];
  if (myRatio > median * 3 && myRatio > 0.15) notes.push(`trading volume is ~${(myRatio / median).toFixed(0)}× the typical top-100 coin relative to its size`);
  if (trendingIds.has(coin.id)) notes.push("currently trending in CoinGecko search");
  const d24 = coin.price_change_percentage_24h_in_currency ?? 0;
  const d7 = coin.price_change_percentage_7d_in_currency ?? 0;
  if (Math.sign(d24) !== 0 && Math.sign(d24) !== Math.sign(d7) && Math.abs(d7) > 3) notes.push(`reversing a ${d7 >= 0 ? "positive" : "negative"} 7-day trend`);
  return notes.length ? notes.join(" · ") : null;
}

function MoverRow({ coin, coins, news, trendingIds, onSelect }: { coin: Coin; coins: Coin[]; news: NewsItem[] | null; trendingIds: Set<string>; onSelect: (id: string) => void }) {
  const article = matchNews(coin, news);
  const signal = signalFor(coin, coins, trendingIds);
  const pct = coin.price_change_percentage_24h_in_currency;
  return (
    <div className="mover-row">
      <button type="button" className="mover-head" onClick={() => onSelect(coin.id)}>
        <img src={coin.image} alt="" width={22} height={22} />
        <strong>{coin.name}</strong><span className="muted small">{coin.symbol.toUpperCase()}</span>
        <span className={`mover-pct ${changeClass(pct)}`}>{fmtPct(pct, 1)}</span>
      </button>
      {article ? (
        <a className="mover-why mover-why-news" href={article.url} target="_blank" rel="noopener noreferrer">
          📰 {article.headline}
        </a>
      ) : signal ? (
        <div className="mover-why">📊 {signal} — a data pattern, not a confirmed cause</div>
      ) : (
        <div className="mover-why muted">No matching headline or unusual pattern found — likely broad market movement.</div>
      )}
    </div>
  );
}

export function Movers({ coins, news, trendingIds, onSelect }: { coins: Coin[]; news: NewsItem[] | null; trendingIds: string[]; onSelect: (id: string) => void }) {
  const withChange = coins.filter(c => c.price_change_percentage_24h_in_currency != null);
  const gainers = [...withChange].sort((a, b) => b.price_change_percentage_24h_in_currency! - a.price_change_percentage_24h_in_currency!).slice(0, 5);
  const losers = [...withChange].sort((a, b) => a.price_change_percentage_24h_in_currency! - b.price_change_percentage_24h_in_currency!).slice(0, 5);
  const tset = useMemo(() => new Set(trendingIds), [trendingIds]);

  return (
    <div className="cr-row2">
      <div className="cr-box">
        <h4>Today's biggest gainers <span className="card-subtitle">top 100 · 24h · why, when we can tell</span></h4>
        {gainers.map(c => <MoverRow key={c.id} coin={c} coins={coins} news={news} trendingIds={tset} onSelect={onSelect} />)}
      </div>
      <div className="cr-box">
        <h4>Today's biggest losers <span className="card-subtitle">top 100 · 24h · why, when we can tell</span></h4>
        {losers.map(c => <MoverRow key={c.id} coin={c} coins={coins} news={news} trendingIds={tset} onSelect={onSelect} />)}
      </div>
    </div>
  );
}
