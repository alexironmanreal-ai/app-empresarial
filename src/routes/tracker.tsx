import { createFileRoute } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import {
  activitiesForWeekday,
  dateKey,
  dayProgress,
  daysInYear,
  parseKey,
  planForWeekday,
  startOfYear,
  WEEKDAY_LABEL,
} from "@/lib/tracker";
import { useHq } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChartShell } from "@/components/chart-block";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/tracker")({ component: TrackerPage });

type ChartPoint = {
  label: string;
  /** % de ese día (0–100), aunque sea 56 o 79 */
  dia: number;
  /** Suma de fracciones de día a lo largo del año */
  avance: number;
};

function ProgressChart({ data }: { data: ChartPoint[] }) {
  const g1 = useId().replace(/:/g, "");
  const g2 = useId().replace(/:/g, "");
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4a574" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#c4a574" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4f0e8" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#f4f0e8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(196,165,116,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6f6a62", fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          yAxisId="dia"
          tick={{ fontSize: 11, fill: "#6f6a62", fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          width={36}
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}`}
        />
        <YAxis
          yAxisId="avance"
          orientation="right"
          tick={{ fontSize: 11, fill: "#6f6a62", fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          width={40}
          domain={[0, "auto"]}
        />
        <Tooltip
          contentStyle={{
            background: "#0e0e12",
            border: "1px solid rgba(196,165,116,0.2)",
            borderRadius: 12,
            fontSize: 12,
            color: "#f4f0e8",
          }}
          formatter={(value: number, name: string) => {
            if (name === "dia") return [`${value}%`, "% del día"];
            return [value.toFixed(2), "Avance (días equiv.)"];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#a39e94" }} />
        <Area
          yAxisId="dia"
          type="monotone"
          dataKey="dia"
          name="% del día"
          stroke="#c4a574"
          fill={`url(#${g1})`}
          strokeWidth={2}
        />
        <Area
          yAxisId="avance"
          type="monotone"
          dataKey="avance"
          name="Avance acumulado"
          stroke="#f4f0e8"
          fill={`url(#${g2})`}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrackerPage() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    return t;
  }, []);
  const year = today.getFullYear();
  const todayKey = dateKey(today);

  const dayLog = useHq((s) => s.dayLog);
  const toggleDayActivity = useHq((s) => s.toggleDayActivity);

  const [selectedKey, setSelectedKey] = useState(todayKey);

  const selected = parseKey(selectedKey);
  const dayPlan = planForWeekday(selected.getDay());
  const acts = dayPlan.activities;
  const logForDay = dayLog[selectedKey] ?? {};

  const cells = useMemo(() => {
    const total = daysInYear(year);
    const start = startOfYear(year);
    const list: { key: string; date: Date; progress: number; isToday: boolean }[] =
      [];
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      d.setHours(12, 0, 0, 0);
      const key = dateKey(d);
      list.push({
        key,
        date: d,
        progress: dayProgress(key, dayLog),
        isToday: key === todayKey,
      });
    }
    return list;
  }, [year, dayLog, todayKey]);

  /** Cada día aporta su % (0.56, 0.79, 1…) al gráfico y al acumulado */
  const chartData = useMemo(() => {
    let cum = 0;
    const points: ChartPoint[] = [];
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (c.key > todayKey) break;
      cum += c.progress;
      points.push({
        label: `${c.date.getDate()}/${c.date.getMonth() + 1}`,
        dia: Math.round(c.progress * 1000) / 10,
        avance: Math.round(cum * 100) / 100,
      });
    }
    if (points.length === 0 && cells[0]) {
      points.push({ label: "1/1", dia: 0, avance: 0 });
    }
    return points;
  }, [cells, todayKey]);

  const completedDays = cells.filter((c) => c.progress >= 1).length;
  const partialScore = useMemo(
    () => Math.round(cells.reduce((a, c) => a + c.progress, 0) * 10) / 10,
    [cells],
  );

  const streak = useMemo(() => {
    let s = 0;
    let d = new Date(today);
    for (;;) {
      const k = dateKey(d);
      const p = dayProgress(k, dayLog);
      if (p >= 1) s++;
      else if (k === todayKey) {
        d.setDate(d.getDate() - 1);
        continue;
      } else break;
      d.setDate(d.getDate() - 1);
      if (d.getFullYear() < year) break;
    }
    return s;
  }, [dayLog, today, todayKey, year]);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          365 días · {year}
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Tracker</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Lun/Mié/Vie: SIF · Mar/Jue: YouTube · Sáb/Dom: ensayos y culto. Marcá
          cada bloque al completarlo; el % del día se actualiza solo.
        </p>
        <p className="mt-2 font-mono text-[12px] text-subtle">
          {completedDays} días al 100% · {partialScore} días-equiv. · racha {streak}
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl">Año</h2>
        <div className="mt-4 flex flex-wrap gap-1">
          {cells.map((c) => (
            <button
              key={c.key}
              type="button"
              title={`${c.key} · ${Math.round(c.progress * 100)}%`}
              onClick={() => setSelectedKey(c.key)}
              className={cn(
                "size-3 rounded-sm transition-colors sm:size-3.5",
                c.progress >= 1
                  ? "bg-accent"
                  : c.progress > 0
                    ? "bg-accent/40"
                    : "bg-elevated",
                c.key === selectedKey && "ring-2 ring-accent ring-offset-1 ring-offset-bg",
                c.isToday && "outline outline-1 outline-fg/40",
              )}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] text-subtle">
          Cada cuadrado = 1 día. Dorado = completo · medio = parcial · borde = hoy
        </p>
      </section>

      <ChartShell
        title="Avance del tracker"
        caption="Dorado = % de ese día (56, 79, 100…). Blanco = suma acumulada de fracciones."
        height={260}
      >
        <ProgressChart data={chartData} />
      </ChartShell>

      <section>
        <h2 className="font-display text-2xl">
          {WEEKDAY_LABEL[selected.getDay()]}{" "}
          {selected.toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {selectedKey === todayKey ? " · hoy" : ""}
        </h2>
        <p className="mt-1 text-sm text-accent">{dayPlan.theme}</p>
        <p className="mt-1 max-w-2xl text-sm text-muted">{dayPlan.objective}</p>

        <ul className="mt-4 space-y-2">
          {acts.map((a) => {
            const on = !!logForDay[a.id];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggleDayActivity(selectedKey, a.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left shadow-[var(--shadow-border)] transition-colors",
                    on ? "bg-accent/15 text-fg" : "bg-surface text-muted hover:text-fg",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border text-[11px]",
                        on
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      {a.time ? (
                        <span className="mb-0.5 block font-mono text-[10px] text-subtle">
                          {a.time}
                        </span>
                      ) : null}
                      <span className="text-sm">{a.title}</span>
                    </span>
                  </span>
                  {a.hours ? (
                    <span className="shrink-0 font-mono text-[11px] text-subtle">
                      {a.hours} h
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 font-mono text-[12px] text-subtle">
          {Math.round(dayProgress(selectedKey, dayLog) * 100)}% del día · {acts.length}{" "}
          bloques
        </p>
      </section>

      <section className="rounded-xl bg-surface p-4 text-sm text-muted shadow-[var(--shadow-border)]">
        <p className="font-display text-lg text-fg">Mapa de la semana</p>
        <ul className="mt-2 list-inside list-disc space-y-1.5">
          <li>
            <strong className="text-fg">Lun</strong> — SIF ingeniería: un objetivo
            técnico, documentar y no saltar de proyecto
          </li>
          <li>
            <strong className="text-fg">Mar</strong> — YouTube producción: guion →
            grabar → editar (cerrar el guion, no perfeccionarlo infinito)
          </li>
          <li>
            <strong className="text-fg">Mié</strong> — SIF dirección + edu física
            17–18h: prioridades, equipo, decisiones registradas
          </li>
          <li>
            <strong className="text-fg">Jue</strong> — YouTube publicación: terminar
            y publicar/programar lo del martes
          </li>
          <li>
            <strong className="text-fg">Vie</strong> — SIF estrategia + edu física
            17–18h: review semanal y plan de la próxima
          </li>
          <li>
            <strong className="text-fg">Sáb · Dom</strong> — ensayos 8–10 y 15–18,
            culto 19–21; sin sobrecargar con trabajo empresarial
          </li>
        </ul>
      </section>
    </div>
  );
}
