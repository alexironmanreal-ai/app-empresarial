import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { TIME_GOALS, TASKS } from "@/lib/data";
import { useHq, isTaskComplete } from "@/lib/store";
import type { TimeGoal } from "@/lib/types";
import { ChartShell } from "@/components/chart-block";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/tiempo")({ component: TiempoPage });

const CAT_LABEL: Record<TimeGoal["category"], string> = {
  youtube: "YouTube",
  os: "OS",
  skill: "Skill",
  empresa: "Empresa",
  network: "Red",
  revenue: "Ingresos",
};

const CAT_COLOR: Record<TimeGoal["category"], string> = {
  youtube: "#ef4444",
  os: "#3b82f6",
  skill: "#a855f7",
  empresa: "#c4a574",
  network: "#22c55e",
  revenue: "#f59e0b",
};

function pctFromTasks(goal: TimeGoal, done: Record<string, boolean>): number {
  if (!goal.linkedTaskIds || goal.linkedTaskIds.length === 0) return goal.baselinePct;
  let closed = 0;
  for (const id of goal.linkedTaskIds) {
    const t = TASKS.find((x) => x.id === id);
    if (!t) continue;
    if (isTaskComplete(id, t.subtasks.map((s) => s.id), done)) closed++;
  }
  const fromTasks = (closed / goal.linkedTaskIds.length) * 70;
  return Math.min(100, Math.round(goal.baselinePct + fromTasks));
}

function ytBoost(goal: TimeGoal, ytStats: { subscriberCount: number; viewCount: number } | null): number {
  if (goal.id !== "tg-yt-monetize" || !ytStats) return 0;
  const subPct = Math.min(1, ytStats.subscriberCount / 1000) * 40;
  const watchApprox = ytStats.viewCount / 60;
  const hoursPct = Math.min(1, watchApprox / 4000) * 40;
  return Math.round(subPct + hoursPct);
}

function TiempoPage() {
  const done = useHq((s) => s.done);
  const ytStats = useHq((s) => s.ytStats);

  const rows = useMemo(() => {
    return TIME_GOALS.slice()
      .sort((a, b) => a.order - b.order)
      .map((g) => {
        let pct = pctFromTasks(g, done);
        if (g.id === "tg-yt-monetize") {
          pct = Math.min(100, Math.max(pct, ytBoost(g, ytStats)));
        }
        if (g.id === "tg-company") {
          const legal = TASKS.filter((t) => t.category === "legal" || t.category === "fiscal");
          const closed = legal.filter((t) =>
            isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
          ).length;
          if (legal.length) pct = Math.min(100, Math.round(g.baselinePct + (closed / legal.length) * 80));
        }
        const hoursLeft = Math.max(0, Math.round(g.hoursTotal * (1 - pct / 100)));
        const yearsLeft = g.hoursPerWeek > 0 ? +(hoursLeft / (g.hoursPerWeek * 52)).toFixed(2) : 0;
        return { ...g, pct, hoursLeft, yearsLeft };
      });
  }, [done, ytStats]);

  const totalHoursLeft = rows.reduce((s, r) => s + r.hoursLeft, 0);
  const totalHoursAll = rows.reduce((s, r) => s + r.hoursTotal, 0);
  const globalPct = totalHoursAll > 0 ? Math.round(((totalHoursAll - totalHoursLeft) / totalHoursAll) * 100) : 0;

  const curveData = rows.map((r) => ({
    name: r.title.length > 22 ? r.title.slice(0, 20) + "…" : r.title,
    horasRestantes: r.hoursLeft,
    horasHechas: r.hoursTotal - r.hoursLeft,
    pct: r.pct,
    años: r.yearsLeft,
    fill: CAT_COLOR[r.category],
  }));

  const remainingByCat = (Object.keys(CAT_LABEL) as TimeGoal["category"][]).map((c) => {
    const items = rows.filter((r) => r.category === c);
    return {
      label: CAT_LABEL[c],
      horas: items.reduce((s, i) => s + i.hoursLeft, 0),
      fill: CAT_COLOR[c],
    };
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Curva de tiempo restante
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Tiempo</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Cuánto falta (en horas y años a ritmo sostenible) para cerrar las metas grandes.
          Se actualiza cuando marcás tareas, sincronizás YouTube o avanzás el OS. Añadí ritmo
          de aprendizaje: programación, inglés, construir en público y producto propio.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-elevated/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">Progreso global</p>
          <p className="mt-1 font-display text-3xl tabular-nums">{globalPct}%</p>
          <Progress value={globalPct} className="mt-2" />
        </div>
        <div className="rounded-lg border border-border bg-elevated/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">Horas restantes</p>
          <p className="mt-1 font-display text-3xl tabular-nums">{totalHoursLeft.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted">de {totalHoursAll.toLocaleString()} totales estimadas</p>
        </div>
        <div className="rounded-lg border border-border bg-elevated/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">Metas</p>
          <p className="mt-1 font-display text-3xl tabular-nums">
            {rows.filter((r) => r.pct >= 100).length}/{rows.length}
          </p>
          <p className="mt-1 text-xs text-muted">completadas</p>
        </div>
      </div>

      <ChartShell title="Horas restantes por meta" caption="Cuanto más baja la barra, más cerca estás." height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={curveData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-25} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
              labelStyle={{ color: "#f4f0e8" }}
            />
            <Bar dataKey="horasRestantes" name="Horas restantes" radius={[4, 4, 0, 0]}>
              {curveData.map((d, i) => (
                <Cell key={i} fill={d.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Horas restantes por categoría" caption="Agrupado para ver dónde está el peso." height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={remainingByCat} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis type="category" dataKey="label" width={72} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
            />
            <Bar dataKey="horas" name="Horas" radius={[0, 4, 4, 0]}>
              {remainingByCat.map((d, i) => (
                <Cell key={i} fill={d.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Tabla de tiempo</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated/50 font-mono text-[10px] uppercase tracking-wider text-subtle">
                <th className="px-3 py-2.5">Meta</th>
                <th className="px-3 py-2.5">Cat</th>
                <th className="px-3 py-2.5 text-right">%</th>
                <th className="px-3 py-2.5 text-right">Horas rest.</th>
                <th className="px-3 py-2.5 text-right">Años rest.</th>
                <th className="px-3 py-2.5 text-right">h/sem</th>
                <th className="px-3 py-2.5">Hecho cuando</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-elevated/30">
                  <td className="px-3 py-3">
                    <p className="font-medium text-fg">{r.title}</p>
                    <p className="mt-0.5 max-w-xs text-xs text-muted line-clamp-2">{r.description}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{ background: CAT_COLOR[r.category] + "33", color: CAT_COLOR[r.category] }}
                    >
                      {CAT_LABEL[r.category]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex flex-col items-end gap-1">
                      <span className="font-mono tabular-nums">{r.pct}%</span>
                      <Progress value={r.pct} className="h-1.5 w-16" />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">
                    {r.hoursLeft.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">
                    {r.yearsLeft < 0.1 && r.pct < 100 ? "<0.1" : r.yearsLeft}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">{r.hoursPerWeek}</td>
                  <td className="px-3 py-3 text-xs text-muted max-w-[200px]">{r.doneWhen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-subtle leading-relaxed max-w-3xl">
        Metodología: horas totales = esfuerzo estimado desde cero a ritmo sostenible. % actual =
        baseline + progreso de tareas del tablero (legal/fiscal para empresa) + boost de stats de
        YouTube cuando hay API key. Los años restantes asumen las h/semana indicadas; si subís el
        ritmo semanal, el tiempo calendario baja en proporción. No es una promesa: es un techo
        plausible para priorizar.
      </p>
    </div>
  );
}
