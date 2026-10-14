/**
 * Auth + sesión.
 * - Con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY → Supabase Auth (email) + datos en Postgres.
 * - Sin config → cuentas locales en este dispositivo (fallback).
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
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Ese email ya está registrado. Probá entrar.";
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

  const { data, error } = await sb.auth.getSession();
  if (error || !data.session?.user) {
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
    if (sb) await sb.auth.signOut();
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
