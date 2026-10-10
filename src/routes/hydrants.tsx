import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { meta } from "@/lib/meta";
import { useHydrants, updateHydrant, deleteHydrant, hydrantTone } from "@/lib/store";
import { isInScope, SCOPE_OUTSIDE_MESSAGE } from "@/lib/geo-scope";
import { HYDRANT_SOURCE } from "@/lib/hydrant-data";
import type { Hydrant, HydrantOperationalStatus, CoordinateStatus } from "@/lib/types";
import { Panel, PageHeader, Status, Select, inputCls, btnCls, btnPrimaryCls, usePagination, Pagination } from "@/components/prism/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/hydrants")({
  head: () => meta("Fire Hydrants", "Fire hydrant registry for Brgy. Commonwealth from the Commonwealth Fire Substation inventory."),
  component: HydrantsPage,
});

const OPS: HydrantOperationalStatus[] = ["Operational", "Non-Operational", "Unknown"];
const COORD: CoordinateStatus[] = ["Verified", "Verification Required"];

function HydrantsPage() {
  const all = useHydrants();
  const [q, setQ] = useState("");
  const [op, setOp] = useState("");
  const [co, setCo] = useState("");
  const [edit, setEdit] = useState<Hydrant | null>(null);
  const [del, setDel] = useState<Hydrant | null>(null);
  const s = q.toLowerCase();
  const rows = all.filter((h) => (!s || h.id.toLowerCase().includes(s) || h.location.toLowerCase().includes(s))
    && (op === "" || h.operationalStatus === op) && (co === "" || h.coordinateStatus === co));

  const pg = usePagination(rows, JSON.stringify([q, op, co]));
  return (
    <div>
      <PageHeader title="Fire Hydrants" sub={`${all.length} registered · Source: ${HYDRANT_SOURCE}`} right={
        <div className="flex flex-wrap items-center gap-3">
          <input className={inputCls + " w-64"} placeholder="Search hydrant ID or location" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select label="Operational status" value={op} onChange={setOp} options={OPS} />
          <Select label="Coordinates" value={co} onChange={setCo} options={COORD} />
        </div>} />
      <Panel bodyClass="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>{["Hydrant ID", "Exact Location", "Operational Status", "Coordinates", "Recorded Pressure", "Recorded Flow Rate", "Remarks", "Actions"].map((l) => <th key={l} className="px-3 py-2 font-medium">{l}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pg.pageRows.map((h) => (
              <tr key={h.id} className="align-top">
                <td className="px-3 py-2 font-medium">{h.id}</td>
                <td className="px-3 py-2">{h.location}<div className="text-xs text-muted-foreground">{h.barangay}</div></td>
                <td className="px-3 py-2"><Status value={h.operationalStatus} tone={hydrantTone(h.operationalStatus)} strong={h.operationalStatus === "Non-Operational"} />
                  {h.recordedStatus !== h.operationalStatus && <div className="text-xs text-muted-foreground">Recorded: {h.recordedStatus}</div>}</td>
                <td className="px-3 py-2"><Status value={h.coordinateStatus} tone={h.coordinateStatus === "Verified" ? "normal" : "warning"} />
                  <div className="text-xs tabular-nums text-muted-foreground">{h.latitude}, {h.longitude}</div>
                  {!isInScope(h.latitude, h.longitude) && <div className="mt-1"><Status value="Outside project scope" tone="warning" /></div>}</td>
                <td className="px-3 py-2">{h.recordedPressurePsi != null ? `${h.recordedPressurePsi} PSI` : "—"}</td>
                <td className="px-3 py-2">{h.recordedFlowGpm != null ? `${h.recordedFlowGpm} GPM` : "—"}</td>
                <td className="max-w-64 px-3 py-2 text-xs">{h.remarks || "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">
                  {h.coordinateStatus === "Verified" && <Link to="/map" search={{ focus: h.id }} className="mr-3 underline">Map</Link>}
                  <button className="mr-3 underline" onClick={() => setEdit(h)}>Edit</button>
                  <button className="text-critical underline" onClick={() => setDel(h)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No hydrants match the filters.</td></tr>}
          </tbody>
        </table>
        <Pagination {...pg} />
      </Panel>
      <p className="mt-3 text-xs text-muted-foreground">Hydrant IDs are system-generated, not official BFP identifiers. Pressure and flow are recorded inventory values, not live readings.</p>

      {edit && <EditDialog h={edit} onClose={() => setEdit(null)} />}
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {del?.id}?</AlertDialogTitle>
            <AlertDialogDescription>{del?.location} will be removed from the registry and map.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (del) deleteHydrant(del.id); setDel(null); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditDialog({ h, onClose }: { h: Hydrant; onClose: () => void }) {
  const [f, setF] = useState({ location: h.location, operationalStatus: h.operationalStatus, coordinateStatus: h.coordinateStatus,
    latitude: String(h.latitude), longitude: String(h.longitude),
    pressure: h.recordedPressurePsi == null ? "" : String(h.recordedPressurePsi), flow: h.recordedFlowGpm == null ? "" : String(h.recordedFlowGpm), remarks: h.remarks });
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const lat = Number(f.latitude), lng = Number(f.longitude);
  const valid = f.location.trim() && Number.isFinite(lat) && Number.isFinite(lng) && [f.pressure, f.flow].every((v) => v.trim() === "" || Number.isFinite(Number(v)));
  const lbl = "block text-xs text-muted-foreground";
  const save = () => {
    updateHydrant(h.id, { location: f.location.trim(), operationalStatus: f.operationalStatus, coordinateStatus: f.coordinateStatus,
      latitude: lat, longitude: lng, recordedPressurePsi: num(f.pressure), recordedFlowGpm: num(f.flow), remarks: f.remarks.trim() });
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {h.id}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2"><span className={lbl}>Exact location</span><input className={inputCls + " w-full"} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></label>
          <label><span className={lbl}>Operational status</span>
            <select className={inputCls + " w-full"} value={f.operationalStatus} onChange={(e) => setF({ ...f, operationalStatus: e.target.value as HydrantOperationalStatus })}>{OPS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label><span className={lbl}>Coordinate verification</span>
            <select className={inputCls + " w-full"} value={f.coordinateStatus} onChange={(e) => setF({ ...f, coordinateStatus: e.target.value as CoordinateStatus })}>{COORD.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label><span className={lbl}>Latitude</span><input className={inputCls + " w-full"} value={f.latitude} onChange={(e) => setF({ ...f, latitude: e.target.value })} /></label>
          <label><span className={lbl}>Longitude</span><input className={inputCls + " w-full"} value={f.longitude} onChange={(e) => setF({ ...f, longitude: e.target.value })} /></label>
          {Number.isFinite(lat) && Number.isFinite(lng) && !isInScope(lat, lng) && <p role="alert" className="col-span-2 text-xs font-medium text-warning">{SCOPE_OUTSIDE_MESSAGE} It will stay in the registry but will not be shown on the map.</p>}
          <p className="col-span-2 text-xs text-muted-foreground">Original source coordinates (kept for review): {h.sourceLatitude}, {h.sourceLongitude}. Recorded status: {h.recordedStatus}.</p>
          <label><span className={lbl}>Recorded pressure (PSI)</span><input className={inputCls + " w-full"} value={f.pressure} onChange={(e) => setF({ ...f, pressure: e.target.value })} placeholder="Not recorded" /></label>
          <label><span className={lbl}>Recorded flow rate (GPM)</span><input className={inputCls + " w-full"} value={f.flow} onChange={(e) => setF({ ...f, flow: e.target.value })} placeholder="Not recorded" /></label>
          <label className="col-span-2"><span className={lbl}>Remarks</span><textarea className={inputCls + " h-16 w-full py-1"} value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} /></label>
        </div>
        <DialogFooter><button className={btnCls} onClick={onClose}>Cancel</button><button className={btnPrimaryCls} disabled={!valid} onClick={save}>Save</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
