// components/HomeMore.tsx — the rest of the homepage's data pieces: the market
// breadth strip (from the static index sample, as on the vanilla page), the
// earnings calendar (one Finnhub call, filtered to companies the app knows or
// large reporters) and the Crypto tab (one CoinGecko call).

import { useEffect, useState } from "react";
import { MARKET_TICKERS, MARKET_TICKERS_SAMPLE } from "../data/homeWidgets";
import { COUNTRY_LIST, type Country } from "../lib/markets";
import { RANKING_STOCK_SYMBOLS, BROWSE_CATEGORIES } from "../data/home";
import { getEarnings, type EarningsItem } from "../lib/finnhub";
import { getCoinMarkets, type CoinMarket } from "../lib/coingecko";
import { fmtCompact, fmtPrice } from "../lib/format";

// The thirteen exchanges the vanilla breadth line considers (ORIGINAL_13 in worldMarkets.js).
const BREADTH_EXCHANGES = ["US", "CA", "BR", "GB", "FR", "DE", "ZA", "IN", "SG", "CN", "HK", "JP", "AU"];

/** The exchange that opens or closes soonest, and how long until then. */
export function nextMarketEvent(now = new Date()): { c: Country; label: "opens" | "closes"; diffMin: number } | null {
  const minutesOfDay = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const events = COUNTRY_LIST.filter(c => BREADTH_EXCHANGES.includes(c.iso2) && c.open && c.close && c.tz).map(c => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" }).formatToParts(now);
    const map: Record<string, string> = {};
    parts.forEach(p => { map[p.type] = p.value; });
    const hhmm = `${map.hour === "24" ? "00" : map.hour}:${map.minute}`;
    const dayIdx = dayOrder.indexOf(map.weekday);
    const isWeekday = dayIdx >= 1 && dayIdx <= 5;
    const nowMin = minutesOfDay(hhmm), openMin = minutesOfDay(c.open!), closeMin = minutesOfDay(c.close!);
    const isOpen = isWeekday && nowMin >= openMin && nowMin <= closeMin;
    if (isOpen) return { c, label: "closes" as const, diffMin: closeMin - nowMin };
    let offset = 1, idx = (dayIdx + 1) % 7;
    while (idx === 0 || idx === 6) { offset++; idx = (idx + 1) % 7; }
    const diffMin = isWeekday && nowMin < openMin ? openMin - nowMin : offset * 1440 - nowMin + openMin;
    return { c, label: "opens" as const, diffMin };
  });
  events.sort((a, b) => a.diffMin - b.diffMin);
  return events[0] ?? null;
}

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
};

export function MarketBreadth() {
  const results = MARKET_TICKERS.map(([symbol, name]) => {
    const q = (MARKET_TICKERS_SAMPLE as Record<string, { c: number; dp?: number }>)[symbol];
    return q ? { symbol, name, dp: q.dp ?? 0 } : null;
  }).filter((r): r is { symbol: string; name: string; dp: number } => r !== null);
  if (!results.length) return null;

  const up = results.filter(r => r.dp > 0).length;
  const down = results.filter(r => r.dp < 0).length;
  const upPct = (up / results.length) * 100;
  const sorted = [...results].sort((a, b) => b.dp - a.dp);
  const best = sorted[0], worst = sorted[sorted.length - 1];
  const next = nextMarketEvent();

  return (
    <div className="market-breadth">
      <div className="market-breadth-bar" title={`${up} up · ${down} down · out of ${results.length} tracked global tickers`}>
        <div className="market-breadth-fill" style={{ width: `${upPct}%` }} />
      </div>
      <div className="market-breadth-stats">
        <span><strong className="positive">{up}</strong> up · <strong className="negative">{down}</strong> down <span className="muted">(of {results.length} tracked)</span></span>
        <span className="muted">Best: <strong className="positive">{best.name} {best.dp >= 0 ? "+" : ""}{best.dp.toFixed(1)}%</strong> · Worst: <strong className="negative">{worst.name} {worst.dp.toFixed(1)}%</strong></span>
        {next && <span className="muted">Next: <strong>{next.c.city} {next.label}</strong> in {formatDuration(next.diffMin)}</span>}
      </div>
    </div>
  );
}

const KNOWN_NAMES: Record<string, string> = Object.fromEntries([
  ...RANKING_STOCK_SYMBOLS,
  ...BROWSE_CATEGORIES.flatMap(c => c.items),
]);

export function EarningsCalendar() {
  const [items, setItems] = useState<EarningsItem[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    getEarnings().then(d => { if (live) setItems(d); });
    return () => { live = false; };
  }, []);

  if (items === undefined) return <p className="muted small">Loading…</p>;
  if (items === null) return <p className="muted">Couldn't load the earnings calendar right now.</p>;

  const list = items
    .filter(i => KNOWN_NAMES[i.symbol] || (typeof i.revenueEstimate === "number" && i.revenueEstimate >= 5e9))
    .sort((a, b) => a.date.localeCompare(b.date) || (b.revenueEstimate ?? 0) - (a.revenueEstimate ?? 0))
    .slice(0, 40);
  if (!list.length) return <p className="muted">No well-known companies reporting in the next 7 days.</p>;

  return (
    <>
      <div className="calendar-scroll">
        {list.map((item, i) => {
          const d = new Date(`${item.date}T12:00:00Z`);
          const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
          const weekday = d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
          const hour = item.hour === "bmo" ? "Before open" : item.hour === "amc" ? "After close" : "";
          const est = [
            typeof item.epsEstimate === "number" ? `EPS est. $${item.epsEstimate.toFixed(2)}` : null,
            typeof item.revenueEstimate === "number" ? `Rev est. ${fmtCompact(item.revenueEstimate, "$")}` : null,
          ].filter(Boolean).join(" · ");
          return (
            <div key={`${item.symbol}-${i}`} className="earnings-calendar-row">
              <a className="earnings-calendar-main" href={`/?ticker=${encodeURIComponent(item.symbol)}`}>
                <span className="econ-calendar-date">{dateLabel}<span className="econ-calendar-dow">{weekday}{hour ? ` · ${hour}` : ""}</span></span>
                <span className="earnings-calendar-name"><strong>{KNOWN_NAMES[item.symbol] || item.symbol}</strong><span className="muted">{item.symbol}{est ? ` · ${est}` : ""}</span></span>
              </a>
              <a className="econ-calendar-out" href={`https://www.nasdaq.com/market-activity/stocks/${item.symbol.toLowerCase()}/earnings`} target="_blank" rel="noopener noreferrer" title={`Open ${item.symbol} earnings on Nasdaq`}>↗</a>
            </div>
          );
        })}
      </div>
      <p className="muted small calendar-foot">{list.length} companies reporting in the next 7 days. Tap a row for the stock page, ↗ for Nasdaq's earnings detail.</p>
    </>
  );
}

export function CryptoTable() {
  const [coins, setCoins] = useState<CoinMarket[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    getCoinMarkets().then(c => { if (live) setCoins(c); });
    return () => { live = false; };
  }, []);

  if (coins === undefined) return <p className="muted">Loading live crypto prices…</p>;
  if (coins === null) return <p className="muted">No crypto data right now. Try again in a moment.</p>;

  const order = [...coins].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
  return (
    <>
      <div className="crypto-table-scroll">
        <table className="crypto-table">
          <thead><tr><th>Coin</th><th>Price</th><th>24h</th><th>Market cap</th><th>24h volume</th><th>Circulating supply</th><th>From all-time high</th></tr></thead>
          <tbody>
            {order.map(c => {
              const dp = c.price_change_percentage_24h ?? 0;
              const ath = c.ath_change_percentage;
              const supplyPct = c.circulating_supply && c.max_supply ? (c.circulating_supply / c.max_supply) * 100 : null;
              const display = (CRYPTO_NAME[c.id] ?? c.id);
              return (
                <tr key={c.id} className="crypto-table-row">
                  <td><strong>{display}</strong> <span className="muted small">{c.symbol.toUpperCase()}</span></td>
                  <td>{fmtPrice(c.current_price)}</td>
                  <td className={dp >= 0 ? "positive" : "negative"}>{dp >= 0 ? "+" : ""}{dp.toFixed(2)}%</td>
                  <td>{c.market_cap ? `$${fmtCompact(c.market_cap)}` : "—"}{c.market_cap_rank ? <span className="muted small"> #{c.market_cap_rank}</span> : null}</td>
                  <td>{c.total_volume ? `$${fmtCompact(c.total_volume)}` : "—"}</td>
                  <td>{c.circulating_supply ? fmtCompact(c.circulating_supply) : "—"}{supplyPct !== null ? <span className="muted small"> ({supplyPct.toFixed(0)}% of max)</span> : null}</td>
                  <td className={ath !== null && ath >= -1 ? "positive" : ""}>{ath !== null ? `${ath.toFixed(1)}%` : "N/A"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small home-note">Market cap, volume, supply and all-time-high data via CoinGecko. “From all-time high” shows how far below (or, rarely, above) each coin's record price it's trading.</p>
    </>
  );
}

const CRYPTO_NAME: Record<string, string> = { bitcoin: "Bitcoin", ethereum: "Ethereum", solana: "Solana", ripple: "XRP", dogecoin: "Dogecoin", cardano: "Cardano" };
