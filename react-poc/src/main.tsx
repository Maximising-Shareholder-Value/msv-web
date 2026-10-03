import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
// The vanilla site's stylesheet, reused as-is so both versions look the same.
import "../../style.css";
import "./poc.css";
import { App } from "./App";
import { SectorsPage } from "./components/SectorsPage";
import { IpoPage } from "./components/IpoPage";
import { NewsPage } from "./components/NewsPage";
import { EtfsPage } from "./components/EtfsPage";
import { PageNav } from "./components/PageNav";

// One build, several pages. The page is picked from the query string
// (?page=sectors, ?page=ipo, ?page=news); anything else shows the Crypto page.
// A query string rather than a path, because the live site's single-page
// fallback would serve the main site's index.html for /react-crypto/sectors.
const page = new URLSearchParams(location.search).get("page");

// The three new pages share a nav bar linking them together.
function Framed({ current, children }: { current: string; children: ReactNode }) {
  return (
    <>
      <PageNav current={current} />
      {children}
    </>
  );
}

function CurrentPage() {
  if (page === "sectors") return <Framed current="sectors"><SectorsPage /></Framed>;
  if (page === "ipo") return <Framed current="ipo"><IpoPage /></Framed>;
  if (page === "news") return <Framed current="news"><NewsPage /></Framed>;
  if (page === "etfs") return <Framed current="etfs"><EtfsPage /></Framed>;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrentPage />
  </StrictMode>,
);
