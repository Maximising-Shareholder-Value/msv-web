// lib/etf.ts — helpers for the ETFs page: the country categories built from
// the countries data (so they can't drift from the map), the flat index of
// every ETF, and the By Issuer grouping. Mirrors etfs.js.

import { COUNTRIES } from "../data/countries";
import { ETF_CATEGORIES, ETF_ISSUER_INFO, ETF_ISSUER_OVERRIDES, ETF_ISSUER_PREFIXES, type EtfCategory } from "../data/etfCategories";

export interface EtfItem { symbol: string; name: string }

/** The [ticker, name] pairs in a category. Country categories are built from COUNTRIES. */
export function categoryItems(cat: EtfCategory): [string, string][] {
  if (cat.dynamicGroup) {
    return COUNTRIES
      .filter(c => c.group === cat.dynamicGroup && c.etf)
      .map(c => [c.etf as string, `${c.flag} ${c.name}`]);
  }
  return cat.items ?? [];
}

/** Every ETF once, with the categories it appears in. */
export function allEtfs(): (EtfItem & { cats: string[] })[] {
  const seen = new Map<string, EtfItem & { cats: string[] }>();
  ETF_CATEGORIES.forEach(cat => categoryItems(cat).forEach(([symbol, name]) => {
    const hit = seen.get(symbol);
    if (hit) hit.cats.push(cat.id);
    else seen.set(symbol, { symbol, name, cats: [cat.id] });
  }));
  return [...seen.values()];
}

export function issuerFor(symbol: string, name: string): string | null {
  if (ETF_ISSUER_OVERRIDES[symbol]) return ETF_ISSUER_OVERRIDES[symbol];
  const hit = ETF_ISSUER_PREFIXES.find(([prefix]) => name.startsWith(prefix));
  return hit ? hit[1] : null;
}

export interface IssuerGroup { issuer: string; items: EtfItem[]; blurb: string }

/** Funds grouped by who runs them, biggest groups first. */
export function issuerGroups(): IssuerGroup[] {
  const byIssuer = new Map<string, EtfItem[]>();
  allEtfs().forEach(({ symbol, name }) => {
    const issuer = issuerFor(symbol, name);
    if (!issuer) return;
    if (!byIssuer.has(issuer)) byIssuer.set(issuer, []);
    byIssuer.get(issuer)!.push({ symbol, name });
  });
  return [...byIssuer.entries()]
    .map(([issuer, items]) => ({ issuer, items, blurb: ETF_ISSUER_INFO[issuer] ?? "" }))
    .sort((a, b) => b.items.length - a.items.length || a.issuer.localeCompare(b.issuer));
}
