import { useMemo, useState } from "react";
import { useHq } from "@/lib/store";
import { getSession } from "@/lib/accounts";
import { CV_QUESTIONS, draftSummary } from "@/lib/cv";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LogoUploader } from "./logo-uploader";

type Step = "profile" | "logo" | "cv";

export function Onboarding() {
  const onboarded = useHq((s) => s.onboarded);
  const setOnboarded = useHq((s) => s.setOnboarded);
  const profile = useHq((s) => s.profile);
  const setProfile = useHq((s) => s.setProfile);
  const cv = useHq((s) => s.cv);
  const setCv = useHq((s) => s.setCv);
  const session = getSession();

  const [step, setStep] = useState<Step>("profile");
  const [cvIdx, setCvIdx] = useState(0);
  const [local, setLocal] = useState(() => ({
    ...profile,
    founder:
      profile.founder === "Founder" && session?.displayName
        ? session.displayName
        : profile.founder,
  }));
  const [cvLocal, setCvLocal] = useState(() => ({ ...cv }));

  const questions = CV_QUESTIONS;
  const q = questions[cvIdx];
  const progress = useMemo(() => {
    if (step === "profile") return 8;
    if (step === "logo") return 20;
    if (step === "cv") return 20 + Math.round(((cvIdx + 1) / questions.length) * 75);
    return 100;
  }, [step, cvIdx, questions.length]);

  if (onboarded) return null;

  function finish() {
    const summary =
      cvLocal.summary.trim() ||
      draftSummary(cvLocal, local.founder, local.company);
    setProfile(local);
    setCv({ ...cvLocal, summary, completed: true });
    setOnboarded(true);
  }

  function skipCv() {
    setProfile(local);
    setCv({ ...cvLocal, completed: false });
    setOnboarded(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {step === "profile" && (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
              Primera vez · @{session?.username ?? "local"}
            </p>
            <h1 className="mt-2 font-display text-3xl">Configurá tu HQ</h1>
            <p className="mt-2 text-sm text-muted">
              Esto personaliza el briefing, el logo y el fabricador de CV.
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
                    onChange={(e) =>
                      setLocal((s) => ({ ...s, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" onClick={() => setStep("logo")}>
              Siguiente · Logo
            </Button>
          </>
        )}

        {step === "logo" && (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
              Identidad visual
            </p>
            <h1 className="mt-2 font-display text-3xl">Logo de la empresa</h1>
            <p className="mt-2 text-sm text-muted">
              Se muestra en el sidebar y en el HQ. Podés cambiarlo después en
              Ajustes.
            </p>
            <div className="mt-5">
              <LogoUploader
                value={local.logoDataUrl}
                onChange={(logoDataUrl) =>
                  setLocal((s) => ({ ...s, logoDataUrl }))
                }
              />
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setStep("profile")}>
                Atrás
              </Button>
              <Button className="flex-1" onClick={() => setStep("cv")}>
                Siguiente · Preguntas
              </Button>
            </div>
          </>
        )}

        {step === "cv" && q && (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
              Preguntas básicas · {cvIdx + 1}/{questions.length}
            </p>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl">{q.title}</h1>
            <p className="mt-2 text-sm text-muted">{q.hint}</p>
            <div className="mt-5">
              {(q.rows ?? 1) > 1 ? (
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-fg outline-none ring-accent focus:ring-2"
                  rows={q.rows}
                  placeholder={q.placeholder}
                  value={String(cvLocal[q.id] ?? "")}
                  onChange={(e) =>
                    setCvLocal((s) => ({ ...s, [q.id]: e.target.value }))
                  }
                />
              ) : (
                <Input
                  className="mt-0"
                  placeholder={q.placeholder}
                  value={String(cvLocal[q.id] ?? "")}
                  onChange={(e) =>
                    setCvLocal((s) => ({ ...s, [q.id]: e.target.value }))
                  }
                />
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (cvIdx === 0) setStep("logo");
                  else setCvIdx((i) => i - 1);
                }}
              >
                Atrás
              </Button>
              <Button variant="ghost" className="ml-auto text-muted" onClick={skipCv}>
                Saltar CV
              </Button>
              {cvIdx < questions.length - 1 ? (
                <Button onClick={() => setCvIdx((i) => i + 1)}>Siguiente</Button>
              ) : (
                <Button onClick={finish}>Entrar al HQ</Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
