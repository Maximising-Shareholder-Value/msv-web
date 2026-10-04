// components/HomeSectors.tsx — sectors today, as tiles with a bar showing how far
// each one moved. A switch also shows the industries and themes inside each
// sector. Their quotes only load once that view is opened, to keep the free
// Finnhub budget for the things the page shows first.

import { useState } from "react";
import { SECTORS } from "../data/sectors";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, changeClass } from "../lib/format";

interface Tile { key: string; name: string; etf: string; parent?: string }

const SECTOR_TILES: Tile[] = SECTORS.map(s => ({ key: s.id, name: s.name, etf: s.etf }));
const INDUSTRY_TILES: Tile[] = SECTORS.flatMap(s => s.industries.map(i => ({ key: i.id, name: i.name, etf: i.etf, parent: s.name })));

export function HomeSectors() {
  const [view, setView] = useState<"sectors" | "industries">("sectors");
  const tiles = view === "sectors" ? SECTOR_TILES : INDUSTRY_TILES;
  const quotes = useQuotes(tiles.map(t => t.etf));

  const settled = tiles.filter(t => quotes[t.etf] !== undefined).length;
  const scored = tiles
    .map(t => ({ ...t, dp: quotes[t.etf]?.dp ?? null }))
    .filter((t): t is Tile & { dp: number } => t.dp !== null);
  const up = scored.filter(t => t.dp > 0).length;
  const byMove = [...scored].sort((a, b) => b.dp - a.dp);
  const best = byMove[0];
  const worst = byMove[byMove.length - 1];

  return (
    <div className="hs">
      <div className="hs-top">
        <div className="hp-chips" role="tablist" aria-label="Sectors or industries">
          <button type="button" role="tab" aria-selected={view === "sectors"} className={view === "sectors" ? "active" : ""} onClick={() => setView("sectors")}>
            Sectors ({SECTOR_TILES.length})
          </button>
          <button type="button" role="tab" aria-selected={view === "industries"} className={view === "industries" ? "active" : ""} onClick={() => setView("industries")}>
            Industries &amp; themes ({INDUSTRY_TILES.length})
          </button>
        </div>
        <p className="muted small">
          {settled < tiles.length ? `Loading ${settled} of ${tiles.length}…` : `${up} of ${scored.length} up today`}
        </p>
      </div>
      {best && worst && (
        <p className="hs-summary">
          Best: <strong className="positive">{best.name} {fmtPct(best.dp)}</strong>
          {" · "}Worst: <strong className="negative">{worst.name} {fmtPct(worst.dp)}</strong>
        </p>
      )}
      <div className="hs-grid">
        {tiles.map(t => {
          const q = quotes[t.etf];
          const dp = q?.dp ?? null;
          const width = dp === null ? 0 : Math.min(Math.abs(dp) / 3, 1) * 100;
          return (
            <a key={t.key} className="hs-tile" href={`/app/?page=sectors&sector=${t.etf}`}>
              <span className="hs-name">{t.name}</span>
              {t.parent && <span className="hs-parent">{t.parent}</span>}
              <strong className={`hs-move ${changeClass(dp)}`}>{q === undefined ? "…" : dp === null ? "—" : fmtPct(dp)}</strong>
              <span className="hs-bar"><i className={dp === null ? "" : dp >= 0 ? "up" : "down"} style={{ width: `${width}%` }} /></span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
