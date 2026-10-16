/**
 * Verificación facial post-login (dispositivo).
 * - Enrolamiento: guarda plantilla local por userId (no sube a servidor).
 * - Verificación: cámara + rostro detectado + similitud de plantilla.
 * Usa FaceDetector nativo cuando existe; si no, heurística de presencia + match de histograma.
 */

const ENROLL_KEY = "sentinel-face-enroll-v1";
const UNLOCK_KEY = "sentinel-face-unlock-v1";
/** Minutos de sesión facial en esta pestaña */
const UNLOCK_TTL_MIN = 120;

export type FaceEnroll = {
  userId: string;
  templateDataUrl: string;
  histogram: number[];
  enrolledAt: string;
};

type UnlockPayload = { userId: string; until: number };

function enrollStore(): Record<string, FaceEnroll> {
  try {
    const raw = localStorage.getItem(ENROLL_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, FaceEnroll>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function writeEnrollStore(map: Record<string, FaceEnroll>) {
  localStorage.setItem(ENROLL_KEY, JSON.stringify(map));
}

export function getFaceEnroll(userId: string): FaceEnroll | null {
  return enrollStore()[userId] ?? null;
}

export function clearFaceEnroll(userId: string) {
  const map = enrollStore();
  delete map[userId];
  writeEnrollStore(map);
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function isFaceUnlocked(userId: string): boolean {
  try {
    const raw = sessionStorage.getItem(UNLOCK_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as UnlockPayload;
    if (p.userId !== userId) return false;
    if (Date.now() > p.until) {
      sessionStorage.removeItem(UNLOCK_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function markFaceUnlocked(userId: string) {
  const payload: UnlockPayload = {
    userId,
    until: Date.now() + UNLOCK_TTL_MIN * 60_000,
  };
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(payload));
}

export function lockFace() {
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function imageHistogram(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return Array(36).fill(0);
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const bins = Array(36).fill(0) as number[];
  const step = Math.max(1, Math.floor((width * height) / 8000));
  let n = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    bins[Math.min(11, Math.floor(r / 22))]! += 1;
    bins[12 + Math.min(11, Math.floor(g / 22))]! += 1;
    bins[24 + Math.min(11, Math.floor(b / 22))]! += 1;
    n += 1;
  }
  if (n === 0) return bins;
  return bins.map((v) => v / n);
}

export function histogramSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type FaceDetectResult = {
  faces: number;
  native: boolean;
};

export async function detectFacesInVideo(
  video: HTMLVideoElement,
): Promise<FaceDetectResult> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return { faces: 0, native: false };

  const FD = (
    window as unknown as {
      FaceDetector?: new (opts?: { fastMode?: boolean }) => {
        detect: (src: ImageBitmapSource) => Promise<{ boundingBox: DOMRectReadOnly }[]>;
      };
    }
  ).FaceDetector;

  if (typeof FD === "function") {
    try {
      const detector = new FD({ fastMode: true });
      const faces = await detector.detect(video);
      return { faces: faces.length, native: true };
    } catch {
      /* fallback */
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { faces: 0, native: false };
  ctx.drawImage(video, 0, 0, 64, 64);
  const img = ctx.getImageData(16, 16, 32, 32).data;
  let sum = 0;
  let sum2 = 0;
  const n = img.length / 4;
  for (let i = 0; i < img.length; i += 4) {
    const y = 0.299 * img[i]! + 0.587 * img[i + 1]! + 0.114 * img[i + 2]!;
    sum += y;
    sum2 += y * y;
  }
  const mean = sum / n;
  const variance = sum2 / n - mean * mean;
  const faces = variance > 180 && mean > 25 && mean < 230 ? 1 : 0;
  return { faces, native: false };
}

export function captureTemplateFromVideo(video: HTMLVideoElement): {
  dataUrl: string;
  histogram: number[];
} | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const side = Math.min(w, h);
  const sx = (w - side) / 2;
  const sy = (h - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  const histogram = imageHistogram(canvas);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  return { dataUrl, histogram };
}

export function enrollFace(
  userId: string,
  template: { dataUrl: string; histogram: number[] },
): FaceEnroll {
  const record: FaceEnroll = {
    userId,
    templateDataUrl: template.dataUrl,
    histogram: template.histogram,
    enrolledAt: new Date().toISOString(),
  };
  const map = enrollStore();
  map[userId] = record;
  writeEnrollStore(map);
  markFaceUnlocked(userId);
  return record;
}

export const FACE_MATCH_THRESHOLD = 0.86;

export function verifyAgainstEnroll(
  enroll: FaceEnroll,
  template: { histogram: number[] },
): { ok: boolean; score: number } {
  const score = histogramSimilarity(enroll.histogram, template.histogram);
  return { ok: score >= FACE_MATCH_THRESHOLD, score };
}

export function cameraSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}
