/**
 * Reality layer — números que importan para no morir.
 * No proyecciones de 10 años. Supervivencia y verdad.
 */
import { EXPENSES, TASKS } from "./data";
import { ARS_PER_USD } from "./format";
import type { CajaRow, DaySnapshot } from "./store";
import { cajaTotalArs, isTaskComplete } from "./store";
import { dateKey, dayProgress } from "./tracker";

/** Inicio del día local (00:00) */
export function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Días calendario entre un ISO y hoy (0 = mismo día local, 1 = ayer, …) */
export function calendarDaysSince(iso: string, now = new Date()): number {
  const then = startOfLocalDay(new Date(iso));
  const today = startOfLocalDay(now);
  return Math.round((today.getTime() - then.getTime()) / 86_400_000);
}

/** Burn mensual estimado en ARS a partir de gastos recurrentes + buffer conservador */
export function estimatedMonthlyBurnArs(extraMonthlyArs = 0): number {
  let monthly = 0;
  for (const e of EXPENSES) {
    const ars = e.usd * ARS_PER_USD;
    if (e.kind === "month") monthly += ars;
    else if (e.kind === "year") monthly += ars / 12;
  }
  const floor = 350_000; // ARS/mes
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

export type RegistroHoyStatus = "sin_registro" | "parcial" | "cerrado";

export type RealitySnapshot = {
  totalCajaArs: number;
  monthlyBurnArs: number;
  runwayDays: number;
  p0Open: number;
  p0Total: number;
  companyPct: number;
  /** Días calendario desde la última review semanal (0 = hoy) */
  daysSinceReview: number | null;
  /** Vencida si nunca o >7 días calendario */
  reviewOverdue: boolean;
  /** Estado del registro diario de HOY */
  registroHoy: RegistroHoyStatus;
  registroHoyProgress: number;
  survivalTone: "ok" | "warn" | "danger";
};

export function computeReality(
  caja: CajaRow[],
  done: Record<string, boolean>,
  lastReviewAt: string | null,
  companyPct: number,
  extraMonthlyBurnArs = 0,
  dayLog: Record<string, Record<string, boolean>> = {},
  daySnapshots: Record<string, DaySnapshot> = {},
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
    daysSinceReview = calendarDaysSince(lastReviewAt);
    reviewOverdue = daysSinceReview > 7;
  } else {
    reviewOverdue = true;
    daysSinceReview = null;
  }

  const today = dateKey(new Date());
  const progress = dayProgress(today, dayLog);
  const hasSnap = !!daySnapshots[today];
  let registroHoy: RegistroHoyStatus = "sin_registro";
  if (hasSnap || progress >= 1) registroHoy = "cerrado";
  else if (progress > 0) registroHoy = "parcial";

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
    registroHoy,
    registroHoyProgress: progress,
    survivalTone,
  };
}

export function reviewLabel(daysSince: number | null): string {
  if (daysSince === null) return "Nunca";
  if (daysSince === 0) return "Hoy";
  if (daysSince === 1) return "Ayer";
  return `${daysSince}d`;
}

export function registroHoyLabel(status: RegistroHoyStatus): string {
  if (status === "cerrado") return "Cerrado";
  if (status === "parcial") return "Parcial";
  return "Sin registro";
}
