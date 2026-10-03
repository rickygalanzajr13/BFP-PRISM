import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useHouseholds, getDevice } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Panel, Status, Table, PageHeader, Select, inputCls, DemoNote, usePagination, Pagination } from "@/components/prism/ui";

export const Route = createFileRoute("/households/")({
  head: () => meta("Household Registry", "Registered households, contacts and assigned sensor devices."),
  component: Registry,
});

function Registry() {
  const nav = useNavigate();
  const households = useHouseholds();
  const [q, setQ] = useState(""); const [brgy, setBrgy] = useState("");
  const rows = households.filter((h) => (!q || [h.id, h.homeownerName, h.address, ...h.registeredContacts.flatMap((c) => [c.name, c.contactNumber])].some((v) => v.toLowerCase().includes(q.toLowerCase()))) && (!brgy || h.barangay === brgy));
  const pg = usePagination(rows, JSON.stringify([q, brgy]));
  return (
    <div>
      <PageHeader title="Household Registry" sub={`${households.length} registered households`} />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <input className={inputCls + " w-72"} placeholder="Search homeowner, address, ID" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select label="Barangay" value={brgy} onChange={setBrgy} options={[...new Set(households.map((h) => h.barangay))]} />
        </div>
        <Table head={["Household ID", "Homeowner", "Address", "Barangay", "Assigned Device", "Device Status", "Contacts", ""].map((l) => ({ key: l || "a", label: l }))}>
          {pg.pageRows.map((h) => (
            <tr key={h.id} className="cursor-pointer" onClick={() => nav({ to: "/households/$id", params: { id: h.id } })}>
              <td className="font-medium">{h.id}</td><td>{h.homeownerName}</td><td>{h.address}</td>
              <td>{h.barangay}</td><td>{h.deviceId}</td><td><Status value={getDevice(h.deviceId)!.status} /></td>
              <td className="whitespace-nowrap text-muted-foreground">{h.registeredContacts.length} Registered Contact{h.registeredContacts.length === 1 ? "" : "s"}</td>
              <td><Link to="/households/$id" params={{ id: h.id }} className="font-medium underline">Open</Link></td>
            </tr>
          ))}
        </Table>
        <Pagination {...pg} />
      </Panel>
      <DemoNote />
    </div>
  );
}
