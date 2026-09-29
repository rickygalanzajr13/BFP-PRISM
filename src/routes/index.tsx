import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useIncidents, devices, getHousehold } from "@/lib/store";
import { meta } from "@/lib/meta";
import { fmtTime, fmtDate } from "@/lib/format";
import { IncidentMap } from "@/components/prism/IncidentMap";
import { IncidentPopup } from "@/components/prism/IncidentPopup";
import { Panel, Status, Table, toneOf, DemoNote } from "@/components/prism/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => meta("Dashboard", "Live overview of active fire, smoke and gas incidents detected by BFP-PRISM sensor nodes."),
  component: Dashboard,
});

function Dashboard() {
  const all = useIncidents();
  const active = all.filter((i) => i.responseStatus !== "Resolved");
  const [sel, setSel] = useState<string | null>(null);
  const nav = useNavigate();
  const stats = [
    { label: "Critical", value: active.filter((i) => i.riskLevel === "Critical").length, tone: "text-critical" },
    { label: "Warning", value: active.filter((i) => i.riskLevel === "Warning").length, tone: "text-warning-foreground" },
    { label: "Active Incidents", value: active.length, tone: "text-foreground" },
    { label: "Offline Devices", value: devices.filter((d) => d.status === "Offline").length, tone: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 border border-border bg-card lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("px-4 py-3", i > 0 && "border-l border-border", i === 2 && "max-lg:border-l-0 max-lg:border-t", i === 3 && "max-lg:border-t")}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={cn("mt-1 text-2xl font-semibold", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel title="Live Incident Map" action={<span className="text-xs text-muted-foreground">{fmtDate(new Date("2026-09-29T10:45:00+08:00").toISOString())}</span>}>
          <IncidentMap className="h-[420px]" selected={sel} onSelect={setSel}
            markers={active.map((i) => ({ id: i.id, lat: i.latitude, lng: i.longitude, tone: toneOf(i.riskLevel), kind: "incident", label: i.id }))}
            renderPopup={(id) => <IncidentPopup i={active.find((i) => i.id === id)!} />} />
        </Panel>

        <Panel title="Active Incident Summary" bodyClass="divide-y divide-border">
          {active.length === 0 && <p className="p-4 text-sm text-muted-foreground">No active incidents.</p>}
          {active.map((i) => { const h = getHousehold(i.householdId)!; return (
            <Link key={i.id} to="/incidents/$id" params={{ id: i.id }}
              className={cn("block border-l-4 px-4 py-3 hover:bg-muted", i.riskLevel === "Critical" ? "border-critical" : "border-warning")}>
              <div className="flex items-center justify-between text-sm"><span className="font-semibold">{i.id}</span><Status value={i.riskLevel} strong /></div>
              <div className="mt-1 text-sm">{i.hazardType} — {h.address}, {h.barangay}</div>
              <div className="mt-1 grid grid-cols-2 gap-x-2 text-xs text-muted-foreground">
                <span>Access: <b className="font-medium text-foreground">{h.roadAccessibility}</b></span>
                <span>Construction: <b className="font-medium text-foreground">{h.houseConstruction}</b></span>
                <span>Detected {fmtTime(i.detectedAt)}</span>
                <span>Status: <b className="font-medium text-foreground">{i.responseStatus}</b></span>
              </div>
            </Link>
          ); })}
        </Panel>
      </div>

      <Panel title="Active Incidents">
        <Table head={["Risk", "Incident ID", "Address", "Hazard", "Status", "Detected", "Action"].map((l) => ({ key: l, label: l }))}>
          {active.map((i) => (
            <tr key={i.id} className="cursor-pointer" onClick={() => nav({ to: "/incidents/$id", params: { id: i.id } })}>
              <td><Status value={i.riskLevel} strong /></td>
              <td className="font-medium">{i.id}</td>
              <td>{getHousehold(i.householdId)?.address}</td>
              <td>{i.hazardType}</td>
              <td>{i.responseStatus}</td>
              <td>{fmtTime(i.detectedAt)}</td>
              <td><Link to="/incidents/$id" params={{ id: i.id }} className="font-medium underline">View</Link></td>
            </tr>
          ))}
        </Table>
      </Panel>
      <DemoNote />
    </div>
  );
}
