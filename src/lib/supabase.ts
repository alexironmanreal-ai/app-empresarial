import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const cloudUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

/**
 * En desarrollo (Vite) las llamadas van a /api/supabase y el proxy de Vite
 * las reenvía a Supabase → misma origen que localhost, sin CORS del navegador.
 * En build/producción se usa la URL real de Supabase.
 */
function resolveSupabaseUrl(): string {
  if (!cloudUrl) return "";
  if (import.meta.env.DEV) {
    return "/api/supabase";
  }
  return cloudUrl.replace(/\/$/, "");
}

const url = resolveSupabaseUrl();

/** true si hay URL + anon key configuradas */
export const isSupabaseConfigured = Boolean(cloudUrl && anon);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof localStorage !== "undefined" ? localStorage : undefined,
        // En proxy local, el flujo es same-origin
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
