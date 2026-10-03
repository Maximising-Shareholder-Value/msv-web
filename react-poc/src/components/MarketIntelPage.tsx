// components/MarketIntelPage.tsx — the Market Intelligence page (React). Ports
// the AI infrastructure supply-chain map from supplyChain.js: an SVG diagram of
// companies in layers (Supply flow or Dependency view), click-to-select with a
// ripple trace of indirect links, a side panel per company, "Where the map
// concentrates" insights, and the researched relationships with their sources.
// Sourced links are solid; inferred links are dashed and labelled as inferred.

import { useEffect, useMemo, useState } from "react";
import { MI_LAYERS, MI_NODES, MI_EDGES, SUPPLY_CHAIN_RELATIONSHIPS, MI_REL_META, MI_INDUSTRIES } from "../data/marketIntel";
import { getProfile } from "../lib/finnhub";
import { prettyRelationship } from "../lib/marketIntel";

type View = "supply" | "dependency";
type Node = (typeof MI_NODES)[number];
type Edge = (typeof MI_EDGES)[number];

const W = 1200, H = 640, R = 24;
const ROW_GAP = 76, CENTER_Y = 340;
const BY_ID = new Map(MI_NODES.map(n => [n.id, n]));

/** Node positions for the chosen view. Columns run left to right; rows are centred. */
function layoutFor(view: View): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  MI_LAYERS.forEach((_, layer) => {
    const col = view === "supply" ? MI_LAYERS.length - 1 - layer : layer;
    const nodes = MI_NODES.filter(n => n.layer === layer);
    nodes.forEach((n, i) => pos.set(n.id, { x: 100 + col * 200, y: CENTER_Y + (i - (nodes.length - 1) / 2) * ROW_GAP }));
  });
  return pos;
}

/** Everything reachable from a node: its suppliers ("deps") or its customers ("dependents"). */
function closure(id: string, dir: "deps" | "dependents"): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    MI_EDGES.forEach(e => {
      const [a, b] = dir === "deps" ? [e.from, e.to] : [e.to, e.from];
      if (a === cur && !seen.has(b)) { seen.add(b); stack.push(b); }
    });
  }
  return seen;
}

function edgeInfo(e: Edge) {
  if ("rel" in e) {
    const r = SUPPLY_CHAIN_RELATIONSHIPS[e.rel];
    return { sourced: true, text: MI_REL_META[e.rel].short, fig: MI_REL_META[e.rel].fig, full: r.description, source: r.source, confidence: r.confidence, note: r.confidenceNote, label: prettyRelationship(r.relationship) };
  }
  return { sourced: false, text: (e as { text?: string }).text ?? "", fig: "", full: "", source: "", confidence: "Inferred", note: "", label: "Depends on" };
}

function initials(n: Node): string {
  return n.ticker ? n.ticker.slice(0, 4) : n.label.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function MarketIntelPage() {
  const [industry, setIndustry] = useState("ai");
  const [view, setView] = useState<View>("supply");
  const [selected, setSelected] = useState<string | null>(null);
  const [ripple, setRipple] = useState(false);
  const [logos, setLogos] = useState<Record<string, string | null | undefined>>({});
  const live = MI_INDUSTRIES.find(i => i.id === industry);

  // Company logos from Finnhub's profile, one request per company, paced by the shared queue.
  useEffect(() => {
    let active = true;
    MI_NODES.filter(n => n.ticker).forEach(n => {
      getProfile(n.ticker as string).then(p => { if (active) setLogos(prev => ({ ...prev, [n.id]: p?.logo ?? null })); });
    });
    return () => { active = false; };
  }, []);

  const pos = useMemo(() => layoutFor(view), [view]);

  // Which companies and links light up for the current selection.
  const sel = useMemo(() => {
    const direct = new Set<string>();
    let up = new Set<string>(), down = new Set<string>();
    if (selected) {
      MI_EDGES.forEach(e => { if (e.from === selected) direct.add(e.to); if (e.to === selected) direct.add(e.from); });
      if (ripple) { up = closure(selected, "deps"); down = closure(selected, "dependents"); }
    }
    const lit = new Set(ripple ? [selected, ...up, ...down] : [selected, ...direct]);
    return { direct, up, down, lit };
  }, [selected, ripple]);

  const edgeOn = (e: Edge) => {
    if (!selected) return false;
    if (!ripple) return e.from === selected || e.to === selected;
    return ((e.from === selected || sel.up.has(e.from)) && sel.up.has(e.to)) || ((e.to === selected || sel.down.has(e.to)) && sel.down.has(e.from));
  };

  const clickNode = (id: string) => {
    if (selected === id) {
      const ticker = BY_ID.get(id)?.ticker;
      if (ticker) location.href = `/?ticker=${encodeURIComponent(ticker)}`;
      return;
    }
    setSelected(id);
  };

  return (
    <section className="market-intel">
      <header className="sectors-header">
        <h2>Market Intelligence</h2>
        <span className="muted small">How the AI build-out is wired together: who supplies whom</span>
      </header>

      <div className="mi-industries">
        {MI_INDUSTRIES.map(i => (
          <button key={i.id} type="button" className={`mi-ind${i.id === industry ? " active" : ""}${i.live ? "" : " soon"}`} onClick={() => setIndustry(i.id)}>
            {i.label}{!i.live && <span className="mi-soon-tag">Soon</span>}
          </button>
        ))}
      </div>

      {!live?.live ? (
        <IndustryPlaceholder industry={live ?? MI_INDUSTRIES[0]} />
      ) : (
        <>
          <div className="mi-controls">
            <div className="mi-seg" role="group" aria-label="View">
              <button type="button" className={view === "supply" ? "active" : ""} onClick={() => setView("supply")}>Supply flow <span>upstream → downstream</span></button>
              <button type="button" className={view === "dependency" ? "active" : ""} onClick={() => setView("dependency")}>Dependency <span>who depends on whom →</span></button>
            </div>
            <label className="options-toggle"><input type="checkbox" checked={ripple} onChange={e => setRipple(e.target.checked)} /> Ripple — trace indirect links too</label>
          </div>

          <p className="mi-lead">
            {view === "supply"
              ? <>Read left to right, <strong>upstream to downstream</strong>: raw materials and chip tools feed foundries and memory, which feed chip designers, servers and data centres, then the clouds and AI labs that sell to users. An arrow points from a supplier to the customer that relies on it.</>
              : <>Read left to right, from <strong>AI products down to raw materials</strong>. <strong>An arrow points from a company to something it depends on.</strong></>}
          </p>

          <div className="mi-legend">
            <span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" className="mi-legend-line-sourced" /></svg> Sourced: SEC filings, company statements, corroborated press</span>
            <span><svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" className="mi-legend-line-inferred" /></svg> Inferred: the app's own structural reasoning, not individually sourced</span>
            <span className="mi-ripple-legend"><i className="mi-dot mi-dot-up" /> upstream (suppliers) <i className="mi-dot mi-dot-down" /> downstream (customers)</span>
          </div>

          <Diagram view={view} pos={pos} selected={selected} sel={sel} ripple={ripple} edgeOn={edgeOn} logos={logos} onNode={clickNode} />

          <Panel selected={selected} ripple={ripple} onSelect={setSelected} />

          <h5 className="mi-section-title">Where the map concentrates</h5>
          <Insights onSelect={setSelected} />

          <details className="mi-research">
            <summary>Researched relationships</summary>
            <Research />
          </details>
        </>
      )}
    </section>
  );
}

function Diagram({ view, pos, selected, sel, ripple, edgeOn, logos, onNode }: {
  view: View;
  pos: Map<string, { x: number; y: number }>;
  selected: string | null;
  sel: { direct: Set<string>; up: Set<string>; down: Set<string> };
  ripple: boolean;
  edgeOn: (e: Edge) => boolean;
  logos: Record<string, string | null | undefined>;
  onNode: (id: string) => void;
}) {
  const up = view === "supply";
  const edgePath = (e: Edge) => {
    const [srcId, dstId] = up ? [e.to, e.from] : [e.from, e.to];
    const a = pos.get(srcId)!, b = pos.get(dstId)!;
    const x1 = a.x + R, y1 = a.y, x2 = b.x - R - 5, y2 = b.y;
    const dx = Math.max(60, (x2 - x1) * 0.5);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };

  return (
    <div className="mi-diagram-scroll">
      <svg className={`mi-svg${selected ? " mi-has-selection" : ""}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Dependency map of the AI infrastructure supply chain">
        <defs>
          <marker id="miArrowS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="mi-arrow mi-arrow-sourced" /></marker>
          <marker id="miArrowI" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="mi-arrow mi-arrow-inferred" /></marker>
          <clipPath id="miClip"><circle r={R - 5} /></clipPath>
        </defs>

        {MI_LAYERS.map((layer, idx) => {
          const col = up ? MI_LAYERS.length - 1 - idx : idx;
          const x = 100 + col * 200;
          return (
            <g key={layer.title}>
              <text className="mi-col-title" x={x} y={26} textAnchor="middle">{layer.title}</text>
              <line className="mi-col-guide" x1={x} y1={44} x2={x} y2={H - 20} />
            </g>
          );
        })}
        <text className="mi-flow-hint" x={W / 2} y={H - 4} textAnchor="middle">
          {up ? "UPSTREAM  ·  raw materials & equipment   →   →   →   AI products & users  ·  DOWNSTREAM" : "AI PRODUCTS & USERS   →   →   →   raw materials & equipment"}
        </text>

        <g className="mi-edges">
          {MI_EDGES.map((e, i) => {
            const inferred = !("rel" in e);
            const on = edgeOn(e);
            const down = on && ripple && (sel.down.has(e.to) || e.to === selected) && sel.down.has(e.from);
            return (
              <path key={i} className={`mi-edge ${inferred ? "mi-edge-inferred" : "mi-edge-sourced"}${on ? " mi-edge-on" : ""}${down ? " mi-edge-down" : ""}`}
                d={edgePath(e)} markerEnd={`url(#${inferred ? "miArrowI" : "miArrowS"})`} />
            );
          })}
        </g>

        <g className="mi-nodes">
          {MI_NODES.map(n => {
            const p = pos.get(n.id)!;
            const cls = [
              "mi-node",
              n.id === selected ? "mi-selected" : "",
              selected && n.id !== selected && !ripple && sel.direct.has(n.id) ? "mi-connected" : "",
              selected && ripple && sel.up.has(n.id) ? "mi-ripple-up" : "",
              selected && ripple && sel.down.has(n.id) ? "mi-ripple-down" : "",
            ].filter(Boolean).join(" ");
            const logo = logos[n.id];
            return (
              <g key={n.id} className={cls} transform={`translate(${p.x},${p.y})`} tabIndex={0} role="button" aria-label={n.name} onClick={() => onNode(n.id)} onKeyDown={e => { if (e.key === "Enter") onNode(n.id); }}>
                <circle className="mi-node-bg" r={R} />
                <text className="mi-node-initials" y={4} textAnchor="middle">{initials(n)}</text>
                {logo && <image className="mi-node-logo" x={-(R - 5)} y={-(R - 5)} width={(R - 5) * 2} height={(R - 5) * 2} href={logo} clipPath="url(#miClip)" preserveAspectRatio="xMidYMid meet" />}
                <circle className="mi-node-ring" r={R} />
                <text className="mi-node-label" y={R + 15} textAnchor="middle">{n.label}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function Panel({ selected, ripple, onSelect }: { selected: string | null; ripple: boolean; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (!selected) {
    return <div className="mi-panel"><p className="muted small mi-hint">Click any bubble to see who supplies it and who relies on it. Click it again to open its stock page. Turn on “ripple” to trace every indirect link too.</p></div>;
  }
  const n = BY_ID.get(selected)!;
  const outs = MI_EDGES.filter(e => e.from === selected);
  const ins = MI_EDGES.filter(e => e.to === selected);
  const edgeRow = (e: Edge, otherId: string, dir: "out" | "in") => {
    const other = BY_ID.get(otherId)!;
    const info = edgeInfo(e);
    const key = `${e.from}>${e.to}`;
    const isOpen = !!open[key];
    return (
      <div key={key} className="mi-edge-row">
        <div className="mi-edge-row-head">
          <button type="button" className="mi-chip" onClick={() => onSelect(other.id)}>{dir === "out" ? "→" : "←"} {other.name}{other.ticker ? <span className="muted"> {other.ticker}</span> : null}</button>
          <span className={`mi-basis mi-basis-${info.sourced ? "sourced" : "inferred"}`}>{info.sourced ? "Sourced" : "Inferred"}</span>
          <button type="button" className="mi-edge-toggle" aria-expanded={isOpen} onClick={() => setOpen(s => ({ ...s, [key]: !isOpen }))}>Why? {isOpen ? "▴" : "▾"}</button>
        </div>
        {isOpen && (
          <div className="mi-edge-detail">
            {info.fig && <span className="mi-fig">{info.fig}</span>}
            <p className="mi-edge-text">{info.sourced ? info.full : info.text}</p>
            {info.sourced && <p className="mi-edge-note">Confidence: {info.confidence}</p>}
            {info.source && <p className="mi-edge-source">Source: {info.source}</p>}
          </div>
        )}
      </div>
    );
  };
  const upCount = ripple ? closure(selected, "deps").size : null;
  return (
    <div className="mi-panel">
      <div className="mi-panel-head">
        <div>
          <h4>{n.name}{n.ticker && <> <span className="ticker-badge">{n.ticker}</span></>}</h4>
          <p className="muted small">{MI_LAYERS[n.layer].title} · {n.role}</p>
        </div>
        {n.ticker
          ? <a className="mi-open-btn" href={`/?ticker=${encodeURIComponent(n.ticker)}`}>Open {n.ticker} stock page →</a>
          : <span className="muted small">Private / no US ticker: no stock page</span>}
      </div>
      {ripple && upCount !== null && <p className="mi-ripple-line"><span className="mi-dot mi-dot-up" />Ultimately depends on <strong>{upCount}</strong> companies</p>}
      <div className="mi-panel-cols">
        <div>
          <h5>Depends on: its suppliers <span className="muted">({outs.length})</span></h5>
          {outs.length ? outs.map(e => edgeRow(e, e.to, "out")) : <p className="muted small">Nothing further down the chain in this map. It sits at the base.</p>}
        </div>
        <div>
          <h5>Relied on by: its customers <span className="muted">({ins.length})</span></h5>
          {ins.length ? ins.map(e => edgeRow(e, e.from, "in")) : <p className="muted small">Nobody upstream in this map depends on it directly.</p>}
        </div>
      </div>
    </div>
  );
}

function Insights({ onSelect }: { onSelect: (id: string) => void }) {
  const stats = useMemo(() => MI_NODES.map(n => ({
    n,
    direct: MI_EDGES.filter(e => e.to === n.id).length,
    ripple: closure(n.id, "dependents").size,
    deps: MI_EDGES.filter(e => e.from === n.id).length,
  })), []);
  const top = (key: "direct" | "ripple" | "deps") => [...stats].sort((a, b) => b[key] - a[key] || b.direct - a.direct).slice(0, 5);
  const panels: { title: string; sub: string; key: "direct" | "ripple" | "deps" }[] = [
    { title: "Most relied-on", sub: "direct customers in this map", key: "direct" },
    { title: "Widest ripple", sub: "companies affected if it stalls (direct + indirect)", key: "ripple" },
    { title: "Most dependent", sub: "direct suppliers in this map", key: "deps" },
  ];
  return (
    <>
      <div className="mi-insights">
        {panels.map(p => {
          const rows = top(p.key);
          const max = Math.max(...rows.map(r => r[p.key]), 1);
          return (
            <div key={p.key} className="mi-insight">
              <h5>{p.title} <span className="muted">{p.sub}</span></h5>
              {rows.map(r => (
                <button key={r.n.id} type="button" className="mi-rank-row" onClick={() => onSelect(r.n.id)}>
                  <span className="mi-rank-name">{r.n.name}</span>
                  <span className="mi-rank-bar"><i style={{ width: `${(r[p.key] / max) * 100}%` }} /></span>
                  <span className="mi-rank-val">{r[p.key]}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <p className="muted small mi-insight-foot">Counts links inside this map only. This is a lens on concentration, not a forecast. Dashed links are inferred from general industry structure.</p>
    </>
  );
}

function Research() {
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");
  const [open, setOpen] = useState<number | null>(null);
  const conf = { High: 0, Medium: 0 } as Record<string, number>;
  SUPPLY_CHAIN_RELATIONSHIPS.forEach(r => { conf[r.confidence] = (conf[r.confidence] ?? 0) + 1; });
  const rows = SUPPLY_CHAIN_RELATIONSHIPS
    .map((r, i) => ({ r, i }))
    .filter(x => filter === "all" || x.r.confidence.toLowerCase() === filter);
  return (
    <div>
      <p className="small">All {SUPPLY_CHAIN_RELATIONSHIPS.length} researched relationships: {conf.High} high confidence, {conf.Medium ?? 0} medium.</p>
      <div className="mi-rt-filters">
        {(["all", "high", "medium"] as const).map(f => (
          <button key={f} type="button" className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      {rows.map(({ r, i }) => (
        <div key={i} className={`mi-rt-row${open === i ? " open" : ""}`}>
          <button type="button" className="mi-rt-main" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <span className="mi-rt-pair"><strong>{r.a}</strong><i>→</i><strong>{r.b}</strong><em>{prettyRelationship(r.relationship)}</em></span>
            <span className="mi-rt-fig">{MI_REL_META[i].fig}</span>
            <span className="mi-rt-short">{MI_REL_META[i].short}</span>
            <span className={`supply-chain-confidence supply-chain-confidence-${r.confidence.toLowerCase()}`}>{r.confidence}</span>
            <span className="mi-rt-caret">▾</span>
          </button>
          {open === i && (
            <div className="mi-rt-detail">
              <p>{r.description}</p>
              {r.confidenceNote && <p className="mi-rt-note">{r.confidenceNote}</p>}
              <p className="mi-rt-source">Source: {r.source}</p>
            </div>
          )}
        </div>
      ))}
      <p className="muted small">Tap a row for the full write-up and source. Sources: SEC filings, official company statements, and corroborated journalism.</p>
    </div>
  );
}

function IndustryPlaceholder({ industry }: { industry: (typeof MI_INDUSTRIES)[number] }) {
  return (
    <div className="mi-soon">
      <span className="placeholder-badge">Coming soon</span>
      <h4>{industry.label}</h4>
      <p className="mi-soon-why">{industry.why}</p>
      <div className="mi-soon-layers">
        {(industry.layers ?? []).map((l, i, all) => <span key={l}><span className="mi-soon-layer"><b>{i + 1}</b><span>{l}</span></span>{i < all.length - 1 && <i className="mi-soon-arrow">→</i>}</span>)}
      </div>
      <p className="small"><strong>Chokepoints to model:</strong> {industry.chokepoints}</p>
      <p className="small muted"><strong>Examples of companies in these layers</strong> (illustrative names only, not a researched or sourced relationship map): {(industry.examples ?? []).join(", ")}.</p>
      <p className="small muted">This map isn't built yet. Like the AI map, it would only include links backed by filings, company statements or corroborated reporting, with anything inferred shown dashed.</p>
    </div>
  );
}
