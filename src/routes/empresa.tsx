import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Link2, Plus, Trash2, UserPlus } from "lucide-react";
import { TASKS } from "@/lib/data";
import { liveGaps } from "@/lib/wealth-engine";
import { ars } from "@/lib/format";
import { companyScore, isTaskComplete, useHq } from "@/lib/store";
import {
  APP_ACTIVITIES,
  APP_CATALOG,
  activityLabel,
  type AppActivity,
} from "@/lib/connected-apps";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/empresa")({ component: Empresa });

function Empresa() {
  const done = useHq((s) => s.done);
  const profile = useHq((s) => s.profile);
  const score = companyScore(done);
  const arsPerUsd = useHq((s) => s.arsPerUsd);
  const gaps = liveGaps(done, arsPerUsd);

  const legal = TASKS.filter((t) => t.category === "legal" || t.category === "fiscal");
  const closed = legal.filter((t) => isTaskComplete(t.id, t.subtasks.map((s) => s.id), done)).length;

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Persona jurídica</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">{profile.company}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Estado de la empresa como entidad: SAS, stack de apps, equipo y lo que falta para operar de verdad.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Score global</p>
          <p className="mt-2 font-display text-3xl">{Math.round(score * 100)}%</p>
          <Progress value={score * 100} className="mt-3" />
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Legal / fiscal</p>
          <p className="mt-2 font-display text-3xl">{closed}/{legal.length}</p>
          <p className="mt-1 text-sm text-muted">Ítems cerrados</p>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Gaps abiertos</p>
          <p className="mt-2 font-display text-3xl">{gaps.filter((g) => g.status !== "done").length}</p>
          <p className="mt-1 text-sm text-muted">De {gaps.length} áreas · tareas reales</p>
        </div>
      </div>

      <ConnectedAppsSection />
      <EmployeesSection />

      <section>
        <h2 className="font-display text-2xl">Gaps</h2>
        <div className="mt-4 space-y-3">
          {gaps.map((g) => (
            <div key={g.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-xl">{g.area}</p>
                <Badge tone={g.status === "done" ? "ok" : g.status === "partial" ? "warn" : "default"}>
                  {g.status === "done" ? "Cerrado" : g.status === "partial" ? `${g.pctDone}%` : "Abierto"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted">
                {g.status === "done" ? g.missing : `Hoy: ${g.now} → Falta: ${g.missing}`}
              </p>
              <p className="mt-1 font-mono text-[12px] text-subtle">
                Tareas {g.relatedDone}/{g.relatedCount} ·{" "}
                {g.costArs === 0 ? "sin costo $" : `${ars(g.missingArs)} / ${ars(g.costArs)}`}
                {g.time ? ` · ${g.time}` : ""}
              </p>
              <Progress value={g.pctDone} className="mt-2 h-1.5" />
            </div>
          ))}
        </div>
      </section>

      <Link to="/tareas" className="text-sm text-muted hover:text-fg">
        Ir al tablero de tareas →
      </Link>
    </div>
  );
}

function ConnectedAppsSection() {
  const connectedApps = useHq((s) => s.connectedApps) ?? [];
  const connectApp = useHq((s) => s.connectApp);
  const updateConnectedApp = useHq((s) => s.updateConnectedApp);
  const removeConnectedApp = useHq((s) => s.removeConnectedApp);
  const addCustomApp = useHq((s) => s.addCustomApp);

  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("https://");
  const [customActivity, setCustomActivity] = useState<AppActivity>("otro");

  const connectedKeys = useMemo(
    () => new Set(connectedApps.filter((a) => a.connected).map((a) => a.appKey)),
    [connectedApps],
  );

  const byActivity = useMemo(() => {
    const map = new Map<AppActivity, typeof connectedApps>();
    for (const a of connectedApps.filter((x) => x.connected)) {
      const list = map.get(a.activity) ?? [];
      list.push(a);
      map.set(a.activity, list);
    }
    return APP_ACTIVITIES.map((act) => ({
      ...act,
      apps: map.get(act.id) ?? [],
    })).filter((g) => g.apps.length > 0);
  }, [connectedApps]);

  function openApp(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">Apps conectadas</h2>
        <p className="mt-1 text-sm text-muted">
          Stack de productividad por actividad. Conectar marca la app como parte del sistema operativo de la empresa y abre el acceso web.
        </p>
      </div>

      {/* Tabla por actividad */}
      {byActivity.length > 0 ? (
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3 font-medium">App</th>
                <th className="px-4 py-3 font-medium">Actividad</th>
                <th className="px-4 py-3 font-medium">Notas</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {byActivity.flatMap((group) =>
                group.apps.map((app) => (
                  <tr key={app.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{app.name}</p>
                      <p className="font-mono text-[10px] text-subtle">{app.appKey}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-md border border-border bg-elevated px-2 py-1 text-xs text-fg"
                        value={app.activity}
                        onChange={(e) =>
                          updateConnectedApp(app.id, {
                            activity: e.target.value as AppActivity,
                          })
                        }
                      >
                        {APP_ACTIVITIES.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Uso en la empresa…"
                        value={app.notes}
                        onChange={(e) =>
                          updateConnectedApp(app.id, { notes: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => openApp(app.url)}
                        >
                          <ExternalLink className="size-3" />
                          Abrir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Quitar"
                          onClick={() => removeConnectedApp(app.id)}
                        >
                          <Trash2 className="size-3.5 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
          Todavía no hay apps conectadas. Elegí del catálogo abajo.
        </p>
      )}

      {/* Catálogo */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
          Catálogo · conectar
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {APP_CATALOG.map((cat) => {
            const isOn = connectedKeys.has(cat.key);
            return (
              <div
                key={cat.key}
                className="flex items-start justify-between gap-2 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">{cat.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{cat.blurb}</p>
                  <p className="mt-1 font-mono text-[10px] text-subtle">
                    {activityLabel(cat.defaultActivity)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isOn ? "secondary" : "default"}
                  className="shrink-0 gap-1"
                  disabled={isOn}
                  onClick={() => {
                    connectApp(cat.key);
                    openApp(cat.url);
                  }}
                >
                  <Link2 className="size-3" />
                  {isOn ? "OK" : "Conectar"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* App custom */}
      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
          App personalizada
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <Label>Nombre</Label>
            <Input
              className="mt-1"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Mi herramienta"
            />
          </div>
          <div className="sm:col-span-1">
            <Label>URL</Label>
            <Input
              className="mt-1 font-mono text-xs"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-1">
            <Label>Actividad</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-elevated px-2 py-2 text-sm text-fg"
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value as AppActivity)}
            >
              {APP_ACTIVITIES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end sm:col-span-1">
            <Button
              className="w-full gap-1"
              disabled={!customName.trim()}
              onClick={() => {
                addCustomApp({
                  appKey: `custom-${customName.trim().toLowerCase().replace(/\s+/g, "-")}`,
                  name: customName.trim(),
                  activity: customActivity,
                  url: customUrl.trim() || "https://",
                  notes: "",
                });
                setCustomName("");
                setCustomUrl("https://");
              }}
            >
              <Plus className="size-3.5" />
              Añadir
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmployeesSection() {
  const employees = useHq((s) => s.employees) ?? [];
  const addEmployee = useHq((s) => s.addEmployee);
  const updateEmployee = useHq((s) => s.updateEmployee);
  const removeEmployee = useHq((s) => s.removeEmployee);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">Empleados</h2>
        <p className="mt-1 text-sm text-muted">
          Equipo de la empresa: nombre y rol. Podés marcar inactivo sin borrar el historial.
        </p>
      </div>

      {employees.length > 0 ? (
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2">
                    <Input
                      className="h-8"
                      value={e.name}
                      onChange={(ev) => updateEmployee(e.id, { name: ev.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      className="h-8"
                      value={e.role}
                      onChange={(ev) => updateEmployee(e.id, { role: ev.target.value })}
                      placeholder="Ej. Dev, Ventas, Ops"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      className="h-8 font-mono text-xs"
                      value={e.email}
                      onChange={(ev) => updateEmployee(e.id, { email: ev.target.value })}
                      placeholder="mail@empresa.com"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="text-xs"
                      onClick={() => updateEmployee(e.id, { active: !e.active })}
                    >
                      <Badge tone={e.active ? "ok" : "default"}>
                        {e.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`¿Quitar a ${e.name}?`)) removeEmployee(e.id);
                      }}
                    >
                      <Trash2 className="size-3.5 text-danger" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
          Sin empleados cargados. Sumá el primero abajo.
        </p>
      )}

      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
          Nuevo empleado
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <div>
            <Label>Nombre</Label>
            <Input
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Input
              className="mt-1"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ej. Backend, Ventas"
            />
          </div>
          <div>
            <Label>Email (opcional)</Label>
            <Input
              className="mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mail@…"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full gap-1"
              disabled={!name.trim() || !role.trim()}
              onClick={() => {
                addEmployee({
                  name: name.trim(),
                  role: role.trim(),
                  email: email.trim(),
                  notes: "",
                });
                setName("");
                setRole("");
                setEmail("");
              }}
            >
              <UserPlus className="size-3.5" />
              Añadir
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
