import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { OS_MODULES, OS_PHASES } from "@/lib/data";
import { ChartShell, CompareArea } from "@/components/chart-block";
import { useHq } from "@/lib/store";
import { fetchRecentCommits, fetchRepoSummary } from "@/lib/github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/os")({ component: Os });

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

  async function syncGh() {
    if (!ghRepoInput.trim()) {
      setError("Indicá owner/repo (ej. alexironmanreal-ai/sentinel-os).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchRepoSummary(ghRepoInput, ghToken);
      const commits = await fetchRecentCommits(ghRepoInput, ghToken, 12);
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
          Roadmap + commits reales del repo. Sin hello en QEMU el OS sigue siendo un PDF.
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
              placeholder="usuario/sentinel-os"
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
        {error ? (
          <p className="mt-2 text-sm text-danger">{error}</p>
        ) : null}
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
            {ghCommits.map((c) => (
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
            Conectá el repo del OS para ver commits. Repos públicos no necesitan token.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl">Fases</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OS_PHASES.map((p) => (
            <div
              key={p.phase}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <p className="font-mono text-[11px] text-subtle">Fase {p.phase}</p>
              <p className="mt-1 font-display text-xl">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.months}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl">Módulos</h2>
        {OS_MODULES.map((mod) => (
          <div
            key={mod.id}
            className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-xl">{mod.name}</p>
              <p className="font-mono text-[12px] text-subtle">
                {mod.layer} · {mod.months} meses
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">
              Depende de: {mod.depends} → Entrega: {mod.deliverable}
            </p>
            <div className="mt-4">
              <ChartShell height={160}>
                <CompareArea data={mod.chart} doneName="Progreso" skipName="Riesgo" />
              </ChartShell>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
