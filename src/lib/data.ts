import type {
  ExpenseItem,
  Gap,
  IncomeStream,
  OsModule,
  Task,
  WealthPoint,
  YtMilestone,
} from "./types";

const m = (labels: string[], done: number[], skip: number[]) =>
  labels.map((label, i) => ({ label, done: done[i] ?? 0, skip: skip[i] ?? 0 }));

const months6 = ["M1", "M2", "M3", "M4", "M5", "M6"];

export const TASKS: Task[] = [
  {
    id: "sas",
    title: "Constituir la SAS",
    why: "Sin persona jurídica no hay empresa: no podés facturar en serio, abrir cuenta, registrar marca a nombre de la compañía ni levantar un OS con IP limpia.",
    how: [
      "Elegí el nombre (Axion SAS o el que definas) y verificá disponibilidad en IGJ / registro provincial.",
      "Entrá a Trámites a Distancia con Clave Fiscal y buscá «Constitución de SAS».",
      "Usá estatuto modelo si querés velocidad; personalizalo solo si hay más de un socio o IP crítica.",
      "Cargá socios, capital (puede ser bajo), objeto social amplio: software, sistemas operativos, medios, consultoría.",
      "Pagá el arancel, firmá digitalmente y esperá la inscripción (CABA: 1–4 semanas).",
      "Guardá el instrumento constitutivo: lo va a pedir el banco, AFIP y el contador.",
    ],
    priority: "p0",
    category: "legal",
    days: 21,
    costUsd: 220,
    spendNote: "Arancel IGJ + gestor si no lo hacés vos. Estatuto modelo baja el costo.",
    chargeUsd: 0,
    chargeNote: "No cobra. Desbloquea todo lo que sí cobra.",
    impact: 10,
    unlocks: "CUIT societario, banco, contratos, equity, marca a nombre de la empresa.",
    subtasks: [
      { id: "sas-name", title: "Reservar / validar nombre" },
      { id: "sas-statute", title: "Estatuto y objeto social" },
      { id: "sas-tad", title: "Trámite TAD presentado" },
      { id: "sas-inscripta", title: "SAS inscripta y documentación en mano" },
    ],
    chart: m(months6, [0, 2, 6, 10, 14, 18], [0, 0, 0, 0, 1, 1]),
  },
  {
    id: "cuit",
    title: "CUIT de la sociedad y Clave Fiscal 3",
    why: "El CUIT es el DNI de la empresa. Sin él no hay impuestos, factura electrónica ni banco.",
    how: [
      "Con la SAS inscripta, pedí el CUIT en AFIP (web o app).",
      "Activá Clave Fiscal nivel 3 para la sociedad.",
      "Inscribí en monotributo o responsable inscripto según el plan.",
      "Habilitá factura electrónica (CAE/CAEA).",
    ],
    priority: "p0",
    category: "fiscal",
    days: 7,
    costUsd: 0,
    spendNote: "Gratis si lo hacés vos.",
    chargeUsd: 0,
    chargeNote: "Desbloquea facturación.",
    impact: 10,
    unlocks: "Factura, impuestos, banco.",
    subtasks: [
      { id: "cuit-afip", title: "CUIT emitido" },
      { id: "cuit-cf3", title: "Clave Fiscal 3 activa" },
      { id: "cuit-fe", title: "Factura electrónica habilitada" },
    ],
    chart: m(months6, [0, 1, 3, 5, 8, 10], [0, 0, 0, 0, 0, 0]),
  },
  {
    id: "banco",
    title: "Cuenta bancaria a nombre de la SAS",
    why: "Sin cuenta societaria mezclás plata personal y de la empresa. El banco pide SAS + CUIT.",
    how: [
      "Elegí banco (Galicia, Santander, BBVA, Brubank empresas, etc.).",
      "Llevá instrumento de constitución, CUIT y DNI de socios.",
      "Abrí cuenta corriente o caja de ahorro empresarial.",
      "Pedí tarjeta y home banking.",
    ],
    priority: "p0",
    category: "ops",
    days: 14,
    costUsd: 50,
    spendNote: "Algunos bancos tienen costo de mantenimiento.",
    chargeUsd: 0,
    chargeNote: "Necesario para cobrar en serio.",
    impact: 9,
    unlocks: "Cobros, pagos, sueldo, inversores.",
    subtasks: [
      { id: "banco-elegir", title: "Elegir banco" },
      { id: "banco-docs", title: "Documentación presentada" },
      { id: "banco-activa", title: "Cuenta operativa" },
    ],
    chart: m(months6, [0, 0, 2, 5, 8, 12], [0, 0, 0, 0, 1, 1]),
  },
  {
    id: "tarifa",
    title: "Definir y publicar tarifa",
    why: "Sin precio no hay venta. Una página con 3 packs basta.",
    how: [
      "Definí 3 niveles: consultoría / implementación / retainer.",
      "Precios en USD o ARS según mercado.",
      "Publicá en web o Notion + link en bio.",
      "Primer cliente a precio de early adopter.",
    ],
    priority: "p0",
    category: "ingresos",
    days: 3,
    costUsd: 0,
    spendNote: "Solo tiempo.",
    chargeUsd: 1500,
    chargeNote: "Primer pack típico.",
    impact: 9,
    unlocks: "Primer cobro.",
    subtasks: [
      { id: "tarifa-packs", title: "3 packs definidos" },
      { id: "tarifa-publicar", title: "Publicado" },
    ],
    chart: m(months6, [0, 5, 12, 20, 30, 40], [0, 0, 0, 2, 3, 5]),
  },
  {
    id: "spec-os",
    title: "Spec público del OS",
    why: "El OS necesita un documento que diga qué es y qué no. Sin spec no hay contributors ni usuarios.",
    how: [
      "Escribí vision + goals + non-goals en un markdown.",
      "Publicá en GitHub / web.",
      "Linkealo desde el canal de YouTube.",
    ],
    priority: "p0",
    category: "os",
    days: 5,
    costUsd: 0,
    spendNote: "Tiempo de escritura.",
    chargeUsd: 0,
    chargeNote: "Atrae atención y contributors.",
    impact: 8,
    unlocks: "Comunidad y roadmap claro.",
    subtasks: [
      { id: "spec-draft", title: "Borrador listo" },
      { id: "spec-public", title: "Publicado" },
    ],
    chart: m(months6, [0, 1, 3, 6, 10, 14], [0, 0, 0, 0, 1, 1]),
  },
  {
    id: "marca",
    title: "Registrar marca",
    why: "Protegé el nombre antes de que alguien más lo use.",
    how: [
      "Buscá disponibilidad en INPI.",
      "Presentá la solicitud de marca (clases 9, 42, 41 típicas).",
      "Seguí el trámite hasta la concesión.",
    ],
    priority: "p1",
    category: "marca",
    days: 90,
    costUsd: 300,
    spendNote: "Tasas INPI + agente si corresponde.",
    chargeUsd: 0,
    chargeNote: "Protección de IP.",
    impact: 7,
    unlocks: "Marca a nombre de la SAS.",
    subtasks: [
      { id: "marca-busqueda", title: "Búsqueda de disponibilidad" },
      { id: "marca-solicitud", title: "Solicitud presentada" },
    ],
    chart: m(months6, [0, 0, 1, 2, 4, 6], [0, 0, 0, 0, 0, 1]),
  },
  {
    id: "youtube-canal",
    title: "Lanzar canal YouTube",
    why: "El canal documenta el OS y genera audiencia + ingresos.",
    how: [
      "Creá el canal con nombre y branding.",
      "Subí el primer video (spec del OS o 'por qué construyo un OS').",
      "Definí calendario de 1 video/semana.",
    ],
    priority: "p1",
    category: "youtube",
    days: 7,
    costUsd: 100,
    spendNote: "Mic + luz básica si no tenés.",
    chargeUsd: 0,
    chargeNote: "AdSense más adelante.",
    impact: 8,
    unlocks: "Audiencia y prueba social.",
    subtasks: [
      { id: "yt-crear", title: "Canal creado" },
      { id: "yt-primer", title: "Primer video publicado" },
    ],
    chart: m(months6, [0, 2, 5, 10, 18, 30], [0, 0, 0, 1, 2, 3]),
  },
  {
    id: "contador",
    title: "Contratar contador",
    why: "Impuestos, balances y liquidaciones no se improvisan.",
    how: [
      "Pedí 2–3 presupuestos a contadores que manejen SAS.",
      "Elegí uno y firmá el engagement.",
      "Pasale toda la documentación de la SAS.",
    ],
    priority: "p1",
    category: "fiscal",
    days: 14,
    costUsd: 80,
    spendNote: "Mensual típico USD 50–150.",
    chargeUsd: 0,
    chargeNote: "Evita multas y problemas.",
    impact: 7,
    unlocks: "Cumplimiento fiscal.",
    subtasks: [
      { id: "cont-presupuestos", title: "Presupuestos recibidos" },
      { id: "cont-contratado", title: "Contador contratado" },
    ],
    chart: m(months6, [0, 0, 1, 2, 3, 4], [0, 0, 0, 0, 0, 0]),
  },
];

export const GAPS: Gap[] = [
  { id: "g1", area: "Persona jurídica", now: "Founder solo", missing: "SAS inscripta", time: "21 días", costUsd: 220 },
  { id: "g2", area: "Facturación", now: "Sin CUIT societario", missing: "Factura electrónica", time: "7 días", costUsd: 0 },
  { id: "g3", area: "Banco", now: "Cuenta personal", missing: "Cuenta SAS", time: "14 días", costUsd: 50 },
  { id: "g4", area: "Precio", now: "Sin tarifa", missing: "3 packs publicados", time: "3 días", costUsd: 0 },
  { id: "g5", area: "Producto público", now: "OS en la cabeza", missing: "Spec + repo", time: "5 días", costUsd: 0 },
];

export const INCOME: IncomeStream[] = [
  { id: "i1", name: "Consultoría / implementación", when: "Mes 1–3", price: "USD 1.5k–5k", y1: 18000, y5: 120000, y10: 350000, notes: "Early clients + retainer" },
  { id: "i2", name: "YouTube + sponsorships", when: "Mes 6+", price: "CPM + deals", y1: 3000, y5: 60000, y10: 200000, notes: "Escala con suscriptores" },
  { id: "i3", name: "Licencias / SaaS del OS", when: "Año 2+", price: "USD 20–200/mes", y1: 0, y5: 80000, y10: 500000, notes: "Cuando el OS tenga usuarios" },
];

export const EXPENSES: ExpenseItem[] = [
  { id: "e1", name: "SAS + trámites", kind: "once", usd: 220, neededFor: "Empresa", notes: "IGJ + gestor" },
  { id: "e2", name: "Contador", kind: "month", usd: 80, neededFor: "Fiscal", notes: "Mensual" },
  { id: "e3", name: "Hosting / dominios", kind: "year", usd: 120, neededFor: "Web + OS", notes: "Vercel + dominios" },
  { id: "e4", name: "Marca INPI", kind: "once", usd: 300, neededFor: "IP", notes: "Tasas" },
];

export const WEALTH: WealthPoint[] = [
  { year: 0, conservative: 0, base: 0, optimistic: 0 },
  { year: 1, conservative: 8000, base: 20000, optimistic: 45000 },
  { year: 2, conservative: 25000, base: 70000, optimistic: 180000 },
  { year: 3, conservative: 50000, base: 150000, optimistic: 400000 },
  { year: 5, conservative: 120000, base: 400000, optimistic: 1200000 },
  { year: 10, conservative: 400000, base: 1500000, optimistic: 5000000 },
];

export const WEALTH_NOTES = {
  conservative: "Solo consultoría local, YouTube chico.",
  base: "Consultoría + canal en crecimiento + primeras licencias.",
  optimistic: "OS con tracción, sponsorships y SaaS.",
};

export const YT_MILESTONES: YtMilestone[] = [
  { month: 1, subs: 100, viewsMonth: 2000, revenue: 0, focus: "Primeros 4 videos + spec" },
  { month: 3, subs: 500, viewsMonth: 8000, revenue: 50, focus: "Consistencia semanal" },
  { month: 6, subs: 2000, viewsMonth: 25000, revenue: 200, focus: "Series + comunidad" },
  { month: 12, subs: 10000, viewsMonth: 80000, revenue: 1500, focus: "Sponsorships" },
];

export const YT_PILLARS = [
  { id: "build", title: "Build in public", desc: "Construir el OS en vivo" },
  { id: "ceo", title: "Oficio de CEO", desc: "Decisiones, plata, equipo" },
  { id: "deep", title: "Deep dives", desc: "Kernel, drivers, design" },
];

export const YT_TITLES = [
  "Por qué estoy construyendo un OS desde cero",
  "Día 1: el spec del sistema operativo",
  "Cómo constituí la SAS en 21 días",
  "La primera factura de la empresa",
];

export const OS_MODULES: OsModule[] = [
  { id: "boot", name: "Boot + kernel mínimo", layer: "Core", months: 3, depends: "Spec", deliverable: "Hello en QEMU", chart: m(months6, [1, 3, 6, 8, 10, 12], [0, 0, 0, 0, 0, 0]) },
  { id: "fs", name: "Filesystem básico", layer: "Core", months: 4, depends: "Boot", deliverable: "Read/write files", chart: m(months6, [0, 1, 3, 5, 8, 10], [0, 0, 0, 0, 0, 0]) },
  { id: "shell", name: "Shell + userspace", layer: "UX", months: 3, depends: "FS", deliverable: "Prompt usable", chart: m(months6, [0, 0, 1, 3, 6, 9], [0, 0, 0, 0, 0, 0]) },
];

export const OS_PHASES = [
  { phase: "0", name: "Spec + tooling", months: "0–1" },
  { phase: "1", name: "Bootable kernel", months: "1–4" },
  { phase: "2", name: "Userspace mínimo", months: "4–8" },
  { phase: "3", name: "Apps + docs", months: "8–18" },
];

export const RATE_CARD = [
  { name: "Diagnóstico", price: "USD 800", desc: "1 sesión + informe" },
  { name: "Implementación", price: "USD 2.500–5.000", desc: "Proyecto cerrado" },
  { name: "Retainer mensual", price: "USD 1.500", desc: "Disponibilidad + soporte" },
];

export const CEO_CADENCE = [
  { day: "Lunes", hours: "9:00–11:00", name: "Plan de la semana", detail: "P0, caja, contenido" },
  { day: "Martes–Jueves", hours: "9:00–13:00", name: "Deep work OS", detail: "Código o escritura del kernel" },
  { day: "Viernes", hours: "11:00–13:00", name: "Un video", detail: "Grabar o editar" },
  { day: "Viernes", hours: "16:00–17:00", name: "Review", detail: "¿Se movió el P0? Briefing del lunes" },
];

export const WEIGHT: Record<Task["priority"], number> = {
  p0: 4,
  p1: 3,
  p2: 2,
  p3: 1,
};

export function taskById(id: string) {
  return TASKS.find((t) => t.id === id);
}
