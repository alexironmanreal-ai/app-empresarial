import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Cpu,
  Handshake,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings2,
  Wallet,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { companyScore, useHq } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "HQ", icon: LayoutDashboard },
  { to: "/tareas", label: "Tareas", icon: ListChecks },
  { to: "/tracker", label: "365", icon: CalendarDays },
  { to: "/registros", label: "Registros", icon: NotebookPen },
  { to: "/pipeline", label: "Pipeline", icon: Handshake },
  { to: "/empresa", label: "Empresa", icon: Building2 },
  { to: "/finanzas", label: "Plata", icon: Wallet },
  { to: "/youtube", label: "YouTube", icon: Youtube },
  { to: "/os", label: "OS", icon: Cpu },
  { to: "/ceo", label: "CEO", icon: Briefcase },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const done = useHq((s) => s.done);
  const profile = useHq((s) => s.profile);
  const score = companyScore(done);

  useEffect(() => {
    void useHq.persist.rehydrate();
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-bg lg:flex">
        <div className="px-5 pb-2 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
            {profile.company}
          </p>
          <p className="font-display text-3xl leading-none text-fg">HQ</p>
          <p className="mt-3 font-mono text-[11px] tabular-nums text-muted">
            {Math.round(score * 100)}% construida
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  active
                    ? "bg-elevated text-fg"
                    : "text-muted hover:bg-elevated/60 hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.7} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <SettingsDialog />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
            {profile.company}
          </p>
          <p className="font-display text-xl leading-none">HQ</p>
        </div>
        <SettingsDialog />
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex overflow-x-auto border-t border-border bg-bg/95 px-1 py-1 backdrop-blur-sm lg:hidden">
        {NAV.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[3.25rem] flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? "text-fg" : "text-subtle",
              )}
            >
              <Icon className="size-4" strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="lg:pl-56">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SettingsDialog() {
  const profile = useHq((s) => s.profile);
  const setProfile = useHq((s) => s.setProfile);
  const currency = useHq((s) => s.currency);
  const setCurrency = useHq((s) => s.setCurrency);
  const mpToken = useHq((s) => s.mpToken);
  const setMpToken = useHq((s) => s.setMpToken);
  const ytApiKey = useHq((s) => s.ytApiKey);
  const setYtApiKey = useHq((s) => s.setYtApiKey);
  const ytChannelInput = useHq((s) => s.ytChannelInput);
  const setYtChannelInput = useHq((s) => s.setYtChannelInput);
  const reset = useHq((s) => s.reset);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full gap-2">
          <Settings2 className="size-3.5" />
          Ajustes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="max-h-[80vh] space-y-4 overflow-y-auto">
          <h2 className="font-display text-xl">Perfil</h2>
          <Field label="Founder" value={profile.founder} onChange={(v) => setProfile({ founder: v })} />
          <Field label="Empresa" value={profile.company} onChange={(v) => setProfile({ company: v })} />
          <Field label="OS" value={profile.os} onChange={(v) => setProfile({ os: v })} />
          <Field label="YouTube (nombre)" value={profile.youtube} onChange={(v) => setProfile({ youtube: v })} />
          <Field label="Nicho" value={profile.niche} onChange={(v) => setProfile({ niche: v })} />
          <div>
            <Label>Moneda</Label>
            <div className="mt-1.5 flex gap-2">
              {(["USD", "ARS"] as const).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={currency === c ? "default" : "secondary"}
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          <h2 className="pt-2 font-display text-xl">Mercado Pago</h2>
          <div>
            <Label>Access Token</Label>
            <Input
              className="mt-1.5 font-mono text-xs"
              type="password"
              placeholder="APP_USR-…"
              value={mpToken}
              onChange={(e) => setMpToken(e.target.value)}
            />
          </div>

          <h2 className="pt-2 font-display text-xl">YouTube API</h2>
          <div>
            <Label>API Key</Label>
            <Input
              className="mt-1.5 font-mono text-xs"
              type="password"
              placeholder="AIza…"
              value={ytApiKey}
              onChange={(e) => setYtApiKey(e.target.value)}
            />
          </div>
          <div>
            <Label>Canal</Label>
            <Input
              className="mt-1.5 font-mono text-xs"
              placeholder="@tuCanal"
              value={ytChannelInput}
              onChange={(e) => setYtChannelInput(e.target.value)}
            />
          </div>

          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            Reiniciar progreso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
