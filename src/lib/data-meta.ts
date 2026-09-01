import type { ExpenseItem, Gap, IncomeStream, OsModule, WealthPoint, YtMilestone } from "./types";

const m = (labels: string[], done: number[], skip: number[]) =>
  labels.map((label, i) => ({ label, done: done[i] ?? 0, skip: skip[i] ?? 0 }));
const months6 = ["M1", "M2", "M3", "M4", "M5", "M6"];

/**
 * METODOLOGÍA (leer antes de creer cualquier número)
 *
 * 1. Todo el wealth está en USD de poder de compra aproximado ("reales").
 *    Se convierte a ARS solo para mostrar (ARS_PER_USD en format.ts).
 *    NO proyectamos ARS nominal a 10 años: con inflación argentina eso es teatro.
 *
 * 2. Impuestos / carga (orden de magnitud, servicios desde AR):
 *    - Efectivo sobre honorarios si estás en régimen general + IIBB + costos:
 *      ~30–40% entre Ganancias, IIBB, costos bancarios y contingencias.
 *    - Usamos haircut ~35% sobre bruto para hablar de "neto que puede acumularse".
 *    - Monotributo ayuda al principio; al escalar pasás a RI y la carga sube.
 *
 * 3. Acumulación ≠ facturación.
 *    Facturar USD 100k/año no es tener USD 100k en el banco.
 *    Se descuenta: impuestos, gasto de vida, reinversión, meses en cero, clientes que no pagan.
 *
 * 4. Probabilidad.
 *    Conservador: solo laburo local / pocos clientes.
 *    Base: retainer + algo de producto/YT, ejecución disciplinada.
 *    Optimista: producto u OS con tracción real (baja probabilidad).
 *
 * 5. Estos números son techos plausibles si ejecutás, no promesas ni valor de la empresa.
 */

export const GAPS: Gap[] = [
  { id: "g-legal", area: "Persona jurídica", now: "Founder sin sociedad", missing: "SAS inscripta", time: "2–4 semanas", costUsd: 250 },
  { id: "g-tax", area: "Fiscal", now: "Sin factura de empresa", missing: "CUIT + IIBB + FE", time: "1–3 semanas", costUsd: 200 },
  { id: "g-bank", area: "Caja", now: "Plata personal mezclada", missing: "Cuenta SAS + fondo 3 meses", time: "2 sem + ahorro", costUsd: 50 },
  { id: "g-offer", area: "Oferta", now: "Sin precio público", missing: "Rate card + outbound", time: "4 días + ritmo", costUsd: 0 },
  { id: "g-brand", area: "Marca", now: "Nombre solo en la cabeza", missing: "Dominio + INPI", time: "2–10 días", costUsd: 280 },
  { id: "g-yt", area: "YouTube", now: "Sin promesa ni cadencia", missing: "8 videos + kit", time: "8 semanas", costUsd: 350 },
  { id: "g-os", area: "Sentinel OS", now: "Sin hello en QEMU", missing: "Spec + boot + CI", time: "Spec 10d · hello 30d", costUsd: 0 },
  { id: "g-gov", area: "Gobierno CEO", now: "El día lo manda el impulso", missing: "Semana tipo + review", time: "48 horas", costUsd: 0 },
];

/**
 * Ingresos: precios de lista en ARS (bruto aprox. hoy).
 * y1/y5/y10 = aporte neto anualizable en USD reales al patrimonio/caja
 * (ya con ~35% de carga fiscal + realismo de ocupación, no 12/12 meses facturando).
 */
export const INCOME: IncomeStream[] = [
  {
    id: "retainer",
    name: "Retainer / consultoría founder",
    when: "Desde que cerrás el 1º cliente",
    price: "Bruto ARS 1.2M–3.5M/mes · neto ~65% antes de gastos personales",
    y1: 8000,
    y5: 28000,
    y10: 40000,
    notes: "Ancla. Asume 6–9 meses facturados/año, no 12. Impuestos descontados en y*",
  },
  {
    id: "yt",
    name: "YouTube + sponsors",
    when: "Relevante desde ~5–10k subs o nicho muy caliente",
    price: "AdSense + canjes; sponsors en ARS/USD según audiencia",
    y1: 500,
    y5: 8000,
    y10: 25000,
    notes: "Con ~140 subs hoy el Y1 es casi 0. Escala lenta salvo hit",
  },
  {
    id: "product",
    name: "Producto digital / template / curso",
    when: "Mes 4+ si hay audiencia o lista",
    price: "ARS 40k–200k por unidad (bruto)",
    y1: 1500,
    y5: 12000,
    y10: 30000,
    notes: "Sin audiencia es wishful thinking; con lista chica puede pagar un mes de burn",
  },
  {
    id: "os-lic",
    name: "Licencias / soporte OS",
    when: "Solo si hay usuarios reales (año 2–4 en el mejor caso)",
    price: "USD 20–200/mes por usuario o soporte",
    y1: 0,
    y5: 5000,
    y10: 35000,
    notes: "Probabilidad baja. Optimista del wealth asume que esto existe",
  },
];

export const EXPENSES: ExpenseItem[] = [
  { id: "e1", name: "SAS + trámites IGJ", kind: "once", usd: 250, neededFor: "Empresa", notes: "Aranceles + gestor si aplica" },
  { id: "e2", name: "Contador", kind: "month", usd: 100, neededFor: "Fiscal", notes: "Sube si hay RI / exportaciones" },
  { id: "e3", name: "Dominio + mail", kind: "year", usd: 150, neededFor: "Marca", notes: "Workspace / similar" },
  { id: "e4", name: "Marca INPI", kind: "once", usd: 350, neededFor: "IP", notes: "Tasas + clases" },
  { id: "e5", name: "Kit YouTube", kind: "once", usd: 300, neededFor: "Canal", notes: "Mic + luz decentes" },
  { id: "e6", name: "AFIP / IIBB / tasas", kind: "month", usd: 40, neededFor: "Fiscal", notes: "Piso; escala con facturación" },
];

/**
 * Wealth = patrimonio / caja acumulable neta en USD reales (orden de magnitud).
 * No es valuación de startup ni facturación acumulada bruta.
 */
export const WEALTH: WealthPoint[] = [
  { year: 0, conservative: 0, base: 0, optimistic: 0 },
  { year: 1, conservative: 2000, base: 10000, optimistic: 25000 },
  { year: 2, conservative: 6000, base: 28000, optimistic: 70000 },
  { year: 3, conservative: 12000, base: 50000, optimistic: 130000 },
  { year: 5, conservative: 30000, base: 110000, optimistic: 280000 },
  { year: 10, conservative: 80000, base: 280000, optimistic: 750000 },
];

export const WEALTH_NOTES = {
  conservative:
    "Pocos clientes locales, meses en blanco, monotributo/RI chico. Neto post-impuestos y vivir. Sin producto ni YT relevante.",
  base:
    "Retainer irregular pero real + algo de producto/YT. ~35% de carga fiscal ya descontada en el espíritu del número. No asume exit del OS.",
  optimistic:
    "Retainer sólido + producto que vende + YT o OS con tracción. Baja probabilidad. Sigue sin ser '2.2B ARS mágicos': es ~USD 750k reales si todo sale bien.",
};

export const YT_MILESTONES: YtMilestone[] = [
  { month: 1, subs: 150, viewsMonth: 3000, revenue: 0, focus: "Cadencia + nicho claro (ya tenés base)" },
  { month: 3, subs: 500, viewsMonth: 12000, revenue: 20, focus: "1 largo/semana · clips" },
  { month: 6, subs: 2000, viewsMonth: 40000, revenue: 150, focus: "Series · primeros sponsors chicos" },
  { month: 12, subs: 8000, viewsMonth: 120000, revenue: 800, focus: "Sponsors / productos propios" },
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

/**
 * Rate card: precios de lista BRUTOS en ARS (orden 2025–2026).
 * El cliente paga esto; vos no te llevás el 100% (impuestos + tiempo muerto).
 */
export const RATE_CARD = [
  { name: "Call de diagnóstico (60–90 min)", price: "ARS 80.000–150.000", desc: "Una sesión · claridad de oferta o priorización" },
  { name: "Sprint 5 días", price: "ARS 900.000–1.800.000", desc: "Diagnóstico + plan 90 días · 1 entregable escrito" },
  { name: "Retainer LATAM", price: "ARS 1.200.000–2.500.000/mes", desc: "~6–8 h · decisiones + review · bruto" },
  { name: "Retainer internacional", price: "USD 1.500–3.500/mes", desc: "Misma lógica en USD · cobranza afuera" },
  { name: "Integración / contenido YT", price: "ARS 200.000–500.000/video", desc: "Solo si hay fit de marca" },
  { name: "Kit founder (async)", price: "ARS 60.000–120.000", desc: "Templates spec + rate card + checklist" },
];

export const CEO_CADENCE = [
  { day: "Lunes", hours: "09:00–10:30", name: "Gobierno", detail: "Caja, pipeline, P0, riesgos del OS" },
  { day: "Mar–Jue", hours: "09:00–13:00", name: "Maker · OS", detail: "Kernel, spec, CI. Teléfono afuera" },
  { day: "Mar–Jue", hours: "16:00–17:00", name: "Marca", detail: "Grabar, editar o clips" },
  { day: "Viernes", hours: "09:00–11:00", name: "Venta", detail: "10 conversaciones. Cerrar o agendar" },
  { day: "Viernes", hours: "11:00–13:00", name: "Un video", detail: "Grabar el largo de la semana" },
  { day: "Viernes", hours: "16:00–17:00", name: "Review", detail: "¿P0? ¿Caja? ¿OS? Briefing del lunes" },
];
