import { useEffect, useState } from "react";

/** Reloj vivo para el HQ (se actualiza cada segundo). */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const date = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className={className}>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
        Ahora
      </p>
      <p className="mt-1 font-display text-3xl tabular-nums tracking-tight">{time}</p>
      <p className="mt-1 text-sm capitalize text-muted">{date}</p>
    </div>
  );
}
