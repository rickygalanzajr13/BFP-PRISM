import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "critical" | "warning" | "normal" | "offline";

export function toneOf(v: string): Tone {
  const s = v.toLowerCase();
  if (s === "critical" || s === "not acknowledged" || s === "detected") return "critical";
  if (s === "warning" || s === "pending") return "warning";
  if (s === "offline" || s === "false alert") return "offline";
  return "normal";
}

const dot: Record<Tone, string> = { critical: "bg-critical", warning: "bg-warning", normal: "bg-normal", offline: "bg-offline" };
const text: Record<Tone, string> = { critical: "text-critical", warning: "text-warning-foreground", normal: "text-normal", offline: "text-muted-foreground" };

export function Status({ value, tone, strong }: { value: string; tone?: Tone; strong?: boolean }) {
  const t = tone ?? toneOf(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", text[t], strong && "font-semibold uppercase tracking-wide text-xs")}>
      <span className={cn("size-2 shrink-0 rounded-full", dot[t])} />
      {value}
    </span>
  );
}

export function Panel({ title, action, children, className, bodyClass }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("rounded-sm border border-border bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Field({ label, value, emphasis }: { label: string; value: ReactNode; emphasis?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-sm text-foreground", emphasis && "font-semibold")}>{value}</dd>
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export const inputCls = "h-8 rounded-sm border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring";
export const btnCls = "inline-flex h-8 items-center justify-center rounded-sm border border-input bg-card px-3 text-sm font-medium text-foreground hover:bg-muted";
export const btnPrimaryCls = "inline-flex h-9 items-center justify-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";

export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select aria-label={label} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: All</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function Table({ head, children, onSort, sort }: { head: { key: string; label: string; sortable?: boolean }[]; children: ReactNode; onSort?: (k: string) => void; sort?: { key: string; dir: 1 | -1 } }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted text-left">
            {head.map((h) => (
              <th key={h.key} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {h.sortable && onSort ? (
                  <button className="uppercase hover:text-foreground" onClick={() => onSort(h.key)}>
                    {h.label}{sort?.key === h.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                  </button>
                ) : h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-3 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-border [&_tr:last-child]:border-0 [&_tr:hover]:bg-muted/60">{children}</tbody>
      </table>
    </div>
  );
}

export function DemoNote() {
  return <p className="mt-3 text-xs text-muted-foreground">Demo data — all names, contact numbers and addresses are fictional.</p>;
}

export const PAGE_SIZE = 10;

/** Fixed-size pagination over already-filtered rows. Resets to page 1 when resetKey changes; clamps invalid pages. */
export function usePagination<T>(rows: T[], resetKey: string) {
  const [page, setPage] = useState(1);
  const [lastKey, setLastKey] = useState(resetKey);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  let current = page;
  if (lastKey !== resetKey) { setLastKey(resetKey); setPage(1); current = 1; }
  if (current > pages) current = 1;
  const start = (current - 1) * PAGE_SIZE;
  return { page: current, pages, total: rows.length, start, pageRows: rows.slice(start, start + PAGE_SIZE),
    setPage: (p: number) => setPage(Math.min(pages, Math.max(1, p))) };
}

function pageList(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = [1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages);
  const sorted = [...new Set(set)].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => { if (i && p - sorted[i - 1]! > 1) out.push("…"); out.push(p); });
  return out;
}

export function Pagination({ page, pages, total, start, setPage }: { page: number; pages: number; total: number; start: number; setPage: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5">
      <p className="text-xs text-muted-foreground">Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}</p>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
          <button className={btnCls + " disabled:opacity-50 disabled:hover:bg-card"} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          {pageList(page, pages).map((p, i) => p === "…"
            ? <span key={"e" + i} className="px-1.5 text-sm text-muted-foreground">…</span>
            : <button key={p} aria-current={p === page ? "page" : undefined} onClick={() => setPage(p)}
                className={cn(btnCls, "min-w-8 px-2", p === page && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}>{p}</button>)}
          <button className={btnCls + " disabled:opacity-50 disabled:hover:bg-card"} disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </div>
  );
}
