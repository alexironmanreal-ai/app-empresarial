import { createFileRoute, Link } from "@tanstack/react-router";
import { TASKS } from "@/lib/data";
import { liveGaps } from "@/lib/wealth-engine";
import { ars } from "@/lib/format";
import { companyScore, isTaskComplete, useHq } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/empresa")({ component: Empresa });

function Empresa() {
  const done = useHq((s) => s.done);
  const profile = useHq((s) => s.profile);
  const score = companyScore(done);
  const arsPerUsd = useHq((s) => s.arsPerUsd);
  const gaps = liveGaps(done, arsPerUsd);

  const legal = TASKS.filter((t) => t.category === "legal" || t.category === "fiscal");
  const closed = legal.filter((t) => isTaskComplete(t.id, t.subtasks.map((s) => s.id), done)).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Persona jurídica</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">{profile.company}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Estado de la empresa como entidad: SAS, CUIT, banco, marca y lo que falta para existir de verdad.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Score global</p>
          <p className="mt-2 font-display text-3xl">{Math.round(score * 100)}%</p>
          <Progress value={score * 100} className="mt-3" />
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Legal / fiscal</p>
          <p className="mt-2 font-display text-3xl">{closed}/{legal.length}</p>
          <p className="mt-1 text-sm text-muted">Ítems cerrados</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Gaps abiertos</p>
          <p className="mt-2 font-display text-3xl">{gaps.filter((g) => g.status !== "done").length}</p>
          <p className="mt-1 text-sm text-muted">De {gaps.length} áreas · tareas reales</p>
        </div>
      </div>

      <section>
        <h2 className="font-display text-2xl">Gaps</h2>
        <div className="mt-4 space-y-3">
          {gaps.map((g) => (
            <div key={g.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-xl">{g.area}</p>
                <Badge tone={g.status === "done" ? "ok" : g.status === "partial" ? "warn" : "default"}>
                  {g.status === "done" ? "Cerrado" : g.status === "partial" ? `${g.pctDone}%` : "Abierto"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted">
                {g.status === "done" ? g.missing : `Hoy: ${g.now} → Falta: ${g.missing}`}
              </p>
              <p className="mt-1 font-mono text-[12px] text-subtle">
                Tareas {g.relatedDone}/{g.relatedCount} ·{" "}
                {g.costArs === 0 ? "sin costo $" : `${ars(g.missingArs)} / ${ars(g.costArs)}`}
                {g.time ? ` · ${g.time}` : ""}
              </p>
              <Progress value={g.pctDone} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>
      </section>

      <Link to="/tareas" className="text-sm text-muted hover:text-fg">
        Ir al tablero de tareas →
      </Link>
    </div>
  );
}
