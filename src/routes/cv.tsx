import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { CV_QUESTIONS, draftSummary } from "@/lib/cv";
import { useHq } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyLogo } from "@/components/logo-uploader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cv")({ component: CvPage });

function CvPage() {
  const profile = useHq((s) => s.profile);
  const cv = useHq((s) => s.cv);
  const setCv = useHq((s) => s.setCv);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const summary = useMemo(
    () =>
      cv.summary.trim() ||
      draftSummary(cv, profile.founder, profile.company),
    [cv, profile.founder, profile.company],
  );

  function printCv() {
    window.print();
  }

  function downloadTxt() {
    const lines = [
      profile.founder,
      cv.headline || profile.company,
      cv.location,
      [cv.email, cv.phone, cv.linkedin].filter(Boolean).join(" · "),
      "",
      "RESUMEN",
      summary,
      "",
      "VOCACIONES",
      cv.vocaciones,
      "",
      "INTERESES",
      cv.intereses,
      "",
      "ASPIRACIONES",
      cv.aspiraciones,
      "",
      "EXPERIENCIA",
      cv.experience,
      "",
      "EDUCACIÓN",
      cv.education,
      "",
      "SKILLS TÉCNICAS",
      cv.skillsTech,
      "",
      "SKILLS BLANDAS",
      cv.skillsSoft,
      "",
      "IDIOMAS",
      cv.languages,
      "",
      "LOGROS",
      cv.achievements,
      "",
      "DISPONIBILIDAD",
      cv.availability,
    ];
    const blob = new Blob([lines.filter((l) => l !== undefined).join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `CV-${profile.founder.replace(/\s+/g, "-") || "Sentinel"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            Identidad profesional
          </p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">
            Fabricador de CV
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Se alimenta de las preguntas básicas del onboarding. Editá, previsualizá
            e imprimí un CV hiperprofesional listo para inversores, clientes o
            partnerships.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button
            size="sm"
            variant={tab === "edit" ? "default" : "secondary"}
            onClick={() => setTab("edit")}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant={tab === "preview" ? "default" : "secondary"}
            onClick={() => setTab("preview")}
          >
            <FileText className="size-3.5" />
            Vista previa
          </Button>
          <Button size="sm" variant="secondary" onClick={printCv}>
            <Printer className="size-3.5" />
            Imprimir / PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadTxt}>
            <Download className="size-3.5" />
            .txt
          </Button>
        </div>
      </header>

      {tab === "edit" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {CV_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className={cn(
                "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
                (q.rows ?? 1) >= 4 && "lg:col-span-2",
              )}
            >
              <Label>{q.title}</Label>
              <p className="mt-0.5 text-xs text-muted">{q.hint}</p>
              {(q.rows ?? 1) > 1 ? (
                <textarea
                  className="mt-2 min-h-[80px] w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-fg outline-none ring-accent focus:ring-2"
                  rows={q.rows}
                  placeholder={q.placeholder}
                  value={String(cv[q.id] ?? "")}
                  onChange={(e) => setCv({ [q.id]: e.target.value })}
                />
              ) : (
                <Input
                  className="mt-2"
                  placeholder={q.placeholder}
                  value={String(cv[q.id] ?? "")}
                  onChange={(e) => setCv({ [q.id]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="lg:col-span-2">
            <Button
              onClick={() => {
                setCv({
                  summary:
                    cv.summary.trim() ||
                    draftSummary(cv, profile.founder, profile.company),
                  completed: true,
                });
                setTab("preview");
              }}
            >
              Guardar y ver CV
            </Button>
          </div>
        </div>
      ) : (
        <article
          id="cv-preview"
          className="mx-auto max-w-3xl space-y-6 rounded-xl bg-surface p-8 shadow-[var(--shadow-border)] print:max-w-none print:rounded-none print:bg-white print:p-0 print:shadow-none print:text-black"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6 print:border-black">
            <div className="flex items-start gap-4">
              <CompanyLogo
                src={profile.logoDataUrl}
                company={profile.company}
                size="lg"
              />
              <div>
                <h2 className="font-display text-3xl text-fg print:text-black">
                  {profile.founder}
                </h2>
                <p className="mt-1 text-lg text-accent print:text-black">
                  {cv.headline || profile.company}
                </p>
                <p className="mt-2 text-sm text-muted print:text-neutral-600">
                  {[cv.location, cv.email, cv.phone, cv.linkedin]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
          </div>

          <CvSection title="Resumen profesional">{summary}</CvSection>
          {cv.vocaciones ? (
            <CvSection title="Vocaciones">{cv.vocaciones}</CvSection>
          ) : null}
          {cv.intereses ? (
            <CvSection title="Intereses">{cv.intereses}</CvSection>
          ) : null}
          {cv.aspiraciones ? (
            <CvSection title="Aspiraciones">{cv.aspiraciones}</CvSection>
          ) : null}
          {cv.experience ? (
            <CvSection title="Experiencia" pre>
              {cv.experience}
            </CvSection>
          ) : null}
          {cv.education ? (
            <CvSection title="Educación" pre>
              {cv.education}
            </CvSection>
          ) : null}
          {cv.skillsTech ? (
            <CvSection title="Skills técnicas">{cv.skillsTech}</CvSection>
          ) : null}
          {cv.skillsSoft ? (
            <CvSection title="Skills blandas">{cv.skillsSoft}</CvSection>
          ) : null}
          {cv.languages ? (
            <CvSection title="Idiomas">{cv.languages}</CvSection>
          ) : null}
          {cv.achievements ? (
            <CvSection title="Logros y proyectos" pre>
              {cv.achievements}
            </CvSection>
          ) : null}
          {cv.availability ? (
            <CvSection title="Disponibilidad">{cv.availability}</CvSection>
          ) : null}

          <p className="pt-4 text-center font-mono text-[10px] text-subtle print:text-neutral-500">
            Generado con Sentinel HQ · {profile.company}
          </p>
        </article>
      )}
    </div>
  );
}

function CvSection({
  title,
  children,
  pre,
}: {
  title: string;
  children: ReactNode;
  pre?: boolean;
}) {
  return (
    <section>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle print:text-neutral-500">
        {title}
      </h3>
      <div
        className={cn(
          "mt-2 text-sm leading-relaxed text-fg print:text-black",
          pre && "whitespace-pre-wrap font-mono text-[13px]",
        )}
      >
        {children}
      </div>
    </section>
  );
}
