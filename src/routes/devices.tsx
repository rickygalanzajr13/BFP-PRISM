import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { devices, getHousehold } from "@/lib/store";
import { meta } from "@/lib/meta";
import { fmtTime } from "@/lib/format";
import { Panel, Status, Table, PageHeader, Select, inputCls, DemoNote, usePagination, Pagination } from "@/components/prism/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devices")({
  head: () => meta("Devices", "Connection, battery and sensor health of ESP32 sensor nodes."),
  component: Devices,
});

function Devices() {
  const [q, setQ] = useState(""); const [conn, setConn] = useState("");
  const rows = devices.filter((d) => { const h = getHousehold(d.householdId)!;
    return (!q || [d.id, h.homeownerName, h.address].some((v) => v.toLowerCase().includes(q.toLowerCase()))) && (!conn || d.status === conn); });
  const online = devices.filter((d) => d.status === "Online").length;

  const pg = usePagination(rows, JSON.stringify([q, conn]));
  return (
    <div>
      <PageHeader title="Devices" sub={`${online} online · ${devices.length - online} offline · ${devices.filter((d) => d.batteryLevel < 30).length} low battery`} />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <input className={inputCls + " w-72"} placeholder="Search device, household, address" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select label="Connection" value={conn} onChange={setConn} options={["Online", "Offline"]} />
        </div>
        <Table head={["Device ID", "Household", "Address", "Connection Status", "Battery", "Last Seen", "Sensor Status"].map((l) => ({ key: l, label: l }))}>
          {pg.pageRows.map((d) => { const h = getHousehold(d.householdId)!; return (
            <tr key={d.id}>
              <td className="font-medium">{d.id}</td>
              <td><Link to="/households/$id" params={{ id: h.id }} className="underline">{h.homeownerName}</Link></td>
              <td>{h.address}</td><td><Status value={d.status} /></td>
              <td><div className="flex items-center gap-2">
                <div className="h-1.5 w-14 bg-muted"><div className={cn("h-full", d.batteryLevel < 30 ? "bg-critical" : d.batteryLevel < 60 ? "bg-warning" : "bg-normal")} style={{ width: `${d.batteryLevel}%` }} /></div>
                <span className={cn(d.batteryLevel < 30 && "font-semibold text-critical")}>{d.batteryLevel}%</span></div></td>
              <td>{fmtTime(d.lastSeen)}</td><td><Status value={d.sensorStatus} /></td>
            </tr>); })}
        </Table>
        <Pagination {...pg} />
      </Panel>
      <DemoNote />
    </div>
  );
}
