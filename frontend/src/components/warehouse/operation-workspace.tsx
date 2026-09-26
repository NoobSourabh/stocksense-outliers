"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Save } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { StatusBadge } from "@/components/status-badge";

export type OperationKind = "receipts" | "deliveries" | "adjustments";
const TYPE = { receipts: "receipt", deliveries: "delivery", adjustments: "adjustment" } as const;
const LABEL = { receipts: "Receipt", deliveries: "Delivery", adjustments: "Adjustment" } as const;

export function OperationWorkspace({ kind, mode, id }: { kind: OperationKind; mode: "new" | "detail"; id?: string }) {
  const type = TYPE[kind];
  const label = LABEL[kind];
  const router = useRouter();
  const queryClient = useQueryClient();
  const operation = useQuery({ queryKey: ["operation", id], queryFn: () => stockApi.operation(id!), enabled: mode === "detail" && !!id });
  const products = useQuery({ queryKey: ["products", "choices"], queryFn: () => stockApi.products() });
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const partners = useQuery({ queryKey: ["partners", type === "receipt" ? "supplier" : "customer"], queryFn: () => stockApi.partners(type === "receipt" ? "supplier" : "customer"), enabled: type !== "adjustment" });
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");

  const create = useMutation({
    mutationFn: () => stockApi.createOperation({
      type,
      partnerId: partnerId || null,
      sourceLocationId: type === "delivery" || type === "adjustment" ? locationId : null,
      destinationLocationId: type === "receipt" ? locationId : null,
      scheduleDate: type === "adjustment" ? null : scheduleDate,
      lines: [{ productId, quantity: type === "adjustment" ? "0" : quantity, ...(type === "adjustment" ? { countedQuantity: quantity, reason } : {}) }],
    }),
    onSuccess: async (created) => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["operations"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]);
      router.replace(`/operations/${kind}/${created.id}`);
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not create the operation."),
  });
  const action = useMutation({
    mutationFn: (name: "ready" | "validate" | "cancel") => stockApi.operationAction(id!, name),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["operation", id], updated);
      await Promise.all(["operations", "dashboard", "moves", "products", "product", "stock"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      setMessage(`Operation ${updated.status}.`);
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not update the operation."),
  });

  const allLocations = warehouses.data?.items.flatMap((warehouse) => warehouse.locations.map((location) => ({ ...location, warehouseName: warehouse.name }))) ?? [];
  const selectedProduct = products.data?.items.find((item) => item.id === productId);
  const data = operation.data;
  const isLoading = mode === "detail" ? operation.isPending : products.isPending || warehouses.isPending || (type !== "adjustment" && partners.isPending);
  const loadError = mode === "detail" ? operation.isError : products.isError || warehouses.isError || (type !== "adjustment" && partners.isError);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    create.mutate();
  }

  return <RouteScaffold section={`Operations / ${label}`} title={mode === "new" ? `New ${label.toLowerCase()}` : `${label} ${data?.reference ?? ""}`} description={mode === "new" ? `Create and schedule a ${label.toLowerCase()}.` : "Review the operation, then move it through the stock workflow."}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Link href={`/operations/${kind}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to {kind}</Link>
      {data && <StatusBadge status={data.status[0]?.toUpperCase() + data.status.slice(1)} />}
    </div>
    {isLoading ? <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading operation details…</p>
      : loadError ? <div className="grid justify-items-center gap-3 py-12 text-center"><p className="text-sm text-destructive">Couldn’t load the required inventory data.</p><Button variant="outline" onClick={() => { void operation.refetch(); void products.refetch(); void warehouses.refetch(); }}>Retry</Button></div>
        : <form onSubmit={submit}>
          <RoutePanel title="Operation details" description="The server assigns a reference and records the responsible user.">
            {mode === "new" ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {type !== "adjustment" && <Select label={type === "receipt" ? "Supplier" : "Customer"} value={partnerId} onChange={setPartnerId} options={(partners.data?.items ?? []).map((item) => [item.id, item.name] as [string, string])} />}
              <Select label={type === "receipt" ? "Destination location" : "Source location"} value={locationId} onChange={setLocationId} options={allLocations.filter((location) => location.kind === "internal").map((location) => [location.id, `${location.name} · ${location.warehouseName}`] as [string, string])} />
              {type !== "adjustment" && <Field label="Schedule date" type="date" value={scheduleDate} onChange={setScheduleDate} required />}
              {type === "adjustment" && <Field label="Reason" value={reason} onChange={setReason} required />}
            </div> : <Details operation={data!} />}
          </RoutePanel>
          <div className="mt-5"><RoutePanel title="Product lines" description={type === "adjustment" ? "Enter the counted quantity; the server calculates the delta when validated." : "Quantities are validated against stock availability by the server."}>
            {mode === "new" ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Product" value={productId} onChange={setProductId} options={(products.data?.items ?? []).map((item) => [item.id, `${item.name} · ${item.sku}`] as [string, string])} />
              <Field label={type === "adjustment" ? `Counted quantity${selectedProduct ? ` (${selectedProduct.unit})` : ""}` : `Quantity${selectedProduct ? ` (${selectedProduct.unit})` : ""}`} type="number" value={quantity} onChange={setQuantity} required min="0" step="0.001" />
              {type === "delivery" && selectedProduct && <p className="self-end pb-2 text-sm text-muted-foreground">Free to use: {selectedProduct.freeToUse ?? "—"} {selectedProduct.unit}</p>}
            </div> : <Lines operation={data!} />}
            {type === "delivery" && mode === "new" && selectedProduct && Number(quantity) > Number(selectedProduct.freeToUse ?? 0) && <p role="note" className="mt-4 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-warning">This quantity exceeds free-to-use stock. The operation will remain waiting until covered.</p>}
          </RoutePanel></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="min-h-5 text-sm text-muted-foreground" role="status">{message}</p><div className="flex flex-wrap gap-2">
            {mode === "new" ? <Button type="submit" disabled={create.isPending || !productId || !locationId || (type !== "adjustment" && !partnerId)}><Save /> {create.isPending ? "Creating…" : `Create ${label.toLowerCase()}`}</Button> : <>
              {data?.status === "draft" || data?.status === "waiting" ? <Button type="button" variant="outline" disabled={action.isPending} onClick={() => action.mutate("ready")}><Check /> {data?.status === "draft" ? "Mark as ready" : "Recheck availability"}</Button> : null}
              {data?.status === "ready" && <Button type="button" disabled={action.isPending} onClick={() => action.mutate("validate")}><Check /> Validate</Button>}
              {data && !["done", "canceled"].includes(data.status) && <Button type="button" variant="ghost" disabled={action.isPending} onClick={() => action.mutate("cancel")}>Cancel</Button>}
              {data?.status === "done" && <span className="self-center text-sm text-success">Validated · stock and ledger updated</span>}
            </>}
          </div></div>
        </form>}
  </RouteScaffold>;
}

function Details({ operation }: { operation: Operation }) {
  return <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Reference", operation.reference], ["Contact", operation.partnerName ?? "—"], ["From", operation.sourceLocationName ?? "—"], ["To", operation.destinationLocationName ?? "—"], ["Schedule date", operation.scheduleDate ?? "—"], ["Responsible", operation.createdByName ?? "—"]].map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}</dl>;
}

function Lines({ operation }: { operation: Operation }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><th className="px-3 py-3 font-medium">Product</th><th className="px-3 py-3 font-medium">SKU</th><th className="px-3 py-3 font-medium">Quantity / count</th><th className="px-3 py-3 font-medium">Availability / delta</th></tr></thead><tbody>{operation.lines?.map((line) => <tr key={line.id} className="border-b border-border/70"><td className="px-3 py-3 text-sm">{line.productName}</td><td className="px-3 py-3 font-mono text-sm">{line.productSku}</td><td className="px-3 py-3 text-sm">{line.countedQuantity ?? line.quantity}</td><td className={`px-3 py-3 text-sm ${line.isShort ? "font-medium text-destructive" : "text-muted-foreground"}`}>{line.isShort ? "Insufficient free stock" : line.delta !== undefined && line.delta !== null ? `Delta ${line.delta}` : "—"}{line.reason ? ` · ${line.reason}` : ""}</td></tr>)}</tbody></table></div>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="grid min-w-0 gap-1.5 text-sm font-medium">{label}<select required value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-normal"><option value="">Select {label.toLowerCase()}</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}

function Field({ label, value, onChange, type = "text", required = false, min, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: string; step?: string }) {
  return <label className="grid min-w-0 gap-1.5 text-sm font-medium">{label}<Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} min={min} step={step} className="h-10 bg-background text-sm font-normal" /></label>;
}
