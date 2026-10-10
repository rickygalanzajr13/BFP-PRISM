// Client-side mock store. Swap the mutation bodies for API calls
// (e.g. PATCH /api/incidents/:id) once the Node/SQLite backend exists.
import { useSyncExternalStore } from "react";
import { initialIncidents, households as initialHouseholds, devices } from "./mock-data";
import { ACCESSIBILITY_TAGS, type AccessibilityTag, type Household, type Incident, type RegisteredContact } from "./types";

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

// --- Households (swap for /api/households/:id/contacts later) ---
let hhState: Household[] = initialHouseholds;
const hhListeners = new Set<() => void>();
const hhSubscribe = (l: () => void) => (hhListeners.add(l), () => hhListeners.delete(l));
export function useHouseholds() {
  return useSyncExternalStore(hhSubscribe, () => hhState, () => initialHouseholds);
}
export const useHousehold = (id: string) => useHouseholds().find((h) => h.id === id);
export const getHousehold = (id: string) => hhState.find((h) => h.id === id);

function setContacts(householdId: string, f: (c: RegisteredContact[]) => RegisteredContact[]) {
  hhState = hhState.map((h) => (h.id === householdId ? { ...h, registeredContacts: f(h.registeredContacts) } : h));
  hhListeners.forEach((l) => l());
}
/** Add or update a contact. Marking one primary clears the previous primary. */
export function saveContact(householdId: string, contact: RegisteredContact) {
  setContacts(householdId, (list) => {
    const exists = list.some((c) => c.contactId === contact.contactId);
    const next = exists ? list.map((c) => (c.contactId === contact.contactId ? contact : c)) : [...list, contact];
    return contact.isPrimaryContact ? next.map((c) => ({ ...c, isPrimaryContact: c.contactId === contact.contactId })) : next;
  });
}
export const removeContact = (householdId: string, contactId: string) =>
  setContacts(householdId, (list) => list.filter((c) => c.contactId !== contactId));

/** Registered SMS recipients = contacts with smsEnabled. Real SMS sending is not implemented (demo). */
export const getSmsRecipients = (h: Household) => h.registeredContacts.filter((c) => c.smsEnabled && c.contactNumber.trim());
export const getPrimaryContact = (h: Household) => h.registeredContacts.find((c) => c.isPrimaryContact);

/** Aggregate accessibility tags, e.g. { Senior: 2, PWD: 1 }. */
export function accessibilitySummary(h: Household) {
  const counts = new Map<AccessibilityTag, number>();
  h.registeredContacts.forEach((c) => c.accessibilityTags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return ACCESSIBILITY_TAGS.filter((t) => counts.has(t)).map((t) => ({ tag: t, count: counts.get(t)! }));
}

export const getDevice = (id: string) => devices.find((d) => d.id === id);
export { initialHouseholds as households, devices };

// --- Fire hydrants (swap for /api/hydrants later) ---
import { seedHydrants } from "./hydrant-data";
import type { Hydrant } from "./types";

/** Insert seed records by stable ID; existing records (user edits) are kept. */
export function mergeSeed(existing: Hydrant[], seed: Hydrant[]): Hydrant[] {
  const ids = new Set(existing.map((h) => h.id));
  return [...existing, ...seed.filter((s) => !ids.has(s.id))];
}
let hydrants: Hydrant[] = mergeSeed([], seedHydrants);
const hyListeners = new Set<() => void>();
const hySubscribe = (l: () => void) => (hyListeners.add(l), () => hyListeners.delete(l));
const hyEmit = () => hyListeners.forEach((l) => l());
export const useHydrants = () => useSyncExternalStore(hySubscribe, () => hydrants, () => seedHydrants);

/** Update editable fields. Source coordinates are never overwritten. */
export function updateHydrant(id: string, p: Partial<Omit<Hydrant, "id" | "sourceLatitude" | "sourceLongitude" | "source">>) {
  hydrants = hydrants.map((h) => (h.id === id ? { ...h, ...p } : h));
  hyEmit();
}
export function deleteHydrant(id: string) { hydrants = hydrants.filter((h) => h.id !== id); hyEmit(); }

export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = (d: number) => (d * Math.PI) / 180, R = 6371000;
  const x = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
/** Nearest hydrants with verified coordinates, sorted by straight-line distance. */
export function nearestHydrants(list: Hydrant[], lat: number, lng: number, n = 3) {
  return list.filter((h) => h.coordinateStatus === "Verified")
    .map((h) => ({ h, d: distanceMeters(lat, lng, h.latitude, h.longitude) }))
    .sort((a, b) => a.d - b.d).slice(0, n);
}
export const hydrantTone = (s: Hydrant["operationalStatus"]) => (s === "Operational" ? "normal" : s === "Non-Operational" ? "critical" : "offline") as "normal" | "critical" | "offline";
