import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Battery, PlugZap } from "lucide-react";
import type { Device } from "@/lib/types";
import { devices, getHousehold, getDevice, usePowerEvents } from "@/lib/store";
import { meta } from "@/lib/meta";
import { fmtTime, fmtShortDate } from "@/lib/format";
import { Panel, Status, Table, PageHeader, Select, inputCls, DemoNote, usePagination, Pagination } from "@/components/prism/ui";

const POWER_FILTERS = ["External Power", "Battery", "Low Battery", "Critical Battery", "Power Unavailable", "Unknown Power", "Not Installed"];

function fmtVoltage(voltage: Device["batteryVoltage"]) {
  return typeof voltage === "number" ? `${voltage.toFixed(2)} V` : "— V";
}

function matchesPowerFilter(device: Device, filter: string) {
  if (!filter) return true;
  if (filter === "External Power") return device.powerSource === "external";
  if (filter === "Battery") return device.powerSource === "battery";
  if (filter === "Low Battery") return device.batteryCondition === "low";
  if (filter === "Critical Battery") return device.batteryCondition === "critical";
  if (filter === "Power Unavailable") return device.powerSource === "unavailable";
  if (filter === "Not Installed") return device.powerTelemetry !== "supported";
  return device.powerSource === "unknown" || device.batteryCondition === "unknown";
}

function readinessLabel(device: Device) {
  if (device.powerTelemetry !== "supported") return "Not installed";
  if (device.batteryCondition === "critical") return "Critical — replace battery";
  if (device.batteryCondition === "low") return "Low — battery backup limited";
  if (device.batteryCondition === "unknown" || device.powerSource === "unknown" || device.powerSource === "unavailable") return "Unknown";
  return "Ready";
}

function isPowerStale(device: Device) {
  return device.status !== "Online";
}

function eventTone(type: string) {
  return type === "External Power Lost" ? "critical" : "normal";
}

export const Route = createFileRoute("/devices")({
  head: () => meta("Devices", "Connection, hybrid power source, backup battery and sensor health of ESP32 sensor nodes."),
  component: Devices,
});

function PowerSupply({ device: d }: { device: Device }) {
  if (d.powerTelemetry !== "supported") return <span className="text-xs text-muted-foreground">Unavailable — not installed</span>;
  const source = d.powerSource === "external" ? "External Power" : d.powerSource === "battery" ? "Battery" : d.powerSource === "unavailable" ? "Power Unavailable" : "Unknown Power";
  const condition = d.batteryCondition === "normal" ? "Normal" : d.batteryCondition === "low" ? "Low" : d.batteryCondition === "critical" ? "Critical" : "Unknown";
  const tone = d.powerSource === "unavailable" || d.batteryCondition === "critical" ? "text-critical" : d.batteryCondition === "low" || d.powerSource === "battery" ? "text-warning-foreground" : d.powerSource === "unknown" || d.batteryCondition === "unknown" ? "text-muted-foreground" : "text-normal";
  const Icon = d.powerSource === "external" ? PlugZap : Battery;
  return (
    <div className="min-w-52 space-y-1 text-xs">
      <div className={`flex items-start gap-1.5 font-medium ${tone}`}>
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-current/10"><Icon className="size-3.5" aria-hidden="true" /></span>
        <span className="pt-0.5">{source} ({fmtVoltage(d.batteryVoltage)} · {d.powerSource === "external" ? "Battery " : ""}{condition})</span>
      </div>
      {isPowerStale(d) && <div className="pl-6.5 text-muted-foreground">Last known — stale</div>}
    </div>
  );
}

function Devices() {
  const [q, setQ] = useState(""); const [conn, setConn] = useState(""); const [pwr, setPwr] = useState("");
  const events = usePowerEvents();
  const rows = devices.filter((d) => { const h = getHousehold(d.householdId)!;
    return (!q || [d.id, h.homeownerName, h.address].some((v) => v.toLowerCase().includes(q.toLowerCase()))) && (!conn || d.status === conn) && matchesPowerFilter(d, pwr); });
  const online = devices.filter((d) => d.status === "Online").length;
  const onBattery = devices.filter((d) => d.powerTelemetry === "supported" && d.powerSource === "battery").length;
  const lowBatt = devices.filter((d) => d.batteryCondition === "low" || d.batteryCondition === "critical").length;
  const lastTransition = (id: string) => events.find((e) => e.deviceId === id && (e.type === "External Power Lost" || e.type === "External Power Restored"));

  const pg = usePagination(rows, JSON.stringify([q, conn, pwr]));
  return (
    <div className="space-y-4">
      <PageHeader title="Devices" sub={`${online} online · ${devices.length - online} offline · ${onBattery} on backup battery · ${lowBatt} low/critical battery`} />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <input className={inputCls + " w-72"} placeholder="Search device, household, address" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select label="Connection" value={conn} onChange={setConn} options={["Online", "Offline"]} />
          <Select label="Power" value={pwr} onChange={setPwr} options={[...POWER_FILTERS]} />
        </div>
        <Table head={["Device ID", "Household", "Connection", "Power Supply", "Backup Readiness", "Last Power Transition", "Last Communication", "Sensor Status"].map((l) => ({ key: l, label: l }))}>
          {pg.pageRows.map((d) => { const h = getHousehold(d.householdId); if (!h) return null; const lt = lastTransition(d.id); return (
            <tr key={d.id}>
              <td className="font-medium"><Link to="/devices/$id" params={{ id: d.id }} className="underline">{d.id}</Link></td>
              <td><Link to="/households/$id" params={{ id: h.id }} className="underline">{h.homeownerName}</Link><div className="text-xs text-muted-foreground">{h.address}</div></td>
              <td><Status value={d.status} /></td>
              <td><PowerSupply device={d} /></td>
              <td className="max-w-48 text-xs">{readinessLabel(d)}</td>
              <td className="whitespace-nowrap text-xs">{lt ? <>{lt.type}<div className="text-muted-foreground">{fmtShortDate(lt.occurredAt)} {fmtTime(lt.occurredAt)}</div></> : "—"}</td>
              <td>{fmtTime(d.lastSeen)}</td><td><Status value={d.sensorStatus} /></td>
            </tr>); })}
        </Table>
        <Pagination {...pg} />
      </Panel>

      <Panel title="Power & Battery Notifications" bodyClass="divide-y divide-border">
        <p className="px-4 py-2 text-xs text-muted-foreground">Device power events only — these are not fire/gas hazard alerts and do not create incidents.</p>
        {events.slice(0, 8).map((e) => { const h = getHousehold(getDevice(e.deviceId)!.householdId)!; return (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
            <span className="flex items-center gap-3"><Status value={e.type === "External Power Lost" ? "External Power Lost — Running on Backup Battery" : e.type} tone={eventTone(e.type)} />
              <Link to="/devices/$id" params={{ id: e.deviceId }} className="underline">{e.deviceId}</Link><span className="text-muted-foreground">{h.homeownerName}</span></span>
            <span className="text-xs text-muted-foreground">{fmtShortDate(e.occurredAt)} {fmtTime(e.occurredAt)} · {e.receivedAt ? "Received" : "Awaiting sync"}</span>
          </div>); })}
      </Panel>
      <DemoNote />
    </div>
  );
}
