/**
 * Física del founder — números que no mienten + algoritmo de priorización.
 * Estándar: borrar > simplificar > acelerar > automatizar.
 */
import { TASKS } from "./data";
import type { Task } from "./types";
import { activitiesForWeekday, dateKey, dayProgress } from "./tracker";
import type { DaySnapshot } from "./store";
import type { GhCommit } from "./github";

function isTaskComplete(
  taskId: string,
  subtaskIds: string[],
  done: Record<string, boolean>,
): boolean {
  if (done[taskId]) return true;
  if (subtaskIds.length === 0) return false;
  return subtaskIds.every((id) => !!done[id]);
}

export const ALGORITHM_STEPS = [
  {
    id: "req",
    n: 1,
    title: "¿El requisito es físico?",
    detail: "¿Sale de la física del negocio o es herencia / ego / “se ve bien”?",
  },
  {
    id: "delete",
    n: 2,
    title: "¿Se puede borrar?",
    detail: "Si no es necesario para el resultado, elimínalo. No optimices basura.",
  },
  {
    id: "simplify",
    n: 3,
    title: "¿Se puede simplificar?",
    detail: "Menos pasos, menos tools, menos gente en el loop.",
  },
  {
    id: "accelerate",
    n: 4,
    title: "¿Se puede acelerar?",
    detail: "Ciclo más corto: demo, feedback, iteración.",
  },
  {
    id: "automate",
    n: 5,
    title: "¿Se puede automatizar?",
    detail: "Solo después de borrar y simplificar. Automatizar desperdicio multiplica desperdicio.",
  },
] as const;

export function makerHoursToday(
  dayLog: Record<string, Record<string, boolean>>,
  now = new Date(),
): number {
  const key = dateKey(now);
  const progress = dayProgress(key, dayLog);
  // ~6h maker si el día está completo
  return Math.round(progress * 6 * 10) / 10;
}

export function p0OpenCount(done: Record<string, boolean>): number {
  return TASKS.filter(
    (t) =>
      t.priority === "p0" &&
      !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).length;
}

export function runwayMonths(runwayDays: number): number {
  if (!Number.isFinite(runwayDays) || runwayDays <= 0) return 0;
  return Math.round((runwayDays / 30) * 10) / 10;
}

export function killCandidates(
  done: Record<string, boolean>,
  killedTaskIds: string[],
): Task[] {
  const killed = new Set(killedTaskIds);
  return TASKS.filter((t) => {
    if (killed.has(t.id)) return false;
    if (t.priority === "p0") return false;
    if (isTaskComplete(t.id, t.subtasks.map((s) => s.id), done)) return false;
    // candidatos: p2/p3 o impacto bajo
    return t.priority === "p2" || t.priority === "p3" || t.impact <= 5;
  }).slice(0, 12);
}

export function commitsThisWeek(commits: GhCommit[], now = new Date()): number {
  const weekAgo = now.getTime() - 7 * 86_400_000;
  return commits.filter((c) => {
    const t = new Date(c.date).getTime();
    return Number.isFinite(t) && t >= weekAgo;
  }).length;
}

export type FisicaDelDia = {
  makerHours: number;
  p0Open: number;
  runwayDays: number;
  runwayMonths: number;
  commitsWeek: number;
  dayProgress: number;
  weekdayLabel: string;
};

export function computeFisica(args: {
  dayLog: Record<string, Record<string, boolean>>;
  done: Record<string, boolean>;
  runwayDays: number;
  commits: GhCommit[];
  now?: Date;
}): FisicaDelDia {
  const now = args.now ?? new Date();
  const wd = now.getDay();
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return {
    makerHours: makerHoursToday(args.dayLog, now),
    p0Open: p0OpenCount(args.done),
    runwayDays: args.runwayDays,
    runwayMonths: runwayMonths(args.runwayDays),
    commitsWeek: commitsThisWeek(args.commits, now),
    dayProgress: dayProgress(dateKey(now), args.dayLog),
    weekdayLabel: labels[wd] ?? "",
  };
}
