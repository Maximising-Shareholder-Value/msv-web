import { useEffect } from "react";
import { coingecko, useAsync } from "../lib/api";
import { changeClass, fmtPct } from "../lib/format";
import type { NewsItem, TrendingResponse } from "../lib/types";
import { Loadable } from "./Loadable";
import { matchNews } from "./Movers";

export function Trending({ onSelect, news, onTrendingIds }: { onSelect: (id: string) => void; news: NewsItem[] | null; onTrendingIds?: (ids: string[]) => void }) {
  const state = useAsync(() => coingecko<TrendingResponse>("/search/trending"), []);
  // Reporting this up to the parent (for the movers' "trending" signal) is a
  // side effect, so it runs after render via useEffect — never during render
  // itself, which would mean one component's render triggering another's.
  useEffect(() => {
    if (state.data) onTrendingIds?.(state.data.coins.map(c => c.item.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data]);
  return (
    <div className="cr-box">
      <h4>Trending now <span className="card-subtitle">most searched on CoinGecko in the last 24h · linked to a matching headline where we found one</span></h4>
      <Loadable state={state} what="trending coins">
        {({ coins }) => (
          <div className="cr-trend">
            {coins.slice(0, 7).map(({ item }, i) => {
              const p = item.data?.price_change_percentage_24h?.usd;
              const article = matchNews({ name: item.name, symbol: item.symbol }, news);
              return (
                <div key={item.id} className="cr-trend-row-wrap">
                  <button type="button" className="cr-trend-row" onClick={() => onSelect(item.id)}>
                    <span className="cr-rank">{i + 1}</span>
                    <img src={item.thumb} alt="" width={22} height={22} />
                    <span className="cr-trend-name"><strong>{item.name}</strong><span className="muted">{item.symbol}{item.market_cap_rank ? ` · #${item.market_cap_rank}` : ""}</span></span>
                    <span className={changeClass(p)}>{fmtPct(p, 1)}</span>
                  </button>
                  {article && <a className="cr-trend-news" href={article.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>📰 {article.headline}</a>}
                </div>
              );
            })}
          </div>
        )}
      </Loadable>
    </div>
  );
}
