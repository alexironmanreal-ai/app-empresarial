import { Link } from "@tanstack/react-router";
import { computeFisica } from "@/lib/physics";
import { computeReality } from "@/lib/reality";
import { cajaTotalArs, companyScore, useHq } from "@/lib/store";
import { ars } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FisicaDelDia() {
  const done = useHq((s) => s.done);
  const caja = useHq((s) => s.caja);
  const dayLog = useHq((s) => s.dayLog);
  const daySnapshots = useHq((s) => s.daySnapshots);
  const lastReviewAt = useHq((s) => s.lastReviewAt);
  const extra = useHq((s) => s.extraMonthlyBurnArs);
  const ghCommits = useHq((s) => s.ghCommits);
  const score = companyScore(done);
  const reality = computeReality(
    caja,
    done,
    lastReviewAt,
    score,
    extra,
    dayLog,
    daySnapshots,
  );
  const f = computeFisica({
    dayLog,
    totalCajaArs: cajaTotalArs(caja),
    runwayDays: reality.runwayDays,
    done,
    ghCommits,
    daySnapshots,
  });

  const runwayTone =
    f.runwayDays < 30 ? "text-danger" : f.runwayDays < 90 ? "text-warn" : "text-ok";
  const p0Tone = f.p0Open > 0 ? "text-danger" : "text-ok";
  const makerTone =
    f.makerPct >= 0.7 ? "text-ok" : f.makerPct >= 0.3 ? "text-warn" : "text-danger";

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            Física del día
          </p>
          <h2 className="font-display text-2xl text-fg">Números que no mienten</h2>
        </div>
        <Link
          to="/tracker"
          className="font-mono text-[11px] text-accent hover:underline"
        >
          Registrar horas →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Maker hours"
          value={`${f.makerHoursDone}h`}
          hint={
            f.makerHoursPlanned > 0
              ? `de ${f.makerHoursPlanned}h planificadas · ${Math.round(f.makerPct * 100)}%`
              : `${Math.round(f.dayProgressPct * 100)}% del día`
          }
          tone={makerTone}
        />
        <Metric
          label="Caja"
          value={ars(f.cajaArs)}
          hint={
            Number.isFinite(f.runwayDays)
              ? `Runway ~${f.runwayDays} días`
              : "Runway ∞"
          }
          tone={runwayTone}
        />
        <Metric
          label="P0 abiertos"
          value={String(f.p0Open)}
          hint={f.p0Open === 0 ? "Camino crítico limpio" : "No negociable"}
          tone={p0Tone}
        />
        <Metric
          label="Commits / 7d"
          value={String(f.commitsWeek)}
          hint="OS real se mide en commits"
          tone={f.commitsWeek > 0 ? "text-ok" : "text-warn"}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
        {label}
      </p>
      <p className={cn("mt-1 font-display text-3xl tabular-nums", tone)}>{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
