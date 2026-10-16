import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { OS_MODULES } from "@/lib/data";
import { ChartShell, CompareArea } from "@/components/chart-block";
import { useHq } from "@/lib/store";
import { fetchRecentCommits, fetchRepoSummary, type GhCommit } from "@/lib/github";
import {
  computeOsBattery,
  OS_PHASE_COUNT,
  type OsPhaseView,
} from "@/lib/os-phases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/os")({ component: Os });

function moduleProgress(commits: GhCommit[] | null | undefined, modId: string): number {
  const list = commits ?? [];
  if (list.length === 0) return 0;
  const map: Record<string, string[]> = {
    boot: ["boot", "kernel", "qemu", "v1.0", "elf", "main.c", "gdt", "idt"],
    mm: [
      "paging",
      "page fault",
      "memory",
      "scheduler",
      "task",
      "sleep",
      "wait",
      "zombie",
      "kmalloc",
      "pmm",
    ],
    fs: ["vfs", "fs", "filesystem", "stdio", "write-fd", "getdents", "multi-elf", "ext2"],
    shell: [
      "shell",
      "userspace",
      "userland",
      "libc",
      "echo",
      "cat",
      "ls",
      "exec",
      "argv",
    ],
  };
  const keys = map[modId] ?? [];
  if (keys.length === 0) return 0;
  let hits = 0;
  for (const c of list) {
    const msg = (c.message ?? "").toLowerCase();
    if (keys.some((k) => msg.includes(k))) hits += 1;
  }
  return Math.min(1, hits / 4);
}

function BatteryGauge({ pct, large }: { pct: number; large?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tone =
    clamped >= 80 ? "bg-ok" : clamped >= 40 ? "bg-accent" : clamped > 0 ? "bg-warn" : "bg-elevated";
  const border =
    clamped >= 80 ? "border-ok/50" : clamped >= 40 ? "border-accent/40" : "border-border";

  return (
    <div className={cn("flex items-center gap-2", large && "gap-3")}>
      <div
        className={cn(
          "relative flex items-center rounded-md border-2 bg-elevated/40",
          border,
          large ? "h-14 w-40 p-1" : "h-8 w-24 p-0.5",
        )}
        title={`${clamped}%`}
      >
        <div
          className={cn("h-full rounded-sm transition-all duration-500", tone)}
          style={{ width: `${clamped}%` }}
        />
        <span
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center font-mono font-medium tabular-nums",
            large ? "text-sm" : "text-[10px]",
            clamped > 45 ? "text-bg" : "text-fg",
          )}
        >
          {clamped.toFixed(clamped % 1 ? 1 : 0)}%
        </span>
      </div>
      <div className={cn("rounded-r-sm bg-subtle/40", large ? "h-6 w-1.5" : "h-3 w-1")} />
    </div>
  );
}

function statusLabel(s: OsPhaseView["status"]) {
  switch (s) {
    case "done":
      return "Cargada";
    case "active":
      return "Activa";
    case "partial":
      return "Parcial";
    default:
      return "Pendiente";
  }
}

function Os() {
  const profile = useHq((s) => s.profile);
  const ghRepoInput = useHq((s) => s.ghRepoInput);
  const ghToken = useHq((s) => s.ghToken);
  const ghSummary = useHq((s) => s.ghSummary);
  const ghCommits = useHq((s) => s.ghCommits) ?? [];
  const setGhRepoInput = useHq((s) => s.setGhRepoInput);
  const setGhToken = useHq((s) => s.setGhToken);
  const setGhData = useHq((s) => s.setGhData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const battery = useMemo(() => computeOsBattery(ghCommits), [ghCommits]);

  const filtered = useMemo(() => {
    let rows = battery.phases;
    if (stageFilter !== "all") rows = rows.filter((p) => p.stage === stageFilter);
    if (onlyOpen) rows = rows.filter((p) => p.status !== "done");
    return rows;
  }, [battery.phases, stageFilter, onlyOpen]);

  async function syncGh() {
    if (!ghRepoInput.trim()) {
      setError("Indicá owner/repo (ej. alexironmanreal-ai/sif_os_kernel).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchRepoSummary(ghRepoInput.trim(), ghToken || undefined);
      const commits = await fetchRecentCommits(ghRepoInput.trim(), ghToken || undefined, 100);
      setGhData(summary, commits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error GitHub");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Producto</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">{profile.os}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Roadmap de <strong className="text-fg">{OS_PHASE_COUNT} fases</strong>. La batería se
          carga con commits reales del repo (keywords por fase). No hay “hecho” fijo: si no hay
          señal en git, la celda queda vacía.
        </p>
      </header>

      <section className="rounded-xl border border-accent/20 bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Batería del OS
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums">{battery.chargePct}%</p>
            <p className="mt-1 text-sm text-muted">
              {battery.doneCount} cargadas · {battery.partialCount} parciales ·{" "}
              {OS_PHASE_COUNT - battery.doneCount - battery.partialCount} pendientes
              {battery.active ? ` · foco: #${battery.active.n} ${battery.active.name}` : ""}
            </p>
          </div>
          <BatteryGauge pct={battery.chargePct} large />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {battery.stages.map((st) => (
            <button
              key={st.stage}
              type="button"
              onClick={() => setStageFilter((prev) => (prev === st.stage ? "all" : st.stage))}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                stageFilter === st.stage
                  ? "border-accent bg-accent/10"
                  : "border-border bg-elevated/40 hover:bg-elevated",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                  {st.stage}
                </p>
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  {st.done}/{st.total}
                </span>
              </div>
              <div className="mt-2">
                <BatteryGauge pct={st.chargePct} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
          GitHub · progreso real
        </p>
        <p className="mt-1 text-sm text-muted">
          Sincronizá hasta 100 commits recientes. Cada mensaje que matchee keywords carga fases.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] text-subtle">Repo (owner/repo o URL)</p>
            <Input
              className="font-mono text-xs"
              placeholder="alexironmanreal-ai/sif_os_kernel"
              value={ghRepoInput}
              onChange={(e) => setGhRepoInput(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-1 text-[11px] text-subtle">Token (opcional · repos privados)</p>
            <Input
              className="font-mono text-xs"
              type="password"
              placeholder="ghp_…"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => void syncGh()} disabled={loading}>
            {loading ? "Sincronizando…" : "Sincronizar commits"}
          </Button>
          {ghSummary ? (
            <a
              href={ghSummary.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted hover:text-fg"
            >
              {ghSummary.fullName} ↗
            </a>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        {ghSummary ? (
          <p className="mt-2 font-mono text-[11px] text-subtle">
            ★ {ghSummary.stars} · issues {ghSummary.openIssues} · last push{" "}
            {ghSummary.pushedAt ? new Date(ghSummary.pushedAt).toLocaleString("es-AR") : "—"}
            {ghCommits.length > 0 ? ` · ${ghCommits.length} commits` : ""}
          </p>
        ) : null}
        {ghCommits.length > 0 ? (
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {ghCommits.slice(0, 12).map((c) => (
              <li key={c.sha}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-elevated/50 px-3 py-2 text-sm hover:bg-elevated"
                >
                  <span>
                    <span className="font-mono text-[11px] text-accent">{c.sha}</span>{" "}
                    <span className="text-fg">{c.message}</span>
                  </span>
                  <span className="font-mono text-[10px] text-subtle">
                    {c.date ? new Date(c.date).toLocaleDateString("es-AR") : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">
              Fases ({filtered.length}
              {filtered.length !== OS_PHASE_COUNT ? ` / ${OS_PHASE_COUNT}` : ""})
            </h2>
            <p className="mt-1 text-sm text-muted">
              Cada fila es una celda de la batería. Click en etapa arriba para filtrar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={stageFilter === "all" ? "default" : "secondary"}
              onClick={() => setStageFilter("all")}
            >
              Todas
            </Button>
            <Button
              size="sm"
              variant={onlyOpen ? "default" : "secondary"}
              onClick={() => setOnlyOpen((v) => !v)}
            >
              {onlyOpen ? "Ver todas" : "Solo abiertas"}
            </Button>
          </div>
        </div>

        <div className="mt-4 max-h-[28rem] overflow-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-3 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Etapa</th>
                <th className="px-3 py-3 font-medium">Fase</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium">Carga</th>
                <th className="px-3 py-3 font-medium">Señal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.n}
                  className={cn(
                    "border-b border-border/50",
                    p.status === "active" && "bg-accent/10",
                    p.status === "done" && "opacity-80",
                  )}
                >
                  <td className="px-3 py-2 font-mono text-xs text-subtle">{p.n}</td>
                  <td className="px-3 py-2 text-xs text-muted">{p.stage}</td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-wide",
                        p.status === "done" && "text-ok",
                        p.status === "active" && "text-accent",
                        p.status === "partial" && "text-warn",
                        p.status === "pending" && "text-subtle",
                      )}
                    >
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-elevated">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          p.charge >= 1 ? "bg-ok" : p.charge > 0 ? "bg-accent" : "bg-transparent",
                        )}
                        style={{ width: `${Math.round(p.charge * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2 font-mono text-[10px] text-subtle">
                    {p.hits > 0 ? `${p.hits}· ${p.evidence[0] ?? ""}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl">Módulos (capa gruesa)</h2>
        {OS_MODULES.map((mod) => {
          const prog = moduleProgress(ghCommits, mod.id);
          const pct = Math.round(prog * 100);
          return (
            <div key={mod.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-xl">{mod.name}</p>
                <p className="font-mono text-[12px] text-subtle">
                  {mod.layer} · {mod.months} meses
                  {ghCommits.length > 0 ? ` · ~${pct}% por commits` : ""}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted">
                Depende de: {mod.depends} → Entrega: {mod.deliverable}
              </p>
              {ghCommits.length > 0 ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : null}
              <div className="mt-4">
                <ChartShell height={160}>
                  <CompareArea data={mod.chart} doneName="Progreso" skipName="Riesgo" />
                </ChartShell>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
