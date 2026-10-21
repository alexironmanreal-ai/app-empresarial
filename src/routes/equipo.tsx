import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHq } from "@/lib/store";
import { fetchAuthorActivity, fetchRepoSummary, fetchRecentCommits } from "@/lib/github";
import {
  memberStatus,
  statusLabel,
  statusTone,
  teamPulse,
  type TeamMember,
  type TeamRole,
} from "@/lib/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RefreshCw, Users, CheckCircle2, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/equipo")({ component: EquipoPage });

const ROLES: TeamRole[] = ["CEO", "CTO", "COO", "CMO", "otro"];

function EquipoPage() {
  const members = useHq((s) => s.teamMembers) ?? [];
  const ghToken = useHq((s) => s.ghToken);
  const setGhToken = useHq((s) => s.setGhToken);
  const upsert = useHq((s) => s.upsertTeamMember);
  const remove = useHq((s) => s.removeTeamMember);
  const checkIn = useHq((s) => s.checkInTeamMember);
  const patch = useHq((s) => s.patchTeamMember);

  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenDraft, setTokenDraft] = useState(ghToken || "");

  const pulse = teamPulse(members);

  async function syncMember(m: TeamMember) {
    if (!m.repo?.trim()) {
      setError(`${m.name}: asigná un repo owner/repo`);
      return;
    }
    setSyncing(m.id);
    setError(null);
    if (tokenDraft.trim()) setGhToken(tokenDraft.trim());
    const token = tokenDraft || ghToken;
    try {
      await fetchRepoSummary(m.repo, token);
      let lastCommitAt: string | null = null;
      let lastCommitMsg: string | undefined;
      let count7d = 0;
      if (m.githubUser?.trim()) {
        const activity = await fetchAuthorActivity(m.repo, m.githubUser, token);
        lastCommitAt = activity.lastCommitAt;
        lastCommitMsg = activity.commits[0]?.message;
        count7d = activity.count7d;
      } else {
        const all = await fetchRecentCommits(m.repo, token, 30);
        const now = Date.now();
        const week = 7 * 24 * 60 * 60 * 1000;
        count7d = all.filter((c) => now - new Date(c.date).getTime() <= week).length;
        lastCommitAt = all[0]?.date ?? null;
        lastCommitMsg = all[0]?.message;
      }
      patch(m.id, {
        repoReachable: true,
        lastCommitAt,
        lastCommitMsg: lastCommitMsg?.split("\n")[0],
        commitCount7d: count7d,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (e) {
      patch(m.id, {
        repoReachable: false,
        lastSyncedAt: new Date().toISOString(),
      });
      setError(e instanceof Error ? e.message : "Error al sincronizar");
    } finally {
      setSyncing(null);
    }
  }

  async function syncAll() {
    for (const m of members.filter((x) => x.role === "CTO" || x.repo)) {
      await syncMember(m);
    }
  }

  function addMember() {
    upsert({
      id: `tm-${Date.now()}`,
      name: "Nuevo",
      role: "otro",
      weeklyCommitGoal: 3,
      checkInHours: 24,
      notes: "",
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Organización
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Equipo</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Monitoreá si CTO / COO / CMO están trabajando: commits del repo, último push,
          check-ins y metas semanales. Sin señal = no asumas progreso.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["Trabajando", pulse.activo, "text-ok"],
            ["Lento", pulse.lento, "text-warn"],
            ["Sin señal", pulse.silencio, "text-danger"],
            ["Sin datos", pulse.sin, "text-subtle"],
          ] as const
        ).map(([label, n, tone]) => (
          <div key={label} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">{label}</p>
            <p className={cn("mt-1 font-display text-3xl", tone)}>{n}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-accent/20 bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-medium text-fg">GitHub token (opcional, repos privados)</p>
        <p className="mt-1 text-sm text-muted">
          CTO: el sistema mira si el repo existe, último push y commits del user asignado.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            className="font-mono text-xs"
            type="password"
            placeholder="ghp_… (opcional)"
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
          />
          <Button variant="secondary" className="gap-1.5" onClick={() => void syncAll()}>
            <RefreshCw className="size-3.5" />
            Sync todos
          </Button>
          <Button variant="secondary" className="gap-1.5" onClick={addMember}>
            <Plus className="size-3.5" />
            Miembro
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {members.map((m) => {
          const st = memberStatus(m);
          const tone = statusTone(st);
          return (
            <article
              key={m.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-subtle">
                      {m.role}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px]",
                        tone === "ok" && "bg-ok/20 text-ok",
                        tone === "warn" && "bg-warn/20 text-warn",
                        tone === "danger" && "bg-danger/20 text-danger",
                        tone === "muted" && "bg-elevated text-subtle",
                      )}
                    >
                      {statusLabel(st)}
                    </span>
                  </div>
                  <Input
                    className="mt-2 h-9 font-display text-lg"
                    value={m.name}
                    onChange={(e) => patch(m.id, { name: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="text-subtle hover:text-danger"
                  onClick={() => remove(m.id)}
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-[11px] text-subtle">
                  Rol
                  <select
                    className="mt-0.5 w-full rounded-md border border-border bg-elevated px-2 py-1.5 text-sm text-fg"
                    value={m.role}
                    onChange={(e) => patch(m.id, { role: e.target.value as TeamRole })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] text-subtle">
                  Contacto
                  <Input
                    className="mt-0.5 h-8"
                    value={m.contact || ""}
                    onChange={(e) => patch(m.id, { contact: e.target.value })}
                    placeholder="WA / mail"
                  />
                </label>
                <label className="text-[11px] text-subtle">
                  GitHub user
                  <Input
                    className="mt-0.5 h-8 font-mono text-xs"
                    value={m.githubUser || ""}
                    onChange={(e) => patch(m.id, { githubUser: e.target.value })}
                    placeholder="login"
                  />
                </label>
                <label className="text-[11px] text-subtle">
                  Repo (owner/repo)
                  <Input
                    className="mt-0.5 h-8 font-mono text-xs"
                    value={m.repo || ""}
                    onChange={(e) => patch(m.id, { repo: e.target.value })}
                    placeholder="org/app"
                  />
                </label>
                <label className="text-[11px] text-subtle">
                  Meta commits / semana
                  <Input
                    className="mt-0.5 h-8 font-mono"
                    type="number"
                    value={m.weeklyCommitGoal}
                    onChange={(e) =>
                      patch(m.id, { weeklyCommitGoal: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <label className="text-[11px] text-subtle">
                  Check-in cada (h)
                  <Input
                    className="mt-0.5 h-8 font-mono"
                    type="number"
                    value={m.checkInHours}
                    onChange={(e) =>
                      patch(m.id, { checkInHours: Number(e.target.value) || 24 })
                    }
                  />
                </label>
              </div>

              <div className="mt-3 rounded-lg bg-elevated/50 p-3 text-sm">
                {m.role === "CTO" || m.repo ? (
                  <>
                    <p className="font-mono text-[11px] text-subtle">Señal GitHub</p>
                    <p className="mt-1 text-muted">
                      Repo{" "}
                      {m.repoReachable === true
                        ? "✓ accesible"
                        : m.repoReachable === false
                          ? "✗ no responde"
                          : "— sin sync"}
                      {m.lastCommitAt
                        ? ` · último commit ${new Date(m.lastCommitAt).toLocaleString("es-AR")}`
                        : ""}
                    </p>
                    {m.lastCommitMsg ? (
                      <p className="mt-1 line-clamp-2 text-fg">{m.lastCommitMsg}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-[12px] text-subtle">
                      {m.commitCount7d ?? 0} commits / 7d
                      {m.weeklyCommitGoal
                        ? ` · meta ${m.weeklyCommitGoal}${
                            (m.commitCount7d ?? 0) >= m.weeklyCommitGoal ? " ✓" : " (falta)"
                          }`
                        : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[11px] text-subtle">Check-in</p>
                    <p className="mt-1 text-muted">
                      {m.lastCheckInAt
                        ? `Último ${new Date(m.lastCheckInAt).toLocaleString("es-AR")}`
                        : "Nunca — pedí señal hoy"}
                    </p>
                  </>
                )}
                {m.lastSyncedAt ? (
                  <p className="mt-1 font-mono text-[10px] text-subtle">
                    Sync {new Date(m.lastSyncedAt).toLocaleString("es-AR")}
                  </p>
                ) : null}
              </div>

              <label className="mt-2 block text-[11px] text-subtle">
                Notas / expectativas
                <Input
                  className="mt-0.5"
                  value={m.notes}
                  onChange={(e) => patch(m.id, { notes: e.target.value })}
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {(m.role === "CTO" || m.repo) && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={syncing === m.id}
                    onClick={() => void syncMember(m)}
                  >
                    <RefreshCw className={cn("size-3.5", syncing === m.id && "animate-spin")} />
                    {syncing === m.id ? "Sync…" : "Sync GitHub"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => checkIn(m.id)}
                >
                  <CheckCircle2 className="size-3.5" />
                  Check-in ahora
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-xl bg-surface p-4 text-sm text-muted shadow-[var(--shadow-border)]">
        <div className="flex items-center gap-2 text-fg">
          <Users className="size-4" />
          <span className="font-medium">Cómo leer las señales</span>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-fg">CTO</strong>: repo accesible + commits recientes. Sin commit
            &gt; 72h → silencio.
          </li>
          <li>
            <strong className="text-fg">COO / CMO</strong>: check-in manual. Vencido el intervalo →
            lento / silencio.
          </li>
          <li>Meta semanal de commits: actividad de los últimos 7 días en el repo asignado.</li>
        </ul>
      </section>
    </div>
  );
}
