// learn.js — the "Learn" tab: a plain-English education hub, separate from
// the per-indicator (?) tooltips (definitions.js). Tooltips answer "what
// does this one number mean"; this answers the bigger "what am I even
// looking at, and how do all these pieces fit together" questions, for
// someone with zero finance background (Jozsua's own stated target
// audience — "people like me"). Written 2026-09-22, Pillar 5.
//
// Built in stages, on purpose: LEARN_CATEGORIES lists every category the
// hub is meant to eventually cover, but only categories with a non-empty
// `topics` array are clickable — the rest render as "Coming soon" cards so
// the intended shape of the whole hub is visible before every category is
// filled in. Depends on homeContentEl (home.js) and isNum()/loadTicker()
// (script.js), so must load after both.

const LEARN_CATEGORIES = [
  {
    id: "the-basics",
    icon: "🧱",
    title: "The Basics",
    blurb: "Start here if \"stock\", \"ETF\", or \"crypto\" still feel fuzzy. No finance background assumed.",
    topics: [
      {
        id: "stocks",
        title: "Stocks",
        oneLiner: "Owning a tiny slice of a real company",
        visual: () => learnPieVisual("Your 1 share", "The rest of the company"),
        body: [
          "A stock (or \"share\") is a tiny ownership slice of a real company. When a company sells stock, it's dividing itself into millions of equal pieces and letting anyone buy one. Buy a single share and you genuinely own a fraction of that company — its buildings, its cash, its future profits — even if that fraction is tiny.",
          "Companies do this to raise money without borrowing it. Instead of taking a loan they have to pay back with interest, they sell ownership stakes instead. In exchange, the people who buy those stakes (shareholders) get a claim on the company's future profits and, in many cases, a vote on major decisions.",
          "A share's price moves up and down based on what people are willing to pay for that ownership slice right now — which mostly comes down to how much money the market expects the company to make in the future, not how much cash it happens to have sitting in the bank today.",
        ],
        example: "Apple (AAPL) has roughly 15 billion shares outstanding. Buy 1 share and you own about 1 / 15,000,000,000th of Apple — everything from its retail stores to its patents to its cash reserves — plus a tiny slice of whatever profit it makes each year.",
        tip: "This is why the Valuation numbers on a stock's page (P/E, P/B — covered in Reading the Numbers) matter so much: they tell you how expensive your slice is relative to what the company actually earns or owns.",
      },
      {
        id: "etfs",
        title: "ETFs",
        oneLiner: "One purchase, many companies at once",
        visual: () => learnBasketVisual(),
        body: [
          "An ETF (Exchange-Traded Fund) is a single basket that holds many individual stocks — or bonds, or other assets — inside it, and trades on the stock exchange just like an ordinary stock. Buy one share of an ETF and, in effect, you buy a tiny slice of everything inside that basket at once.",
          "The most famous example tracks the S&P 500 — 500 of the largest US companies. Buying one share of an S&P 500 ETF spreads your money across all 500 instantly, instead of you having to research and buy 500 individual stocks yourself.",
          "That spreading-out is called diversification, and it's one of the simplest ways to reduce risk: if one company in the basket has a terrible year, it's a small part of a much bigger picture rather than your entire investment.",
        ],
        example: "VOO (Vanguard S&P 500 ETF) holds a small slice of all 500 companies in the S&P 500 — from Apple to a small regional bank — inside one single ticker you can buy exactly like a stock.",
        tip: "ETFs don't have their own earnings, margins, or debt the way a company does, so Growth/Profitability/Risk/Efficiency don't apply and are hidden on their page — look at Price Performance and Trading Activity instead.",
      },
      {
        id: "bond-etfs",
        title: "Bonds (via Bond ETFs)",
        oneLiner: "You lend money, they pay you back with interest",
        visual: () => learnLendVisual(),
        body: [
          "A bond is essentially an IOU. When a government or company needs to borrow money, it can issue bonds instead of taking a bank loan — anyone who buys one is lending that money directly, in exchange for a promise: regular interest payments along the way, and the original amount back in full at a set future date.",
          "This is fundamentally different from owning a stock. A shareholder owns a piece of a company and shares its ups and downs. A bondholder is just a lender — you don't own anything, and you're normally paid a fixed amount regardless of whether the company (or government) has a great year or a bad one, as long as they can pay what they owe.",
          "Individual bonds aren't easily available through this dashboard's free data sources, so it uses Bond ETFs as a stand-in: a basket of many bonds bundled together — the same diversification idea as a stock ETF, just for lending instead of owning.",
        ],
        example: "TLT (a 20+ Year Treasury Bond ETF) holds a basket of long-dated US government bonds — you're effectively lending to the US government, spread across many different bonds, and collecting the interest they pay.",
        tip: "Bonds are generally considered lower-risk than stocks (a government or large company is more likely to pay its debts than to guarantee its stock price never falls) — a mix of stocks and bonds is a common way to balance growth potential against stability.",
      },
      {
        id: "crypto",
        title: "Crypto",
        oneLiner: "Digital money with no single company or bank behind it",
        visual: () => learnNetworkVisual(),
        body: [
          "Cryptocurrency (like Bitcoin or Ethereum) is a form of digital money that isn't issued or controlled by any single company, bank, or government. Instead, it runs on a shared, public record — a \"blockchain\" — that thousands of independent computers around the world keep an identical copy of and update together, so no single party can secretly change the numbers.",
          "That's the core difference from a stock. Buying a share means owning a piece of a real, operating company with real revenue and real employees. Buying crypto means owning a unit of a digital asset whose value comes entirely from what people are willing to pay for it — there's no company profit or dividend sitting behind it the way there is with a stock.",
          "It's also why crypto tends to be far more volatile — its price swings a lot more, in both directions, than most stocks. There's no earnings report or balance sheet to anchor its price to, just supply, demand, and sentiment.",
        ],
        example: "Bitcoin (BTC) has a hard cap of 21 million coins that will ever exist, fixed by its own code rather than decided by any company or government — a scarcity rule stocks and ordinary currencies don't have.",
        tip: "Because there's no company financials behind crypto, its pages show Market Stats and Performance instead of Valuation or Financial Health — look there instead of expecting a P/E ratio.",
      },
    ],
  },
  {
    id: "reading-the-numbers",
    icon: "📊",
    title: "Reading the Numbers",
    blurb: "What valuation, growth, profitability, risk, and efficiency actually measure — and what counts as \"good\", in plain English.",
    topics: [],
  },
  {
    id: "macro-economy",
    icon: "🌍",
    title: "Macro & the Economy",
    blurb: "What a rate hike, inflation, or GDP growth actually does — and why it hits different sectors differently.",
    topics: [],
  },
  {
    id: "options-101",
    icon: "🎯",
    title: "Options 101",
    blurb: "Calls, puts, strikes, and expiration — the basics behind the Options card, for anyone who's never traded one.",
    topics: [],
  },
  {
    id: "putting-it-together",
    icon: "🧭",
    title: "Putting It Together",
    blurb: "How to actually weigh all of this — diversification, risk tolerance, and reading the AI Outlook — before deciding anything.",
    topics: [],
  },
];

const learnState = {
  activeCategory: "the-basics",
  expandedTopics: new Set(),
};

// ---- Simple inline SVG/CSS visuals — flat, theme-colored, no images ----

function learnPieVisual(sliceLabel, restLabel) {
  return `
    <div class="learn-visual-pie">
      <div class="learn-pie-chart" style="background: conic-gradient(var(--accent) 0deg 32deg, var(--bg-surface-2) 32deg 360deg);"></div>
      <div class="learn-pie-legend">
        <span><i class="learn-swatch" style="background:var(--accent)"></i>${sliceLabel}</span>
        <span><i class="learn-swatch" style="background:var(--bg-surface-2); border:1px solid var(--border);"></i>${restLabel}</span>
      </div>
    </div>
  `;
}

function learnBasketVisual() {
  const dots = [
    [40, 62, 6, "var(--accent)"], [58, 58, 7, "var(--accent-strong)"], [78, 63, 5, "var(--accent)"],
    [48, 78, 6, "var(--text-secondary)"], [68, 79, 6, "var(--accent-strong)"], [86, 76, 5, "var(--text-secondary)"],
  ];
  const circles = dots.map(([cx, cy, r, fill]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.9"/>`).join("");
  return `
    <svg class="learn-visual-svg" viewBox="0 0 120 110" role="img" aria-label="A basket holding several small circles, representing many assets bundled into one fund">
      <path d="M40,50 Q60,18 80,50" fill="none" stroke="var(--text-muted)" stroke-width="3" stroke-linecap="round"/>
      <polygon points="22,50 98,50 86,98 34,98" fill="var(--bg-surface-2)" stroke="var(--border)" stroke-width="1.5"/>
      ${circles}
    </svg>
    <p class="learn-visual-caption">One ticker, many holdings inside</p>
  `;
}

function learnLendVisual() {
  return `
    <svg class="learn-visual-svg" viewBox="0 0 220 110" role="img" aria-label="You lend money to a borrower, who pays back the amount plus interest over time">
      <defs>
        <marker id="learnArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"/>
        </marker>
      </defs>
      <rect x="10" y="35" width="60" height="40" rx="8" fill="var(--bg-surface-2)" stroke="var(--border)"/>
      <text x="40" y="59" text-anchor="middle" font-size="12" fill="var(--text-primary)" font-weight="700">You</text>
      <rect x="150" y="35" width="60" height="40" rx="8" fill="var(--bg-surface-2)" stroke="var(--border)"/>
      <text x="180" y="59" text-anchor="middle" font-size="11" fill="var(--text-primary)" font-weight="700">Borrower</text>
      <path d="M72,48 L148,48" stroke="var(--accent)" stroke-width="2.5" marker-end="url(#learnArrow)"/>
      <text x="110" y="40" text-anchor="middle" font-size="10" fill="var(--text-secondary)">lend $</text>
      <path d="M148,68 L72,68" stroke="var(--accent-strong)" stroke-width="2.5" marker-end="url(#learnArrow)"/>
      <text x="110" y="88" text-anchor="middle" font-size="10" fill="var(--text-secondary)">$ + interest, later</text>
    </svg>
  `;
}

function learnNetworkVisual() {
  const ringNodes = (cx, cy, r, n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const bankSpokes = ringNodes(45, 55, 30, 5);
  const bankLines = bankSpokes.map(([x, y]) => `<line x1="45" y1="55" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1.5"/>`).join("");
  const bankDots = bankSpokes.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="var(--text-secondary)"/>`).join("");

  const meshNodes = ringNodes(175, 55, 30, 6);
  const meshLines = meshNodes.map(([x1, y1], i) => meshNodes.slice(i + 1).map(([x2, y2]) =>
    `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--accent)" stroke-width="1" opacity="0.35"/>`
  ).join("")).join("");
  const meshDots = meshNodes.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="var(--accent)"/>`).join("");

  return `
    <svg class="learn-visual-svg" viewBox="0 0 220 110" role="img" aria-label="A bank keeps one central record; a cryptocurrency network has every participant holding an identical copy">
      ${bankLines}<circle cx="45" cy="55" r="8" fill="var(--bg-surface-2)" stroke="var(--text-secondary)" stroke-width="2"/>${bankDots}
      ${meshLines}${meshDots}
    </svg>
    <div class="learn-visual-caption-pair">
      <span>A bank: one central record</span>
      <span>Crypto: everyone holds a copy</span>
    </div>
  `;
}

// ---- Rendering ----

function renderLearnTab() {
  homeContentEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "learn-wrap";

  wrap.innerHTML = `
    <p class="learn-intro">
      This is the "informed" part — plain-English explanations of what you're actually looking at
      elsewhere on this site, so you can form your own view instead of taking any single number's word
      for it. No jargon left unexplained; every (?) tooltip on a ticker page answers "what's this one
      number", these answer the bigger picture around it.
    </p>
  `;

  const grid = document.createElement("div");
  grid.className = "learn-category-grid";
  LEARN_CATEGORIES.forEach(cat => {
    const hasTopics = cat.topics.length > 0;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "learn-category-card" + (cat.id === learnState.activeCategory && hasTopics ? " active" : "") + (!hasTopics ? " coming-soon" : "");
    card.disabled = !hasTopics;
    card.innerHTML = `
      <span class="learn-category-icon">${cat.icon}</span>
      <span class="learn-category-title">${cat.title}${!hasTopics ? ' <span class="learn-soon-badge">Coming soon</span>' : ""}</span>
      <span class="learn-category-blurb">${cat.blurb}</span>
      ${hasTopics ? `<span class="learn-category-count">${cat.topics.length} topic${cat.topics.length === 1 ? "" : "s"}</span>` : ""}
    `;
    if (hasTopics) {
      card.addEventListener("click", () => {
        learnState.activeCategory = cat.id;
        renderLearnTab();
      });
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  const activeCat = LEARN_CATEGORIES.find(c => c.id === learnState.activeCategory && c.topics.length > 0);
  if (activeCat) {
    const list = document.createElement("div");
    list.className = "learn-topic-list";
    activeCat.topics.forEach(topic => {
      const expanded = learnState.expandedTopics.has(topic.id);
      const item = document.createElement("div");
      item.className = "learn-topic" + (expanded ? " expanded" : "");

      const header = document.createElement("button");
      header.type = "button";
      header.className = "learn-topic-header";
      header.innerHTML = `
        <span class="learn-topic-title">${topic.title}</span>
        <span class="learn-topic-oneliner">${topic.oneLiner}</span>
        <span class="learn-topic-chevron">${expanded ? "−" : "+"}</span>
      `;
      header.addEventListener("click", () => {
        if (expanded) learnState.expandedTopics.delete(topic.id);
        else learnState.expandedTopics.add(topic.id);
        renderLearnTab();
      });
      item.appendChild(header);

      if (expanded) {
        const body = document.createElement("div");
        body.className = "learn-topic-body";
        body.innerHTML = `
          <div class="learn-visual">${topic.visual()}</div>
          <div class="learn-topic-text">
            ${topic.body.map(p => `<p>${p}</p>`).join("")}
          </div>
          <div class="learn-example">
            <p class="learn-example-label">In practice</p>
            <p>${topic.example}</p>
          </div>
          <div class="learn-tip">
            <p class="learn-tip-label">Why it matters here</p>
            <p>${topic.tip}</p>
          </div>
        `;
        item.appendChild(body);
      }

      list.appendChild(item);
    });
    wrap.appendChild(list);
  }

  homeContentEl.appendChild(wrap);
}
