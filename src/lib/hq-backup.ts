import { pickHqSlice, useHq, type MonthClosure } from "@/lib/store";
import { computeMonthlyIncome } from "@/lib/monthly-income";
import { toCsv, downloadCsv } from "@/lib/export-csv";

export function downloadHqBackup() {
  const state = useHq.getState();
  const slice = pickHqSlice(state as unknown as Record<string, unknown>);
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    app: "sentinel-hq",
    data: slice,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const day = new Date().toISOString().slice(0, 10);
  a.download = `sentinel-hq-backup-${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function currentMonthKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function exportMonthCsv(monthKey?: string) {
  const leads = useHq.getState().leads ?? [];
  const snap = computeMonthlyIncome(leads);
  const key = monthKey || currentMonthKey();
  const bucket = snap.months.find((m) => m.key === key) ?? snap.current;
  if (!bucket) {
    downloadCsv(`ingresos-${key}.csv`, toCsv(["info"], [["Sin datos"]]));
    return;
  }
  const headers = ["mes", "lead", "oferta", "estado", "monto_ars", "razon"];
  const rows = bucket.deals.map((d) => [
    bucket.key,
    d.name,
    d.offer,
    d.stage,
    d.amountArs,
    d.reason,
  ]);
  rows.push([bucket.key, "TOTAL_COBRADO", "", "cobrado", bucket.cobradoArs, ""]);
  rows.push([bucket.key, "TOTAL_PERDIDO", "", "perdido", bucket.perdidoArs, ""]);
  downloadCsv(`ingresos-${bucket.key}.csv`, toCsv(headers, rows));
}

export function buildMonthClosure(now = new Date()): MonthClosure {
  const leads = useHq.getState().leads ?? [];
  const snap = computeMonthlyIncome(leads, now);
  const key = currentMonthKey(now);
  const bucket = snap.months.find((m) => m.key === key) ?? snap.current;
  return {
    key,
    closedAt: new Date().toISOString(),
    cobradoArs: bucket?.cobradoArs ?? 0,
    perdidoArs: bucket?.perdidoArs ?? 0,
    cobradoCount: bucket?.cobradoCount ?? 0,
    perdidoCount: bucket?.perdidoCount ?? 0,
  };
}

export function isMonthClosed(key: string): boolean {
  const list = useHq.getState().monthClosures ?? [];
  return list.some((m) => m.key === key);
}
