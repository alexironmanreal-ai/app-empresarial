import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const cloudUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

/**
 * En desarrollo (Vite) las llamadas van a http://localhost:PORT/api/supabase
 * y el proxy las reenvía a Supabase → misma origen, sin CORS.
 * supabase-js exige URL absoluta http(s); no acepta rutas relativas.
 */
function resolveSupabaseUrl(): string {
  if (!cloudUrl) return "";
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/api/supabase`;
  }
  // SSR / build sin window: URL real
  return cloudUrl.replace(/\/$/, "");
}

/** true si hay URL + anon key configuradas */
export const isSupabaseConfigured = Boolean(cloudUrl && anon);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    const url = resolveSupabaseUrl();
    if (!url) return null;
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof localStorage !== "undefined" ? localStorage : undefined,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "sentinel-hq",
        },
      },
    });
  }
  return client;
}
