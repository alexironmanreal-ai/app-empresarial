import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function SurvivalBanner(props: {
  runwayDays: number;
  reviewOverdue: boolean;
  monthlyBurnArs: number;
  totalCajaArs: number;
}) {
  const critical = Number.isFinite(props.runwayDays) && props.runwayDays < 30;
  const warn =
    !critical &&
    ((Number.isFinite(props.runwayDays) && props.runwayDays < 90) ||
      props.reviewOverdue);

  if (!critical && !warn) return null;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-border)]",
        critical
          ? "border-danger/50 bg-danger/15 text-danger"
          : "border-warn/50 bg-warn/10 text-warn",
      )}
      role="alert"
    >
      {critical ? (
        <p>
          <strong>Supervivencia:</strong> runway {props.runwayDays} días (caja{" "}
          {Math.round(props.totalCajaArs).toLocaleString("es-AR")} ARS · burn ~
          {Math.round(props.monthlyBurnArs).toLocaleString("es-AR")}/mes). Priorizá{" "}
          <Link to="/pipeline" className="underline hover:text-fg">
            vender
          </Link>{" "}
          o{" "}
          <Link to="/finanzas" className="underline hover:text-fg">
            bajar burn
          </Link>
          .
        </p>
      ) : (
        <p>
          {props.reviewOverdue ? (
            <>
              <strong>Review semanal vencida.</strong> Cerrala en HQ antes de abrir frentes
              nuevos.{" "}
            </>
          ) : null}
          {Number.isFinite(props.runwayDays) && props.runwayDays < 90 ? (
            <>
              Runway {props.runwayDays}d — por debajo de 90 días. Revisá{" "}
              <Link to="/finanzas" className="underline hover:text-fg">
                Plata
              </Link>
              .
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}
