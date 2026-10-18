/**
 * Inbox del día: máximo 3 acciones priorizadas por supervivencia y pipeline.
 */
import type { Lead } from "@/lib/store";
import { TASKS } from "@/lib/data";
import { isTaskComplete } from "@/lib/store";

export type HqAction = {
  id: string;
  title: string;
  why: string;
  href: string;
  urgency: "danger" | "warn" | "ok";
};

function todayYmd(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeHqActions(args: {
  runwayDays: number;
  reviewOverdue: boolean;
  registroHoy: string;
  leads: Lead[];
  done: Record<string, boolean>;
  now?: Date;
}): HqAction[] {
  const now = args.now ?? new Date();
  const today = todayYmd(now);
  const out: HqAction[] = [];

  if (Number.isFinite(args.runwayDays) && args.runwayDays < 30) {
    out.push({
      id: "runway",
      title: "Subí caja o bajá burn",
      why: `Runway ${args.runwayDays}d — supervivencia primero`,
      href: "/finanzas",
      urgency: "danger",
    });
  }

  if (args.reviewOverdue) {
    out.push({
      id: "review",
      title: "Cerrar review semanal",
      why: "Vencida — sin review no hay dirección",
      href: "/",
      urgency: "warn",
    });
  }

  if (args.registroHoy === "sin_registro") {
    out.push({
      id: "registro",
      title: "Registrar el día",
      why: "Tracker / Registros vacío",
      href: "/tracker",
      urgency: "warn",
    });
  }

  const openLeads = (args.leads ?? []).filter(
    (l) => l.stage !== "cobrado" && l.stage !== "perdido",
  );
  const due = openLeads
    .filter((l) => l.nextContactAt && l.nextContactAt <= today)
    .sort((a, b) => (a.nextContactAt || "").localeCompare(b.nextContactAt || ""));

  for (const l of due.slice(0, 2)) {
    out.push({
      id: `lead-${l.id}`,
      title: `Contactar ${l.name}`,
      why: `Seguimiento ${l.nextContactAt}${l.offer ? ` · ${l.offer}` : ""}`,
      href: "/pipeline",
      urgency: l.nextContactAt === today ? "warn" : "danger",
    });
  }

  const noDate = openLeads.find((l) => !l.nextContactAt);
  if (noDate && out.length < 3) {
    out.push({
      id: `nodate-${noDate.id}`,
      title: `Agendar ${noDate.name}`,
      why: "Sin fecha de próximo contacto",
      href: "/pipeline",
      urgency: "ok",
    });
  }

  const p0 = TASKS.find(
    (t) =>
      t.priority === "p0" &&
      !isTaskComplete(t.id, t.subtasks.map((s) => s.id), args.done),
  );
  if (p0 && out.length < 3) {
    out.push({
      id: `task-${p0.id}`,
      title: p0.title,
      why: "P0 abierto",
      href: "/tareas",
      urgency: "warn",
    });
  }

  if (openLeads.length === 0 && out.length < 3) {
    out.push({
      id: "pipeline-empty",
      title: "Cargar un lead",
      why: "Sin pipeline no hay ingreso",
      href: "/pipeline",
      urgency: "warn",
    });
  }

  const seen = new Set<string>();
  const unique: HqAction[] = [];
  for (const a of out) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    unique.push(a);
    if (unique.length >= 3) break;
  }
  return unique;
}
