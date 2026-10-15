/** Fabricador de CV — preguntas básicas + datos del perfil profesional */

export type CvData = {
  /** Vocaciones / qué te mueve */
  vocaciones: string;
  /** Intereses personales y profesionales */
  intereses: string;
  /** A qué aspirás (1–5 años) */
  aspiraciones: string;
  /** Resumen profesional (elevator pitch) */
  summary: string;
  /** Experiencia laboral (texto libre o bullet points) */
  experience: string;
  /** Educación / certificaciones */
  education: string;
  /** Skills técnicas */
  skillsTech: string;
  /** Skills blandas */
  skillsSoft: string;
  /** Idiomas */
  languages: string;
  /** Logros y proyectos destacados */
  achievements: string;
  /** Email de contacto */
  email: string;
  /** Teléfono */
  phone: string;
  /** LinkedIn / web */
  linkedin: string;
  /** Ciudad / país */
  location: string;
  /** Título profesional deseado en el CV */
  headline: string;
  /** Disponibilidad (full-time, freelance, etc.) */
  availability: string;
  /** Cuestionario completado */
  completed: boolean;
};

export const DEFAULT_CV: CvData = {
  vocaciones: "",
  intereses: "",
  aspiraciones: "",
  summary: "",
  experience: "",
  education: "",
  skillsTech: "",
  skillsSoft: "",
  languages: "",
  achievements: "",
  email: "",
  phone: "",
  linkedin: "",
  location: "",
  headline: "",
  availability: "",
  completed: false,
};

/** Pasos del cuestionario post-login (preguntas básicas) */
export type CvQuestion = {
  id: keyof CvData;
  title: string;
  hint: string;
  placeholder: string;
  rows?: number;
};

export const CV_QUESTIONS: CvQuestion[] = [
  {
    id: "vocaciones",
    title: "¿Cuáles son tus vocaciones?",
    hint: "Lo que harías aunque nadie te pague. El hilo conductor de tu carrera.",
    placeholder: "Ej: construir sistemas, enseñar en público, diseñar productos…",
    rows: 3,
  },
  {
    id: "intereses",
    title: "¿Cuáles son tus intereses?",
    hint: "Temas, industrias y hobbies que alimentan tu trabajo.",
    placeholder: "Ej: OS, startups, IA, hardware, escritura técnica…",
    rows: 3,
  },
  {
    id: "aspiraciones",
    title: "¿A qué aspirás?",
    hint: "Objetivo a 1–5 años. Claro y medible si podés.",
    placeholder: "Ej: fundar una SAS rentable, lanzar un OS usable, vivir de productos…",
    rows: 3,
  },
  {
    id: "headline",
    title: "Título profesional",
    hint: "La línea bajo tu nombre en el CV / LinkedIn.",
    placeholder: "Ej: Founder · Systems builder · OS in public",
    rows: 1,
  },
  {
    id: "summary",
    title: "Resumen profesional",
    hint: "3–5 líneas. Quién sos, qué hacés y por qué importa.",
    placeholder: "Ej: Founder construyendo un sistema operativo en público…",
    rows: 4,
  },
  {
    id: "experience",
    title: "Experiencia laboral",
    hint: "Roles, empresas, fechas y logros. Un bloque por rol.",
    placeholder:
      "2024–hoy · Founder, Sentinel\n• Construí X\n• Logré Y\n\n2022–2024 · Rol, Empresa\n• …",
    rows: 6,
  },
  {
    id: "education",
    title: "Educación y certificaciones",
    hint: "Títulos, cursos relevantes, bootcamps.",
    placeholder: "Universidad / curso · Año\nCertificación · Emisor",
    rows: 4,
  },
  {
    id: "skillsTech",
    title: "Skills técnicas",
    hint: "Lenguajes, tools, stacks. Separá por comas o líneas.",
    placeholder: "TypeScript, React, Rust, Linux, Electron, Git…",
    rows: 3,
  },
  {
    id: "skillsSoft",
    title: "Skills blandas",
    hint: "Cómo trabajás con gente y con la incertidumbre.",
    placeholder: "Liderazgo, priorización, escritura clara, venta consultiva…",
    rows: 2,
  },
  {
    id: "languages",
    title: "Idiomas",
    hint: "Nivel real (A2–C2 o nativo / profesional / conversacional).",
    placeholder: "Español (nativo), Inglés (B2 / profesional)…",
    rows: 2,
  },
  {
    id: "achievements",
    title: "Logros y proyectos",
    hint: "Números cuando se pueda. Lo que diferencia tu CV.",
    placeholder: "• Lanzé X con Y usuarios\n• Reduje Z un 40%\n• Open source con N stars",
    rows: 5,
  },
  {
    id: "email",
    title: "Email de contacto",
    hint: "El que querés en el CV (no hace falta que sea el del login).",
    placeholder: "vos@empresa.com",
    rows: 1,
  },
  {
    id: "phone",
    title: "Teléfono",
    hint: "Con código de país.",
    placeholder: "+54 9 11 …",
    rows: 1,
  },
  {
    id: "linkedin",
    title: "LinkedIn / web / X",
    hint: "Links que respalden el CV.",
    placeholder: "linkedin.com/in/… · github.com/… · tu-site.com",
    rows: 1,
  },
  {
    id: "location",
    title: "Ubicación",
    hint: "Ciudad y país. Si sos remote, decilo.",
    placeholder: "Buenos Aires, AR · Remote OK",
    rows: 1,
  },
  {
    id: "availability",
    title: "Disponibilidad",
    hint: "Full-time, part-time, freelance, open to roles…",
    placeholder: "Full-time founder · abierto a partnerships",
    rows: 1,
  },
];

/** Genera un resumen borrador a partir de vocaciones/intereses/aspiraciones */
export function draftSummary(cv: CvData, founder: string, company: string): string {
  const bits: string[] = [];
  if (cv.headline) bits.push(cv.headline);
  if (cv.vocaciones) bits.push(`Movido por: ${cv.vocaciones.trim()}.`);
  if (cv.aspiraciones) bits.push(`Apunta a: ${cv.aspiraciones.trim()}.`);
  if (cv.intereses) bits.push(`Intereses: ${cv.intereses.trim()}.`);
  if (bits.length === 0) {
    return `${founder} · ${company}. Completá las preguntas básicas para generar el resumen.`;
  }
  return bits.join(" ");
}
