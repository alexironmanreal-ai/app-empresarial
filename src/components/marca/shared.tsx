import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

/** Campo con etiqueta chica + estado "cargado / falta" (mismo estilo que YouTube). */
export function KeyField({
  label,
  value,
  onChange,
  placeholder,
  secret = false,
  okText,
  missingText,
  ok,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
  ok: boolean;
  okText: string;
  missingText: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] text-subtle">{label}</p>
      <Input
        className="font-mono text-xs"
        type={secret ? "password" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <p className="mt-1 font-mono text-[11px]">
        {ok ? (
          <span className="text-ok">{okText}</span>
        ) : (
          <span className="text-warn">{missingText}</span>
        )}
      </p>
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}
