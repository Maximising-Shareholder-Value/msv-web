// components/CountryExplorer.tsx — pick a country from a full list, then see its
// market hours, live index price and economy. The list is on the left (with
// filter chips above it, all shown by default), and the country card fills the
// rest of the row. Clicking a country on the world map sets the same selection.

import { useEffect, useState } from "react";
import { COUNTRY_LIST, COUNTRY_GROUPS, exchangeStatus, localTime, type Country } from "../lib/markets";
import { useQuotes } from "../lib/useQuotes";
import { fmtPct, fmtPrice } from "../lib/format";
import { WB_BY_KEY, getCountryValue } from "../lib/worldBank";

interface Props {
  iso2: string;
  onPick: (iso2: string) => void;
}

/** Three headline economy figures for one country, from the World Bank (the latest year that's published). */
const MACRO_KEYS = ["gdpg", "infl", "unemp"] as const;

function CountryMacro({ iso3 }: { iso3: string }) {
  const [vals, setVals] = useState<Partial<Record<(typeof MACRO_KEYS)[number], number | null>> | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setVals(undefined);
    Promise.all(MACRO_KEYS.map(k => getCountryValue(iso3, WB_BY_KEY[k].id).then(v => [k, v] as const)))
      .then(rows => { if (live) setVals(Object.fromEntries(rows)); });
    return () => { live = false; };
  }, [iso3]);

  return (
    <div className="hp-country-macro">
      <span className="muted small">Economy, latest World Bank figures</span>
      <div className="hp-country-macro-row">
        {MACRO_KEYS.map(k => {
          const v = vals?.[k];
          return (
            <div key={k}>
              <span className="muted small">{WB_BY_KEY[k].label}</span>
              <strong>{vals === undefined ? "…" : typeof v === "number" ? WB_BY_KEY[k].fmt(v) : "No data"}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CountryExplorer({ iso2, onPick }: Props) {
  const [filter, setFilter] = useState("all");
  const shown = COUNTRY_LIST.filter(c => filter === "all" || c.group === filter);
  const country: Country | undefined = COUNTRY_LIST.find(c => c.iso2 === iso2);
  const quote = useQuotes(country?.etf ? [country.etf] : [])[country?.etf ?? ""];
  const status = country ? exchangeStatus(country) : null;

  return (
    <div className="hp-country">
      <div className="hp-chips" role="tablist" aria-label="Filter countries">
        <button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          All ({COUNTRY_LIST.length})
        </button>
        {COUNTRY_GROUPS.map(g => (
          <button key={g.id} type="button" role="tab" aria-selected={filter === g.id} className={filter === g.id ? "active" : ""} onClick={() => setFilter(g.id)}>
            {g.label}
          </button>
        ))}
      </div>
      <ul className="hp-country-row" aria-label="Countries">
        {shown.map(c => (
          <li key={c.iso2}>
            <button type="button" className={c.iso2 === iso2 ? "active" : ""} aria-current={c.iso2 === iso2} onClick={() => onPick(c.iso2)}>
              {c.flag} {c.name}
            </button>
          </li>
        ))}
      </ul>
      {country && (
          <div className="hp-country-card">
            <div>
              <strong>{country.flag} {country.name}</strong>
              <p className="muted small">{country.ex || "No exchange tracked"} · {country.city}</p>
            </div>
            <div>
              <span className="muted small">Market</span>
              <strong className={status?.isOpen ? "positive" : ""}>{status ? (status.isOpen ? "Open now" : "Closed") : "—"}</strong>
              {country.tz && <p className="muted small">Local time {localTime(country.tz)}{country.open && country.close ? ` · hours ${country.open}–${country.close}` : ""}</p>}
            </div>
            <div>
              <span className="muted small">{country.etf ? `${country.etf} (index proxy)` : "No index ETF"}</span>
              <strong>{country.etf ? (quote ? `${fmtPrice(quote.c)} ${fmtPct(quote.dp)}` : "Loading…") : "Macro data only"}</strong>
              {quote && <p className="muted small">Day range {fmtPrice(quote.l)} – {fmtPrice(quote.h)} · previous close {fmtPrice(quote.pc)}</p>}
            </div>
            <a className="hp-btn" href={`/app/?page=market-data&country=${country.iso2}`}>Open the {country.name} profile</a>
            <CountryMacro iso3={country.iso3} />
            {country.note && <p className="muted small hp-country-note">{country.note}</p>}
          </div>
        )}
    </div>
  );
}
