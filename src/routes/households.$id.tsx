import { createFileRoute, Link } from "@tanstack/react-router";
import { getHousehold, getDevice, useIncidents } from "@/lib/store";
import { fmtShortDate, fmtTime } from "@/lib/format";
import { Panel, Field, Status, DemoNote } from "@/components/prism/ui";

export const Route = createFileRoute("/households/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Household ${params.id} — BFP-PRISM` },
      { name: "description", content: `Registered profile and pre-arrival details for household ${params.id}.` },
      { property: "og:title", content: `Household ${params.id} — BFP-PRISM` },
      { property: "og:description", content: `Household profile ${params.id}.` },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { id } = Route.useParams();
  const h = getHousehold(id);
  const inc = useIncidents().filter((i) => i.householdId === id);
  if (!h) return <div className="py-16 text-center text-sm">Household not found. <Link to="/households" className="underline">Back</Link></div>;
  const d = getDevice(h.deviceId)!;
  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground"><Link to="/households" className="underline">Household Registry</Link> / {h.id}</div>
      <h1 className="text-lg font-semibold">{h.homeownerName} <span className="font-normal text-muted-foreground">· {h.id}</span></h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Household Information">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Field label="Homeowner" value={h.homeownerName} emphasis />
            <Field label="Contact Number" value={h.contactNumber} emphasis />
            <div className="col-span-2"><Field label="Exact Address" value={h.address} /></div>
            <Field label="Barangay" value={h.barangay} />
            <Field label="Nearest Landmark" value={h.landmark} />
            <Field label="Coordinates" value={`${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}`} />
          </dl>
        </Panel>
        <Panel title="Pre-Arrival Details">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Field label="Road Accessibility" value={h.roadAccessibility} emphasis />
            <Field label="House Construction" value={h.houseConstruction} emphasis />
            <div className="col-span-2"><Field label="Additional Accessibility Notes" value={h.accessibilityNotes} /></div>
            <Field label="Assigned IoT Device" value={d.id} />
            <Field label="Device Status" value={<Status value={d.status} />} />
          </dl>
        </Panel>
      </div>
      <Panel title="Incident Record" bodyClass="divide-y divide-border">
        {inc.length === 0 && <p className="p-4 text-sm text-muted-foreground">No incidents recorded.</p>}
        {inc.map((i) => (
          <Link key={i.id} to="/incidents/$id" params={{ id: i.id }} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-sm hover:bg-muted">
            <span className="font-medium">{i.id}</span><span>{i.hazardType}</span><Status value={i.riskLevel} />
            <span className="text-muted-foreground">{fmtShortDate(i.detectedAt)} {fmtTime(i.detectedAt)}</span><span>{i.responseStatus === "Resolved" ? i.outcome : i.responseStatus}</span>
          </Link>
        ))}
      </Panel>
      <DemoNote />
    </div>
  );
}
