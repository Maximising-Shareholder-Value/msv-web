// lib/storage.ts — reads and writes the browser-stored lists the vanilla site
// also uses (recently viewed, watchlist), under the same keys so both stay in
// step. Every access is wrapped: storage can be blocked (private windows).

export const RECENTLY_VIEWED_KEY = "stockDashboardRecentlyViewed";
export const WATCHLIST_KEY = "stockDashboardWatchlist";

export interface StoredTicker { symbol: string; name: string }

export function readList(key: string): StoredTicker[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeList(key: string, list: StoredTicker[]): void {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* storage blocked: fine */ }
}
