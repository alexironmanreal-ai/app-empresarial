/**
 * Monitoreo de equipo (CTO / COO / CMO).
 * Señales: commits GitHub, check-ins manuales, metas semanales.
 */

export type TeamRole = "CEO" | "CTO" | "COO" | "CMO" | "otro";

export type TeamMember = {
  id: string;
  name: string;
  role: TeamRole;
  githubUser?: string;
  repo?: string;
  contact?: string;
  weeklyCommitGoal: number;
  checkInHours: number;
  notes: string;
  lastCheckInAt?: string;
  lastCommitAt?: string | null;
  lastCommitMsg?: string;
  commitCount7d?: number;
  lastSyncedAt?: string;
  repoReachable?: boolean;
};

export type WorkStatus = "activo" | "lento" | "silencio" | "sin_datos";

export function hoursSince(iso?: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return (now - t) / (1000 * 60 * 60);
}

export function memberStatus(m: TeamMember, now = Date.now()): WorkStatus {
  if (m.role === "CTO" && m.repo) {
    const h = hoursSince(m.lastCommitAt, now);
    if (h === null) return "sin_datos";
    if (h <= 24) return "activo";
    if (h <= 72) return "lento";
    return "silencio";
  }
  const h = hoursSince(m.lastCheckInAt, now);
  if (h === null) return "sin_datos";
  if (h <= (m.checkInHours || 24)) return "activo";
  if (h <= (m.checkInHours || 24) * 2) return "lento";
  return "silencio";
}

export function statusLabel(s: WorkStatus): string {
  switch (s) {
    case "activo":
      return "Trabajando";
    case "lento":
      return "Lento";
    case "silencio":
      return "Sin señal";
    default:
      return "Sin datos";
  }
}

export function statusTone(s: WorkStatus): "ok" | "warn" | "danger" | "muted" {
  if (s === "activo") return "ok";
  if (s === "lento") return "warn";
  if (s === "silencio") return "danger";
  return "muted";
}

export function defaultTeam(): TeamMember[] {
  return [
    {
      id: "cto-1",
      name: "CTO",
      role: "CTO",
      githubUser: "",
      repo: "",
      weeklyCommitGoal: 5,
      checkInHours: 24,
      notes: "Señal: últimos commits + push del repo asignado.",
    },
    {
      id: "coo-1",
      name: "COO",
      role: "COO",
      weeklyCommitGoal: 0,
      checkInHours: 24,
      notes: "Señal: check-in diario + avance ops / tareas.",
    },
    {
      id: "cmo-1",
      name: "CMO",
      role: "CMO",
      weeklyCommitGoal: 0,
      checkInHours: 48,
      notes: "Señal: check-in + contenido / marcas (YT, IG, X).",
    },
  ];
}

export function teamPulse(members: TeamMember[]): {
  activo: number;
  lento: number;
  silencio: number;
  sin: number;
} {
  const out = { activo: 0, lento: 0, silencio: 0, sin: 0 };
  for (const m of members) {
    const s = memberStatus(m);
    if (s === "activo") out.activo++;
    else if (s === "lento") out.lento++;
    else if (s === "silencio") out.silencio++;
    else out.sin++;
  }
  return out;
}
