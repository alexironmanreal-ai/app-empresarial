import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  downloadHqBackup,
  exportMonthCsv,
  buildMonthClosure,
  isMonthClosed,
  currentMonthKey,
} from "@/lib/hq-backup";
import { useHq } from "@/lib/store";
import { Download, FileSpreadsheet, Lock, Pin } from "lucide-react";

export function HqTools() {
  const closeMonth = useHq((s) => s.closeMonth);
  const monthClosures = useHq((s) => s.monthClosures) ?? [];
  const key = currentMonthKey();
  const closed = isMonthClosed(key);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const isElectron = typeof window !== "undefined" && !!window.sentinel?.isElectron;

  useEffect(() => {
    if (!window.sentinel) return;
    void window.sentinel.isWidgetOpen?.().then(setWidgetOpen);
    const unsub = window.sentinel.onWidgetState?.(setWidgetOpen);
    return () => {
      unsub?.();
    };
  }, []);

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
        Respaldo y cierre
      </p>
      <p className="mt-1 text-sm text-muted">
        Backup JSON de todo el HQ · CSV del mes · cierre suave del mes en curso
        {isElectron ? " · widget anclado a la pantalla" : ""}.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {isElectron ? (
          <Button
            size="sm"
            variant={widgetOpen ? "default" : "secondary"}
            className="gap-1.5"
            onClick={() => {
              void window.sentinel?.toggleWidget()?.then(setWidgetOpen);
            }}
          >
            <Pin className="size-3.5" />
            {widgetOpen ? "Quitar widget" : "Anclar widget"}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => downloadHqBackup()}
        >
          <Download className="size-3.5" />
          Backup HQ (.json)
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => exportMonthCsv()}
        >
          <FileSpreadsheet className="size-3.5" />
          CSV mes {key}
        </Button>
        <Button
          size="sm"
          variant={closed ? "secondary" : "default"}
          className="gap-1.5"
          disabled={closed}
          onClick={() => {
            const c = buildMonthClosure();
            if (
              window.confirm(
                `¿Cerrar ${c.key}?\nCobrado ${c.cobradoArs} · Perdido ${c.perdidoArs}\n(Se puede seguir cargando leads; queda el snapshot.)`,
              )
            ) {
              closeMonth(c);
              exportMonthCsv(c.key);
            }
          }}
        >
          <Lock className="size-3.5" />
          {closed ? `Mes ${key} cerrado` : `Cerrar mes ${key}`}
        </Button>
      </div>
      {monthClosures.length > 0 ? (
        <p className="mt-2 font-mono text-[10px] text-subtle">
          Cierres:{" "}
          {monthClosures
            .slice(-6)
            .map((m) => m.key)
            .join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
