import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

/** Comprime una imagen a data URL JPEG/PNG acotado (localStorage-friendly) */
export function compressImageFile(
  file: File,
  maxSide = 512,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(mime, quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

export function LogoUploader({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Solo imágenes (PNG, JPG, WebP, SVG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErr("Máximo 8 MB.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const dataUrl = await compressImageFile(file);
      onChange(dataUrl);
    } catch {
      setErr("No se pudo procesar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-elevated/40 p-6",
          value && "border-solid",
        )}
      >
        {value ? (
          <img
            src={value}
            alt="Logo empresa"
            className="max-h-32 max-w-full object-contain"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-xl bg-surface text-subtle">
            <ImagePlus className="size-8" strokeWidth={1.5} />
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Procesando…" : value ? "Cambiar logo" : "Subir logo"}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange("")}
            >
              <Trash2 className="size-3.5" />
              Quitar
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      <p className="text-xs text-muted">
        Se guarda en este dispositivo (y en la nube si tenés Supabase). Se
        comprime a ~512px.
      </p>
    </div>
  );
}

/** Logo compacto para sidebar / header */
export function CompanyLogo({
  src,
  company,
  size = "md",
}: {
  src: string;
  company: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "sm" ? "size-9" : size === "lg" ? "size-24" : "size-14";
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-elevated font-display text-accent shadow-[var(--shadow-border)]",
          box,
          size === "lg" && "text-3xl",
          size === "md" && "text-xl",
          size === "sm" && "text-sm",
        )}
        title={company}
      >
        {(company || "S").slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={company}
      className={cn(
        "rounded-xl object-contain shadow-[var(--shadow-border)]",
        box,
      )}
    />
  );
}
