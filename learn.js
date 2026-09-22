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
    topics: [
      {
        id: "valuation",
        title: "Valuation",
        oneLiner: "Is this stock expensive or cheap right now?",
        visual: () => learnValuationVisual(),
        body: [
          "Valuation asks one question: for the price you're paying today, how much of the actual business are you getting in return? Two companies making the exact same profit can trade at wildly different prices — valuation is how you tell whether you're paying a fair amount, a premium, or getting a genuine bargain.",
          "The most common yardstick is the P/E ratio (Price-to-Earnings): how many dollars you're paying today for each $1 the company earns in a year. A P/E of 25 means you're paying $25 upfront for every $1 of annual profit — the market is betting that profit keeps growing enough to justify the wait. There's no single \"correct\" P/E: a mature, slow-growing utility trading at P/E 25 looks expensive, while the same P/E on a fast-growing tech company can look perfectly reasonable.",
          "The same idea shows up in several other numbers on the Valuation card — P/B compares price to what the company owns outright, Price/Sales compares price to its total sales, and EV/EBITDA and Price/Cash-Flow compare price to its actual cash-generating ability. They're all answering the same underlying question from a slightly different angle, which is exactly why it's worth checking more than just one.",
        ],
        example: "If a stock trades at $100 and earns $4 per share a year, its P/E is 25 ($100 ÷ $4). Put another way: at this year's earnings, it would take 25 years of profit to earn back what you paid — assuming profit never grew at all, which is rarely the real expectation for a growing company.",
        tip: "Every number on the Valuation card (P/E, P/B, EV/EBITDA, EV/Revenue, Price/Sales, Price/Cash-Flow) is a variation of this same \"price vs. what you get\" question — the (?) on each explains exactly what it's comparing.",
      },
      {
        id: "growth",
        title: "Growth",
        oneLiner: "Is the business actually getting bigger?",
        visual: () => learnGrowthVisual(),
        body: [
          "Growth measures whether a company's sales (revenue) and profit (earnings) are increasing over time, and how fast. A business that's growing is generally becoming more valuable — more customers, more revenue, more profit to eventually pass on to shareholders — while a shrinking business is moving the opposite direction, even if today's numbers still look fine on their own.",
          "This dashboard checks growth over several different windows on purpose: year-over-year (this year vs. the same period last year), quarter-over-quarter (this quarter vs. the same quarter last year — catches a recent change in direction faster), and 5-year (the longer trend, smoothing out any single unusually good or bad year).",
          "Growth alone doesn't tell you whether something is a good investment — it's always worth weighing against Valuation (how much are you paying for that growth?) and Profitability (is the growth actually turning into real profit, or just more revenue with nothing extra to show for it?).",
        ],
        example: "If a company made $10 billion in revenue last year and $11 billion this year, that's 10% revenue growth (($11B − $10B) ÷ $10B). Whether that's impressive depends entirely on the company and its industry — 10% is exceptional for a mature grocery chain, and underwhelming for an early-stage software company.",
        tip: "The Growth card shows this across three windows (TTM year-over-year, quarterly year-over-year, and 5-year) for exactly this reason — one strong or weak quarter can be noise; the 5-year figure tells you whether it's a real, sustained trend.",
      },
      {
        id: "profitability-efficiency",
        title: "Profitability & Efficiency",
        oneLiner: "How much of what it makes does it keep — and how hard does its money work?",
        visual: () => `${learnFunnelVisual()}${learnTurnoverVisual()}`,
        body: [
          "Profitability asks: out of every dollar that comes in the door, how much survives as actual profit? Revenue (total sales) is just the starting point — a company pays for the product/service itself, then rent, salaries and marketing, then interest and tax, before whatever's left counts as real profit. Margins measure how much survives at each stage.",
          "Gross margin is what's left after just the direct cost of the product. Operating margin is what's left after running the core business too. Net margin is what's left after absolutely everything, including interest and tax — the true bottom line. A software company can keep 70-90 cents of every revenue dollar as gross margin because making one more copy of its product costs almost nothing extra; a grocery chain might keep 20-30 cents because physical goods are expensive to buy, store and ship. Neither is \"bad\" — they're structurally different businesses.",
          "Efficiency is a related but different question: how hard is the company's money working? Two companies can post identical margins yet very different efficiency — one might need $10 of assets (factories, inventory, equipment) to generate $10 of sales each year, while another needs $50 of assets for that same $10. Turnover ratios (asset, inventory, receivables) measure exactly this: how many times a year the company effectively \"recycles\" what it owns into sales.",
        ],
        example: "If a company earns $100 in sales and keeps $20 after every cost including tax, its net margin is 20%. If it needed $50 worth of assets to generate that $100 in sales, its asset turnover is 2.0 — it \"turned over\" its asset base twice over the year.",
        tip: "Profitability and Efficiency are two separate cards on the ticker page for exactly this reason — a company can be profitable but inefficient (great margins, sluggish asset use) or efficient but thin-margined (fast-turning but barely profitable per dollar). Worth checking both, not just one.",
      },
      {
        id: "health-risk",
        title: "Financial Health & Risk",
        oneLiner: "Could this company get into trouble paying its bills?",
        visual: () => learnBarCompareVisual([
          { value: "$60", label: "Bills due within a year", height: 55, fill: "var(--text-secondary)" },
          { value: "$90", label: "Cash & liquid assets on hand", height: 82, fill: "var(--accent)" },
        ], "Illustrative — a healthy cushion here means the shorter bar isn't taller than the longer one."),
        body: [
          "Even a genuinely profitable, fast-growing company can get into serious trouble if it can't pay its bills on time — Financial Health and Risk are about that separate question: not \"is the business good\", but \"is it safe\". A company can look great on paper and still hit a cash crunch if too much of what it owes comes due before enough cash comes in to cover it.",
          "The Current Ratio and Quick Ratio both ask a short-term version of this: for every $1 of bills due within the next year, how many dollars of cash (or near-cash) does the company have on hand right now? Below 1 means bills due soon technically exceed what's readily available — not always an emergency, but worth understanding why.",
          "Debt-to-Equity and Long-Term Debt/Equity ask a longer-term version: how much of the company is funded by borrowed money versus its own capital? More debt isn't automatically bad — it can be a cheap, efficient way to fund growth — but it adds a fixed obligation that has to be paid whether or not business is going well, which is exactly what Interest Coverage measures: how many times over could this year's operating profit alone cover this year's interest payments?",
        ],
        example: "A company with an Interest Coverage Ratio of 5 could pay its annual interest bill 5 times over out of operating profit alone — plenty of cushion. A ratio close to 1 means almost all of its operating profit is already spoken for just servicing debt, leaving very little room for a bad year.",
        tip: "Financial Health and Risk are two separate cards specifically because they lean toward different time horizons — Financial Health (Quick/Current Ratio, Debt/Equity) is the near-term/overall picture, Risk (Interest Coverage, Long-Term Debt/Equity, Payout Ratio) leans toward whether today's profit comfortably covers today's fixed obligations.",
      },
      {
        id: "dividends",
        title: "Dividends",
        oneLiner: "Does it pay you just for holding it?",
        visual: () => learnDividendVisual(),
        body: [
          "Some companies pay a portion of their profit directly to shareholders on a regular schedule (usually quarterly) — this is a dividend. It's a way of saying \"we're generating more cash than we need to reinvest in the business right now, so here's a direct cash return for having your money invested with us\", entirely separate from any change in the share price itself.",
          "Not every company pays one, and that's not automatically a bad sign — fast-growing companies often reinvest every spare dollar back into expanding the business instead, betting that grows the share price faster than a dividend ever could. Mature, slower-growing companies (utilities, consumer staples) are more likely to pay a steady dividend because they simply don't have as many high-return places left to reinvest their profit.",
          "Dividend Yield tells you the annual cash return relative to today's price. Dividend Payout Ratio (on the Risk card) tells you what share of profit is being paid out versus kept — a payout ratio over 100% means the company is paying out more than it's currently earning, which usually can't continue indefinitely without the dividend eventually being cut.",
        ],
        example: "Invest $1,000 in a stock yielding 3% and you'd collect roughly $30 a year in dividend payments alone — before any gain or loss in the share price itself, and typically split into 4 smaller quarterly payments rather than one lump sum.",
        tip: "Check Dividend Yield (Dividends card) alongside Payout Ratio (Risk card) together — a very high yield paired with a payout ratio near or above 100% is often a warning sign the market expects a future dividend cut, not a genuine bargain.",
      },
    ],
  },
  {
    id: "macro-economy",
    icon: "🌍",
    title: "Macro & the Economy",
    blurb: "What a rate hike, inflation, or GDP growth actually does — and why it hits different sectors differently.",
    topics: [
      {
        id: "interest-rates",
        title: "Interest Rates",
        oneLiner: "What a \"rate hike\" actually changes — and why it hits sectors differently",
        visual: () => learnChainVisual(["Rates go up", "Borrowing gets pricier", "Spending & investment slow", "Company profits often cool"]),
        body: [
          "Interest rates are the price of borrowing money, set by a country's central bank (the Federal Reserve in the US). When the Fed raises rates, every loan tied to it — mortgages, car loans, credit cards, and crucially, the loans companies use to fund growth — gets more expensive almost immediately.",
          "That ripples through the economy in a fairly predictable chain: higher borrowing costs mean people and companies spend and invest less, which tends to cool off growth and, eventually, inflation too — usually the entire point of raising rates in the first place. Cutting rates runs the same chain in reverse: cheaper borrowing, more spending, faster growth (and often more inflation risk).",
          "Rate changes don't hit every stock the same way. Companies carrying a lot of debt, or whose business depends on customers borrowing to buy (real estate, cars, big-ticket retail), tend to feel a hike fastest and hardest. Slower-growing, cash-rich companies with little debt feel it much less — part of why growth stocks, valued heavily on profits expected years out, often fall harder on rate hikes than steady, established businesses.",
        ],
        example: "The Fed funds rate went from near 0% in early 2022 to over 5% by mid-2023 — one of the fastest hike cycles in decades. Companies that had gotten used to nearly free borrowing suddenly faced real financing costs, and growth-stock valuations across the market repriced sharply lower as a result.",
        tip: "The Macro tab's Interest Rate figure and the world map's hover popups show exactly this number — check it alongside a company's own Debt/Equity and Interest Coverage (Risk card) to judge how exposed that specific company is to rate moves.",
      },
      {
        id: "inflation",
        title: "Inflation",
        oneLiner: "Why rising prices quietly change what counts as a \"good\" return",
        visual: () => learnBarCompareVisual([
          { value: "10 items", label: "This year, $100 buys", height: 100, fill: "var(--accent)" },
          { value: "~9.5 items", label: "Next year, 5% inflation", height: 88, fill: "var(--text-secondary)" },
        ]),
        body: [
          "Inflation is the rate at which prices for goods and services rise over time — meaning the same amount of money buys a little less than it used to. A little inflation is considered normal and healthy for a growing economy; a lot of it erodes savings and makes planning harder for households and businesses alike.",
          "This matters for investing because it changes what a \"good\" return actually means. A stock that returns 5% in a year when inflation runs at 2% has grown your real purchasing power by about 3%. That same 5% return during a year of 8% inflation actually means you lost purchasing power, even though the number on the account went up.",
          "Inflation also affects companies unevenly. Businesses that can raise their own prices without losing customers (strong brands, essential goods) tend to hold up better — often called \"pricing power\". Businesses that can't pass rising costs on to customers see their margins squeezed instead, since their own costs rise while what they can charge doesn't keep pace as easily.",
        ],
        example: "If a loaf of bread cost $3 last year and costs $3.15 this year, that's 5% inflation on that one item. Applied economy-wide across thousands of goods and services, that's roughly what the CPI inflation figure on the Macro tab is measuring.",
        tip: "Check a company's Gross Margin and Operating Margin trend (Profitability card) during high-inflation periods specifically — margins holding steady while costs rise elsewhere is real pricing power, not just a lucky quarter.",
      },
      {
        id: "gdp-growth",
        title: "GDP Growth",
        oneLiner: "The whole economy's own scorecard",
        visual: () => learnGrowthVisual("Illustrative — a country's total economic output, growing year after year."),
        body: [
          "GDP (Gross Domestic Product) is the total dollar value of everything a country produces — every good made, every service performed — in a given period. GDP Growth is how much bigger (or smaller) that total got compared to the period before, and it's the single most-watched scoreboard for whether an economy is expanding or contracting.",
          "It matters for investing because company profits, in aggregate, tend to track the broader economy over time — it's hard for the average company to keep growing profits indefinitely if the whole economy it operates in is shrinking. Strong GDP growth generally supports rising corporate earnings and, historically, stock prices; a shrinking GDP (two consecutive quarters of decline is the common informal definition of a recession) tends to pressure both.",
          "GDP growth doesn't move every stock equally, though. Cyclical sectors (industrials, consumer discretionary, financials) tend to track the broader economy's ups and downs closely. Defensive sectors (utilities, consumer staples, healthcare) sell things people need regardless of the cycle, so they tend to hold up more steadily whichever way GDP is moving.",
        ],
        example: "If a country's GDP was $25 trillion last year and $25.5 trillion this year, that's 2% GDP growth (($25.5T − $25T) ÷ $25T) — a healthy, unspectacular pace for a large, mature economy like the US.",
        tip: "The Macro tab and the world map's hover popup both show GDP Growth for each tracked country — worth checking alongside a specific company's own Revenue Growth (Growth card) to see whether it's outgrowing its home economy or just riding along with it.",
      },
      {
        id: "unemployment",
        title: "Unemployment",
        oneLiner: "The labor market's temperature check",
        visual: () => learnDotGridVisual(4, 100, "Illustrative 4% unemployment — 4 out of every 100 people in the labor force"),
        body: [
          "The unemployment rate is the share of people who want a job and are actively looking for one, but don't currently have one. It's one of the clearest, most closely watched signals of how healthy an economy's job market is — and because consumer spending makes up the majority of most large economies, whether people have jobs (and paychecks) directly drives how much they spend, which drives company revenue.",
          "A falling unemployment rate generally signals a strengthening economy — more people earning and spending. But very low unemployment can also worry investors for a different reason: a tight labor market often forces companies to pay more to attract and keep workers, which can squeeze margins and add to inflation — one of several reasons markets sometimes react oddly to what looks, on the surface, like \"good\" economic news.",
          "A rising unemployment rate is usually read as a warning sign, though it's a lagging indicator in one important sense: companies typically only start laying off workers after business has already slowed down, so unemployment often confirms a slowdown that's already begun rather than predicting one in advance.",
        ],
        example: "An unemployment rate of 4% means that out of every 100 people in the labor force, about 4 are actively looking for work and haven't found it yet — the other 96 are employed.",
        tip: "The Macro tab and world map hover popup show Unemployment Rate right alongside GDP Growth and Inflation for each tracked country — worth reading all three together, since they interact (very low unemployment can itself contribute to inflation).",
      },
    ],
  },
  {
    id: "options-101",
    icon: "🎯",
    title: "Options 101",
    blurb: "Calls, puts, strikes, and expiration — the basics behind the Options card, for anyone who's never traded one.",
    topics: [
      {
        id: "calls-puts",
        title: "Calls and Puts",
        oneLiner: "The two basic building blocks of every option",
        visual: () => learnCallPutVisual(),
        body: [
          "An option is a contract that gives you the right — but not the obligation — to buy or sell a stock at an agreed price, by an agreed date. You're not buying the stock itself, you're buying a choice about a future stock price, and that choice itself has a price (its premium — see the next topic).",
          "A Call option gives you the right to BUY a stock at a fixed price (the strike price). You'd want one if you think the stock is going UP — lock in the right to purchase it cheap now, even if the market price rises well above that later.",
          "A Put option gives you the right to SELL a stock at a fixed price. You'd want one if you think the stock is going DOWN — lock in the right to sell at today's higher price, even if the market price falls well below it later. Every option contract has someone on the other side selling (or \"writing\") it, taking the opposite bet — this Learn category sticks to the simpler buyer's side.",
        ],
        example: "If a stock trades at $50 and you buy a Call option with a $55 strike, you're paying a small premium for the right to buy at $55 later. If the stock rises to $65, you can exercise that right and effectively buy at $55 — a real gain. If it stays under $55, you'd simply let the option expire and lose only what you paid for it.",
        tip: "On the Options card (ticker page), calls and puts are shown side by side for each strike price — its (?) tooltip covers the same basics as a quick reminder while you're looking at real contracts.",
      },
      {
        id: "strike-expiration",
        title: "Strike Price & Expiration",
        oneLiner: "What you're actually agreeing to, and by when",
        visual: () => learnStrikeLadderVisual(),
        body: [
          "The strike price is the fixed price written into the contract — the price at which you can buy (for a Call) or sell (for a Put), no matter where the actual market price ends up. Every option chain lists many different strike prices for the same stock, spaced at regular intervals above and below today's price.",
          "The expiration date is the deadline — the option stops existing after this date. If the stock hasn't moved the way you needed it to by then, the option simply expires, typically worthless, and that's the most you can lose (what you originally paid for it).",
          "An option is \"in the money\" when exercising it right now would be profitable (e.g. a Call with a strike below today's price), and \"out of the money\" when it wouldn't be. This dashboard's simplified Options view highlights the row closest to today's price — right where in-the-money meets out-of-the-money — usually the most actively traded, easiest-to-understand starting point.",
        ],
        example: "A Call option with a $100 strike expiring in 30 days gives you the right to buy at $100 any time before that date. If the stock is trading at $95 today, that option is currently \"out of the money\" — it only becomes worth exercising if the price rises above $100 before expiration.",
        tip: "The Options card deliberately shows only the nearest expiration and the ~7 strikes closest to today's price for exactly this reason — it's the simplest, most relevant slice of a chain that can otherwise have dozens of expirations and strikes.",
      },
      {
        id: "premium-bid-ask",
        title: "Premium, Bid & Ask",
        oneLiner: "What an option itself actually costs",
        visual: () => learnBarCompareVisual([
          { value: "$2.40", label: "Bid", height: 70, fill: "var(--text-secondary)" },
          { value: "$2.60", label: "Ask", height: 76, fill: "var(--accent)" },
        ], "A tight $0.20 spread — one contract at the ask costs $260 (×100 shares), not $2.60."),
        body: [
          "The premium is the price you pay to buy an option contract — separate entirely from the strike price. It's set by the market based on how likely the option is to become profitable before it expires: how far the strike is from today's price, how much time is left, and how much the stock tends to move around (its volatility) all push the premium up or down.",
          "Like a stock, an option has a Bid (the highest price a buyer is currently offering) and an Ask (the lowest price a seller will currently accept) — the gap between them is the spread. A tight spread means the contract trades often and is easy to get filled near the quoted price; a wide spread means it's thinly traded, and you may pay noticeably more to buy (or receive noticeably less to sell) than the last quoted price suggests.",
          "One important, often-missed detail: US equity options typically represent 100 shares per contract, so a quoted premium of $2.50 actually costs $250 to buy one contract ($2.50 × 100) — not $2.50.",
        ],
        example: "If a Call option's Bid is $2.40 and its Ask is $2.60, the spread is $0.20 — reasonably tight. Buying at the ask would cost $260 for one contract (100 shares × $2.60), not $2.60.",
        tip: "The Options card's bid/ask columns work exactly like this — its (?) notes the same spread-as-liquidity idea. Watch for unusually wide spreads on strikes far from today's price; they tend to be the least liquid.",
      },
      {
        id: "why-options",
        title: "Why People Use Options",
        oneLiner: "Speculation, protection — and real risk worth understanding first",
        visual: () => learnSpeculationHedgeVisual(),
        body: [
          "Broadly, options get used two different ways. Speculation: betting on a price move with a much smaller upfront cost than buying the stock outright, which can multiply gains — and losses — percentage-wise. Hedging: protecting an existing stock position against a drop, similar in spirit to buying insurance, by locking in a floor price with a Put.",
          "The tradeoff that makes options genuinely more complex than stocks: time works against a buyer. Even if you're right about the direction a stock eventually moves, if it takes longer than the option's expiration to get there, the option can still expire worthless. A stock, by contrast, can be held indefinitely — there's no deadline forcing you to be right on a schedule.",
          "This Learn category deliberately stops at the basics. Options carry real, sometimes total, loss of what you paid for the contract, and more advanced strategies (spreads, selling/writing options, combining multiple contracts) carry risks beyond a first introduction — treat this as the vocabulary you'd need before researching further, not a complete education in trading them.",
        ],
        example: "Buying 100 shares of a $50 stock costs $5,000. Buying one Call option controlling the same 100 shares might cost a few hundred dollars instead — far less upfront, but that option can expire completely worthless, while the 100 shares, even if they fall in value, are still yours to hold and sell whenever you choose.",
        tip: "This dashboard's Options card intentionally shows only real bid/ask on the nearest expiration and closest strikes — genuinely useful for building comfort reading a chain, but not a signal to start trading immediately. Everything here is educational, not investment advice.",
      },
    ],
  },
  {
    id: "putting-it-together",
    icon: "🧭",
    title: "Putting It Together",
    blurb: "How to actually weigh all of this — diversification, risk tolerance, and reading the AI Outlook — before deciding anything.",
    topics: [
      {
        id: "diversification",
        title: "Diversification",
        oneLiner: "Don't put all your eggs in one basket — quantified",
        visual: () => learnDiversificationVisual(),
        body: [
          "Diversification means spreading money across multiple, genuinely different investments rather than concentrating it in one place — so one company's bad year, one sector's downturn, or even one country's economic trouble doesn't sink your entire portfolio at once.",
          "The key word is \"genuinely different\". Owning 10 different tech stocks isn't real diversification if they'd all fall together in the same tech-sector downturn — that's concentration wearing a disguise. Real diversification usually means mixing across asset types (stocks, bonds, maybe commodities), sectors, and sometimes countries, so different parts of your portfolio are reacting to different things at different times.",
          "This is a big part of why ETFs exist, covered early in The Basics — a single S&P 500 ETF instantly diversifies across 500 companies and 11 different sectors, something that would take significant time and money to build by buying individual stocks one at a time.",
        ],
        example: "If you owned only one stock and it dropped 50% in a bad year, your whole portfolio drops 50%. If that same stock was 10% of a diversified portfolio and everything else was flat, your overall portfolio only drops 5% — the same bad company outcome, a much smaller personal impact.",
        tip: "This dashboard's Compare tool (up to 4 tickers side by side) is a useful gut-check before adding a new position — if everything you already own scores similarly on Sector, Beta, and Risk, a \"new\" addition might not be adding as much real diversification as it looks like on the surface.",
      },
      {
        id: "risk-tolerance",
        title: "Risk Tolerance",
        oneLiner: "How much could you actually afford to lose, honestly?",
        visual: () => learnRiskToleranceVisual(),
        body: [
          "Risk tolerance is how much your investments could drop in value — temporarily or permanently — before it seriously affects your financial situation or your ability to sleep at night, whichever comes first. It's personal, not a fixed number, and depends on things this dashboard has no way of knowing about you: your time horizon, your other savings, your income stability, and honestly, your temperament.",
          "A useful way to think about it: money you'll need within the next 1-2 years (an emergency fund, a house deposit) generally shouldn't be in volatile individual stocks at all — a sharp downturn at exactly the wrong moment could force you to sell at a loss. Money you won't touch for 10+ years can typically absorb more volatility, since there's time to ride out a downturn before you need the cash.",
          "Beta (on every stock's page) is one concrete, measurable piece of this puzzle — a stock with beta 1.5 tends to swing about 50% more than the overall market, in both directions. It's not the whole risk picture on its own, but it's a real, comparable number worth checking against how much swing you're actually comfortable with.",
        ],
        example: "Two people might both be considering the same stock with beta 1.8. One has a stable job, 10 years until they need the money, and other savings set aside — a sharp 30% drop is uncomfortable but survivable. The other needs some of that money within a year — the same 30% drop could be genuinely damaging. Same stock, same beta, very different real risk.",
        tip: "Beta is on every stock's Momentum card — worth checking alongside Financial Health & Risk (how safe the company itself is), since those measure two different kinds of risk: how much the price bounces around, versus how likely the underlying business is to get into trouble.",
      },
      {
        id: "ai-outlook",
        title: "Reading the AI Outlook",
        oneLiner: "How this dashboard's own summary is built, and how to use it",
        visual: () => learnConvergeVisual(["P/E", "ROE", "Debt/Equity"], "Outlook"),
        body: [
          "Every ticker page ends with an \"Outlook\" section — a plain-English paragraph summarizing what the numbers on that page suggest. It's worth understanding exactly what it is, because it's easy to mistake for something it isn't.",
          "It's rule-based, not a live AI opinion: the same fixed set of thresholds runs every time (e.g. \"P/E above 30 reads as a premium valuation\" for a stock), turning that page's own numbers into a written summary. It isn't calling out to an AI model to form a fresh judgment, and it has no information beyond what's already shown elsewhere on the page — a synthesis, not a new source of insight.",
          "That makes it a genuinely useful last step — a quick way to see several numbers' implications pulled into one paragraph instead of reading each card separately — but it should be the summary of what you already found, not a replacement for looking at the actual cards it's summarizing, and it's absolutely not financial advice.",
        ],
        example: "If a stock has a high P/E, strong ROE, and low debt, the Outlook might read something like \"trading at a premium valuation, but backed by strong profitability and a conservative balance sheet\" — literally just those three cards' findings, restated as one readable sentence instead of three you'd have to mentally combine yourself.",
        tip: "Use the Outlook as your starting checklist for which cards to actually go read in detail, not as the final word — if it flags \"premium valuation\", that's your cue to go look at the real Valuation card and decide for yourself whether the premium is justified.",
      },
      {
        id: "red-flags",
        title: "Red Flags",
        oneLiner: "A short checklist worth a second look before deciding",
        visual: () => learnChecklistVisual([
          "High Dividend Yield + Payout Ratio near/above 100%",
          "Very low Interest Coverage Ratio",
          "Revenue growing while Net Margin shrinks",
        ]),
        body: [
          "None of these automatically mean \"don't buy\" — context always matters, and this dashboard's own sector-aware traffic lights already account for a lot of it. But a few patterns are worth specifically pausing on rather than skimming past, because they're easy to miss when a page otherwise looks fine.",
          "A Dividend Payout Ratio near or above 100% (Risk card) paired with a high Dividend Yield (Dividends card) — often the market pricing in an expected dividend cut, not a genuine bargain. A very low Interest Coverage Ratio (Risk card) — operating profit barely covering interest payments leaves very little room for a bad year. Revenue growing while Net Margin is shrinking (Growth vs. Profitability cards) — the business is getting bigger but keeping less of each dollar, worth understanding why before assuming \"growing\" automatically means \"improving\".",
          "None of these are single-number verdicts on their own — they're prompts to go read the relevant card's plain-English explanation (this Learn hub, and the (?) tooltips) more carefully, and form your own view, which is the entire point of everything covered in this hub.",
        ],
        example: "A stock paying an 8% dividend yield with a 140% payout ratio is a textbook combination worth double-checking — the company is currently paying out more in dividends than it's earning, which typically isn't sustainable without either earnings recovering or the dividend eventually being reduced.",
        tip: "This is deliberately the last topic in Putting It Together — everything else in this hub gives you the pieces; this is the reminder to actually look at more than one number before deciding anything.",
      },
    ],
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

// Generic bar-compare chart — bars.height is a raw px value the caller
// picks to represent the relative sizes being compared (illustrative, not
// pulled from live data — this is conceptual teaching content).
function learnBarCompareVisual(bars, note) {
  const cols = bars.map(b => `
    <div class="learn-bar-col">
      <span class="learn-bar-value">${b.value}</span>
      <div class="learn-bar" style="height:${b.height}px; background:${b.fill};"></div>
      <span class="learn-bar-label">${b.label}</span>
    </div>
  `).join("");
  return `
    <div class="learn-bar-chart">${cols}</div>
    ${note ? `<p class="learn-visual-caption">${note}</p>` : ""}
  `;
}

function learnValuationVisual() {
  return learnBarCompareVisual([
    { value: "$100", label: "Price you pay", height: 100, fill: "var(--accent)" },
    { value: "$4", label: "Earnings you get this year", height: 8, fill: "var(--text-secondary)" },
  ], "That gap is the P/E ratio (here, 25) — years of today's profit to earn back what you paid.");
}

function learnGrowthVisual(note) {
  return learnBarCompareVisual([
    { value: "", label: "Year 1", height: 35, fill: "var(--text-muted)" },
    { value: "", label: "Year 2", height: 55, fill: "var(--text-secondary)" },
    { value: "", label: "Year 3", height: 78, fill: "var(--accent)" },
    { value: "", label: "Year 4", height: 100, fill: "var(--accent-strong)" },
  ], note || "Illustrative — revenue or earnings getting bigger, year after year.");
}

// A vertical chain of steps connected by downward arrows — cause-and-effect
// sequences (e.g. "rates rise" -> "borrowing costs rise" -> ...).
function learnChainVisual(steps) {
  const rows = steps.map((step, i) => `
    <div class="learn-chain-step">${step}</div>
    ${i < steps.length - 1 ? '<div class="learn-chain-arrow">↓</div>' : ""}
  `).join("");
  return `<div class="learn-chain">${rows}</div>`;
}

// Several inputs converging into one output — e.g. multiple indicator
// cards feeding into one summary.
function learnConvergeVisual(inputs, output) {
  const inputEls = inputs.map(label => `<div class="learn-converge-input">${label}</div>`).join("");
  return `
    <div class="learn-converge">
      <div class="learn-converge-inputs">${inputEls}</div>
      <div class="learn-converge-arrow">↓</div>
      <div class="learn-converge-output">${output}</div>
    </div>
  `;
}

// A grid of small dots, `filled` of them accent-colored out of `total` —
// "out of every 100 people" style illustrations.
function learnDotGridVisual(filled, total, label) {
  const dots = Array.from({ length: total }, (_, i) =>
    `<span class="learn-dot${i < filled ? " filled" : ""}"></span>`
  ).join("");
  return `<div class="learn-dot-grid">${dots}</div><p class="learn-visual-caption">${label}</p>`;
}

function learnCallPutVisual() {
  return `
    <div class="learn-two-col">
      <div class="learn-two-col-item">
        <span class="learn-two-col-arrow up">↑</span>
        <strong>CALL</strong>
        <span>Right to BUY at the strike price</span>
      </div>
      <div class="learn-two-col-item">
        <span class="learn-two-col-arrow down">↓</span>
        <strong>PUT</strong>
        <span>Right to SELL at the strike price</span>
      </div>
    </div>
  `;
}

function learnSpeculationHedgeVisual() {
  return `
    <div class="learn-two-col">
      <div class="learn-two-col-item">
        <span class="learn-two-col-icon">🎯</span>
        <strong>Speculation</strong>
        <span>Betting on a price move, smaller upfront cost, bigger % swings</span>
      </div>
      <div class="learn-two-col-item">
        <span class="learn-two-col-icon">🛡️</span>
        <strong>Hedging</strong>
        <span>Protecting a position you already own, like insurance</span>
      </div>
    </div>
  `;
}

function learnStrikeLadderVisual() {
  const rows = [
    { price: "$110", tag: "Out of the money" },
    { price: "$105", tag: "Out of the money" },
    { price: "$100", tag: "Today's price", current: true },
    { price: "$95", tag: "In the money" },
    { price: "$90", tag: "In the money" },
  ];
  const html = rows.map(r => `
    <div class="learn-strike-row${r.current ? " current" : ""}">
      <span class="learn-strike-price">${r.price}</span>
      <span class="learn-strike-tag">${r.tag}</span>
    </div>
  `).join("");
  return `<div class="learn-strike-ladder">${html}</div><p class="learn-visual-caption">A Call's-eye view — strikes above today's price vs. below it</p>`;
}

function learnDiversificationVisual() {
  return `
    <div class="learn-visual-pie-pair">
      <div class="learn-visual-pie">
        <div class="learn-pie-chart" style="background: conic-gradient(var(--accent) 0deg 324deg, var(--bg-surface-2) 324deg 360deg);"></div>
        <span class="learn-visual-caption">Concentrated</span>
      </div>
      <div class="learn-visual-pie">
        <div class="learn-pie-chart" style="background: conic-gradient(var(--accent) 0deg 72deg, var(--accent-strong) 72deg 144deg, var(--text-secondary) 144deg 216deg, var(--text-muted) 216deg 288deg, var(--border) 288deg 360deg);"></div>
        <span class="learn-visual-caption">Diversified</span>
      </div>
    </div>
  `;
}

function learnRiskToleranceVisual() {
  return `
    <div class="learn-spectrum">
      <div class="learn-spectrum-bar"></div>
      <div class="learn-spectrum-labels">
        <span>Need cash soon<br/>Cash / bonds</span>
        <span>10+ years away<br/>Diversified stocks</span>
      </div>
    </div>
  `;
}

function learnChecklistVisual(items) {
  const rows = items.map(item => `<div class="learn-checklist-row"><span class="learn-checklist-icon">⚠</span>${item}</div>`).join("");
  return `<div class="learn-checklist">${rows}</div>`;
}

function learnFunnelVisual() {
  const stages = [
    { label: "Revenue", pct: 100 },
    { label: "− cost of the product = Gross Profit", pct: 70 },
    { label: "− running the business = Operating Profit", pct: 40 },
    { label: "− interest & tax = Net Profit", pct: 22 },
  ];
  const maxWidth = 230;
  const rows = stages.map(s => `
    <div class="learn-funnel-row">
      <div class="learn-funnel-bar" style="width:${Math.round(s.pct / 100 * maxWidth)}px;"></div>
      <span class="learn-funnel-label"><strong>${s.pct}%</strong> ${s.label}</span>
    </div>
  `).join("");
  return `<div class="learn-funnel">${rows}</div><p class="learn-visual-caption">Illustrative $100 of revenue — each stage keeps a smaller share</p>`;
}

function learnTurnoverVisual() {
  return `
    <svg class="learn-visual-svg" viewBox="0 0 160 120" style="max-width:170px" role="img" aria-label="Assets convert into sales, which convert back into assets, in a repeating cycle">
      <defs>
        <marker id="learnCycleArrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="var(--accent)"/>
        </marker>
      </defs>
      <line x1="45" y1="30" x2="45" y2="92" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="115" y1="30" x2="115" y2="92" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="3,3"/>
      <path d="M45,28 A35,12 0 0 1 115,28" fill="none" stroke="var(--accent)" stroke-width="2.5" marker-end="url(#learnCycleArrow)"/>
      <path d="M115,94 A35,12 0 0 1 45,94" fill="none" stroke="var(--accent)" stroke-width="2.5" marker-end="url(#learnCycleArrow)"/>
      <text x="80" y="14" text-anchor="middle" font-size="11" fill="var(--text-primary)" font-weight="700">Assets</text>
      <text x="80" y="118" text-anchor="middle" font-size="11" fill="var(--text-primary)" font-weight="700">Sales</text>
    </svg>
    <p class="learn-visual-caption">Turnover: how many times a year this cycle repeats</p>
  `;
}

function learnDividendVisual() {
  const radii = [7, 9, 11, 13];
  const xs = [30, 78, 126, 174];
  const circles = radii.map((r, i) => `
    <circle cx="${xs[i]}" cy="${80 - r}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    <text x="${xs[i]}" y="${84 - r}" text-anchor="middle" font-size="10" fill="var(--accent)" font-weight="700">$</text>
  `).join("");
  const ticks = xs.map((x, i) => `
    <line x1="${x}" y1="85" x2="${x}" y2="91" stroke="var(--border)" stroke-width="1.5"/>
    <text x="${x}" y="103" text-anchor="middle" font-size="9.5" fill="var(--text-muted)">Q${i + 1}</text>
  `).join("");
  return `
    <svg class="learn-visual-svg" viewBox="0 0 205 110" role="img" aria-label="Four quarterly dividend payments, each slightly larger than the last">
      <line x1="18" y1="85" x2="192" y2="85" stroke="var(--border)" stroke-width="1.5"/>
      ${ticks}${circles}
    </svg>
    <p class="learn-visual-caption">A steady — and here, slowly growing — quarterly cash payment</p>
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
