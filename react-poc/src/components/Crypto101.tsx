const TERMS: [string, string][] = [
  ["Market cap", "Price × circulating supply. It measures a coin's size, not how much you could actually sell it for — thinly traded coins can't be sold at their headline value."],
  ["Dominance", "A coin's share of the total crypto market cap. Bitcoin dominance rising usually means investors are favoring the 'safer' major coin over smaller ones."],
  ["Circulating, total & max supply", "Circulating = coins available now. Max = the hard cap, if any (Bitcoin's is 21 million). 'Fully diluted' value assumes every future coin already exists."],
  ["Halving", "Bitcoin's built-in schedule cuts the reward for creating new blocks in half roughly every four years, slowing the rate of new supply. Price effects are debated."],
  ["Proof of Work vs Proof of Stake", "Two ways a network agrees on who's right. Proof of Work (Bitcoin) uses energy-hungry mining; Proof of Stake (Ethereum, Solana) has validators lock up coins as collateral."],
  ["Stablecoins", "Tokens designed to stay at $1, backed by cash/Treasuries or crypto collateral. Their main risk is losing the peg if reserves are questioned."],
  ["DeFi & TVL", "Decentralized finance apps (lending, trading, staking) run by code instead of companies. TVL — total value locked — is a usage gauge, not a profit or safety measure."],
  ["Layer 1 vs Layer 2", "Layer 1s (Bitcoin, Ethereum, Solana) are base blockchains. Layer 2s sit on top to make transactions cheaper and faster while settling back to the base chain."],
  ["Fear & Greed", "A sentiment composite. Extreme fear can mean panic selling; extreme greed can mean froth. It's a mood gauge, not a prediction."],
  ["Drawdowns & ATH", "Crypto assets have repeatedly fallen 70–90% from their all-time highs. 'From ATH' shows how far below its record a coin sits today."],
  ["Custody & risk", "Coins on an exchange are an IOU from the exchange; coins in your own wallet are only as safe as your private keys."],
  ["Liquidity", "Small coins can have very few buyers. A big order can move the price a lot. Check 24h volume relative to market cap."],
  ["Altcoin season", "A rough index of whether smaller coins ('altcoins') are outperforming Bitcoin. High = money spreading into altcoins; low = it's concentrated in Bitcoin."],
  ["Perpetual futures & funding rate", "A perpetual future lets traders bet on price with leverage, with no expiry date. A 'funding rate' payment between longs and shorts keeps its price tracking the real spot price — persistently positive funding usually means the crowd is leaning bullish (and paying for it)."],
  ["Open interest", "The total value of futures contracts that haven't been closed yet. Rising open interest alongside rising prices often signals new money entering; a sharp drop can mean a 'liquidation cascade' (forced position closures)."],
  ["Exchange trust score", "CoinGecko's attempt to rank exchanges by real, verifiable trading activity rather than self-reported volume, which some exchanges have been shown to inflate ('wash trading')."],
  ["TVL (total value locked)", "How much money sits inside a DeFi protocol's smart contracts. High TVL means more usage, but is not a safety guarantee — a protocol can still be hacked or mismanaged."],
  ["Depeg", "When a stablecoin trades away from its $1 target, even briefly. Small (a fraction of a cent) is routine; a deviation past 1% is a real event worth investigating why."],
];

export function Crypto101() {
  return (
    <div className="cr-box">
      <h4>Crypto 101 <span className="card-subtitle">plain-English basics for everything on this page</span></h4>
      <div className="cr-edu">
        {TERMS.map(([term, text]) => (
          <details key={term}><summary>{term}</summary><p>{text}</p></details>
        ))}
      </div>
      <p className="muted small">Educational only — not financial advice. Crypto is highly volatile and rules vary by country.</p>
    </div>
  );
}
