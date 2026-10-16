import { Link } from "@tanstack/react-router";
import { computeWealth, FACTURACION_GOAL_ARS } from "@/lib/wealth-engine";
import { ars } from "@/lib/format";
import { useHq } from "@/lib/store";
import { ChartShell, CompareArea } from "@/components/chart-block";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

/** Wealth real: facturación cobrada → meta 10M ARS */
export function WealthPanel() {
  const caja = useHq((s) => s.caja);
  const leads = useHq((s) => s.leads);
  const done = useHq((s) => s.done);
  const w = computeWealth({ caja, leads, done });

  const chart = w.curve.map((c) => ({
    label: c.year === 0 ? "Hoy" : `A${c.year}`,
    done: c.actual,
    skip: Math.max(0, c.goal - c.actual),
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            Wealth · facturación real
          </p>
          <h2 className="font-display text-2xl sm:text-3xl">
            Meta: {ars(FACTURACION_GOAL_ARS)} cobrados
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Se actualiza con leads en <strong>cobrado</strong>, caja y tareas P0/P1.
            No es una curva inventada.
          </p>
        </div>
        <Link to="/pipeline" className="font-mono text-[11px] text-accent hover:underline">
          Pipeline →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Facturado (cobrado)" value={ars(w.facturadoArs)} tone="text-ok" />
        <Metric label="Pipeline abierto" value={ars(w.pipelineArs)} tone="text-warn" />
        <Metric label="Caja operativa" value={ars(w.cajaArs)} />
        <Metric
          label="Falta para la meta"
          value={`${w.pctMissing}%`}
          hint={ars(w.missingArs)}
          tone={w.pctMissing < 20 ? "text-ok" : "text-danger"}
        />
      </div>

      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
            Progreso a 10M
          </p>
          <p className="font-display text-2xl tabular-nums">
            {Math.round(w.progress * 100)}%
          </p>
        </div>
        <Progress value={w.progress * 100} className="mt-3 h-3 [&>div]:bg-accent" />
        <p className="mt-3 text-sm text-muted">{w.nextAction}</p>
        <p className="mt-1 font-mono text-[11px] text-subtle">
          Velocidad 30d: {ars(w.velocity30dArs)} · Proyección 12m al ritmo actual:{" "}
          {ars(w.projected12mArs)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartShell
          title="Objetivo vs tu trayectoria"
          caption="Verde = facturado estimado · gris = lo que falta hasta 10M"
          height={240}
        >
          <CompareArea data={chart} doneName="Tu trayectoria" skipName="Falta a meta" />
        </ChartShell>

        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Diferencialismo
          </p>
          <h3 className="mt-1 font-display text-xl">Objetivo vs referencias</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <Row
              label="Objetivo (facturación cobrada)"
              value={ars(w.goalArs)}
              highlight
            />
            <Row label="Tu facturado real" value={ars(w.facturadoArs)} />
            <Row label="Referencia: pipeline abierto" value={ars(w.pipelineArs)} />
            <Row label="Referencia: caja hoy" value={ars(w.cajaArs)} />
            <Row
              label="Referencia: ritmo ×12 (30d)"
              value={ars(w.velocity30dArs * 12)}
            />
          </ul>
          <p className="mt-4 text-xs text-muted">
            El objetivo es facturación cobrada, no valuación de startup. La caja es
            oxígeno; el pipeline es el puente; el cobrado es el score.
          </p>
        </div>
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
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
        {label}
      </p>
      <p className={cn("mt-1 font-display text-2xl tabular-nums", tone)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
      <span className={cn("text-muted", highlight && "font-medium text-fg")}>{label}</span>
      <span className={cn("font-mono tabular-nums", highlight && "text-accent")}>
        {value}
      </span>
    </li>
  );
}
