import { createFileRoute, Link } from "@tanstack/react-router";
import { getDevice, getHousehold, usePowerEvents } from "@/lib/store";
import { fmtShortDate, fmtTime } from "@/lib/format";
import { batteryConditionLabel, eventTone, fmtVoltage, powerSourceLabel, readinessLabel, isPowerStale } from "@/lib/power";
import { Panel, Field, Status, DemoNote, Table } from "@/components/prism/ui";

export const Route = createFileRoute("/devices_/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Device ${params.id} — BFP-PRISM` },
      { name: "description", content: `Power source, backup battery and event history for sensor node ${params.id}.` },
      { property: "og:title", content: `Device ${params.id} — BFP-PRISM` },
      { property: "og:description", content: `Hybrid power status for node ${params.id}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeviceDetail,
});

const when = (s: string | null) => (s ? `${fmtShortDate(s)} ${fmtTime(s)}` : "Unavailable");

function DeviceDetail() {
  const { id } = Route.useParams();
  const d = getDevice(id);
  const events = usePowerEvents().filter((e) => e.deviceId === id);
  if (!d) return <div className="py-16 text-center text-sm">Device not found. <Link to="/devices" className="underline">Back</Link></div>;
  const h = getHousehold(d.householdId)!;
  const src = powerSourceLabel(d); const bc = batteryConditionLabel(d);
  const supported = d.powerTelemetry === "supported";
  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground"><Link to="/devices" className="underline">Devices</Link> / {d.id}</div>
      <h1 className="text-lg font-semibold">{d.id} <span className="font-normal text-muted-foreground">· {h.homeownerName}</span></h1>
      {supported && d.powerSource === "battery" && (
        <div className="border border-l-4 border-l-warning bg-card px-4 py-3 text-sm font-semibold">External Power Lost — Running on Backup Battery <span className="font-normal text-muted-foreground">since {when(d.externalPowerLostAt)}</span></div>
      )}
      {!supported && (
        <div className="border border-l-4 border-l-offline bg-card px-4 py-3 text-sm">Power telemetry unavailable — this node does not have power-detection and battery-sensing hardware/firmware installed.</div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Power Status">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Field label="Current Power Source" value={<Status value={src.label} tone={src.tone} />} emphasis />
            <Field label="Battery Condition" value={<Status value={bc.label} tone={bc.tone} />} emphasis />
            <Field label="Battery Voltage" value={fmtVoltage(d.batteryVoltage)} />
            <Field label="Estimated Battery %" value={d.batteryPercentage == null ? "Not supported (no validated estimate)" : `${d.batteryPercentage}%`} />
            <Field label="Battery Supplying Power" value={!supported || d.powerSource === "unknown" ? "Unknown" : d.powerSource === "battery" ? "Yes" : "No"} />
            <div className="col-span-2"><Field label="Backup Readiness" value={readinessLabel(d)} /></div>
            <Field label="External Power Lost At" value={d.externalPowerLostAt ? when(d.externalPowerLostAt) : "—"} />
            <Field label="Last Battery Reading" value={when(d.lastPowerUpdateAt)} />
            {supported && isPowerStale(d) && <div className="col-span-2 text-xs text-warning-foreground">Readings are stale — shown as last known values.</div>}
          </dl>
        </Panel>
        <Panel title="Device">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Field label="Household" value={<Link to="/households/$id" params={{ id: h.id }} className="underline">{h.homeownerName}</Link>} />
            <Field label="Address" value={h.address} />
            <Field label="Connectivity" value={<Status value={d.status} />} />
            <Field label="Last Communication" value={when(d.lastSeen)} />
            <Field label="Sensor Status" value={<Status value={d.sensorStatus} />} />
          </dl>
        </Panel>
      </div>
      <Panel title="Power Event History">
        {events.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No power events recorded.</p> : (
          <Table head={["Event", "Occurred (node time)", "Battery Voltage", "Battery Condition", "Sync"].map((l) => ({ key: l, label: l }))}>
            {events.map((e) => { const c = batteryConditionLabel(e); return (
              <tr key={e.id}><td><Status value={e.type} tone={eventTone(e.type)} /></td><td>{when(e.occurredAt)}</td><td>{fmtVoltage(e.batteryVoltage)}</td>
                <td><Status value={c.label} tone={c.tone} /></td><td>{e.receivedAt ? `Received ${fmtTime(e.receivedAt)}` : "Awaiting synchronization"}</td></tr>); })}
          </Table>
        )}
      </Panel>
      <DemoNote />
    </div>
  );
}
