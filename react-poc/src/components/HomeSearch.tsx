// components/HomeSearch.tsx — the search bar above "Markets today".
// For now it searches tickers only: type a symbol such as AAPL or SPY and it
// opens that ticker's page. Searching topics and pages isn't built yet.

import { useState, type FormEvent } from "react";

const EXAMPLES = ["AAPL", "MSFT", "SPY", "TLT"];

// Letters, digits, dots, colons and dashes: covers AAPL, BRK.B and BINANCE:BTCUSDT.
const TICKER_SHAPE = /^[A-Z0-9][A-Z0-9.:-]{0,19}$/;

export function HomeSearch() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const symbol = text.trim().toUpperCase();
    if (!symbol) return;
    if (!TICKER_SHAPE.test(symbol)) {
      setError("Type a ticker symbol, like AAPL or SPY.");
      return;
    }
    location.href = `/app/?page=ticker&symbol=${encodeURIComponent(symbol)}`;
  };

  return (
    <form className="hp-search" role="search" onSubmit={submit}>
      <input
        type="search"
        value={text}
        onChange={e => { setText(e.target.value); setError(null); }}
        placeholder="Search a ticker, like AAPL or SPY"
        aria-label="Search a ticker"
        autoComplete="off"
      />
      <button type="submit" className="hp-btn">Search</button>
      <span className="hp-search-examples muted small">
        Try:
        {EXAMPLES.map(s => <a key={s} href={`/app/?page=ticker&symbol=${s}`}>{s}</a>)}
      </span>
      {error && <span className="hp-search-error small" role="alert">{error}</span>}
    </form>
  );
}
