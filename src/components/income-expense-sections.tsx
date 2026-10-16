import { Link } from "@tanstack/react-router";
import { FACTURACION_GOAL_ARS } from "@/lib/wealth-engine";
import type { IncomeLiveSummary, ExpenseLiveSummary } from "@/lib/money-live";
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
  } = props;

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
              . Las referencias de lista son techos, no promesas.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] text-subtle">
            <span>
              Cobrado <strong className="text-ok">{ars(income.cobradoArs)}</strong>
            </span>
            <span>
              Pipeline{" "}
              <strong className="text-warn">{ars(income.pipelineArs)}</strong>
            </span>
            <span>
              Ritmo 30d{" "}
              <strong className="text-fg">{ars(income.velocity30dArs)}</strong>
            </span>
            <span>
              Meta <strong className="text-fg">{ars(FACTURACION_GOAL_ARS)}</strong> ·{" "}
              {Math.round(wealthProgress * 100)}%
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {income.byOffer.length === 0 ? (
            <p className="col-span-full rounded-xl bg-surface p-4 text-sm text-muted shadow-[var(--shadow-border)]">
              Sin leads cobrados ni en curso. Cargá ofertas en Pipeline y pasá a cobrado
              para ver ingresos reales.
            </p>
          ) : (
            income.byOffer.map((b) => (
              <div
                key={b.key}
                className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
              >
                <p className="font-display text-lg">{b.key}</p>
                <p className="mt-2 font-mono text-xl tabular-nums text-ok">
                  {ars(b.cobradoArs)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-subtle">
                  Pipeline {ars(b.pipelineArs)} · {b.leadsCobrado} cobrado ·{" "}
                  {b.leadsPipeline} abiertos
                </p>
              </div>
            ))
          )}
        </div>

        <h3 className="mt-8 font-display text-xl">Referencias de lista (techos)</h3>
        <p className="mt-1 text-sm text-muted">
          Si un lead matchea la oferta, se muestra cobrado/pipeline real al lado del techo Y1.
        </p>
        <div className="mt-3 space-y-3">
          {income.streams.map((i) => (
            <div
              key={i.id}
              className={cn(
                "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
                i.active ? "ring-1 ring-accent/30" : "opacity-80",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-lg">
                  {i.name}
                  {i.active ? (
                    <span className="ml-2 font-mono text-[10px] uppercase text-accent">
                      activo
                    </span>
                  ) : null}
                </p>
                <p className="font-mono text-[12px] text-subtle">{i.when}</p>
              </div>
              <p className="mt-1 text-sm text-muted">
                {i.price} · {i.notes}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-sm">
                <span className="text-ok">Real {ars(i.earnedArs)}</span>
                <span className="text-warn">Pipe {ars(i.pipelineArs)}</span>
                <span className="text-subtle">
                  Techo Y1 {ars(i.y1Ars)} · Y5 {ars(i.y5Ars)} · Y10 {ars(i.y10Ars)}
                </span>
              </div>
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
                    {e.monthlyBurnArs > 0 ? ars(e.monthlyBurnArs) : "—"}
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
