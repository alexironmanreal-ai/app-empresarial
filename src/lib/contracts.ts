export type Contract = {
  id: string;
  title: string;
  description: string;
  done: boolean;
};

export const DEFAULT_CONTRACTS: Contract[] = [
  {
    id: "maker-hours",
    title: "Maker hours > Manager hours",
    description: "Mínimo 4h de trabajo profundo (maker) antes de reuniones/email.",
    done: false,
  },
  {
    id: "no-context-switch",
    title: "Zero context switching",
    description: "Un solo foco por bloque. Sin tabs de distracción.",
    done: false,
  },
  {
    id: "kill-non-critical",
    title: "Kill non-critical tasks",
    description: "Si no mueve YT hours, OS, producto o cash: kill.",
    done: false,
  },
  {
    id: "ship-daily",
    title: "Ship something daily",
    description: "Al menos 1 deliverable público o interno al final del día.",
    done: false,
  },
];
