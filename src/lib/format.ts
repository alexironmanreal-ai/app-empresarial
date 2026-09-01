const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("es-AR");

/**
 * FX solo para *mostrar* montos guardados en USD.
 * El wealth del modelo está en USD reales (poder de compra), no en ARS nominal a 10 años.
 * Ajustá este número cuando quieras alinear la UI al dólar del momento.
 */
export const ARS_PER_USD = 1400;

export function toArs(usdAmount: number) {
  return usdAmount * ARS_PER_USD;
}

export function ars(n: number) {
  return ARS.format(n);
}

/** Cualquier monto guardado en USD → texto en ARS */
export function arsFromUsd(usdAmount: number) {
  return ARS.format(toArs(usdAmount));
}

/** @deprecated alias — siempre ARS */
export function usd(n: number) {
  return arsFromUsd(n);
}

export function usdDec(n: number) {
  return arsFromUsd(n);
}

/** Siempre muestra ARS (ignora el flag de moneda). */
export function money(n: number, _currency?: "USD" | "ARS") {
  return arsFromUsd(n);
}

export function compactUsd(n: number) {
  return compactArs(toArs(n));
}

export function compactArs(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}$ ${(abs / 1_000_000_000).toFixed(1)} B`;
  if (abs >= 1_000_000)
    return `${sign}$ ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)} M`;
  if (abs >= 1000)
    return `${sign}$ ${(abs / 1000).toFixed(abs >= 10_000 ? 0 : 1)} mil`;
  return ars(n);
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
