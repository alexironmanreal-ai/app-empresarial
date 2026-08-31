import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TASKS, WEIGHT } from "./data";
import type { Priority } from "./types";

export type Currency = "USD" | "ARS";
export type Scenario = "conservative" | "base" | "optimistic";

export type Profile = {
  founder: string;
  company: string;
  os: string;
  youtube: string;
  niche: string;
};

type HqState = {
  done: Record<string, boolean>;
  profile: Profile;
  currency: Currency;
  scenario: Scenario;
  onboarded: boolean;
  focusP0: boolean;
  toggle: (id: string) => void;
  setDone: (id: string, value: boolean) => void;
  setProfile: (p: Partial<Profile>) => void;
  setCurrency: (c: Currency) => void;
  setScenario: (s: Scenario) => void;
  setOnboarded: (v: boolean) => void;
  setFocusP0: (v: boolean) => void;
  reset: () => void;
};

const DEFAULT_PROFILE: Profile = {
  founder: "Founder",
  company: "Axion",
  os: "Axion OS",
  youtube: "Axion",
  niche: "Construir un sistema operativo en público + el oficio de CEO",
};

export const useHq = create<HqState>()(
  persist(
    (set) => ({
      done: {},
      profile: DEFAULT_PROFILE,
      currency: "USD",
      scenario: "base",
      onboarded: false,
      focusP0: false,
      toggle: (id) => set((s) => ({ done: { ...s.done, [id]: !s.done[id] } })),
      setDone: (id, value) => set((s) => ({ done: { ...s.done, [id]: value } })),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setCurrency: (currency) => set({ currency }),
      setScenario: (scenario) => set({ scenario }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setFocusP0: (focusP0) => set({ focusP0 }),
      reset: () =>
        set({
          done: {},
          profile: DEFAULT_PROFILE,
          currency: "USD",
          scenario: "base",
          onboarded: false,
          focusP0: false,
        }),
    }),
    { name: "axion-hq-v2" },
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
