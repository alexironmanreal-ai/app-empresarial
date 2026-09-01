import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  activitiesForWeekday,
  dateKey,
  dayProgress,
  parseKey,
  WEEKDAY_LABEL,
} from "@/lib/tracker";
import {
  cajaTotalArs,
  companyScore,
  isTaskComplete,
  useHq,
  type DaySnapshot,
} from "@/lib/store";
import { TASKS } from "@/lib/data";
import { ars } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/registros")({ component: RegistrosPage });

function todayKey() {
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  return dateKey(t);
}

function RegistrosPage() {
  const dayLog = useHq((s) => s.dayLog);
  const dayNotes = useHq((s) => s.dayNotes);
  const daySnapshots = useHq((s) => s.daySnapshots);
  const setDayNote = useHq((s) => s.setDayNote);
  const closeDay = useHq((s) => s.closeDay);
  const done = useHq((s) => s.done);
  const caja = useHq((s) => s.caja);

  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const [noteDraft, setNoteDraft] = useState(dayNotes[today] ?? "");

  // Todos los días que tienen log, nota o snapshot + hoy
  const days = useMemo(() => {
    const keys = new Set<string>([
      ...Object.keys(dayLog),
      ...Object.keys(dayNotes),
      ...Object.keys(daySnapshots),
      today,
    ]);
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1)); // más reciente primero
  }, [dayLog, dayNotes, daySnapshots, today]);

  const selectedDate = parseKey(selected);
  const acts = activitiesForWeekday(selectedDate.getDay());
  const logForDay = dayLog[selected] ?? {};
  const progress = dayProgress(selected, dayLog);
  const snapshot = daySnapshots[selected];
  const note = dayNotes[selected] ?? "";

  function selectDay(key: string) {
    setSelected(key);
    setNoteDraft(dayNotes[key] ?? "");
  }

  function handleCloseDay() {
    const p0Open = TASKS.filter(
      (t) =>
        t.priority === "p0" &&
        !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
    ).length;
    const snap: DaySnapshot = {
      date: selected,
      companyPct: companyScore(done),
      p0Open,
      cajaArs: cajaTotalArs(caja),
      dayProgress: progress,
      note: noteDraft.trim(),
      closedAt: new Date().toISOString(),
    };
    closeDay(snap);
    setDayNote(selected, noteDraft.trim());
  }

  function saveNoteOnly() {
    setDayNote(selected, noteDraft.trim());
  }

  const completedDays = days.filter((k) => dayProgress(k, dayLog) >= 1).length;
  const registeredDays = Object.keys(daySnapshots).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Historial · no se borra al cambiar de día
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Registros</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Cada día que marcás actividades en el Tracker queda guardado para siempre.
          Acá podés ver el historial, agregar notas y cerrar el día con un snapshot
          (caja, P0, % empresa).
        </p>
        <p className="mt-2 font-mono text-[12px] text-subtle">
          {days.length} días con actividad · {completedDays} al 100% ·{" "}
          {registeredDays} cerrados con snapshot
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Lista de días */}
        <aside className="lg:col-span-2">
          <h2 className="font-display text-xl">Días</h2>
          <ul className="mt-3 max-h-[28rem] space-y-1 overflow-y-auto pr-1">
            {days.map((key) => {
              const d = parseKey(key);
              const p = dayProgress(key, dayLog);
              const hasSnap = !!daySnapshots[key];
              const isToday = key === today;
              const isSel = key === selected;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => selectDay(key)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      isSel
                        ? "bg-elevated text-fg"
                        : "text-muted hover:bg-elevated/50 hover:text-fg",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          p >= 1
                            ? "bg-accent"
                            : p > 0
                              ? "bg-accent/40"
                              : "bg-elevated",
                        )}
                      />
                      <span>
                        <span className="font-medium text-fg">
                          {WEEKDAY_LABEL[d.getDay()]}{" "}
                          {d.toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {isToday ? (
                          <span className="ml-1.5 font-mono text-[10px] text-accent">
                            hoy
                          </span>
                        ) : null}
                        {hasSnap ? (
                          <span className="ml-1.5 font-mono text-[10px] text-ok">
                            cerrado
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-subtle">
                      {Math.round(p * 100)}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {days.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Todavía no hay registros. Marcá actividades en Tracker.
            </p>
          ) : null}
        </aside>

        {/* Detalle del día */}
        <section className="lg:col-span-3 space-y-5">
          <div>
            <h2 className="font-display text-2xl">
              {WEEKDAY_LABEL[selectedDate.getDay()]}{" "}
              {selectedDate.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {selected === today ? " · hoy" : ""}
            </h2>
            <p className="mt-1 font-mono text-[12px] text-subtle">
              {Math.round(progress * 100)}% del plan del día
              {snapshot
                ? ` · cerrado ${new Date(snapshot.closedAt).toLocaleString("es-AR")}`
                : ""}
            </p>
          </div>

          {/* Snapshot si existe */}
          {snapshot ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SnapCard label="Empresa" value={`${Math.round(snapshot.companyPct * 100)}%`} />
              <SnapCard label="P0 abiertos" value={String(snapshot.p0Open)} />
              <SnapCard label="Caja" value={ars(snapshot.cajaArs)} />
              <SnapCard
                label="Día"
                value={`${Math.round(snapshot.dayProgress * 100)}%`}
              />
            </div>
          ) : null}

          {/* Actividades del día */}
          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Actividades registradas
            </p>
            <ul className="mt-3 space-y-2">
              {acts.map((a) => {
                const on = !!logForDay[a.id];
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                      on ? "bg-accent/10 text-fg" : "text-muted",
                    )}
                  >
                    <span className="flex items-center gap-2">
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
                      {a.title}
                    </span>
                    {a.hours ? (
                      <span className="font-mono text-[11px] text-subtle">
                        {a.hours} h
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-subtle">
              Para marcar/desmarcar usá el Tracker. Acá solo se consulta el historial.
            </p>
          </div>

          {/* Nota del día */}
          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Nota del día
            </p>
            <textarea
              className="mt-2 w-full min-h-[100px] resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Qué hiciste, qué trabó, qué cerraste, cómo te sentiste…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={saveNoteOnly}>
                Guardar nota
              </Button>
              <Button size="sm" onClick={handleCloseDay}>
                {snapshot ? "Actualizar cierre del día" : "Cerrar / registrar día"}
              </Button>
            </div>
            {note && note !== noteDraft ? (
              <p className="mt-2 text-[11px] text-subtle">
                Nota guardada distinta al borrador — guardá o cerrá el día para
                actualizar.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function SnapCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-elevated p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
        {label}
      </p>
      <p className="mt-1 font-display text-lg tabular-nums text-fg">{value}</p>
    </div>
  );
}
