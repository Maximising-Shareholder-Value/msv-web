// data/countries.ts — the 42 tracked countries (world map, Market Data page, ETF
// country categories). Copied verbatim from ../../countries.js. Keep in step
// with that file until the vanilla pages are retired.

export const COUNTRY_GROUPS = [
  { id: "brics", label: "BRICS", blurb: "Brazil, Russia, India, China, South Africa plus Egypt, Ethiopia, Iran, UAE and Indonesia" },
  { id: "developed", label: "Developed", blurb: "Advanced economies with deep, liquid markets" },
  { id: "emerging", label: "Emerging", blurb: "Fast-growing markets with developing financial systems" },
  { id: "frontier", label: "Frontier & standalone", blurb: "Smaller or less-accessible markets" },
];

export const COUNTRIES = [
  // ---- Developed ----
  { iso2: "US", iso3: "USA", name: "United States", flag: "🇺🇸", group: "developed", g7: true, city: "New York", ex: "NYSE / Nasdaq", tz: "America/New_York", open: "09:30", close: "16:00", lat: 40.71, lon: -74.01, etf: "SPY", label: { dx: 10, dy: 13, anchor: "start" } },
  { iso2: "CA", iso3: "CAN", name: "Canada", flag: "🇨🇦", group: "developed", g7: true, city: "Toronto", ex: "Toronto Stock Exchange", tz: "America/Toronto", open: "09:30", close: "16:00", lat: 43.65, lon: -79.38, etf: "EWC", label: { dx: -12, dy: -12, anchor: "end" } },
  { iso2: "GB", iso3: "GBR", name: "United Kingdom", flag: "🇬🇧", group: "developed", g7: true, city: "London", ex: "London Stock Exchange", tz: "Europe/London", open: "08:00", close: "16:30", lat: 51.51, lon: -0.13, etf: "EWU", label: { dx: -12, dy: -6, anchor: "end" } },
  { iso2: "FR", iso3: "FRA", name: "France", flag: "🇫🇷", group: "developed", g7: true, city: "Paris", ex: "Euronext Paris", tz: "Europe/Paris", open: "09:00", close: "17:30", lat: 48.86, lon: 2.35, etf: "EWQ", label: { dx: -12, dy: 14, anchor: "end" } },
  { iso2: "DE", iso3: "DEU", name: "Germany", flag: "🇩🇪", group: "developed", g7: true, city: "Frankfurt", ex: "Deutsche Börse (Xetra)", tz: "Europe/Berlin", open: "09:00", close: "17:30", lat: 50.11, lon: 8.68, etf: "EWG", label: { dx: 12, dy: -6, anchor: "start" } },
  { iso2: "IT", iso3: "ITA", name: "Italy", flag: "🇮🇹", group: "developed", g7: true, city: "Milan", ex: "Borsa Italiana", tz: "Europe/Rome", open: "09:00", close: "17:30", lat: 45.46, lon: 9.19, etf: "EWI" },
  { iso2: "JP", iso3: "JPN", name: "Japan", flag: "🇯🇵", group: "developed", g7: true, city: "Tokyo", ex: "Tokyo Stock Exchange", tz: "Asia/Tokyo", open: "09:00", close: "15:30", lat: 35.68, lon: 139.65, etf: "EWJ", label: { dx: 12, dy: -2, anchor: "start" } },
  { iso2: "AU", iso3: "AUS", name: "Australia", flag: "🇦🇺", group: "developed", city: "Sydney", ex: "Australian Securities Exchange", tz: "Australia/Sydney", open: "10:00", close: "16:00", lat: -33.87, lon: 151.21, etf: "EWA", label: { dx: 12, dy: 16, anchor: "start" } },
  { iso2: "CH", iso3: "CHE", name: "Switzerland", flag: "🇨🇭", group: "developed", city: "Zurich", ex: "SIX Swiss Exchange", tz: "Europe/Zurich", open: "09:00", close: "17:30", lat: 47.38, lon: 8.54, etf: "EWL" },
  { iso2: "NL", iso3: "NLD", name: "Netherlands", flag: "🇳🇱", group: "developed", city: "Amsterdam", ex: "Euronext Amsterdam", tz: "Europe/Amsterdam", open: "09:00", close: "17:30", lat: 52.37, lon: 4.9, etf: "EWN" },
  { iso2: "ES", iso3: "ESP", name: "Spain", flag: "🇪🇸", group: "developed", city: "Madrid", ex: "Bolsas y Mercados (BME)", tz: "Europe/Madrid", open: "09:00", close: "17:30", lat: 40.42, lon: -3.7, etf: "EWP" },
  { iso2: "SE", iso3: "SWE", name: "Sweden", flag: "🇸🇪", group: "developed", city: "Stockholm", ex: "Nasdaq Stockholm", tz: "Europe/Stockholm", open: "09:00", close: "17:30", lat: 59.33, lon: 18.07, etf: "EWD" },
  { iso2: "NO", iso3: "NOR", name: "Norway", flag: "🇳🇴", group: "developed", city: "Oslo", ex: "Oslo Børs", tz: "Europe/Oslo", open: "09:00", close: "16:20", lat: 59.91, lon: 10.75, etf: "NORW" },
  { iso2: "SG", iso3: "SGP", name: "Singapore", flag: "🇸🇬", group: "developed", city: "Singapore", ex: "Singapore Exchange", tz: "Asia/Singapore", open: "09:00", close: "17:00", lat: 1.35, lon: 103.82, etf: "EWS", label: { dx: 12, dy: 8, anchor: "start" } },
  { iso2: "HK", iso3: "HKG", name: "Hong Kong", flag: "🇭🇰", group: "developed", city: "Hong Kong", ex: "Hong Kong Exchanges", tz: "Asia/Hong_Kong", open: "09:30", close: "16:00", lat: 22.32, lon: 114.17, etf: "EWH", label: { dx: -12, dy: 16, anchor: "end" } },

  // ---- BRICS ----
  { iso2: "BR", iso3: "BRA", name: "Brazil", flag: "🇧🇷", group: "brics", brics: "founding", city: "São Paulo", ex: "B3", tz: "America/Sao_Paulo", open: "10:00", close: "17:00", lat: -23.55, lon: -46.63, etf: "EWZ", label: { dx: 12, dy: 12, anchor: "start" } },
  { iso2: "RU", iso3: "RUS", name: "Russia", flag: "🇷🇺", group: "brics", brics: "founding", city: "Moscow", ex: "Moscow Exchange", tz: "Europe/Moscow", open: "10:00", close: "18:50", lat: 55.75, lon: 37.62, note: "No US-listed country ETF is available (sanctions-era delistings) — macro data only." },
  { iso2: "IN", iso3: "IND", name: "India", flag: "🇮🇳", group: "brics", brics: "founding", city: "Mumbai", ex: "National Stock Exchange", tz: "Asia/Kolkata", open: "09:15", close: "15:30", lat: 19.08, lon: 72.88, etf: "INDA", label: { dx: -12, dy: 8, anchor: "end" } },
  { iso2: "CN", iso3: "CHN", name: "China", flag: "🇨🇳", group: "brics", brics: "founding", city: "Shanghai", ex: "Shanghai Stock Exchange", tz: "Asia/Shanghai", open: "09:30", close: "15:00", lat: 31.23, lon: 121.47, etf: "MCHI", label: { dx: -12, dy: 4, anchor: "end" } },
  { iso2: "ZA", iso3: "ZAF", name: "South Africa", flag: "🇿🇦", group: "brics", brics: "founding", city: "Johannesburg", ex: "Johannesburg Stock Exchange", tz: "Africa/Johannesburg", open: "09:00", close: "17:00", lat: -26.2, lon: 28.05, etf: "EZA", label: { dx: 12, dy: 14, anchor: "start" } },
  { iso2: "EG", iso3: "EGY", name: "Egypt", flag: "🇪🇬", group: "brics", brics: "joined 2024", city: "Cairo", ex: "Egyptian Exchange", tz: "Africa/Cairo", open: "10:00", close: "14:30", days: [0, 1, 2, 3, 4], lat: 30.04, lon: 31.24, note: "The US-listed Egypt ETF (EGPT) has been delisted, so no live index proxy is available — macro data and exchange hours only." },
  { iso2: "ET", iso3: "ETH", name: "Ethiopia", flag: "🇪🇹", group: "brics", brics: "joined 2024", city: "Addis Ababa", lat: 9.03, lon: 38.74, note: "No liquid US-listed ETF or exchange session tracked here — macro data only." },
  { iso2: "IR", iso3: "IRN", name: "Iran", flag: "🇮🇷", group: "brics", brics: "joined 2024", city: "Tehran", lat: 35.69, lon: 51.39, note: "No US-listed ETF is available — macro data only." },
  { iso2: "AE", iso3: "ARE", name: "United Arab Emirates", flag: "🇦🇪", group: "brics", brics: "joined 2024", city: "Dubai", ex: "Dubai Financial Market / ADX", tz: "Asia/Dubai", open: "10:00", close: "15:00", lat: 25.2, lon: 55.27, etf: "UAE" },
  { iso2: "ID", iso3: "IDN", name: "Indonesia", flag: "🇮🇩", group: "brics", brics: "joined 2025", city: "Jakarta", ex: "Indonesia Stock Exchange", tz: "Asia/Jakarta", open: "09:00", close: "15:50", lat: -6.21, lon: 106.85, etf: "EIDO", label: { dx: -10, dy: 20, anchor: "end" } },

  // ---- Emerging ----
  { iso2: "MX", iso3: "MEX", name: "Mexico", flag: "🇲🇽", group: "emerging", city: "Mexico City", ex: "Bolsa Mexicana (BMV)", tz: "America/Mexico_City", open: "08:30", close: "15:00", lat: 19.43, lon: -99.13, etf: "EWW" },
  { iso2: "TR", iso3: "TUR", name: "Türkiye", flag: "🇹🇷", group: "emerging", city: "Istanbul", ex: "Borsa Istanbul", tz: "Europe/Istanbul", open: "10:00", close: "18:00", lat: 41.01, lon: 28.98, etf: "TUR" },
  { iso2: "KR", iso3: "KOR", name: "South Korea", flag: "🇰🇷", group: "emerging", city: "Seoul", ex: "Korea Exchange", tz: "Asia/Seoul", open: "09:00", close: "15:30", lat: 37.57, lon: 126.98, etf: "EWY" },
  { iso2: "TW", iso3: "TWN", name: "Taiwan", flag: "🇹🇼", group: "emerging", city: "Taipei", ex: "Taiwan Stock Exchange", tz: "Asia/Taipei", open: "09:00", close: "13:30", lat: 25.03, lon: 121.57, etf: "EWT", note: "World Bank doesn't publish country data for Taiwan, so only market data is shown." },
  { iso2: "TH", iso3: "THA", name: "Thailand", flag: "🇹🇭", group: "emerging", city: "Bangkok", ex: "Stock Exchange of Thailand", tz: "Asia/Bangkok", open: "10:00", close: "16:30", lat: 13.76, lon: 100.5, etf: "THD" },
  { iso2: "MY", iso3: "MYS", name: "Malaysia", flag: "🇲🇾", group: "emerging", city: "Kuala Lumpur", ex: "Bursa Malaysia", tz: "Asia/Kuala_Lumpur", open: "09:00", close: "17:00", lat: 3.14, lon: 101.69, etf: "EWM" },
  { iso2: "PH", iso3: "PHL", name: "Philippines", flag: "🇵🇭", group: "emerging", city: "Manila", ex: "Philippine Stock Exchange", tz: "Asia/Manila", open: "09:30", close: "15:30", lat: 14.6, lon: 120.98, etf: "EPHE" },
  { iso2: "PL", iso3: "POL", name: "Poland", flag: "🇵🇱", group: "emerging", city: "Warsaw", ex: "Warsaw Stock Exchange", tz: "Europe/Warsaw", open: "09:00", close: "17:00", lat: 52.23, lon: 21.01, etf: "EPOL" },
  { iso2: "CL", iso3: "CHL", name: "Chile", flag: "🇨🇱", group: "emerging", city: "Santiago", ex: "Santiago Stock Exchange", tz: "America/Santiago", open: "09:30", close: "16:00", lat: -33.45, lon: -70.67, etf: "ECH" },
  { iso2: "CO", iso3: "COL", name: "Colombia", flag: "🇨🇴", group: "emerging", city: "Bogotá", ex: "Bolsa de Valores de Colombia", tz: "America/Bogota", open: "09:30", close: "16:00", lat: 4.71, lon: -74.07, note: "No live US-listed Colombia ETF is available (GXG is delisted) — macro data and exchange hours only." },
  { iso2: "PE", iso3: "PER", name: "Peru", flag: "🇵🇪", group: "emerging", city: "Lima", lat: -12.05, lon: -77.04, etf: "EPU" },
  { iso2: "SA", iso3: "SAU", name: "Saudi Arabia", flag: "🇸🇦", group: "emerging", city: "Riyadh", ex: "Saudi Exchange (Tadawul)", tz: "Asia/Riyadh", open: "10:00", close: "15:00", days: [0, 1, 2, 3, 4], lat: 24.71, lon: 46.68, etf: "KSA", note: "Invited to join BRICS in 2023; its membership status has been unclear, so it's listed as Emerging." },
  { iso2: "QA", iso3: "QAT", name: "Qatar", flag: "🇶🇦", group: "emerging", city: "Doha", ex: "Qatar Stock Exchange", tz: "Asia/Qatar", open: "09:30", close: "13:15", days: [0, 1, 2, 3, 4], lat: 25.29, lon: 51.53, etf: "QAT" },

  // ---- Frontier & standalone ----
  { iso2: "VN", iso3: "VNM", name: "Vietnam", flag: "🇻🇳", group: "frontier", city: "Ho Chi Minh City", ex: "Ho Chi Minh Stock Exchange", tz: "Asia/Ho_Chi_Minh", open: "09:00", close: "15:00", lat: 10.82, lon: 106.63, etf: "VNM" },
  { iso2: "NG", iso3: "NGA", name: "Nigeria", flag: "🇳🇬", group: "frontier", city: "Lagos", ex: "Nigerian Exchange", tz: "Africa/Lagos", open: "10:00", close: "14:30", lat: 6.52, lon: 3.38, note: "The US-listed Nigeria ETF (NGE) has been delisted, so no live index proxy is available — macro data and exchange hours only." },
  { iso2: "AR", iso3: "ARG", name: "Argentina", flag: "🇦🇷", group: "frontier", city: "Buenos Aires", ex: "Bolsas y Mercados Argentinos", tz: "America/Argentina/Buenos_Aires", open: "11:00", close: "17:00", lat: -34.6, lon: -58.38, etf: "ARGT" },
];
