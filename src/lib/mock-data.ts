// DEMO DATA — all names, numbers and addresses are fictional.
// Replace with API calls (see src/lib/store.ts) when the backend is available.
import type { Device, Household, Incident, HazardType, RiskLevel, Outcome, RegisteredContact, AccessibilityTag } from "./types";

const H = (
  n: number, name: string, contact: string, address: string, barangay: string, landmark: string,
  road: Household["roadAccessibility"], cons: Household["houseConstruction"], notes: string, lat: number, lng: number,
): Household => ({
  id: `HH-${String(n).padStart(3, "0")}`, homeownerName: name,
  registeredContacts: [{ contactId: `C-${n}-1`, name, relationshipToHousehold: "Homeowner", contactNumber: contact, smsEnabled: true, isPrimaryContact: true, accessibilityTags: [] }],
  address, barangay, landmark,
  roadAccessibility: road, houseConstruction: cons, accessibilityNotes: notes,
  deviceId: `NODE-${String(n).padStart(3, "0")}`, latitude: lat, longitude: lng,
});

const baseHouseholds: Household[] = [
  H(1, "Juan Dela Cruz", "0917 555 0101", "123 Mabini Street", "Brgy. Commonwealth", "Near Commonwealth Elementary School", "Normal", "Concrete", "Gate opens inward. Water hydrant 40 m north.", 14.6981, 121.0792),
  H(2, "Ana Reyes", "0918 555 0102", "45 Rizal Road", "Brgy. Commonwealth", "Across Reyes Sari-sari Store", "Narrow", "Mixed", "Street width approx. 3 m; parked tricycles common.", 14.6935, 121.0842),
  H(3, "Maria Santos", "0919 555 0103", "88 Bonifacio Road", "Brgy. Commonwealth", "Beside Commonwealth Chapel", "Normal", "Concrete", "Two-storey; elderly resident on ground floor.", 14.7021, 121.0812),
  H(4, "Roberto Garcia", "0920 555 0104", "12 Luna Alley", "Brgy. Commonwealth", "Behind Commonwealth Covered Court", "Limited", "Light Materials", "Alley accessible on foot only; nearest truck access at Luna St. corner (60 m).", 14.6968, 121.0929),
  H(5, "Liza Mendoza", "0921 555 0105", "7 Aguinaldo Street", "Brgy. Commonwealth", "Near Commonwealth Health Center", "Normal", "Concrete", "LPG tank stored at rear kitchen.", 14.7002, 121.0768),
  H(6, "Carlos Villanueva", "0922 555 0106", "230 Quezon Avenue", "Brgy. Commonwealth", "Opposite Commonwealth Ave. Gas Station", "Normal", "Concrete", "Commercial ground floor (bakery).", 14.6962, 121.0871),
  H(7, "Teresita Aquino", "0923 555 0107", "19 Del Pilar Lane", "Brgy. Commonwealth", "Near Commonwealth Barangay Hall", "Narrow", "Light Materials", "Overhead electrical lines low across lane.", 14.7061, 121.0851),
  H(8, "Ramon Bautista", "0924 555 0108", "56 Burgos Street", "Brgy. Commonwealth", "Beside Bautista Rice Dealer", "Normal", "Mixed", "None.", 14.6989, 121.0867),
  H(9, "Josefina Cruz", "0925 555 0109", "3 Jacinto Extension", "Brgy. Commonwealth", "End of Jacinto Ext., near creek", "Limited", "Light Materials", "Creek on east side; footbridge only.", 14.7092, 121.0874),
  H(10, "Eduardo Ramos", "0926 555 0110", "101 Magsaysay Blvd", "Brgy. Commonwealth", "Near Commonwealth Public Market", "Normal", "Concrete", "Market traffic heavy 5–9 AM.", 14.7039, 121.0858),
];

// Extra fictional contacts (numbers use the 555 demo range).
const C = (id: string, name: string, rel: string, num: string, sms: boolean, tags: AccessibilityTag[] = []): RegisteredContact =>
  ({ contactId: id, name, relationshipToHousehold: rel, contactNumber: num, smsEnabled: sms, isPrimaryContact: false, accessibilityTags: tags });
const extra: Record<string, RegisteredContact[]> = {
  "HH-003": [C("C-3-2", "Pedro Santos", "Son", "0919 555 0203", true, ["Senior"]), C("C-3-3", "Ana Santos", "Daughter", "0919 555 0303", true)],
  "HH-004": [C("C-4-2", "Lourdes Garcia", "Mother", "", false, ["Senior", "Mobility Assistance"]), C("C-4-3", "Miguel Garcia", "Son", "0920 555 0204", true, ["Child/Minor"]), C("C-4-4", "Celia Garcia", "Sister", "0920 555 0304", true, ["PWD", "Hearing Assistance"])],
  "HH-002": [C("C-2-2", "Benjie Reyes", "Spouse", "0918 555 0202", true)],
  "HH-007": [C("C-7-2", "Nestor Aquino", "Spouse", "0923 555 0207", true, ["Senior"]), C("C-7-3", "Lina Aquino", "Granddaughter", "", false, ["Child/Minor", "Visual Assistance"])],
  "HH-009": [C("C-9-2", "Rodel Cruz", "Nephew", "0925 555 0209", true)],
};
export const households: Household[] = baseHouseholds.map((h) => ({ ...h, registeredContacts: [...h.registeredContacts, ...(extra[h.id] ?? [])] }));

const T = (h: number, m: number, day = "2026-09-29") => `${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`;

const offline = new Set(["NODE-003", "NODE-009"]);
export const devices: Device[] = households.map((hh, i) => ({
  id: hh.deviceId,
  householdId: hh.id,
  status: offline.has(hh.deviceId) ? "Offline" : "Online",
  batteryLevel: [87, 92, 61, 74, 95, 81, 58, 90, 23, 77][i] ?? 80,
  lastSeen: offline.has(hh.deviceId) ? T(9, 58 - i) : T(10, 44),
  sensorStatus: offline.has(hh.deviceId)
    ? "Offline"
    : hh.deviceId === "NODE-004" ? "Critical"
    : hh.deviceId === "NODE-002" || hh.deviceId === "NODE-007" ? "Warning" : "Normal",
}));

const hh = (id: string) => households.find((h) => h.id === id)!;

function incident(p: Partial<Incident> & Pick<Incident, "id" | "householdId" | "hazardType" | "riskLevel" | "detectedAt">): Incident {
  const h = hh(p.householdId);
  return {
    deviceId: h.deviceId, latitude: h.latitude, longitude: h.longitude,
    temperature: 31, smokeLevel: "Normal", gasLevel: "Normal", flameDetected: false,
    alertStatus: "Not Acknowledged", responseStatus: "Detected",
    receivedAt: null, respondingAt: null, resolvedAt: null, responseTime: null, outcome: "Pending",
    ...p,
  };
}

const active: Incident[] = [
  incident({ id: "PRISM-0027", householdId: "HH-004", hazardType: "Fire / Smoke", riskLevel: "Critical", detectedAt: T(10, 42), temperature: 68.4, smokeLevel: "High", flameDetected: true }),
  incident({ id: "PRISM-0026", householdId: "HH-002", hazardType: "Gas Leak", riskLevel: "Warning", detectedAt: T(10, 35), temperature: 30.2, gasLevel: "High", alertStatus: "Acknowledged", responseStatus: "Received", receivedAt: T(10, 37), responseTime: 118 }),
  incident({ id: "PRISM-0025", householdId: "HH-007", hazardType: "Smoke", riskLevel: "Warning", detectedAt: T(10, 21), temperature: 36.8, smokeLevel: "Elevated", alertStatus: "Acknowledged", responseStatus: "Responding", receivedAt: T(10, 22), respondingAt: T(10, 24), responseTime: 74 }),
];

// Historical (closed) incidents
const hazards: HazardType[] = ["Fire / Smoke", "Gas Leak", "Smoke", "High Temperature"];
const outcomes: Outcome[] = ["Resolved", "Resolved", "False Alert", "Resolved", "False Alert", "Resolved"];
const history: Incident[] = Array.from({ length: 24 }, (_, i) => {
  const n = 24 - i;
  const day = `2026-09-${String(28 - Math.floor(i * 1.1)).padStart(2, "0")}`;
  const hour = 6 + ((i * 5) % 15), min = (i * 13) % 60;
  const hazard = hazards[i % 4]!;
  const risk: RiskLevel = hazard === "Fire / Smoke" ? "Critical" : i % 3 === 0 ? "Critical" : "Warning";
  const rt = 55 + ((i * 37) % 160);
  const ack = new Date(new Date(T(hour, min, day)).getTime() + rt * 1000).toISOString();
  const res = new Date(new Date(T(hour, min, day)).getTime() + (rt + 600 + i * 45) * 1000).toISOString();
  return incident({
    id: `PRISM-${String(n).padStart(4, "0")}`, householdId: households[(i * 3) % 10]!.id, hazardType: hazard, riskLevel: risk,
    detectedAt: T(hour, min, day), temperature: hazard === "Fire / Smoke" ? 58 + (i % 9) : 33 + (i % 6),
    smokeLevel: hazard === "Fire / Smoke" || hazard === "Smoke" ? "High" : "Normal",
    gasLevel: hazard === "Gas Leak" ? "High" : "Normal", flameDetected: hazard === "Fire / Smoke" && i % 2 === 0,
    alertStatus: "Acknowledged", responseStatus: "Resolved", receivedAt: ack, respondingAt: new Date(new Date(ack).getTime() + 90000).toISOString(), resolvedAt: res, responseTime: rt,
    outcome: outcomes[i % outcomes.length]!,
  });
}).slice(0, 24).filter((_, i) => i < 24);

export const initialIncidents: Incident[] = [...active, ...history];
