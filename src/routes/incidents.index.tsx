import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useIncidents, getHousehold } from "@/lib/store";
import { meta } from "@/lib/meta";
import { fmtTime, fmtShortDate } from "@/lib/format";
import { Panel, Status, Table, PageHeader, Select, inputCls, DemoNote } from "@/components/prism/ui";
import type { Incident } from "@/lib/types";
import { IncidentMap } from "@/components/prism/IncidentMap";
import { IncidentPopup } from "@/components/prism/IncidentPopup";
import { toneOf } from "@/components/prism/ui";

export const Route = createFileRoute("/incidents/")({
  head: () => meta("Active Incidents", "Filter, sort and open active incidents awaiting BFP response."),
  component: ActiveIncidents,
});

const riskRank = { Critical: 0, Warning: 1, Normal: 2 };

function ActiveIncidents() {
  const all = useIncidents();
  const [q, setQ] = useState(""); const [risk, setRisk] = useState(""); const [hazard, setHazard] = useState("");
  const [status, setStatus] = useState(""); const [date, setDate] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "risk", dir: 1 });

  const rows = useMemo(() => {
    const val = (i: Incident): string | number => ({ risk: riskRank[i.riskLevel], id: i.id, detected: i.detectedAt, hazard: i.hazardType, status: i.responseStatus } as Record<string, string | number>)[sort.key] ?? i.id;
    return all
      .filter((i) => i.responseStatus !== "Resolved")
      .filter((i) => { const h = getHousehold(i.householdId)!; const s = q.toLowerCase();
        return (!s || [i.id, h.address, h.homeownerName, h.barangay].some((v) => v.toLowerCase().includes(s)))
          && (!risk || i.riskLevel === risk) && (!hazard || i.hazardType === hazard) && (!status || i.responseStatus === status)
          && (!date || fmtShortDate(i.detectedAt) === date); })
      .sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [all, q, risk, hazard, status, date, sort]);

  const onSort = (key: string) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));

  return (
    <div>
      <PageHeader title="Active Incidents" sub={`${rows.length} incident(s) shown · select a row to locate it on the map`} />
      <div ref={mapRef} className="mb-4">
        <Panel title="Incident Locations">
          <IncidentMap className="h-[340px]" selected={sel} onSelect={setSel}
            markers={rows.map((i) => ({ id: i.id, lat: i.latitude, lng: i.longitude, tone: toneOf(i.riskLevel), kind: "incident" as const, label: i.id }))}
            renderPopup={(id) => { const inc = rows.find((r) => r.id === id); return inc ? <IncidentPopup i={inc} /> : null; }} />
        </Panel>
      </div>
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <input className={inputCls + " w-full md:w-80"} placeholder="Search by address, homeowner, or incident ID" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select label="Risk Level" value={risk} onChange={setRisk} options={["Critical", "Warning"]} />
          <Select label="Hazard" value={hazard} onChange={setHazard} options={["Fire / Smoke", "Gas Leak", "Smoke", "High Temperature"]} />
          <Select label="Status" value={status} onChange={setStatus} options={["Detected", "Received", "Responding"]} />
          <input type="date" aria-label="Date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Table sort={sort} onSort={onSort} head={[
          { key: "risk", label: "Risk", sortable: true }, { key: "id", label: "Incident ID", sortable: true }, { key: "addr", label: "Address" },
          { key: "owner", label: "Homeowner / Involved" }, { key: "hazard", label: "Hazard Type", sortable: true }, { key: "status", label: "Status", sortable: true },
          { key: "detected", label: "Detected", sortable: true }, { key: "alert", label: "Alert Status" }, { key: "a", label: "Action" }]}>
          {rows.map((i) => { const h = getHousehold(i.householdId)!; return (
            <tr key={i.id} className={"cursor-pointer " + (sel === i.id ? "bg-muted" : "")} onClick={() => { setSel(i.id); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}>
              <td><Status value={i.riskLevel} strong /></td><td className="font-medium">{i.id}</td>
              <td>{h.address}, {h.barangay}</td><td>{h.homeownerName}</td><td>{i.hazardType}</td><td>{i.responseStatus}</td>
              <td>{fmtTime(i.detectedAt)}</td><td><Status value={i.alertStatus} /></td>
              <td><Link to="/incidents/$id" params={{ id: i.id }} className="font-medium underline" onClick={(e) => e.stopPropagation()}>View</Link></td>
            </tr>); })}
          {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">No incidents match the filters.</td></tr>}
        </Table>
      </Panel>
      <DemoNote />
    </div>
  );
}
