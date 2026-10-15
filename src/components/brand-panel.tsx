import { Link } from "@tanstack/react-router";
import { useHq } from "@/lib/store";
import { CompanyLogo } from "./logo-uploader";

/** Rellena el hueco del HQ con logo + identidad de la empresa */
export function BrandPanel() {
  const profile = useHq((s) => s.profile);
  const cv = useHq((s) => s.cv);

  return (
    <section
      className="flex flex-col items-center justify-center gap-4 rounded-xl bg-surface p-8 text-center shadow-[var(--shadow-border)] lg:min-h-[280px]"
      data-hide-in-deep-work="true"
    >
      <CompanyLogo
        src={profile.logoDataUrl ?? ""}
        company={profile.company}
        size="lg"
      />
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Identidad
        </p>
        <h2 className="mt-1 font-display text-3xl text-fg">{profile.company}</h2>
        <p className="mt-1 text-sm text-muted">
          {cv.headline || profile.niche || profile.founder}
        </p>
      </div>
      {!profile.logoDataUrl ? (
        <p className="max-w-xs text-xs text-subtle">
          Subí el logo en Ajustes o en el onboarding para llenar este espacio.
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/cv"
          className="font-mono text-[11px] text-accent hover:underline"
        >
          Fabricador de CV →
        </Link>
        <Link
          to="/empresa"
          className="font-mono text-[11px] text-subtle hover:text-fg"
        >
          Empresa →
        </Link>
      </div>
    </section>
  );
}
