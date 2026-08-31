import { createFileRoute } from "@tanstack/react-router";
import { OS_MODULES, OS_PHASES } from "@/lib/data";
import { ChartShell, CompareArea } from "@/components/chart-block";
import { useHq } from "@/lib/store";

export const Route = createFileRoute("/os")({ component: Os });

function Os() {
  const profile = useHq((s) => s.profile);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Producto</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">{profile.os}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Módulos y fases del sistema operativo. El goal es un hello en QEMU y después userspace.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl">Fases</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OS_PHASES.map((p) => (
            <div key={p.phase} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-mono text-[11px] text-subtle">Fase {p.phase}</p>
              <p className="mt-1 font-display text-xl">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.months}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl">Módulos</h2>
        {OS_MODULES.map((mod) => (
          <div key={mod.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-xl">{mod.name}</p>
              <p className="font-mono text-[12px] text-subtle">{mod.layer} · {mod.months} meses</p>
            </div>
            <p className="mt-1 text-sm text-muted">Depende de: {mod.depends} → Entrega: {mod.deliverable}</p>
            <div className="mt-4">
              <ChartShell height={160}>
                <CompareArea data={mod.chart} doneName="Progreso" skipName="Riesgo" />
              </ChartShell>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
