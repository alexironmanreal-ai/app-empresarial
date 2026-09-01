import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Printer } from "lucide-react";
import { briefing } from "@/lib/briefing";
import { GAPS, TASKS, WEALTH } from "@/lib/data";
import { compactUsd, daysLabel, money, toArs, ars } from "@/lib/format";
import {
  companyScore,
  isTaskComplete,
  scoreByPriority,
  useHq,
} from "@/lib/store";
import { computeReality, runwayLabel } from "@/lib/reality";
import { ChartShell, CompareArea, WealthChart } from "@/components/chart-block";
import { Ring } from "@/components/ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { printDashboard } from "@/components/print-report";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const done = useHq((s) => s.done);
  const profile = useHq((s) => s.profile);
  const caja = useHq((s) => s.caja);
  const lastReviewAt = useHq((s) => s.lastReviewAt);
  const extraMonthlyBurnArs = useHq((s) => s.extraMonthlyBurnArs);
  const markReview = useHq((s) => s.markReview);

  const score = companyScore(done);
  const reality = computeReality(caja, done, lastReviewAt, score, extraMonthlyBurnArs);
  const memo = briefing(profile, done, reality);
  const p0 = scoreByPriority(done, "p0");
  const p1 = scoreByPriority(done, "p1");
  const open = TASKS.filter(
    (t) => !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).slice(0, 3);
  const wealth5 = WEALTH.find((w) => w.year === 5)!;
  const wealth10 = WEALTH.find((w) => w.year === 10)!;
  const p0left = TASKS.filter(
    (t) =>
      t.priority === "p0" &&
      !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).length;
  const daysP0 = TASKS.filter((t) => t.priority === "p0").reduce(
    (a, t) => Math.max(a, t.days),
    0,
  );

  const gapChart = GAPS.map((g) => ({
    label: g.area.split(" ")[0] ?? g.area,
    done: 0,
    skip: toArs(g.costUsd),
  }));

  const wealthArs = WEALTH.map((w) => ({
    year: w.year,
    conservative: toArs(w.conservative),
    base: toArs(w.base),
    optimistic: toArs(w.optimistic),
  }));

  const toneClass =
    reality.survivalTone === "danger"
      ? "text-danger"
      : reality.survivalTone === "warn"
        ? "text-warn"
        : "text-ok";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {memo.kicker}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.1] text-fg sm:text-5xl">
            {memo.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            {memo.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 no-print">
            <Button
              className="gap-2"
              variant="secondary"
              size="sm"
              onClick={() => printDashboard()}
            >
              <Printer className="size-3.5" />
              Imprimir / fotocopiar dashboard
            </Button>
            <Button
              className="gap-2"
              variant={reality.reviewOverdue ? "default" : "secondary"}
              size="sm"
              onClick={() => markReview()}
            >
              <CheckCircle2 className="size-3.5" />
              {reality.reviewOverdue
                ? "Cerrar review semanal (vencida)"
                : "Marcar review hecha"}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <Ring value={score} size={96} label="lista" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Empresa construida
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums">
              {Math.round(score * 100)}%
            </p>
            <p className="mt-1 text-sm text-muted">
              P0 {Math.round(p0 * 100)}% · P1 {Math.round(p1 * 100)}%
            </p>
          </div>
        </div>
      </header>

      {/* Realidad dura */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Caja total
          </p>
          <p className="mt-2 font-display text-2xl tabular-nums sm:text-3xl">
            {ars(reality.totalCajaArs)}
          </p>
          <p className="mt-1 text-sm text-muted">Disponible ahora</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Runway
          </p>
          <p className={cn("mt-2 font-display text-2xl tabular-nums sm:text-3xl", toneClass)}>
            {Number.isFinite(reality.runwayDays) ? `${reality.runwayDays}d` : "∞"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {runwayLabel(reality.runwayDays)} · burn ~{ars(reality.monthlyBurnArs)}/mes
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            P0 abiertos
          </p>
          <p className="mt-2 font-display text-2xl tabular-nums sm:text-3xl">{p0left}</p>
          <p className="mt-1 text-sm text-muted">
            Máx. {daysLabel(daysP0)} para cerrar el bloque
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Review
          </p>
          <p
            className={cn(
              "mt-2 font-display text-2xl tabular-nums sm:text-3xl",
              reality.reviewOverdue ? "text-warn" : "text-ok",
            )}
          >
            {reality.daysSinceReview === null
              ? "Nunca"
              : reality.daysSinceReview === 0
                ? "Hoy"
                : `${reality.daysSinceReview}d`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {reality.reviewOverdue ? "Vencida — cerrala" : "Al día"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Wealth año 5 · ARS
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums">
            {compactUsd(wealth5.base)}
          </p>
          <p className="mt-1 text-sm text-muted">Escenario base</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Wealth año 10 · ARS
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums">
            {compactUsd(wealth10.base)}
          </p>
          <p className="mt-1 text-sm text-muted">Escenario base</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Foco de hoy
          </p>
          <p className="mt-2 font-display text-xl leading-snug">{memo.focus}</p>
          <p className="mt-1 text-sm text-muted">Según realidad actual</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Próximas tareas</h2>
            <Link to="/tareas" className="text-sm text-muted hover:text-fg">
              Ver tablero
            </Link>
          </div>
          {open.map((t) => (
            <Link
              key={t.id}
              to="/tareas"
              className="block rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={t.priority}>{t.priority.toUpperCase()}</Badge>
                    <span className="font-mono text-[11px] text-subtle">
                      {daysLabel(t.days)} · {money(t.costUsd)}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-xl">{t.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{t.why}</p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-subtle" />
              </div>
            </Link>
          ))}
        </div>
        <div className="lg:col-span-2">
          <ChartShell
            title="Costo de lo que falta · ARS"
            caption="No es el presupuesto del OS. Es el costo de existir."
            height={260}
          >
            <CompareArea data={gapChart} doneName="Pagado" skipName="Falta" />
          </ChartShell>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Qué falta para ser empresa</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          El backup muestra visión (OS + marca + founder). No muestra CUIT, tarifa, ni un
          hello en QEMU.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Hoy</th>
                <th className="px-4 py-3 font-medium">Falta</th>
                <th className="px-4 py-3 font-medium">Tiempo</th>
                <th className="px-4 py-3 font-medium">Costo ARS</th>
              </tr>
            </thead>
            <tbody>
              {GAPS.map((g) => (
                <tr key={g.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">{g.area}</td>
                  <td className="px-4 py-3 text-muted">{g.now}</td>
                  <td className="px-4 py-3">{g.missing}</td>
                  <td className="px-4 py-3 font-mono text-[12px]">{g.time}</td>
                  <td className="px-4 py-3 font-mono text-[12px]">{money(g.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Proyección de wealth · ARS</h2>
          <Link to="/finanzas" className="text-sm text-muted hover:text-fg">
            Ver finanzas
          </Link>
        </div>
        <div className="mt-4">
          <ChartShell title="ARS acumulado" height={280}>
            <WealthChart data={wealthArs} />
          </ChartShell>
        </div>
      </section>
    </div>
  );
}
