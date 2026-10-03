// lib/markets.ts — country and exchange helpers for the Market Data page.
// getExchangeStatus() mirrors worldMarkets.js: it works out the local time in
// each exchange's timezone with Intl, so no network call is needed.

import { COUNTRIES, COUNTRY_GROUPS } from "../data/countries";

export interface Country {
  iso2: string;
  iso3: string;
  name: string;
  flag: string;
  group: string;
  g7?: boolean;
  city: string;
  ex?: string;
  tz?: string;
  open?: string;   // "HH:MM" local time
  close?: string;
  days?: number[]; // 0 = Sunday ... 6 = Saturday; default Mon–Fri
  etf?: string;    // a US-listed country ETF standing in for the index
  lat: number;
  lon: number;
  label?: { dx: number; dy: number; anchor?: string };  // where the city label sits on the map
  note?: string;
}

export const COUNTRY_LIST = COUNTRIES as unknown as Country[];
export { COUNTRY_GROUPS };

export const GROUP_ORDER = ["brics", "developed", "emerging", "frontier"];

export function exchangeStatus(c: Country): { isOpen: boolean; hhmm: string } | null {
  if (!c.open || !c.tz || !c.close) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: c.tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  parts.forEach(p => { map[p.type] = p.value; });
  const hhmm = `${map.hour === "24" ? "00" : map.hour}:${map.minute}`;
  const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
  const tradingDays = c.days ?? [1, 2, 3, 4, 5];
  const isOpen = tradingDays.includes(dayIdx) && hhmm >= c.open && hhmm <= c.close;
  return { isOpen, hhmm };
}

/** The local time in a country right now, e.g. "14:05". */
export function localTime(tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date());
}
