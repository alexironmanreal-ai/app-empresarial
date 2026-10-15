import { useHq } from "@/lib/store";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function ContractsPanel() {
  const contracts = useHq((s) => s.contracts);
  const toggle = useHq((s) => s.toggleContract);

  return (
    <section className="space-y-3" data-hide-in-deep-work="true">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Contracts
        </p>
        <h2 className="font-display text-2xl">Contratos consigo mismo</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          If/then. No son motivaciones: son reglas. Desactivá solo si la física cambió.
        </p>
      </div>
      <ul className="space-y-2">
        {contracts.map((c) => (
          <li
            key={c.id}
            className={cn(
              "flex flex-wrap items-start justify-between gap-3 rounded-xl px-4 py-3 shadow-[var(--shadow-border)]",
              c.active ? "bg-surface" : "bg-elevated/50 opacity-60",
            )}
          >
            <div>
              <p className="font-display text-lg text-fg">{c.title}</p>
              <p className="mt-0.5 text-sm text-muted">{c.rule}</p>
            </div>
            <Button
              size="sm"
              variant={c.active ? "default" : "secondary"}
              onClick={() => toggle(c.id)}
            >
              {c.active ? "Activo" : "Off"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
