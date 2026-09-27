// Small pure functions (same input -> same output, no side effects) that
// turn numbers into display text. Easy to unit-test later.

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function fmtCompact(v: number | null | undefined, prefix = ""): string {
  if (!isNum(v)) return "—";
  const a = Math.abs(v);
  const s = v < 0 ? "-" : "";
  if (a >= 1e12) return `${s}${prefix}${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${s}${prefix}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}${prefix}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${s}${prefix}${(a / 1e3).toFixed(1)}K`;
  return `${s}${prefix}${a.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function fmtPct(v: number | null | undefined, digits = 2): string {
  return isNum(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%` : "—";
}

export const changeClass = (v: number | null | undefined): string =>
  !isNum(v) ? "" : v >= 0 ? "positive" : "negative";

export function fmtPrice(v: number | null | undefined): string {
  if (!isNum(v)) return "—";
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: v >= 100 ? 2 : 4 })}`;
  return `$${v.toPrecision(3)}`;
}

export const fmtDate = (s: string | null | undefined): string =>
  s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
