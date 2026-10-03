// lib/marketIntel.ts — small helpers for the Market Intelligence page.

/** "supplier-to-customer / capacity" → "Supplier to customer / capacity", as the vanilla page shows it. */
export function prettyRelationship(rel: string): string {
  return rel
    .split(" / ")
    .map(part => part.split("-").map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" "))
    .join(" / ");
}
