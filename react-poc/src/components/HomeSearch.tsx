// components/HomeSearch.tsx — the search bar above "Markets today". A ticker symbol
// (AAPL, SPY, BRK.B, BINANCE:BTCUSDT) opens that ticker's page on submit, same as
// before. Any other text now also searches page titles/descriptions (the Explore
// directory) and Learn topics, shown as a dropdown to click or arrow through.

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { EXPLORE_DIRECTORY } from "../data/explore";
import { LEARN_CATEGORIES } from "../data/learn";
import { hrefFor as exploreHrefFor } from "./ExplorePage";

const EXAMPLES = ["AAPL", "MSFT", "SPY", "TLT"];

// Letters, digits, dots, colons and dashes: covers AAPL, BRK.B and BINANCE:BTCUSDT.
const TICKER_SHAPE = /^[A-Z0-9][A-Z0-9.:-]{0,19}$/;

interface Match { key: string; title: string; note: string; href: string }

function topicMatches(q: string): Match[] {
  const out: Match[] = [];
  for (const cat of LEARN_CATEGORIES) {
    for (const t of cat.topics) {
      if (`${t.title} ${t.oneLiner}`.toLowerCase().includes(q)) {
        out.push({ key: `learn-${t.id}`, title: t.title, note: `Learn · ${cat.title}`, href: `/app/?page=learn&topic=${t.id}` });
      }
    }
  }
  return out;
}

function pageMatches(q: string): Match[] {
  return EXPLORE_DIRECTORY
    .filter(item => item.live && `${item.title} ${item.description}`.toLowerCase().includes(q))
    .map(item => ({ key: `page-${item.nav}`, title: item.title, note: item.description, href: exploreHrefFor(item) }));
}

export function HomeSearch() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const q = text.trim().toLowerCase();
  const matches = useMemo(() => {
    if (q.length < 2) return [];
    return [...pageMatches(q), ...topicMatches(q)].slice(0, 8);
  }, [q]);

  useEffect(() => { setActive(0); }, [text]);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goTicker = () => {
    const symbol = text.trim().toUpperCase();
    if (!symbol) return;
    if (!TICKER_SHAPE.test(symbol)) {
      setError("Type a ticker symbol, like AAPL or SPY, or pick a page from the list below.");
      return;
    }
    location.href = `/app/?page=ticker&symbol=${encodeURIComponent(symbol)}`;
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (open && matches[active]) { location.href = matches[active].href; return; }
    goTicker();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || !matches.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => (i + 1) % matches.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => (i - 1 + matches.length) % matches.length); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="hp-search-wrap" ref={boxRef}>
      <form className="hp-search" role="search" onSubmit={submit}>
        <input
          type="search"
          value={text}
          onChange={e => { setText(e.target.value); setError(null); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a ticker, a page, or a topic — like AAPL, Sectors, or inflation"
          aria-label="Search a ticker, page or topic"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls="hp-search-results"
        />
        <button type="submit" className="hp-btn">Search</button>
        <span className="hp-search-examples muted small">
          Try:
          {EXAMPLES.map(s => <a key={s} href={`/app/?page=ticker&symbol=${s}`}>{s}</a>)}
        </span>
        {error && <span className="hp-search-error small" role="alert">{error}</span>}
      </form>
      {open && matches.length > 0 && (
        <ul className="hp-search-results" id="hp-search-results" role="listbox">
          {matches.map((m, i) => (
            <li key={m.key} role="option" aria-selected={i === active}>
              <a href={m.href} className={i === active ? "active" : ""} onMouseEnter={() => setActive(i)}>
                <strong>{m.title}</strong>
                <span className="muted small">{m.note}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
