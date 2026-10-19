import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { num } from "@/lib/format";
import { useHq } from "@/lib/store";
import {
  fetchInstagram,
  fetchLinkedIn,
  fetchX,
  type SocialPlatform,
  type SocialPost,
  type SocialStats,
} from "@/lib/social";
import { ChartShell, SimpleLine } from "@/components/chart-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNote, KeyField, Panel, StatCard } from "./shared";

type PlatformConfig = {
  label: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  /** Si es null, la plataforma no usa campo de usuario. */
  handleLabel: string | null;
  handlePlaceholder: string;
  handleRequired: boolean;
  handleOkText: (v: string) => string;
  handleMissing: string;
  portalUrl: string;
  portalLabel: string;
  note: string;
  steps: string[];
  run: (
    token: string,
    handle: string,
  ) => Promise<{ stats: SocialStats; recent: SocialPost[] }>;
};

const CONFIG: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    label: "Instagram",
    tokenLabel: "Access Token (Instagram API con Instagram Login)",
    tokenPlaceholder: "IGAA…",
    handleLabel: null,
    handlePlaceholder: "",
    handleRequired: false,
    handleOkText: () => "",
    handleMissing: "",
    portalUrl: "https://developers.facebook.com/apps/",
    portalLabel: "Meta for Developers",
    note: "Solo cuentas profesionales (Business o Creator). El token largo dura ~60 días: hay que renovarlo.",
    steps: [
      "Pasá tu cuenta de Instagram a profesional (Business o Creator).",
      "En Meta for Developers creá una app y agregá el producto Instagram → Business login.",
      "Pedí los permisos instagram_business_basic (y content_publish si después querés publicar).",
      "Hacé el login OAuth y cambiá el code por un token corto, y ese por uno largo (~60 días).",
      "Pegá el token largo acá. El intercambio con el App Secret hacelo desde un servidor, no en el navegador.",
    ],
    run: (token) => fetchInstagram(token, 12),
  },
  x: {
    label: "X",
    tokenLabel: "Bearer Token",
    tokenPlaceholder: "AAAAAAAA…",
    handleLabel: "Usuario",
    handlePlaceholder: "@tuusuario",
    handleRequired: true,
    handleOkText: (v) => `@${v.replace(/^@/, "")}`,
    handleMissing: "Falta el @usuario",
    portalUrl: "https://developer.x.com/en/portal/dashboard",
    portalLabel: "X Developer Console",
    note: "X cobra por uso: cada sync lee 1 usuario + 5 posts (≈ US$0,03–0,06 según las tarifas publicadas). Poné un límite de gasto en la consola.",
    steps: [
      "Entrá a la X Developer Console con tu cuenta y creá un proyecto + app.",
      "Cargá crédito (el acceso es de pago por uso) y fijá un límite de gasto.",
      "En la app, generá el Bearer Token (Keys and tokens).",
      "Pegá el Bearer Token y tu @usuario acá.",
    ],
    run: (token, handle) => fetchX(token, handle, 5),
  },
  linkedin: {
    label: "LinkedIn",
    tokenLabel: "Access Token (OAuth 2.0)",
    tokenPlaceholder: "AQV…",
    handleLabel: "ID de página (opcional)",
    handlePlaceholder: "Ej. 12345678",
    handleRequired: false,
    handleOkText: (v) => `Página ${v}`,
    handleMissing: "Sin página: solo perfil personal",
    portalUrl: "https://www.linkedin.com/developers/apps",
    portalLabel: "LinkedIn Developers",
    note: "LinkedIn no da seguidores de perfiles personales por API. Con la página de empresa y acceso a Community Management API sí. Para el perfil personal usá el registro manual de abajo.",
    steps: [
      "Creá una Company Page y, desde linkedin.com/developers, una app asociada a esa página; verificala.",
      "En Products pedí “Sign In with LinkedIn using OpenID Connect” (y “Share on LinkedIn” si vas a publicar).",
      "En Auth copiá Client ID y Client Secret y cargá la redirect URL.",
      "Hacé el flujo OAuth (con state aleatorio) y canjeá el code por el access token desde un servidor.",
      "Pegá el token acá. Si tenés una página con acceso a Community Management, sumá su ID.",
    ],
    run: (token, handle) => fetchLinkedIn(token, handle),
  },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-AR");
}

export function SocialPanel({ platform }: { platform: SocialPlatform }) {
  const cfg = CONFIG[platform];
  const state = useHq((s) => s.social[platform]);
  const setField = useHq((s) => s.setSocialField);
  const setData = useHq((s) => s.setSocialData);
  const addManual = useHq((s) => s.addSocialManualPoint);
  const clear = useHq((s) => s.clearSocial);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const { token, handle, stats, recent, history } = state;
  const keyOk = token.trim().length > 10;

  const chart = useMemo(
    () =>
      history
        .filter((h) => h.followers !== null)
        .map((h) => {
          const d = new Date(h.at);
          return {
            label: `${d.getDate()}/${d.getMonth() + 1}`,
            followers: h.followers as number,
          };
        }),
    [history],
  );

  const engagement = useMemo(() => {
    const withLikes = recent.filter((p) => p.likes !== null);
    if (withLikes.length === 0) return null;
    const n = withLikes.length;
    const likes = withLikes.reduce((a, p) => a + (p.likes ?? 0), 0) / n;
    const comments = withLikes.reduce((a, p) => a + (p.comments ?? 0), 0) / n;
    const followers = stats?.followers ?? 0;
    const rate = followers > 0 ? ((likes + comments) / followers) * 100 : null;
    return { likes, comments, rate, n };
  }, [recent, stats?.followers]);

  async function sync() {
    if (!token.trim()) {
      setError(`Pegá el token de ${cfg.label} y volvé a sincronizar.`);
      return;
    }
    if (cfg.handleRequired && !handle.trim()) {
      setError(`Falta ${cfg.handleLabel?.toLowerCase() ?? "el usuario"}.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { stats, recent } = await cfg.run(token.trim(), handle);
      setData(platform, stats, recent);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Error al sincronizar ${cfg.label}`);
    } finally {
      setLoading(false);
    }
  }

  function saveManual() {
    const n = Number(manual.replace(/[.\s]/g, "").replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      setError("Ingresá un número de seguidores válido.");
      return;
    }
    setError(null);
    addManual(platform, Math.round(n));
    setManual("");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {cfg.label} · live
          </p>
          <h2 className="mt-1 font-display text-4xl sm:text-5xl">
            {stats?.name || cfg.label}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted">{cfg.note}</p>
        </div>
        <div className="flex gap-2">
          {stats || history.length > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (window.confirm(`¿Borrar los datos guardados de ${cfg.label}? La key se conserva.`)) {
                  clear(platform);
                }
              }}
            >
              Limpiar datos
            </Button>
          ) : null}
          <Button size="sm" onClick={sync} disabled={loading}>
            {loading ? "Sincronizando…" : `Sincronizar ${cfg.label}`}
          </Button>
        </div>
      </header>

      <Panel title={`Conexión ${cfg.label}`}>
        <div
          className={
            cfg.handleLabel ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"
          }
        >
          <KeyField
            label={cfg.tokenLabel}
            value={token}
            onChange={(v) => setField(platform, { token: v })}
            placeholder={cfg.tokenPlaceholder}
            secret
            ok={keyOk}
            okText="Key cargada"
            missingText="Sin key"
          />
          {cfg.handleLabel ? (
            <KeyField
              label={cfg.handleLabel}
              value={handle}
              onChange={(v) => setField(platform, { handle: v })}
              placeholder={cfg.handlePlaceholder}
              ok={handle.trim().length > 0 || !cfg.handleRequired}
              okText={
                handle.trim() ? cfg.handleOkText(handle.trim()) : cfg.handleMissing
              }
              missingText={cfg.handleMissing}
            />
          ) : null}
        </div>

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.14em] text-subtle hover:text-fg">
            Cómo conseguir la key
          </summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
            {cfg.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <a
            href={cfg.portalUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] text-accent hover:underline"
          >
            {cfg.portalLabel} <ExternalLink className="size-3" />
          </a>
        </details>
      </Panel>

      <ErrorNote message={error} />

      {stats ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {stats.avatarUrl ? (
              <img
                src={stats.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="size-14 rounded-full border border-border object-cover"
              />
            ) : null}
            <div>
              <p className="font-display text-xl">{stats.name}</p>
              <p className="font-mono text-[12px] text-subtle">
                {stats.handle} ·{" "}
                {new Date(stats.fetchedAt).toLocaleString("es-AR")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Seguidores"
              value={stats.followers !== null ? num(stats.followers) : "—"}
              hint={
                stats.followers === null && platform === "linkedin"
                  ? "No disponible por API en perfiles personales"
                  : undefined
              }
            />
            <StatCard
              label="Siguiendo"
              value={stats.following !== null ? num(stats.following) : "—"}
            />
            <StatCard
              label="Publicaciones"
              value={stats.posts !== null ? num(stats.posts) : "—"}
            />
          </div>

          {engagement ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Likes promedio"
                value={num(Math.round(engagement.likes))}
                hint={`Últimos ${engagement.n} posts`}
              />
              <StatCard
                label="Comentarios promedio"
                value={num(Math.round(engagement.comments))}
              />
              <StatCard
                label="Engagement"
                value={engagement.rate !== null ? `${engagement.rate.toFixed(2)}%` : "—"}
                hint="(likes + comentarios) / seguidores"
              />
            </div>
          ) : null}

          {Object.keys(stats.extra).length > 0 ? (
            <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {Object.entries(stats.extra).map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                      {k}
                    </dt>
                    <dd className="mt-0.5 break-words text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-muted">
          Pegá la key y sincronizá para ver tus métricas de {cfg.label}.
        </p>
      )}

      {chart.length > 1 ? (
        <ChartShell
          title={`Seguidores · historial de ${cfg.label}`}
          caption={`${chart.length} mediciones guardadas`}
          height={220}
        >
          <SimpleLine data={chart} dataKey="followers" name="Seguidores" />
        </ChartShell>
      ) : chart.length === 1 ? (
        <p className="text-sm text-muted">
          Hacé al menos 2 mediciones para ver el gráfico de seguidores.
        </p>
      ) : null}

      {platform === "linkedin" ? (
        <Panel title="Registro manual de seguidores">
          <p className="mb-3 text-sm text-muted">
            Como la API no trae seguidores del perfil personal, anotá el número
            cuando quieras (ej. cada lunes) y se suma al gráfico.
          </p>
          <div className="flex max-w-sm gap-2">
            <Input
              inputMode="numeric"
              className="font-mono text-xs"
              placeholder="Seguidores hoy"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveManual();
              }}
            />
            <Button size="sm" variant="secondary" className="h-10" onClick={saveManual}>
              Guardar
            </Button>
          </div>
        </Panel>
      ) : null}

      {history.length > 0 ? (
        <section>
          <h3 className="font-display text-2xl">Últimas mediciones</h3>
          <div className="mt-3 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                  <th className="px-4 py-2">Cuándo</th>
                  <th className="px-4 py-2 text-right">Seguidores</th>
                  <th className="px-4 py-2 text-right">Posts</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 15).map((h) => (
                  <tr key={h.at} className="border-b border-border/50">
                    <td className="px-4 py-2 font-mono text-[12px]">
                      {new Date(h.at).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {h.followers !== null ? num(h.followers) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {h.posts !== null ? num(h.posts) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section>
          <h3 className="font-display text-2xl">Últimas publicaciones</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <a
                key={p.id}
                href={p.url || undefined}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
              >
                {p.thumbnailUrl ? (
                  <img
                    src={p.thumbnailUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="aspect-square w-full object-cover"
                  />
                ) : null}
                <div className="p-3">
                  <p className="line-clamp-3 text-sm">
                    {p.text || "(sin texto)"}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-subtle">
                    {[
                      fmtDate(p.publishedAt),
                      p.likes !== null ? `${num(p.likes)} likes` : null,
                      p.comments !== null ? `${num(p.comments)} com.` : null,
                      p.shares ? `${num(p.shares)} shares` : null,
                      p.views !== null ? `${num(p.views)} views` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
