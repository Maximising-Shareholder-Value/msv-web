import { useMemo, useState } from "react";
import { coingecko, useAsync } from "../lib/api";
import { changeClass, fmtCompact, fmtDate, fmtPct, fmtPrice } from "../lib/format";
import type { CoinDetail, MarketChart } from "../lib/types";
import { LineChart } from "./LineChart";
import { Loadable } from "./Loadable";

const RANGES: [number, string][] = [[7, "7D"], [30, "30D"], [90, "90D"], [365, "1Y"]];

// React escapes text automatically, so a description with sneaky HTML can't
// inject anything; we still strip the tags so it reads as plain text.
const plainText = (html: string) => new DOMParser().parseFromString(html || "", "text/html").body.textContent?.trim() ?? "";

const Stat = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="cp-stat"><span>{label}</span><strong>{children}</strong></div>
);

function PriceChart({ id }: { id: string }) {
  const [days, setDays] = useState(90);
  const state = useAsync(() => coingecko<MarketChart>(`/coins/${id}/market_chart`, { vs_currency: "usd", days: String(days) }), [id, days]);
  const points = useMemo(() => {
    const prices = state.data?.prices ?? [];
    const step = Math.max(1, Math.floor(prices.length / 140));
    return prices.filter((_, i) => i % step === 0 || i === prices.length - 1).map(([t, v]) => ({ t, v }));
  }, [state.data]);
  const change = points.length > 1 ? ((points[points.length - 1].v - points[0].v) / points[0].v) * 100 : null;
  return (
    <div className="cp-section">
      <h4>Price chart {change !== null && <span className="card-subtitle"><span className={changeClass(change)}>{fmtPct(change, 1)}</span> over this period · hover the chart for exact prices</span>}</h4>
      <div className="chart-range-row">
        {RANGES.map(([n, label]) => <button key={n} type="button" className={n === days ? "active" : ""} onClick={() => setDays(n)}>{label}</button>)}
      </div>
      <Loadable state={state} what="chart">{() => <LineChart points={points} />}</Loadable>
    </div>
  );
}

export function CoinPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const state = useAsync(
    () => coingecko<CoinDetail>(`/coins/${id}`, { localization: "false", tickers: "false", community_data: "false", developer_data: "false", sparkline: "false" }),
    [id],
  );
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card-inner" id="coin-panel">
      <Loadable state={state} what="coin profile">
        {d => {
          const m = d.market_data;
          const supplyPct = m.max_supply ? m.circulating_supply / m.max_supply : null;
          const desc = plainText(d.description?.en);
          const home = d.links.homepage.find(Boolean);
          const perf: [string, number | null | undefined][] = [
            ["1h", m.price_change_percentage_1h_in_currency?.usd], ["24h", m.price_change_percentage_24h], ["7d", m.price_change_percentage_7d],
            ["14d", m.price_change_percentage_14d], ["30d", m.price_change_percentage_30d], ["60d", m.price_change_percentage_60d],
            ["200d", m.price_change_percentage_200d], ["1y", m.price_change_percentage_1y],
          ];
          return (
            <>
              <div className="cp-head">
                <div className="cr-coin-title">
                  <img src={d.image.large} alt="" width={44} height={44} />
                  <div>
                    <h3>{d.name} <span className="ctag">{d.symbol.toUpperCase()}</span> {d.market_cap_rank && <span className="ctag ctag-brics">Rank #{d.market_cap_rank}</span>}</h3>
                    <div className="cr-cats">{d.categories.filter(Boolean).slice(0, 5).map(c => <span key={c} className="ctag">{c}</span>)}</div>
                  </div>
                </div>
                <div className="cp-actions">
                  {home && <a className="cp-btn cp-btn-ghost cr-link" href={home} target="_blank" rel="noopener noreferrer">Website ↗</a>}
                  <button type="button" className="cp-btn cp-btn-ghost" onClick={onClose}>✕ Close</button>
                </div>
              </div>

              <div className="cp-market-top">
                <div className="cp-price">
                  <span className="cp-price-big">{fmtPrice(m.current_price.usd)}</span> <span className={changeClass(m.price_change_percentage_24h)}>{fmtPct(m.price_change_percentage_24h)} 24h</span>
                  <div className="muted small"><span className="live-tag">live</span> CoinGecko</div>
                </div>
                <div className="cp-stats">
                  <Stat label="Market cap">{fmtCompact(m.market_cap.usd, "$")}</Stat>
                  <Stat label="Fully diluted">{fmtCompact(m.fully_diluted_valuation.usd, "$")}</Stat>
                  <Stat label="24h volume">{fmtCompact(m.total_volume.usd, "$")}</Stat>
                  <Stat label="24h high">{fmtPrice(m.high_24h.usd)}</Stat>
                  <Stat label="24h low">{fmtPrice(m.low_24h.usd)}</Stat>
                </div>
              </div>

              <PriceChart id={id} />

              <div className="cp-section">
                <h4>Performance</h4>
                <div className="cp-perf">
                  {perf.map(([label, v]) => <div key={label} className={`cp-perf-cell ${changeClass(v)}`}><span>{label}</span><strong>{fmtPct(v, 1)}</strong></div>)}
                </div>
              </div>

              <div className="cp-section">
                <h4>Supply &amp; records</h4>
                <div className="cp-stats cr-wide">
                  <Stat label="Circulating supply">{fmtCompact(m.circulating_supply)}</Stat>
                  <Stat label="Total supply">{m.total_supply ? fmtCompact(m.total_supply) : "—"}</Stat>
                  <Stat label="Max supply">{m.max_supply ? fmtCompact(m.max_supply) : "None (no fixed cap)"}</Stat>
                  <Stat label="All-time high">{fmtPrice(m.ath.usd)} <span className="muted small">{fmtDate(m.ath_date.usd)}</span></Stat>
                  <Stat label="From ATH">{fmtPct(m.ath_change_percentage.usd, 1)}</Stat>
                  <Stat label="All-time low">{fmtPrice(m.atl.usd)} <span className="muted small">{fmtDate(m.atl_date.usd)}</span></Stat>
                  <Stat label="Genesis date">{d.genesis_date ?? "—"}</Stat>
                  <Stat label="Consensus / algorithm">{d.hashing_algorithm ?? "—"}</Stat>
                  <Stat label="Block time">{d.block_time_in_minutes ? `${d.block_time_in_minutes} min` : "—"}</Stat>
                  <Stat label="Community sentiment">{d.sentiment_votes_up_percentage != null ? `${d.sentiment_votes_up_percentage.toFixed(0)}% bullish` : "—"}</Stat>
                </div>
                {supplyPct !== null && (
                  <div className="cp-52w"><span className="small muted">Supply issued</span>
                    <span className="cp-52w-track"><i style={{ left: `${Math.min(100, supplyPct * 100).toFixed(0)}%` }} /></span>
                    <span className="small">{(supplyPct * 100).toFixed(0)}% of max</span></div>
                )}
              </div>

              {desc && (
                <div className="cp-section">
                  <h4>About {d.name}</h4>
                  <p className="cr-desc">{expanded || desc.length <= 700 ? desc : `${desc.slice(0, 700)}…`}</p>
                  {desc.length > 700 && <button type="button" className="did-you-know-link" onClick={() => setExpanded(e => !e)}>{expanded ? "Show less" : "Read more"}</button>}
                </div>
              )}
              <p className="muted small cp-foot">Data: CoinGecko. Crypto is volatile and largely unregulated; this is information, not advice.</p>
            </>
          );
        }}
      </Loadable>
      {state.loading && state.data && <p className="muted small">Refreshing…</p>}
    </div>
  );
}
