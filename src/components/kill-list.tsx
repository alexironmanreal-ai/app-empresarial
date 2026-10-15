import { Link } from "@tanstack/react-router";
import { killCandidates } from "@/lib/physics";
import { CATEGORY_LABEL } from "@/lib/format";
import { useHq } from "@/lib/store";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function KillList() {
  const done = useHq((s) => s.done);
  const killed = useHq((s) => s.killedTaskIds);
  const killTask = useHq((s) => s.killTask);
  const reviveTask = useHq((s) => s.reviveTask);
  const candidates = killCandidates(done, killed);

  return (
    <section className="space-y-3" data-hide-in-deep-work="true">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Kill list
        </p>
        <h2 className="font-display text-2xl">Borrar es progreso</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Tareas P2/P3 de bajo impacto o plazo largo. Si no mueven caja ni OS en 30 días,
          matalas. P0 no aparece acá.
        </p>
      </div>

      {candidates.length === 0 && killed.length === 0 ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted shadow-[var(--shadow-border)]">
          No hay candidatos claros. Bien — o el tablero está demasiado chico.
        </p>
      ) : (
        <ul className="space-y-2">
          {candidates.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={t.priority}>{t.priority.toUpperCase()}</Badge>
                  <span className="font-mono text-[11px] text-subtle">
                    {CATEGORY_LABEL[t.category]}
                  </span>
                </div>
                <p className="mt-1 font-display text-lg text-fg">{t.title}</p>
                <p className="text-xs text-muted line-clamp-1">{t.why}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/tareas" className="font-mono text-[11px] text-subtle hover:text-fg">
                  Ver
                </Link>
                <Button size="sm" variant="secondary" onClick={() => killTask(t.id)}>
                  Kill
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {killed.length > 0 ? (
        <div className="rounded-xl border border-border bg-elevated/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
            Muertas ({killed.length})
          </p>
          <ul className="mt-2 space-y-1">
            {killed.map((id) => (
              <li key={id} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-mono text-muted line-through">{id}</span>
                <Button size="sm" variant="ghost" onClick={() => reviveTask(id)}>
                  Revive
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
