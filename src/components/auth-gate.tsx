import { useCallback, useEffect, useState } from "react";
import {
  cloudEnabled,
  getSession,
  listAccounts,
  loginAccount,
  registerAccount,
  restoreCloudSession,
  migrateUserHqStorage,
  type Session,
} from "@/lib/accounts";
import { switchHqUser } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { FaceGate } from "./face-gate";
import { BootSplash } from "./boot-splash";

type Mode = "login" | "register";

const SPLASH_KEY = "sentinel-hq-splash-seen-session";

function shouldShowSplash(): boolean {
  try {
    // Una vez por pestaña/sesión de navegador
    return sessionStorage.getItem(SPLASH_KEY) !== "1";
  } catch {
    return true;
  }
}

function markSplashSeen() {
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function AuthGate({
  children,
}: {
  children: (session: Session) => React.ReactNode;
}) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(() => !shouldShowSplash());
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cloud = cloudEnabled();
  const accounts = listAccounts();

  const onSplashDone = useCallback(() => {
    markSplashSeen();
    setSplashDone(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (cloud) {
          const s = await restoreCloudSession();
          if (!cancelled) setSessionState(s);
        } else {
          if (!cancelled) setSessionState(getSession());
        }
      } finally {
        /* ready tras switchHqUser */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloud]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (session) {
        migrateUserHqStorage(session.userId);
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
      setReady(false);
      setSessionState(result.session);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  // Splash siempre primero (una vez por sesión de pestaña)
  if (!splashDone) {
    return <BootSplash onDone={onSplashDone} />;
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="font-mono text-sm">
          {cloud ? "Sincronizando con la nube…" : "Cargando…"}
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-bg p-4"
        style={{
          animation: "hq-login-in 0.55s ease both",
        }}
      >
        <style>{`
          @keyframes hq-login-in {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            Sentinel HQ
          </p>
          <h1 className="mt-2 font-display text-3xl">
            {mode === "login"
              ? "Entrar"
              : cloud
                ? "Crear cuenta"
                : "Crear cuenta local"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {cloud ? (
              <>
                Datos en <strong className="text-fg">Supabase / Postgres</strong>
                : sobreviven al cerrar sesión y en cualquier dispositivo con las
                mismas credenciales.
              </>
            ) : (
              <>
                Sin Supabase configurado: cuentas solo en este dispositivo. Para
                nube, creá un proyecto y definí{" "}
                <code className="text-xs">VITE_SUPABASE_URL</code> y{" "}
                <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>.
              </>
            )}
          </p>

          {!cloud && accounts.length > 0 && mode === "login" && (
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
              <Label>{cloud ? "Email" : "Usuario"}</Label>
              <Input
                className="mt-1.5"
                type={cloud ? "email" : "text"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={cloud ? "vos@empresa.com" : "usuario"}
                autoComplete={cloud ? "email" : "username"}
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
                placeholder="••••••••"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
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
                  {cloud ? "Crear cuenta" : "Crear cuenta local"}
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

  return <FaceGate session={session}>{children(session)}</FaceGate>;
}
