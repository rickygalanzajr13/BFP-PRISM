import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useIncidents, households, getDevice } from "@/lib/store";
import { meta } from "@/lib/meta";
import { IncidentMap, type MapMarker } from "@/components/prism/IncidentMap";
import { IncidentPopup, HouseholdPopup } from "@/components/prism/IncidentPopup";
import { Panel, Status, toneOf, inputCls, PageHeader, DemoNote } from "@/components/prism/ui";

export const Route = createFileRoute("/map")({
  head: () => meta("Map", "Registered household sensor locations and active incident markers."),
  component: MapPage,
});

function MapPage() {
  const active = useIncidents().filter((i) => i.responseStatus !== "Resolved");
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showHH, setShowHH] = useState(true);
  const s = q.toLowerCase();
  const matchHH = households.filter((h) => !s || [h.address, h.barangay, h.homeownerName, h.deviceId, h.landmark].some((v) => v.toLowerCase().includes(s)));

  const markers: MapMarker[] = [
    ...(showHH ? matchHH.filter((h) => !active.some((i) => i.householdId === h.id)).map((h) => {
      const d = getDevice(h.deviceId)!;
      return { id: h.id, lat: h.latitude, lng: h.longitude, kind: "household" as const, label: h.address, tone: d.status === "Offline" ? "offline" as const : toneOf(d.sensorStatus) };
    }) : []),
    ...active.map((i) => ({ id: i.id, lat: i.latitude, lng: i.longitude, kind: "incident" as const, label: i.id, tone: toneOf(i.riskLevel) })),
  ];

  const popup = (id: string) => {
    const inc = active.find((i) => i.id === id);
    if (inc) return <IncidentPopup i={inc} />;
    const h = households.find((x) => x.id === id)!;
    return <HouseholdPopup h={h} deviceStatus={getDevice(h.deviceId)!.status} />;
  };

  return (
    <div>
      <PageHeader title="Map" sub={`${households.length} registered locations · ${active.length} active incidents`} right={
        <div className="flex flex-wrap items-center gap-3">
          <input className={inputCls + " w-72"} placeholder="Search location, address or device" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={showHH} onChange={(e) => setShowHH(e.target.checked)} />Show households</label>
        </div>} />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Panel><IncidentMap className="h-[640px]" markers={markers} selected={sel} onSelect={setSel} renderPopup={popup} /></Panel>
        <Panel title="Locations" bodyClass="max-h-[640px] divide-y divide-border overflow-y-auto">
          {[...active.map((i) => ({ id: i.id, a: i.id, b: households.find((h) => h.id === i.householdId)!.address, t: i.riskLevel })),
            ...matchHH.map((h) => ({ id: h.id, a: h.homeownerName, b: h.address, t: getDevice(h.deviceId)!.status === "Offline" ? "Offline" : "Normal" }))].map((r) => (
            <button key={r.id} onClick={() => setSel(r.id)} className={"block w-full px-3 py-2 text-left text-sm hover:bg-muted " + (sel === r.id ? "bg-muted" : "")}>
              <div className="flex justify-between"><span className="font-medium">{r.a}</span><Status value={r.t} /></div>
              <div className="text-xs text-muted-foreground">{r.b}</div>
            </button>
          ))}
        </Panel>
      </div>
      <DemoNote />
    </div>
  );
}
