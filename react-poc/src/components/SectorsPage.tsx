// components/SectorsPage.tsx — the Sectors page, React version. Ports the
// vanilla sectors.js page: a colour-coded tile grid of the 11 sectors and
// their industries/themes, and a detail panel that opens when a tile is
// clicked (performance vs the S&P 500, what drives it, the other ETFs that
// track the same theme, and representative companies).
//
// Live numbers come from ../lib/finnhub.ts (throttled, cached). The
// sector/industry taxonomy and the ETF groupings are copied from the vanilla
// site's data files, so they stay in step with the rest of the app.

import { useEffect, useMemo, useState } from "react";
import { SECTORS, SECTOR_BENCHMARK, type Industry, type Sector } from "../data/sectors";
import { ETF_CATEGORIES } from "../data/etfCategories";
import { getMetric, getQuote, metricValue, type Metric, type Quote } from "../lib/finnhub";
import { fmtPct, fmtPrice, changeClass } from "../lib/format";

type ViewMode = "sectors" | "industries" | "all";

interface Item {
  id: string;            // "tech" for a sector, "tech:semis" for an industry
  name: string;
  etf: string;
  desc: string;
  sector: Sector;        // the parent sector (itself, for a sector)
  industry: Industry | null;
  isSector: boolean;
}

const ITEMS: Item[] = SECTORS.flatMap(sector => [
  { id: sector.id, name: sector.name, etf: sector.etf, desc: sector.desc, sector, industry: null, isSector: true },
  ...sector.industries.map(ind => ({
    id: `${sector.id}:${ind.id}`, name: ind.name, etf: ind.etf, desc: ind.desc, sector, industry: ind, isSector: false,
  })),
]);
const ITEM_BY_ID = new Map(ITEMS.map(i => [i.id, i]));

/** Other funds on the same theme, from the ETF page's categories (sec-spdr excluded: one-per-sector, not alternatives). */
function relatedEtfs(etf: string): [string, string][] {
  const cat = ETF_CATEGORIES.find(c => c.id !== "sec-spdr" && !c.dynamicGroup && c.items?.some(([t]) => t === etf));
  return cat?.items?.filter(([t]) => t !== etf) ?? [];
}

// Heat colour for a % move, scaled so ±4% is full strength (same scale as the vanilla page).
function heatBackground(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return "var(--surface-2, #1a2430)";
  const strength = Math.min(Math.abs(pct) / 4, 1) * 0.55 + 0.1;
  return pct >= 0 ? `rgba(16, 185, 129, ${strength.toFixed(2)})` : `rgba(239, 68, 68, ${strength.toFixed(2)})`;
}

const PERF: [string, string][] = [
  ["5D", "5DayPriceReturnDaily"],
  ["MTD", "monthToDatePriceReturnDaily"],
  ["3M", "13WeekPriceReturnDaily"],
  ["6M", "26WeekPriceReturnDaily"],
  ["YTD", "yearToDatePriceReturnDaily"],
  ["1Y", "52WeekPriceReturnDaily"],
];

type Quotes = Record<string, Quote | null | undefined>;
type Metrics = Record<string, Metric | null | undefined>;

export function SectorsPage() {
  const [view, setView] = useState<ViewMode>("all");
  const [selectedId, setSelectedId] = useState<string | null>(() => new URLSearchParams(location.search).get("sector"));
  const [quotes, setQuotes] = useState<Quotes>({});
  const [metrics, setMetrics] = useState<Metrics>({});

  // Keep the selection in the URL so it can be shared, same as the crypto page's ?coin=.
  useEffect(() => {
    const url = new URL(location.href);
    if (selectedId) url.searchParams.set("sector", selectedId); else url.searchParams.delete("sector");
    history.replaceState(null, "", url);
  }, [selectedId]);

  // Everything goes through one queue, which runs requests in the order they
  // were asked for. So the order below is the order the page fills in:
  // 1. the 11 sector prices, 2. the S&P 500 benchmark and the sectors'
  // performance numbers, 3. the industries' prices. Industries get their
  // performance numbers only when opened, to keep the request count down.
  useEffect(() => {
    SECTORS.forEach(s => {
      getQuote(s.etf).then(q => setQuotes(prev => ({ ...prev, [s.etf]: q })));
    });
    [SECTOR_BENCHMARK, ...SECTORS.map(s => s.etf)].forEach(etf => {
      getMetric(etf).then(m => setMetrics(prev => ({ ...prev, [etf]: m })));
    });
    ITEMS.filter(i => !i.isSector).forEach(item => {
      getQuote(item.etf).then(q => setQuotes(prev => ({ ...prev, [item.etf]: q })));
    });
  }, []);

  const selected = selectedId ? ITEM_BY_ID.get(selectedId) ?? null : null;

  // When an item opens, fetch its own metrics and the related ETFs' numbers.
  useEffect(() => {
    if (!selected) return;
    const related = relatedEtfs(selected.etf).map(([t]) => t);
    [selected.etf, ...related].forEach(etf => {
      getQuote(etf).then(q => setQuotes(prev => ({ ...prev, [etf]: q })));
      getMetric(etf).then(m => setMetrics(prev => ({ ...prev, [etf]: m })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const sectorItems = useMemo(() => ITEMS.filter(i => i.isSector), []);
  const upCount = sectorItems.filter(i => (quotes[i.etf]?.dp ?? 0) > 0).length;
  const loadedSectors = sectorItems.filter(i => quotes[i.etf] !== undefined);
  const ranked = loadedSectors
    .filter(i => quotes[i.etf]?.dp !== null && quotes[i.etf]?.dp !== undefined)
    .sort((a, b) => (quotes[b.etf]!.dp ?? 0) - (quotes[a.etf]!.dp ?? 0));
  const leader = ranked[0];
  const laggard = ranked[ranked.length - 1];

  const visible = ITEMS.filter(i => view === "all" || (view === "sectors" ? i.isSector : !i.isSector));

  return (
    <section className="sectors-page">
      <header className="sectors-header">
        <h2>Sector Performance</h2>
        <span className="muted small">{SECTORS.length} sectors, {ITEMS.length - SECTORS.length} industries &amp; themes — live, via tracking ETFs</span>
      </header>

      <div className="sectors-summary">
        <span><strong>{upCount}</strong> of {SECTORS.length} sectors up</span>
        {leader && <span>Leader <strong className={changeClass(quotes[leader.etf]?.dp)}>{leader.name} {fmtPct(quotes[leader.etf]?.dp)}</strong></span>}
        {laggard && laggard !== leader && <span>Laggard <strong className={changeClass(quotes[laggard.etf]?.dp)}>{laggard.name} {fmtPct(quotes[laggard.etf]?.dp)}</strong></span>}
        <div className="sectors-view-toggle" role="group" aria-label="Which categories to show">
          <button type="button" className={view === "sectors" ? "active" : ""} onClick={() => setView("sectors")}>{SECTORS.length} Sectors</button>
          <button type="button" className={view === "industries" ? "active" : ""} onClick={() => setView("industries")}>{ITEMS.length - SECTORS.length} Industries &amp; themes</button>
          <button type="button" className={view === "all" ? "active" : ""} onClick={() => setView("all")}>All</button>
        </div>
      </div>

      <div className="sectors-legend muted small">Tile colour = today's move in the tracking ETF · click a tile for the full breakdown</div>

      <div className="sectors-grid">
        {visible.map(item => {
          const q = quotes[item.etf];
          const active = item.id === selectedId;
          return (
            <button
              type="button"
              key={item.id}
              className={`sectors-tile${active ? " active" : ""}${item.isSector ? "" : " sub"}`}
              style={{ background: heatBackground(q?.dp) }}
              onClick={() => setSelectedId(active ? null : item.id)}
            >
              <span className="sectors-tile-name">{item.name}</span>
              <span className="sectors-tile-row">
                <span className="muted small">{item.etf}</span>
                <strong className={changeClass(q?.dp)}>{q === undefined ? "…" : q ? fmtPct(q.dp) : "—"}</strong>
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <SectorDetail
          item={selected}
          quote={quotes[selected.etf]}
          metric={metrics[selected.etf]}
          benchmark={metrics[SECTOR_BENCHMARK]}
          quotes={quotes}
          metrics={metrics}
          onOpen={setSelectedId}
          onClose={() => setSelectedId(null)}
          onUp={() => setSelectedId(selected.sector.id)}
        />
      )}
    </section>
  );
}

function SectorDetail({ item, quote, metric, benchmark, quotes, metrics, onOpen, onClose, onUp }: {
  item: Item;
  quote: Quote | null | undefined;
  metric: Metric | null | undefined;
  benchmark: Metric | null | undefined;
  quotes: Quotes;
  metrics: Metrics;
  onOpen: (id: string) => void;
  onClose: () => void;
  onUp: () => void;
}) {
  const { sector, industry, isSector } = item;
  const reps: [string, string][] = isSector ? sector.reps : (industry?.reps ?? []).map(t => [t, t]);
  const related = relatedEtfs(item.etf);

  const perf = PERF.map(([label, key]) => ({
    label,
    value: metricValue(metric, key),
    vs: metricValue(metric, key) !== null && metricValue(benchmark, key) !== null
      ? (metricValue(metric, key) as number) - (metricValue(benchmark, key) as number)
      : null,
  }));

  const low = metricValue(metric, "52WeekLow");
  const high = metricValue(metric, "52WeekHigh");
  const pos = quote && low !== null && high !== null && high > low ? ((quote.c - low) / (high - low)) * 100 : null;

  return (
    <div className="sectors-detail">
      <div className="sectors-detail-head">
        <div>
          <h3>
            {item.name} <span className="ctag">{item.etf}</span>{" "}
            {isSector ? <span className="ctag ctag-brics">Sector</span> : <span className="ctag ctag-developed">Industry · {sector.name}</span>}
          </h3>
          <p className="muted small">{item.desc}</p>
        </div>
        <div className="sectors-detail-actions">
          {!isSector && <button type="button" className="cp-btn cp-btn-ghost" onClick={onUp}>↑ {sector.name}</button>}
          <button type="button" className="cp-btn cp-btn-ghost" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      <div className="sectors-detail-section">
        <h4>Price &amp; performance <span className="muted small">{item.etf} — a tracking ETF, used as a proxy for the {isSector ? "sector" : "industry"}</span></h4>
        {quote ? (
          <div className="sectors-price-row">
            <div className="sectors-price">
              <strong>{fmtPrice(quote.c)}</strong>{" "}
              <span className={changeClass(quote.dp)}>{quote.d !== null ? `${quote.d >= 0 ? "+" : ""}${quote.d.toFixed(2)}` : ""} ({fmtPct(quote.dp)})</span>
            </div>
            <dl className="sectors-stats">
              <div><dt>Open</dt><dd>{fmtPrice(quote.o)}</dd></div>
              <div><dt>Day high</dt><dd>{fmtPrice(quote.h)}</dd></div>
              <div><dt>Day low</dt><dd>{fmtPrice(quote.l)}</dd></div>
              <div><dt>Prev close</dt><dd>{fmtPrice(quote.pc)}</dd></div>
              <div><dt>Beta</dt><dd>{metricValue(metric, "beta")?.toFixed(2) ?? "—"}</dd></div>
            </dl>
          </div>
        ) : <p className="muted small">Loading price…</p>}

        <div className="sectors-perf">
          {perf.map(p => (
            <div key={p.label} className="sectors-perf-cell">
              <span className="muted small">{p.label}</span>
              <strong className={changeClass(p.value)}>{fmtPct(p.value, 1)}</strong>
              {p.vs !== null && <span className="muted small">vs S&amp;P {fmtPct(p.vs, 1)}</span>}
            </div>
          ))}
        </div>

        {low !== null && high !== null && (
          <div className="sectors-range">
            <span className="muted small">52-week range</span>
            <span>{fmtPrice(low)}</span>
            <div className="sectors-range-bar">{pos !== null && <span style={{ left: `${Math.min(Math.max(pos, 0), 100)}%` }} />}</div>
            <span>{fmtPrice(high)}</span>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="sectors-detail-section">
          <h4>Other ETFs tracking this {isSector ? "sector" : "industry"} <span className="muted small">{related.length} more besides {item.etf} — live</span></h4>
          <div className="crypto-table-scroll">
            <table className="crypto-table quotes-table">
              <thead>
                <tr>
                  <th>Ticker</th><th>Fund</th><th>Price</th><th>Day %</th><th>YTD</th><th>1Y</th><th>Beta</th><th>Avg vol 10d</th>
                </tr>
              </thead>
              <tbody>
                {related.map(([t, name]) => {
                  const q = quotes[t];
                  const m = metrics[t];
                  return (
                    <tr key={t}>
                      <td><strong>{t}</strong></td>
                      <td className="muted">{name}</td>
                      <td>{q ? fmtPrice(q.c) : "…"}</td>
                      <td className={changeClass(q?.dp)}>{q === undefined ? "…" : q ? fmtPct(q.dp) : "—"}</td>
                      <td className={changeClass(metricValue(m, "yearToDatePriceReturnDaily"))}>{fmtPct(metricValue(m, "yearToDatePriceReturnDaily"), 1)}</td>
                      <td className={changeClass(metricValue(m, "52WeekPriceReturnDaily"))}>{fmtPct(metricValue(m, "52WeekPriceReturnDaily"), 1)}</td>
                      <td>{metricValue(m, "beta")?.toFixed(2) ?? "—"}</td>
                      <td>{metricValue(m, "10DayAverageTradingVolume")?.toFixed(1) ?? "—"}M</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            Not ranked by market cap or assets under management. Fund size (AUM), expense ratio and holdings are paywalled on every free data source this app has checked (see BLOCKERS.md), so they aren't shown. Order is this app's own curated list.
          </p>
        </div>
      )}

      {isSector && sector.industries.length > 0 && (
        <div className="sectors-detail-section">
          <h4>Industries inside {item.name}</h4>
          <div className="sectors-grid sectors-grid-small">
            {sector.industries.map(ind => {
              const id = `${sector.id}:${ind.id}`;
              const q = quotes[ind.etf];
              return (
                <button type="button" key={id} className="sectors-tile sub" style={{ background: heatBackground(q?.dp) }} onClick={() => onOpen(id)}>
                  <span className="sectors-tile-name">{ind.name}</span>
                  <span className="sectors-tile-row"><span className="muted small">{ind.etf}</span><strong className={changeClass(q?.dp)}>{q === undefined ? "…" : q ? fmtPct(q.dp) : "—"}</strong></span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="sectors-detail-section">
        <h4>What drives it</h4>
        {isSector ? (
          <>
            <ul className="cp-insights">{sector.drivers.map(d => <li key={d}>{d}</li>)}</ul>
            <div className="sectors-facts">
              <div><span className="muted small">Character</span><strong>{sector.character}</strong></div>
              <div><span className="muted small">What to watch</span><strong>{sector.watch.join(" · ")}</strong></div>
            </div>
          </>
        ) : (
          <p className="small">
            {item.desc} It sits inside <strong>{sector.name}</strong>, so it shares that sector's drivers: {sector.drivers.slice(0, 3).join("; ").toLowerCase()}.
          </p>
        )}
      </div>

      <div className="sectors-detail-section">
        <h4>Representative companies <span className="muted small">curated well-known names — not the ETF's live holdings, which aren't available on the free data sources</span></h4>
        <p className="small">{reps.map(([t, n]) => (n === t ? t : `${n} (${t})`)).join(" · ")}</p>
      </div>
    </div>
  );
}
