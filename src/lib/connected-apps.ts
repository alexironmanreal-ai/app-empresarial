/**
 * Catálogo de apps de productividad + actividades empresariales.
 */

export type AppActivity =
  | "ideas"
  | "finanzas"
  | "diseno"
  | "comunicacion"
  | "ia"
  | "codigo"
  | "docs"
  | "marketing"
  | "ops"
  | "otro";

export const APP_ACTIVITIES: { id: AppActivity; label: string }[] = [
  { id: "ideas", label: "Ideas / conocimiento" },
  { id: "finanzas", label: "Finanzas" },
  { id: "diseno", label: "Diseño" },
  { id: "comunicacion", label: "Comunicación" },
  { id: "ia", label: "IA / copiloto" },
  { id: "codigo", label: "Código" },
  { id: "docs", label: "Documentos" },
  { id: "marketing", label: "Marketing" },
  { id: "ops", label: "Operaciones" },
  { id: "otro", label: "Otro" },
];

export type AppCatalogItem = {
  key: string;
  name: string;
  defaultActivity: AppActivity;
  url: string;
  blurb: string;
};

/** Apps sugeridas para conectar (abrir en web / workspace). */
export const APP_CATALOG: AppCatalogItem[] = [
  {
    key: "notion",
    name: "Notion",
    defaultActivity: "ideas",
    url: "https://www.notion.so",
    blurb: "Wiki, docs y bases de datos",
  },
  {
    key: "obsidian",
    name: "Obsidian",
    defaultActivity: "ideas",
    url: "https://obsidian.md",
    blurb: "Notas locales / second brain",
  },
  {
    key: "whatsapp",
    name: "WhatsApp Web",
    defaultActivity: "comunicacion",
    url: "https://web.whatsapp.com",
    blurb: "Clientes y equipo",
  },
  {
    key: "slack",
    name: "Slack",
    defaultActivity: "comunicacion",
    url: "https://app.slack.com",
    blurb: "Chat interno",
  },
  {
    key: "telegram",
    name: "Telegram",
    defaultActivity: "comunicacion",
    url: "https://web.telegram.org",
    blurb: "Canales y grupos",
  },
  {
    key: "tradingview",
    name: "TradingView",
    defaultActivity: "finanzas",
    url: "https://www.tradingview.com",
    blurb: "Mercados y charts",
  },
  {
    key: "canva",
    name: "Canva",
    defaultActivity: "diseno",
    url: "https://www.canva.com",
    blurb: "Diseño rápido",
  },
  {
    key: "figma",
    name: "Figma",
    defaultActivity: "diseno",
    url: "https://www.figma.com",
    blurb: "UI / prototipos",
  },
  {
    key: "chatgpt",
    name: "ChatGPT",
    defaultActivity: "ia",
    url: "https://chatgpt.com",
    blurb: "Asistente OpenAI",
  },
  {
    key: "claude",
    name: "Claude",
    defaultActivity: "ia",
    url: "https://claude.ai",
    blurb: "Asistente Anthropic",
  },
  {
    key: "grok",
    name: "Grok",
    defaultActivity: "ia",
    url: "https://x.com/i/grok",
    blurb: "Asistente xAI",
  },
  {
    key: "gemini",
    name: "Gemini",
    defaultActivity: "ia",
    url: "https://gemini.google.com",
    blurb: "Asistente Google",
  },
  {
    key: "github",
    name: "GitHub",
    defaultActivity: "codigo",
    url: "https://github.com",
    blurb: "Repos y PRs",
  },
  {
    key: "linear",
    name: "Linear",
    defaultActivity: "ops",
    url: "https://linear.app",
    blurb: "Issues / sprints",
  },
  {
    key: "trello",
    name: "Trello",
    defaultActivity: "ops",
    url: "https://trello.com",
    blurb: "Tableros kanban",
  },
  {
    key: "drive",
    name: "Google Drive",
    defaultActivity: "docs",
    url: "https://drive.google.com",
    blurb: "Archivos en la nube",
  },
  {
    key: "docs",
    name: "Google Docs",
    defaultActivity: "docs",
    url: "https://docs.google.com",
    blurb: "Documentos",
  },
  {
    key: "sheets",
    name: "Google Sheets",
    defaultActivity: "finanzas",
    url: "https://sheets.google.com",
    blurb: "Hojas de cálculo",
  },
  {
    key: "calendar",
    name: "Google Calendar",
    defaultActivity: "ops",
    url: "https://calendar.google.com",
    blurb: "Agenda",
  },
  {
    key: "mailchimp",
    name: "Mailchimp",
    defaultActivity: "marketing",
    url: "https://mailchimp.com",
    blurb: "Email marketing",
  },
  {
    key: "meta-ads",
    name: "Meta Ads",
    defaultActivity: "marketing",
    url: "https://business.facebook.com",
    blurb: "Ads Facebook/Instagram",
  },
  {
    key: "miro",
    name: "Miro",
    defaultActivity: "ideas",
    url: "https://miro.com",
    blurb: "Pizarras colaborativas",
  },
];

export function activityLabel(id: AppActivity): string {
  return APP_ACTIVITIES.find((a) => a.id === id)?.label ?? id;
}

export function catalogByKey(key: string): AppCatalogItem | undefined {
  return APP_CATALOG.find((a) => a.key === key);
}
