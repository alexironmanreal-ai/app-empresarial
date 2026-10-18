/**
 * Clima de la ubicación del usuario (geolocalización + Open-Meteo).
 * Sin API key. Si deniega GPS, cae a Buenos Aires.
 * Fallos de red se muestran amigables (no se toca Supabase).
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type WxState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      tempC: number;
      feelsC: number;
      humidity: number;
      windKmh: number;
      code: number;
      label: string;
      place: string;
      lat: number;
      lon: number;
    };

const WMO: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla escarchada",
  51: "Llovizna leve",
  53: "Llovizna",
  55: "Llovizna fuerte",
  61: "Lluvia leve",
  63: "Lluvia",
  65: "Lluvia fuerte",
  71: "Nieve leve",
  73: "Nieve",
  75: "Nieve fuerte",
  80: "Chubascos",
  81: "Chubascos",
  82: "Chubascos fuertes",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta con granizo",
};

function codeLabel(code: number) {
  return WMO[code] ?? `Código ${code}`;
}

function netMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e ?? "");
  if (
    /networkerror|failed to fetch|load failed|network request failed|aborterror/i.test(
      m,
    )
  ) {
    return "Sin conexión al servicio de clima (reintentá más tarde)";
  }
  return m || "Error de clima";
}

async function reversePlace(lat: number, lon: number): Promise<string> {
  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lon}&localityLanguage=es`;
    const r = await fetch(url);
    if (!r.ok) return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    const j = (await r.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    const parts = [j.city || j.locality, j.principalSubdivision].filter(Boolean);
    return parts.length ? parts.join(", ") : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  } catch {
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  }
}

async function fetchWx(lat: number, lon: number): Promise<WxState> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto&wind_speed_unit=kmh`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo obtener el clima");
  const j = (await r.json()) as {
    current?: {
      temperature_2m?: number;
      apparent_temperature?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
  };
  const c = j.current;
  if (!c || c.temperature_2m == null) throw new Error("Respuesta de clima vacía");
  const code = Number(c.weather_code) || 0;
  const place = await reversePlace(lat, lon);
  return {
    status: "ok",
    tempC: Math.round(c.temperature_2m),
    feelsC: Math.round(c.apparent_temperature ?? c.temperature_2m),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    windKmh: Math.round(c.wind_speed_10m ?? 0),
    code,
    label: codeLabel(code),
    place,
    lat,
    lon,
  };
}

const FALLBACK = { lat: -34.6037, lon: -58.3816 };

export function LocalWeather({ className }: { className?: string }) {
  const [wx, setWx] = useState<WxState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load(lat: number, lon: number) {
      try {
        const data = await fetchWx(lat, lon);
        if (!cancelled) setWx(data);
      } catch (e) {
        if (!cancelled) {
          setWx({
            status: "error",
            message: netMsg(e),
          });
        }
      }
    }

    if (!navigator.geolocation) {
      void load(FALLBACK.lat, FALLBACK.lon);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void load(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        void load(FALLBACK.lat, FALLBACK.lon);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );

    const id = window.setInterval(() => {
      if (!navigator.geolocation) {
        void load(FALLBACK.lat, FALLBACK.lon);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => void load(pos.coords.latitude, pos.coords.longitude),
        () => void load(FALLBACK.lat, FALLBACK.lon),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
      );
    }, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className={cn("mt-3 border-t border-border/60 pt-3", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
        Clima · tu ubicación
      </p>
      {wx.status === "loading" ? (
        <p className="mt-1 text-sm text-muted">Detectando…</p>
      ) : wx.status === "error" ? (
        <p className="mt-1 text-sm text-muted">{wx.message}</p>
      ) : (
        <>
          <p className="mt-1 font-display text-2xl tabular-nums">
            {wx.tempC}°
            <span className="ml-1 text-sm font-normal text-muted">{wx.label}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Sensación {wx.feelsC}° · Hum {wx.humidity}% · Viento {wx.windKmh} km/h
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-subtle" title={wx.place}>
            {wx.place}
          </p>
        </>
      )}
    </div>
  );
}
