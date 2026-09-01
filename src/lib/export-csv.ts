/** Export helpers — CSV descargable desde el navegador */

function escapeCell(v: string | number | boolean | null | undefined) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ];
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
