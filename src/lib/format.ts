const USD = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD_DEC = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("es-AR");

export const ARS_PER_USD = 1400;

export function usd(n: number) {
  return USD.format(n);
}

export function usdDec(n: number) {
  return USD_DEC.format(n);
}

export function arsFromUsd(n: number) {
  return ARS.format(n * ARS_PER_USD);
}

export function money(n: number, currency: "USD" | "ARS") {
  return currency === "ARS" ? arsFromUsd(n) : usd(n);
}

export function compactUsd(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}USD ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)} M`;
  if (abs >= 1000) return `${sign}USD ${(abs / 1000).toFixed(abs >= 10_000 ? 0 : 1)} k`;
  return usd(n);
}

export function num(n: number) {
  return NUM.format(n);
}

export function daysLabel(d: number) {
  if (d < 7) return `${d} día${d === 1 ? "" : "s"}`;
  if (d < 30) {
    const w = Math.round(d / 7);
    return `${w} semana${w === 1 ? "" : "s"}`;
  }
  const m = Math.round(d / 30);
  return `${m} mes${m === 1 ? "" : "es"}`;
}

export const PRIORITY_LABEL: Record<string, string> = {
  p0: "P0 · Obligatorio y urgente",
  p1: "P1 · Obligatorio",
  p2: "P2 · Importante",
  p3: "P3 · Después",
};

export const CATEGORY_LABEL: Record<string, string> = {
  legal: "Legal",
  fiscal: "Fiscal",
  marca: "Marca",
  ops: "Operación",
  youtube: "YouTube",
  os: "Sistema operativo",
  ingresos: "Ingresos",
  ceo: "CEO",
};
