/**
 * Atajos a Excel / Word — nube (Microsoft 365) o app instalada (protocolos ms-*).
 */

import { FileSpreadsheet, FileText, ExternalLink, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OfficeRow = {
  app: string;
  icon: typeof FileSpreadsheet;
  cloud: { label: string; href: string };
  local: { label: string; href: string; note: string };
  tip: string;
};

const ROWS: OfficeRow[] = [
  {
    app: "Excel",
    icon: FileSpreadsheet,
    cloud: {
      label: "Excel en la nube",
      href: "https://www.office.com/launch/excel",
    },
    local: {
      label: "Excel instalado",
      href: "ms-excel:",
      note: "Windows / Office local · protocolo ms-excel:",
    },
    tip: "Hojas, caja, proyecciones, exportes",
  },
  {
    app: "Word",
    icon: FileText,
    cloud: {
      label: "Word en la nube",
      href: "https://www.office.com/launch/word",
    },
    local: {
      label: "Word instalado",
      href: "ms-word:",
      note: "Windows / Office local · protocolo ms-word:",
    },
    tip: "Contratos, CV, memos, propuestas",
  },
];

function openHref(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

export function OfficeShortcuts() {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl">Office · atajos</h2>
          <p className="mt-1 text-sm text-muted">
            Abrí Excel o Word en la nube (Microsoft 365) o en la app instalada si tenés
            Office en el equipo.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Uso en HQ</th>
              <th className="px-4 py-3 font-medium">Nube</th>
              <th className="px-4 py-3 font-medium">Instalado</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <tr key={row.app} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-elevated">
                        <Icon className="size-4 text-accent" strokeWidth={1.7} />
                      </span>
                      <span className="font-display text-lg">{row.app}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.tip}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => openHref(row.cloud.href)}
                    >
                      <ExternalLink className="size-3.5" />
                      {row.cloud.label}
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="w-fit gap-1.5"
                        onClick={() => openHref(row.local.href)}
                      >
                        <Monitor className="size-3.5" />
                        {row.local.label}
                      </Button>
                      <span className="font-mono text-[10px] text-subtle">{row.local.note}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-subtle">
        Si el atajo local no abre nada: instalá Microsoft Office o usá solo la nube. En Linux
        los protocolos <span className="font-mono">ms-excel:</span> /{" "}
        <span className="font-mono">ms-word:</span> son de Microsoft.
      </p>
    </section>
  );
}

export function OfficeShortcutChips({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        size="sm"
        variant="secondary"
        className="gap-1.5"
        onClick={() => openHref("https://www.office.com/launch/excel")}
        title="Excel Online"
      >
        <FileSpreadsheet className="size-3.5" />
        Excel
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="gap-1.5"
        onClick={() => openHref("https://www.office.com/launch/word")}
        title="Word Online"
      >
        <FileText className="size-3.5" />
        Word
      </Button>
    </div>
  );
}
