/** Plan semanal fijo del tracker 365 — horarios reales SIF / YouTube / ensayos */

export type Activity = {
  id: string;
  title: string;
  /** Rango horario legible, ej. "14:00–15:30" */
  time?: string;
  hours?: number;
};

export type DayPlan = {
  theme: string;
  objective: string;
  activities: Activity[];
};

function h(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

function slot(
  id: string,
  start: string,
  end: string,
  title: string,
): Activity {
  return {
    id,
    time: `${start}–${end}`,
    title,
    hours: Math.round(h(start, end) * 100) / 100,
  };
}

/** 0=dom … 6=sáb (Date.getDay()) */
const PLANS: Record<number, DayPlan> = {
  /** Domingo — ensayos, culto y preparación semanal */
  0: {
    theme: "Ensayos · culto · prep. semanal",
    objective:
      "Cumplir ensayos y culto; cerrar el día con prioridades del lunes listas.",
    activities: [
      slot("dom-higiene", "07:00", "07:30", "Levantarte e higiene personal"),
      slot("dom-desayuno", "07:30", "08:00", "Desayuno y preparación"),
      slot("dom-ensayo-am", "08:00", "10:00", "🎵 Ensayo de la mañana"),
      slot("dom-regreso-am", "10:00", "10:30", "Regreso y descanso"),
      slot("dom-libre", "10:30", "11:30", "Tiempo libre o actividad personal"),
      slot("dom-quehaceres", "11:30", "12:30", "Quehaceres domésticos ligeros"),
      slot("dom-almuerzo", "12:30", "13:30", "Almuerzo"),
      slot("dom-descanso", "13:30", "14:30", "Descanso"),
      slot("dom-prep-ensayo", "14:30", "15:00", "Prepararte para el ensayo"),
      slot("dom-ensayo-pm", "15:00", "18:00", "🎵 Ensayo de la tarde"),
      slot("dom-merienda", "18:00", "19:00", "Merienda, traslado y preparación"),
      slot("dom-culto", "19:00", "21:00", "🙏 Culto"),
      slot("dom-cena", "21:00", "21:30", "Cena"),
      slot(
        "dom-prep-lunes",
        "21:30",
        "21:45",
        "Preparar materiales y revisar prioridades del lunes",
      ),
      {
        id: "dom-desconexion",
        time: "21:45+",
        title: "Desconexión y preparación para dormir",
        hours: 0.5,
      },
    ],
  },

  /** Lunes — SIF: ingeniería y desarrollo */
  1: {
    theme: "SIF · ingeniería y desarrollo 💻",
    objective:
      "Avanzar en SentinelOS con un objetivo técnico concreto; no saltar de proyecto cada 20 min.",
    activities: [
      slot("lun-almuerzo", "13:00", "13:30", "Almuerzo y descanso"),
      slot("lun-escritorio", "13:30", "13:45", "Ordenar el escritorio y preparar el espacio"),
      slot(
        "lun-prioridades",
        "13:45",
        "14:00",
        "Revisar prioridades SIF y definir el objetivo técnico del día",
      ),
      slot(
        "lun-dev-1",
        "14:00",
        "15:30",
        "Desarrollo SentinelOS: código, correcciones o features",
      ),
      slot("lun-break-1", "15:30", "15:45", "Descanso"),
      slot("lun-dev-2", "15:45", "16:45", "Continuar desarrollo y pruebas"),
      slot("lun-merienda", "16:45", "17:15", "Merienda y descanso"),
      slot("lun-estudio-1", "17:15", "18:00", "Estudiar o completar tareas escolares"),
      slot("lun-estudio-2", "18:00", "18:45", "Segundo bloque de estudio"),
      slot(
        "lun-quehaceres",
        "18:45",
        "19:15",
        "Quehaceres domésticos y ordenar la habitación",
      ),
      slot(
        "lun-mensajes",
        "19:15",
        "19:45",
        "Revisar mensajes importantes de SIF y responder pendientes",
      ),
      slot(
        "lun-doc",
        "19:45",
        "20:00",
        "Documentar avances y registrar el próximo paso técnico",
      ),
      {
        id: "lun-cierre",
        time: "20:00+",
        title: "Cena, tiempo personal y prep. del día siguiente",
        hours: 1,
      },
    ],
  },

  /** Martes — YouTube: producción de contenido */
  2: {
    theme: "YouTube · producción 🎬",
    objective:
      "Transformar una idea en contenido terminable. Cerrar el guion y avanzar a grabación.",
    activities: [
      slot("mar-almuerzo", "13:00", "13:30", "Almuerzo y descanso"),
      slot("mar-escritorio", "13:30", "13:45", "Ordenar el espacio de trabajo"),
      slot(
        "mar-prioridades",
        "13:45",
        "14:00",
        "Elegir el vídeo prioritario y definir el resultado del día",
      ),
      slot("mar-guion", "14:00", "15:00", "Investigación y elaboración del guion"),
      slot("mar-break-1", "15:00", "15:15", "Descanso"),
      slot("mar-guion-final", "15:15", "16:00", "Revisar el guion y dejar versión definitiva"),
      slot("mar-merienda", "16:00", "16:30", "Merienda"),
      slot(
        "mar-grabar",
        "16:30",
        "17:30",
        "Grabar el vídeo o preparar materiales necesarios",
      ),
      slot("mar-edicion", "17:30", "18:15", "Edición del contenido"),
      slot("mar-break-2", "18:15", "18:30", "Descanso"),
      slot(
        "mar-meta",
        "18:30",
        "19:00",
        "Preparar título, descripción y miniatura",
      ),
      slot("mar-estudio", "19:00", "19:30", "Estudiar y completar tareas escolares"),
      slot("mar-quehaceres", "19:30", "20:00", "Quehaceres domésticos"),
      {
        id: "mar-cierre",
        time: "20:00+",
        title: "Cena y tiempo personal",
        hours: 1,
      },
    ],
  },

  /** Miércoles — SIF: dirección y coordinación (+ edu física) */
  3: {
    theme: "SIF · dirección y coordinación 🏢",
    objective:
      "Trabajar como CEO: prioridades, equipo y decisiones. Edu física 17:00–18:00.",
    activities: [
      slot("mie-almuerzo", "13:00", "13:30", "Almuerzo y descanso"),
      slot("mie-escritorio", "13:30", "13:45", "Ordenar el espacio de trabajo"),
      slot(
        "mie-prioridades",
        "13:45",
        "14:15",
        "Revisar prioridades y estado general de SIF",
      ),
      slot(
        "mie-docs",
        "14:15",
        "15:00",
        "Documentación empresarial, áreas y responsabilidades",
      ),
      slot("mie-break", "15:00", "15:15", "Descanso"),
      slot(
        "mie-coord",
        "15:15",
        "16:00",
        "Revisar mensajes, coordinar pendientes y preparar decisiones",
      ),
      slot(
        "mie-merienda",
        "16:00",
        "16:30",
        "Merienda y preparación para educación física",
      ),
      slot("mie-traslado", "16:30", "17:00", "Traslado o preparación"),
      slot("mie-edufis", "17:00", "18:00", "EDUCACIÓN FÍSICA"),
      slot("mie-regreso", "18:00", "18:30", "Regreso, higiene y descanso"),
      slot("mie-estudio", "18:30", "19:15", "Estudio y tareas escolares"),
      slot("mie-quehaceres", "19:15", "19:45", "Quehaceres domésticos"),
      slot(
        "mie-registro",
        "19:45",
        "20:00",
        "Registrar decisiones y prioridades del jueves",
      ),
      {
        id: "mie-cierre",
        time: "20:00+",
        title: "Cena y tiempo personal",
        hours: 1,
      },
    ],
  },

  /** Jueves — YouTube: crecimiento y publicación */
  4: {
    theme: "YouTube · crecimiento y publicación 📈",
    objective:
      "Terminar el contenido del martes y publicarlo o dejarlo programado. Producir > acumular ideas.",
    activities: [
      slot("jue-almuerzo", "13:00", "13:30", "Almuerzo y descanso"),
      slot("jue-escritorio", "13:30", "13:45", "Ordenar el espacio de trabajo"),
      slot(
        "jue-pendiente",
        "13:45",
        "14:00",
        "Revisar el contenido pendiente del martes",
      ),
      slot("jue-grabar", "14:00", "15:00", "Grabar o continuar la edición"),
      slot("jue-break", "15:00", "15:15", "Descanso"),
      slot(
        "jue-edicion",
        "15:15",
        "16:15",
        "Terminar la edición y revisar el resultado",
      ),
      slot("jue-merienda", "16:15", "16:45", "Merienda"),
      slot(
        "jue-meta",
        "16:45",
        "17:30",
        "Miniatura, título y descripción",
      ),
      slot(
        "jue-publish",
        "17:30",
        "18:00",
        "Publicar el vídeo o dejarlo programado",
      ),
      slot(
        "jue-ideas",
        "18:00",
        "18:30",
        "Analizar ideas para próximos contenidos",
      ),
      slot("jue-estudio", "18:30", "19:15", "Estudiar y completar tareas escolares"),
      slot("jue-quehaceres", "19:15", "19:45", "Quehaceres domésticos"),
      slot(
        "jue-registro",
        "19:45",
        "20:00",
        "Registrar contenido terminado y tareas pendientes",
      ),
      {
        id: "jue-cierre",
        time: "20:00+",
        title: "Cena y tiempo personal",
        hours: 1,
      },
    ],
  },

  /** Viernes — SIF: estrategia y revisión semanal (+ edu física) */
  5: {
    theme: "SIF · estrategia y revisión 🎯",
    objective:
      "Evaluar progreso de SIF, planificar la próxima semana y un bloque técnico acotado. Edu física 17:00–18:00.",
    activities: [
      slot("vie-almuerzo", "13:00", "13:30", "Almuerzo y descanso"),
      slot("vie-escritorio", "13:30", "13:45", "Ordenar tu espacio"),
      slot(
        "vie-avances",
        "13:45",
        "14:15",
        "Revisar los avances de SentinelOS",
      ),
      slot(
        "vie-tech",
        "14:15",
        "15:15",
        "Bloque técnico: resolver un problema o completar una tarea pendiente",
      ),
      slot("vie-break", "15:15", "15:30", "Descanso"),
      slot(
        "vie-review",
        "15:30",
        "16:00",
        "Revisar objetivos empresariales y resultados de la semana",
      ),
      slot(
        "vie-merienda",
        "16:00",
        "16:30",
        "Merienda y preparación para educación física",
      ),
      slot("vie-traslado", "16:30", "17:00", "Traslado o preparación"),
      slot("vie-edufis", "17:00", "18:00", "EDUCACIÓN FÍSICA"),
      slot("vie-regreso", "18:00", "18:30", "Regreso, higiene y descanso"),
      slot(
        "vie-estudio",
        "18:30",
        "19:00",
        "Revisar las tareas escolares pendientes",
      ),
      slot("vie-quehaceres", "19:00", "19:30", "Quehaceres domésticos"),
      slot(
        "vie-plan",
        "19:30",
        "19:50",
        "Planificar objetivos de SIF para la próxima semana",
      ),
      slot(
        "vie-cierre-reg",
        "19:50",
        "20:00",
        "Cerrar registros y ordenar el espacio",
      ),
      {
        id: "vie-cierre",
        time: "20:00+",
        title: "Cena y tiempo personal",
        hours: 1,
      },
    ],
  },

  /** Sábado — ensayos y organización personal */
  6: {
    theme: "Ensayos y organización personal",
    objective:
      "Cumplir compromisos musicales y personales sin sobrecargar el día con trabajo empresarial.",
    activities: [
      slot("sab-higiene", "07:00", "07:30", "Levantarte, higiene y prepararte"),
      slot("sab-desayuno", "07:30", "08:00", "Desayuno y traslado o preparación"),
      slot("sab-ensayo-am", "08:00", "10:00", "🎵 Ensayo de la mañana"),
      slot("sab-regreso-am", "10:00", "10:30", "Regreso y descanso"),
      slot(
        "sab-ordenar",
        "10:30",
        "11:00",
        "Ordenar tu habitación y realizar quehaceres",
      ),
      slot(
        "sab-libre",
        "11:00",
        "12:00",
        "Tiempo libre o tareas personales / escolares urgentes",
      ),
      slot("sab-almuerzo", "12:00", "13:00", "Almuerzo"),
      slot("sab-descanso", "13:00", "14:00", "Descanso"),
      slot(
        "sab-prep-ensayo",
        "14:00",
        "14:30",
        "Prepararte para el ensayo de la tarde",
      ),
      slot("sab-traslado", "14:30", "15:00", "Traslado o tiempo previo"),
      slot("sab-ensayo-pm", "15:00", "18:00", "🎵 Ensayo de la tarde"),
      slot(
        "sab-merienda",
        "18:00",
        "19:00",
        "Regreso, merienda y preparación para el culto",
      ),
      slot("sab-culto", "19:00", "21:00", "🙏 Culto"),
      {
        id: "sab-cierre",
        time: "21:00+",
        title: "Cena, descanso y tiempo personal",
        hours: 1,
      },
    ],
  },
};

export function planForWeekday(day: number): DayPlan {
  return PLANS[day] ?? PLANS[1];
}

export function activitiesForWeekday(day: number): Activity[] {
  return planForWeekday(day).activities;
}

export function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfYear(year: number) {
  return new Date(year, 0, 1);
}

export function daysInYear(year: number) {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return leap ? 366 : 365;
}

export function dayIndexInYear(d: Date) {
  const start = startOfYear(d.getFullYear());
  const ms = d.getTime() - start.getTime();
  return Math.floor(ms / 86400000);
}

export function dayProgress(
  key: string,
  log: Record<string, Record<string, boolean>> | undefined,
) {
  const d = parseKey(key);
  const acts = activitiesForWeekday(d.getDay());
  if (acts.length === 0) return 1;
  const done = log?.[key] ?? {};
  const n = acts.filter((a) => done[a.id]).length;
  return n / acts.length;
}

export const WEEKDAY_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
