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
