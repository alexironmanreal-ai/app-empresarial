import type { ReactNode } from "react";
import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClientOnly } from "./client-only";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  background: "#111114",
  border: "1px solid rgba(242,241,238,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#f2f1ee",
};

const axis = {
  fontSize: 11,
  fill: "#6e6e76",
  fontFamily: "IBM Plex Mono, monospace",
};

export function ChartShell({
  title,
  caption,
  height = 220,
  children,
  className,
}: {
  title?: string;
  caption?: string;
  height?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative z-0 overflow-hidden rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]", className)}>
      {title ? (
        <div className="mb-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">{title}</p>
          {caption ? <p className="mt-1 text-sm text-muted">{caption}</p> : null}
        </div>
      ) : null}
      <ClientOnly fallback={<div className="w-full rounded-lg bg-elevated" style={{ height }} />}>
        <div style={{ height }} className="relative z-0 w-full overflow-hidden">
          {children}
        </div>
      </ClientOnly>
    </div>
  );
}

type Pair = { label: string; done: number; skip: number };

export function CompareArea({
  data,
  doneName = "Si lo hacés",
  skipName = "Si no",
}: {
  data: Pair[];
  doneName?: string;
  skipName?: string;
}) {
  const gid = useId().replace(/:/g, "");
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5cdd8" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#c5cdd8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(242,241,238,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9a9aa3" }} />
        <Area
          type="monotone"
          dataKey="done"
          name={doneName}
          stroke="#c5cdd8"
          fill={`url(#${gid})`}
          strokeWidth={1.8}
        />
        <Area
          type="monotone"
          dataKey="skip"
          name={skipName}
          stroke="#6e6e76"
          fill="transparent"
          strokeWidth={1.4}
          strokeDasharray="4 3"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WealthChart({
  data,
}: {
  data: { year: number; conservative: number; base: number; optimistic: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(242,241,238,0.06)" vertical={false} />
        <XAxis dataKey="year" tick={axis} axisLine={false} tickLine={false} />
        <YAxis
          tick={axis}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v: number) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
          }
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9a9aa3" }} />
        <Line type="monotone" dataKey="conservative" name="Conservador" stroke="#6e6e76" strokeWidth={1.4} dot={false} />
        <Line type="monotone" dataKey="base" name="Base" stroke="#c5cdd8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="optimistic" name="Optimista" stroke="#f2f1ee" strokeWidth={1.4} strokeDasharray="5 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleLine({
  data,
  dataKey,
  name,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  name: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(242,241,238,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey={dataKey} name={name} stroke="#c5cdd8" strokeWidth={1.8} dot={{ r: 3, fill: "#c5cdd8" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StackedBars({
  data,
  keys,
}: {
  data: Array<Record<string, string | number>>;
  keys: { key: string; name: string; fill: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(242,241,238,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis
          tick={axis}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v: number) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
          }
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9a9aa3" }} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} name={k.name} stackId="a" fill={k.fill} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
