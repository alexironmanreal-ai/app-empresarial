import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { TASKS, WEIGHT } from "./data";
import type { Priority } from "./types";
import type { MpBalance } from "./mercadopago";
import type { YtChannelStats, YtVideoStat } from "./youtube";
import type { GhCommit, GhRepoSummary } from "./github";
import { createUserScopedStorage, getCurrentUserId, getSession, migrateUserHqStorage } from "./accounts";
import { loadHqFromCloud, saveHqToCloud } from "./cloud-sync";
import { isSupabaseConfigured } from "./supabase";
import type { Contract } from "./contracts";
import { DEFAULT_CONTRACTS } from "./contracts";
import { DEFAULT_CV, type CvData } from "./cv";

export type Currency = "USD" | "ARS";
export type Scenario = "conservative" | "base" | "optimistic";

export type Profile = {
  founder: string;
  company: string;
  os: string;
  youtube: string;
  niche: string;
  logoDataUrl: string;
  birthDate: string;
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
  lostReason?: string;
  winReason?: string;
  nextContactAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MonthClosure = {
  key: string;
  closedAt: string;
  cobradoArs: number;
  perdidoArs: number;
  cobradoCount: number;
  perdidoCount: number;
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
  monthClosures: MonthClosure[];
  ghRepoInput: string;
  ghToken: string;
  ghSummary: GhRepoSummary | null;
  ghCommits: GhCommit[];
  deepWork: boolean;
  cv: CvData;
  contracts: Contract[];
  killedTaskIds: string[];
  algorithmDone: Record<string, boolean>;
  paidExpenseIds: string[];
  arsPerUsd: number;
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
  closeMonth: (closure: MonthClosure) => void;
  setGhRepoInput: (v: string) => void;
  setGhToken: (v: string) => void;
  setGhData: (summary: GhRepoSummary | null, commits: GhCommit[]) => void;
  setDeepWork: (v: boolean) => void;
  setCv: (p: Partial<CvData>) => void;
  setLogo: (dataUrl: string) => void;
  toggleExpensePaid: (id: string) => void;
  setArsPerUsd: (n: number) => void;
  toggleContract: (id: string) => void;
  killTask: (id: string) => void;
  reviveTask: (id: string) => void;
  toggleAlgorithmStep: (taskId: string, stepId: string) => void;
  reset: () => void;
};

const DEFAULT_PROFILE: Profile = {
  founder: "Founder",
  company: "Sentinel",
  os: "Sentinel OS",
  youtube: "Sentinel",
  niche: "Construir un sistema operativo en público + el oficio de CEO",
  logoDataUrl: "",
  birthDate: "",
};

const DEFAULT_CAJA: CajaRow[] = [
  { id: "mp", name: "Mercado Pago", ars: 0, source: "mp" },
  { id: "banco", name: "Banco / cuenta SAS", ars: 0, source: "manual" },
  { id: "efectivo", name: "Efectivo", ars: 0, source: "manual" },
];

const initialState = {
  done: {} as Record<string, boolean>,
  profile: DEFAULT_PROFILE,
  currency: "ARS" as Currency,
  scenario: "base" as Scenario,
  onboarded: false,
  focusP0: false,
  mpToken: "",
  mpBalance: null as MpBalance | null,
  caja: DEFAULT_CAJA,
  dayLog: {} as Record<string, Record<string, boolean>>,
  dayNotes: {} as Record<string, string>,
  daySnapshots: {} as Record<string, DaySnapshot>,
  lastReviewAt: null as string | null,
  extraMonthlyBurnArs: 0,
  ytApiKey: "",
  ytChannelInput: "",
  ytStats: null as YtChannelStats | null,
  ytVideos: [] as YtVideoStat[],
  ytHistory: [] as YtHistoryPoint[],
  leads: [] as Lead[],
  monthClosures: [] as MonthClosure[],
  ghRepoInput: "",
  ghToken: "",
  ghSummary: null as GhRepoSummary | null,
  ghCommits: [] as GhCommit[],
  deepWork: false,
  contracts: DEFAULT_CONTRACTS,
  killedTaskIds: [] as string[],
  algorithmDone: {} as Record<string, boolean>,
  cv: DEFAULT_CV as CvData,
  paidExpenseIds: [] as string[],
  arsPerUsd: 1400,
};

export const useHq = create<HqState>()(
  persist(
    (set) => ({
      ...initialState,
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
          leads: s.leads.map((l) => {
            if (l.id !== id) return l;
            const next = { ...l, ...patch, updatedAt: new Date().toISOString() };
            if (patch.stage === "cobrado" && !next.winReason) {
              next.winReason = `Pipeline · ${next.offer || "oferta"} · ${next.name}`;
            }
            return next;
          }),
        })),
      removeLead: (id) =>
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
      closeMonth: (closure) =>
        set((s) => {
          const rest = (s.monthClosures ?? []).filter((m) => m.key !== closure.key);
          return {
            monthClosures: [...rest, closure].sort((a, b) => a.key.localeCompare(b.key)),
          };
        }),
      setGhRepoInput: (ghRepoInput) => set({ ghRepoInput }),
      setGhToken: (ghToken) => set({ ghToken }),
      setGhData: (ghSummary, ghCommits) => set({ ghSummary, ghCommits }),
      setDeepWork: (deepWork) => set({ deepWork }),
      toggleContract: (id) =>
        set((s) => ({
          contracts: s.contracts.map((c) =>
            c.id === id ? { ...c, active: !c.active } : c,
          ),
        })),
      killTask: (id) =>
        set((s) => ({
          killedTaskIds: s.killedTaskIds.includes(id)
            ? s.killedTaskIds
            : [...s.killedTaskIds, id],
        })),
      reviveTask: (id) =>
        set((s) => ({
          killedTaskIds: s.killedTaskIds.filter((x) => x !== id),
        })),
      toggleAlgorithmStep: (taskId, stepId) =>
        set((s) => {
          const key = `${taskId}:${stepId}`;
          return {
            algorithmDone: {
              ...s.algorithmDone,
              [key]: !s.algorithmDone[key],
            },
          };
        }),
      setCv: (patch) =>
        set((s) => ({
          cv: { ...s.cv, ...patch },
        })),
      setLogo: (logoDataUrl) =>
        set((s) => ({
          profile: { ...s.profile, logoDataUrl },
        })),
      toggleExpensePaid: (id) =>
        set((s) => ({
          paidExpenseIds: s.paidExpenseIds.includes(id)
            ? s.paidExpenseIds.filter((x) => x !== id)
            : [...s.paidExpenseIds, id],
        })),
      setArsPerUsd: (arsPerUsd) => set({ arsPerUsd }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: "axion-hq-v6",
      storage: createJSONStorage(() => createUserScopedStorage("axion-hq-v6")),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        return {
          ...current,
          ...p,
          profile: {
            ...DEFAULT_PROFILE,
            ...((p.profile as object) ?? {}),
          },
          cv: {
            ...DEFAULT_CV,
            ...((p.cv as object) ?? {}),
          },
          contracts:
            Array.isArray(p.contracts) && (p.contracts as unknown[]).length
              ? (p.contracts as typeof DEFAULT_CONTRACTS)
              : DEFAULT_CONTRACTS,
          paidExpenseIds: Array.isArray(p.paidExpenseIds)
            ? (p.paidExpenseIds as string[])
            : [],
          arsPerUsd:
            typeof p.arsPerUsd === "number" && Number.isFinite(p.arsPerUsd)
              ? (p.arsPerUsd as number)
              : 1400,
          leads: Array.isArray(p.leads) ? (p.leads as Lead[]) : [],
          monthClosures: Array.isArray(p.monthClosures)
            ? (p.monthClosures as MonthClosure[])
            : [],
          ghCommits: Array.isArray(p.ghCommits) ? (p.ghCommits as GhCommit[]) : [],
        } as typeof current;
      },
    },
  ),
);

const PERSIST_KEYS = [
  "done",
  "profile",
  "currency",
  "scenario",
  "onboarded",
  "focusP0",
  "mpToken",
  "mpBalance",
  "caja",
  "dayLog",
  "dayNotes",
  "daySnapshots",
  "lastReviewAt",
  "extraMonthlyBurnArs",
  "ytApiKey",
  "ytChannelInput",
  "ytStats",
  "ytVideos",
  "ytHistory",
  "leads",
  "monthClosures",
  "ghRepoInput",
  "ghToken",
  "ghSummary",
  "ghCommits",
  "deepWork",
  "contracts",
  "killedTaskIds",
  "algorithmDone",
  "cv",
  "paidExpenseIds",
  "arsPerUsd",
] as const;

export function pickHqSlice(state: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of PERSIST_KEYS) {
    if (k in state) out[k] = state[k];
  }
  return out;
}

let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;
let cloudSyncStarted = false;

export function scheduleCloudSave() {
  const session = getSession();
  if (!session || session.mode !== "cloud" || !isSupabaseConfigured) return;
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    void flushCloudSave();
  }, 600);
}

export async function flushCloudSave() {
  const session = getSession();
  if (!session || session.mode !== "cloud" || !isSupabaseConfigured) return;
  const slice = pickHqSlice(useHq.getState() as unknown as Record<string, unknown>);
  await saveHqToCloud(session.userId, slice);
}

export function startCloudSync() {
  if (cloudSyncStarted) return;
  cloudSyncStarted = true;
  useHq.subscribe(() => {
    scheduleCloudSave();
  });
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      void flushCloudSave();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flushCloudSave();
    });
  }
}

export async function switchHqUser() {
  const uid = getCurrentUserId();
  if (!uid) {
    useHq.setState({ ...initialState });
    return;
  }
  migrateUserHqStorage(uid);
  useHq.setState({ ...initialState });
  await useHq.persist.rehydrate();

  const session = getSession();
  if (session?.mode === "cloud" && isSupabaseConfigured) {
    const remote = await loadHqFromCloud(uid);
    if (remote && Object.keys(remote).length > 0) {
      useHq.setState({ ...remote });
    } else {
      await flushCloudSave();
    }
    startCloudSync();
  }
}

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
