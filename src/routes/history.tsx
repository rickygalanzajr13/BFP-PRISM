import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useIncidents, getHousehold } from "@/lib/store";
import { meta } from "@/lib/meta";
import { fmtShortDate, fmtTime, fmtDuration } from "@/lib/format";
import { Panel, Status, Table, PageHeader, Select, inputCls, DemoNote } from "@/components/prism/ui";

export const Route = createFileRoute("/history")({
  head: () => meta("Incident History", "Searchable record of past incidents, response times and outcomes."),
  component: History,
});

function History() {
  const rows0 = useIncidents().filter((i) => i.responseStatus === "Resolved");
  const nav = useNavigate();
  const [q, setQ] = useState(""); const [date, setDate] = useState(""); const [hazard, setHazard] = useState("");
  const [risk, setRisk] = useState(""); const [outcome, setOutcome] = useState(""); const [status, setStatus] = useState("");
  const s = q.toLowerCase();
  const rows = rows0.filter((i) => { const h = getHousehold(i.householdId)!;
    return (!s || [i.id, h.address, h.homeownerName].some((v) => v.toLowerCase().includes(s)))
      && (!date || fmtShortDate(i.detectedAt) === date) && (!hazard || i.hazardType === hazard)
      && (!risk || i.riskLevel === risk) && (!outcome || i.outcome === outcome) && (!status || i.responseStatus === status); });

  return (
    <div>
      <PageHeader title="Incident History" sub={`${rows.length} of ${rows0.length} records`} />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <input className={inputCls + " w-full md:w-72"} placeholder="Search incident ID, address, homeowner" value={q} onChange={(e) => setQ(e.target.value)} />
          <input type="date" aria-label="Date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Hazard" value={hazard} onChange={setHazard} options={["Fire / Smoke", "Gas Leak", "Smoke", "High Temperature"]} />
          <Select label="Risk" value={risk} onChange={setRisk} options={["Critical", "Warning"]} />
          <Select label="Response Status" value={status} onChange={setStatus} options={["Resolved"]} />
          <Select label="Outcome" value={outcome} onChange={setOutcome} options={["Resolved", "False Alert"]} />
        </div>
        <Table head={["Date/Time", "Incident ID", "Address", "Hazard", "Risk Level", "Alert Status", "Response Status", "Response Time", "Incident Outcome"].map((l) => ({ key: l, label: l }))}>
          {rows.map((i) => (
            <tr key={i.id} className="cursor-pointer" onClick={() => nav({ to: "/incidents/$id", params: { id: i.id } })}>
              <td className="whitespace-nowrap">{fmtShortDate(i.detectedAt)} {fmtTime(i.detectedAt)}</td>
              <td className="font-medium underline">{i.id}</td><td>{getHousehold(i.householdId)?.address}</td><td>{i.hazardType}</td>
              <td><Status value={i.riskLevel} /></td><td>{i.alertStatus}</td><td>{i.responseStatus}</td>
              <td>{fmtDuration(i.responseTime)}</td><td><Status value={i.outcome} /></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">No records match the filters.</td></tr>}
        </Table>
      </Panel>
      <DemoNote />
    </div>
  );
}
