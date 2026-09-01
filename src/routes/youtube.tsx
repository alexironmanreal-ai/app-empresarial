import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { YT_MILESTONES, YT_PILLARS, YT_TITLES } from "@/lib/data";
import { num } from "@/lib/format";
import { useHq } from "@/lib/store";
import { fetchChannelStats, fetchRecentVideos } from "@/lib/youtube";
import { ChartShell, SimpleLine } from "@/components/chart-block";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/youtube")({ component: Youtube });

function Youtube() {
  const profile = useHq((s) => s.profile);
  const ytApiKey = useHq((s) => s.ytApiKey);
  const ytChannelInput = useHq((s) => s.ytChannelInput);
  const ytStats = useHq((s) => s.ytStats);
  const ytVideos = useHq((s) => s.ytVideos);
  const setYtStats = useHq((s) => s.setYtStats);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chart = YT_MILESTONES.map((m) => ({
    label: `M${m.month}`,
    subs: m.subs,
    views: m.viewsMonth,
  }));

  // Próximo hito vs reality
  const nextMilestone = ytStats
    ? YT_MILESTONES.find((m) => m.subs > ytStats.subscriberCount) ??
      YT_MILESTONES[YT_MILESTONES.length - 1]
    : YT_MILESTONES[0];

  async function sync() {
    if (!ytApiKey.trim()) {
      setError("Configurá la API key de YouTube en Ajustes.");
      return;
    }
    const channel = ytChannelInput.trim() || profile.youtube;
    if (!channel) {
      setError("Indicá el handle o Channel ID en Ajustes (campo YouTube canal).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const stats = await fetchChannelStats(ytApiKey, channel);
      let videos = [] as Awaited<ReturnType<typeof fetchRecentVideos>>;
      try {
        videos = await fetchRecentVideos(ytApiKey, stats.channelId, 6);
      } catch {
        /* videos opcionales */
      }
      setYtStats(stats, videos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al sincronizar YouTube");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            Contenido · live
          </p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">
            {ytStats?.title || profile.youtube}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Stats reales del canal + hitos proyectados. Sincronizá con YouTube Data
            API v3 (API key en Ajustes).
          </p>
        </div>
        <Button size="sm" onClick={sync} disabled={loading}>
          {loading ? "Sincronizando…" : "Sincronizar YouTube"}
        </Button>
      </header>

      {error ? (
        <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {/* LIVE STATS */}
      {ytStats ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {ytStats.thumbnailUrl ? (
              <img
                src={ytStats.thumbnailUrl}
                alt=""
                className="size-14 rounded-full border border-border"
              />
            ) : null}
            <div>
              <p className="font-display text-xl">{ytStats.title}</p>
              <p className="font-mono text-[12px] text-subtle">
                {ytStats.customUrl || ytStats.channelId}
                {" · "}
                actualizado{" "}
                {new Date(ytStats.fetchedAt).toLocaleString("es-AR")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Suscriptores"
              value={
                ytStats.hiddenSubscriberCount
                  ? "Ocultos"
                  : num(ytStats.subscriberCount)
              }
              hint={
                nextMilestone
                  ? `Próximo hito: ${num(nextMilestone.subs)} (mes ${nextMilestone.month})`
                  : undefined
              }
            />
            <StatCard
              label="Views totales"
              value={num(ytStats.viewCount)}
              hint="Lifetime del canal"
            />
            <StatCard
              label="Videos públicos"
              value={num(ytStats.videoCount)}
              hint="Solo públicos"
            />
          </div>

          {/* Progreso al próximo hito de subs */}
          {nextMilestone && !ytStats.hiddenSubscriberCount ? (
            <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
                  Hacia mes {nextMilestone.month} · {num(nextMilestone.subs)} subs
                </p>
                <p className="font-mono text-[12px] text-muted">
                  {ytStats.subscriberCount >= nextMilestone.subs
                    ? "Hito alcanzado o superado"
                    : `Faltan ${num(nextMilestone.subs - ytStats.subscriberCount)}`}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
                <div
                  className={cn("h-full rounded-full bg-accent transition-all")}
                  style={{
                    width: `${Math.min(
                      100,
                      (ytStats.subscriberCount / Math.max(1, nextMilestone.subs)) *
                        100,
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-muted">{nextMilestone.focus}</p>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5 text-sm text-muted shadow-[var(--shadow-border)]">
          <p className="font-display text-lg text-fg">Sin sync todavía</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>
              Google Cloud → crear proyecto → habilitar{" "}
              <strong className="text-fg">YouTube Data API v3</strong>
            </li>
            <li>Crear una API key (restringila a esa API si querés)</li>
            <li>
              En <strong className="text-fg">Ajustes</strong> pegá la API key y el
              handle del canal (@tuCanal) o el Channel ID (UC…)
            </li>
            <li>Volvé acá y tocá <strong className="text-fg">Sincronizar YouTube</strong></li>
          </ol>
        </section>
      )}

      {/* Últimos videos */}
      {ytVideos.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl">Últimos videos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ytVideos.map((v) => (
              <a
                key={v.id}
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
              >
                {v.thumbnailUrl ? (
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                ) : null}
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium text-fg">{v.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-subtle">
                    {num(v.viewCount)} views · {num(v.likeCount)} likes
                    {v.publishedAt
                      ? ` · ${new Date(v.publishedAt).toLocaleDateString("es-AR")}`
                      : ""}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <ChartShell title="Suscriptores proyectados (plan)" height={240}>
        <SimpleLine data={chart} dataKey="subs" name="Subs" />
      </ChartShell>

      <section>
        <h2 className="font-display text-2xl">Hitos (plan)</h2>
        <div className="mt-4 space-y-3">
          {YT_MILESTONES.map((m) => {
            const reached =
              ytStats &&
              !ytStats.hiddenSubscriberCount &&
              ytStats.subscriberCount >= m.subs;
            return (
              <div
                key={m.month}
                className={cn(
                  "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
                  reached && "ring-1 ring-accent/40",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-xl">
                    Mes {m.month}
                    {reached ? (
                      <span className="ml-2 font-mono text-[11px] text-ok">
                        alcanzado
                      </span>
                    ) : null}
                  </p>
                  <p className="font-mono text-[12px] text-subtle">
                    {num(m.subs)} subs · {num(m.viewsMonth)} views · USD {m.revenue}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">{m.focus}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Pilares</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {YT_PILLARS.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-xl">{p.title}</p>
              <p className="mt-1 text-sm text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Títulos sugeridos</h2>
        <ul className="mt-4 space-y-2">
          {YT_TITLES.map((t, i) => (
            <li
              key={i}
              className="rounded-lg bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
