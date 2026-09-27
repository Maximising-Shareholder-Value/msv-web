import { useCallback, useEffect, useRef, useState } from "react";

// Same backend the live site uses: our own Cloudflare Worker, which holds
// the real API keys so they never reach the browser.
const API_BASE = "https://msv-api.jozsua-heng.workers.dev";

export async function coingecko<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...params, path });
  const res = await fetch(`${API_BASE}/api/coingecko?${qs}`);
  if (!res.ok) throw new Error(res.status === 429 ? "CoinGecko rate limit — try again in a minute" : `CoinGecko error ${res.status}`);
  return res.json() as Promise<T>;
}

// DefiLlama and alternative.me are public and allow browser calls directly.
export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  updatedAt: number | null;
  reload: () => void;
}

/**
 * A "hook": a reusable piece of behaviour any component can plug into.
 * useAsync loads data, tracks loading/error, ignores out-of-date responses
 * (so clicking fast can't show the wrong coin) and can re-fetch on a timer.
 * The vanilla site repeats this pattern by hand in every loadXxx() function.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[], refreshMs?: number): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean; updatedAt: number | null }>({
    data: null, error: null, loading: true, updatedAt: null,
  });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    fetcherRef.current()
      .then(data => { if (!cancelled) setState({ data, error: null, loading: false, updatedAt: Date.now() }); })
      .catch((e: Error) => { if (!cancelled) setState(s => ({ ...s, error: e.message, loading: false })); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(() => setTick(t => t + 1), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  const reload = useCallback(() => setTick(t => t + 1), []);
  return { ...state, reload };
}

/** useState that survives page reloads (saved in the browser's localStorage). */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: fine */ }
  }, [key, value]);
  return [value, setValue] as const;
}

// Finnhub, via the same proxy — real, CORS-open crypto news (same source the
// live vanilla site's Market News card already uses).
export async function finnhubNews(category: string): Promise<import("./types").NewsItem[]> {
  const res = await fetch(`${API_BASE}/api/finnhub?${new URLSearchParams({ path: "/news", category })}`);
  if (!res.ok) throw new Error(`News request failed (${res.status})`);
  return res.json();
}
