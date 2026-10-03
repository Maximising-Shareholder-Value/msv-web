// components/WorldMap.tsx — the world map on the Market Data page. Ports the
// SVG work in worldMarkets.js: the same worldmap.svg, exchange dots (pulsing
// when open), hover card, click-to-select, and the "Color by" modes that tint
// each country by a World Bank indicator.
//
// The SVG is drawn by hand (not through React's virtual DOM), because the
// country shapes come from a static file and are styled by class name, as the
// vanilla page does. The rest of the page is React.

import { useEffect, useRef, useState } from "react";
import { COUNTRY_LIST, COUNTRY_GROUPS, exchangeStatus, type Country } from "../lib/markets";
import { WB_BY_KEY, type WbStore } from "../lib/worldBank";
import { fmtPct, fmtPrice } from "../lib/format";
import type { Quote } from "../lib/finnhub";

export interface MapMode {
  id: string;
  label: string;
  scale?: { kind: "diverging" | "warm" | "log"; max?: number };
}

export const MAP_MODES: MapMode[] = [
  { id: "groups", label: "Groups" },
  { id: "gdpg", label: "GDP growth", scale: { kind: "diverging", max: 8 } },
  { id: "infl", label: "Inflation", scale: { kind: "warm", max: 15 } },
  { id: "unemp", label: "Unemployment", scale: { kind: "warm", max: 16 } },
  { id: "debt", label: "Govt debt", scale: { kind: "warm", max: 140 } },
  { id: "cab", label: "Current account", scale: { kind: "diverging", max: 10 } },
  { id: "polstab", label: "Political stability", scale: { kind: "diverging", max: 1.8 } },
  { id: "gdppc", label: "GDP per capita", scale: { kind: "log" } },
];

const GROUP_TINT: Record<string, string> = {
  brics: "color-mix(in srgb, var(--accent) 42%, var(--bg-surface-2))",
  developed: "color-mix(in srgb, #6366f1 30%, var(--bg-surface-2))",
  emerging: "color-mix(in srgb, #f59e0b 34%, var(--bg-surface-2))",
  frontier: "color-mix(in srgb, #ec4899 30%, var(--bg-surface-2))",
};
const GROUP_DOT_TINT: Record<string, string> = { brics: "var(--accent)", developed: "#6366f1", emerging: "#f59e0b", frontier: "#ec4899" };

const SVG_NS = "http://www.w3.org/2000/svg";
const ISO2_BY_CLASS = new Map(COUNTRY_LIST.map(c => [c.iso2.toLowerCase(), c.iso2]));

/** A colour for one value on a mode's scale (same bands as worldMarkets.js). */
function scaleColor(scale: NonNullable<MapMode["scale"]>, v: number, logRange: { min: number; max: number } | null): string {
  const mix = (varName: string, pct: number) => `color-mix(in srgb, ${varName} ${Math.round(pct)}%, var(--bg-surface-2))`;
  if (scale.kind === "diverging") {
    const t = Math.min(Math.abs(v) / (scale.max ?? 1), 1) * 62;
    return v >= 0 ? mix("var(--positive)", t) : mix("var(--negative)", t);
  }
  if (scale.kind === "warm") {
    if (v < 0) return mix("#3b82f6", Math.min(Math.abs(v) / 5, 1) * 40);
    return mix("var(--negative)", Math.min(v / (scale.max ?? 1), 1) * 62);
  }
  const range = logRange ?? { min: 0, max: 1 };
  const t = (Math.log10(Math.max(v, 1)) - range.min) / (range.max - range.min || 1);
  return mix("var(--accent)", Math.max(0, Math.min(1, t)) * 62);
}

interface Props {
  selected: string | null;
  onSelect: (iso2: string) => void;
  quotes: Record<string, Quote | null | undefined>;
  mode: string;
  onMode: (id: string) => void;
  wbData: Record<string, WbStore | undefined>;
}

export function WorldMap({ selected, onSelect, quotes, mode, onMode, wbData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<{ iso2: string; x: number; y: number } | null>(null);
  const [tick, setTick] = useState(0);  // bumps every 30 s so open/closed dots stay current

  // 1. Load the map once, and inject it.
  useEffect(() => {
    let live = true;
    fetch("/worldmap.svg")
      .then(r => r.text())
      .then(text => {
        if (!live || !containerRef.current) return;
        containerRef.current.innerHTML = text;
        const svg = containerRef.current.querySelector("svg");
        if (!svg) throw new Error("no svg");
        svg.classList.add("world-markets-svg");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svgRef.current = svg;
        setReady(true);
      })
      .catch(() => { if (live) setFailed(true); });
    const timer = setInterval(() => setTick(t => t + 1), 30_000);
    return () => { live = false; clearInterval(timer); };
  }, []);

  // 2. Exchange dots: open markets pulse, closed ones are grey, and the
  // selected country's dot is highlighted.
  useEffect(() => {
    const svg = svgRef.current;
    if (!ready || !svg) return;
    svg.querySelector("#exchangeMarkersLayer")?.remove();
    const layer = document.createElementNS(SVG_NS, "g");
    layer.setAttribute("id", "exchangeMarkersLayer");
    const r = svg.viewBox.baseVal.width * 0.0036;

    COUNTRY_LIST.forEach(c => {
      const status = exchangeStatus(c);
      const isOpen = !!status?.isOpen;
      const x = lonToX(c.lon), y = latToY(c.lat);
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", `exchange-marker${selected === c.iso2 ? " map-selected-dot" : ""}`);
      g.setAttribute("data-iso2", c.iso2);
      const dotGroup = document.createElementNS(SVG_NS, "g");
      dotGroup.setAttribute("transform", `translate(${x}, ${y})`);
      if (isOpen) {
        const pulse = document.createElementNS(SVG_NS, "circle");
        pulse.setAttribute("r", String(r * 1.7));
        pulse.setAttribute("class", "exchange-pulse");
        dotGroup.appendChild(pulse);
      }
      const hit = document.createElementNS(SVG_NS, "circle");
      hit.setAttribute("r", String(r * 2.4));
      hit.setAttribute("fill", "transparent");
      dotGroup.appendChild(hit);
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("r", String(r));
      dot.setAttribute("class", "exchange-dot");
      dot.setAttribute("fill", isOpen ? "var(--positive)" : status ? "var(--text-muted)" : GROUP_DOT_TINT[c.group] ?? "var(--text-muted)");
      dotGroup.appendChild(dot);
      g.appendChild(dotGroup);
      if (c.label) {
        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", String(x + c.label.dx * 2.2));
        text.setAttribute("y", String(y + c.label.dy * 2.2));
        text.setAttribute("text-anchor", c.label.anchor || "start");
        text.setAttribute("class", "exchange-float-title");
        text.textContent = `${c.flag} ${c.city}`;
        g.appendChild(text);
      }
      layer.appendChild(g);
    });
    svg.appendChild(layer);
  }, [ready, tick, selected]);

  // 3. Tint countries by the chosen mode.
  useEffect(() => {
    const svg = svgRef.current;
    if (!ready || !svg) return;
    svg.querySelectorAll(".choropleth-tinted").forEach(el => { (el as SVGElement).style.fill = ""; el.classList.remove("choropleth-tinted"); });
    const paint = (c: Country, color: string) => shapesFor(svg, c.iso2).forEach(el => { el.style.fill = color; el.classList.add("choropleth-tinted"); });

    const modeDef = MAP_MODES.find(m => m.id === mode);
    if (!modeDef || !modeDef.scale) {
      COUNTRY_LIST.forEach(c => paint(c, GROUP_TINT[c.group]));
      return;
    }
    const store = wbData[mode];
    if (!store) return;  // still loading: tints appear once the data lands
    const vals = COUNTRY_LIST.map(c => store[c.iso3]?.value).filter((v): v is number => typeof v === "number");
    const logRange = modeDef.scale.kind === "log" && vals.length
      ? { min: Math.log10(Math.max(Math.min(...vals), 1)), max: Math.log10(Math.max(...vals, 1)) } : null;
    COUNTRY_LIST.forEach(c => {
      const d = store[c.iso3];
      paint(c, d ? scaleColor(modeDef.scale!, d.value, logRange) : "color-mix(in srgb, var(--text-muted) 14%, var(--bg-surface-2))");
    });
  }, [ready, mode, wbData]);

  // 4. Mark the selected country's outline.
  useEffect(() => {
    const svg = svgRef.current;
    if (!ready || !svg) return;
    svg.querySelectorAll(".map-selected").forEach(el => el.classList.remove("map-selected"));
    if (selected) shapesFor(svg, selected).forEach(el => el.classList.add("map-selected"));
  }, [ready, selected]);

  // Clicks and hovers on the map (shapes and dots) are read from the element's class.
  const countryAt = (target: EventTarget | null): string | null => {
    const el = target as Element | null;
    const dotG = el?.closest?.("[data-iso2]");
    if (dotG) return dotG.getAttribute("data-iso2");
    const classes = (el?.getAttribute?.("class") ?? "").split(/\s+/);
    for (const cls of classes) { const iso2 = ISO2_BY_CLASS.get(cls); if (iso2) return iso2; }
    return null;
  };

  const modeDef = MAP_MODES.find(m => m.id === mode);
  const hoverCountry = hover ? COUNTRY_LIST.find(c => c.iso2 === hover.iso2) : null;

  return (
    <div className="world-map-wrap">
      <div className="map-color-toggle" role="group" aria-label="Colour the map by">
        <span className="map-color-label">Color by</span>
        {MAP_MODES.map(m => (
          <button key={m.id} type="button" className={m.id === mode ? "active" : ""} onClick={() => onMode(m.id)}>{m.label}</button>
        ))}
      </div>
      <div
        className="world-markets-map"
        ref={containerRef}
        onMouseMove={e => { const iso2 = countryAt(e.target); setHover(iso2 ? { iso2, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null); }}
        onMouseLeave={() => setHover(null)}
        onClick={e => { const iso2 = countryAt(e.target); if (iso2) onSelect(iso2); }}
        role="img"
        aria-label="World map of tracked exchanges"
      />
      {failed && <p className="muted small">Couldn't load the world map.</p>}
      {hover && hoverCountry && <HoverCard country={hoverCountry} x={hover.x} y={hover.y} quote={hoverCountry.etf ? quotes[hoverCountry.etf] : undefined} />}
      <MapLegend mode={modeDef} wbData={wbData} />
    </div>
  );
}

function HoverCard({ country, x, y, quote }: { country: Country; x: number; y: number; quote: Quote | null | undefined }) {
  const status = exchangeStatus(country);
  return (
    <div className="map-hover-popup" style={{ left: x + 14, top: y + 14 }}>
      <strong>{country.flag} {country.name}</strong>
      <div className="muted small">{country.ex || country.city}</div>
      {status && <div className="small">{status.isOpen ? <span className="status-open">● Open</span> : <span className="status-closed">● Closed</span>} · {country.open}–{country.close} local</div>}
      {country.etf && <div className="small">{country.etf} {quote ? <>{fmtPrice(quote.c)} <span className={quote.dp !== null && quote.dp >= 0 ? "positive" : "negative"}>{fmtPct(quote.dp)}</span></> : "…"}</div>}
      {!country.etf && <div className="muted small">Macro data only</div>}
    </div>
  );
}

function MapLegend({ mode, wbData }: { mode: MapMode | undefined; wbData: Record<string, WbStore | undefined> }) {
  if (!mode || mode.id === "groups" || !mode.scale) {
    return (
      <div className="map-legend">
        {COUNTRY_GROUPS.map(g => <span key={g.id} className="map-legend-item"><i style={{ background: GROUP_DOT_TINT[g.id] }} />{g.label}</span>)}
        <span className="map-legend-item"><i className="legend-open" />Market open now</span>
      </div>
    );
  }
  const ind = WB_BY_KEY[mode.id];
  const store = wbData[mode.id];
  if (!store) return <div className="map-legend"><span className="muted small">Loading World Bank data…</span></div>;
  const vals = Object.values(store).map(d => d.value);
  const lo = mode.scale.kind === "diverging" ? `−${mode.scale.max}` : mode.scale.kind === "warm" ? "0" : ind.fmt(Math.min(...vals));
  const hi = mode.scale.kind === "log" ? ind.fmt(Math.max(...vals)) : mode.scale.kind === "diverging" ? `+${mode.scale.max}` : `${mode.scale.max}+`;
  return (
    <div className="map-legend">
      <span className="map-legend-title">{ind.label}</span>
      <span className="small muted">{lo}</span>
      <span className="map-legend-bar" style={{ background: `linear-gradient(90deg, ${legendStops(mode.scale.kind).join(", ")})` }} />
      <span className="small muted">{hi}</span>
    </div>
  );
}

// Colours for the legend bar, matching scaleColor()'s ends.
function legendStops(kind: "diverging" | "warm" | "log"): string[] {
  if (kind === "diverging") return ["var(--negative)", "var(--bg-surface-2)", "var(--positive)"];
  if (kind === "warm") return ["var(--bg-surface-2)", "var(--negative)"];
  return ["var(--bg-surface-2)", "var(--accent)"];
}

function shapesFor(svg: SVGSVGElement, iso2: string): SVGElement[] {
  return Array.from(svg.querySelectorAll<SVGElement>(`[class~="${iso2.toLowerCase()}"]`));
}

// Map projection, from countries.js (derived from country bounding boxes).
const lonToX = (lon: number) => 7.6407 * lon + 1270.42;
const latToY = (lat: number) => -7.7154 * lat + 757.56;
