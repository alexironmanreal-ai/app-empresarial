/**
 * Cuentas locales (solo este dispositivo).
 * Cada usuario tiene su propio almacenamiento Zustand (persistencia aislada).
 */

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
};

const ACCOUNTS_KEY = "sentinel-hq-accounts-v1";
const SESSION_KEY = "sentinel-hq-session-v1";

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
  return readAccounts().map(({ passwordHash: _, ...rest }) => rest);
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
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

/** Clave de persistencia Zustand por usuario */
export function hqStorageKey(userId: string | null | undefined): string {
  return userId ? `axion-hq-v4-u-${userId}` : "axion-hq-v4-guest";
}

export async function registerAccount(
  username: string,
  password: string,
  displayName?: string,
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
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
  };
  setSession(session);
  return { ok: true, session };
}

export async function loginAccount(
  username: string,
  password: string,
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
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
  };
  setSession(session);
  return { ok: true, session };
}

export function logoutAccount() {
  setSession(null);
}

export function deleteAccount(userId: string, passwordHashConfirm?: string): boolean {
  const accounts = readAccounts();
  const account = accounts.find((a) => a.id === userId);
  if (!account) return false;
  if (passwordHashConfirm && account.passwordHash !== passwordHashConfirm) return false;

  writeAccounts(accounts.filter((a) => a.id !== userId));
  // limpia datos del HQ de ese usuario
  try {
    localStorage.removeItem(hqStorageKey(userId));
  } catch {
    /* ignore */
  }
  const session = getSession();
  if (session?.userId === userId) setSession(null);
  return true;
}

/** Storage Zustand aislado por usuario (lee/escribe la clave del usuario actual) */
export function createUserScopedStorage(baseName: string) {
  return {
    getItem: (name: string): string | null => {
      const uid = getCurrentUserId();
      if (!uid) return null;
      return localStorage.getItem(`${name}:${uid}`);
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
    },
  };
}
