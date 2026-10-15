import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TASKS } from "@/lib/data";
import { CATEGORY_LABEL } from "@/lib/format";
import { companyScore, isTaskComplete, useHq } from "@/lib/store";
import type { Category, Priority } from "@/lib/types";
import { TaskPanel } from "@/components/task-panel";
import { ChartShell, CompareArea } from "@/components/chart-block";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/tareas")({ component: Tareas });

const PRIOS: { id: Priority | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "p0", label: "P0 urgente" },
  { id: "p1", label: "P1" },
  { id: "p2", label: "P2" },
  { id: "p3", label: "P3" },
];

const CATS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  ...(["legal", "fiscal", "marca", "ops", "ingresos", "youtube", "os", "ceo"] as Category[]).map(
    (id) => ({ id, label: CATEGORY_LABEL[id] }),
  ),
];

function Tareas() {
  const done = useHq((s) => s.done);
  const killedTaskIds = useHq((s) => s.killedTaskIds);
  const focusP0 = useHq((s) => s.focusP0);
  const setFocusP0 = useHq((s) => s.setFocusP0);
  const [prio, setPrio] = useState<Priority | "all">("all");
  const [cat, setCat] = useState<Category | "all">("all");
  const [hideDone, setHideDone] = useState(false);
  const score = companyScore(done);

  const list = useMemo(() => {
    return TASKS.filter((t) => {
      if (focusP0 && t.priority !== "p0") return false;
      if (!focusP0 && prio !== "all" && t.priority !== prio) return false;
      if (cat !== "all" && t.category !== cat) return false;
      if (hideDone && isTaskComplete(t.id, t.subtasks.map((s) => s.id), done)) return false;
      if (killedTaskIds.includes(t.id)) return false;
      return true;
    });
  }, [prio, cat, hideDone, done, focusP0, killedTaskIds]);

  const byPrio = (["p0", "p1", "p2", "p3"] as Priority[]).map((p) => {
    const items = TASKS.filter((t) => t.priority === p);
    const closed = items.filter((t) =>
      isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
    ).length;
    return { label: p.toUpperCase(), done: closed, skip: items.length - closed };
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          De obligatorio a después
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Tablero</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {TASKS.length} tareas. P0 es lo que falta para que exista la empresa. El resto es crecimiento.
        </p>
      </header>

      <ChartShell title="Cierre por prioridad" caption="P0 no se negocia." height={200}>
        <CompareArea data={byPrio} doneName="Cerrado" skipName="Abierto" />
      </ChartShell>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={focusP0 ? "default" : "secondary"} onClick={() => setFocusP0(!focusP0)}>
            {focusP0 ? "Foco P0 ON" : "Solo P0 esta semana"}
          </Button>
          {!focusP0 &&
            PRIOS.map((p) => (
              <Button key={p.id} size="sm" variant={prio === p.id ? "default" : "secondary"} onClick={() => setPrio(p.id)}>
                {p.label}
              </Button>
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "ghost"} onClick={() => setCat(c.id)}>
              {c.label}
            </Button>
          ))}
          <Button size="sm" variant={hideDone ? "default" : "ghost"} onClick={() => setHideDone((v) => !v)}>
            Ocultar hechas
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={score * 100} className="max-w-xs" />
          <span className="font-mono text-[11px] tabular-nums text-subtle">
            {list.length} visibles · {Math.round(score * 100)}% global · {TASKS.length} total
          </span>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {list.map((t) => (
          <TaskPanel key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}
