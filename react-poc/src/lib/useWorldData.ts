// lib/useWorldData.ts — React hook: the World Bank stores for a set of
// indicators, re-rendering as each one arrives (lib/worldBank.ts).

import { useEffect, useState } from "react";
import { getIndicator, WB_INDICATORS, type WbStore } from "./worldBank";

export function useWorldData(keys: string[] = WB_INDICATORS.map(i => i.key)): Record<string, WbStore | undefined> {
  const [data, setData] = useState<Record<string, WbStore | undefined>>({});
  const joined = keys.join(",");
  useEffect(() => {
    let live = true;
    joined.split(",").forEach(key => {
      getIndicator(key).then(store => { if (live) setData(prev => ({ ...prev, [key]: store })); });
    });
    return () => { live = false; };
  }, [joined]);
  return data;
}
