import { TASKS } from "./data";
import { isTaskComplete, type Profile } from "./store";
import type { RealitySnapshot } from "./reality";
import { runwayLabel } from "./reality";

export function briefing(
  profile: Profile,
  done: Record<string, boolean>,
  reality?: RealitySnapshot,
) {
  const open = TASKS.filter(
    (t) => !isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  );
  const p0 = open.filter((t) => t.priority === "p0");
  const first = p0[0] ?? open[0];
  const name = profile.founder === "Founder" ? "Founder" : profile.founder;

  // —— Realidad primero ——
  if (reality) {
    const { runwayDays: rd, p0Open, reviewOverdue, daysSinceReview, totalCajaArs } =
      reality;

    if (totalCajaArs <= 0 && p0Open > 0) {
      return {
        kicker: "Sin caja",
        title: `${name}: no hay empresa sin plata en la cuenta.`,
        body: `Caja en cero. Runway: ${runwayLabel(rd)}. Los P0 (${p0Open}) y el OS pueden esperar. Hoy el trabajo es generar o transferir plata a la cuenta de la empresa. Sin eso el resto es teatro.`,
        focus: first?.title ?? "Caja",
      };
    }

    if (rd < 30 && Number.isFinite(rd)) {
      return {
        kicker: "Runway crítico",
        title: `${name}: quedan ${rd} días de caja.`,
        body: `Menos de un mes. Todo lo que no cierre caja o baje burn esta semana es ruido. P0 abiertos: ${p0Open}. ${first ? `Prioridad absoluta: ${first.title}.` : "Cerrá el loop de ingresos."}`,
        focus: first?.title ?? "Supervivencia",
      };
    }

    if (reviewOverdue) {
      const lag =
        daysSinceReview === null
          ? "nunca hiciste una review"
          : `llevás ${daysSinceReview} días sin review`;
      return {
        kicker: "Review vencida",
        title: `${name}: ${lag}.`,
        body: `Un CEO que no revisa el sistema opera a ciegas. Cerrá la review de la semana (botón en HQ), mirá P0, caja y cadencia. Después seguís construyendo. ${first ? `Cuando termines: ${first.title}.` : ""}`,
        focus: "Cerrar review semanal",
      };
    }
  }

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
