import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { FACTURACION_GOAL_ARS } from "@/lib/wealth-engine";
import type { IncomeLiveSummary, ExpenseLiveSummary } from "@/lib/money-live";
import { computeMonthlyIncome, type LeadLike } from "@/lib/monthly-income";
import { ChartShell, StackedBars } from "@/components/chart-block";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const arsFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
function ars(n: number) {
  return arsFmt.format(n);
}

export function IncomeExpenseSections(props: {
  income: IncomeLiveSummary;
  expenses: ExpenseLiveSummary;
  wealthProgress: number;
  extraMonthlyBurnArs: number;
  setExtraMonthlyBurnArs: (n: number) => void;
  baseBurn: number;
  realityMonthlyBurnArs: number;
  toggleExpensePaid: (id: string) => void;
  leads?: LeadLike[] | null;
}) {
  const {
    income,
    expenses,
    wealthProgress,
    extraMonthlyBurnArs,
    setExtraMonthlyBurnArs,
    baseBurn,
    realityMonthlyBurnArs,
    toggleExpensePaid,
    leads,
  } = props;

  const monthly = useMemo(() => computeMonthlyIncome(leads), [leads]);
  const chartData = monthly.months.map((m) => ({
    label: m.label,
    cobrado: m.cobradoArs,
    perdido: m.perdidoArs,
  }));

  return (
    <>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Ingresos reales</h2>
            <p className="mt-1 text-sm text-muted">
              Cobrado y pipeline salen de{" "}
              <Link to="/pipeline" className="text-accent hover:underline">
                leads
              </Link>
              . El gráfico se actualiza solo al marcar cobrado o perdido. El mes en curso
              sigue abierto hasta que cierra el calendario.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] text-subtle">
            <span>
              Cobrado <strong className="text-ok">{ars(income.cobradoArs)}</strong>
            </span>
            <span>
              Pipeline <strong className="text-accent">{ars(income.pipelineArs)}</strong>
            </span>
            <span>
              Ritmo 30d <strong className="text-fg">{ars(income.velocity30dArs)}</strong>
            </span>
            <span>
              Meta {ars(FACTURACION_GOAL_ARS)} · {Math.round(wealthProgress * 100)}%
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ok/25 bg-ok/5 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
              Cobrado · 12 meses
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums text-ok">
              {ars(monthly.totalCobrado12)}
            </p>
            <p className="mt-1 text-xs text-muted">Total ganado (pipeline)</p>
          </div>
          <div className="rounded-xl border border-danger/25 bg-danger/5 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
              Perdido · 12 meses
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums text-danger">
              {ars(monthly.totalPerdido12)}
            </p>
            <p className="mt-1 text-xs text-muted">Con motivo manual</p>
          </div>
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
              Mes actual{monthly.current?.open ? " · abierto" : ""}
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums">
              {ars(monthly.current?.cobradoArs ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Perdido mes {ars(monthly.current?.perdidoArs ?? 0)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
            Ingresos por mes · cobrado vs perdido
          </p>
          <div className="mt-3 h-56">
            <ChartShell height={224}>
              <StackedBars
                data={chartData}
                keys={[
                  { key: "cobrado", name: "Cobrado", fill: "#2f8f6a" },
                  { key: "perdido", name: "Perdido", fill: "#c45c5c" },
                ]}
              />
            </ChartShell>
          </div>
        </div>

        {monthly.current && monthly.current.deals.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
            <p className="border-b border-border px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-subtle">
              Detalle mes {monthly.current.label}
              {monthly.current.open ? " (abierto — se actualiza al cerrar leads)" : ""}
            </p>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-subtle">
                  <th className="px-4 py-2">Lead</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Monto</th>
                  <th className="px-4 py-2">Razón</th>
                </tr>
              </thead>
              <tbody>
                {monthly.current.deals.map((d, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-2">
                      <span className="font-medium">{d.name}</span>
                      {d.offer ? (
                        <span className="mt-0.5 block text-xs text-subtle">{d.offer}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase",
                          d.stage === "cobrado" ? "text-ok" : "text-danger",
                        )}
                      >
                        {d.stage}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono tabular-nums">{ars(d.amountArs)}</td>
                    <td className="px-4 py-2 text-muted">{d.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Sin cobros ni pérdidas este mes. Mové leads en{" "}
            <Link to="/pipeline" className="text-accent hover:underline">
              Pipeline
            </Link>
            .
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {income.byOffer.map((b) => (
            <div key={b.key} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-display text-lg">{b.key}</p>
              <p className="mt-1 font-mono text-sm text-ok">{ars(b.cobradoArs)}</p>
              <p className="mt-1 text-xs text-muted">
                Pipeline {ars(b.pipelineArs)} · {b.leadsCobrado} cobrado · {b.leadsPipeline}{" "}
                abiertos
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Gastos</h2>
            <p className="mt-1 text-sm text-muted">
              Marcá pagado: actualiza pendientes. El burn mensual usa month + year/12
              (cotización viva) + extra manual.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] text-subtle">
            <span>
              Burn lista ~{" "}
              <strong className="text-fg">{ars(expenses.monthlyFromListArs)}</strong>
              /mes
            </span>
            <span>
              Pendiente{" "}
              <strong className="text-warn">{ars(expenses.pendingArs)}</strong>
            </span>
            <span>
              Pagado <strong className="text-ok">{ars(expenses.paidArs)}</strong>
            </span>
            <span>
              Once pendiente{" "}
              <strong className="text-fg">{ars(expenses.oncePendingArs)}</strong>
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <div>
            <p className="mb-1 font-mono text-[11px] text-subtle">Extra burn mensual (ARS)</p>
            <Input
              className="h-9 w-40 font-mono"
              type="number"
              value={extraMonthlyBurnArs || ""}
              onChange={(e) => setExtraMonthlyBurnArs(Number(e.target.value) || 0)}
            />
          </div>
          <p className="pb-1 text-sm text-muted">
            Burn total usado en runway:{" "}
            <strong className="font-mono text-fg">{ars(realityMonthlyBurnArs)}</strong>
            {" "}(lista {ars(baseBurn)} + extra {ars(extraMonthlyBurnArs || 0)}, piso 350k)
          </p>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Gasto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium text-right">ARS</th>
                <th className="px-4 py-3 font-medium text-right">Burn/mes</th>
                <th className="px-4 py-3 font-medium">Para</th>
              </tr>
            </thead>
            <tbody>
              {expenses.items.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpensePaid(e.id)}
                      className={cn(
                        "rounded-md px-2 py-1 font-mono text-[11px]",
                        e.paid ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                      )}
                    >
                      {e.paid ? "Pagado" : "Pendiente"}
                    </button>
                  </td>
                  <td className={cn("px-4 py-3", e.paid && "text-muted line-through")}>
                    {e.name}
                    {e.notes ? (
                      <span className="mt-0.5 block text-xs text-subtle">{e.notes}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {e.kind === "once" ? "único" : e.kind === "month" ? "mensual" : "anual"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {ars(e.costArs)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-subtle">
                    {e.monthlyBurnArs > 0 ? ars(e.monthlyBurnArs) : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted">{e.neededFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
