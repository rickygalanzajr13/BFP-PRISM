// Display helpers for hybrid power telemetry. Battery condition is classified by the
// firmware/backend using thresholds configured for the actual LiPo + sensing circuit;
// the UI never derives health or capacity from voltage alone.
import type { Device, PowerEvent, Incident } from "./types";
import type { Tone } from "@/components/prism/ui";

/** Device is considered stale if no power update within this window. */
export const POWER_STALE_MS = 15 * 60 * 1000;

export const isPowerStale = (d: Device, now = Date.now()) =>
  !d.lastPowerUpdateAt || now - new Date(d.lastPowerUpdateAt).getTime() > POWER_STALE_MS || d.status === "Offline";

export function powerSourceLabel(d: Device): { label: string; tone: Tone } {
  if (d.powerTelemetry !== "supported") return { label: "Unavailable — not installed", tone: "offline" };
  switch (d.powerSource) {
    case "external": return { label: "External Power", tone: "normal" };
    case "battery": return { label: "Backup Battery", tone: "warning" };
    case "unavailable": return { label: "Power Unavailable", tone: "critical" };
    default: return { label: "Unknown", tone: "offline" };
  }
}

export function batteryConditionLabel(d: Pick<Device, "batteryCondition">): { label: string; tone: Tone } {
  switch (d.batteryCondition) {
    case "normal": return { label: "Voltage Normal", tone: "normal" };
    case "low": return { label: "Low Battery", tone: "warning" };
    case "critical": return { label: "Critical Battery", tone: "critical" };
    default: return { label: "Unknown", tone: "offline" };
  }
}

export function readinessLabel(d: Device): string {
  if (d.powerTelemetry !== "supported") return "Unavailable";
  if (d.backupReadiness === "verified") return "Backup Verified (load test)";
  if (d.backupReadiness === "not_verified") return d.batteryCondition === "normal" ? "Voltage Normal — Backup Capacity Not Verified" : "Backup Capacity Not Verified";
  return "Unknown";
}

export const fmtVoltage = (v: number | null) => (v == null ? "Unavailable" : `${v.toFixed(2)} V`);

export const POWER_FILTERS = ["External Power", "Backup Battery", "Low Battery", "Critical Battery", "Unknown"] as const;
export function matchesPowerFilter(d: Device, f: string) {
  if (!f) return true;
  if (f === "External Power") return d.powerTelemetry === "supported" && d.powerSource === "external";
  if (f === "Backup Battery") return d.powerTelemetry === "supported" && d.powerSource === "battery";
  if (f === "Low Battery") return d.batteryCondition === "low";
  if (f === "Critical Battery") return d.batteryCondition === "critical";
  return d.powerTelemetry !== "supported" || d.powerSource === "unknown" || d.batteryCondition === "unknown";
}

export const eventTone = (t: PowerEvent["type"]): Tone =>
  t === "External Power Restored" ? "normal" : t === "Critical Battery" || t === "Power Unavailable" ? "critical" : "warning";

/** Latest power-loss event for a device at or before the incident (within 6 h), if any. */
export function powerContextForIncident(events: PowerEvent[], i: Incident) {
  const t = new Date(i.detectedAt).getTime();
  const relevant = events.filter((e) => e.deviceId === i.deviceId && new Date(e.occurredAt).getTime() <= t + 60_000 && t - new Date(e.occurredAt).getTime() < 6 * 3600_000);
  const sorted = [...relevant].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const lastTransition = sorted.find((e) => e.type === "External Power Lost" || e.type === "External Power Restored");
  return lastTransition?.type === "External Power Lost" ? { lost: lastTransition, latest: sorted[0]! } : null;
}
