/** Plan semanal fijo del tracker 365 */

export type Activity = {
  id: string;
  title: string;
  hours?: number;
};

/** 0=dom … 6=sáb (Date.getDay()) */
export function activitiesForWeekday(day: number): Activity[] {
  // Lun–Mié: OS
  if (day >= 1 && day <= 3) {
    return [
      { id: "cocinar", title: "Cocinar" },
      { id: "os-1", title: "1er bloque desarrollo OS", hours: 4 },
      { id: "tarea", title: "Tarea / estudio", hours: 1 },
      { id: "os-2", title: "2º bloque desarrollo OS", hours: 3 },
      { id: "ingles", title: "Inglés", hours: 1 },
      { id: "descansar", title: "Descansar" },
    ];
  }
  // Jue–Vie: YouTube
  if (day === 4 || day === 5) {
    return [
      { id: "cocinar", title: "Cocinar" },
      { id: "yt-1", title: "1er bloque YouTube (crecer + videos)", hours: 4 },
      { id: "tarea", title: "Tarea / estudio", hours: 1 },
      { id: "yt-2", title: "2º bloque YouTube (crecer + videos)", hours: 3 },
      { id: "ingles", title: "Inglés", hours: 1 },
      { id: "descansar", title: "Descansar" },
    ];
  }
  // Sáb–Dom: descanso
  return [{ id: "descansar", title: "Descanso / libre" }];
}

export function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfYear(year: number) {
  return new Date(year, 0, 1);
}

export function daysInYear(year: number) {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return leap ? 366 : 365;
}

export function dayIndexInYear(d: Date) {
  const start = startOfYear(d.getFullYear());
  const ms = d.getTime() - start.getTime();
  return Math.floor(ms / 86400000);
}

export function dayProgress(
  key: string,
  log: Record<string, Record<string, boolean>> | undefined,
) {
  const d = parseKey(key);
  const acts = activitiesForWeekday(d.getDay());
  if (acts.length === 0) return 1;
  const done = log?.[key] ?? {};
  const n = acts.filter((a) => done[a.id]).length;
  return n / acts.length;
}

export const WEEKDAY_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
