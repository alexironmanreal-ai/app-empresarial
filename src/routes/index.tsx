import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Printer } from "lucide-react";
import { briefing } from "@/lib/briefing";
import { TASKS } from "@/lib/data";
import { WealthPanel } from "@/components/wealth-panel";
import { GapsLive } from "@/components/gaps-live";
import { FxBadge } from "@/components/fx-badge";
import { daysLabel, money, ars } from "@/lib/format";
import {
  companyScore,
  isTaskComplete,
  scoreByPriority,
  useHq,
} from "@/lib/store";
import {
  computeReality,
  registroHoyLabel,
  reviewLabel,
  runwayLabel,
} from "@/lib/reality";
import { Ring } from "@/components/ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { printDashboard } from "@/components/print-report";
import { cn } from "@/lib/utils";
import { HqElonBlock } from "@/components/hq-elon";
import { LiveClock } from "@/components/live-clock";
import { LocalWeather } from "@/components/local-weather";
import { SurvivalBanner } from "@/components/survival-banner";
import { HqInbox } from "@/components/hq-inbox";
import { HqTools } from "@/components/hq-tools";
import { computeHqActions } from "@/lib/hq-actions";
import { OfficeShortcuts, OfficeShortcutChips } from "@/components/office-shortcuts";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const done = useHq((s) => s.done);
  const profile = useHq((s) => s.profile);
  const caja = useHq((s) => s.caja);
  const lastReviewAt = useHq((s) => s.lastReviewAt);
  const extraMonthlyBurnArs = useHq((s) => s.extraMonthlyBurnArs);
  const markReview = useHq((s) => s.markReview);
  const dayLog = useHq((s) => s.dayLog);
  const daySnapshots = useHq((s) => s.daySnapshots);
  const leads = useHq((s) => s.leads);

  const score = companyScore(done);
  const reality = computeReality(
    caja,
    done,
    lastReviewAt,
    score,
    extraMonthlyBurnArs,
    dayLog,
    daySnapshots,
  );
  const memo = briefing(profile, done, reality);
  const p0 = scoreByPriority(done, "p0");
  const p1 = scoreByPriority(done, "p1");
  const open = TASKS.filter(
    (t) => !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).slice(0, 3);
  const p0left = TASKS.filter(
    (t) =>
      t.priority === "p0" &&
      !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).length;
  const daysP0 = TASKS.filter((t) => t.priority === "p0").reduce(
    (a, t) => Math.max(a, t.days),
    0,
  );

  const actions = computeHqActions({
    runwayDays: reality.runwayDays,
    reviewOverdue: reality.reviewOverdue,
    registroHoy: reality.registroHoy,
    leads,
    done,
  });

  const toneClass =
    reality.survivalTone === "danger"
      ? "text-danger"
      : reality.survivalTone === "warn"
        ? "text-warn"
        : "text-ok";

  const registroTone =
    reality.registroHoy === "cerrado"
      ? "text-ok"
      : reality.registroHoy === "parcial"
        ? "text-warn"
        : "text-danger";

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
            <Button className="gap-2" variant="secondary" size="sm" onClick={() => printDashboard()}>
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
              {reality.reviewOverdue ? "Cerrar review semanal (vencida)" : "Marcar review hecha"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
          <div className="flex min-w-[12rem] flex-col justify-center rounded-xl border border-accent/20 bg-surface p-4 shadow-[var(--shadow-border)]">
            <LiveClock />
            <LocalWeather />
            <div className="mt-3 no-print">
              <OfficeShortcutChips />
            </div>
          </div>
        </div>
      </header>

      <SurvivalBanner
        runwayDays={reality.runwayDays}
        reviewOverdue={reality.reviewOverdue}
        monthlyBurnArs={reality.monthlyBurnArs}
        totalCajaArs={reality.totalCajaArs}
      />

      <HqInbox actions={actions} />

      <HqElonBlock />

      <FxBadge />

      <WealthPanel />

      <OfficeShortcuts />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Caja total</p>
          <p className="mt-2 font-display text-2xl tabular-nums sm:text-3xl">
            {ars(reality.totalCajaArs)}
          </p>
          <p className="mt-1 text-sm text-muted">Disponible ahora</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Runway</p>
          <p className={cn("mt-2 font-display text-2xl tabular-nums sm:text-3xl", toneClass)}>
            {Number.isFinite(reality.runwayDays) ? `${reality.runwayDays}d` : "\u221e"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {runwayLabel(reality.runwayDays)} · burn ~{ars(reality.monthlyBurnArs)}/mes
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">P0 abiertos</p>
          <p className="mt-2 font-display text-2xl tabular-nums sm:text-3xl">{p0left}</p>
          <p className="mt-1 text-sm text-muted">Máx. {daysLabel(daysP0)} para cerrar el bloque</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Review semanal</p>
          <p
            className={cn(
              "mt-2 font-display text-2xl tabular-nums sm:text-3xl",
              reality.reviewOverdue ? "text-warn" : "text-ok",
            )}
          >
            {reviewLabel(reality.daysSinceReview)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {reality.reviewOverdue
              ? "Vencida — cerrala"
              : reality.daysSinceReview === 0
                ? "Hecha hoy"
                : "Dentro de la semana"}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Registro de hoy</p>
          <p className={cn("mt-2 font-display text-2xl sm:text-3xl", registroTone)}>
            {registroHoyLabel(reality.registroHoy)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {reality.registroHoy === "sin_registro"
              ? "Tracker / Registros — pendiente"
              : `${Math.round(reality.registroHoyProgress * 100)}% del plan del día`}
          </p>
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
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-2xl">Foco</h2>
          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Hoy</p>
            <p className="mt-2 font-display text-xl leading-snug">{memo.focus}</p>
          </div>
        </div>
      </section>

      <HqTools />

      <GapsLive />
    </div>
  );
}
