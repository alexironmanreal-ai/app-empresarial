/**
 * Persistencia del HQ en Supabase (Postgres JSONB).
 * Fuente de verdad en la nube; localStorage queda como caché offline.
 */
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type HqPersistedSlice = Record<string, unknown>;

export async function loadHqFromCloud(
  userId: string,
): Promise<HqPersistedSlice | null> {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) return null;

  const { data, error } = await sb
    .from("hq_state")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[cloud-sync] load error", error.message);
    return null;
  }
  if (!data?.data || typeof data.data !== "object") return null;
  return data.data as HqPersistedSlice;
}

export async function saveHqToCloud(
  userId: string,
  slice: HqPersistedSlice,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) {
    return { ok: false, error: "Supabase no configurado" };
  }

  const { error } = await sb.from("hq_state").upsert(
    {
      user_id: userId,
      data: slice,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.warn("[cloud-sync] save error", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteHqFromCloud(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) return;
  await sb.from("hq_state").delete().eq("user_id", userId);
}
