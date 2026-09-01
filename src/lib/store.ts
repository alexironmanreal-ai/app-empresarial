import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TASKS, WEIGHT } from "./data";
import type { Priority } from "./types";
import type { MpBalance } from "./mercadopago";
import type { YtChannelStats, YtVideoStat } from "./youtube";

export type Currency = "USD" | "ARS";
export type Scenario = "conservative" | "base" | "optimistic";

export type Profile = {
  founder: string;
  company: string;
  os: string;
  youtube: string;
  niche: string;
};

export type CajaRow = {
  id: string;
  name: string;
  ars: number;
  source: "mp" | "manual";
};

/** Snapshot al cerrar / registrar un día */
export type DaySnapshot = {
  date: string; // YYYY-MM-DD
  companyPct: number;
  p0Open: number;
  cajaArs: number;
  dayProgress: number; // 0–1
  note: string;
  closedAt: string; // ISO
};

type HqState = {
  done: Record<string, boolean>;
  profile: Profile;
  currency: Currency;
  scenario: Scenario;
  onboarded: boolean;
  focusP0: boolean;
  mpToken: string;
  mpBalance: MpBalance | null;
  caja: CajaRow[];
  /** dateKey YYYY-MM-DD → activityId → done */
  dayLog: Record<string, Record<string, boolean>>;
  /** Notas libres por día */
  dayNotes: Record<string, string>;
  /** Snapshots oficiales al "cerrar el día" */
  daySnapshots: Record<string, DaySnapshot>;
  /** ISO timestamp de la última review semanal cerrada */
  lastReviewAt: string | null;
  /** Burn mensual extra que el founder carga a mano (ARS) */
  extraMonthlyBurnArs: number;
  /** YouTube Data API */
  ytApiKey: string;
  ytChannelInput: string; // handle, URL o UC…
  ytStats: YtChannelStats | null;
  ytVideos: YtVideoStat[];
  toggle: (id: string) => void;
  setDone: (id: string, value: boolean) => void;
  setProfile: (p: Partial<Profile>) => void;
  setCurrency: (c: Currency) => void;
  setScenario: (s: Scenario) => void;
  setOnboarded: (v: boolean) => void;
  setFocusP0: (v: boolean) => void;
  setMpToken: (t: string) => void;
  setMpBalance: (b: MpBalance | null) => void;
  setCajaRow: (id: string, patch: Partial<CajaRow>) => void;
  addCajaRow: (name: string, ars: number) => void;
  removeCajaRow: (id: string) => void;
  syncMpIntoCaja: (b: MpBalance) => void;
  toggleDayActivity: (date: string, activityId: string) => void;
  setDayNote: (date: string, note: string) => void;
  closeDay: (snapshot: DaySnapshot) => void;
  markReview: () => void;
  setExtraMonthlyBurnArs: (n: number) => void;
  setYtApiKey: (k: string) => void;
  setYtChannelInput: (v: string) => void;
  setYtStats: (s: YtChannelStats | null, videos?: YtVideoStat[]) => void;
  reset: () => void;
};

const DEFAULT_PROFILE: Profile = {
  founder: "Founder",
  company: "Axion",
  os: "Axion OS",
  youtube: "Axion",
  niche: "Construir un sistema operativo en público + el oficio de CEO",
};

const DEFAULT_CAJA: CajaRow[] = [
  { id: "mp", name: "Mercado Pago", ars: 0, source: "mp" },
  { id: "banco", name: "Banco / cuenta SAS", ars: 0, source: "manual" },
  { id: "efectivo", name: "Efectivo", ars: 0, source: "manual" },
];

export const useHq = create<HqState>()(
  persist(
    (set) => ({
      done: {},
      profile: DEFAULT_PROFILE,
      currency: "ARS",
      scenario: "base",
      onboarded: false,
      focusP0: false,
      mpToken: "",
      mpBalance: null,
      caja: DEFAULT_CAJA,
      dayLog: {},
      dayNotes: {},
      daySnapshots: {},
      lastReviewAt: null,
      extraMonthlyBurnArs: 0,
      ytApiKey: "",
      ytChannelInput: "",
      ytStats: null,
      ytVideos: [],
      toggle: (id) => set((s) => ({ done: { ...s.done, [id]: !s.done[id] } })),
      setDone: (id, value) => set((s) => ({ done: { ...s.done, [id]: value } })),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setCurrency: (currency) => set({ currency }),
      setScenario: (scenario) => set({ scenario }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setFocusP0: (focusP0) => set({ focusP0 }),
      setMpToken: (mpToken) => set({ mpToken }),
      setMpBalance: (mpBalance) => set({ mpBalance }),
      setCajaRow: (id, patch) =>
        set((s) => ({
          caja: s.caja.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      addCajaRow: (name, ars) =>
        set((s) => ({
          caja: [
            ...s.caja,
            { id: `m-${Date.now()}`, name, ars, source: "manual" as const },
          ],
        })),
      removeCajaRow: (id) =>
        set((s) => ({
          caja: s.caja.filter((r) => r.id !== id || r.source === "mp"),
        })),
      syncMpIntoCaja: (b) =>
        set((s) => {
          const has = s.caja.some((r) => r.id === "mp");
          const row: CajaRow = {
            id: "mp",
            name: "Mercado Pago",
            ars: b.availableArs,
            source: "mp",
          };
          return {
            mpBalance: b,
            caja: has
              ? s.caja.map((r) => (r.id === "mp" ? row : r))
              : [row, ...s.caja],
          };
        }),
      toggleDayActivity: (date, activityId) =>
        set((s) => {
          const day = { ...(s.dayLog[date] ?? {}) };
          day[activityId] = !day[activityId];
          return { dayLog: { ...s.dayLog, [date]: day } };
        }),
      setDayNote: (date, note) =>
        set((s) => ({
          dayNotes: { ...s.dayNotes, [date]: note },
        })),
      closeDay: (snapshot) =>
        set((s) => ({
          daySnapshots: { ...s.daySnapshots, [snapshot.date]: snapshot },
          dayNotes: {
            ...s.dayNotes,
            [snapshot.date]: snapshot.note || s.dayNotes[snapshot.date] || "",
          },
        })),
      markReview: () => set({ lastReviewAt: new Date().toISOString() }),
      setExtraMonthlyBurnArs: (extraMonthlyBurnArs) => set({ extraMonthlyBurnArs }),
      setYtApiKey: (ytApiKey) => set({ ytApiKey }),
      setYtChannelInput: (ytChannelInput) => set({ ytChannelInput }),
      setYtStats: (ytStats, videos) =>
        set((s) => ({
          ytStats,
          ytVideos: videos !== undefined ? videos : s.ytVideos,
        })),
      reset: () =>
        set({
          done: {},
          profile: DEFAULT_PROFILE,
          currency: "ARS",
          scenario: "base",
          onboarded: false,
          focusP0: false,
          mpToken: "",
          mpBalance: null,
          caja: DEFAULT_CAJA,
          dayLog: {},
          dayNotes: {},
          daySnapshots: {},
          lastReviewAt: null,
          extraMonthlyBurnArs: 0,
          ytApiKey: "",
          ytChannelInput: "",
          ytStats: null,
          ytVideos: [],
        }),
    }),
    { name: "axion-hq-v4" },
  ),
);

export function isTaskComplete(
  taskId: string,
  subtaskIds: string[],
  done: Record<string, boolean>,
) {
  if (done[taskId]) return true;
  if (subtaskIds.length === 0) return false;
  return subtaskIds.every((id) => done[id]);
}

export function taskProgress(
  taskId: string,
  subtaskIds: string[],
  done: Record<string, boolean>,
) {
  if (done[taskId]) return 1;
  if (subtaskIds.length === 0) return 0;
  const n = subtaskIds.filter((id) => done[id]).length;
  return n / subtaskIds.length;
}

export function companyScore(done: Record<string, boolean>) {
  let total = 0;
  let got = 0;
  for (const t of TASKS) {
    const w = WEIGHT[t.priority];
    total += w;
    if (isTaskComplete(t.id, t.subtasks.map((s) => s.id), done)) got += w;
    else {
      const p = taskProgress(t.id, t.subtasks.map((s) => s.id), done);
      got += w * p;
    }
  }
  return total === 0 ? 0 : got / total;
}

export function scoreByPriority(done: Record<string, boolean>, p: Priority) {
  const list = TASKS.filter((t) => t.priority === p);
  if (list.length === 0) return 0;
  const n = list.filter((t) =>
    isTaskComplete(t.id, t.subtasks.map((s) => s.id), done),
  ).length;
  return n / list.length;
}

export function cajaTotalArs(caja: CajaRow[]) {
  return caja.reduce((a, r) => a + (Number(r.ars) || 0), 0);
}
