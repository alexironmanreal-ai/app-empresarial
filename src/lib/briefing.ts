import { TASKS } from "./data";
import { isTaskComplete, type Profile } from "./store";

export function briefing(profile: Profile, done: Record<string, boolean>) {
  const open = TASKS.filter(
    (t) => !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  );
  const p0 = open.filter((t) => t.priority === "p0");
  const first = p0[0] ?? open[0];
  const name = profile.founder === "Founder" ? "Founder" : profile.founder;

  if (!first) {
    return {
      kicker: "Cerrado el tablero",
      title: `${name}, la empresa ya no es un proyecto.`,
      body: `Marcáste lo que había que marcar. El trabajo ahora es ritmo: ${profile.os} cada mañana, venta los viernes, el canal ${profile.youtube} sin semanas vacías. Un CEO no celebra el checklist — opera el sistema.`,
      focus: "Mantener cadencia",
    };
  }

  if (p0.length >= 6) {
    return {
      kicker: "Diagnóstico",
      title: `${name}: todavía no hay empresa. Hay un founder con un OS en la cabeza.`,
      body: `Falta persona jurídica, factura, tarifa y un spec público de ${profile.os}. Eso no es un plan de 18 meses. Es un sprint de 21 días. Hoy no se toca una línea de kernel hasta que exista una SAS, un precio y una página. El canal ${profile.youtube} nace el mismo día que el spec — no después.`,
      focus: first.title,
    };
  }

  if (p0.length > 0) {
    return {
      kicker: `${p0.length} P0 abiertos`,
      title: `Hoy se cierra: ${first.title}.`,
      body: first.why,
      focus: first.title,
    };
  }

  return {
    kicker: "P0 cerrado",
    title: `La empresa existe. Ahora se alimenta.`,
    body: `Lo urgente ya no es legal. Es caja y producto. Siguiente: ${first.title}. ${first.why}`,
    focus: first.title,
  };
}
