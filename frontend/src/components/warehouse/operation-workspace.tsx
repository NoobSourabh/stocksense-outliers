"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { StatusBadge } from "@/components/status-badge";

export type OperationKind = "receipts" | "deliveries" | "adjustments";

const settings = {
  receipts: { label: "Receipt", plural: "Receipts", source: "Supplier", target: "Destination location", reference: "WH/IN/0005", partner: "Apex Metals", product: "Steel Rods", qty: "24 kg" },
  deliveries: { label: "Delivery", plural: "Deliveries", source: "Source location", target: "Customer", reference: "WH/OUT/0004", partner: "Northstar Offices", product: "Ergo Chair", qty: "5 units" },
  adjustments: { label: "Adjustment", plural: "Adjustments", source: "Location", target: "Reason", reference: "WH/ADJ/0007", partner: "Cycle count", product: "Ergo Chair", qty: "Count: 8 units" },
} satisfies Record<OperationKind, { label: string; plural: string; source: string; target: string; reference: string; partner: string; product: string; qty: string }>;

export function OperationWorkspace({ kind, mode, id }: { kind: OperationKind; mode: "new" | "detail"; id?: string }) {
  const config = settings[kind];
  const [status, setStatus] = useState(kind === "deliveries" ? "Waiting" : "Draft");
  const [notice, setNotice] = useState("");

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(mode === "new" ? `${config.label} draft saved locally. Connect the operations API to persist it.` : "Changes saved locally for this demo.");
  }

  const canReady = status === "Draft" || status === "Waiting";
  const canValidate = status === "Ready";
  const displayRef = mode === "new" ? "Assigned on save" : (id === "demo" ? config.reference : id ?? config.reference);

  return (
    <RouteScaffold section={`Operations / ${config.plural}`} title={mode === "new" ? `New ${config.label.toLowerCase()}` : `${config.label} ${displayRef}`} description={mode === "new" ? `Prepare a ${config.label.toLowerCase()} and its product lines.` : `Review the operation details, schedule, and product quantities.`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/operations/${kind}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to {config.plural.toLowerCase()}</Link>
        {mode === "detail" && <StatusBadge status={status} />}
      </div>
      <form onSubmit={saveDraft}>
        <RoutePanel title="Operation details" description="Reference and responsible user are assigned by the system when connected to the backend.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Reference" defaultValue={displayRef} readOnly />
            <Field label={config.source} defaultValue={kind === "receipts" ? "Apex Metals" : kind === "deliveries" ? "Rack A" : "Rack A"} />
            <Field label={config.target} defaultValue={kind === "receipts" ? "Receiving Bay" : kind === "deliveries" ? "Northstar Offices" : "Damaged during handling"} />
            <Field label="Schedule date" type="date" defaultValue="2026-09-27" />
            <Field label="Responsible" defaultValue="Alex Morgan" />
          </div>
        </RoutePanel>

        <div className="mt-5">
          <RoutePanel title="Product lines" description={kind === "adjustments" ? "Enter the physical count; the server calculates the adjustment delta." : "Add the products and quantities included in this operation."}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><th className="px-3 py-3 font-medium">Product</th><th className="px-3 py-3 font-medium">Location</th><th className="px-3 py-3 font-medium">Quantity</th><th className="px-3 py-3 font-medium">Availability</th></tr></thead>
                <tbody><tr className="border-b border-border/70"><td className="px-3 py-3"><input defaultValue={config.product} aria-label="Product" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></td><td className="px-3 py-3"><input defaultValue="Rack A" aria-label="Location" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></td><td className="px-3 py-3"><input defaultValue={config.qty} aria-label="Quantity" className={`h-9 w-full rounded-md border bg-background px-3 text-sm ${kind === "deliveries" ? "border-destructive/50 text-destructive" : "border-input"}`} /></td><td className={`px-3 py-3 text-sm ${kind === "deliveries" ? "font-medium text-destructive" : "text-muted-foreground"}`}>{kind === "deliveries" ? "5 units free · 5 requested" : "Available"}</td></tr></tbody>
              </table>
            </div>
            {kind === "deliveries" && <p role="note" className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">This line is under-covered and will wait for stock before it can be validated.</p>}
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setNotice("Add-line editing will be available when the operation API is connected.")}><Plus /> Add product line</Button>
          </RoutePanel>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="min-h-5 text-sm text-muted-foreground" role="status">{notice}</p>
          <div className="flex flex-wrap gap-2">
            {mode === "new" ? <Button type="submit"><Save /> Save draft</Button> : <>
              <Button type="submit" variant="outline"><Save /> Save</Button>
              {canReady && <Button type="button" variant="outline" onClick={() => { setStatus(kind === "deliveries" ? "Waiting" : "Ready"); setNotice(kind === "deliveries" ? "Delivery remains waiting because stock is insufficient." : "Marked ready. Validate to post stock changes."); }}><Check /> {kind === "deliveries" ? "Pick / Pack" : "Mark as ready"}</Button>}
              {canValidate && <Button type="button" onClick={() => { setStatus("Done"); setNotice("Validated in this demo. Connect the backend to post stock and ledger changes."); }}><Check /> Validate</Button>}
              {status !== "Done" && status !== "Canceled" && <Button type="button" variant="ghost" onClick={() => { setStatus("Canceled"); setNotice("Operation canceled."); }}>Cancel</Button>}
            </>}
          </div>
        </div>
      </form>
    </RouteScaffold>
  );
}

function Field({ label, defaultValue, type = "text", readOnly = false }: { label: string; defaultValue: string; type?: string; readOnly?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input type={type} defaultValue={defaultValue} readOnly={readOnly} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-normal read-only:bg-muted" /></label>;
}
