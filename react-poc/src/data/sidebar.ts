// data/sidebar.ts — the sidebar's groups and items, generated from index.html's
// static sidebar markup (labels, data-nav keys and the inline SVG icons).
// Regenerate if the sidebar in index.html changes.

export interface SidebarItem { nav: string; label: string; icon: string }

export const SIDEBAR_GROUPS: SidebarItem[][] = [
  [
    { nav: "create-account", label: "Create Free Account", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><circle cx=\"8\" cy=\"6.3\" r=\"2.6\"/><path d=\"M3.3,16 C3.3,12.2 5.6,10.5 8,10.5 C8.9,10.5 9.7,10.7 10.4,11.2\"/><line x1=\"16\" y1=\"4\" x2=\"16\" y2=\"9\"/><line x1=\"13.5\" y1=\"6.5\" x2=\"18.5\" y2=\"6.5\"/></svg></span>" },
    { nav: "login", label: "Log In", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M9,3.3 H5.5 a1,1 0 0 0 -1,1 V15.7 a1,1 0 0 0 1,1 H9\"/><line x1=\"8\" y1=\"10\" x2=\"17\" y2=\"10\"/><polyline points=\"13.3,6.3 17,10 13.3,13.7\"/></svg></span>" },
    { nav: "explore-products", label: "Explore Products", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"7.3\"/><polygon points=\"12.3,7.7 9.2,9.2 7.7,12.3 10.8,10.8\"/></svg></span>" },
    { nav: "premium", label: "Premium", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><polygon points=\"4,7.5 7,3.5 13,3.5 16,7.5 10,16\"/><line x1=\"4\" y1=\"7.5\" x2=\"16\" y2=\"7.5\"/><line x1=\"7\" y1=\"3.5\" x2=\"10\" y2=\"7.5\"/><line x1=\"13\" y1=\"3.5\" x2=\"10\" y2=\"7.5\"/></svg></span>" },
  ],
  [
    { nav: "ai", label: "Ask $MSV AI Anaiyst", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M2.6,16.6 L9.6,3.8 L16.6,16.6\"/><line x1=\"5.5\" y1=\"12\" x2=\"13.7\" y2=\"12\"/><polyline points=\"12.6,5.6 16.4,3.6 15.9,7.6\"/></svg></span>" },
  ],
  [
    { nav: "home", label: "Home", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M3,10 L10,4 L17,10\"/><path d=\"M5,9 V16.5 H15 V9\"/></svg></span>" },
    { nav: "stock-analysis", label: "Stock Analysis", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\" stroke-width=\"2.2\"><line x1=\"5\" y1=\"17\" x2=\"5\" y2=\"11\"/><line x1=\"10\" y1=\"17\" x2=\"10\" y2=\"7\"/><line x1=\"15\" y1=\"17\" x2=\"15\" y2=\"4\"/></svg></span>" },
    { nav: "stock-screener", label: "Screener", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M3,4 H17 L12,10.5 V16 L8,14 V10.5 Z\"/></svg></span>" },
    { nav: "market-data", label: "Market Data", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M10,17 C10,17 15,11.3 15,7.5 A5,5 0 0 0 5,7.5 C5,11.3 10,17 10,17 Z\"/><circle cx=\"10\" cy=\"7.5\" r=\"2\"/></svg></span>" },
    { nav: "market-news", label: "Market News", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><rect x=\"3\" y=\"5\" width=\"14\" height=\"11\" rx=\"1.2\"/><line x1=\"6\" y1=\"8.2\" x2=\"14\" y2=\"8.2\"/><line x1=\"6\" y1=\"11\" x2=\"14\" y2=\"11\"/><line x1=\"6\" y1=\"13.6\" x2=\"11\" y2=\"13.6\"/></svg></span>" },
    { nav: "learn", label: "Learn", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M10,4 L18,8 L10,12 L2,8 Z\"/><path d=\"M5.5,9.4 V13.2 C5.5,14.7 7.5,15.7 10,15.7 C12.5,15.7 14.5,14.7 14.5,13.2 V9.4\"/></svg></span>" },
    { nav: "sectors", label: "Sectors", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><rect x=\"3\" y=\"3\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"11\" y=\"3\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"3\" y=\"11\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"11\" y=\"11\" width=\"6\" height=\"6\" rx=\"1\"/></svg></span>" },
    { nav: "market-intelligence", label: "Market Intelligence", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><circle cx=\"5\" cy=\"6\" r=\"2.1\"/><circle cx=\"15\" cy=\"6\" r=\"2.1\"/><circle cx=\"10\" cy=\"15\" r=\"2.1\"/><line x1=\"7\" y1=\"6\" x2=\"12.9\" y2=\"6\"/><line x1=\"6.2\" y1=\"7.7\" x2=\"8.9\" y2=\"13.2\"/><line x1=\"13.8\" y1=\"7.7\" x2=\"11.1\" y2=\"13.2\"/></svg></span>" },
    { nav: "etfs", label: "ETFs", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M10,3 L17,6.5 V13.5 L10,17 L3,13.5 V6.5 Z\"/><path d=\"M3,6.5 L10,10 L17,6.5\"/><line x1=\"10\" y1=\"10\" x2=\"10\" y2=\"17\"/></svg></span>" },
    { nav: "performance", label: "Performance", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><polyline points=\"3,15 8,9 12,12 17,5\"/><polyline points=\"12.3,5 17,5 17,9.7\"/></svg></span>" },
    { nav: "macro", label: "Macro", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"7.3\"/><ellipse cx=\"10\" cy=\"10\" rx=\"3.1\" ry=\"7.3\"/><line x1=\"2.7\" y1=\"10\" x2=\"17.3\" y2=\"10\"/></svg></span>" },
  ],
  [
    { nav: "crypto", label: "Crypto", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"7.3\"/><path d=\"M12.6,7.9 C12.6,6.8 11.5,6.1 10,6.1 C8.4,6.1 7.3,6.9 7.3,7.9 C7.3,10.1 12.6,9.6 12.6,12 C12.6,13.1 11.5,13.9 10,13.9 C8.5,13.9 7.4,13.2 7.4,12.1\" /><line x1=\"10\" y1=\"4.6\" x2=\"10\" y2=\"6.1\"/><line x1=\"10\" y1=\"13.9\" x2=\"10\" y2=\"15.4\"/></svg></span>" },
    { nav: "bitcoin-cycles", label: "Crypto Cycles", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M2.5,15 C2.5,8 6.5,3.3 10,3.3 C13.5,3.3 17.5,8 17.5,15\" stroke-width=\"1.6\"/><path d=\"M4.3,15 C4.3,9 7.5,5.1 10,5.1 C12.5,5.1 15.7,9 15.7,15\" stroke-width=\"1.6\"/><path d=\"M6.1,15 C6.1,10 8.5,6.9 10,6.9 C11.5,6.9 13.9,10 13.9,15\" stroke-width=\"1.6\"/></svg></span>" },
    { nav: "crypto-news", label: "Crypto News", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><rect x=\"3\" y=\"5\" width=\"14\" height=\"11\" rx=\"1.2\"/><line x1=\"6\" y1=\"8.2\" x2=\"14\" y2=\"8.2\"/><line x1=\"6\" y1=\"11\" x2=\"14\" y2=\"11\"/><line x1=\"6\" y1=\"13.6\" x2=\"11\" y2=\"13.6\"/></svg></span>" },
  ],
  [
    { nav: "prediction-markets", label: "Prediction Markets", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><rect x=\"3\" y=\"4\" width=\"14\" height=\"12\" rx=\"1.5\"/><line x1=\"11.5\" y1=\"4\" x2=\"11.5\" y2=\"16\"/></svg></span>" },
  ],
  [
    { nav: "portfolio-builder", label: "Portfolio Builder", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><rect x=\"4\" y=\"13\" width=\"12\" height=\"3.3\" rx=\"0.6\"/><rect x=\"4\" y=\"8.4\" width=\"12\" height=\"3.3\" rx=\"0.6\"/><rect x=\"4\" y=\"3.8\" width=\"12\" height=\"3.3\" rx=\"0.6\"/></svg></span>" },
    { nav: "watchlist", label: "Watchlist", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\" class=\"app-nav-icon-filled\"><polygon points=\"10,3 12.2,7.8 17.5,8.4 13.6,11.9 14.7,17.2 10,14.5 5.3,17.2 6.4,11.9 2.5,8.4 7.8,7.8\"/></svg></span>" },
    { nav: "portfolio-health-check", label: "Portfolio Health Check", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><path d=\"M10,16.3 C10,16.3 3.2,12 3.2,7.6 C3.2,5.2 5.1,3.7 7.1,3.7 C8.5,3.7 9.5,4.5 10,5.4 C10.5,4.5 11.5,3.7 12.9,3.7 C14.9,3.7 16.8,5.2 16.8,7.6 C16.8,12 10,16.3 10,16.3 Z\"/><polyline points=\"5.3,9.5 8,9.5 9,7.2 11,11.8 12,9.5 14.7,9.5\"/></svg></span>" },
    { nav: "compare", label: "Compare", icon: "<span class=\"app-nav-icon\"><svg viewBox=\"0 0 20 20\"><line x1=\"10\" y1=\"3\" x2=\"10\" y2=\"16\"/><line x1=\"4\" y1=\"6.2\" x2=\"16\" y2=\"6.2\"/><path d=\"M4,6.2 L1.6,11 A2.4,2.4 0 0 0 6.4,11 Z\"/><path d=\"M16,6.2 L13.6,11 A2.4,2.4 0 0 0 18.4,11 Z\"/><line x1=\"7\" y1=\"16.6\" x2=\"13\" y2=\"16.6\"/></svg></span>" },
  ],
];
