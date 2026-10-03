// components/HomeWidgets.tsx — the homepage's side widgets, React: the index
// strip (a static snapshot, as on the vanilla page; clicking a country opens its
// Market Data profile), the sector heatmap (live tracking-ETF moves), the
// forex strip (Twelve Data) and the economic calendar (hand-maintained dates,
// each linking to its official schedule).

import { useEffect, useState } from "react";
import { MARKET_TICKERS, MARKET_TICKERS_SAMPLE, SECTOR_ETFS, FOREX_PAIRS, ECON_SOURCES, ECON_CALENDAR_EVENTS } from "../data/homeWidgets";
import { COUNTRY_LIST } from "../lib/markets";
import { getQuote, type Quote } from "../lib/finnhub";
import { getForexQuotes, type ForexQuote } from "../lib/twelveData";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";

function chipValue(text: string | null, pct: number | null) {
  if (text === null) return { cls: "muted", value: "···" };
  if (pct === null || !Number.isFinite(pct)) return { cls: "muted", value: text };
  return { cls: pct >= 0 ? "positive" : "negative", value: `${text} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)` };
}

export function IndexStrip() {
  return (
    <div className="index-strip">
      {MARKET_TICKERS.map(([symbol, name, flag]) => {
        const q = (MARKET_TICKERS_SAMPLE as Record<string, { c: number; dp?: number }>)[symbol];
        const v = chipValue(q ? fmtPrice(q.c) : null, q ? (q.dp ?? 0) : null);
        const country = COUNTRY_LIST.find(c => c.etf === symbol);
        const href = country ? `/react-crypto/?page=market-data&country=${country.iso2}` : `/?ticker=${encodeURIComponent(symbol)}`;
        return (
          <a key={symbol} className="index-chip" href={href}>
            <span className="index-chip-name">{flag ? `${flag} ` : ""}{name}</span>
            <span className={`index-chip-value ${v.cls}`}>{v.value}</span>
          </a>
        );
      })}
    </div>
  );
}

export function SectorHeatmap() {
  const [quotes, setQuotes] = useState<Record<string, Quote | null | undefined>>({});
  useEffect(() => {
    let live = true;
    SECTOR_ETFS.forEach(([symbol]) => {
      getQuote(symbol).then(q => { if (live) setQuotes(prev => ({ ...prev, [symbol]: q })); });
    });
    return () => { live = false; };
  }, []);
  return (
    <div className="sector-heat">
      {SECTOR_ETFS.map(([symbol, name]) => {
        const q = quotes[symbol];
        const dp = q?.dp ?? null;
        const strength = dp === null ? 0 : Math.min(Math.abs(dp) / 3, 1) * 0.5 + 0.1;
        const bg = dp === null ? "var(--surface-2, #1a2430)" : dp >= 0 ? `rgba(16,185,129,${strength.toFixed(2)})` : `rgba(239,68,68,${strength.toFixed(2)})`;
        return (
          <a key={symbol} className="sector-heat-tile" href={`/react-crypto/?page=sectors&sector=${symbol}`} style={{ background: bg }}>
            <span>{name}</span>
            <strong className={changeClass(dp)}>{q === undefined ? "…" : q ? fmtPct(dp) : "—"}</strong>
          </a>
        );
      })}
    </div>
  );
}

export function ForexStrip() {
  const [data, setData] = useState<Record<string, ForexQuote> | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    getForexQuotes(FOREX_PAIRS.map(([s]) => s)).then(d => { if (live) setData(d); });
    return () => { live = false; };
  }, []);
  return (
    <div className="index-strip">
      {FOREX_PAIRS.map(([symbol, name]) => {
        const q = data?.[symbol];
        const close = q ? Number(q.close) : NaN;
        const pct = q ? Number(q.percent_change) : NaN;
        const text = Number.isFinite(close) ? close.toFixed(close < 10 ? 4 : 2) : null;
        const v = chipValue(text, Number.isFinite(pct) ? pct : null);
        return (
          <div key={symbol} className="index-chip">
            <span className="index-chip-name">{name}</span>
            <span className={`index-chip-value ${v.cls}`}>{data === undefined ? "···" : v.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function EconCalendar() {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = ECON_CALENDAR_EVENTS.filter(e => e.date >= today);
  if (!upcoming.length) return <p className="muted">No upcoming events on the list right now.</p>;
  const dayMs = 24 * 60 * 60 * 1000;
  const todayDate = new Date(`${today}T12:00:00Z`);
  return (
    <>
      <div className="calendar-scroll">
        {upcoming.map((e, i) => {
          const src = ECON_SOURCES[e.src as keyof typeof ECON_SOURCES];
          const d = new Date(`${e.date}T12:00:00Z`);
          const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
          const weekday = d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
          const days = Math.round((d.getTime() - todayDate.getTime()) / dayMs);
          const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days}d`;
          return (
            <a key={`${e.date}-${i}`} className="econ-calendar-row" href={src.url} target="_blank" rel="noopener noreferrer" title="Open the official schedule">
              <span className="econ-calendar-date">{dateLabel}<span className="econ-calendar-dow">{weekday} · {when}</span></span>
              <span className="econ-calendar-body">
                <span className="econ-calendar-label">{e.label}</span>
                <span className={`econ-calendar-tag econ-tag-${src.cat.toLowerCase()}`}>{src.cat}</span>
              </span>
              <span className="econ-calendar-out" aria-hidden="true">↗</span>
            </a>
          );
        })}
      </div>
      <p className="muted small calendar-foot">{upcoming.length} upcoming · dates from the official Fed, BLS and BEA schedules. Tap a row to open its source.</p>
    </>
  );
}
