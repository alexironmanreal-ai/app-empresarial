/** Cliente Mercado Pago vía proxy Vite (/api/mp → api.mercadopago.com) */

export type MpBalance = {
  userId: number;
  totalArs: number;
  availableArs: number;
  unavailableArs: number;
  currency: string;
  fetchedAt: string;
};

type MpUser = { id: number; nickname?: string; email?: string };

async function mpFetch(path: string, token: string) {
  const res = await fetch(`/api/mp${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 401
        ? "Token inválido o expirado. Revisá el Access Token en Ajustes."
        : `Mercado Pago ${res.status}: ${text.slice(0, 180)}`,
    );
  }
  return res.json();
}

export async function fetchMercadoPagoBalance(token: string): Promise<MpBalance> {
  const user = (await mpFetch("/users/me", token)) as MpUser;
  if (!user?.id) throw new Error("No se pudo leer el usuario de Mercado Pago.");

  // Balance de cuenta MP (ARS en Argentina)
  const bal = await mpFetch(`/users/${user.id}/mercadopago_account/balance`, token);

  const total = Number(bal.total_amount ?? bal.available_balance ?? 0);
  const available = Number(bal.available_balance ?? bal.total_amount ?? 0);
  const unavailable = Number(bal.unavailable_balance ?? Math.max(0, total - available));

  return {
    userId: user.id,
    totalArs: total,
    availableArs: available,
    unavailableArs: unavailable,
    currency: String(bal.currency_id ?? "ARS"),
    fetchedAt: new Date().toISOString(),
  };
}
