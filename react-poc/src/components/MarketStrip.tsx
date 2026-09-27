import { coingecko, useAsync } from "../lib/api";
import { changeClass, fmtCompact, fmtPct } from "../lib/format";
import type { GlobalStats } from "../lib/types";
import { Loadable } from "./Loadable";

function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="cr-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <em>{sub}</em>}
    </div>
  );
}

export function MarketStrip({ refreshMs }: { refreshMs?: number }) {
  const state = useAsync(() => coingecko<GlobalStats>("/global"), [], refreshMs);
  return (
    <div className="cr-strip">
      <Loadable state={state} what="market overview">
        {({ data: d }) => (
          <>
            <Stat label="Total market cap" value={fmtCompact(d.total_market_cap.usd, "$")} sub={<><b className={changeClass(d.market_cap_change_percentage_24h_usd)}>{fmtPct(d.market_cap_change_percentage_24h_usd)}</b> 24h</>} />
            <Stat label="24h volume" value={fmtCompact(d.total_volume.usd, "$")} sub="all coins" />
            <Stat label="Bitcoin dominance" value={`${d.market_cap_percentage.btc.toFixed(1)}%`} sub="share of total market cap" />
            <Stat label="Ethereum dominance" value={`${d.market_cap_percentage.eth.toFixed(1)}%`} />
            <Stat label="Active coins" value={d.active_cryptocurrencies.toLocaleString()} sub={`${d.markets.toLocaleString()} markets`} />
          </>
        )}
      </Loadable>
    </div>
  );
}
