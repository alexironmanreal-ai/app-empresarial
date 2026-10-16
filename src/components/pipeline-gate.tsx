import { useMemo, useState } from "react";
import { getSession } from "@/lib/accounts";
import {
  isPipelineUnlocked,
  lockPipeline,
  pipelineIdentityHint,
  requestPipelineOtp,
  unlockPipeline,
} from "@/lib/pipeline-access";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Mail, KeyRound, UserRound, Lock, Unlock } from "lucide-react";

/**
 * Candado del Pipeline: identificación fácil + contraseña + código email.
 */
export function PipelineGate({ children }: { children: React.ReactNode }) {
  const session = getSession();
  const [unlocked, setUnlocked] = useState(() => isPipelineUnlocked(session?.userId));
  const [identity, setIdentity] = useState(() => pipelineIdentityHint(session));
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [localCode, setLocalCode] = useState<string | null>(null);
  const [otpMsg, setOtpMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const display = useMemo(
    () => session?.displayName || session?.username || "Usuario",
    [session],
  );

  if (unlocked) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">
          <span className="inline-flex items-center gap-2 font-mono text-[12px]">
            <Unlock className="size-3.5" />
            Pipeline desbloqueado · esta pestaña (~45 min)
          </span>
          <button
            type="button"
            className="font-mono text-[11px] text-muted underline-offset-2 hover:text-fg hover:underline"
            onClick={() => {
              lockPipeline();
              setUnlocked(false);
              setPassword("");
              setOtp("");
              setOtpSent(false);
              setLocalCode(null);
            }}
          >
            Volver a bloquear
          </button>
        </div>
        {children}
      </div>
    );
  }

  async function onRequestOtp() {
    setError("");
    setOtpMsg("");
    setLocalCode(null);
    setBusy(true);
    try {
      const r = await requestPipelineOtp(identity);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setOtpSent(true);
      setOtpMsg(r.message);
      if (r.mode === "local") setLocalCode(r.localCode);
    } finally {
      setBusy(false);
    }
  }

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await unlockPipeline({ identity, password, otp });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setUnlocked(true);
      setPassword("");
      setOtp("");
      setLocalCode(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center">
      <div className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent/15 p-2 text-accent">
            <Shield className="size-5" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
              Acceso restringido
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl">Pipeline</h1>
            <p className="mt-2 text-sm text-muted">
              Para ver leads y montos necesitás identificarte, confirmar la
              contraseña y un código enviado por email.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-elevated/50 px-3 py-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
            Identificación fácil
          </p>
          <p className="mt-1 text-sm text-fg">
            Sesión activa: <strong>{display}</strong>
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-subtle">
            Confirmá que sos vos con el email / usuario de la cuenta.
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onUnlock}>
          <div>
            <Label className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5 text-subtle" />
              Identificación
            </Label>
            <Input
              className="mt-1.5"
              autoComplete="username"
              placeholder="email o usuario"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              required
            />
          </div>

          <div>
            <Label className="inline-flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-subtle" />
              Contraseña
            </Label>
            <Input
              className="mt-1.5"
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña de la cuenta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <Label className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-subtle" />
                Código de email (6 dígitos)
              </Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={onRequestOtp}
              >
                {otpSent ? "Reenviar código" : "Enviar código"}
              </Button>
            </div>
            <Input
              className="mt-1.5 font-mono tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
            {otpMsg ? (
              <p className="mt-2 text-xs text-muted">{otpMsg}</p>
            ) : null}
            {localCode ? (
              <p className="mt-2 rounded-md bg-warn/15 px-3 py-2 font-mono text-sm text-warn">
                Código local: <strong className="text-fg">{localCode}</strong>
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-md bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy || otp.length !== 6}>
            <Lock className="size-4" />
            {busy ? "Verificando…" : "Desbloquear pipeline"}
          </Button>
        </form>

        <p className="mt-4 font-mono text-[10px] leading-relaxed text-subtle">
          Con Supabase el código llega al email de la cuenta. Sin Supabase (modo
          local) el código se genera en este dispositivo. El desbloqueo dura ~
          {45} min en esta pestaña.
        </p>
      </div>
    </div>
  );
}
