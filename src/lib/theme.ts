/**
 * Temas de color del HQ — básicos y metalizados (blur profesional).
 * Preferencia en localStorage (por dispositivo); no depende de Supabase.
 */

export type ThemeId =
  | "sentinel"
  | "azul"
  | "rojo"
  | "purpura"
  | "ambar"
  | "gris"
  | "graphite"
  | "steel"
  | "gold"
  | "copper"
  | "platinum"
  | "titanium";

export type ThemeGroup = "basicos" | "metalizados";

export type ThemeDef = {
  id: ThemeId;
  label: string;
  group: ThemeGroup;
  /** Swatch para el selector */
  swatch: string;
  accent: string;
  metallic?: boolean;
};

export const THEMES: ThemeDef[] = [
  // —— Básicos ——
  {
    id: "sentinel",
    label: "Sentinel",
    group: "basicos",
    swatch: "#2f8f6a",
    accent: "#2f8f6a",
  },
  {
    id: "azul",
    label: "Azul",
    group: "basicos",
    swatch: "#3b82f6",
    accent: "#3b82f6",
  },
  {
    id: "rojo",
    label: "Rojo",
    group: "basicos",
    swatch: "#e11d48",
    accent: "#e11d48",
  },
  {
    id: "purpura",
    label: "Púrpura",
    group: "basicos",
    swatch: "#a855f7",
    accent: "#a855f7",
  },
  {
    id: "ambar",
    label: "Ámbar",
    group: "basicos",
    swatch: "#d97706",
    accent: "#d97706",
  },
  {
    id: "gris",
    label: "Gris",
    group: "basicos",
    swatch: "#94a3b8",
    accent: "#94a3b8",
  },
  // —— Metalizados ——
  {
    id: "graphite",
    label: "Grafito",
    group: "metalizados",
    swatch: "linear-gradient(135deg,#2a2d32,#6b7280 50%,#1f2226)",
    accent: "#9ca3af",
    metallic: true,
  },
  {
    id: "steel",
    label: "Acero",
    group: "metalizados",
    swatch: "linear-gradient(135deg,#1e293b,#94a3b8 45%,#334155)",
    accent: "#cbd5e1",
    metallic: true,
  },
  {
    id: "gold",
    label: "Oro",
    group: "metalizados",
    swatch: "linear-gradient(135deg,#3d2e12,#d4a017 50%,#5c4a1f)",
    accent: "#e8c547",
    metallic: true,
  },
  {
    id: "copper",
    label: "Cobre",
    group: "metalizados",
    swatch: "linear-gradient(135deg,#3b2418,#c47a4a 50%,#5c3424)",
    accent: "#e09a6a",
    metallic: true,
  },
  {
    id: "platinum",
    label: "Platino",
    group: "metalizados",
    swatch: "linear-gradient(135deg,#2c3038,#e2e8f0 48%,#4a5568)",
    accent: "#f1f5f9",
    metallic: true,
  },
  {
    id: "titanium",
    label: "Titanio",
    group: "metalizados",
    swatch: "linear-gradient(135deg,#1a1f24,#7dd3c0 42%,#2d3740)",
    accent: "#5eead4",
    metallic: true,
  },
];

const STORAGE_KEY = "sentinel-hq-theme-v1";
const DEFAULT_THEME: ThemeId = "sentinel";

export function isThemeId(v: string): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

export function getStoredTheme(): ThemeId {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isThemeId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function setStoredTheme(id: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Aplica data-theme + clase metallic en <html> */
export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const def = THEMES.find((t) => t.id === id) ?? THEMES[0]!;
  const root = document.documentElement;
  root.setAttribute("data-theme", def.id);
  root.classList.toggle("theme-metallic", !!def.metallic);
  setStoredTheme(def.id);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}

export function themesByGroup(group: ThemeGroup): ThemeDef[] {
  return THEMES.filter((t) => t.group === group);
}
