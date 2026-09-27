import type { ReactNode } from "react";
import type { AsyncState } from "../lib/api";

/**
 * One shared "loading / error / content" wrapper. In the vanilla site every
 * box hand-writes its own `innerHTML = "Loading…"` and its own error text;
 * here it's written once and every box gets consistent behaviour.
 */
export function Loadable<T>({ state, what, children }: { state: AsyncState<T>; what: string; children: (data: T) => ReactNode }) {
  if (state.data) return <>{children(state.data)}</>;
  if (state.error) {
    return (
      <p className="muted small">
        Couldn't load {what}: {state.error}. <button type="button" className="did-you-know-link" onClick={state.reload}>Retry</button>
      </p>
    );
  }
  return <p className="muted small">Loading {what}…</p>;
}
