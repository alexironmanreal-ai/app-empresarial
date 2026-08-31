import { createFileRoute } from "@tanstack/react-router";
import { CEO_CADENCE, RATE_CARD } from "@/lib/data";
import { useHq } from "@/lib/store";

export const Route = createFileRoute("/ceo")({ component: Ceo });

function Ceo() {
  const profile = useHq((s) => s.profile);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Oficio</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">CEO · {profile.founder}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Cadencia semanal y rate card. El trabajo del founder no es solo código: es ritmo y venta.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl">Cadencia semanal</h2>
        <div className="mt-4 space-y-3">
          {CEO_CADENCE.map((c, i) => (
            <div key={i} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-xl">{c.name}</p>
                <p className="font-mono text-[12px] text-subtle">{c.day} · {c.hours}</p>
              </div>
              <p className="mt-2 text-sm text-muted">{c.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Rate card</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {RATE_CARD.map((r) => (
            <div key={r.name} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">{r.name}</p>
              <p className="mt-2 font-display text-2xl">{r.price}</p>
              <p className="mt-1 text-sm text-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
