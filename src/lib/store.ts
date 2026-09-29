// Client-side mock store. Swap the mutation bodies for API calls
// (e.g. PATCH /api/incidents/:id) once the Node/SQLite backend exists.
import { useSyncExternalStore } from "react";
import { initialIncidents, households, devices } from "./mock-data";
import type { Incident } from "./types";

let incidents: Incident[] = initialIncidents;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
const emit = () => listeners.forEach((l) => l());

export function useIncidents() {
  return useSyncExternalStore(subscribe, () => incidents, () => initialIncidents);
}

const patch = (id: string, f: (i: Incident) => Partial<Incident>) => {
  incidents = incidents.map((i) => (i.id === id ? { ...i, ...f(i) } : i));
  emit();
};

export function markReceived(id: string) {
  const now = new Date().toISOString();
  patch(id, (i) => ({ responseStatus: "Received", alertStatus: "Acknowledged", receivedAt: now,
    responseTime: Math.max(0, Math.round((Date.now() - new Date(i.detectedAt).getTime()) / 1000)) }));
}
export const markResponding = (id: string) => patch(id, () => ({ responseStatus: "Responding", respondingAt: new Date().toISOString() }));
export const markResolved = (id: string, outcome: "Resolved" | "False Alert") =>
  patch(id, () => ({ responseStatus: "Resolved", resolvedAt: new Date().toISOString(), outcome }));

export const getHousehold = (id: string) => households.find((h) => h.id === id);
export const getDevice = (id: string) => devices.find((d) => d.id === id);
export { households, devices };
