import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { OS_MODULES } from "@/lib/data";
import { ChartShell, CompareArea } from "@/components/chart-block";
import { useHq } from "@/lib/store";
import { fetchRecentCommits, fetchRepoSummary, type GhCommit } from "@/lib/github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/os")({ component: Os });

/** Roadmap de fases: el estado se infiere de los mensajes de commit (no hardcode de “hecho”). */
const PHASE_DEFS = [
  {
    phase: "0",
    name: "Spec + tooling",
    months: "0–1",
    keywords: [
      "spec",
      "tooling",
      "makefile",
      "ci",
      "toolchain",
      "build",
      "init",
    ],
  },
  {
    phase: "1",
    name: "Bootable kernel",
    months: "1–4",
    keywords: [
      "kernel",
      "boot",
      "qemu",
      "paging",
      "page fault",
      "syscall",
      "v1.0",
      "elf",
      "vfs",
      "main.c",
    ],
  },
  {
    phase: "2",
    name: "Userspace mínimo",
    months: "4–10",
    keywords: [
      "userspace",
      "userland",
      "shell",
      "stdio",
      "libc",
      "v1.1",
      "v1.2",
      "sleep",
      "wait",
      "zombie",
      "echo",
      "cat",
      "ls",
      "brk",
      "stdin",
      "task.c",
    ],
  },
  {
    phase: "3",
    name: "ISO + apps",
    months: "10–18",
    keywords: [
      "iso",
      "app",
      "apps",
      "multi-elf",
      "v1.3",
      "package",
      "getdents",
      "argv",
      "exec args",
    ],
  },
] as const;

type PhaseStatus = "done" | "active" | "pending";

type PhaseView = {
  phase: string;
  name: string;
  months: string;
  status: PhaseStatus;
  hits: number;
  evidence: string[];
};

function scorePhase(commits: GhCommit[], keywords: readonly string[]): {
  hits: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let hits = 0;
  for (const c of commits) {
    const msg = (c.message ?? "").toLowerCase();
    const matched = keywords.some((k) => msg.includes(k.toLowerCase()));
    if (matched) {
      hits += 1;
      if (evidence.length < 3) evidence.push(c.message);
    }
  }
  return { hits, evidence };
}

/**
 * Inferencia de progreso por fase a partir de commits.
 * Una fase se considera alcanzada si hay señales en commits;
 * la más alta con señales es “activa”; las anteriores “done”.
 */
function computePhases(commits: GhCommit[]): PhaseView[] {
  if (commits.length === 0) {
    return PHASE_DEFS.map((p, i) => ({
      phase: p.phase,
      name: p.name,
      months: p.months,
      status: (i === 0 ? "active" : "pending") as PhaseStatus,
      hits: 0,
      evidence: [],
    }));
  }

  const scored = PHASE_DEFS.map((p) => {
    const { hits, evidence } = scorePhase(commits, p.keywords);
    return { ...p, hits, evidence };
  });

  let highest = -1;
  for (let i = 0; i < scored.length; i++) {
    if (scored[i].hits > 0) highest = i;
  }
  if (highest < 0) highest = 0;

  return scored.map((p, i) => {
    let status: PhaseStatus = "pending";
    if (i < highest) status = "done";
    else if (i === highest) status = "active";
    return {
      phase: p.phase,
      name: p.name,
      months: p.months,
      status,
      hits: p.hits,
      evidence: p.evidence,
    };
  });
}

/** Progreso 0–1 por módulo según keywords en commits */
function moduleProgress(commits: GhCommit[], modId: string): number {
  if (commits.length === 0) return 0;
  const map: Record<string, string[]> = {
    boot: ["boot", "kernel", "qemu", "v1.0", "elf", "main.c"],
    mm: [
      "paging",
      "page fault",
      "memory",
      "scheduler",
      "task",
      "sleep",
      "wait",
      "zombie",
    ],
    fs: ["vfs", "fs", "filesystem", "stdio", "write-fd", "getdents", "multi-elf"],
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
  for (const c of commits) {
    const msg = (c.message ?? "").toLowerCase();
    if (keys.some((k) => msg.includes(k))) hits += 1;
  }
  return Math.min(1, hits / 4);
}

function Os() {
  const profile = useHq((s) => s.profile);
  const ghRepoInput = useHq((s) => s.ghRepoInput);
  const ghToken = useHq((s) => s.ghToken);
  const ghSummary = useHq((s) => s.ghSummary);
  const ghCommits = useHq((s) => s.ghCommits);
  const setGhRepoInput = useHq((s) => s.setGhRepoInput);
  const setGhToken = useHq((s) => s.setGhToken);
  const setGhData = useHq((s) => s.setGhData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phases = useMemo(() => computePhases(ghCommits), [ghCommits]);

  const doneCount = phases.filter((p) => p.status === "done").length;
  const activePhase = phases.find((p) => p.status === "active");

  async function syncGh() {
    if (!ghRepoInput.trim()) {
      setError("Indicá owner/repo (ej. alexironmanreal-ai/sif_os_kernel).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchRepoSummary(ghRepoInput, ghToken);
      const commits = await fetchRecentCommits(ghRepoInput, ghToken, 30);
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
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Producto
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">{profile.os}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Roadmap + commits reales del repo. Las fases se actualizan según los
          mensajes de commit (no están fijas).
        </p>
      </header>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
          GitHub · progreso real
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
            <p className="mb-1 text-[11px] text-subtle">
              Token (opcional · repos privados)
            </p>
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
          <Button size="sm" onClick={syncGh} disabled={loading}>
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
            {ghSummary.pushedAt
              ? new Date(ghSummary.pushedAt).toLocaleString("es-AR")
              : "—"}
          </p>
        ) : null}
        {ghCommits.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {ghCommits.slice(0, 12).map((c) => (
              <li key={c.sha}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-elevated/50 px-3 py-2 text-sm hover:bg-elevated"
                >
                  <span>
                    <span className="font-mono text-[11px] text-accent">
                      {c.sha}
                    </span>{" "}
                    <span className="text-fg">{c.message}</span>
                  </span>
                  <span className="font-mono text-[10px] text-subtle">
                    {c.author}
                    {c.date
                      ? ` · ${new Date(c.date).toLocaleDateString("es-AR")}`
                      : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Conectá el repo del OS y sincronizá para ver commits y actualizar
            fases. Repos públicos no necesitan token.
          </p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl">Fases</h2>
          {ghCommits.length > 0 ? (
            <p className="font-mono text-[11px] text-subtle">
              Hechas: {doneCount} · actual:{" "}
              {activePhase
                ? `Fase ${activePhase.phase} · ${activePhase.name}`
                : "—"}
              {` · ${ghCommits.length} commits analizados`}
            </p>
          ) : (
            <p className="text-sm text-muted">
              Sincronizá commits para calcular el estado
            </p>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((p) => (
            <div
              key={p.phase}
              className={cn(
                "rounded-xl p-4 shadow-[var(--shadow-border)]",
                p.status === "done" && "bg-elevated/80 ring-1 ring-accent/30",
                p.status === "active" && "bg-surface ring-1 ring-accent",
                p.status === "pending" && "bg-surface opacity-70",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] text-subtle">
                  Fase {p.phase}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    p.status === "done" && "bg-accent/20 text-accent",
                    p.status === "active" && "bg-accent text-bg",
                    p.status === "pending" && "bg-elevated text-subtle",
                  )}
                >
                  {p.status === "done"
                    ? "Hecha"
                    : p.status === "active"
                      ? "En curso"
                      : "Pendiente"}
                </span>
              </div>
              <p className="mt-1 font-display text-xl">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.months}</p>
              {p.hits > 0 ? (
                <p className="mt-2 font-mono text-[10px] text-subtle">
                  {p.hits} commit{p.hits === 1 ? "" : "s"} relacionados
                </p>
              ) : null}
              {p.evidence.length > 0 ? (
                <ul className="mt-2 space-y-0.5">
                  {p.evidence.map((ev, i) => (
                    <li
                      key={i}
                      className="truncate text-[11px] text-muted"
                      title={ev}
                    >
                      · {ev}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl">Módulos</h2>
        {OS_MODULES.map((mod) => {
          const prog = moduleProgress(ghCommits, mod.id);
          const pct = Math.round(prog * 100);
          return (
            <div
              key={mod.id}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
            >
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
                  <CompareArea
                    data={mod.chart}
                    doneName="Progreso"
                    skipName="Riesgo"
                  />
                </ChartShell>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
