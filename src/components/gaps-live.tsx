import { Link } from "@tanstack/react-router";
import { GAP_CHART_LABEL, liveGaps } from "@/lib/wealth-engine";
import { ars } from "@/lib/format";
import { useHq } from "@/lib/store";
import { ChartShell, CompareArea } from "@/components/chart-block";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GapsLive() {
  const done = useHq((s) => s.done);
  const arsPerUsd = useHq((s) => s.arsPerUsd);
  const gaps = liveGaps(done, arsPerUsd);

  const openN = gaps.filter((g) => g.status !== "done").length;
  const totalMissing = gaps.reduce((a, g) => a + g.missingArs, 0);
  const avgPct =
    gaps.length === 0
      ? 0
      : Math.round(gaps.reduce((a, g) => a + g.pctDone, 0) / gaps.length);

  // Gráfico en % (funciona también cuando costUsd = 0)
  const chart = gaps.map((g) => ({
    label: GAP_CHART_LABEL[g.id] ?? g.area.split(" ")[0] ?? g.area,
    done: g.pctDone,
    skip: Math.max(0, 100 - g.pctDone),
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Qué falta para ser empresa</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Estado calculado desde tareas del tablero (no texto fijo). Costo en ARS
            con cotización viva · {arsPerUsd.toLocaleString("es-AR")} ARS/USD.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-[11px] text-subtle">
          <span>
            Abiertos <strong className="text-fg">{openN}</strong>/{gaps.length}
          </span>
          <span>
            Progreso medio <strong className="text-fg">{avgPct}%</strong>
          </span>
          <span>
            Falta invertir ~ <strong className="text-warn">{ars(totalMissing)}</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Hoy → Falta</th>
                <th className="px-4 py-3 font-medium">Tareas</th>
                <th className="px-4 py-3 font-medium">%</th>
                <th className="px-4 py-3 font-medium">Costo ARS</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((g) => (
                <tr key={g.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">{g.area}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        g.status === "done"
                          ? "ok"
                          : g.status === "partial"
                            ? "warn"
                            : "default"
                      }
                    >
                      {g.status === "done"
                        ? "Cerrado"
                        : g.status === "partial"
                          ? "Parcial"
                          : "Abierto"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {g.status === "done" ? (
                      <span className="text-ok">{g.missing}</span>
                    ) : (
                      <>
                        {g.now} → {g.missing}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-subtle">
                    {g.relatedDone}/{g.relatedCount}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">{g.pctDone}%</td>
                  <td className="px-4 py-3 font-mono tabular-nums">
                    {g.costArs === 0 ? (
                      <span className="text-subtle">$0 (solo tiempo)</span>
                    ) : (
                      <>
                        <span className={cn(g.missingArs === 0 && "text-ok")}>
                          {ars(g.missingArs)}
                        </span>
                        <span className="text-subtle"> / {ars(g.costArs)}</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ChartShell
          title="Progreso por área"
          caption="% de tareas cerradas (no ARS)"
          height={280}
        >
          <CompareArea data={chart} doneName="Hecho %" skipName="Falta %" />
        </ChartShell>
      </div>
      <Link to="/tareas" className="font-mono text-[11px] text-accent hover:underline">
        Cerrar gaps en Tareas →
      </Link>
    </section>
  );
}
