// lib/useQuotes.ts — live prices for a list of tickers, filled in as they
// arrive. Every request goes through the shared queue in lib/finnhub.ts, so
// a long list fills in gradually and stays under Finnhub's free-tier limit.

import { useEffect, useState } from "react";
import { getQuote, type Quote } from "./finnhub";

export type QuoteMap = Record<string, Quote | null | undefined>;

export function useQuotes(symbols: string[]): QuoteMap {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const key = symbols.join(",");

  useEffect(() => {
    let live = true;
    key.split(",").filter(Boolean).forEach(symbol => {
      getQuote(symbol).then(q => { if (live) setQuotes(prev => ({ ...prev, [symbol]: q })); });
    });
    return () => { live = false; };
  }, [key]);

  return quotes;
}
