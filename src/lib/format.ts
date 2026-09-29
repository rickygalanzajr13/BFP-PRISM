// Deterministic Manila-time formatting (avoids SSR/client locale differences).
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function manila(iso: string) {
  const d = new Date(new Date(iso).getTime() + 8 * 3600 * 1000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), m: d.getUTCMinutes() };
}
export function fmtTime(iso: string) {
  const { h, m } = manila(iso);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
export function fmtDate(iso: string) {
  const { y, mo, d } = manila(iso);
  return `${MONTHS[mo]} ${d}, ${y}`;
}
export function fmtShortDate(iso: string) {
  const { y, mo, d } = manila(iso);
  return `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export function fmtDuration(s: number | null) {
  if (s == null) return "—";
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
