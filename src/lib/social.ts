/**
 * Marca personal: clientes de Instagram, X y LinkedIn + conectores genéricos.
 *
 * Las llamadas pasan por el proxy local (Vite en dev, servidor de Electron en la app):
 *   /api/ig → graph.instagram.com
 *   /api/x  → api.x.com
 *   /api/li → api.linkedin.com
 * Así no hay problemas de CORS y las keys no viajan a ningún servidor propio.
 *
 * Los conectores "otras apps" llaman directo desde el navegador: solo funcionan
 * con APIs que permiten CORS.
 */

export type SocialPlatform = "instagram" | "linkedin" | "x";

export type SocialStats = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  followers: number | null;
  following: number | null;
  posts: number | null;
  /** Datos propios de cada red (email, tipo de cuenta, etc.). */
  extra: Record<string, string>;
  fetchedAt: string;
};

export type SocialPost = {
  id: string;
  text: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
};

export type SocialPoint = {
  at: string;
  followers: number | null;
  posts: number | null;
};

export type SocialState = {
  token: string;
  /** @usuario (X / Instagram) o ID de organización (LinkedIn). */
  handle: string;
  stats: SocialStats | null;
  recent: SocialPost[];
  history: SocialPoint[];
};

export const EMPTY_SOCIAL_STATE: SocialState = {
  token: "",
  handle: "",
  stats: null,
  recent: [],
  history: [],
};

export function emptySocial(): Record<SocialPlatform, SocialState> {
  return {
    instagram: { ...EMPTY_SOCIAL_STATE },
    linkedin: { ...EMPTY_SOCIAL_STATE },
    x: { ...EMPTY_SOCIAL_STATE },
  };
}

/** Tolera estados viejos o parciales (localStorage / nube sin esta sección). */
export function normalizeSocial(raw: unknown): Record<SocialPlatform, SocialState> {
  const base = emptySocial();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  for (const p of ["instagram", "linkedin", "x"] as const) {
    const v = r[p];
    if (!v || typeof v !== "object") continue;
    const s = v as Partial<SocialState>;
    base[p] = {
      token: typeof s.token === "string" ? s.token : "",
      handle: typeof s.handle === "string" ? s.handle : "",
      stats: s.stats && typeof s.stats === "object" ? (s.stats as SocialStats) : null,
      recent: Array.isArray(s.recent) ? (s.recent as SocialPost[]) : [],
      history: Array.isArray(s.history) ? (s.history as SocialPoint[]) : [],
    };
  }
  return base;
}

export const SOCIAL_HISTORY_MAX = 90;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function readError(res: Response, label: string): Promise<Error> {
  const text = await res.text().catch(() => "");
  let msg = `${label} ${res.status}`;
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const err = j.error as { message?: string } | string | undefined;
    const detail =
      (typeof err === "object" ? err?.message : err) ??
      (j.detail as string | undefined) ??
      (j.message as string | undefined) ??
      (j.title as string | undefined);
    if (detail) msg = `${label} ${res.status}: ${detail}`;
  } catch {
    if (text) msg = `${label} ${res.status}: ${text.slice(0, 200)}`;
  }
  return new Error(msg);
}

function toNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ */
/* Instagram (Instagram API with Instagram Login)                      */
/* ------------------------------------------------------------------ */

async function igFetch(path: string, token: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `/api/ig${path}${sep}access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) {
    const e = await readError(res, "Instagram");
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      e.message +=
        " — Revisá que el token sea de una cuenta profesional, tenga el permiso instagram_business_basic y no esté vencido (dura ~60 días).";
    }
    throw e;
  }
  return res.json();
}

export async function fetchInstagram(
  token: string,
  postLimit = 12,
): Promise<{ stats: SocialStats; recent: SocialPost[] }> {
  const me = (await igFetch(
    "/me?fields=user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
    token,
  )) as Record<string, unknown>;

  const stats: SocialStats = {
    id: String(me.user_id ?? me.id ?? ""),
    name: String(me.name ?? me.username ?? ""),
    handle: me.username ? `@${String(me.username)}` : "",
    avatarUrl: String(me.profile_picture_url ?? ""),
    followers: toNum(me.followers_count),
    following: toNum(me.follows_count),
    posts: toNum(me.media_count),
    extra: me.account_type ? { Cuenta: String(me.account_type) } : {},
    fetchedAt: new Date().toISOString(),
  };

  let recent: SocialPost[] = [];
  try {
    const media = (await igFetch(
      `/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${postLimit}`,
      token,
    )) as { data?: Record<string, unknown>[] };
    recent = (media.data ?? []).map((m) => ({
      id: String(m.id),
      text: String(m.caption ?? ""),
      url: String(m.permalink ?? ""),
      thumbnailUrl: String(m.thumbnail_url ?? m.media_url ?? ""),
      publishedAt: String(m.timestamp ?? ""),
      likes: toNum(m.like_count),
      comments: toNum(m.comments_count),
      shares: null,
      views: null,
    }));
  } catch {
    /* los posts son opcionales: si falla, igual mostramos el perfil */
  }
  return { stats, recent };
}

/* ------------------------------------------------------------------ */
/* X (API v2, Bearer token)                                            */
/* ------------------------------------------------------------------ */

async function xFetch(path: string, token: string) {
  const res = await fetch(`/api/x${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const e = await readError(res, "X");
    if (res.status === 401) e.message += " — Bearer Token inválido.";
    if (res.status === 402 || res.status === 403 || res.status === 429) {
      e.message +=
        " — Revisá el crédito y el límite de gasto en la Developer Console de X (el acceso es de pago por uso).";
    }
    throw e;
  }
  return res.json();
}

/** Cada sync lee 1 usuario + `postLimit` posts (X cobra por lectura). */
export async function fetchX(
  token: string,
  handle: string,
  postLimit = 5,
): Promise<{ stats: SocialStats; recent: SocialPost[] }> {
  const username = handle.trim().replace(/^@/, "");
  if (!username) throw new Error("Falta el @usuario de X.");

  const u = (await xFetch(
    `/2/users/by/username/${encodeURIComponent(username)}?user.fields=public_metrics,profile_image_url,description,verified,created_at`,
    token,
  )) as {
    data?: {
      id: string;
      name: string;
      username: string;
      profile_image_url?: string;
      description?: string;
      public_metrics?: {
        followers_count?: number;
        following_count?: number;
        tweet_count?: number;
        listed_count?: number;
      };
    };
  };
  if (!u.data) throw new Error(`No encontré el usuario @${username} en X.`);

  const pm = u.data.public_metrics ?? {};
  const stats: SocialStats = {
    id: u.data.id,
    name: u.data.name,
    handle: `@${u.data.username}`,
    avatarUrl: (u.data.profile_image_url ?? "").replace("_normal", "_200x200"),
    followers: toNum(pm.followers_count),
    following: toNum(pm.following_count),
    posts: toNum(pm.tweet_count),
    extra: {
      ...(pm.listed_count != null ? { Listas: String(pm.listed_count) } : {}),
      ...(u.data.description ? { Bio: u.data.description } : {}),
    },
    fetchedAt: new Date().toISOString(),
  };

  let recent: SocialPost[] = [];
  if (postLimit > 0) {
    try {
      const max = Math.min(100, Math.max(5, postLimit));
      const t = (await xFetch(
        `/2/users/${u.data.id}/tweets?max_results=${max}&exclude=retweets,replies&tweet.fields=created_at,public_metrics`,
        token,
      )) as {
        data?: {
          id: string;
          text: string;
          created_at?: string;
          public_metrics?: {
            like_count?: number;
            reply_count?: number;
            retweet_count?: number;
            quote_count?: number;
            impression_count?: number;
          };
        }[];
      };
      recent = (t.data ?? []).slice(0, postLimit).map((p) => ({
        id: p.id,
        text: p.text,
        url: `https://x.com/${u.data!.username}/status/${p.id}`,
        thumbnailUrl: "",
        publishedAt: p.created_at ?? "",
        likes: toNum(p.public_metrics?.like_count),
        comments: toNum(p.public_metrics?.reply_count),
        shares:
          (toNum(p.public_metrics?.retweet_count) ?? 0) +
          (toNum(p.public_metrics?.quote_count) ?? 0),
        views: toNum(p.public_metrics?.impression_count),
      }));
    } catch {
      /* posts opcionales */
    }
  }
  return { stats, recent };
}

/* ------------------------------------------------------------------ */
/* LinkedIn                                                            */
/* ------------------------------------------------------------------ */

async function liFetch(path: string, token: string) {
  const res = await fetch(`/api/li${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });
  if (!res.ok) {
    const e = await readError(res, "LinkedIn");
    if (res.status === 401) {
      e.message += " — Token inválido o vencido. Generá uno nuevo con el flujo OAuth.";
    }
    throw e;
  }
  return res.json();
}

/**
 * LinkedIn no publica seguidores de perfiles personales por API.
 * - Con "Sign In with LinkedIn (OpenID)" traemos nombre, foto y email.
 * - Si cargás el ID de una página (y tu app tiene acceso a Community Management),
 *   traemos sus seguidores.
 */
export async function fetchLinkedIn(
  token: string,
  orgId: string,
): Promise<{ stats: SocialStats; recent: SocialPost[] }> {
  const me = (await liFetch("/v2/userinfo", token)) as Record<string, unknown>;
  const extra: Record<string, string> = {};
  if (me.email) extra.Email = String(me.email);
  if (me.locale) {
    const loc = me.locale as { language?: string; country?: string } | string;
    extra.Idioma =
      typeof loc === "string" ? loc : [loc.language, loc.country].filter(Boolean).join("-");
  }

  let followers: number | null = null;
  const org = orgId.trim().replace(/^urn:li:organization:/, "");
  if (org) {
    try {
      const n = (await liFetch(
        `/v2/networkSizes/urn:li:organization:${encodeURIComponent(org)}?edgeType=CompanyFollowedByMember`,
        token,
      )) as { firstDegreeSize?: number };
      followers = toNum(n.firstDegreeSize);
      extra["Página (ID)"] = org;
    } catch (e) {
      extra["Página"] =
        "No se pudo leer (tu app necesita acceso a Community Management API)";
      if (e instanceof Error) console.warn("[linkedin] networkSizes", e.message);
    }
  }

  return {
    stats: {
      id: String(me.sub ?? ""),
      name: String(me.name ?? [me.given_name, me.family_name].filter(Boolean).join(" ")),
      handle: org ? `Página ${org}` : "Perfil personal",
      avatarUrl: String(me.picture ?? ""),
      followers,
      following: null,
      posts: null,
      extra,
      fetchedAt: new Date().toISOString(),
    },
    recent: [],
  };
}

/* ------------------------------------------------------------------ */
/* Otras apps (conector genérico)                                      */
/* ------------------------------------------------------------------ */

export type CustomAuth = "bearer" | "header" | "query" | "none";

export type CustomApiPoint = { at: string; value: number };

export type CustomApi = {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  auth: CustomAuth;
  /** Nombre del header (auth=header) o del parámetro (auth=query). */
  authName: string;
  token: string;
  /** Ruta al número que querés seguir, ej. data.followers_count */
  metricPath: string;
  lastValue: number | null;
  lastStatus: number | null;
  lastPreview: string;
  lastSyncAt: string | null;
  lastError: string | null;
  history: CustomApiPoint[];
};

export const CUSTOM_PRESETS: {
  name: string;
  baseUrl: string;
  auth: CustomAuth;
  authName: string;
  hint: string;
}[] = [
  {
    name: "Threads",
    baseUrl: "https://graph.threads.net",
    auth: "query",
    authName: "access_token",
    hint: "/v1.0/me?fields=id,username",
  },
  {
    name: "Facebook Page",
    baseUrl: "https://graph.facebook.com",
    auth: "query",
    authName: "access_token",
    hint: "/v21.0/me?fields=id,name,fan_count",
  },
  {
    name: "TikTok",
    baseUrl: "https://open.tiktokapis.com",
    auth: "bearer",
    authName: "",
    hint: "/v2/user/info/?fields=display_name,follower_count",
  },
  {
    name: "Beehiiv",
    baseUrl: "https://api.beehiiv.com",
    auth: "bearer",
    authName: "",
    hint: "/v2/publications",
  },
];

export function newCustomApi(
  preset?: Partial<Pick<CustomApi, "name" | "baseUrl" | "auth" | "authName">> & {
    hint?: string;
  },
): CustomApi {
  return {
    id: `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: preset?.name ?? "Nueva app",
    baseUrl: preset?.baseUrl ?? "",
    endpoint: preset?.hint ?? "",
    auth: preset?.auth ?? "bearer",
    authName: preset?.authName ?? "",
    token: "",
    metricPath: "",
    lastValue: null,
    lastStatus: null,
    lastPreview: "",
    lastSyncAt: null,
    lastError: null,
    history: [],
  };
}

export function normalizeCustomApis(raw: unknown): CustomApi[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === "object")
    .map((a) => ({ ...newCustomApi(), ...(a as Partial<CustomApi>) }));
}

/** Lee `a.b[0].c` de un objeto. */
export function readPath(obj: unknown, path: string): unknown {
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export type CustomApiResult = {
  status: number;
  preview: string;
  value: number | null;
};

export async function callCustomApi(api: CustomApi): Promise<CustomApiResult> {
  const base = api.baseUrl.trim().replace(/\/$/, "");
  if (!/^https:\/\//i.test(base)) {
    throw new Error("La URL base tiene que empezar con https://");
  }
  const endpoint = api.endpoint.trim();
  let url = base + (endpoint.startsWith("/") || !endpoint ? endpoint : `/${endpoint}`);
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = api.token.trim();

  if (token) {
    if (api.auth === "bearer") headers.Authorization = `Bearer ${token}`;
    else if (api.auth === "header") {
      if (!api.authName.trim()) throw new Error("Falta el nombre del header.");
      headers[api.authName.trim()] = token;
    } else if (api.auth === "query") {
      const name = api.authName.trim() || "access_token";
      url += `${url.includes("?") ? "&" : "?"}${encodeURIComponent(name)}=${encodeURIComponent(token)}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    throw new Error(
      "No se pudo conectar. Lo más común: esa API no permite llamadas desde el navegador (CORS). Si pasa eso, hay que sumarle un proxy como los de Instagram/X/LinkedIn.",
    );
  }

  const text = await res.text().catch(() => "");
  let value: number | null = null;
  let preview = text.slice(0, 600);
  try {
    const json = JSON.parse(text) as unknown;
    preview = JSON.stringify(json, null, 2).slice(0, 600);
    if (api.metricPath.trim()) value = toNum(readPath(json, api.metricPath.trim()));
  } catch {
    /* respuesta no-JSON: queda el texto */
  }
  if (!res.ok) {
    throw new Error(`${api.name} respondió ${res.status}: ${text.slice(0, 160)}`);
  }
  if (api.metricPath.trim() && value === null) {
    throw new Error(
      `La respuesta llegó (${res.status}) pero no encontré un número en "${api.metricPath.trim()}". Mirá la vista previa y ajustá la ruta.`,
    );
  }
  return { status: res.status, preview, value };
}
