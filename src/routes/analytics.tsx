import { createFileRoute } from "@tanstack/react-router";
import { useIncidents } from "@/lib/store";
import { meta } from "@/lib/meta";
import { fmtDuration, fmtShortDate } from "@/lib/format";
import { Panel, PageHeader, DemoNote } from "@/components/prism/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => meta("Response Analytics", "Historical incident counts, acknowledgment times and false-alert rates."),
  component: Analytics,
});

function Bars({ data, colorOf }: { data: [string, number][]; colorOf?: (k: string) => string }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <div className="space-y-2 p-4">
      {data.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm">
          <span className="text-muted-foreground">{k}</span>
          <div className="h-3 bg-muted"><div className={cn("h-full", colorOf?.(k) ?? "bg-foreground/70")} style={{ width: `${(v / max) * 100}%` }} /></div>
          <span className="text-right font-medium">{typeof v === "number" && v > 60 ? fmtDuration(Math.round(v)) : v}</span>
        </div>
      ))}
    </div>
  );
}

function Analytics() {
  const all = useIncidents();
  const acked = all.filter((i) => i.responseTime != null);
  const avgAck = Math.round(acked.reduce((s, i) => s + i.responseTime!, 0) / Math.max(1, acked.length));
  const resolved = all.filter((i) => i.resolvedAt && i.receivedAt);
  const avgUpd = Math.round(resolved.reduce((s, i) => s + (new Date(i.resolvedAt!).getTime() - new Date(i.receivedAt!).getTime()) / 1000, 0) / Math.max(1, resolved.length));
  const count = (f: (i: (typeof all)[number]) => string) => Object.entries(all.reduce<Record<string, number>>((m, i) => ((m[f(i)] = (m[f(i)] ?? 0) + 1), m), {}));
  const byDay = Object.entries(acked.reduce<Record<string, number[]>>((m, i) => ((m[fmtShortDate(i.detectedAt)] ??= []).push(i.responseTime!), m), {}))
    .sort().slice(-7).map(([d, a]) => [d.slice(5), a.reduce((x, y) => x + y, 0) / a.length] as [string, number]);

  const stats = [["Total Incidents", String(all.length)], ["Active Incidents", String(all.filter((i) => i.responseStatus !== "Resolved").length)],
    ["Resolved Incidents", String(all.filter((i) => i.outcome === "Resolved").length)], ["False Alerts", String(all.filter((i) => i.outcome === "False Alert").length)],
    ["Avg. Response Time", fmtDuration(avgAck)], ["Avg. Received-to-Resolved", fmtDuration(avgUpd)]];

  return (
    <div className="space-y-4">
      <PageHeader title="Response Analytics" sub="All recorded incidents in the demo dataset" />
      <div className="grid grid-cols-2 border border-border bg-card lg:grid-cols-6">
        {stats.map(([l, v], i) => (
          <div key={l} className={cn("px-4 py-3", i > 0 && "lg:border-l", i % 2 === 1 && "border-l", i >= 2 && "max-lg:border-t", "border-border")}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="mt-1 text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Incidents by Hazard Type"><Bars data={count((i) => i.hazardType)} /></Panel>
        <Panel title="Incidents by Risk Level"><Bars data={count((i) => i.riskLevel)} colorOf={(k) => (k === "Critical" ? "bg-critical" : "bg-warning")} /></Panel>
        <Panel title="Avg. Acknowledgment Time — Last 7 Days With Incidents"><Bars data={byDay} /></Panel>
        <Panel title="Incident Outcome — Resolved vs False Alerts"><Bars data={count((i) => i.outcome)} colorOf={(k) => (k === "Resolved" ? "bg-normal" : k === "Pending" ? "bg-warning" : "bg-offline")} /></Panel>
      </div>
      <DemoNote />
    </div>
  );
}
