import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useIncidents, useHousehold, getPrimaryContact, accessibilitySummary, markReceived, markResponding, markResolved } from "@/lib/store";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { fmtDate, fmtTime, fmtDuration } from "@/lib/format";
import { RESPONSE_STEPS } from "@/lib/types";
import { IncidentMap } from "@/components/prism/IncidentMap";
import { Panel, Field, Status, toneOf, btnPrimaryCls, DemoNote } from "@/components/prism/ui";
import { cn } from "@/lib/utils";
import { TagChip } from "@/components/prism/HouseholdContacts";

export const Route = createFileRoute("/incidents/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Incident ${params.id} — BFP-PRISM` },
      { name: "description", content: `Pre-arrival information, location and sensor readings for incident ${params.id}.` },
      { property: "og:title", content: `Incident ${params.id} — BFP-PRISM` },
      { property: "og:description", content: `Pre-arrival information for incident ${params.id}.` },
    ],
  }),
  component: IncidentDetail,
});

type Confirm = "resolved" | "false" | null;

function Actions({ id, status, onConfirm }: { id: string; status: string; onConfirm: (c: Confirm) => void }) {
  if (status === "Detected") return <button className={btnPrimaryCls} onClick={() => markReceived(id)}>Mark as Received</button>;
  if (status === "Received") return <button className={btnPrimaryCls} onClick={() => markResponding(id)}>Mark as Responding</button>;
  if (status === "Responding") return (
    <div className="flex gap-2">
      <button className={btnPrimaryCls} onClick={() => onConfirm("false")}>Mark as False Alert</button>
      <button className={btnPrimaryCls} onClick={() => onConfirm("resolved")}>Mark as Resolved</button>
    </div>
  );
  return null;
}

function IncidentDetail() {
  const { id } = Route.useParams();
  const i = useIncidents().find((x) => x.id === id);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const h = useHousehold(i?.householdId ?? "");
  if (!i || !h) return <div className="py-16 text-center text-sm">Incident {id} not found. <Link to="/incidents" className="underline">Back to Active Incidents</Link></div>;
  const primary = getPrimaryContact(h);
  const access = accessibilitySummary(h);
  const tagLabel = (t: string, n: number) => t === "Senior" || t === "PWD" || t === "Child/Minor" ? `${n} ${t === "Child/Minor" ? (n > 1 ? "Minors" : "Minor") : t === "Senior" && n > 1 ? "Seniors" : t}` : t;
  const step = RESPONSE_STEPS.indexOf(i.responseStatus);
  const crit = i.riskLevel === "Critical";
  const stamps = [i.detectedAt, i.receivedAt, i.respondingAt, i.resolvedAt];

  return (
    <div className="space-y-4">
      <div className={cn("border border-l-4 bg-card px-4 py-3", crit ? "border-l-critical" : "border-l-warning")}>
        <div className="text-xs text-muted-foreground"><Link to={i.responseStatus === "Resolved" ? "/history" : "/incidents"} className="underline">{i.responseStatus === "Resolved" ? "Incident History" : "Active Incidents"}</Link> / {i.id}</div>
        <h1 className="mt-1 text-lg font-semibold">INCIDENT #{i.id}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Status value={i.riskLevel} strong /><span className="font-medium">{i.hazardType} Detected</span>
          <span className="text-muted-foreground">Detected: {fmtDate(i.detectedAt)} — {fmtTime(i.detectedAt)}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Panel title="Location">
          <IncidentMap className="h-[360px]" selected={i.id} onSelect={() => {}}
            markers={[{ id: i.id, lat: i.latitude, lng: i.longitude, tone: toneOf(i.riskLevel), kind: "incident", label: i.id }]}
            renderPopup={() => <div><b>{h.address}</b><div className="text-xs text-muted-foreground">{h.landmark}</div><div className="mt-1 text-xs">{i.latitude.toFixed(4)}, {i.longitude.toFixed(4)}</div></div>} />
        </Panel>
        <Panel title="Immediate Incident Information">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
            <Field label="Homeowner / Involved Person" value={h.homeownerName} emphasis />
            <Field label="Primary Contact" value={primary?.contactNumber ? <a href={`tel:${primary.contactNumber.replace(/\s/g, "")}`} className="underline">{primary.contactNumber}</a> : "—"} emphasis />
            <div className="col-span-2"><Field label="Exact Address" value={`${h.address}, ${h.barangay}`} emphasis /></div>
            <div className="col-span-2"><Field label="Nearest Landmark" value={h.landmark} /></div>
            <Field label="Device" value={i.deviceId} />
            <Field label="Hazard Type" value={i.hazardType} />
            <Field label="Risk Level" value={<Status value={i.riskLevel} strong />} />
            <Field label="Alert Status" value={<Status value={i.alertStatus} />} />
            <Field label="Response Status" value={i.responseStatus} />
            <Field label="Incident Outcome" value={<Status value={i.outcome} />} />
          </dl>
        </Panel>
      </div>

      <section className="border border-foreground/20 bg-card">
        <header className="border-b border-border bg-muted px-4 py-2.5"><h2 className="text-sm font-bold uppercase tracking-wider">Pre-Arrival Information</h2></header>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <div className="border-l-4 border-l-foreground/60 pl-3"><div className="text-xs text-muted-foreground">Road Accessibility</div>
            <div className={cn("text-base font-semibold", h.roadAccessibility !== "Normal" && "text-critical")}>{h.roadAccessibility === "Normal" ? "Normal / Truck Accessible" : `${h.roadAccessibility} Access`}</div></div>
          <div className="border-l-4 border-l-foreground/60 pl-3"><div className="text-xs text-muted-foreground">House Construction</div>
            <div className={cn("text-base font-semibold", h.houseConstruction === "Light Materials" && "text-critical")}>{h.houseConstruction}</div></div>
          <div className="border-l-4 border-l-foreground/60 pl-3"><div className="text-xs text-muted-foreground">Additional Accessibility Notes</div>
            <div className="text-sm font-medium">{h.accessibilityNotes}</div></div>
        </div>
      </section>

      <Panel title="Household & Accessibility Information">
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_2fr]">
          <dl className="space-y-2">
            <Field label="Homeowner" value={h.homeownerName} emphasis />
            <Field label="Exact Address" value={h.address} />
            <Field label="Barangay" value={h.barangay} />
            <Field label="Nearest Landmark" value={h.landmark} />
          </dl>
          <div>
            <div className="text-xs text-muted-foreground">Accessibility Information</div>
            {access.length ? <div className="mt-1 flex flex-wrap gap-1">{access.map((a) => <TagChip key={a.tag} tag={tagLabel(a.tag, a.count)} />)}</div>
              : <div className="mt-0.5 text-sm text-muted-foreground">None registered</div>}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Registered Contacts</div>
            <ul className="mt-1 divide-y divide-border text-sm">
              {h.registeredContacts.map((c) => (
                <li key={c.contactId} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5">
                  <span className="break-words font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.relationshipToHousehold || "—"}</span>
                  {c.contactNumber ? <a href={`tel:${c.contactNumber.replace(/\s/g, "")}`} className="underline">{c.contactNumber}</a> : <span className="text-muted-foreground">No number</span>}
                  {c.isPrimaryContact && <span className="text-xs font-semibold uppercase tracking-wide">Primary</span>}
                  <span className="text-xs text-muted-foreground">SMS: {c.smsEnabled ? "Yes" : "No"}</span>
                </li>
              ))}
              {h.registeredContacts.length === 0 && <li className="py-1.5 text-muted-foreground">No registered contacts.</li>}
            </ul>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Sensor Information — ${i.deviceId}`}>
          <dl className="grid grid-cols-4 divide-x divide-border">
            {[["Temperature", `${i.temperature.toFixed(1)}°C`, i.temperature > 55 ? "critical" : i.temperature > 40 ? "warning" : "normal"],
              ["Smoke", i.smokeLevel.toUpperCase(), i.smokeLevel === "High" ? "critical" : i.smokeLevel === "Elevated" ? "warning" : "normal"],
              ["Gas", i.gasLevel.toUpperCase(), i.gasLevel === "High" ? "critical" : i.gasLevel === "Elevated" ? "warning" : "normal"],
              ["Flame", i.flameDetected ? "DETECTED" : "NONE", i.flameDetected ? "critical" : "normal"]].map(([l, v, t]) => (
              <div key={l} className="px-4 py-3"><dt className="text-xs text-muted-foreground">{l}</dt>
                <dd className={cn("mt-1 font-semibold", t === "critical" ? "text-critical" : t === "warning" ? "text-warning-foreground" : "text-foreground")}>{v}</dd></div>
            ))}
          </dl>
        </Panel>
        <Panel title="Response Status">
          <div className="p-4">
            <ol className="flex items-center text-xs">
              {RESPONSE_STEPS.map((s, idx) => (
                <li key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn("flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                      idx < step ? "border-foreground bg-foreground text-background" : idx === step ? "border-foreground bg-card text-foreground ring-2 ring-foreground/20" : "border-border text-muted-foreground")}>{idx + 1}</span>
                    <span className={cn(idx <= step ? "font-medium text-foreground" : "text-muted-foreground")}>{s}</span>
                    <span className="text-[11px] text-muted-foreground">{stamps[idx] ? fmtTime(stamps[idx]!) : "—"}</span>
                  </div>
                  {idx < RESPONSE_STEPS.length - 1 && <span className={cn("mx-1 mb-4 h-px flex-1", idx < step ? "bg-foreground" : "bg-border")} />}
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>Response time: {fmtDuration(i.responseTime)} · Outcome: <b className="text-foreground">{i.outcome}</b></span>
              <Actions id={i.id} status={i.responseStatus} onConfirm={setConfirm} />
            </div>
          </div>
        </Panel>
      </div>
      <DemoNote />
      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "false" ? "Mark as False Alert?" : "Resolve Incident?"}</AlertDialogTitle>
            <AlertDialogDescription>{confirm === "false" ? "Confirm that this incident was determined to be a false alert." : "Confirm that this incident has been resolved."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => markResolved(i.id, confirm === "false" ? "False Alert" : "Resolved")}>
              {confirm === "false" ? "Mark as False Alert" : "Mark as Resolved"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
