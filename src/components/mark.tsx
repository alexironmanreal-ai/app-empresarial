import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Mark({
  checked,
  onChange,
  label,
  size = "md",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-5 rounded-[5px]" : "size-6 rounded-[6px]";
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className="group relative flex min-h-11 min-w-11 items-center justify-center"
    >
      <span
        className={cn(
          "flex items-center justify-center shadow-[var(--shadow-border)] transition-[background-color,box-shadow] duration-150",
          box,
          checked ? "bg-accent text-accent-fg" : "bg-elevated text-transparent group-hover:shadow-[var(--shadow-border-hover)]",
        )}
      >
        <Check className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={2.5} />
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
