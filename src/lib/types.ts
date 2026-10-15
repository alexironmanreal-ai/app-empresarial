export type Priority = "p0" | "p1" | "p2" | "p3";
export type Category =
  | "legal"
  | "fiscal"
  | "marca"
  | "ops"
  | "youtube"
  | "os"
  | "ingresos"
  | "ceo";

export type Subtask = {
  id: string;
  title: string;
};

export type ChartPoint = {
  label: string;
  done: number;
  skip: number;
};

export type Task = {
  id: string;
  title: string;
  why: string;
  how: string[];
  priority: Priority;
  category: Category;
  days: number;
  costUsd: number;
  spendNote: string;
  chargeUsd: number;
  chargeNote: string;
  impact: number;
  unlocks: string;
  subtasks: Subtask[];
  chart: ChartPoint[];
};

export type IncomeStream = {
  id: string;
  name: string;
  when: string;
  price: string;
  y1: number;
  y5: number;
  y10: number;
  notes: string;
};

export type ExpenseItem = {
  id: string;
  name: string;
  kind: "once" | "month" | "year";
  usd: number;
  neededFor: string;
  notes: string;
};

export type WealthPoint = {
  year: number;
  conservative: number;
  base: number;
  optimistic: number;
};

export type OsModule = {
  id: string;
  name: string;
  layer: string;
  months: number;
  depends: string;
  deliverable: string;
  chart: ChartPoint[];
};

export type YtMilestone = {
  month: number;
  subs: number;
  viewsMonth: number;
  revenue: number;
  focus: string;
};

export type Gap = {
  id: string;
  area: string;
  now: string;
  missing: string;
  time: string;
  costUsd: number;
};

/** Meta de largo plazo con curva de horas/años restantes */
export type TimeGoal = {
  id: string;
  title: string;
  description: string;
  /** Horas totales estimadas para completar desde cero */
  hoursTotal: number;
  /** Años estimados a ritmo sostenible (h/semana típicas) */
  yearsEstimate: number;
  /** Horas semanales asumidas para el cálculo de años */
  hoursPerWeek: number;
  /** Categoría para filtrar / colorear */
  category: "youtube" | "os" | "skill" | "empresa" | "network" | "revenue";
  /** Criterio de "hecho" legible */
  doneWhen: string;
  /** IDs de tareas del tablero que aportan progreso (opcional) */
  linkedTaskIds?: string[];
  /** Estado inicial (0–100). Se combina con tareas hechas y datos live (YT, GH) */
  baselinePct: number;
  /** Orden de visualización */
  order: number;
};
