// components/HomeLists.tsx — the homepage's personal lists and the how-to
// walkthrough. Recently viewed and the watchlist read the same browser-stored
// lists as the main site (lib/storage.ts), and removing from the watchlist
// writes back to them. Both are name-only chips: no live price, as on the
// vanilla page.

import { useState } from "react";
import { HOW_TO_SLIDES } from "../data/howTo";
import { readList, writeList, RECENTLY_VIEWED_KEY, WATCHLIST_KEY, type StoredTicker } from "../lib/storage";

function TickerChips({ title, emptyNote, storageKey, removable }: { title: string; emptyNote: string; storageKey: string; removable: boolean }) {
  const [list, setList] = useState<StoredTicker[]>(() => readList(storageKey));
  const remove = (symbol: string) => {
    const next = list.filter(t => t.symbol !== symbol);
    writeList(storageKey, next);
    setList(next);
  };
  return (
    <div className="home-chip-block">
      <h4>{title}</h4>
      {list.length === 0 ? <p className="muted small">{emptyNote}</p> : (
        <div className="recently-viewed-row">
          {list.map(t => (
            <span key={t.symbol} className={`recently-viewed-chip${removable ? " watchlist-chip" : ""}`}>
              <a href={`/?ticker=${encodeURIComponent(t.symbol)}`}><strong>{t.symbol}</strong> <span className="muted">{t.name}</span></a>
              {removable && <button type="button" className="watchlist-chip-remove" aria-label={`Remove ${t.symbol} from watchlist`} title="Remove" onClick={() => remove(t.symbol)}>×</button>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecentlyViewed() {
  return <TickerChips title="Recently viewed" emptyNote="Tickers you open will appear here." storageKey={RECENTLY_VIEWED_KEY} removable={false} />;
}

export function Watchlist() {
  return <TickerChips title="Watchlist" emptyNote="Star a ticker's page to add it here." storageKey={WATCHLIST_KEY} removable />;
}

export function HowTo() {
  const [index, setIndex] = useState(0);
  const slide = HOW_TO_SLIDES[index];
  return (
    <div className="how-to">
      <div className="how-to-slide">
        <span className="how-to-icon" aria-hidden="true">{slide.icon}</span>
        <h4>{slide.title}</h4>
        <p>{slide.body}</p>
      </div>
      <div className="how-to-nav">
        <button type="button" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>← Back</button>
        <span className="muted small">{index + 1} of {HOW_TO_SLIDES.length}</span>
        <button type="button" disabled={index === HOW_TO_SLIDES.length - 1} onClick={() => setIndex(i => i + 1)}>Next →</button>
      </div>
    </div>
  );
}
