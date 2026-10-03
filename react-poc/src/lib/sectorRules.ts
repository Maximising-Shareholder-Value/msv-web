// lib/sectorRules.ts — the traffic-light logic for the ticker page's indicator
// cards: which sector bucket a company falls in, whether a reading is inside the
// typical range for that bucket, and the sentence that explains it. Ports the
// functions in sectorRules.js. The ranges are rules of thumb, not live averages.

import { INDUSTRY_BUCKET_RULES, THRESHOLDS, NOT_APPLICABLE, SECTOR_BUCKETS, TRAFFIC_LABELS } from "../data/sectorRules";

export type Light = "good" | "warning" | "serious" | "critical";

export function getSectorBucket(finnhubIndustry: string | null | undefined): string {
  if (!finnhubIndustry) return "default";
  for (const [pattern, bucket] of INDUSTRY_BUCKET_RULES) {
    if (pattern.test(finnhubIndustry)) return bucket;
  }
  return "default";
}

/** 'good' | 'warning' | 'serious' | 'critical', or null when there's no rule or it doesn't apply. */
export function getTrafficLight(defKey: string, value: number | null | undefined, bucket: string): Light | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (NOT_APPLICABLE[defKey]?.includes(bucket)) return null;
  const rules = THRESHOLDS[defKey];
  if (!rules) return null;
  const rule = rules[bucket] ?? rules.default;
  if (!rule) return null;

  const [lo, hi] = rule.good;
  const inGood = (lo === null || value >= lo) && (hi === null || value <= hi);
  if (inGood) return "good";

  let distance = 0;
  if (lo !== null && value < lo) distance = (lo - value) / (Math.abs(lo) || 1);
  else if (hi !== null && value > hi) distance = (value - hi) / (Math.abs(hi) || 1);
  if (distance > 0.6) return "critical";
  if (distance > 0.25) return "serious";
  return "warning";
}

export function trafficLabel(light: Light): string {
  return TRAFFIC_LABELS[light];
}

/** The sentence under a tooltip that places this company's reading against its sector. */
export function sectorSentence(defKey: string, value: number, finnhubIndustry: string, bucket: string): string {
  const industryLabel = finnhubIndustry || SECTOR_BUCKETS[bucket] || "this company's sector";
  const light = getTrafficLight(defKey, value, bucket);
  if (light === null) {
    return `${industryLabel} was detected as this company's industry, but this metric doesn't have a reliable sector comparison rule yet (or doesn't apply well to this sector).`;
  }
  const verdict: Record<Light, string> = {
    good: `looks reasonable to good compared to typical ${industryLabel} companies`,
    warning: `is roughly in line with, but on the fringe of, what's typical for ${industryLabel} companies`,
    serious: `is somewhat outside the typical range for ${industryLabel} companies`,
    critical: `is well outside the typical range for ${industryLabel} companies`,
  };
  return `Detected industry: ${industryLabel}. This company's current reading ${verdict[light]}, based on general rule-of-thumb ranges for that industry (not a live sector average).`;
}
