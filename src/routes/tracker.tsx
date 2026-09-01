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

export const Route = createFileRoute("/tracker")({ component: TrackerPage });

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

  const completedDays = cells.filter((c) => c.progress >= 1).length;
  const streak = useMemo(() => {
    let s = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      const c = cells[i];
      if (c.key > todayKey) continue;
      if (c.progress >= 1) s++;
      else if (c.key === todayKey) continue;
      else break;
    }
    // recount properly from today backwards
    s = 0;
    let d = new Date(today);
    for (;;) {
      const k = dateKey(d);
      const p = dayProgress(k, dayLog);
      if (p >= 1) s++;
      else if (k === todayKey) {
        /* today incomplete doesn't break past streak */
        d.setDate(d.getDate() - 1);
        continue;
      } else break;
      d.setDate(d.getDate() - 1);
      if (d.getFullYear() < year) break;
    }
    return s;
  }, [cells, dayLog, today, todayKey, year]);

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

      {/* Grilla año */}
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

      {/* Día seleccionado */}
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
