import { useEffect, useState } from "react";
import {
  applyTheme,
  getStoredTheme,
  themesByGroup,
  type ThemeId,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";

function SwatchButton({
  id,
  label,
  swatch,
  active,
  onSelect,
}: {
  id: ThemeId;
  label: string;
  swatch: string;
  active: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  const isGradient = swatch.includes("gradient");
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      title={label}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-all",
        active
          ? "ring-2 ring-accent ring-offset-2 ring-offset-bg"
          : "hover:bg-elevated/50",
      )}
    >
      <span
        className="size-9 rounded-full border border-border shadow-inner"
        style={{
          background: isGradient ? swatch : undefined,
          backgroundColor: isGradient ? undefined : swatch,
        }}
      />
      <span
        className={cn(
          "max-w-[4.5rem] truncate text-center font-mono text-[10px]",
          active ? "text-fg" : "text-subtle group-hover:text-muted",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function select(id: ThemeId) {
    setTheme(id);
    applyTheme(id);
  }

  const basicos = themesByGroup("basicos");
  const metalizados = themesByGroup("metalizados");

  return (
    <div className="space-y-4">
      <div>
        <Label>Colores básicos</Label>
        <div className="mt-2 flex flex-wrap gap-1">
          {basicos.map((t) => (
            <SwatchButton
              key={t.id}
              id={t.id}
              label={t.label}
              swatch={t.swatch}
              active={theme === t.id}
              onSelect={select}
            />
          ))}
        </div>
      </div>
      <div>
        <Label>Metalizados · blur profesional</Label>
        <p className="mt-0.5 text-xs text-muted">
          Vidrio esmerilado, brillo sutil y superficies translúcidas.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {metalizados.map((t) => (
            <SwatchButton
              key={t.id}
              id={t.id}
              label={t.label}
              swatch={t.swatch}
              active={theme === t.id}
              onSelect={select}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
