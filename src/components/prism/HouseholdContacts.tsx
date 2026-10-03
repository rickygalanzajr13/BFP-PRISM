// Registered household contacts + optional accessibility tags (authorized BFP views only).
import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { saveContact, removeContact } from "@/lib/store";
import { ACCESSIBILITY_TAGS, type AccessibilityTag, type Household, type RegisteredContact } from "@/lib/types";
import { Panel, btnCls, btnPrimaryCls, inputCls } from "./ui";
import { cn } from "@/lib/utils";

export function TagChip({ tag }: { tag: string }) {
  return <span className="inline-flex items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">{tag}</span>;
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  relationshipToHousehold: z.string().trim().max(60),
  contactNumber: z.string().trim().max(20).regex(/^[0-9+\s()-]*$/, "Use digits, spaces, +, - or () only."),
  smsEnabled: z.boolean(),
}).refine((v) => !v.smsEnabled || v.contactNumber.length > 0, { path: ["contactNumber"], message: "Contact number is required when SMS is enabled." });

const empty = (): RegisteredContact => ({ contactId: `C-${Date.now()}`, name: "", relationshipToHousehold: "", contactNumber: "", smsEnabled: true, isPrimaryContact: false, accessibilityTags: [] });

function ContactDialog({ householdId, initial, hasOtherPrimary, onClose }: { householdId: string; initial: RegisteredContact; hasOtherPrimary: boolean; onClose: () => void }) {
  const [c, setC] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toggleTag = (t: AccessibilityTag) =>
    setC((p) => ({ ...p, accessibilityTags: p.accessibilityTags.includes(t) ? p.accessibilityTags.filter((x) => x !== t) : [...p.accessibilityTags, t] }));
  const submit = () => {
    const r = schema.safeParse(c);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    saveContact(householdId, { ...c, ...r.data });
    onClose();
  };
  const label = "mb-1 block text-xs font-medium text-muted-foreground";
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial.name ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>Registered contacts can receive household emergency SMS and support pre-arrival information.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={label} htmlFor="c-name">Name *</label>
            <input id="c-name" className={inputCls + " w-full"} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
            {errors['name'] && <p className="mt-1 text-xs text-critical">{errors['name']}</p>}</div>
          <div><label className={label} htmlFor="c-rel">Relationship to Household</label>
            <input id="c-rel" className={inputCls + " w-full"} placeholder="e.g. Son, Caretaker" value={c.relationshipToHousehold} onChange={(e) => setC({ ...c, relationshipToHousehold: e.target.value })} /></div>
          <div><label className={label} htmlFor="c-num">Contact Number{c.smsEnabled && " *"}</label>
            <input id="c-num" className={inputCls + " w-full"} inputMode="tel" placeholder="09XX XXX XXXX" value={c.contactNumber} onChange={(e) => setC({ ...c, contactNumber: e.target.value })} />
            {errors['contactNumber'] && <p className="mt-1 text-xs text-critical">{errors['contactNumber']}</p>}</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.smsEnabled} onChange={(e) => setC({ ...c, smsEnabled: e.target.checked })} /> SMS Enabled</label>
          <div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.isPrimaryContact} onChange={(e) => setC({ ...c, isPrimaryContact: e.target.checked })} /> Primary Contact</label>
            {c.isPrimaryContact && hasOtherPrimary && <p className="mt-1 text-xs text-muted-foreground">This will replace the current primary contact.</p>}
          </div>
          <fieldset className="sm:col-span-2">
            <legend className={label}>Accessibility Information (optional)</legend>
            <p className="mb-2 text-xs text-muted-foreground">Select any that apply. Used only to support BFP pre-arrival information.</p>
            <div className="flex flex-wrap gap-1.5">
              {ACCESSIBILITY_TAGS.map((t) => {
                const on = c.accessibilityTags.includes(t);
                return <button key={t} type="button" aria-pressed={on} onClick={() => toggleTag(t)}
                  className={cn("rounded-sm border px-2 py-1 text-xs font-medium", on ? "border-foreground bg-foreground text-background" : "border-input bg-card text-foreground hover:bg-muted")}>{t}</button>;
              })}
            </div>
          </fieldset>
        </div>
        <DialogFooter className="gap-2">
          <button className={btnCls} onClick={onClose}>Cancel</button>
          <button className={btnPrimaryCls} onClick={submit}>Save Contact</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RegisteredContactsPanel({ household }: { household: Household }) {
  const [editing, setEditing] = useState<RegisteredContact | null>(null);
  const [removing, setRemoving] = useState<RegisteredContact | null>(null);
  const list = household.registeredContacts;
  const sms = list.filter((c) => c.smsEnabled).length;
  return (
    <Panel title={`Registered Contacts (${list.length})`} action={<button className={btnCls} onClick={() => setEditing(empty())}>Add Contact</button>}>
      <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">{sms} SMS recipient{sms === 1 ? "" : "s"} · Accessibility information is optional and visible to authorized BFP personnel only.</p>
      {list.length === 0 && <p className="p-4 text-sm text-muted-foreground">No registered contacts.</p>}
      <ul className="grid gap-3 p-4 md:grid-cols-2">
        {list.map((c) => (
          <li key={c.contactId} className="min-w-0 rounded-sm border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 break-words font-semibold">{c.name}{c.isPrimaryContact && <span className="ml-2 align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground">Primary</span>}</div>
              <div className="flex gap-1.5">
                <button className={btnCls + " h-7 px-2 text-xs"} onClick={() => setEditing(c)}>Edit</button>
                <button className={btnCls + " h-7 px-2 text-xs"} onClick={() => setRemoving(c)}>Remove</button>
              </div>
            </div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
              <dt className="text-muted-foreground">Relationship</dt><dd className="break-words">{c.relationshipToHousehold || "—"}</dd>
              <dt className="text-muted-foreground">Contact</dt><dd className="break-words">{c.contactNumber || "—"}</dd>
              <dt className="text-muted-foreground">SMS Enabled</dt><dd>{c.smsEnabled ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Primary Contact</dt><dd>{c.isPrimaryContact ? "Yes" : "No"}</dd>
            </dl>
            <div className="mt-2 flex flex-wrap gap-1">{c.accessibilityTags.length ? c.accessibilityTags.map((t) => <TagChip key={t} tag={t} />) : <span className="text-xs text-muted-foreground">No accessibility tags</span>}</div>
          </li>
        ))}
      </ul>
      {editing && <ContactDialog householdId={household.id} initial={editing} onClose={() => setEditing(null)}
        hasOtherPrimary={list.some((c) => c.isPrimaryContact && c.contactId !== editing.contactId)} />}
      <AlertDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove contact?</AlertDialogTitle>
            <AlertDialogDescription>{removing?.name} will no longer receive household emergency SMS.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removing && removeContact(household.id, removing.contactId)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
