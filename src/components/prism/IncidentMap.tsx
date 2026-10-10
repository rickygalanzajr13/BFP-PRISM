// src/components/prism/IncidentMap.tsx  (full file)
// Stable map API. Renders the Leaflet/OpenStreetMap GIS map (GisMap) in the browser only.
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./ui";

export interface MapMarker { id: string; lat: number; lng: number; tone: Tone; kind: "incident" | "household" | "hydrant"; label: string }

const GisMap = lazy(() => import("./GisMap"));

export function IncidentMap(props: {
  markers: MapMarker[]; selected: string | null; onSelect: (id: string | null) => void;
  renderPopup: (id: string) => ReactNode; className?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const fallback = <div className={cn("flex items-center justify-center bg-map text-xs text-muted-foreground", props.className)}>Loading map…</div>;
  if (!ready) return fallback;
  return <Suspense fallback={fallback}><GisMap {...props} className={cn("overflow-hidden", props.className)} /></Suspense>;
}
