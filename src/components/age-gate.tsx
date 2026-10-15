import { ageFromBirthDate, isAdult } from "@/lib/wealth-engine";
import { useHq } from "@/lib/store";

/** Algunas acciones requieren 18+ o adulto responsable */
export function useAgeGate() {
  const birthDate = useHq((s) => s.profile.birthDate ?? "");
  const age = ageFromBirthDate(birthDate);
  const adult = isAdult(birthDate);
  return {
    birthDate,
    age,
    isAdult: adult,
    /** null = sin fecha cargada */
    known: age !== null,
    canSignLegal: adult,
    canReceivePayments: adult,
    canOutboundSales: adult || age === null,
  };
}

export function AgeBanner({ need }: { need: "legal" | "payments" | "sales" }) {
  const g = useAgeGate();
  if (g.isAdult) return null;
  if (!g.known) {
    return (
      <p className="rounded-lg border border-border bg-elevated/50 px-3 py-2 text-xs text-muted">
        Cargá tu fecha de nacimiento en Ajustes. Algunas acciones legales y de cobro
        requieren 18 años o un adulto responsable.
      </p>
    );
  }
  const labels = {
    legal: "trámites legales / SAS / contratos",
    payments: "cobros y cuentas a nombre de la empresa",
    sales: "cierre de ventas formales",
  };
  return (
    <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
      Tenés {g.age} años. Para {labels[need]} necesitás 18+ o un adulto responsable que
      firme / sea titular. El HQ sigue sirviendo para aprender y planificar.
    </p>
  );
}
