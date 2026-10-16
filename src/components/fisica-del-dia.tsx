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
  const ghCommits = useHq((s) => s.ghCommits) ?? [];
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
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Física del día
          </p>
          <h2 className="font-display text-xl sm:text-2xl">Números que no mienten</h2>
        </div>
        <Link to="/tracker" className="font-mono text-[11px] text-accent hover:underline">
          Tracker →
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Maker hoy"
          value={`${f.makerHoursDone.toFixed(1)}h`}
          hint={`de ${f.makerHoursPlanned.toFixed(1)}h planificadas`}
          tone={makerTone}
        />
        <Stat
          label="Runway"
          value={Number.isFinite(f.runwayDays) ? `${Math.round(f.runwayDays)}d` : "∞"}
          hint={ars(f.cajaArs) + " en caja"}
          tone={runwayTone}
        />
        <Stat label="P0 abiertos" value={String(f.p0Open)} tone={p0Tone} />
        <Stat
          label="Commits 7d"
          value={String(f.commitsWeek)}
          hint="GitHub sincronizado"
        />
      </div>

      <p className="mt-3 text-xs text-muted">
        Progreso del día (tracker): {Math.round(f.dayProgressPct * 100)}%. Score empresa:{" "}
        {Math.round(score * 100)}%.
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-elevated/50 px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className={cn("mt-0.5 font-display text-2xl tabular-nums", tone)}>{value}</p>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
