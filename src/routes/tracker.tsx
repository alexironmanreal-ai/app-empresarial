import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  activitiesForWeekday,
  dateKey,
  dayProgress,
  daysInYear,
  parseKey,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useId } from "react";

export const Route = createFileRoute("/tracker")({ component: TrackerPage });

function ProgressChart({ data }: { data: { label: string; dias: number; pct: number }[] }) {
  const gid = useId().replace(/:/g, "");
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4a574" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#c4a574" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(196,165,116,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6f6a62", fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6f6a62", fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          width={36}
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
          formatter={(value: number, name: string) =>
            name === "pct" ? [`${value}%`, "Año"] : [value, "Días completos"]
          }
        />
        <Area
          type="monotone"
          dataKey="dias"
          name="dias"
          stroke="#c4a574"
          fill={`url(#${gid})`}
          strokeWidth={2}
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
  const acts = activitiesForWeekday(selected.getDay());
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

  /** Avance acumulado: sube cada vez que un día queda al 100% */
  const chartData = useMemo(() => {
    let cum = 0;
    const total = daysInYear(year);
    const points: { label: string; dias: number; pct: number }[] = [];
    // sample ~ every week + endpoints so the chart stays light
    cells.forEach((c, i) => {
      if (c.progress >= 1) cum += 1;
      const isSample = i % 7 === 0 || c.key === todayKey || i === cells.length - 1;
      if (isSample) {
        points.push({
          label: `${c.date.getDate()}/${c.date.getMonth() + 1}`,
          dias: cum,
          pct: Math.round((cum / total) * 1000) / 10,
        });
      }
    });
    return points;
  }, [cells, year, todayKey]);

  const completedDays = cells.filter((c) => c.progress >= 1).length;
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
          Lun–Mié: OS · Jue–Vie: YouTube · Sáb–Dom: descanso. Se actualiza con el
          calendario del sistema.
        </p>
        <p className="mt-2 font-mono text-[12px] text-subtle">
          {completedDays}/{daysInYear(year)} días completos · racha {streak}
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
        title="Avance acumulado"
        caption="Sube cuando marcás todas las actividades de un día. Se actualiza solo."
        height={240}
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

        <ul className="mt-4 space-y-2">
          {acts.map((a) => {
            const on = !!logForDay[a.id];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggleDayActivity(selectedKey, a.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left shadow-[var(--shadow-border)] transition-colors",
                    on ? "bg-accent/15 text-fg" : "bg-surface text-muted hover:text-fg",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded border text-[11px]",
                        on
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="text-sm">{a.title}</span>
                  </span>
                  {a.hours ? (
                    <span className="font-mono text-[11px] text-subtle">{a.hours} h</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 font-mono text-[12px] text-subtle">
          {Math.round(dayProgress(selectedKey, dayLog) * 100)}% del día
        </p>
      </section>

      <section className="rounded-xl bg-surface p-4 text-sm text-muted shadow-[var(--shadow-border)]">
        <p className="font-display text-lg text-fg">Regla de la semana</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong className="text-fg">Lun · Mar · Mié</strong> — cocinar, OS 4h,
            tarea 1h, OS 3h, inglés 1h, descansar
          </li>
          <li>
            <strong className="text-fg">Jue · Vie</strong> — cocinar, YouTube 4h,
            tarea 1h, YouTube 3h, inglés 1h, descansar
          </li>
          <li>
            <strong className="text-fg">Sáb · Dom</strong> — descanso / libre
          </li>
        </ul>
      </section>
    </div>
  );
}
