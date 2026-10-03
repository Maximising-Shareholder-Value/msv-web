// components/Indicators.tsx — the ticker page's indicator cards: a value, a
// traffic-light dot against the company's sector, and a (?) button that opens
// the plain-English definition (what it means, formula, what high and low
// readings usually imply, and the sector sentence for this company).

import { useState } from "react";
import { DEFINITIONS } from "../data/definitions";
import { getSectorBucket, getTrafficLight, sectorSentence, trafficLabel, type Light } from "../lib/sectorRules";

export interface IndicatorSpec {
  label: string;
  value: number | null | undefined;
  defKey: string;
  percent?: boolean;
}

export function IndicatorGrid({ items, industry, examples = [] }: { items: IndicatorSpec[]; industry: string | null; examples?: string[] }) {
  const [open, setOpen] = useState<{ label: string; defKey: string; value: number | null } | null>(null);
  const bucket = getSectorBucket(industry);
  return (
    <>
      <div className="indicator-grid">
        {items.map(item => (
          <IndicatorCard key={item.label} item={item} bucket={bucket} onHelp={() => setOpen({ label: item.label, defKey: item.defKey, value: item.value ?? null })} />
        ))}
      </div>
      {examples.length > 0 && (
        <div className="real-life">
          <p className="real-life-label">In real terms</p>
          {examples.map((e, i) => <p key={i} dangerouslySetInnerHTML={{ __html: e }} />)}
        </div>
      )}
      {open && <Tooltip {...open} industry={industry} bucket={bucket} onClose={() => setOpen(null)} />}
    </>
  );
}

function IndicatorCard({ item, bucket, onHelp }: { item: IndicatorSpec; bucket: string; onHelp: () => void }) {
  const value = typeof item.value === "number" && Number.isFinite(item.value) ? item.value : null;
  const light: Light | null = value === null ? null : getTrafficLight(item.defKey, value, bucket);
  const text = value === null ? "N/A" : item.percent ? `${value.toFixed(2)}%` : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="indicator">
      <div className="indicator-label">
        <span>{item.label}</span>
        {light && <span className={`traffic-dot traffic-${light}`} title={trafficLabel(light)} />}
        <button type="button" className="help-btn" onClick={onHelp} aria-label={`What is ${item.label}?`}>?</button>
      </div>
      <div className="indicator-value">
        {text}
        {light && <span className={`traffic-label traffic-label-${light}`}>{trafficLabel(light)}</span>}
      </div>
    </div>
  );
}

function Tooltip({ label, defKey, value, industry, bucket, onClose }: { label: string; defKey: string; value: number | null; industry: string | null; bucket: string; onClose: () => void }) {
  const def = DEFINITIONS[defKey];
  return (
    <div className="tooltip-overlay" onClick={onClose}>
      <div className="tooltip-popup" role="dialog" aria-label={label} onClick={e => e.stopPropagation()}>
        <div className="tooltip-header">
          <h4>{label}</h4>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {!def ? <p className="muted">No definition added yet.</p> : (
          <>
            <p className="tooltip-what">{def.what}</p>
            {def.formula && <p className="tooltip-formula"><strong>How it's calculated:</strong> {def.formula}</p>}
            {def.high && <p><strong>High reading:</strong> {def.high}</p>}
            {def.low && <p><strong>Low reading:</strong> {def.low}</p>}
            {value !== null && industry && <p className="tooltip-sector-dynamic">{sectorSentence(defKey, value, industry, bucket)}</p>}
            {def.sector && <p className="muted small">{def.sector}</p>}
          </>
        )}
      </div>
    </div>
  );
}
