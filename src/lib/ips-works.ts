/**
 * IPs WORKS — ubicación del portátil + última visita a HQ / apps.
 * Usa geolocalización del navegador + IP pública aproximada (ipify).
 */

export type DeviceLocationPing = {
  at: string;
  lat: number;
  lon: number;
  accuracyM?: number;
  place: string;
  publicIp: string;
  mapsUrl: string;
};

export function mapsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

export function formatAccessAt(iso: string | null | undefined): string {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `Hace ${days} d`;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchPublicIp(): Promise<string> {
  try {
    const r = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return "";
    const j = (await r.json()) as { ip?: string };
    return j.ip || "";
  } catch {
    return "";
  }
}

async function reversePlace(lat: number, lon: number): Promise<string> {
  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lon}&localityLanguage=es`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const j = (await r.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    const parts = [
      j.city || j.locality,
      j.principalSubdivision,
      j.countryName,
    ].filter(Boolean);
    return parts.length
      ? parts.join(", ")
      : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no disponible"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 5 * 60_000,
    });
  });
}

/** Captura ubicación + IP pública del dispositivo actual. */
export async function captureDeviceLocation(): Promise<
  | { ok: true; ping: DeviceLocationPing }
  | { ok: false; error: string }
> {
  try {
    const [pos, publicIp] = await Promise.all([
      getPosition(),
      fetchPublicIp(),
    ]);
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const place = await reversePlace(lat, lon);
    const ping: DeviceLocationPing = {
      at: new Date().toISOString(),
      lat,
      lon,
      accuracyM: pos.coords.accuracy
        ? Math.round(pos.coords.accuracy)
        : undefined,
      place,
      publicIp: publicIp || "—",
      mapsUrl: mapsUrl(lat, lon),
    };
    return { ok: true, ping };
  } catch (e) {
    const msg =
      e instanceof GeolocationPositionError
        ? e.code === 1
          ? "Permiso de ubicación denegado"
          : e.code === 2
            ? "Ubicación no disponible"
            : "Timeout de GPS"
        : e instanceof Error
          ? e.message
          : "No se pudo capturar ubicación";
    return { ok: false, error: msg };
  }
}
