import { useEffect, useState } from "react";
import {
  getSession,
  listAccounts,
  loginAccount,
  registerAccount,
  type Session,
} from "@/lib/accounts";
import { switchHqUser } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Mode = "login" | "register";

export function AuthGate({
  children,
}: {
  children: (session: Session) => React.ReactNode;
}) {
  const [session, setSessionState] = useState<Session | null>(() => getSession());
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const accounts = listAccounts();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (session) {
        await switchHqUser();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.userId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await loginAccount(username, password)
          : await registerAccount(username, password, displayName || username);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSessionState(result.session);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="font-mono text-sm">Cargando…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
        <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            Sentinel HQ
          </p>
          <h1 className="mt-2 font-display text-3xl">
            {mode === "login" ? "Entrar" : "Crear cuenta local"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Cuentas solo en este dispositivo. Cada usuario guarda su propio
            progreso, caja, pipeline y claves API.
          </p>

          {accounts.length > 0 && mode === "login" && (
            <div className="mt-4 rounded-md bg-elevated/60 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                Cuentas en este equipo
              </p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="text-left hover:text-fg"
                      onClick={() => setUsername(a.username)}
                    >
                      {a.displayName}{" "}
                      <span className="font-mono text-xs text-subtle">
                        @{a.username}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            {mode === "register" && (
              <div>
                <Label>Nombre para mostrar</Label>
                <Input
                  className="mt-1.5"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <Label>Usuario</Label>
              <Input
                className="mt-1.5"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                className="mt-1.5"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <Button className="w-full" type="submit" disabled={busy}>
              {busy
                ? "…"
                : mode === "login"
                  ? "Entrar al HQ"
                  : "Crear y entrar"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            {mode === "login" ? (
              <>
                ¿Primera vez?{" "}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Crear cuenta local
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{" "}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
