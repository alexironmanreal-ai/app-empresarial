import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fetchMercadoPagoBalance } from "@/lib/mercadopago";
import { cajaTotalArs, companyScore, useHq } from "@/lib/store";
import {
  computeReality,
  estimatedMonthlyBurnArs,
  runwayLabel,
} from "@/lib/reality";
import { computeWealth } from "@/lib/wealth-engine";
import { liveExpenseSummary, liveIncomeSummary } from "@/lib/money-live";
import { WealthPanel } from "@/components/wealth-panel";
import { FxBadge } from "@/components/fx-badge";
import { AgeBanner } from "@/components/age-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IncomeExpenseSections } from "@/components/income-expense-sections";

export const Route = createFileRoute("/finanzas")({ component: Finanzas });

const arsFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function ars(n: number) {
  return arsFmt.format(n);
}

function Finanzas() {
  const mpToken = useHq((s) => s.mpToken);
  const mpBalance = useHq((s) => s.mpBalance);
  const caja = useHq((s) => s.caja);
  const setCajaRow = useHq((s) => s.setCajaRow);
  const addCajaRow = useHq((s) => s.addCajaRow);
  const removeCajaRow = useHq((s) => s.removeCajaRow);
  const syncMpIntoCaja = useHq((s) => s.syncMpIntoCaja);
  const done = useHq((s) => s.done);
  const lastReviewAt = useHq((s) => s.lastReviewAt);
  const extraMonthlyBurnArs = useHq((s) => s.extraMonthlyBurnArs);
  const setExtraMonthlyBurnArs = useHq((s) => s.setExtraMonthlyBurnArs);
  const leads = useHq((s) => s.leads);
  const paidExpenseIds = useHq((s) => s.paidExpenseIds);
  const toggleExpensePaid = useHq((s) => s.toggleExpensePaid);
  const arsPerUsd = useHq((s) => s.arsPerUsd) ?? 1400;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newArs, setNewArs] = useState("");

  const total = cajaTotalArs(caja);
  const score = companyScore(done);
  const reality = computeReality(
    caja,
    done,
    lastReviewAt,
    score,
    extraMonthlyBurnArs,
    undefined,
    undefined,
    arsPerUsd,
  );
  const baseBurn = estimatedMonthlyBurnArs(0, arsPerUsd);
  const wealth = computeWealth({ caja, leads, done });
  const income = liveIncomeSummary(leads, arsPerUsd);
  const expenses = liveExpenseSummary(paidExpenseIds, arsPerUsd);

  const toneClass =
    reality.survivalTone === "danger"
      ? "text-danger"
      : reality.survivalTone === "warn"
        ? "text-warn"
        : "text-ok";

  async function syncMp() {
    if (!mpToken.trim()) {
      setError("Pegá el Access Token de Mercado Pago en Ajustes.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bal = await fetchMercadoPagoBalance(mpToken.trim());
      syncMpIntoCaja(bal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al sincronizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Plata · ARS
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Finanzas</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Primero supervivencia (runway). Después proyecciones. 1 USD ={" "}
          {(arsPerUsd ?? 1400).toLocaleString("es-AR")} ARS (viva).
        </p>
      </header>

      <section
        className={cn(
          "rounded-xl border p-5 shadow-[var(--shadow-border)]",
          reality.survivalTone === "danger"
            ? "border-danger/40 bg-danger/10"
            : reality.survivalTone === "warn"
              ? "border-warn/40 bg-warn/10"
              : "border-border bg-surface",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Runway · supervivencia
            </p>
            <p className={cn("mt-2 font-display text-4xl tabular-nums", toneClass)}>
              {Number.isFinite(reality.runwayDays)
                ? `${reality.runwayDays} días`
                : "\u221e"}
            </p>
            <p className="mt-1 text-sm text-muted">{runwayLabel(reality.runwayDays)}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Caja / Burn
            </p>
            <p className="mt-2 font-display text-xl tabular-nums">
              {ars(reality.totalCajaArs)}
            </p>
            <p className="mt-0.5 font-mono text-sm text-muted">
              burn ~{ars(reality.monthlyBurnArs)}/mes
            </p>
          </div>
        </div>

        {reality.survivalTone === "danger" ? (
          <p className="mt-4 text-sm text-danger">
            Menos de 30 días. Todo lo que no cierre caja o baje burn esta semana es
            ruido. El OS y YouTube pueden esperar.
          </p>
        ) : reality.survivalTone === "warn" ? (
          <p className="mt-4 text-sm text-warn">
            Por debajo de 90 días o con P0 críticos abiertos. Priorizá ingresos y
            cierre de gaps legales/fiscales.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Runway cómodo. No es excusa para no vender. Seguí cerrando P0 y
            generando caja recurrente.
          </p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Caja · ARS</h2>
            <p className="mt-1 text-sm text-muted">
              Total disponible:{" "}
              <span className="font-mono text-fg">{ars(total)}</span>
            </p>
          </div>
          <Button size="sm" onClick={syncMp} disabled={loading}>
            {loading ? "Sincronizando…" : "Sincronizar Mercado Pago"}
          </Button>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {mpBalance ? (
          <p className="mt-2 font-mono text-[11px] text-subtle">
            MP · disponible {ars(mpBalance.availableArs)} · total{" "}
            {ars(mpBalance.totalArs)}
            {mpBalance.unavailableArs > 0
              ? ` · retenido ${ars(mpBalance.unavailableArs)}`
              : ""}{" "}
            · {new Date(mpBalance.fetchedAt).toLocaleString("es-AR")}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Sin sync aún. Cargá saldos a mano o token en Ajustes.
          </p>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3 text-right">Saldo ARS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {caja.map((row) => (
                <tr key={row.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {row.source === "mp" ? "Mercado Pago" : "Manual"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.source === "mp" ? (
                      <span className="font-mono tabular-nums">{ars(row.ars)}</span>
                    ) : (
                      <Input
                        className="ml-auto h-9 w-36 text-right font-mono"
                        type="number"
                        value={row.ars || ""}
                        onChange={(e) =>
                          setCajaRow(row.id, {
                            ars: Number(e.target.value) || 0,
                          })
                        }
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.source === "manual" &&
                    row.id !== "banco" &&
                    row.id !== "efectivo" ? (
                      <button
                        type="button"
                        className="text-xs text-subtle hover:text-danger"
                        onClick={() => removeCajaRow(row.id)}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              <tr className="bg-elevated/40">
                <td className="px-4 py-3 font-display text-lg" colSpan={2}>
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono text-lg tabular-nums">
                  {ars(total)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <p className="mb-1 text-[11px] text-subtle">Nueva cuenta</p>
            <Input
              className="h-9 w-40"
              placeholder="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-1 text-[11px] text-subtle">ARS</p>
            <Input
              className="h-9 w-32 font-mono"
              type="number"
              placeholder="0"
              value={newArs}
              onChange={(e) => setNewArs(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (!newName.trim()) return;
              addCajaRow(newName.trim(), Number(newArs) || 0);
              setNewName("");
              setNewArs("");
            }}
          >
            Agregar
          </Button>
        </div>
      </section>

      <FxBadge />
      <AgeBanner need="payments" />
      <WealthPanel />

      <IncomeExpenseSections
        income={income}
        expenses={expenses}
        wealthProgress={wealth.progress}
        extraMonthlyBurnArs={extraMonthlyBurnArs}
        setExtraMonthlyBurnArs={setExtraMonthlyBurnArs}
        baseBurn={baseBurn}
        realityMonthlyBurnArs={reality.monthlyBurnArs}
        toggleExpensePaid={toggleExpensePaid}
      />
    </div>
  );
}
