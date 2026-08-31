import { createFileRoute } from "@tanstack/react-router";
import { EXPENSES, INCOME, WEALTH, WEALTH_NOTES } from "@/lib/data";
import { money, compactUsd } from "@/lib/format";
import { useHq } from "@/lib/store";
import { ChartShell, WealthChart, StackedBars } from "@/components/chart-block";

export const Route = createFileRoute("/finanzas")({ component: Finanzas });

function Finanzas() {
  const currency = useHq((s) => s.currency);
  const scenario = useHq((s) => s.scenario);
  const setScenario = useHq((s) => s.setScenario);

  const incomeChart = INCOME.map((i) => ({
    label: i.name.split(" ")[0],
    y1: i.y1,
    y5: i.y5,
    y10: i.y10,
  }));

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Plata</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Finanzas</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Ingresos proyectados, gastos de existencia y wealth a 10 años.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["conservative", "base", "optimistic"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScenario(s)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              scenario === s ? "bg-accent text-accent-fg" : "bg-elevated text-muted"
            }`}
          >
            {s === "conservative" ? "Conservador" : s === "base" ? "Base" : "Optimista"}
          </button>
        ))}
      </div>

      <ChartShell title="Wealth proyectado · USD" height={300}>
        <WealthChart data={WEALTH} />
      </ChartShell>

      <p className="text-sm text-muted">{WEALTH_NOTES[scenario]}</p>

      <section>
        <h2 className="font-display text-2xl">Streams de ingreso</h2>
        <div className="mt-4 space-y-3">
          {INCOME.map((i) => (
            <div key={i.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-xl">{i.name}</p>
                <p className="font-mono text-[12px] text-subtle">{i.when}</p>
              </div>
              <p className="mt-1 text-sm text-muted">{i.price} · {i.notes}</p>
              <p className="mt-2 font-mono text-sm">
                Y1 {compactUsd(i.y1)} · Y5 {compactUsd(i.y5)} · Y10 {compactUsd(i.y10)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Gastos</h2>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">USD</th>
                <th className="px-4 py-3">Para</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSES.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="px-4 py-3">{e.name}</td>
                  <td className="px-4 py-3 text-muted">{e.kind}</td>
                  <td className="px-4 py-3 font-mono">{money(e.usd, currency)}</td>
                  <td className="px-4 py-3 text-muted">{e.neededFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
