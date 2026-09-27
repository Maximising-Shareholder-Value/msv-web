import { useMemo, useState } from "react";
import { changeClass, fmtCompact, fmtPrice, isNum } from "../lib/format";
import type { Coin } from "../lib/types";
import { Sparkline } from "./Sparkline";

interface Column {
  key: string;
  label: string;
  get: (c: Coin) => number | string | null | undefined;
  text?: boolean;
  noSort?: boolean;
}

// The table's columns are described as data. Adding a column = adding one
// line here, instead of editing a big HTML string in two places.
const COLUMNS: Column[] = [
  { key: "rank", label: "#", get: c => c.market_cap_rank },
  { key: "name", label: "Coin", get: c => c.name, text: true },
  { key: "price", label: "Price", get: c => c.current_price },
  { key: "h1", label: "1h", get: c => c.price_change_percentage_1h_in_currency },
  { key: "h24", label: "24h", get: c => c.price_change_percentage_24h_in_currency },
  { key: "d7", label: "7d", get: c => c.price_change_percentage_7d_in_currency },
  { key: "d30", label: "30d", get: c => c.price_change_percentage_30d_in_currency },
  { key: "y1", label: "1y", get: c => c.price_change_percentage_1y_in_currency },
  { key: "cap", label: "Market cap", get: c => c.market_cap },
  { key: "vol", label: "24h volume", get: c => c.total_volume },
  { key: "vm", label: "Vol / cap", get: c => (c.market_cap ? c.total_volume / c.market_cap : null) },
  { key: "supply", label: "Circulating", get: c => (c.max_supply ? c.circulating_supply / c.max_supply : null) },
  { key: "ath", label: "From ATH", get: c => c.ath_change_percentage },
  { key: "spark", label: "7d chart", get: () => null, noSort: true },
];

const Pct = ({ v }: { v: number | null | undefined }) =>
  isNum(v) ? <td className={changeClass(v)}>{v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(Math.abs(v) > 100 ? 0 : 1)}%</td> : <td className="muted">—</td>;

interface Props {
  coins: Coin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  favourites: string[];
  onToggleFavourite: (id: string) => void;
}

export function CoinsTable({ coins, selectedId, onSelect, favourites, onToggleFavourite }: Props) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "rank", dir: 1 });
  const [size, setSize] = useState(25);
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  // useMemo = "only recompute this when the inputs change" (cheap, and
  // makes typing in the search box feel instant).
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = coins;
    if (favOnly) list = list.filter(c => favourites.includes(c.id));
    else if (q) list = list.filter(c => `${c.name} ${c.symbol}`.toLowerCase().includes(q));
    else list = list.slice(0, size);
    const col = COLUMNS.find(c => c.key === sort.key) ?? COLUMNS[0];
    return [...list].sort((a, b) => {
      const av = col.get(a), bv = col.get(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      return col.text ? sort.dir * String(av).localeCompare(String(bv)) : sort.dir * ((av as number) - (bv as number));
    });
  }, [coins, query, size, sort, favOnly, favourites]);

  const clickHeader = (col: Column) => {
    if (col.noSort) return;
    setSort(s => ({ key: col.key, dir: s.key === col.key ? (s.dir === 1 ? -1 : 1) : col.key === "name" || col.key === "rank" ? 1 : -1 }));
  };

  return (
    <>
      <div className="cr-table-head">
        <h3>Top coins <span className="card-subtitle">live, by market cap · click a heading to sort · click a coin for its full profile</span></h3>
        <div className="cr-controls">
          <input type="search" className="cd-search" placeholder="Search coins…" value={query} onChange={e => setQuery(e.target.value)} />
          <div className="cd-chips">
            {[25, 50, 100].map(n => (
              <button key={n} type="button" className={n === size && !favOnly ? "active" : ""} onClick={() => { setSize(n); setFavOnly(false); }}>Top {n}</button>
            ))}
            <button type="button" className={favOnly ? "active" : ""} onClick={() => setFavOnly(f => !f)}>★ Favourites ({favourites.length})</button>
          </div>
        </div>
      </div>

      {favOnly && rows.length === 0 ? (
        <p className="muted small">No favourites yet — click the ☆ next to any coin to add it.</p>
      ) : (
        <div className="crypto-table-scroll">
          <table className="crypto-table quotes-table cr-table">
            <thead>
              <tr>
                <th />
                {COLUMNS.map(col => (
                  <th key={col.key} className={`${col.noSort ? "" : "sortable-th"}${col.key === sort.key ? " sorted" : ""}`} onClick={() => clickHeader(col)}>
                    {col.label}{col.key === sort.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const vm = c.market_cap ? c.total_volume / c.market_cap : null;
                const sup = c.max_supply ? c.circulating_supply / c.max_supply : null;
                const fav = favourites.includes(c.id);
                return (
                  <tr key={c.id} className={`crypto-table-row${selectedId === c.id ? " selected-row" : ""}`} onClick={() => onSelect(c.id)}>
                    <td className="poc-star-cell">
                      <button type="button" className={`poc-star${fav ? " on" : ""}`} aria-label={fav ? `Remove ${c.name} from favourites` : `Add ${c.name} to favourites`}
                        onClick={e => { e.stopPropagation(); onToggleFavourite(c.id); }}>{fav ? "★" : "☆"}</button>
                    </td>
                    <td className="muted">{c.market_cap_rank}</td>
                    <td><span className="cr-coin"><img src={c.image} alt="" width={20} height={20} loading="lazy" /><strong>{c.name}</strong><span className="muted small">{c.symbol.toUpperCase()}</span></span></td>
                    <td>{fmtPrice(c.current_price)}</td>
                    <Pct v={c.price_change_percentage_1h_in_currency} />
                    <Pct v={c.price_change_percentage_24h_in_currency} />
                    <Pct v={c.price_change_percentage_7d_in_currency} />
                    <Pct v={c.price_change_percentage_30d_in_currency} />
                    <Pct v={c.price_change_percentage_1y_in_currency} />
                    <td>{fmtCompact(c.market_cap, "$")}</td>
                    <td>{fmtCompact(c.total_volume, "$")}</td>
                    <td className={vm !== null && vm > 0.3 ? "" : "muted"}>{vm !== null ? `${(vm * 100).toFixed(1)}%` : "—"}</td>
                    <td>{sup !== null
                      ? <span className="cr-supply" title={`${(sup * 100).toFixed(0)}% of max supply in circulation`}><i style={{ width: `${Math.min(100, sup * 100)}%` }} /></span>
                      : <span className="muted small">no cap</span>}</td>
                    <Pct v={c.ath_change_percentage} />
                    <td className="cr-spark">{c.sparkline_in_7d && <Sparkline values={c.sparkline_in_7d.price.filter((_, i) => i % 3 === 0)} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">Vol / cap = how much of the coin's value traded in 24h. Circulating bar = supply issued so far as a share of the maximum (none = no fixed cap). From ATH = distance below the all-time high.</p>
    </>
  );
}
