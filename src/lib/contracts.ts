export type Contract = {
  id: string;
  title: string;
  rule: string;
  active: boolean;
};

export const DEFAULT_CONTRACTS: Contract[] = [
  {
    id: "c-os-hours",
    title: "Maker OS",
    rule: "≥15 h/semana de OS o no hay bloque de marca el viernes.",
    active: true,
  },
  {
    id: "c-outreach",
    title: "Pipeline",
    rule: "10 conversaciones de venta/semana o el viernes no cierra en YT.",
    active: true,
  },
  {
    id: "c-yt-streak",
    title: "Cadencia YT",
    rule: "1 video/semana. 2 fallos seguidos = review obligatoria del nicho.",
    active: true,
  },
  {
    id: "c-p0",
    title: "P0 primero",
    rule: "Sin P0 abiertos de legal/fiscal, no se empieza feature nueva del OS.",
    active: true,
  },
];
