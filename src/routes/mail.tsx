import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MAIL_SOURCES,
  buildGmailQuery,
  fetchImportantMails,
  gmailWebSearchUrl,
} from "@/lib/mail-important";
import { useHq } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ExternalLink, Mail, RefreshCw, Shield } from "lucide-react";

export const Route = createFileRoute("/mail")({ component: MailPage });

function MailPage() {
  const gmailAccessToken = useHq((s) => s.gmailAccessToken);
  const setGmailAccessToken = useHq((s) => s.setGmailAccessToken);
  const mailEnabledSources = useHq((s) => s.mailEnabledSources) ?? [];
  const setMailEnabledSources = useHq((s) => s.setMailEnabledSources);
  const importantMails = useHq((s) => s.importantMails) ?? [];
  const setImportantMails = useHq((s) => s.setImportantMails);
  const mailLastSyncAt = useHq((s) => s.mailLastSyncAt);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenDraft, setTokenDraft] = useState(gmailAccessToken || "");

  const query = useMemo(
    () => buildGmailQuery(mailEnabledSources, 30),
    [mailEnabledSources],
  );
  const webUrl = useMemo(
    () => gmailWebSearchUrl(mailEnabledSources, 30),
    [mailEnabledSources],
  );

  function toggleSource(id: string) {
    if (mailEnabledSources.includes(id)) {
      setMailEnabledSources(mailEnabledSources.filter((x) => x !== id));
    } else {
      setMailEnabledSources([...mailEnabledSources, id]);
    }
  }

  async function sync() {
    const token = (tokenDraft || gmailAccessToken).trim();
    if (!token) {
      setError("Pegá un access token de Gmail (OAuth) o abrí la búsqueda en Gmail web.");
      return;
    }
    setGmailAccessToken(token);
    setLoading(true);
    setError(null);
    try {
      const mails = await fetchImportantMails(token, mailEnabledSources, 30);
      setImportantMails(mails);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al sincronizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Comunicación
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Mail importante</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Solo mails de plataformas que mueven el negocio: plata, infra, AI, redes. El resto
          queda fuera del HQ.
        </p>
      </header>

      <section className="rounded-xl border border-accent/20 bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-start gap-2">
          <Shield className="mt-0.5 size-4 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-fg">Conectar Gmail (solo lectura filtrada)</p>
            <p className="mt-1 text-sm text-muted">
              Opción rápida: abrí la bandeja ya filtrada en Gmail. Opción HQ: access token OAuth
              (scope <span className="font-mono text-[11px]">gmail.readonly</span>) y sincronizá
              acá. El token se guarda local en este dispositivo.
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted">
              <li>
                Google Cloud → OAuth client → scope{" "}
                <span className="font-mono">https://www.googleapis.com/auth/gmail.readonly</span>
              </li>
              <li>
                O usá{" "}
                <a
                  className="text-accent underline"
                  href="https://developers.google.com/oauthplayground/"
                  target="_blank"
                  rel="noreferrer"
                >
                  OAuth Playground
                </a>{" "}
                → Gmail API v1 → authorize → copiá Access token
              </li>
              <li>Pegá el token abajo y tocá Sincronizar</li>
            </ol>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            className="font-mono text-xs"
            type="password"
            placeholder="Access token Gmail (oauth2)"
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
          />
          <Button className="gap-1.5" onClick={() => void sync()} disabled={loading}>
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            {loading ? "Sincronizando…" : "Sincronizar"}
          </Button>
          <Button
            variant="secondary"
            className="gap-1.5"
            onClick={() => window.open(webUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="size-3.5" />
            Abrir en Gmail
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        {mailLastSyncAt ? (
          <p className="mt-2 font-mono text-[10px] text-subtle">
            Última sync: {new Date(mailLastSyncAt).toLocaleString("es-AR")}
          </p>
        ) : null}
        <p className="mt-2 font-mono text-[10px] text-subtle break-all">Query: {query}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Fuentes</h2>
        <p className="text-sm text-muted">Activá solo lo que importa. El resto ni entra a la bandeja.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MAIL_SOURCES.map((s) => {
            const on = mailEnabledSources.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSource(s.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  on
                    ? "border-accent/40 bg-accent/10 text-fg"
                    : "border-border bg-surface text-muted opacity-60 hover:opacity-100",
                )}
              >
                <p className="font-medium text-fg">{s.label}</p>
                <p className="mt-0.5 font-mono text-[10px] text-subtle">
                  {s.category} · p{s.priority}
                </p>
                <p className="mt-1 text-[11px] text-muted">{s.patterns.slice(0, 2).join(" · ")}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Bandeja filtrada</h2>
          <span className="font-mono text-[11px] text-subtle">{importantMails.length} visibles</span>
        </div>
        {importantMails.length === 0 ? (
          <div className="rounded-xl bg-surface p-6 text-sm text-muted shadow-[var(--shadow-border)]">
            <Mail className="mb-2 size-5 text-subtle" />
            Sin mails aún. Habilitá fuentes, conectá token o abrí Gmail con la búsqueda
            filtrada.
          </div>
        ) : (
          <ul className="space-y-2">
            {importantMails.map((m) => (
              <li key={m.id}>
                <a
                  href={m.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-border)] transition-colors hover:border-accent/30 hover:bg-elevated/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {m.sourceLabel}
                    </span>
                    <span className="font-mono text-[10px] text-subtle">
                      {new Date(m.date).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-lg text-fg">{m.subject}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{m.from}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{m.snippet}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
