import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors",
  {
    variants: {
      tone: {
        p0: "border-red-500/30 bg-red-500/10 text-red-400",
        p1: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        p2: "border-sky-500/30 bg-sky-500/10 text-sky-400",
        p3: "border-border bg-surface text-muted",
        default: "border-border bg-surface text-muted",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
