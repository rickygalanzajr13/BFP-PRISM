// Real GIS map (Leaflet + OpenStreetMap). Browser-only: loaded lazily via IncidentMap.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, type ReactNode } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import type { Tone } from "./ui";
import type { MapMarker } from "./IncidentMap";
// Quezon City administrative boundary — OpenStreetMap relation 106569 (via Nominatim, © OSM contributors, ODbL).
// For visualization only; not official cadastral/survey data.
import qcBoundary from "@/data/quezon-city-boundary.json";

const QC_GEOJSON = qcBoundary as unknown as GeoJsonObject;
export const QC_BOUNDS = L.geoJSON(QC_GEOJSON).getBounds();
const QC_MAX_BOUNDS = QC_BOUNDS.pad(0.1);
export const SERVICE_CENTER: [number, number] = [QC_BOUNDS.getCenter().lat, QC_BOUNDS.getCenter().lng];
export const SERVICE_ZOOM = 12;

const fill: Record<Tone, string> = { critical: "bg-critical", warning: "bg-warning", normal: "bg-normal", offline: "bg-offline" };

function icon(m: MapMarker, selected: boolean) {
  const incident = m.kind === "incident";
  const size = incident ? 20 : 12;
  const cls = incident
    ? `block size-5 rounded-full border-2 border-card ${fill[m.tone]} ring-2 ${selected ? "ring-foreground" : "ring-foreground/70"}`
    : `block size-3 rounded-[2px] border-2 border-card ${fill[m.tone]} ${selected ? "ring-2 ring-foreground" : ""}`;
  return L.divIcon({ className: "", html: `<span class="${cls}"></span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
}

function PrismMarker({ m, selected, onSelect, children }: { m: MapMarker; selected: boolean; onSelect: (id: string | null) => void; children: ReactNode }) {
  const ref = useRef<L.Marker>(null);
  useEffect(() => { if (!selected) return; const t = setTimeout(() => ref.current?.openPopup(), 300); return () => clearTimeout(t); }, [selected]);
  return (
    <Marker ref={ref} position={[m.lat, m.lng]} icon={icon(m, selected)} title={m.label} alt={m.label}
      zIndexOffset={m.kind === "incident" ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(m.id), popupclose: () => { if (selected) onSelect(null); } }}>
      <Popup minWidth={240} maxWidth={280}><div className="text-sm text-foreground">{children}</div></Popup>
    </Marker>
  );
}

export const HouseholdMarker = PrismMarker;
export const IncidentMarker = PrismMarker;

export default function GisMap({ markers, selected, onSelect, renderPopup, className }: {
  markers: MapMarker[]; selected: string | null; onSelect: (id: string | null) => void;
  renderPopup: (id: string) => ReactNode; className?: string;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const incidents = markers.filter((m) => m.kind === "incident");

  const reset = () => mapRef.current?.fitBounds(QC_BOUNDS, { padding: [12, 12] });
  const fit = (list: MapMarker[]) => {
    const map = mapRef.current; if (!map) return;
    if (list.length === 0) { reset(); return; }
    if (list.length === 1) { map.setView([list[0]!.lat, list[0]!.lng], 17); return; }
    map.fitBounds(L.latLngBounds(list.map((m) => [m.lat, m.lng] as [number, number])), { padding: [40, 40], maxZoom: 17 });
  };

  // Center + zoom on the selected marker.
  useEffect(() => {
    const m = markers.find((x) => x.id === selected);
    if (m && mapRef.current) mapRef.current.setView([m.lat, m.lng], Math.max(mapRef.current.getZoom(), 17));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const inQC = markers.filter((m) => QC_MAX_BOUNDS.contains([m.lat, m.lng]));
  const btn = "block h-7 w-full px-2 text-left text-xs hover:bg-muted";
  return (
    <div className={"relative " + (className ?? "")}>
      <MapContainer ref={mapRef} bounds={QC_BOUNDS} boundsOptions={{ padding: [12, 12] }} maxBounds={QC_MAX_BOUNDS} maxBoundsViscosity={1}
        minZoom={11} maxZoom={19} className="h-full w-full bg-map" scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <GeoJSON data={QC_GEOJSON} interactive={false}
          style={{ color: "#475569", weight: 2, opacity: 0.8, fillColor: "#64748b", fillOpacity: 0.05, dashArray: "6 4" }} />
        {inQC.map((m) => (
          <PrismMarker key={m.id} m={m} selected={selected === m.id} onSelect={onSelect}>{renderPopup(m.id)}</PrismMarker>
        ))}
      </MapContainer>
      <div className="absolute right-2 top-2 z-[1000] w-40 divide-y divide-border border border-border bg-card">
        <button className={btn} onClick={reset}>Reset view</button>
        <button className={btn} onClick={() => fit(incidents)} disabled={incidents.length === 0}>Fit active incidents</button>
      </div>
      <MapLegend />
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-2 z-[1000] flex flex-wrap gap-3 border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-normal" />Normal</span>
      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />Warning</span>
      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-critical" />Critical</span>
      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-offline" />Offline</span>
      <span className="flex items-center gap-1 border-l border-border pl-3"><span className="size-2.5 rounded-full bg-muted-foreground ring-1 ring-foreground/70" />Active incident</span>
      <span className="flex items-center gap-1"><span className="size-2 rounded-[2px] bg-muted-foreground" />Registered household</span>
    </div>
  );
}
