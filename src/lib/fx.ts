/**
 * Cotización USD/ARS en vivo (con caché y fallback).
 * Fuente primaria: dolarapi.com (oficial + blue).
 */

const FALLBACK_ARS_PER_USD = 1400;
const CACHE_KEY = "sentinel-fx-usd-ars";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

export type FxQuote = {
  arsPerUsd: number;
  source: "oficial" | "blue" | "fallback" | "cache";
  fetchedAt: string;
};

type CachePayload = FxQuote & { at: number };

function readCache(): FxQuote | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as CachePayload;
    if (Date.now() - p.at > CACHE_TTL_MS) return null;
    return {
      arsPerUsd: p.arsPerUsd,
      source: "cache",
      fetchedAt: p.fetchedAt,
    };
  } catch {
    return null;
  }
}

function writeCache(q: FxQuote) {
  if (typeof localStorage === "undefined") return;
  try {
    const payload: CachePayload = { ...q, at: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

/** Cotización viva; no tira error — siempre devuelve un número usable */
export async function fetchUsdArs(): Promise<FxQuote> {
  const cached = readCache();
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = (await res.json()) as { venta?: number; compra?: number };
      const rate = Number(j.venta || j.compra);
      if (rate > 0) {
        const q: FxQuote = {
          arsPerUsd: Math.round(rate),
          source: "oficial",
          fetchedAt: new Date().toISOString(),
        };
        writeCache(q);
        return q;
      }
    }
  } catch {
    /* try blue */
  }
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = (await res.json()) as { venta?: number; compra?: number };
      const rate = Number(j.venta || j.compra);
      if (rate > 0) {
        const q: FxQuote = {
          arsPerUsd: Math.round(rate),
          source: "blue",
          fetchedAt: new Date().toISOString(),
        };
        writeCache(q);
        return q;
      }
    }
  } catch {
    /* fallback */
  }
  if (cached) return cached;
  return {
    arsPerUsd: FALLBACK_ARS_PER_USD,
    source: "fallback",
    fetchedAt: new Date().toISOString(),
  };
}

export function getCachedArsPerUsd(): number {
  return readCache()?.arsPerUsd ?? FALLBACK_ARS_PER_USD;
}
