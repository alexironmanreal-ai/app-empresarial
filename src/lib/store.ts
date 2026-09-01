import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TASKS, WEIGHT } from "./data";
import type { Priority } from "./types";
import type { MpBalance } from "./mercadopago";
import type { YtChannelStats, YtVideoStat } from "./youtube";
import type { GhCommit, GhRepoSummary } from "./github";

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

export type DaySnapshot = {
  date: string;
  companyPct: number;
  p0Open: number;
  cajaArs: number;
  dayProgress: number;
  note: string;
  closedAt: string;
};

export type YtHistoryPoint = {
  at: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
};

export type LeadStage =
  | "contactado"
  | "call"
  | "propuesta"
  | "cobrado"
  | "perdido";

export type Lead = {
  id: string;
  name: string;
  contact: string;
  offer: string;
  amountArs: number;
  stage: LeadStage;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
  dayLog: Record<string, Record<string, boolean>>;
  dayNotes: Record<string, string>;
  daySnapshots: Record<string, DaySnapshot>;
  lastReviewAt: string | null;
  extraMonthlyBurnArs: number;
  ytApiKey: string;
  ytChannelInput: string;
  ytStats: YtChannelStats | null;
  ytVideos: YtVideoStat[];
  ytHistory: YtHistoryPoint[];
  leads: Lead[];
  ghRepoInput: string;
  ghToken: string;
  ghSummary: GhRepoSummary | null;
  ghCommits: GhCommit[];
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
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  removeLead: (id: string) => void;
  setGhRepoInput: (v: string) => void;
  setGhToken: (v: string) => void;
  setGhData: (summary: GhRepoSummary | null, commits: GhCommit[]) => void;
  reset: () => void;
};

const DEFAULT_PROFILE: Profile = {
  founder: "Founder",
  company: "Sentinel",
  os: "Sentinel OS",
  youtube: "Sentinel",
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
      ytHistory: [],
      leads: [],
      ghRepoInput: "",
      ghToken: "",
      ghSummary: null,
      ghCommits: [],
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
        set((s) => {
          let ytHistory = s.ytHistory;
          if (ytStats) {
            const point: YtHistoryPoint = {
              at: ytStats.fetchedAt,
              subscriberCount: ytStats.subscriberCount,
              viewCount: ytStats.viewCount,
              videoCount: ytStats.videoCount,
            };
            ytHistory = [...s.ytHistory, point].slice(-90);
          }
          return {
            ytStats,
            ytVideos: videos !== undefined ? videos : s.ytVideos,
            ytHistory,
          };
        }),
      addLead: (lead) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            leads: [
              {
                ...lead,
                id: `L-${Date.now()}`,
                createdAt: now,
                updatedAt: now,
              },
              ...s.leads,
            ],
          };
        }),
      updateLead: (id, patch) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id
              ? { ...l, ...patch, updatedAt: new Date().toISOString() }
              : l,
          ),
        })),
      removeLead: (id) =>
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
      setGhRepoInput: (ghRepoInput) => set({ ghRepoInput }),
      setGhToken: (ghToken) => set({ ghToken }),
      setGhData: (ghSummary, ghCommits) => set({ ghSummary, ghCommits }),
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
          ytHistory: [],
          leads: [],
          ghRepoInput: "",
          ghToken: "",
          ghSummary: null,
          ghCommits: [],
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

export const LEAD_STAGES: { id: LeadStage; label: string }[] = [
  { id: "contactado", label: "Contactado" },
  { id: "call", label: "Call" },
  { id: "propuesta", label: "Propuesta" },
  { id: "cobrado", label: "Cobrado" },
  { id: "perdido", label: "Perdido" },
];
