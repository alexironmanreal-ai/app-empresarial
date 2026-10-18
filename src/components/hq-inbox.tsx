import { Link } from "@tanstack/react-router";
import type { HqAction } from "@/lib/hq-actions";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function HqInbox({ actions }: { actions: HqAction[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl">Hoy · 3 acciones</h2>
          <p className="mt-1 text-sm text-muted">
            Solo lo que mueve supervivencia o plata. El resto es ruido.
          </p>
        </div>
      </div>
      {actions.length === 0 ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted shadow-[var(--shadow-border)]">
          Nada urgente. Mantené el registro del día y el pipeline vivo.
        </p>
      ) : (
        <ul className="space-y-2">
          {actions.map((a, i) => (
            <li key={a.id}>
              <Link
                to={a.href}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border p-4 shadow-[var(--shadow-border)] transition-colors hover:bg-elevated/40",
                  a.urgency === "danger"
                    ? "border-danger/40 bg-danger/5"
                    : a.urgency === "warn"
                      ? "border-warn/40 bg-warn/5"
                      : "border-border bg-surface",
                )}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                    #{i + 1}
                  </p>
                  <p className="mt-1 font-display text-xl">{a.title}</p>
                  <p className="mt-1 text-sm text-muted">{a.why}</p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
