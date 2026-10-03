// components/CryptoTicker.tsx — the crypto layout on the ticker page. Ports
// loadCryptoTicker() and renderCryptoMarketStats / renderCryptoPerformance /
// renderCryptoRange from script.js: market stats, performance over several
// periods, and the all-time high and low, from CoinGecko. Only the six coins on
// the homepage have that detail; any other crypto symbol gets its live price and
// a note. The price chart for crypto stays on the main site.

import { useEffect, useState } from "react";
import { CRYPTO_COINS, getCoinDetail, type CoinDetail } from "../lib/coingecko";
import { getQuote, type Quote } from "../lib/finnhub";
import { fmtCompact, fmtPct, fmtPrice, changeClass } from "../lib/format";
import { IndicatorGrid, type IndicatorSpec } from "./Indicators";

export function CryptoTicker({ symbol }: { symbol: string }) {
  const coin = CRYPTO_COINS.find(c => c.symbol === symbol) ?? null;
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
  const [detail, setDetail] = useState<CoinDetail | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setQuote(undefined); setDetail(undefined);
    getQuote(symbol).then(q => { if (live) setQuote(q); });
    if (coin) getCoinDetail(coin.id).then(d => { if (live) setDetail(d); });
    else setDetail(null);
    return () => { live = false; };
  }, [symbol, coin]);

  const name = coin?.name ?? symbol.split(":")[1]?.replace(/USDT$/, "") ?? symbol;

  return (
    <section className="ticker-page">
      <header className="ticker-header">
        <div>
          <h2>{name} <span className="ticker-badge">{symbol}</span></h2>
          <p className="muted small">Cryptocurrency</p>
        </div>
        <div className="ticker-price">
          {quote === undefined ? <span className="muted">Loading price…</span> : quote ? (
            <>
              <strong>{fmtPrice(quote.c)}</strong>
              <span className={changeClass(quote.dp)}>{quote.dp !== null ? fmtPct(quote.dp) : ""}</span>
            </>
          ) : <span className="muted">No price right now</span>}
        </div>
      </header>

      {detail === undefined && <p className="muted small">Loading market data…</p>}
      {detail === null && <p className="muted">Detailed market data isn't available for this coin. Only the homepage's six coins have it.</p>}
      {detail && <CryptoDetail detail={detail} price={quote?.c ?? null} />}

      <p className="muted small">Price charts for crypto are on the main site. Market data is from CoinGecko.</p>
    </section>
  );
}

function CryptoDetail({ detail, price }: { detail: CoinDetail; price: number | null }) {
  const stats: IndicatorSpec[] = [
    { label: "Market Cap", value: detail.market_cap, defKey: "marketCap" },
    { label: "Market Cap Rank", value: detail.market_cap_rank, defKey: "marketCapRank" },
    { label: "24H Volume", value: detail.total_volume, defKey: "volume24h" },
    { label: "Circulating Supply", value: detail.circulating_supply, defKey: "circSupply" },
    { label: "Max Supply", value: detail.max_supply, defKey: "maxSupply" },
  ];
  const perf: IndicatorSpec[] = [
    { label: "24H Return", value: detail.price_change_percentage_24h, defKey: "return24h", percent: true },
    { label: "7-Day Return", value: detail.price_change_percentage_7d, defKey: "return7Day", percent: true },
    { label: "30-Day Return", value: detail.price_change_percentage_30d, defKey: "return30Day", percent: true },
    { label: "1-Year Return", value: detail.price_change_percentage_1y, defKey: "return1Year", percent: true },
  ];
  const range: IndicatorSpec[] = [
    { label: "All-Time High", value: detail.ath, defKey: "allTimeHigh" },
    { label: "All-Time Low", value: detail.atl, defKey: "allTimeLow" },
  ];
  const dates = [
    detail.ath_date ? `All-time high reached ${new Date(detail.ath_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}.` : "",
    detail.atl_date ? `All-time low reached ${new Date(detail.atl_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}.` : "",
  ].filter(Boolean).join(" ");
  const pos = detail.atl !== null && detail.ath !== null && price !== null && detail.ath > detail.atl
    ? Math.max(0, Math.min(100, ((price - detail.atl) / (detail.ath - detail.atl)) * 100)) : null;

  return (
    <>
      <section className="cp-section"><h4>Market stats</h4><IndicatorGrid items={stats} industry={null} />
        <p className="small muted">Market cap {detail.market_cap ? `$${fmtCompact(detail.market_cap)}` : "—"} · 24h volume {detail.total_volume ? `$${fmtCompact(detail.total_volume)}` : "—"}</p>
      </section>
      <section className="cp-section"><h4>Performance</h4><IndicatorGrid items={perf} industry={null} /></section>
      <section className="cp-section">
        <h4>All-time high and low</h4>
        <IndicatorGrid items={range} industry={null} />
        {dates && <p className="muted small">{dates}</p>}
        {pos !== null && (
          <div className="sectors-range">
            <span className="muted small">All-time range</span>
            <span>{fmtPrice(detail.atl as number)}</span>
            <div className="sectors-range-bar"><span style={{ left: `${pos}%` }} /></div>
            <span>{fmtPrice(detail.ath as number)}</span>
          </div>
        )}
      </section>
    </>
  );
}
