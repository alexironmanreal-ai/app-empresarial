import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LEAD_STAGES, useHq, type LeadStage } from "@/lib/store";
import { ars } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({ component: PipelinePage });

function todayYmd() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function PipelinePage() {
  const leads = useHq((s) => s.leads);
  const addLead = useHq((s) => s.addLead);
  const updateLead = useHq((s) => s.updateLead);
  const removeLead = useHq((s) => s.removeLead);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [offer, setOffer] = useState("");
  const [amount, setAmount] = useState("");
  const [nextContact, setNextContact] = useState("");

  const today = todayYmd();
  const cobrado = leads
    .filter((l) => l.stage === "cobrado")
    .reduce((a, l) => a + (l.amountArs || 0), 0);
  const pipeline = leads
    .filter((l) => l.stage !== "perdido" && l.stage !== "cobrado")
    .reduce((a, l) => a + (l.amountArs || 0), 0);
  const dueCount = leads.filter(
    (l) =>
      l.stage !== "cobrado" &&
      l.stage !== "perdido" &&
      l.nextContactAt &&
      l.nextContactAt <= today,
  ).length;

  function submit() {
    if (!name.trim()) return;
    addLead({
      name: name.trim(),
      contact: contact.trim(),
      offer: offer.trim() || "Consultoría",
      amountArs: Number(amount) || 0,
      stage: "contactado",
      notes: "",
      nextContactAt: nextContact || undefined,
    });
    setName("");
    setContact("");
    setOffer("");
    setAmount("");
    setNextContact("");
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">Ventas</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Pipeline</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Contactado → call → propuesta → cobrado. Agendá el próximo contacto; el HQ te lo pide si vence.
        </p>
        <p className="mt-2 font-mono text-[12px] text-subtle">
          En curso {ars(pipeline)} · Cobrado {ars(cobrado)} · {leads.length} leads
          {dueCount > 0 ? ` · ${dueCount} para contactar hoy/atrasados` : ""}
        </p>
      </header>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Nuevo lead</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="WhatsApp / mail" value={contact} onChange={(e) => setContact(e.target.value)} />
          <Input placeholder="Oferta" value={offer} onChange={(e) => setOffer(e.target.value)} />
          <Input className="font-mono" type="number" placeholder="ARS" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input className="font-mono" type="date" title="Próximo contacto" value={nextContact} onChange={(e) => setNextContact(e.target.value)} />
          <Button onClick={submit}>Agregar</Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {LEAD_STAGES.map((col) => {
          const items = leads.filter((l) => l.stage === col.id);
          return (
            <div key={col.id} className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
                {col.label} · {items.length}
              </p>
              {items.map((l) => {
                const overdue =
                  l.nextContactAt &&
                  l.nextContactAt < today &&
                  col.id !== "cobrado" &&
                  col.id !== "perdido";
                const dueToday = l.nextContactAt === today;
                return (
                  <div
                    key={l.id}
                    className={cn(
                      "rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]",
                      overdue && "ring-1 ring-danger/40",
                      dueToday && "ring-1 ring-warn/40",
                    )}
                  >
                    <p className="font-medium text-fg">{l.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{l.offer}</p>
                    <p className="mt-1 font-mono text-[12px] text-subtle">
                      {l.amountArs ? ars(l.amountArs) : "\u2014"}
                      {l.contact ? ` · ${l.contact}` : ""}
                    </p>
                    {col.id !== "cobrado" && col.id !== "perdido" ? (
                      <label className="mt-2 block">
                        <span className="font-mono text-[10px] text-subtle">Próximo contacto</span>
                        <Input
                          className="mt-0.5 h-8 font-mono text-xs"
                          type="date"
                          value={l.nextContactAt || ""}
                          onChange={(e) =>
                            updateLead(l.id, { nextContactAt: e.target.value || undefined })
                          }
                        />
                      </label>
                    ) : null}
                    {l.stage === "perdido" && l.lostReason ? (
                      <p className="mt-1 text-[11px] text-danger">Motivo: {l.lostReason}</p>
                    ) : null}
                    {l.stage === "cobrado" && l.winReason ? (
                      <p className="mt-1 text-[11px] text-ok">{l.winReason}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {LEAD_STAGES.filter((s) => s.id !== l.stage).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            if (s.id === "perdido") {
                              const reason = window.prompt(
                                "Motivo de la pérdida (obligatorio):",
                                l.lostReason || "",
                              );
                              if (reason === null) return;
                              const trimmed = reason.trim();
                              if (!trimmed) {
                                window.alert("Indicá un motivo.");
                                return;
                              }
                              updateLead(l.id, { stage: "perdido", lostReason: trimmed });
                              return;
                            }
                            updateLead(l.id, { stage: s.id as LeadStage });
                          }}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px]",
                            s.id === "cobrado"
                              ? "bg-ok/20 text-ok"
                              : s.id === "perdido"
                                ? "bg-danger/15 text-danger"
                                : "bg-elevated text-muted hover:text-fg",
                          )}
                        >
                          → {s.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => removeLead(l.id)}
                        className="rounded px-1.5 py-0.5 text-[10px] text-subtle hover:text-danger"
                      >
                        borrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
