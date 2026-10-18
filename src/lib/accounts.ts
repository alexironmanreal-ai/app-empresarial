/**
 * Auth + sesión.
 * - Con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY → Supabase Auth (email) + datos en Postgres.
 * - Sin config → cuentas locales en este dispositivo (fallback).
 *
 * El HQ se guarda por user_id (no por email): cambiar Gmail no mueve ni borra hq_state.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";
import { deleteHqFromCloud } from "./cloud-sync";

export type LocalAccount = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
};

export type Session = {
  userId: string;
  username: string;
  displayName: string;
  /** 'cloud' = Supabase; 'local' = solo este dispositivo */
  mode: "cloud" | "local";
};

const ACCOUNTS_KEY = "sentinel-hq-accounts-v1";
const SESSION_KEY = "sentinel-hq-session-v1";
export const HQ_PERSIST_NAME = "axion-hq-v4";

export function cloudEnabled(): boolean {
  return isSupabaseConfigured;
}

function readAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(list: LocalAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`sentinel-hq|${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function listAccounts(): Omit<LocalAccount, "passwordHash">[] {
  if (cloudEnabled()) return [];
  return readAccounts().map(({ passwordHash: _, ...rest }) => rest);
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.userId) return null;
    if (!s.mode) s.mode = cloudEnabled() ? "cloud" : "local";
    return s;
  } catch {
    return null;
  }
}

export function setSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCurrentUserId(): string | null {
  return getSession()?.userId ?? null;
}

export function hqStorageKey(userId: string | null | undefined): string {
  return userId ? `${HQ_PERSIST_NAME}:${userId}` : `${HQ_PERSIST_NAME}:guest`;
}

function hqStorageKeyLegacy(userId: string): string {
  return `axion-hq-v4-u-${userId}`;
}

export function migrateUserHqStorage(userId: string): void {
  try {
    const correct = hqStorageKey(userId);
    const legacy = hqStorageKeyLegacy(userId);
    const hasCorrect = localStorage.getItem(correct);
    const hasLegacy = localStorage.getItem(legacy);
    if (!hasCorrect && hasLegacy) {
      localStorage.setItem(correct, hasLegacy);
      localStorage.removeItem(legacy);
    }
  } catch {
    /* ignore */
  }
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("networkerror") ||
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("network request failed") ||
    m.includes("fetch failed")
  ) {
    return "Sin conexión con el servidor de auth. Revisá internet o el proxy de Vite (/api/supabase).";
  }
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Ese email ya está registrado. Probá entrar.";
  }
  if (m.includes("same") && m.includes("email")) {
    return "Ese ya es tu email actual.";
  }
  if (m.includes("email rate") || m.includes("over_email")) {
    return "Demasiados intentos de cambio de email. Esperá unos minutos.";
  }
  if (m.includes("password")) return "Contraseña inválida (mín. 6 caracteres en Supabase).";
  if (m.includes("email")) return "Email inválido.";
  if (m.includes("confirm")) {
    return "Revisá tu email para confirmar la cuenta (o desactivá confirmación en Supabase Auth).";
  }
  return message || "Error de autenticación.";
}

/** Restaura sesión desde Supabase al arrancar (tokens en localStorage del SDK). */
export async function restoreCloudSession(): Promise<Session | null> {
  if (!cloudEnabled()) return getSession()?.mode === "local" ? getSession() : null;
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.auth.getSession();
    if (error || !data.session?.user) {
      if (error && /network|fetch/i.test(error.message)) {
        return getSession()?.mode === "cloud" ? getSession() : null;
      }
      setSession(null);
      return null;
    }
    const user = data.session.user;
    const session: Session = {
      userId: user.id,
      username: user.email ?? user.id,
      displayName:
        (user.user_metadata?.display_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Usuario",
      mode: "cloud",
    };
    setSession(session);
    return session;
  } catch (e) {
    console.warn("[auth] restoreCloudSession network", e);
    return getSession()?.mode === "cloud" ? getSession() : null;
  }
}

/**
 * Cambiar email / Gmail de la cuenta actual.
 * - Cloud (Supabase): updateUser({ email }). El user_id NO cambia → hq_state intacto.
 *   Si el proyecto tiene “Confirm email change”, llega un mail al nuevo correo.
 * - Local: renombra el username de la cuenta en este dispositivo.
 */
export async function changeAccountEmail(
  newEmailRaw: string,
  currentPassword: string,
): Promise<
  | { ok: true; session: Session; needsConfirm: boolean; message: string }
  | { ok: false; error: string }
> {
  const newEmail = normalizeEmail(newEmailRaw);
  if (!isEmail(newEmail)) {
    return { ok: false, error: "Usá un email válido (ej. nuevo@gmail.com)." };
  }
  if (!currentPassword || currentPassword.length < 1) {
    return { ok: false, error: "Ingresá tu contraseña actual para confirmar." };
  }

  const current = getSession();
  if (!current) return { ok: false, error: "No hay sesión activa." };

  if (cloudEnabled() && current.mode === "cloud") {
    try {
      const sb = getSupabase()!;
      const oldEmail = normalizeEmail(current.username);

      if (newEmail === oldEmail) {
        return { ok: false, error: "Ese ya es tu email actual." };
      }

      // Re-autenticar con la contraseña actual (evita hijack de sesión)
      const { error: reAuthErr } = await sb.auth.signInWithPassword({
        email: oldEmail,
        password: currentPassword,
      });
      if (reAuthErr) {
        return { ok: false, error: mapAuthError(reAuthErr.message) };
      }

      const { data, error } = await sb.auth.updateUser({ email: newEmail });
      if (error) return { ok: false, error: mapAuthError(error.message) };

      const user = data.user;
      // Si aún no confirmó el cambio, Supabase puede seguir mostrando el email viejo
      // hasta que haga click en el link. user_id siempre es el mismo.
      const effectiveEmail =
        normalizeEmail(user?.email ?? "") ||
        normalizeEmail(user?.new_email ?? "") ||
        newEmail;
      const pending =
        !!user?.new_email &&
        normalizeEmail(user.new_email) === newEmail &&
        normalizeEmail(user.email ?? "") !== newEmail;

      const session: Session = {
        userId: current.userId,
        username: pending ? oldEmail : effectiveEmail,
        displayName:
          (user?.user_metadata?.display_name as string | undefined) ||
          current.displayName ||
          effectiveEmail.split("@")[0],
        mode: "cloud",
      };
      setSession(session);

      return {
        ok: true,
        session,
        needsConfirm: pending,
        message: pending
          ? `Te enviamos un enlace a ${newEmail}. Confirmalo para terminar el cambio. Tus datos del HQ (user_id) no se mueven.`
          : `Email actualizado a ${effectiveEmail}. Los datos del HQ siguen en la misma cuenta.`,
      };
    } catch (e) {
      return {
        ok: false,
        error: mapAuthError(e instanceof Error ? e.message : String(e)),
      };
    }
  }

  // Modo local: el “email” es el username
  const accounts = readAccounts();
  const account = accounts.find((a) => a.id === current.userId);
  if (!account) return { ok: false, error: "Cuenta local no encontrada." };

  const passwordHash = await hashPassword(currentPassword);
  if (passwordHash !== account.passwordHash) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  if (accounts.some((a) => a.username === newEmail && a.id !== account.id)) {
    return { ok: false, error: "Ese usuario/email ya existe en este dispositivo." };
  }

  const updated: LocalAccount = { ...account, username: newEmail };
  writeAccounts(accounts.map((a) => (a.id === account.id ? updated : a)));

  const session: Session = {
    userId: account.id,
    username: newEmail,
    displayName: account.displayName,
    mode: "local",
  };
  setSession(session);

  return {
    ok: true,
    session,
    needsConfirm: false,
    message: `Usuario actualizado a ${newEmail}. Datos locales intactos.`,
  };
}

export async function registerAccount(
  username: string,
  password: string,
  displayName?: string,
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  if (cloudEnabled()) {
    const email = normalizeEmail(username);
    if (!isEmail(email)) {
      return { ok: false, error: "Usá un email válido (ej. vos@empresa.com)." };
    }
    if (password.length < 6) {
      return { ok: false, error: "Contraseña demasiado corta (mín. 6)." };
    }
    try {
      const sb = getSupabase()!;
      const name = (displayName || email.split("@")[0]).trim();
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) return { ok: false, error: mapAuthError(error.message) };
      if (!data.user) {
        return {
          ok: false,
          error: "Cuenta creada. Si pide confirmación, revisá el email y luego entrá.",
        };
      }
      if (!data.session) {
        return {
          ok: false,
          error:
            "Cuenta creada. Confirmá el email (o en Supabase: Auth → Providers → Email → desactivar “Confirm email”) y volvé a entrar.",
        };
      }
      const session: Session = {
        userId: data.user.id,
        username: email,
        displayName: name,
        mode: "cloud",
      };
      setSession(session);
      return { ok: true, session };
    } catch (e) {
      return {
        ok: false,
        error: mapAuthError(e instanceof Error ? e.message : String(e)),
      };
    }
  }

  const u = username.trim().toLowerCase();
  if (u.length < 2) return { ok: false, error: "Usuario demasiado corto (mín. 2)." };
  if (password.length < 4) return { ok: false, error: "Contraseña demasiado corta (mín. 4)." };

  const accounts = readAccounts();
  if (accounts.some((a) => a.username === u)) {
    return { ok: false, error: "Ese usuario ya existe." };
  }

  const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await hashPassword(password);
  const account: LocalAccount = {
    id,
    username: u,
    displayName: (displayName || username).trim() || u,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, account]);

  const session: Session = {
    userId: id,
    username: account.username,
    displayName: account.displayName,
    mode: "local",
  };
  setSession(session);
  return { ok: true, session };
}

export async function loginAccount(
  username: string,
  password: string,
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  if (cloudEnabled()) {
    const email = normalizeEmail(username);
    if (!isEmail(email)) {
      return { ok: false, error: "Usá el email con el que te registraste." };
    }
    try {
      const sb = getSupabase()!;
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { ok: false, error: mapAuthError(error.message) };
      if (!data.user) return { ok: false, error: "No se pudo iniciar sesión." };
      const session: Session = {
        userId: data.user.id,
        username: email,
        displayName:
          (data.user.user_metadata?.display_name as string | undefined) ||
          email.split("@")[0],
        mode: "cloud",
      };
      setSession(session);
      return { ok: true, session };
    } catch (e) {
      return {
        ok: false,
        error: mapAuthError(e instanceof Error ? e.message : String(e)),
      };
    }
  }

  const u = username.trim().toLowerCase();
  const accounts = readAccounts();
  const account = accounts.find((a) => a.username === u);
  if (!account) return { ok: false, error: "Usuario o contraseña incorrectos." };

  const passwordHash = await hashPassword(password);
  if (passwordHash !== account.passwordHash) {
    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  const session: Session = {
    userId: account.id,
    username: account.username,
    displayName: account.displayName,
    mode: "local",
  };
  setSession(session);
  migrateUserHqStorage(account.id);
  return { ok: true, session };
}

export async function logoutAccount(): Promise<void> {
  if (cloudEnabled()) {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch (e) {
        console.warn("[auth] signOut network", e);
      }
    }
  }
  setSession(null);
}

export async function deleteAccount(
  userId: string,
  passwordHashConfirm?: string,
): Promise<boolean> {
  if (cloudEnabled()) {
    await deleteHqFromCloud(userId);
    await logoutAccount();
    try {
      localStorage.removeItem(hqStorageKey(userId));
    } catch {
      /* ignore */
    }
    return true;
  }

  const accounts = readAccounts();
  const account = accounts.find((a) => a.id === userId);
  if (!account) return false;
  if (passwordHashConfirm && account.passwordHash !== passwordHashConfirm) return false;

  writeAccounts(accounts.filter((a) => a.id !== userId));
  try {
    localStorage.removeItem(hqStorageKey(userId));
    localStorage.removeItem(hqStorageKeyLegacy(userId));
  } catch {
    /* ignore */
  }
  const session = getSession();
  if (session?.userId === userId) setSession(null);
  return true;
}

export function createUserScopedStorage(_baseName?: string) {
  return {
    getItem: (name: string): string | null => {
      const uid = getCurrentUserId();
      if (!uid) return null;
      const key = `${name}:${uid}`;
      let value = localStorage.getItem(key);
      if (value == null) {
        const legacy = `axion-hq-v4-u-${uid}`;
        const old = localStorage.getItem(legacy);
        if (old != null) {
          localStorage.setItem(key, old);
          localStorage.removeItem(legacy);
          value = old;
        }
      }
      return value;
    },
    setItem: (name: string, value: string): void => {
      const uid = getCurrentUserId();
      if (!uid) return;
      localStorage.setItem(`${name}:${uid}`, value);
    },
    removeItem: (name: string): void => {
      const uid = getCurrentUserId();
      if (!uid) return;
      localStorage.removeItem(`${name}:${uid}`);
      try {
        localStorage.removeItem(`axion-hq-v4-u-${uid}`);
      } catch {
        /* ignore */
      }
    },
  };
}
