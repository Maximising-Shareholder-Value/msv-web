import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The vanilla site's stylesheet, reused as-is so both versions look the same.
import "../../style.css";
import "./poc.css";
import { App } from "./App";
import { SectorsPage } from "./components/SectorsPage";

// One build, two pages: ?page=sectors shows the Sectors page; anything else
// shows the Crypto page as before. A query string is used rather than a path
// because the live site's single-page fallback would serve the main site's
// index.html for /react-crypto/sectors.
const page = new URLSearchParams(location.search).get("page");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page === "sectors" ? <SectorsPage /> : <App />}
  </StrictMode>,
);
