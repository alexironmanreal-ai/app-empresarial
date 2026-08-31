import { createFileRoute } from "@tanstack/react-router";
import { YT_MILESTONES, YT_PILLARS, YT_TITLES } from "@/lib/data";
import { num } from "@/lib/format";
import { useHq } from "@/lib/store";
import { ChartShell, SimpleLine } from "@/components/chart-block";

export const Route = createFileRoute("/youtube")({ component: Youtube });

function Youtube() {
  const profile = useHq((s) => s.profile);
  const chart = YT_MILESTONES.map((m) => ({
    label: `M${m.month}`,
    subs: m.subs,
    views: m.viewsMonth,
  }));

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Contenido</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">{profile.youtube}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Hitos de crecimiento, pilares y títulos sugeridos. El canal documenta el OS y genera audiencia.
        </p>
      </header>

      <ChartShell title="Suscriptores proyectados" height={240}>
        <SimpleLine data={chart} dataKey="subs" name="Subs" />
      </ChartShell>

      <section>
        <h2 className="font-display text-2xl">Hitos</h2>
        <div className="mt-4 space-y-3">
          {YT_MILESTONES.map((m) => (
            <div key={m.month} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-xl">Mes {m.month}</p>
                <p className="font-mono text-[12px] text-subtle">
                  {num(m.subs)} subs · {num(m.viewsMonth)} views · USD {m.revenue}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted">{m.focus}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Pilares</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {YT_PILLARS.map((p) => (
            <div key={p.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-display text-xl">{p.title}</p>
              <p className="mt-1 text-sm text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Títulos sugeridos</h2>
        <ul className="mt-4 space-y-2">
          {YT_TITLES.map((t, i) => (
            <li key={i} className="rounded-lg bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
