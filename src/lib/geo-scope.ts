// Project area: Barangay Commonwealth, Quezon City.
// Boundary: OpenStreetMap relation 1762721 (© OSM contributors, ODbL) in src/data/barangay-commonwealth-boundary.json.
// Pure module (no Leaflet) so it is safe for SSR and validation.
import boundary from "@/data/barangay-commonwealth-boundary.json";

type Ring = [number, number][]; // [lng, lat]
const geom = (boundary as { features: { geometry: { type: string; coordinates: unknown } }[] }).features[0]!.geometry;
const polygons: Ring[][] =
  geom.type === "MultiPolygon" ? (geom.coordinates as Ring[][]) : [geom.coordinates as Ring[]];

export const SCOPE_NAME = "Barangay Commonwealth";
export const SCOPE_OUTSIDE_MESSAGE = "Location is outside Barangay Commonwealth — flagged for review.";

function inRing(lng: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!; const [xj, yj] = ring[j]!;
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Ray-casting point-in-polygon against the actual barangay geometry (holes respected). */
export function isInScope(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return polygons.some(([outer, ...holes]) => inRing(lng, lat, outer!) && !holes.some((h) => inRing(lng, lat, h)));
}
