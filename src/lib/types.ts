// Data structures mirror the planned SQLite schema (one interface per table).

export type RiskLevel = "Critical" | "Warning" | "Normal";
export type HazardType = "Fire / Smoke" | "Gas Leak" | "Smoke" | "High Temperature";
export type AlertStatus = "Not Acknowledged" | "Acknowledged";
export type ResponseStatus = "Detected" | "Received" | "Responding" | "Resolved";
export type Outcome = "Pending" | "Resolved" | "False Alert";
export type DeviceStatus = "Online" | "Offline";
export type SensorStatus = "Normal" | "Warning" | "Critical" | "Offline";

export const ACCESSIBILITY_TAGS = ["Senior", "PWD", "Child/Minor", "Mobility Assistance", "Hearing Assistance", "Visual Assistance"] as const;
export type AccessibilityTag = (typeof ACCESSIBILITY_TAGS)[number];

// Sensitive: shown only inside authorized BFP views, never in map markers/popups or URLs.
export interface RegisteredContact {
  contactId: string;
  name: string;
  relationshipToHousehold: string;
  contactNumber: string;
  smsEnabled: boolean;
  isPrimaryContact: boolean;
  accessibilityTags: AccessibilityTag[];
}

export interface Household {
  id: string;
  homeownerName: string;
  registeredContacts: RegisteredContact[];
  address: string;
  barangay: string;
  landmark: string;
  roadAccessibility: "Normal" | "Narrow" | "Limited";
  houseConstruction: "Concrete" | "Light Materials" | "Mixed" | "Other";
  accessibilityNotes: string;
  deviceId: string;
  latitude: number;
  longitude: number;
}

export interface Device {
  id: string;
  householdId: string;
  status: DeviceStatus;
  batteryLevel: number;
  lastSeen: string; // ISO
  sensorStatus: SensorStatus;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  temperature: number;
  smokeLevel: "Normal" | "Elevated" | "High";
  gasLevel: "Normal" | "Elevated" | "High";
  flameDetected: boolean;
  timestamp: string;
}

export interface Incident {
  id: string;
  deviceId: string;
  householdId: string;
  hazardType: HazardType;
  riskLevel: RiskLevel;
  temperature: number;
  smokeLevel: "Normal" | "Elevated" | "High";
  gasLevel: "Normal" | "Elevated" | "High";
  flameDetected: boolean;
  latitude: number;
  longitude: number;
  detectedAt: string;
  alertStatus: AlertStatus;
  responseStatus: ResponseStatus;
  receivedAt: string | null;
  respondingAt: string | null;
  resolvedAt: string | null;
  responseTime: number | null; // seconds from detection to acknowledgment
  outcome: Outcome;
}

export const RESPONSE_STEPS: ResponseStatus[] = ["Detected", "Received", "Responding", "Resolved"];
