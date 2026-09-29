import { Link } from "@tanstack/react-router";
import type { Incident } from "@/lib/types";
import { getHousehold } from "@/lib/store";
import { fmtTime } from "@/lib/format";
import { Status, btnPrimaryCls } from "./ui";

export function IncidentPopup({ i }: { i: Incident }) {
  const h = getHousehold(i.householdId);
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between"><span className="font-semibold">{i.id}</span><Status value={i.riskLevel} strong /></div>
      {row("Hazard", i.hazardType)}
      {row("Homeowner", h?.homeownerName)}
      {row("Address", `${h?.address}, ${h?.barangay}`)}
      {row("Device", i.deviceId)}
      {row("Response", i.responseStatus)}
      {row("Detected", fmtTime(i.detectedAt))}
      <Link to="/incidents/$id" params={{ id: i.id }} className={btnPrimaryCls + " mt-2 w-full"}>View Incident</Link>
    </div>
  );
}

export function HouseholdPopup({ h, deviceStatus }: { h: { id: string; homeownerName: string; address: string; barangay: string; landmark: string; deviceId: string }; deviceStatus: string }) {
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>;
  return (
    <div className="space-y-1">
      <div className="font-semibold">{h.homeownerName}</div>
      {row("Address", h.address)}
      {row("Barangay", h.barangay)}
      {row("Landmark", h.landmark)}
      {row("Device", h.deviceId)}
      {row("Connection", <Status value={deviceStatus} />)}
      <Link to="/households/$id" params={{ id: h.id }} className={btnPrimaryCls + " mt-2 w-full"}>View Household</Link>
    </div>
  );
}
