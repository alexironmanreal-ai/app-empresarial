import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  cajaTotalArs,
  companyScore,
  useHq,
  type Lead,
} from "@/lib/store";
import { computeReality } from "@/lib/reality";
import { ars } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Pin, X } from "lucide-react";

export const Route = createFileRoute("/widget")({
  component: WidgetPage,
});

function todayYmd(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pipelineStats(leads: Lead[]) {
  const open = leads.filter((l) => l.stage !== "cobrado" && l.stage !== "perdido");
  const pipelineArs = open.reduce((a, l) => a + (Number(l.amountArs) || 0), 0);
  const today = todayYmd();
  const due = open
    .filter((l) => l.nextContactAt && l.nextContactAt <= today)
    .sort((a, b) => (a.nextContactAt || "").localeCompare(b.nextContactAt || ""));
  const noDate = open.filter((l) => !l.nextContactAt).length;
  return { openCount: open.length, pipelineArs, due, noDate };
}

function WidgetPage() {
  const [now, setNow] = useState(() => new Date());
  const [hydrated, setHydrated] = useState(false);

  const done = useHq((s) => s.done);
  const caja = useHq((s) => s.caja);
  const lastReviewAt = useHq((s) => s.lastReviewAt);
  const extraMonthlyBurnArs = useHq((s) => s.extraMonthlyBurnArs);
  const dayLog = useHq((s) => s.dayLog);
  const daySnapshots = useHq((s) => s.daySnapshots);
  const leads = useHq((s) => s.leads) ?? [];
  const profile = useHq((s) => s.profile);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await useHq.persist.rehydrate();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const score = companyScore(done);
  const reality = useMemo(
    () =>
      computeReality(
        caja,
        done,
        lastReviewAt,
        score,
        extraMonthlyBurnArs,
        dayLog,
        daySnapshots,
      ),
    [caja, done, lastReviewAt, score, extraMonthlyBurnArs, dayLog, daySnapshots],
  );
  const pipe = useMemo(() => pipelineStats(leads), [leads]);

  const time = now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const date = now.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const runwayTone =
    reality.survivalTone === "danger"
      ? "text-danger"
      : reality.survivalTone === "warn"
        ? "text-warn"
        : "text-ok";

  function closeWidget() {
    if (window.sentinel?.closeWidget) {
      void window.sentinel.closeWidget();
    } else {
      window.close();
    }
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-muted">
        <p className="font-mono text-xs">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-fg select-none">
      {/* Barra de arrastre */}
      <header
        className="flex items-center justify-between gap-2 border-b border-border px-3 py-2"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Pin className="size-3.5 shrink-0 text-accent" />
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
            {profile?.company || "Sentinel"} · widget
          </span>
        </div>
        <button
          type="button"
          onClick={closeWidget}
          className="rounded p-1 text-subtle hover:bg-elevated hover:text-fg"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          aria-label="Cerrar widget"
        >
          <X className="size-3.5" />
        </button>
      </header>

      <main className="flex-1 overflow-auto p-3 space-y-3">
        {/* Reloj */}
        <section className="rounded-lg bg-surface px-3 py-2.5 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
            Ahora
          </p>
          <p className="mt-0.5 font-display text-3xl tabular-nums tracking-tight leading-none">
            {time}
          </p>
          <p className="mt-1 text-xs capitalize text-muted">{date}</p>
        </section>

        {/* Empresa + Runway */}
        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-surface px-3 py-2.5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
              Empresa
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums leading-none">
              {Math.round(score * 100)}%
            </p>
            <p className="mt-1 text-[11px] text-muted">construida</p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2.5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
              Runway
            </p>
            <p className={cn("mt-1 font-display text-2xl tabular-nums leading-none", runwayTone)}>
              {Number.isFinite(reality.runwayDays) ? `${reality.runwayDays}d` : "∞"}
            </p>
            <p className="mt-1 text-[11px] text-muted truncate">
              {ars(cajaTotalArs(caja))}
            </p>
          </div>
        </section>

        {/* Pipeline */}
        <section className="rounded-lg bg-surface px-3 py-2.5 shadow-[var(--shadow-border)]">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
              Pipeline
            </p>
            <p className="font-mono text-[11px] tabular-nums text-muted">
              {pipe.openCount} abiertos
            </p>
          </div>
          <p className="mt-1 font-display text-xl tabular-nums">
            {ars(pipe.pipelineArs)}
          </p>

          {pipe.due.length > 0 ? (
            <ul className="mt-2 space-y-1.5 border-t border-border pt-2">
              {pipe.due.slice(0, 3).map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-fg">{l.name}</span>
                  <span
                    className={cn(
                      "shrink-0 font-mono tabular-nums",
                      l.nextContactAt === todayYmd() ? "text-warn" : "text-danger",
                    )}
                  >
                    {l.nextContactAt === todayYmd() ? "hoy" : l.nextContactAt}
                  </span>
                </li>
              ))}
            </ul>
          ) : pipe.openCount === 0 ? (
            <p className="mt-2 text-xs text-warn">Sin leads abiertos</p>
          ) : pipe.noDate > 0 ? (
            <p className="mt-2 text-xs text-muted">
              {pipe.noDate} sin fecha de contacto
            </p>
          ) : (
            <p className="mt-2 text-xs text-ok">Nada vencido hoy</p>
          )}
        </section>
      </main>
    </div>
  );
}
