// lib/limit.ts — a small concurrency limiter: at most `max` calls to `fn` run at once, any
// more queue up and run as earlier ones finish. Extracted 2026-10-12 from lib/worldBank.ts and
// lib/secForm4.ts, which had copy-pasted the exact same block (the World Bank and SEC EDGAR
// both throttle bursts, independently of each other). lib/finnhub.ts has a differently-shaped
// one-at-a-time-with-a-fixed-gap queue (Finnhub's per-minute limit needs real time spacing, not
// just a concurrency cap) — left as its own thing rather than forced into this shape.

export function createLimiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return function limited<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        active++;
        try { resolve(await fn()); }
        catch (e) { reject(e); }
        finally { active--; waiting.shift()?.(); }
      };
      if (active < max) run(); else waiting.push(run);
    });
  };
}
