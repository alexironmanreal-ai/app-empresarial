import { GAPS, TASKS, WEALTH } from "@/lib/data";
import { compactUsd, money, toArs } from "@/lib/format";
import {
  cajaTotalArs,
  companyScore,
  isTaskComplete,
  scoreByPriority,
  useHq,
} from "@/lib/store";
import { dayProgress, dateKey, daysInYear } from "@/lib/tracker";

/** Hoja lista para imprimir: dashboard + stats. Visible solo en impresión o vista previa. */
export function PrintReport() {
  const done = useHq((s) => s.done);
  const profile = useHq((s) => s.profile);
  const caja = useHq((s) => s.caja);
  const dayLog = useHq((s) => s.dayLog);
  const scenario = useHq((s) => s.scenario);

  const score = companyScore(done);
  const p0 = scoreByPriority(done, "p0");
  const p1 = scoreByPriority(done, "p1");
  const totalArs = cajaTotalArs(caja);
  const wealth5 = WEALTH.find((w) => w.year === 5)!;
  const wealth10 = WEALTH.find((w) => w.year === 10)!;

  const closed = TASKS.filter((t) =>
    isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).length;
  const open = TASKS.length - closed;

  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let trackerDays = 0;
  let trackerPartial = 0;
  for (let i = 0; i < daysInYear(year); i++) {
    const d = new Date(year, 0, 1 + i);
    d.setHours(12, 0, 0, 0);
    if (d > today) break;
    const p = dayProgress(dateKey(d), dayLog);
    trackerPartial += p;
    if (p >= 1) trackerDays += 1;
  }

  const when = new Date().toLocaleString("es-AR");

  return (
    <div id="print-report" className="print-only">
      <header className="print-header">
        <div>
          <p className="print-kicker">{profile.company} · AXION HQ</p>
          <h1>Dashboard · reporte</h1>
          <p className="print-meta">
            {profile.founder} · {when}
          </p>
        </div>
        <div className="print-score">
          <p className="print-kicker">Empresa</p>
          <p className="print-big">{Math.round(score * 100)}%</p>
          <p>
            P0 {Math.round(p0 * 100)}% · P1 {Math.round(p1 * 100)}%
          </p>
        </div>
      </header>

      <section className="print-grid">
        <div className="print-card">
          <p className="print-kicker">Tareas</p>
          <p className="print-big">
            {closed}/{TASKS.length}
          </p>
          <p>{open} abiertas</p>
        </div>
        <div className="print-card">
          <p className="print-kicker">Caja ARS</p>
          <p className="print-big">{money(totalArs / 1400)}</p>
          <p>{caja.length} cuentas</p>
        </div>
        <div className="print-card">
          <p className="print-kicker">Wealth Y5 base</p>
          <p className="print-big">{compactUsd(wealth5.base)}</p>
          <p>escenario {scenario}</p>
        </div>
        <div className="print-card">
          <p className="print-kicker">Wealth Y10 base</p>
          <p className="print-big">{compactUsd(wealth10.base)}</p>
          <p>proyección</p>
        </div>
        <div className="print-card">
          <p className="print-kicker">Tracker 365</p>
          <p className="print-big">{trackerDays}</p>
          <p>{trackerPartial.toFixed(1)} días-equiv. · {year}</p>
        </div>
        <div className="print-card">
          <p className="print-kicker">Gaps</p>
          <p className="print-big">{GAPS.length}</p>
          <p>áreas críticas</p>
        </div>
      </section>

      <section>
        <h2>Caja por cuenta · ARS</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Origen</th>
              <th className="num">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {caja.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.source === "mp" ? "Mercado Pago" : "Manual"}</td>
                <td className="num">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                  }).format(r.ars)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={2}>
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                  }).format(totalArs)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Gaps · costo ARS</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Área</th>
              <th>Falta</th>
              <th>Tiempo</th>
              <th className="num">Costo</th>
            </tr>
          </thead>
          <tbody>
            {GAPS.map((g) => (
              <tr key={g.id}>
                <td>{g.area}</td>
                <td>{g.missing}</td>
                <td>{g.time}</td>
                <td className="num">{money(g.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Proyección wealth · ARS</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Año</th>
              <th className="num">Conservador</th>
              <th className="num">Base</th>
              <th className="num">Optimista</th>
            </tr>
          </thead>
          <tbody>
            {WEALTH.map((w) => (
              <tr key={w.year}>
                <td>{w.year}</td>
                <td className="num">{compactUsd(w.conservative)}</td>
                <td className="num">{compactUsd(w.base)}</td>
                <td className="num">{compactUsd(w.optimistic)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Tareas abiertas (P0–P1)</h2>
        <ul className="print-list">
          {TASKS.filter(
            (t) =>
              (t.priority === "p0" || t.priority === "p1") &&
              !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
          ).map((t) => (
            <li key={t.id}>
              <strong>{t.priority.toUpperCase()}</strong> · {t.title} · {money(t.costUsd)}
            </li>
          ))}
        </ul>
      </section>

      <footer className="print-footer">
        AXION HQ · reporte generado en el navegador · no es un documento fiscal
      </footer>
    </div>
  );
}

export function printDashboard() {
  window.print();
}
