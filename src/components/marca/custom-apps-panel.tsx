import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { num } from "@/lib/format";
import { useHq } from "@/lib/store";
import {
  CUSTOM_PRESETS,
  callCustomApi,
  newCustomApi,
  type CustomApi,
  type CustomAuth,
} from "@/lib/social";
import { ChartShell, SimpleLine } from "@/components/chart-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "./shared";

const AUTH_OPTIONS: { id: CustomAuth; label: string }[] = [
  { id: "bearer", label: "Bearer token" },
  { id: "header", label: "Header propio" },
  { id: "query", label: "Parámetro en la URL" },
  { id: "none", label: "Sin autenticación" },
];

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CustomAppsPanel() {
  const apps = useHq((s) => s.customApis);
  const add = useHq((s) => s.addCustomApi);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Otras apps · conectores
        </p>
        <h2 className="mt-1 font-display text-4xl sm:text-5xl">Tus APIs</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Conectá cualquier app que tenga API: URL base, ruta, key y (si querés)
          la ruta del número que querés seguir. Se guarda cada medición y se
          dibuja el historial.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => add(newCustomApi())}>
          <Plus /> Nueva app
        </Button>
        {CUSTOM_PRESETS.map((p) => (
          <Button
            key={p.name}
            size="sm"
            variant="secondary"
            onClick={() => add(newCustomApi(p))}
          >
            {p.name}
          </Button>
        ))}
      </div>

      <p className="rounded-lg bg-warn/15 px-3 py-2 text-sm text-warn">
        Estas llamadas salen directo del navegador, así que solo funcionan con
        APIs que permiten CORS. Si una falla con “no se pudo conectar”, hay que
        agregarle un proxy (como los de Instagram, X y LinkedIn).
      </p>

      {apps.length === 0 ? (
        <p className="text-sm text-muted">
          Todavía no conectaste ninguna app. Tocá “Nueva app” o un preset.
        </p>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <CustomAppCard key={a.id} api={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomAppCard({ api }: { api: CustomApi }) {
  const update = useHq((s) => s.updateCustomApi);
  const remove = useHq((s) => s.removeCustomApi);
  const [loading, setLoading] = useState(false);

  const chart = useMemo(
    () =>
      api.history.map((h) => {
        const d = new Date(h.at);
        return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: h.value };
      }),
    [api.history],
  );

  const set = (patch: Partial<CustomApi>) => update(api.id, patch);

  async function test() {
    setLoading(true);
    set({ lastError: null });
    try {
      const r = await callCustomApi(api);
      const at = new Date().toISOString();
      set({
        lastStatus: r.status,
        lastPreview: r.preview,
        lastSyncAt: at,
        lastError: null,
        lastValue: r.value,
        history:
          r.value !== null
            ? [...api.history, { at, value: r.value }].slice(-90)
            : api.history,
      });
    } catch (e) {
      set({
        lastError: e instanceof Error ? e.message : "Error desconocido",
        lastSyncAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  const needsName = api.auth === "header" || api.auth === "query";

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          className="max-w-xs font-display text-lg"
          value={api.name}
          onChange={(e) => set({ name: e.target.value })}
          aria-label="Nombre de la app"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={test} disabled={loading}>
            {loading ? "Consultando…" : "Probar / Sincronizar"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            aria-label={`Eliminar ${api.name}`}
            onClick={() => {
              if (window.confirm(`¿Eliminar "${api.name}"?`)) remove(api.id);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="URL base (https)">
          <Input
            className="font-mono text-xs"
            placeholder="https://api.miapp.com"
            value={api.baseUrl}
            onChange={(e) => set({ baseUrl: e.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field label="Ruta">
          <Input
            className="font-mono text-xs"
            placeholder="/v1/me"
            value={api.endpoint}
            onChange={(e) => set({ endpoint: e.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field label="Autenticación">
          <select
            className={SELECT_CLASS}
            value={api.auth}
            onChange={(e) => set({ auth: e.target.value as CustomAuth })}
          >
            {AUTH_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        {needsName ? (
          <Field
            label={api.auth === "header" ? "Nombre del header" : "Nombre del parámetro"}
          >
            <Input
              className="font-mono text-xs"
              placeholder={api.auth === "header" ? "X-API-Key" : "access_token"}
              value={api.authName}
              onChange={(e) => set({ authName: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
        ) : null}
        {api.auth !== "none" ? (
          <Field label="API key / token">
            <Input
              className="font-mono text-xs"
              type="password"
              placeholder="Pegá tu key"
              value={api.token}
              onChange={(e) => set({ token: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
        ) : null}
        <Field label="Número a seguir (opcional)">
          <Input
            className="font-mono text-xs"
            placeholder="data.followers_count"
            value={api.metricPath}
            onChange={(e) => set({ metricPath: e.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </div>

      {api.lastError ? (
        <p className="mt-4 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
          {api.lastError}
        </p>
      ) : null}

      {api.lastSyncAt && !api.lastError ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Último valor"
            value={api.lastValue !== null ? num(api.lastValue) : "—"}
            hint={
              api.metricPath.trim()
                ? api.metricPath.trim()
                : "Definí “Número a seguir” para medirlo"
            }
          />
          <StatCard
            label="Respuesta"
            value={api.lastStatus !== null ? String(api.lastStatus) : "—"}
          />
          <StatCard
            label="Mediciones"
            value={String(api.history.length)}
            hint={new Date(api.lastSyncAt).toLocaleString("es-AR")}
          />
        </div>
      ) : null}

      {chart.length > 1 ? (
        <ChartShell className="mt-4" title={`${api.name} · historial`} height={200}>
          <SimpleLine data={chart} dataKey="value" name={api.name} />
        </ChartShell>
      ) : null}

      {api.lastPreview ? (
        <details className="mt-4">
          <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.14em] text-subtle hover:text-fg">
            Vista previa de la respuesta
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-bg p-3 font-mono text-[11px] text-muted">
            {api.lastPreview}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] text-subtle">{label}</p>
      {children}
    </div>
  );
}
