// components/MarketDataPage.tsx — the Market Data page (React). Top to bottom: the
// world map (colour it by a World Bank indicator), the country picker (the same
// one the homepage uses), the country profile for whichever country is selected,
// and the risk dashboard. Each block is its own card, stacked with a gap.
//
// The selected country is kept in the URL (?country=JP) so it can be shared.

import { useState } from "react";
import { COUNTRY_LIST, exchangeStatus } from "../lib/markets";
import { useQuotes } from "../lib/useQuotes";
import { useWorldData } from "../lib/useWorldData";
import { WorldMap } from "./WorldMap";
import { CountryProfile } from "./CountryProfile";
import { CountryPicker } from "./CountryExplorer";
import { RiskDashboard } from "./RiskDashboard";

const ETF_SYMBOLS = COUNTRY_LIST.filter(c => c.etf).map(c => c.etf as string);

export function MarketDataPage() {
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(location.search).get("country"));
  const [mode, setMode] = useState("groups");
  const quotes = useQuotes(ETF_SYMBOLS);
  const wbData = useWorldData();

  const pick = (iso2: string | null) => {
    setSelected(iso2);
    const url = new URL(location.href);
    if (iso2) url.searchParams.set("country", iso2); else url.searchParams.delete("country");
    history.replaceState(null, "", url);
  };
  const country = COUNTRY_LIST.find(c => c.iso2 === selected) ?? null;

  return (
    <section className="market-page">
      <header className="sectors-header">
        <h2>Market Data</h2>
        <span className="muted small">{COUNTRY_LIST.length} tracked countries · live country-ETF prices · World Bank data</span>
      </header>

      <div className="market-map-card">
        <WorldMap selected={selected} onSelect={pick} quotes={quotes} mode={mode} onMode={setMode} wbData={wbData} />
        <OpenSummary />
      </div>

      <div className="market-picker">
        <CountryPicker iso2={selected} onPick={pick} />
      </div>

      <main className="market-profile">
        {country
          ? <CountryProfile country={country} quote={country.etf ? quotes[country.etf] : undefined} wbData={wbData} onSelect={pick} />
          : <p className="muted market-hint">Click a country on the map, or pick one above, to open its profile: market snapshot, economy, history and governance.</p>}
      </main>

      <RiskDashboard wbData={wbData} onSelect={pick} />

      <p className="muted small market-foot">
        Prices are live country-ETF quotes, used as stand-ins for each market's index. Economic figures are annual World Bank data, latest year available (often 1–2 years old). Not investment advice.
      </p>
    </section>
  );
}

function OpenSummary() {
  const sessions = COUNTRY_LIST.map(c => exchangeStatus(c)).filter((s): s is { isOpen: boolean; hhmm: string } => s !== null);
  const open = sessions.filter(s => s.isOpen).length;
  return <p className="muted small market-summary">{open} of {sessions.length} exchanges currently open · {COUNTRY_LIST.length} countries tracked</p>;
}
