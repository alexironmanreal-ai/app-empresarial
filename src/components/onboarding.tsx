import { useState } from "react";
import { useHq } from "@/lib/store";
import { getSession } from "@/lib/accounts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function Onboarding() {
  const onboarded = useHq((s) => s.onboarded);
  const setOnboarded = useHq((s) => s.setOnboarded);
  const profile = useHq((s) => s.profile);
  const setProfile = useHq((s) => s.setProfile);
  const session = getSession();
  const [local, setLocal] = useState(() => ({
    ...profile,
    founder: profile.founder === "Founder" && session?.displayName
      ? session.displayName
      : profile.founder,
  }));

  if (onboarded) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Primera vez · @{session?.username ?? "local"}
        </p>
        <h1 className="mt-2 font-display text-3xl">Configurá tu HQ</h1>
        <p className="mt-2 text-sm text-muted">
          Esto personaliza el briefing y el tablero. Se guarda solo para esta
          cuenta en este dispositivo.
        </p>
        <div className="mt-5 space-y-3">
          {(
            [
              ["founder", "Tu nombre"],
              ["company", "Empresa"],
              ["os", "Nombre del OS"],
              ["youtube", "Canal YouTube"],
              ["niche", "Nicho / promesa"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                className="mt-1.5"
                value={local[key]}
                onChange={(e) => setLocal((s) => ({ ...s, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button
          className="mt-6 w-full"
          onClick={() => {
            setProfile(local);
            setOnboarded(true);
          }}
        >
          Entrar al HQ
        </Button>
      </div>
    </div>
  );
}
