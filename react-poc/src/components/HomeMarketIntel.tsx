// components/HomeMarketIntel.tsx — the homepage's "Market intelligence" card.
// Top: the AI supply chain as four columns, from the chips to the AI apps.
// Below: every market category the full Market Intelligence page covers, each
// with its layers and well-known example companies, linking through to the map.
// Names and layers come from data/marketIntel.ts; nothing here is live.

import { MI_INDUSTRIES, MI_LAYERS, MI_NODES } from "../data/marketIntel";

// Left to right follows the supply chain: chips (layer 3) feed data centres and clouds, which serve the AI labs (layer 0).
const COLUMN_ORDER = [3, 2, 1, 0];
const PER_COLUMN = 4;

const ACCENTS = ["#0891b2", "#16a34a", "#2563eb", "#b45309", "#7c3aed", "#db2777"];

export function HomeMarketIntel() {
  return (
    <div className="hmi">
      <div className="hmi-chain">
        <p className="hmi-caption">
          The AI chain, read left to right: chips feed the servers and data centres, which feed the clouds, which serve the AI labs and apps.
        </p>
        <div className="hmi-cols">
          {COLUMN_ORDER.map(layer => {
            const nodes = MI_NODES.filter(n => n.layer === layer).slice(0, PER_COLUMN);
            return (
              <div key={layer} className="hmi-col">
                <span className="hmi-col-title">{MI_LAYERS[layer].title}</span>
                <ul className="hmi-nodes">
                  {nodes.map(n => (
                    <li key={n.id} className="hmi-node">
                      {n.ticker ? <strong>{n.ticker}</strong> : <span className="hmi-private">Private</span>}
                      <span className="muted small">{n.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hmi-categories">
        <span className="hmi-section-label">Market categories</span>
        <div className="hmi-grid">
          {MI_INDUSTRIES.map((ind, i) => {
            const layers = (ind as { layers?: string[] }).layers ?? [];
            const examples = (ind as { examples?: string[] }).examples ?? [];
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <a key={ind.id} className="hmi-tile" href="/app/?page=market-intel" style={{ borderTopColor: accent }}>
                <strong>{ind.label}</strong>
                <span className="muted small">{layers.length ? `${layers.length} layers` : "Live map"}</span>
                {layers.length > 0 && (
                  <ol className="hmi-layers">
                    {layers.slice(0, 3).map(l => <li key={l}>{l}</li>)}
                  </ol>
                )}
                {examples.length > 0 && <span className="hmi-examples">e.g. {examples.slice(0, 3).join(", ")}</span>}
              </a>
            );
          })}
        </div>
      </div>

      <a className="hmi-link" href="/app/?page=market-intel">Open the full Market Intelligence map →</a>
    </div>
  );
}
