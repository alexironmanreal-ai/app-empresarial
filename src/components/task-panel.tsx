import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Task } from "@/lib/types";
import { CATEGORY_LABEL, daysLabel, money, PRIORITY_LABEL } from "@/lib/format";
import { isTaskComplete, taskProgress, useHq } from "@/lib/store";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ChartShell, CompareArea } from "./chart-block";
import { Mark } from "./mark";
import { cn } from "@/lib/utils";

export function TaskPanel({ task }: { task: Task }) {
  const done = useHq((s) => s.done);
  const toggle = useHq((s) => s.toggle);
  const [open, setOpen] = useState(false);
  const complete = isTaskComplete(
    task.id,
    task.subtasks.map((s) => s.id),
    done,
  );
  const progress = taskProgress(
    task.id,
    task.subtasks.map((s) => s.id),
    done,
  );

  return (
    <article
      className={cn(
        "relative z-10 rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[box-shadow] duration-150",
        complete && "opacity-70",
      )}
    >
      <div className="flex items-start gap-1 p-3 sm:p-4">
        <Mark
          checked={complete}
          onChange={() => toggle(task.id)}
          label={`Marcar ${task.title}`}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={task.priority}>{task.priority.toUpperCase()}</Badge>
            <Badge>{CATEGORY_LABEL[task.category]}</Badge>
            <span className="font-mono text-[11px] text-subtle">
              {daysLabel(task.days)} · {money(task.costUsd)}
            </span>
          </div>
          <h3
            className={cn(
              "mt-2 font-display text-xl leading-snug text-fg sm:text-2xl",
              complete && "line-through decoration-muted/60",
            )}
          >
            {task.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{task.why}</p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress * 100} className="flex-1" />
            <span className="font-mono text-[11px] tabular-nums text-subtle">
              {Math.round(progress * 100)}%
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-subtle transition-transform duration-150",
                open && "rotate-180",
              )}
            />
          </div>
        </button>
      </div>

      {open ? (
        <div className="space-y-5 border-t border-border px-4 pb-5 pt-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Costo · ARS"
              value={money(task.costUsd)}
              hint={task.spendNote}
            />
            <Stat
              label="Puede cobrar · ARS"
              value={task.chargeUsd ? money(task.chargeUsd) : "—"}
              hint={task.chargeNote}
            />
            <Stat
              label="Impacto"
              value={`${task.impact}/10`}
              hint={PRIORITY_LABEL[task.priority]}
            />
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Cómo se hace
            </p>
            <ol className="mt-2 space-y-2">
              {task.how.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-fg">
                  <span className="font-mono text-[11px] text-subtle tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {task.subtasks.length > 0 ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
                Tareas concretas
              </p>
              <ul className="mt-2 divide-y divide-border">
                {task.subtasks.map((st) => (
                  <li key={st.id} className="flex items-center gap-1 py-1">
                    <Mark
                      size="sm"
                      checked={!!done[st.id] || complete}
                      onChange={() => toggle(st.id)}
                      label={st.title}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        done[st.id] || complete
                          ? "text-muted line-through"
                          : "text-fg",
                      )}
                    >
                      {st.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-sm text-muted">
            <span className="text-subtle">Desbloquea: </span>
            {task.unlocks}
          </p>

          <ChartShell
            title="Valor a 6 meses · ARS"
            caption="Línea llena: si lo cerrás ahora. Punteada: si lo postergás."
            height={200}
          >
            <CompareArea data={task.chart} />
          </ChartShell>
        </div>
      ) : null}
    </article>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg bg-elevated p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-1 font-display text-xl tabular-nums text-fg">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
    </div>
  );
}
