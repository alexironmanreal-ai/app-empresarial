#!/usr/bin/env node
/**
 * Aplica teamMembers al store.ts restaurado.
 * Uso: node scripts/patch-team-store.mjs
 */
import fs from "fs";
const path = "src/lib/store.ts";
let t = fs.readFileSync(path, "utf8");
if (t.includes("teamMembers") && t.includes('from "./team"')) {
  console.log("store ya tiene teamMembers");
  process.exit(0);
}
t = t.replace(
  'import type { GhCommit, GhRepoSummary } from "./github";',
  'import type { GhCommit, GhRepoSummary } from "./github";\nimport type { TeamMember } from "./team";\nimport { defaultTeam } from "./team";',
);
t = t.replace("  employees: Employee[];\n", "  employees: Employee[];\n  teamMembers: TeamMember[];\n");
t = t.replace(
  "  removeEmployee: (id: string) => void;\n",
  `  removeEmployee: (id: string) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  upsertTeamMember: (m: TeamMember) => void;
  removeTeamMember: (id: string) => void;
  checkInTeamMember: (id: string) => void;
  patchTeamMember: (id: string, patch: Partial<TeamMember>) => void;
`,
);
t = t.replace("  employees: [] as Employee[],\n", "  employees: [] as Employee[],\n  teamMembers: defaultTeam(),\n");
const old = `      removeEmployee: (id) =>
        set((s) => ({
          employees: (s.employees ?? []).filter((e) => e.id !== id),
        })),`;
const neu = old + `
      setTeamMembers: (teamMembers) => set({ teamMembers }),
      upsertTeamMember: (m) =>
        set((s) => {
          const list = s.teamMembers ?? [];
          const i = list.findIndex((x) => x.id === m.id);
          if (i >= 0) {
            const next = [...list];
            next[i] = m;
            return { teamMembers: next };
          }
          return { teamMembers: [...list, m] };
        }),
      removeTeamMember: (id) =>
        set((s) => ({ teamMembers: (s.teamMembers ?? []).filter((x) => x.id !== id) })),
      checkInTeamMember: (id) =>
        set((s) => ({
          teamMembers: (s.teamMembers ?? []).map((x) =>
            x.id === id ? { ...x, lastCheckInAt: new Date().toISOString() } : x,
          ),
        })),
      patchTeamMember: (id, patch) =>
        set((s) => ({
          teamMembers: (s.teamMembers ?? []).map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        })),`;
if (!t.includes(old)) {
  console.error("No encontré removeEmployee body");
  process.exit(1);
}
t = t.replace(old, neu);
t = t.replace('"employees"', '"employees", "teamMembers"');
t = t.replace(
  "employees: Array.isArray(p.employees) ? (p.employees as Employee[]) : [],",
  `employees: Array.isArray(p.employees) ? (p.employees as Employee[]) : [],
          teamMembers: Array.isArray(p.teamMembers) && (p.teamMembers as unknown[]).length
            ? (p.teamMembers as TeamMember[])
            : defaultTeam(),`,
);
fs.writeFileSync(path, t);
console.log("OK teamMembers aplicado a", path);
