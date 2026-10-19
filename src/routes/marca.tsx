import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useHq } from "@/lib/store";
import { cn } from "@/lib/utils";
import { YoutubePanel } from "@/components/marca/youtube-panel";
import { SocialPanel } from "@/components/marca/social-panel";
import { CustomAppsPanel } from "@/components/marca/custom-apps-panel";

export const Route = createFileRoute("/marca")({ component: Marca });

type TabId = "youtube" | "instagram" | "linkedin" | "x" | "apps";

const TABS: { id: TabId; label: string }[] = [
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" },
  { id: "apps", label: "Otras apps" },
];

function Marca() {
  const [tab, setTab] = useState<TabId>("youtube");
  const connected = useHq(
    useShallow((s) => ({
      youtube: s.ytApiKey.trim().length > 10,
      instagram: s.social.instagram.token.trim().length > 10,
      linkedin: s.social.linkedin.token.trim().length > 10,
      x: s.social.x.token.trim().length > 10,
      apps: s.customApis.some((a) => a.token.trim().length > 0),
    })),
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
          Audiencia · live
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">Marca personal</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Todas tus redes en un lugar: conectá cada una con su API key y seguí
          seguidores, publicaciones y engagement.
        </p>
      </header>

      <nav
        aria-label="Redes y apps"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-sm px-3 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-accent text-accent-fg"
                : "text-muted hover:bg-elevated hover:text-fg",
            )}
          >
            {t.label}
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                connected[t.id] ? "bg-ok" : "bg-subtle/50",
              )}
            />
            <span className="sr-only">
              {connected[t.id] ? "conectado" : "sin conectar"}
            </span>
          </button>
        ))}
      </nav>

      {tab === "youtube" ? <YoutubePanel /> : null}
      {tab === "instagram" ? <SocialPanel platform="instagram" /> : null}
      {tab === "linkedin" ? <SocialPanel platform="linkedin" /> : null}
      {tab === "x" ? <SocialPanel platform="x" /> : null}
      {tab === "apps" ? <CustomAppsPanel /> : null}
    </div>
  );
}
