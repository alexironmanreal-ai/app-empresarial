/**
 * Acceso reforzado al Pipeline: identificación + contraseña + código email (OTP).
 * - Cloud (Supabase): OTP real por correo.
 * - Local: OTP generado en el dispositivo (sin servidor de mail).
 */
import {
  getSession,
  hashPassword,
  type Session,
} from "./accounts";
import { getSupabase, isSupabaseConfigured } from "./supabase";

const UNLOCK_KEY = "sentinel-pipeline-unlock-v1";
const LOCAL_OTP_KEY = "sentinel-pipeline-otp-v1";
/** Minutos de sesión desbloqueada en esta pestaña */
const UNLOCK_TTL_MIN = 45;
const OTP_TTL_MS = 10 * 60 * 1000;

type UnlockPayload = {
  userId: string;
  until: number;
};

type LocalOtpPayload = {
  userId: string;
  email: string;
  codeHash: string;
  until: number;
};

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

export function isPipelineUnlocked(userId?: string | null): boolean {
  const uid = userId ?? getSession()?.userId;
  if (!uid) return false;
  try {
    const raw = sessionStorage.getItem(UNLOCK_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as UnlockPayload;
    if (p.userId !== uid) return false;
    if (Date.now() > p.until) {
      sessionStorage.removeItem(UNLOCK_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function lockPipeline(): void {
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function markPipelineUnlocked(userId: string): void {
  const payload: UnlockPayload = {
    userId,
    until: Date.now() + UNLOCK_TTL_MIN * 60_000,
  };
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(payload));
}

/** Verifica contraseña de la sesión actual (sin cerrar sesión). */
export async function verifyAccountPassword(
  identity: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = getSession();
  if (!session) return { ok: false, error: "No hay sesión activa." };
  if (!password.trim()) return { ok: false, error: "Ingresá la contraseña." };

  const idNorm = identity.trim().toLowerCase();
  const expected =
    session.mode === "cloud"
      ? normalizeEmail(session.username)
      : session.username.toLowerCase();

  if (idNorm !== expected && idNorm !== session.displayName.toLowerCase()) {
    return {
      ok: false,
      error: "La identificación no coincide con la cuenta activa.",
    };
  }

  if (session.mode === "cloud" && isSupabaseConfigured) {
    const email = normalizeEmail(session.username);
    if (!isEmail(email)) {
      return { ok: false, error: "La cuenta cloud no tiene email válido." };
    }
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Supabase no disponible." };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, error: "Contraseña incorrecta." };
    }
    return { ok: true };
  }

  // Local
  try {
    const raw = localStorage.getItem("sentinel-hq-accounts-v1");
    const list = raw ? (JSON.parse(raw) as { id: string; passwordHash: string }[]) : [];
    const acc = list.find((a) => a.id === session.userId);
    if (!acc) return { ok: false, error: "Cuenta local no encontrada." };
    const h = await hashPassword(password);
    if (h !== acc.passwordHash) return { ok: false, error: "Contraseña incorrecta." };
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo verificar la contraseña." };
  }
}

/**
 * Pide código por email.
 * Cloud → Supabase envía el mail.
 * Local → genera código y lo devuelve para mostrarlo una sola vez (sin SMTP).
 */
export async function requestPipelineOtp(
  emailHint?: string,
): Promise<
  | { ok: true; mode: "cloud"; message: string }
  | { ok: true; mode: "local"; message: string; localCode: string }
  | { ok: false; error: string }
> {
  const session = getSession();
  if (!session) return { ok: false, error: "No hay sesión activa." };

  if (session.mode === "cloud" && isSupabaseConfigured) {
    const email = normalizeEmail(session.username);
    if (!isEmail(email)) {
      return { ok: false, error: "Tu cuenta no tiene un email válido para OTP." };
    }
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Supabase no disponible." };
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      return {
        ok: false,
        error:
          error.message.includes("rate")
            ? "Demasiados intentos. Esperá un minuto y reintentá."
            : error.message || "No se pudo enviar el código.",
      };
    }
    return {
      ok: true,
      mode: "cloud",
      message: `Código enviado a ${email}. Revisá bandeja y spam.`,
    };
  }

  // Local: OTP en dispositivo
  let email = (emailHint || "").trim();
  if (!isEmail(email)) {
    email = isEmail(session.username) ? normalizeEmail(session.username) : "";
  }
  if (!email) {
    return {
      ok: false,
      error: "En modo local indicá un email válido para asociar el código.",
    };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await hashPassword(`pipeline-otp|${code}`);
  const payload: LocalOtpPayload = {
    userId: session.userId,
    email: normalizeEmail(email),
    codeHash,
    until: Date.now() + OTP_TTL_MS,
  };
  sessionStorage.setItem(LOCAL_OTP_KEY, JSON.stringify(payload));
  return {
    ok: true,
    mode: "local",
    message:
      "Modo local (sin Supabase): no hay servidor de mail. Usá el código de un solo uso que aparece abajo.",
    localCode: code,
  };
}

export async function verifyPipelineOtp(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = getSession();
  if (!session) return { ok: false, error: "No hay sesión activa." };
  const token = code.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) {
    return { ok: false, error: "El código debe tener 6 dígitos." };
  }

  if (session.mode === "cloud" && isSupabaseConfigured) {
    const email = normalizeEmail(session.username);
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Supabase no disponible." };
    const { error } = await sb.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      return { ok: false, error: "Código inválido o vencido." };
    }
    return { ok: true };
  }

  try {
    const raw = sessionStorage.getItem(LOCAL_OTP_KEY);
    if (!raw) return { ok: false, error: "Pedí un código primero." };
    const p = JSON.parse(raw) as LocalOtpPayload;
    if (p.userId !== session.userId) {
      return { ok: false, error: "Código de otra sesión." };
    }
    if (Date.now() > p.until) {
      sessionStorage.removeItem(LOCAL_OTP_KEY);
      return { ok: false, error: "Código vencido. Pedí uno nuevo." };
    }
    const h = await hashPassword(`pipeline-otp|${token}`);
    if (h !== p.codeHash) return { ok: false, error: "Código incorrecto." };
    sessionStorage.removeItem(LOCAL_OTP_KEY);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo validar el código." };
  }
}

/** Flujo completo: id + password + OTP → desbloquea pipeline */
export async function unlockPipeline(args: {
  identity: string;
  password: string;
  otp: string;
}): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const session = getSession();
  if (!session) return { ok: false, error: "No hay sesión activa." };

  const pwd = await verifyAccountPassword(args.identity, args.password);
  if (!pwd.ok) return pwd;

  const otp = await verifyPipelineOtp(args.otp);
  if (!otp.ok) return otp;

  markPipelineUnlocked(session.userId);
  return { ok: true, session };
}

export function pipelineIdentityHint(session: Session | null): string {
  if (!session) return "";
  return session.username;
}
