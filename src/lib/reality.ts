/**
 * Reality layer — números que importan para no morir.
 * No proyecciones de 10 años. Supervivencia y verdad.
 */
import { EXPENSES } from "./data";
import { ARS_PER_USD } from "./format";
import type { CajaRow } from "./store";
import { cajaTotalArs } from "./store";
import { TASKS } from "./data";
import { isTaskComplete } from "./store";

/** Burn mensual estimado en ARS a partir de gastos recurrentes + buffer conservador */
export function estimatedMonthlyBurnArs(extraMonthlyArs = 0): number {
  let monthly = 0;
  for (const e of EXPENSES) {
    const ars = e.usd * ARS_PER_USD;
    if (e.kind === "month") monthly += ars;
    else if (e.kind === "year") monthly += ars / 12;
    // once se ignora para burn recurrente
  }
  // Buffer mínimo de vida (comida, internet, transporte, imprevistos) si no hay gastos cargados
  const floor = 350_000; // ARS/mes — ajustá si hace falta
  return Math.max(monthly + extraMonthlyArs, floor);
}

export function runwayDays(totalArs: number, monthlyBurnArs: number): number {
  if (monthlyBurnArs <= 0) return Infinity;
  if (totalArs <= 0) return 0;
  return Math.floor((totalArs / monthlyBurnArs) * 30);
}

export function runwayLabel(days: number): string {
  if (!Number.isFinite(days)) return "∞";
  if (days <= 0) return "0 días — sin caja";
  if (days < 30) return `${days} días · CRÍTICO`;
  if (days < 90) return `${days} días · atención`;
  if (days < 180) return `${days} días`;
  return `${days} días · cómodo`;
}

export type RealitySnapshot = {
  totalCajaArs: number;
  monthlyBurnArs: number;
  runwayDays: number;
  p0Open: number;
  p0Total: number;
  companyPct: number;
  daysSinceReview: number | null;
  reviewOverdue: boolean;
  survivalTone: "ok" | "warn" | "danger";
};

export function computeReality(
  caja: CajaRow[],
  done: Record<string, boolean>,
  lastReviewAt: string | null,
  companyPct: number,
  extraMonthlyBurnArs = 0,
): RealitySnapshot {
  const totalCajaArs = cajaTotalArs(caja);
  const monthlyBurnArs = estimatedMonthlyBurnArs(extraMonthlyBurnArs);
  const days = runwayDays(totalCajaArs, monthlyBurnArs);

  const p0Tasks = TASKS.filter((t) => t.priority === "p0");
  const p0Open = p0Tasks.filter(
    (t) => !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).length;

  let daysSinceReview: number | null = null;
  let reviewOverdue = false;
  if (lastReviewAt) {
    const then = new Date(lastReviewAt).getTime();
    const now = Date.now();
    daysSinceReview = Math.floor((now - then) / 86_400_000);
    reviewOverdue = daysSinceReview > 7;
  } else {
    reviewOverdue = true;
    daysSinceReview = null;
  }

  let survivalTone: "ok" | "warn" | "danger" = "ok";
  if (days < 30 || p0Open >= 6) survivalTone = "danger";
  else if (days < 90 || p0Open >= 3 || reviewOverdue) survivalTone = "warn";

  return {
    totalCajaArs,
    monthlyBurnArs,
    runwayDays: days,
    p0Open,
    p0Total: p0Tasks.length,
    companyPct,
    daysSinceReview,
    reviewOverdue,
    survivalTone,
  };
}
