import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EXPENSES, INCOME, WEALTH, WEALTH_NOTES } from "@/lib/data";
import { ARS_PER_USD } from "@/lib/format";
import { fetchMercadoPagoBalance } from "@/lib/mercadopago";
import { cajaTotalArs, useHq } from "@/lib/store";
import {
  computeReality,
  estimatedMonthlyBurnArs,
  runwayLabel,
} from "@/lib/reality";
import { companyScore } from "@/lib/store";
import { ChartShell, WealthChart } from "@/components/chart-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finanzas")({ component: Finanzas });

const arsFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function ars(n: number) {
  return arsFmt.format(n);
}

function usdToArs(usd: number) {
  return usd * ARS_PER_USD;
}

function gapLabel(gap: number) {
  if (gap <= 0) return "Alcanzado / superado";
  return ars(gap);
}

function Finanzas() {
  const scenario = useHq((s) => s.scenario);
  const setScenario = useHq((s) => s.setScenario);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newArs, setNewArs] = useState("");

  const total = cajaTotalArs(caja);
  const score = companyScore(done);
  const reality = computeReality(caja, done, lastReviewAt, score, extraMonthlyBurnArs);
  const baseBurn = estimatedMonthlyBurnArs(0);

  const wealthArs = WEALTH.map((w) => ({
    year: w.year,
    conservative: usdToArs(w.conservative),
    base: usdToArs(w.base),
    optimistic: usdToArs(w.optimistic),
  }));

  const gapRows = wealthArs.map((w) => ({
    year: w.year,
    target: w[scenario],
    gap: Math.max(0, w[scenario] - total),
    pct: w[scenario] > 0 ? Math.min(100, (total / w[scenario]) * 100) : 0,
  }));

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
          {ARS_PER_USD.toLocaleString("es-AR")} ARS.
        </p>
      </header>

      {/* RUNWAY — lo que importa */}
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
                : "∞"}
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

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-[11px] text-subtle">
              Burn extra mensual (ARS) — comida, tools, etc.
            </p>
            <Input
              className="h-9 w-40 font-mono"
              type="number"
              placeholder="0"
              value={extraMonthlyBurnArs || ""}
              onChange={(e) =>
                setExtraMonthlyBurnArs(Number(e.target.value) || 0)
              }
            />
          </div>
          <p className="pb-2 font-mono text-[11px] text-subtle">
            Base gastos data: {ars(baseBurn)} + extra
          </p>
        </div>
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

      <div className="flex flex-wrap gap-2">
        {(["conservative", "base", "optimistic"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScenario(s)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              scenario === s
                ? "bg-accent text-accent-fg"
                : "bg-elevated text-muted"
            }`}
          >
            {s === "conservative"
              ? "Conservador"
              : s === "base"
                ? "Base"
                : "Optimista"}
          </button>
        ))}
      </div>

      <ChartShell title="Proyección empresa · ARS" height={300}>
        <WealthChart data={wealthArs} />
      </ChartShell>
      <p className="text-sm text-muted">{WEALTH_NOTES[scenario]}</p>

      <section>
        <h2 className="font-display text-2xl">Cuánto falta · vs proyección</h2>
        <p className="mt-1 text-sm text-muted">
          Caja actual ({ars(total)}) contra el estimado del escenario{" "}
          <span className="text-fg">
            {scenario === "conservative"
              ? "conservador"
              : scenario === "base"
                ? "base"
                : "optimista"}
          </span>
          .
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3 text-right">Meta ARS</th>
                <th className="px-4 py-3 text-right">Caja hoy</th>
                <th className="px-4 py-3 text-right">Falta</th>
                <th className="px-4 py-3 text-right">Avance</th>
              </tr>
            </thead>
            <tbody>
              {gapRows.map((r) => (
                <tr key={r.year} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">Año {r.year}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {ars(r.target)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {ars(total)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums ${
                      r.gap <= 0 ? "text-ok" : "text-warn"
                    }`}
                  >
                    {gapLabel(r.gap)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                    {r.pct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Proyección por año · ARS</h2>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3 text-right">Conservador</th>
                <th className="px-4 py-3 text-right">Base</th>
                <th className="px-4 py-3 text-right">Optimista</th>
              </tr>
            </thead>
            <tbody>
              {wealthArs.map((w) => (
                <tr key={w.year} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">Año {w.year}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {ars(w.conservative)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {ars(w.base)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {ars(w.optimistic)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Streams de ingreso · ARS</h2>
        <div className="mt-4 space-y-3">
          {INCOME.map((i) => (
            <div
              key={i.id}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-xl">{i.name}</p>
                <p className="font-mono text-[12px] text-subtle">{i.when}</p>
              </div>
              <p className="mt-1 text-sm text-muted">
                {i.price} · {i.notes}
              </p>
              <p className="mt-2 font-mono text-sm">
                Y1 {ars(usdToArs(i.y1))} · Y5 {ars(usdToArs(i.y5))} · Y10{" "}
                {ars(usdToArs(i.y10))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Gastos · ARS</h2>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">ARS</th>
                <th className="px-4 py-3">Para</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSES.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="px-4 py-3">{e.name}</td>
                  <td className="px-4 py-3 text-muted">{e.kind}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {ars(usdToArs(e.usd))}
                  </td>
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
