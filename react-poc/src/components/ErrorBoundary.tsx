// components/ErrorBoundary.tsx — catches a render-time crash anywhere below it and shows a
// plain message instead of letting React unmount everything above it to a blank white screen
// (the "white screen of death"). Added 2026-10-12 after exactly that happened — no boundary
// existed anywhere in this app before, so a single uncaught error on any page, in any component,
// blanked everything including the sidebar. Used twice in main.tsx: once inside Framed, around
// just a page's own content, so a crash there leaves the sidebar/header/footer intact and
// navigable; once at the true root, around the whole app, as the last resort for a crash in the
// shell itself or on a page that doesn't use Framed (home, explore, stock-analysis, watchlist
// build their own layout inline). Boundaries nest fine — the inner one catches first.

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error("Caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, maxWidth: 560, margin: "0 auto", fontFamily: "sans-serif" }}>
          <h2 style={{ marginBottom: 8 }}>Something went wrong on this page</h2>
          <p className="muted small" style={{ marginBottom: 16 }}>
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            className="cp-btn cp-btn-ghost"
            onClick={() => { this.setState({ error: null }); location.reload(); }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
