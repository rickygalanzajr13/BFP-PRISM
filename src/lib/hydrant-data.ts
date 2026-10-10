// Source: Commonwealth Fire Substation Hydrant Location List — 2025 updated.
// IDs are system-generated, not official BFP identifiers. Coordinates are as supplied.
import type { Hydrant } from "./types";

export const HYDRANT_SOURCE = "Commonwealth Fire Substation Hydrant Location List — 2025 updated";

const R = (n: number, location: string, lat: number, lng: number, recorded: string, remarks = "", verify = false): Hydrant => ({
  id: `HYD-${String(n).padStart(3, "0")}`, location, barangay: "Brgy. Commonwealth",
  operationalStatus: recorded.startsWith("Non-Operational") ? "Non-Operational" : recorded.startsWith("Operational") ? "Operational" : "Unknown",
  recordedStatus: recorded, coordinateStatus: verify ? "Verification Required" : "Verified",
  sourceLatitude: lat, sourceLongitude: lng, latitude: lat, longitude: lng,
  recordedPressurePsi: null, recordedFlowGpm: null, remarks, source: HYDRANT_SOURCE,
});

export const seedHydrants: Hydrant[] = [
  R(1, "Katipunan St. corner Kaunlaran St.", 14.698865, 121.089069, "Operational"),
  R(2, "Katipunan St. corner Kasunduan St.", 14.695624, 121.088848, "Operational"),
  R(3, "Perez St. corner Marcos Road", 14.69467, 121.091, "Operational"),
  R(4, "Katuparan St. corner Katibayan St.", 14.696797, 121.089593, "Operational"),
  R(5, "Commonwealth Ave. corner Soliven St.", 14.701461, 121.086788, "Non-Operational", "Defective valve head / for repair."),
  R(6, "Commonwealth Pump Station", 14.7021599, 121.0878361, "Operational"),
  R(7, "Doña Nicasia St. corner Lamesa Drive", 14.711003, 121.088496, "Non-Operational"),
  R(8, "Commonwealth Ave. corner Viceroy", 14.705321, 121.081235, "Operational"),
  R(9, "Villonco St. corner Metom St.", 14.697544, 121.083976, "Operational"),
  R(10, "Pilot Drive St. corner Adarna St.", 14.695593, 121.076713, "Operational", "To be relocated near Commonwealth Fire Substation (under construction when the source document was prepared)."),
  R(11, "Martan St.", 14.69595, 121.08438, "Operational"),
  R(12, "Don Jose Heights St.", 14.704023, 121.081162, "Operational"),
  R(13, "Upper Nawasa", 14.70431545, 121.12107481586, "Operational — verify coordinates", "For cleaning.", true),
  R(14, "Ernestito St. corner Agnes St., Don Jose Heights Subdivision", 14.701325, 121.074291, "Operational"),
  R(15, "Ernestito St., Don Jose Heights Subdivision", 14.700083, 121.077391, "Operational"),
  R(16, "Pantaleona St., Don Jose Heights Subdivision", 14.701326, 121.078885, "Operational"),
  R(17, "Liszt St., Ideal Subdivision", 14.697134, 121.076381, "Operational"),
  R(18, "Chopin St., Ideal Subdivision", 14.699643, 121.073303, "Operational"),
  R(19, "Wagner St., Ideal Subdivision", 14.698846, 121.075586, "Operational"),
];
