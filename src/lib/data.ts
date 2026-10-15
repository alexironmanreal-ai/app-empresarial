import type { Task } from "./types";
import { TASKS_A } from "./data-tasks-a";
import { TASKS_B } from "./data-tasks-b";

export const TASKS: Task[] = [...TASKS_A, ...TASKS_B];

export {
  GAPS,
  INCOME,
  EXPENSES,
  WEALTH,
  WEALTH_NOTES,
  YT_MILESTONES,
  YT_PILLARS,
  YT_TITLES,
  OS_MODULES,
  OS_PHASES,
  RATE_CARD,
  CEO_CADENCE,
  TIME_GOALS,
} from "./data-meta";

export const WEIGHT: Record<Task["priority"], number> = {
  p0: 4,
  p1: 3,
  p2: 2,
  p3: 1,
};

export function taskById(id: string) {
  return TASKS.find((t) => t.id === id);
}
