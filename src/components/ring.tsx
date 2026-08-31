export function Ring({
  value,
  size = 88,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const dash = c * v;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" className="size-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" className="text-elevated" strokeWidth="3.5" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-accent"
          strokeWidth="3.5"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm tabular-nums text-fg">{Math.round(v * 100)}</span>
        {label ? <span className="text-[9px] uppercase tracking-wider text-subtle">{label}</span> : null}
      </div>
    </div>
  );
}
