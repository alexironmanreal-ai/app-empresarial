import { createFileRoute, Link } from "@tanstack/react-router";
import { useHq } from "@/lib/store";
import { CompanyLogo } from "@/components/logo-uploader";

export const Route = createFileRoute("/creador")({ component: Creador });

function Creador() {
  const profile = useHq((s) => s.profile);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start gap-5">
        <CompanyLogo
          src={profile.logoDataUrl ?? ""}
          company={profile.company || "Sentinel"}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            Origen · Sentinel HQ
          </p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">
            {profile.founder && profile.founder !== "Founder"
              ? profile.founder
              : "Alex · creador"}
          </h1>
          <p className="mt-2 font-mono text-sm text-accent">
            {profile.company || "Sentinel"} · HQ del oficio de CEO
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Esta app no nació para “verse startup”. Nació porque construir empresa,
            OS, contenido y caja al mismo tiempo sin un tablero que diga la verdad
            es ruido. Sentinel HQ es el escritorio donde la física del negocio
            manda y el ego no tiene vote.
          </p>
        </div>
      </header>

      <section>
        <h2 className="font-display text-2xl">Quién está detrás</h2>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3 font-medium">Campo</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <Row k="Nombre en el HQ" v={profile.founder || "Founder (editá en Ajustes)"} />
              <Row k="Empresa" v={profile.company || "Sentinel"} />
              <Row k="Proyecto" v="Sentinel HQ — escritorio del CEO" />
              <Row k="Repo" v="github.com/alexironmanreal-ai/app-empresarial" />
              <Row k="Stack" v="React · Vite · Electron · Zustand · Supabase (opcional)" />
              <Row k="Estándar" v="Borrar > simplificar > acelerar > automatizar" />
              <Row k="Norte de plata" v="10M ARS de facturación cobrada — no valuación de PowerPoint" />
              <Row
                k="Nicho declarado"
                v={profile.niche || "Sistema operativo en público + oficio de CEO"}
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-accent/25 bg-accent/5 p-5 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
          Nota de Grok · xAI
        </p>
        <h2 className="mt-2 font-display text-2xl">Lo que vale la pena decir</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            Construiste un HQ que no te miente con curvas inventadas. Wealth atado a
            cobrado, gaps atados a tareas, runway atado a caja y burn, pipeline con
            candado, cara después del login. Eso no es decoración: es disciplina
            convertida en software.
          </p>
          <p>
            La mayoría de las “apps de productividad” premian el movimiento. La tuya
            premia el resultado: plata en cuenta, P0 cerrados, commits que mueven el
            OS, un día con horas maker reales. Si el tablero duele, es que está
            funcionando.
          </p>
          <p>
            Seguí en público si querés — YouTube, kernel, empresa — pero no diluyas el
            estándar. Un founder que se mide en facturación cobrada y en física del
            día llega más lejos que uno que se mide en likes o en roadmaps eternamente
            “casi listos”.
          </p>
          <p className="text-fg">
            Respeto el laburo. Ahora a cerrar el próximo cobro y el próximo P0. El
            resto es comentario.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Principios con los que se escribió esto</h2>
        <div className="mt-4 overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-subtle">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Principio</th>
                <th className="px-4 py-3 font-medium">En la app</th>
              </tr>
            </thead>
            <tbody>
              <PRow n="1" p="La realidad manda" a="Runway, cobrado, tareas — no narrativas" />
              <PRow n="2" p="Borrar antes de optimizar" a="Kill list + algoritmo de 5 pasos" />
              <PRow n="3" p="Caja es oxígeno" a="Plata primero; OS y YT después si hace falta" />
              <PRow n="4" p="Un solo score que importa" a="Facturación cobrada → meta 10M" />
              <PRow n="5" p="Identidad y acceso serios" a="Auth + cara + gate de pipeline" />
              <PRow n="6" p="Construir en público con rigor" a="Tracker 365, física del día, commits" />
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-wrap gap-4 font-mono text-[11px]">
        <Link to="/" className="text-accent hover:underline">
          ← Volver al HQ
        </Link>
        <Link to="/ceo" className="text-accent hover:underline">
          Oficio CEO →
        </Link>
        <Link to="/cv" className="text-accent hover:underline">
          Fabricador de CV →
        </Link>
        <a
          href="https://github.com/alexironmanreal-ai/app-empresarial"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Repo en GitHub ↗
        </a>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-border/60">
      <td className="px-4 py-3 font-medium text-fg">{k}</td>
      <td className="px-4 py-3">{v}</td>
    </tr>
  );
}

function PRow({ n, p, a }: { n: string; p: string; a: string }) {
  return (
    <tr className="border-b border-border/60">
      <td className="px-4 py-3 font-mono text-subtle">{n}</td>
      <td className="px-4 py-3 font-medium text-fg">{p}</td>
      <td className="px-4 py-3 text-muted">{a}</td>
    </tr>
  );
}
