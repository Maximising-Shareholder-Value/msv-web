// data/risk.ts — the US market risk gauges (FRED series) for the Market Data page.
// Copied verbatim from ../../riskDashboard.js. The colour bands are widely used
// rules of thumb, not forecasts, and each card shows its cutoffs.

export type Level = "calm" | "normal" | "elevated" | "high" | "info";

export interface RiskSeries {
  group: string;
  id: string;
  title: string;
  freq: "d" | "w" | "m";
  fmt: (v: number) => string;
  bands?: [number, Level, string][];
  bandText?: string;
  explain: string;
  info?: boolean;
  rel?: boolean;
  extra?: Record<string, string>;
}

export const RISK_GROUPS = [
  { id: "fear", title: "Fear & volatility", blurb: "How nervous are investors right now?" },
  { id: "rates", title: "Interest-rate risk", blurb: "Where rates are, and what the yield curve is signalling." },
  { id: "inflation", title: "Inflation risk", blurb: "What markets and the data say about prices." },
  { id: "credit", title: "Credit & recession risk", blurb: "Stress in lending markets and the labor market." },
  { id: "fx", title: "Dollar & oil", blurb: "The two prices that ripple through the global economy." },
];

export const RISK_SERIES: RiskSeries[] = [
  { group: "fear", id: "VIXCLS", title: "VIX — market fear gauge", freq: "d", fmt: v => v.toFixed(1),
    bands: [[15, "calm", "Calm"], [20, "normal", "Normal"], [30, "elevated", "Elevated"], [Infinity, "high", "High stress"]],
    bandText: "Calm <15 · Normal 15–20 · Elevated 20–30 · High >30",
    explain: "The market's expected 30-day swing in the S&P 500, implied by option prices. It jumps when investors rush to buy protection." },
  { group: "fear", id: "STLFSI4", title: "Financial Stress Index", freq: "w", fmt: v => v.toFixed(2),
    bands: [[0, "calm", "Below-average stress"], [1, "elevated", "Above average"], [Infinity, "high", "High stress"]],
    bandText: "0 = average stress · below 0 calm · above 1 high",
    explain: "The St. Louis Fed's blend of 18 weekly market readings (rates, spreads, volatility). Zero means average stress." },
  { group: "fear", id: "USEPUINDXD", title: "US policy uncertainty", freq: "d", rel: true, fmt: v => v.toFixed(0),
    bands: [[0.8, "calm", "Quiet"], [1.3, "normal", "Normal"], [2, "elevated", "Elevated"], [Infinity, "high", "Very high"]],
    bandText: "Compared with its own 1-year average: <0.8× quiet · 0.8–1.3× normal · 1.3–2× elevated · >2× very high",
    explain: "Counts newspaper coverage of policy uncertainty (taxes, trade, regulation, the Fed). It spikes around elections, shutdowns and crises." },
  { group: "fear", id: "GEPUCURRENT", title: "Global policy uncertainty", freq: "m", rel: true, fmt: v => v.toFixed(0),
    bands: [[0.8, "calm", "Quiet"], [1.3, "normal", "Normal"], [2, "elevated", "Elevated"], [Infinity, "high", "Very high"]],
    bandText: "Compared with its own 1-year average: <0.8× quiet · 0.8–1.3× normal · 1.3–2× elevated · >2×",
    explain: "The same idea, GDP-weighted across ~20 major economies — a gauge of global political and policy risk." },

  { group: "rates", id: "DFF", title: "Fed funds rate (effective)", freq: "d", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "The overnight rate the Fed steers. It anchors borrowing costs across the economy." },
  { group: "rates", id: "DGS2", title: "2-year Treasury yield", freq: "d", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "Reflects where markets expect the Fed's policy rate to average over the next two years." },
  { group: "rates", id: "DGS10", title: "10-year Treasury yield", freq: "d", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "The benchmark long-term rate. It drives mortgage rates and the value of long-dated assets, including stocks." },
  { group: "rates", id: "T10Y2Y", title: "Yield curve: 10Y minus 2Y", freq: "d", fmt: v => `${v.toFixed(2)} pts`,
    bands: [[0, "high", "Inverted"], [0.5, "elevated", "Flat"], [Infinity, "calm", "Normal slope"]],
    bandText: "Below 0 inverted (a classic recession warning) · 0–0.5 flat · above 0.5 normal",
    explain: "When short-term rates exceed long-term rates the curve is 'inverted' — it has preceded most US recessions, though with long, variable lags." },
  { group: "rates", id: "T10Y3M", title: "Yield curve: 10Y minus 3M", freq: "d", fmt: v => `${v.toFixed(2)} pts`,
    bands: [[0, "high", "Inverted"], [0.5, "elevated", "Flat"], [Infinity, "calm", "Normal slope"]],
    bandText: "Below 0 inverted · 0–0.5 flat · above 0.5 normal",
    explain: "The version of the curve the New York Fed's recession model uses. Inversion = markets expect rate cuts ahead." },
  { group: "rates", id: "DFII10", title: "10Y real yield (inflation-adjusted)", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[0, "calm", "Negative (loose)"], [1, "normal", "Low"], [2, "elevated", "Restrictive"], [Infinity, "high", "Very restrictive"]],
    bandText: "<0 loose · 0–1 low · 1–2 restrictive · >2 very restrictive",
    explain: "Yield after stripping out expected inflation. High real yields squeeze valuations and borrowers; negative ones are stimulative." },
  { group: "rates", id: "MORTGAGE30US", title: "30-year mortgage rate", freq: "w", fmt: v => `${v.toFixed(2)}%`, info: true,
    explain: "What US home buyers actually pay (weekly, Freddie Mac). A direct read on rate pain for households." },

  { group: "inflation", id: "T10YIE", title: "10Y breakeven inflation", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[1.5, "normal", "Low expectations"], [2.5, "calm", "Anchored near 2%"], [3, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<1.5 low · 1.5–2.5 anchored · 2.5–3 elevated · >3 high",
    explain: "The inflation rate the bond market is pricing in over 10 years (Treasury yield minus TIPS yield)." },
  { group: "inflation", id: "T5YIFR", title: "5Y5Y forward inflation expectation", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[1.5, "normal", "Low expectations"], [2.5, "calm", "Anchored near 2%"], [3, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<1.5 low · 1.5–2.5 anchored · 2.5–3 elevated · >3 high",
    explain: "Expected inflation for the five years starting five years from now — the Fed's favorite check on whether expectations stay anchored." },
  { group: "inflation", id: "CPIAUCSL", title: "CPI inflation (YoY)", freq: "m", extra: { units: "pc1" }, fmt: v => `${v.toFixed(1)}%`,
    bands: [[2, "calm", "Low"], [3, "normal", "Near target"], [5, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<2 low · 2–3 near target · 3–5 elevated · >5 high",
    explain: "The headline change in consumer prices over the past 12 months." },
  { group: "inflation", id: "PCEPILFE", title: "Core PCE inflation (YoY)", freq: "m", extra: { units: "pc1" }, fmt: v => `${v.toFixed(1)}%`,
    bands: [[2, "calm", "Low"], [2.5, "normal", "Near target"], [3.5, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<2 low · 2–2.5 near target · 2.5–3.5 elevated · >3.5 high",
    explain: "The Fed's preferred inflation measure, excluding food and energy." },

  { group: "credit", id: "BAMLH0A0HYM2", title: "High-yield credit spread", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[3.5, "calm", "Tight (calm)"], [5, "normal", "Normal"], [8, "elevated", "Stressed"], [Infinity, "high", "Distress"]],
    bandText: "<3.5 tight · 3.5–5 normal · 5–8 stressed · >8 distress",
    explain: "The extra yield risky (junk) companies pay over Treasuries. It widens fast when lenders get scared." },
  { group: "credit", id: "BAMLC0A0CM", title: "Investment-grade credit spread", freq: "d", fmt: v => `${v.toFixed(2)}%`,
    bands: [[1.2, "calm", "Tight (calm)"], [1.8, "normal", "Normal"], [2.5, "elevated", "Stressed"], [Infinity, "high", "Distress"]],
    bandText: "<1.2 tight · 1.2–1.8 normal · 1.8–2.5 stressed · >2.5 distress",
    explain: "The extra yield safer corporate borrowers pay. Moves less than junk, so a rise here signals broad stress." },
  { group: "credit", id: "RECPROUSM156N", title: "US recession probability", freq: "m", fmt: v => `${v.toFixed(1)}%`,
    bands: [[10, "calm", "Low"], [30, "normal", "Moderate"], [50, "elevated", "Elevated"], [Infinity, "high", "High"]],
    bandText: "<10 low · 10–30 moderate · 30–50 elevated · >50 high",
    explain: "A model-based probability (smoothed, Chauvet–Piger) that the US economy is currently in recession. Published with a lag." },
  { group: "credit", id: "SAHMREALTIME", title: "Sahm Rule indicator", freq: "m", fmt: v => `${v.toFixed(2)} pts`,
    bands: [[0.3, "calm", "Calm"], [0.5, "elevated", "Approaching"], [Infinity, "high", "Triggered"]],
    bandText: "Rises toward 0.5 = the rule that has flagged the start of past recessions",
    explain: "Compares the recent unemployment rate with its 12-month low; a jump of 0.5+ points has coincided with past recessions." },

  { group: "fx", id: "DTWEXBGS", title: "US dollar index (broad)", freq: "d", fmt: v => v.toFixed(1), info: true,
    explain: "The dollar against a basket of trading partners. A strong dollar tightens conditions for emerging markets and dollar borrowers." },
  { group: "fx", id: "DCOILWTICO", title: "Crude oil (WTI, $/barrel)", freq: "d", fmt: v => `$${v.toFixed(2)}`, info: true,
    explain: "A key input cost and inflation driver; spikes usually follow supply shocks or geopolitical events." },
];
