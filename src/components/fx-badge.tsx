import { useEffect, useState } from "react";
import { fetchUsdArs, type FxQuote } from "@/lib/fx";
import { useHq } from "@/lib/store";

/** Carga cotización USD/ARS y la guarda en el store */
export function useLiveFx() {
  const setArsPerUsd = useHq((s) => s.setArsPerUsd);
  const arsPerUsd = useHq((s) => s.arsPerUsd) ?? 1400;
  const [quote, setQuote] = useState<FxQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const q = await fetchUsdArs();
      if (cancelled) return;
      setQuote(q);
      setArsPerUsd(q.arsPerUsd);
    })();
    return () => {
      cancelled = true;
    };
  }, [setArsPerUsd]);

  return { arsPerUsd, quote };
}

export function FxBadge() {
  const { arsPerUsd, quote } = useLiveFx();
  return (
    <p className="font-mono text-[11px] text-subtle">
      USD 1 = {(arsPerUsd ?? 1400).toLocaleString("es-AR")} ARS
      {quote ? (
        <span className="text-muted">
          {" "}
          · {quote.source}
          {quote.source !== "fallback" ? " live" : " (fallback)"}
        </span>
      ) : (
        <span className="text-muted"> · cargando…</span>
      )}
    </p>
  );
}
