import type { ExpenseItem, Gap, IncomeStream, OsModule, WealthPoint, YtMilestone } from "./types";

const m = (labels: string[], done: number[], skip: number[]) =>
  labels.map((label, i) => ({ label, done: done[i] ?? 0, skip: skip[i] ?? 0 }));
const months6 = ["M1", "M2", "M3", "M4", "M5", "M6"];

export const GAPS: Gap[] = [
  { id: "g-legal", area: "Persona jurídica", now: "Founder sin sociedad", missing: "SAS inscripta", time: "2–4 semanas", costUsd: 220 },
  { id: "g-tax", area: "Fiscal", now: "Sin factura de empresa", missing: "CUIT + IIBB + FE", time: "1–3 semanas", costUsd: 180 },
  { id: "g-bank", area: "Caja", now: "Plata personal mezclada", missing: "Cuenta SAS + fondo 3 meses", time: "2 sem + ahorro", costUsd: 25 },
  { id: "g-offer", area: "Oferta", now: "Sin precio público", missing: "Rate card + outbound", time: "4 días + ritmo", costUsd: 0 },
  { id: "g-brand", area: "Marca", now: "Nombre solo en la cabeza", missing: "Dominio + INPI", time: "2–10 días", costUsd: 210 },
  { id: "g-yt", area: "YouTube", now: "Sin promesa ni cadencia", missing: "8 videos + kit", time: "8 semanas", costUsd: 280 },
  { id: "g-os", area: "Sentinel OS", now: "Sin hello en QEMU", missing: "Spec + boot + CI", time: "Spec 10d · hello 30d", costUsd: 0 },
  { id: "g-gov", area: "Gobierno CEO", now: "El día lo manda el impulso", missing: "Semana tipo + review", time: "48 horas", costUsd: 0 },
];

export const INCOME: IncomeStream[] = [
  { id: "retainer", name: "Retainer CEO / arquitectura", when: "Desde día 14", price: "ARS 3.500.000–6.300.000/mes", y1: 22000, y5: 72000, y10: 120000, notes: "Ancla de caja" },
  { id: "yt", name: "YouTube + sponsors", when: "Mes 6+", price: "CPM + deals en ARS", y1: 3000, y5: 60000, y10: 200000, notes: "Escala con subs" },
  { id: "product", name: "Producto digital / curso", when: "Mes 4+", price: "ARS 96.600–280.000", y1: 4000, y5: 40000, y10: 120000, notes: "Sin vender horas" },
  { id: "os-lic", name: "Licencias OS", when: "Año 2+", price: "ARS 28.000–280.000/mes", y1: 0, y5: 80000, y10: 500000, notes: "Cuando haya usuarios" },
];

export const EXPENSES: ExpenseItem[] = [
  { id: "e1", name: "SAS + trámites", kind: "once", usd: 220, neededFor: "Empresa", notes: "IGJ" },
  { id: "e2", name: "Contador", kind: "month", usd: 80, neededFor: "Fiscal", notes: "Mensual" },
  { id: "e3", name: "Dominio + mail", kind: "year", usd: 120, neededFor: "Marca", notes: "Workspace" },
  { id: "e4", name: "Marca INPI", kind: "once", usd: 300, neededFor: "IP", notes: "Tasas" },
  { id: "e5", name: "Kit YouTube", kind: "once", usd: 200, neededFor: "Canal", notes: "Mic + luz" },
];

export const WEALTH: WealthPoint[] = [
  { year: 0, conservative: 0, base: 0, optimistic: 0 },
  { year: 1, conservative: 8000, base: 25000, optimistic: 50000 },
  { year: 2, conservative: 25000, base: 80000, optimistic: 200000 },
  { year: 3, conservative: 50000, base: 160000, optimistic: 420000 },
  { year: 5, conservative: 120000, base: 420000, optimistic: 1300000 },
  { year: 10, conservative: 400000, base: 1600000, optimistic: 5500000 },
];

export const WEALTH_NOTES = {
  conservative: "Solo consultoría local, canal chico.",
  base: "Retainer + YouTube + producto digital.",
  optimistic: "OS con tracción, sponsors y SaaS.",
};

export const YT_MILESTONES: YtMilestone[] = [
  { month: 1, subs: 100, viewsMonth: 2000, revenue: 0, focus: "Primeros videos + spec" },
  { month: 3, subs: 500, viewsMonth: 8000, revenue: 50, focus: "Cadencia semanal" },
  { month: 6, subs: 2000, viewsMonth: 25000, revenue: 300, focus: "Series + clips" },
  { month: 12, subs: 10000, viewsMonth: 90000, revenue: 2000, focus: "Sponsors" },
];

export const YT_PILLARS = [
  { id: "build", title: "Build in public", desc: "Construir el OS en vivo" },
  { id: "ceo", title: "Oficio de CEO", desc: "Decisiones, plata, equipo" },
  { id: "deep", title: "Deep dives", desc: "Kernel, diseño, tradeoffs" },
];

export const YT_TITLES = [
  "Por qué estoy construyendo un OS desde cero",
  "Día 1: el spec del sistema operativo",
  "Cómo constituí la SAS en 21 días",
  "La primera factura de la empresa",
  "Hello world en QEMU: el OS existe",
  "Cuánto cuesta no tener tarifa pública",
];

export const OS_MODULES: OsModule[] = [
  { id: "boot", name: "Boot + kernel mínimo", layer: "Core", months: 3, depends: "Spec", deliverable: "Hello en QEMU", chart: m(months6, [1, 3, 6, 8, 10, 12], [0, 0, 0, 0, 0, 0]) },
  { id: "mm", name: "Memory + scheduler", layer: "Core", months: 4, depends: "Boot", deliverable: "Procesos básicos", chart: m(months6, [0, 1, 3, 5, 8, 10], [0, 0, 0, 0, 0, 0]) },
  { id: "fs", name: "Filesystem + red", layer: "Core", months: 5, depends: "MM", deliverable: "Read/write + net", chart: m(months6, [0, 0, 1, 3, 6, 9], [0, 0, 0, 0, 0, 0]) },
  { id: "shell", name: "Shell + userspace", layer: "UX", months: 3, depends: "FS", deliverable: "Prompt usable", chart: m(months6, [0, 0, 0, 2, 5, 8], [0, 0, 0, 0, 0, 0]) },
];

export const OS_PHASES = [
  { phase: "0", name: "Spec + tooling", months: "0–1" },
  { phase: "1", name: "Bootable kernel", months: "1–4" },
  { phase: "2", name: "Userspace mínimo", months: "4–10" },
  { phase: "3", name: "ISO + apps", months: "10–18" },
];

export const RATE_CARD = [
  { name: "Mentoría founder", price: "ARS 1.260.000", desc: "4 semanas · 4 llamadas · oferta y calendario" },
  { name: "Sprint diagnóstico", price: "ARS 4.900.000", desc: "5 días · plan de 90 días" },
  { name: "Retainer LATAM", price: "ARS 3.500.000/mes", desc: "8 h · decisiones + review" },
  { name: "Retainer US-EU", price: "ARS 6.300.000/mes", desc: "8 h · en inglés" },
  { name: "Integración YouTube", price: "ARS 560.000/video", desc: "60–90 s nativos" },
  { name: "Kit founder", price: "ARS 96.600", desc: "Templates spec + rate card + checklist" },
];

export const CEO_CADENCE = [
  { day: "Lunes", hours: "09:00–10:30", name: "Gobierno", detail: "Caja, pipeline, P0, riesgos del OS" },
  { day: "Mar–Jue", hours: "09:00–13:00", name: "Maker · OS", detail: "Kernel, spec, CI. Teléfono afuera" },
  { day: "Mar–Jue", hours: "16:00–17:00", name: "Marca", detail: "Grabar, editar o clips" },
  { day: "Viernes", hours: "09:00–11:00", name: "Venta", detail: "10 conversaciones. Cerrar o agendar" },
  { day: "Viernes", hours: "11:00–13:00", name: "Un video", detail: "Grabar el largo de la semana" },
  { day: "Viernes", hours: "16:00–17:00", name: "Review", detail: "¿P0? ¿Caja? ¿OS? Briefing del lunes" },
];
