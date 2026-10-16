/**
 * Motor de wealth / facturación real.
 * Objetivo: ARS 10.000.000 de facturación cobrada (leads stage cobrado + caja como respaldo operativo).
 */
import { TASKS } from "./data";
import { GAPS } from "./data-meta";
import type { Gap, Task } from "./types";
import { getCachedArsPerUsd } from "./fx";

/** Tipos mínimos — evita import circular con store */
export type WealthCajaRow = { id: string; name: string; ars: number; source?: string };
export type WealthLead = {
  amountArs: number;
  stage: string;
  updatedAt?: string;
  createdAt: string;
  offer?: string;
};

function isTaskComplete(
  taskId: string,
  subtaskIds: string[],
  done: Record<string, boolean>,
): boolean {
  if (done[taskId]) return true;
  if (subtaskIds.length === 0) return false;
  return subtaskIds.every((id) => !!done[id]);
}

/** Meta de facturación cobrada (ARS) */
export const FACTURACION_GOAL_ARS = 10_000_000;

export type WealthSnapshot = {
  facturadoArs: number;
  cajaArs: number;
  pipelineArs: number;
  goalArs: number;
  progress: number;
  pctMissing: number;
  missingArs: number;
  velocity30dArs: number;
  projected12mArs: number;
  nextAction: string;
  curve: { year: number; actual: number; goal: number; reference: number }[];
};

export function cajaTotal(caja: WealthCajaRow[]): number {
  return caja.reduce((a, r) => a + (Number(r.ars) || 0), 0);
}

export function facturadoCobrado(leads: WealthLead[]): number {
  return leads
    .filter((l) => l.stage === "cobrado")
    .reduce((a, l) => a + (Number(l.amountArs) || 0), 0);
}

export function pipelineOpen(leads: WealthLead[]): number {
  return leads
    .filter((l) => l.stage !== "cobrado" && l.stage !== "perdido")
    .reduce((a, l) => a + (Number(l.amountArs) || 0), 0);
}

export function velocityCobradoArs(leads: WealthLead[], days = 30, now = new Date()): number {
  const cut = now.getTime() - days * 86_400_000;
  return leads
    .filter((l) => l.stage === "cobrado")
    .filter((l) => {
      const t = new Date(l.updatedAt || l.createdAt).getTime();
      return t >= cut;
    })
    .reduce((a, l) => a + (Number(l.amountArs) || 0), 0);
}

function nextActionFor(
  progress: number,
  facturado: number,
  pipeline: number,
  caja: number,
  tasksDoneRatio: number,
): string {
  if (progress >= 1) {
    return "Meta de facturación alcanzada. Subí la barra o diversificá (producto / YT / OS).";
  }
  if (facturado === 0 && pipeline === 0) {
    return "Cero cobrado y cero pipeline: esta semana 10 conversaciones de venta (viernes bloque outbound).";
  }
  if (pipeline === 0) {
    return "Sin pipeline abierto: regenerá leads antes de optimizar producto.";
  }
  if (caja < 50_000 && progress < 0.1) {
    return "Caja crítica: cerrá el lead más caliente o bajá burn. Sin oxígeno no hay OS.";
  }
  if (tasksDoneRatio < 0.2) {
    return "Pocas tareas P0/P1 cerradas: sin SAS/factura/cobro estable la facturación no escala.";
  }
  if (pipeline > 0 && facturado === 0) {
    return `Tenés ${Math.round(pipeline).toLocaleString("es-AR")} ARS en pipeline: empujá propuesta → cobrado.`;
  }
  const missing = FACTURACION_GOAL_ARS - facturado;
  return `Te faltan ${Math.round(missing).toLocaleString("es-AR")} ARS (~${Math.round((1 - progress) * 100)}%). Priorizá cerrar pipeline y repetir oferta.`;
}

export function computeWealth(args: {
  caja: WealthCajaRow[];
  leads: WealthLead[];
  done: Record<string, boolean>;
}): WealthSnapshot {
  const facturadoArs = facturadoCobrado(args.leads ?? []);
  const cajaArs = cajaTotal(args.caja ?? []);
  const pipelineArs = pipelineOpen(args.leads ?? []);
  const goalArs = FACTURACION_GOAL_ARS;
  const progress = Math.min(1, facturadoArs / goalArs);
  const pctMissing = Math.round((1 - progress) * 1000) / 10;
  const missingArs = Math.max(0, goalArs - facturadoArs);
  const velocity30dArs = velocityCobradoArs(args.leads ?? [], 30);
  const projected12mArs = facturadoArs + velocity30dArs * 12;

  const p0p1 = TASKS.filter((t) => t.priority === "p0" || t.priority === "p1");
  const p0p1Done = p0p1.filter((t) =>
    isTaskComplete(
      t.id,
      t.subtasks.map((s) => s.id),
      args.done ?? {},
    ),
  ).length;
  const tasksDoneRatio = p0p1.length ? p0p1Done / p0p1.length : 0;

  const annualPace = Math.max(velocity30dArs * 12, facturadoArs > 0 ? facturadoArs : 0);
  const curve = [0, 1, 2, 3, 5, 10].map((year) => {
    const actual =
      year === 0
        ? facturadoArs
        : Math.min(goalArs, facturadoArs + annualPace * year * (0.7 + tasksDoneRatio * 0.5));
    const reference = Math.min(goalArs, annualPace * year);
    return {
      year,
      actual: Math.round(actual),
      goal: goalArs,
      reference: Math.round(reference),
    };
  });

  return {
    facturadoArs,
    cajaArs,
    pipelineArs,
    goalArs,
    progress,
    pctMissing,
    missingArs,
    velocity30dArs,
    projected12mArs: Math.round(projected12mArs),
    nextAction: nextActionFor(progress, facturadoArs, pipelineArs, cajaArs, tasksDoneRatio),
    curve,
  };
}

/** Mapeo gap → tareas reales del tablero */
const GAP_TASK_MAP: Record<string, { taskIds?: string[]; categories?: Task["category"][] }> = {
  "g-legal": { categories: ["legal"] },
  "g-tax": { categories: ["fiscal"] },
  "g-bank": { taskIds: ["bank", "payments", "emergency"] },
  "g-offer": { categories: ["ingresos"] },
  "g-brand": { categories: ["marca"] },
  "g-yt": { categories: ["youtube"] },
  "g-os": { categories: ["os"] },
  "g-gov": { categories: ["ceo"] },
};

/** Etiquetas cortas para charts */
export const GAP_CHART_LABEL: Record<string, string> = {
  "g-legal": "Legal",
  "g-tax": "Fiscal",
  "g-bank": "Caja",
  "g-offer": "Oferta",
  "g-brand": "Marca",
  "g-yt": "YT",
  "g-os": "OS",
  "g-gov": "CEO",
};

export type LiveGap = Gap & {
  pctDone: number;
  status: "open" | "partial" | "done";
  costArs: number;
  paidArs: number;
  missingArs: number;
  relatedCount: number;
  relatedDone: number;
};

const STATUS_ORDER: Record<LiveGap["status"], number> = {
  open: 0,
  partial: 1,
  done: 2,
};

export function liveGaps(done: Record<string, boolean>, arsPerUsd = getCachedArsPerUsd()): LiveGap[] {
  const rate = Number(arsPerUsd) > 0 ? Number(arsPerUsd) : getCachedArsPerUsd();
  const doneMap = done ?? {};

  const rows: LiveGap[] = GAPS.map((g) => {
    const map = GAP_TASK_MAP[g.id] ?? {};
    const related = TASKS.filter((t) => {
      if (map.taskIds?.includes(t.id)) return true;
      if (map.categories?.includes(t.category)) return true;
      return false;
    });
    const relatedDone = related.filter((t) =>
      isTaskComplete(
        t.id,
        t.subtasks.map((s) => s.id),
        doneMap,
      ),
    ).length;
    const relatedCount = related.length;
    const pctDone = relatedCount ? Math.round((relatedDone / relatedCount) * 100) : 0;
    const status: LiveGap["status"] =
      relatedCount === 0
        ? "open"
        : pctDone >= 100
          ? "done"
          : pctDone > 0
            ? "partial"
            : "open";
    const costArs = Math.round((Number(g.costUsd) || 0) * rate);
    const paidArs = Math.round(costArs * (pctDone / 100));
    return {
      ...g,
      pctDone,
      status,
      costArs,
      paidArs,
      missingArs: Math.max(0, costArs - paidArs),
      relatedCount,
      relatedDone,
    };
  });

  return rows.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.area.localeCompare(b.area));
}

export function taskChartFromProgress(task: Task, done: Record<string, boolean>) {
  const ids = task.subtasks.map((s) => s.id);
  const n = ids.length;
  const doneN = n === 0 ? (done[task.id] ? 1 : 0) : ids.filter((id) => done[id]).length;
  const pct = n === 0 ? (done[task.id] ? 1 : 0) : doneN / n;
  const labels = n > 0 ? ids.map((_, i) => `S${i + 1}`) : ["Hecho"];
  return labels.map((label, i) => {
    const stepPct = n > 0 ? (i + 1) / n : 1;
    return {
      label,
      done: pct >= stepPct ? 1 : 0,
      skip: pct >= stepPct ? 0 : 1,
    };
  });
}

export function usdToArs(usd: number, rate = getCachedArsPerUsd()) {
  return usd * rate;
}

export function ageFromBirthDate(birthDate: string, now = new Date()): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  let age = now.getFullYear() - birth.getFullYear();
  const md = now.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function isAdult(birthDate: string): boolean {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age >= 18;
}
