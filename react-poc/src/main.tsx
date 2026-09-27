import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The vanilla site's stylesheet, reused as-is so both versions look the same.
import "../../style.css";
import "./poc.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
