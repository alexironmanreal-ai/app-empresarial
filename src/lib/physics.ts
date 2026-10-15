/**
 * Física del founder — números que no mienten + algoritmo de priorización.
 * Estándar: borrar > simplificar > acelerar > automatizar.
 */
import { TASKS } from "./data";
import type { Task } from "./types";
import { isTaskComplete } from "./store";
import { activitiesForWeekday, dateKey, dayProgress } from "./tracker";
import type { DaySnapshot } from "./store";
import type { GhCommit } from "./github";

export const ALGORITHM_STEPS = [
  {
    id: "req",
    n: 1,
    title: "¿El requisito es físico?",
    detail: "¿Sale de la física del negocio o es herencia / ego / se ve bien?",
  },
  {
    id: "delete",
    n: 2,
    title: "¿Se puede borrar?",
    detail: "Si nadie lo nota en 30 días, no existe. Kill.",
  },
  {
    id: "simplify",
    n: 3,
    title: "¿Se puede simplificar?",
    detail: "Mitad de pasos, mitad de tools, un solo entregable.",
  },
  {
    id: "accelerate",
    n: 4,
    title: "¿Se puede acelerar?",
    detail: "¿Qué bloquea el camino crítico? Cortalo esta semana.",
  },
  {
    id: "automate",
    n: 5,
    title: "¿Se puede automatizar?",
    detail: "Solo después de borrar y simplificar. No automatizar basura.",
  },
] as const;

/** Horas maker estimadas hoy desde el tracker (actividades con hours) */
export function makerHoursToday(
  dayLog: Record<string, Record<string, boolean>>,
  now = new Date(),
): { planned: number; done: number; pct: number } {
  const key = dateKey(now);
  const acts = activitiesForWeekday(now.getDay());
  const log = dayLog[key] ?? {};
  let planned = 0;
  let done = 0;
  for (const a of acts) {
    const h = a.hours ?? 0;
    planned += h;
    if (log[a.id]) done += h;
  }
  const pct = planned > 0 ? done / planned : dayProgress(key, dayLog);
  return { planned, done, pct };
}

export function p0OpenCount(done: Record<string, boolean>): number {
  return TASKS.filter(
    (t) =>
      t.priority === "p0" &&
      !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).length;
}

export function runwayMonths(runwayDays: number): number {
  if (!Number.isFinite(runwayDays)) return Infinity;
  return Math.round((runwayDays / 30) * 10) / 10;
}

/** Tareas abiertas de bajo impacto → candidatas a kill */
export function killCandidates(
  done: Record<string, boolean>,
  killedIds: string[],
  _staleDays = 30,
): Task[] {
  const killed = new Set(killedIds);
  return TASKS.filter((t) => {
    if (killed.has(t.id)) return false;
    if (isTaskComplete(t.id, t.subtasks.map((s) => s.id), done)) return false;
    if (t.priority === "p0") return false;
    if (t.priority === "p3") return true;
    if (t.priority === "p2" && t.days >= 60) return true;
    return t.impact <= 5 && t.days >= 30;
  }).slice(0, 12);
}

export function commitsThisWeek(commits: GhCommit[], now = new Date()): number {
  const weekAgo = now.getTime() - 7 * 86_400_000;
  return commits.filter((c) => {
    const t = new Date(c.date).getTime();
    return t >= weekAgo;
  }).length;
}

export type FisicaDelDia = {
  makerHoursDone: number;
  makerHoursPlanned: number;
  makerPct: number;
  cajaArs: number;
  runwayDays: number;
  p0Open: number;
  dayProgressPct: number;
  commitsWeek: number;
};

export function computeFisica(args: {
  dayLog: Record<string, Record<string, boolean>>;
  totalCajaArs: number;
  runwayDays: number;
  done: Record<string, boolean>;
  ghCommits: GhCommit[];
  daySnapshots: Record<string, DaySnapshot>;
}): FisicaDelDia {
  const maker = makerHoursToday(args.dayLog);
  const key = dateKey(new Date());
  return {
    makerHoursDone: maker.done,
    makerHoursPlanned: maker.planned,
    makerPct: maker.pct,
    cajaArs: args.totalCajaArs,
    runwayDays: args.runwayDays,
    p0Open: p0OpenCount(args.done),
    dayProgressPct: dayProgress(key, args.dayLog),
    commitsWeek: commitsThisWeek(args.ghCommits),
  };
}
