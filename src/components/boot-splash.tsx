/**
 * Pantalla de arranque: nombre + frase + transición → login / HQ.
 */
import { useEffect, useState } from "react";

const PHRASE = "El escritorio del CEO. Datos claros. Decisiones rápidas.";

type Phase = "enter" | "hold" | "exit" | "done";

export function BootSplash({
  onDone,
  title = "Sentinel HQ",
  phrase = PHRASE,
}: {
  onDone: () => void;
  title?: string;
  phrase?: string;
}) {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("hold"), 420);
    const t2 = window.setTimeout(() => setPhase("exit"), 2200);
    const t3 = window.setTimeout(() => {
      setPhase("done");
      onDone();
    }, 2900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onDone]);

  if (phase === "done") return null;

  const exiting = phase === "exit";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-bg"
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(1.04)" : "scale(1)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
        pointerEvents: exiting ? "none" : "auto",
      }}
      aria-hidden={exiting}
    >
      {/* Glow de fondo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 70%)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 0.9s ease",
        }}
      />

      <div className="relative z-10 flex max-w-lg flex-col items-center px-6 text-center">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-subtle"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transform: phase === "enter" ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.55s ease 0.05s, transform 0.55s ease 0.05s",
          }}
        >
          Bienvenido
        </p>

        <h1
          className="mt-3 font-display text-5xl tracking-tight text-fg sm:text-6xl"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transform: phase === "enter" ? "translateY(16px)" : "translateY(0)",
            transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
          }}
        >
          {title}
        </h1>

        <div
          className="mt-5 h-px w-16 bg-accent"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transform: phase === "enter" ? "scaleX(0)" : "scaleX(1)",
            transition: "opacity 0.5s ease 0.35s, transform 0.6s ease 0.35s",
          }}
        />

        <p
          className="mt-5 text-base text-muted sm:text-lg"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transform: phase === "enter" ? "translateY(10px)" : "translateY(0)",
            transition: "opacity 0.65s ease 0.45s, transform 0.65s ease 0.45s",
          }}
        >
          {phrase}
        </p>

        {/* Barrita de progreso sutil */}
        <div
          className="mt-10 h-0.5 w-32 overflow-hidden rounded-full bg-elevated"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transition: "opacity 0.4s ease 0.6s",
          }}
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{
              width: exiting ? "100%" : phase === "hold" ? "100%" : "0%",
              transition: "width 1.7s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
