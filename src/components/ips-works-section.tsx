import { useState } from "react";
import { ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { useHq } from "@/lib/store";
import { captureDeviceLocation, formatAccessAt } from "@/lib/ips-works";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function IpsWorksSection() {
  const lastHqAccessAt = useHq((s) => s.lastHqAccessAt);
  const lastDeviceLocation = useHq((s) => s.lastDeviceLocation);
  const deviceLocationHistory = useHq((s) => s.deviceLocationHistory) ?? [];
  const connectedApps = useHq((s) => s.connectedApps) ?? [];
  const recordDeviceLocation = useHq((s) => s.recordDeviceLocation);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function refreshLocation() {
    setErr("");
    setBusy(true);
    try {
      const r = await captureDeviceLocation();
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      recordDeviceLocation(r.ping);
    } finally {
      setBusy(false);
    }
  }

  const apps = connectedApps.filter((a) => a.connected);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">IPs WORKS</h2>
          <p className="mt-1 text-sm text-muted">
            Dónde estuvo el portátil por última vez, IP pública y cuándo entraste a Sentinel HQ y a cada app conectada.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={busy}
          onClick={() => void refreshLocation()}
        >
          <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Capturando…" : "Actualizar ubicación"}
        </Button>
      </div>

      {err ? (
        <p className="text-sm text-danger" role="alert">
          {err}
        </p>
      ) : null}

      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent/15 p-2 text-accent">
            <MapPin className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Portátil · última ubicación
            </p>
            {lastDeviceLocation ? (
              <>
                <p className="mt-1 font-display text-xl leading-snug">
                  {lastDeviceLocation.place}
                </p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {lastDeviceLocation.lat.toFixed(5)}, {lastDeviceLocation.lon.toFixed(5)}
                  {lastDeviceLocation.accuracyM
                    ? ` · ±${lastDeviceLocation.accuracyM} m`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-muted">
                  IP pública:{" "}
                  <span className="font-mono text-fg">{lastDeviceLocation.publicIp}</span>
                  {" · "}
                  {formatAccessAt(lastDeviceLocation.at)}
                </p>
                <a
                  href={lastDeviceLocation.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  Ver en mapa
                </a>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Sin ubicación todavía. Tocá «Actualizar ubicación» (pide permiso de GPS).
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
              <th className="px-4 py-3 font-medium">Recurso</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Último acceso</th>
              <th className="px-4 py-3 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60">
              <td className="px-4 py-3 font-medium text-fg">Sentinel HQ</td>
              <td className="px-4 py-3">
                <Badge tone="ok">HQ</Badge>
              </td>
              <td className="px-4 py-3 tabular-nums text-muted">
                {formatAccessAt(lastHqAccessAt)}
              </td>
              <td className="px-4 py-3 font-mono text-[11px] text-subtle">
                {lastHqAccessAt
                  ? new Date(lastHqAccessAt).toLocaleString("es-AR")
                  : "—"}
              </td>
            </tr>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-muted">
                  Conectá apps arriba para registrar su último acceso.
                </td>
              </tr>
            ) : (
              apps.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{a.name}</p>
                    <p className="font-mono text-[10px] text-subtle">{a.appKey}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>App</Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">
                    {formatAccessAt(a.lastOpenedAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-subtle">
                    {a.lastOpenedAt
                      ? new Date(a.lastOpenedAt).toLocaleString("es-AR")
                      : "Sin abrir desde HQ"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deviceLocationHistory.length > 1 ? (
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            Historial de ubicaciones ({deviceLocationHistory.length})
          </p>
          <ul className="mt-3 space-y-2">
            {deviceLocationHistory.slice(0, 12).map((h, i) => (
              <li
                key={`${h.at}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2 text-sm last:border-0"
              >
                <span className="min-w-0 truncate text-fg">{h.place}</span>
                <span className="shrink-0 font-mono text-[11px] text-subtle">
                  {h.publicIp} · {formatAccessAt(h.at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
