/**
 * Ingresos mensuales desde pipeline (leads).
 * Cobrado / perdido por mes calendario; el mes actual sigue abriendo hasta que cierra.
 */

export type LeadLike = {
  amountArs?: number;
  stage: string;
  updatedAt?: string;
  createdAt?: string;
  name?: string;
  offer?: string;
  lostReason?: string;
  winReason?: string;
};

export type MonthlyDeal = {
  name: string;
  offer: string;
  amountArs: number;
  reason: string;
  stage: "cobrado" | "perdido";
};

export type MonthBucket = {
  key: string;
  label: string;
  year: number;
  month: number;
  cobradoArs: number;
  perdidoArs: number;
  cobradoCount: number;
  perdidoCount: number;
  deals: MonthlyDeal[];
  open: boolean;
};

export type MonthlyIncomeSnapshot = {
  months: MonthBucket[];
  totalCobrado12: number;
  totalPerdido12: number;
  current: MonthBucket | null;
};

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function labelFromKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
}

function last12Keys(now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function leadMonth(l: LeadLike): string | null {
  const raw = l.updatedAt || l.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return monthKey(d);
}

export function computeMonthlyIncome(
  leads: LeadLike[] | null | undefined,
  now = new Date(),
): MonthlyIncomeSnapshot {
  const keys = last12Keys(now);
  const currentKey = monthKey(now);
  const map = new Map<string, MonthBucket>();

  for (const key of keys) {
    const [y, m] = key.split("-").map(Number);
    map.set(key, {
      key,
      label: labelFromKey(key),
      year: y,
      month: m,
      cobradoArs: 0,
      perdidoArs: 0,
      cobradoCount: 0,
      perdidoCount: 0,
      deals: [],
      open: key === currentKey,
    });
  }

  for (const l of leads ?? []) {
    if (l.stage !== "cobrado" && l.stage !== "perdido") continue;
    const key = leadMonth(l);
    if (!key || !map.has(key)) continue;
    const b = map.get(key)!;
    const amount = Number(l.amountArs) || 0;
    if (l.stage === "cobrado") {
      b.cobradoArs += amount;
      b.cobradoCount += 1;
      b.deals.push({
        name: l.name || "\u2014",
        offer: l.offer || "",
        amountArs: amount,
        reason:
          l.winReason ||
          `Pipeline \u00b7 ${l.offer || "oferta"} \u00b7 ${l.name || ""}`.trim(),
        stage: "cobrado",
      });
    } else {
      b.perdidoArs += amount;
      b.perdidoCount += 1;
      b.deals.push({
        name: l.name || "\u2014",
        offer: l.offer || "",
        amountArs: amount,
        reason: (l.lostReason || "").trim() || "Sin motivo (completar)",
        stage: "perdido",
      });
    }
  }

  const months = keys.map((k) => map.get(k)!);
  const totalCobrado12 = months.reduce((a, m) => a + m.cobradoArs, 0);
  const totalPerdido12 = months.reduce((a, m) => a + m.perdidoArs, 0);
  const current = months.find((m) => m.open) ?? null;

  return { months, totalCobrado12, totalPerdido12, current };
}
