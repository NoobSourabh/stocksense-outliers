"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Edit2, Save } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { ApiError } from "@/lib/api";
import { showCreateSuccessToast, showUpdateSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { StatusBadge } from "@/components/status-badge";

export type OperationKind = "receipts" | "deliveries" | "adjustments" | "transfers";
const TYPE = { receipts: "receipt", deliveries: "delivery", adjustments: "adjustment", transfers: "transfer" } as const;
const LABEL = { receipts: "Receipt", deliveries: "Delivery", adjustments: "Adjustment", transfers: "Transfer" } as const;

function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(fallback.getTime())
      ? value
      : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(fallback);
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function OperationWorkspace({ kind, mode, id }: { kind: OperationKind; mode: "new" | "detail"; id?: string }) {
  if (mode === "new") {
    return (
      <Suspense
        fallback={
          <RouteScaffold
            section={`Operations / ${LABEL[kind]}`}
            title={`New ${LABEL[kind].toLowerCase()}`}
            description={`Create and schedule a ${LABEL[kind].toLowerCase()}.`}
          >
            <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading operation form…</p>
          </RouteScaffold>
        }
      >
        <NewOperationWorkspaceWrapper kind={kind} />
      </Suspense>
    );
  }
  return <DetailOperationWorkspace kind={kind} id={id!} />;
}

function NewOperationWorkspaceWrapper({ kind }: { kind: OperationKind }) {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") ?? "";
  const initialLocationId = searchParams.get("locationId") ?? "";
  const initialCount = searchParams.get("countedQuantity") ?? "";
  return (
    <NewOperationWorkspace
      key={`${kind}-${initialProductId}-${initialLocationId}-${initialCount}`}
      kind={kind}
      defaultProductId={initialProductId}
      defaultLocationId={initialLocationId}
      defaultCount={initialCount || "1"}
    />
  );
}

function NewOperationWorkspace({
  kind,
  defaultProductId,
  defaultLocationId,
  defaultCount,
}: {
  kind: OperationKind;
  defaultProductId: string;
  defaultLocationId: string;
  defaultCount: string;
}) {
  const type = TYPE[kind];
  const label = LABEL[kind];
  const usesPartner = type === "receipt" || type === "delivery";
  const router = useRouter();
  const queryClient = useQueryClient();

  const products = useQuery({ queryKey: ["products", "choices"], queryFn: () => stockApi.products() });
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const partners = useQuery({
    queryKey: ["partners", type === "receipt" ? "supplier" : "customer"],
    queryFn: () => stockApi.partners(type === "receipt" ? "supplier" : "customer"),
    enabled: usesPartner,
  });

  const [productId, setProductId] = useState(defaultProductId);
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [partnerId, setPartnerId] = useState("");
  const [quantity, setQuantity] = useState(defaultCount);
  const [reason, setReason] = useState("");
  const [scheduleDateTime, setScheduleDateTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return toDateTimeLocalString(d);
  });
  const [message, setMessage] = useState("");

  const create = useMutation({
    mutationFn: () => stockApi.createOperation({
      type,
      partnerId: partnerId || null,
      sourceLocationId: type === "delivery" || type === "adjustment" ? locationId : null,
      destinationLocationId: type === "receipt" ? locationId : null,
      scheduleDate: type === "adjustment" ? null : new Date(scheduleDateTime).toISOString(),
      lines: [{
        productId,
        quantity: type === "adjustment" ? "0" : quantity,
        ...(type === "adjustment" ? { countedQuantity: quantity, reason } : {}),
      }],
    }),
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      showCreateSuccessToast(label);
      router.replace(`/operations/${kind}/${created.id}`);
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Could not create the operation.");
      showErrorToast(error, `Could not create ${label.toLowerCase()}`);
    },
  });

  const allLocations = warehouses.data?.items.flatMap((warehouse) =>
    warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []
  ) ?? [];
  const internalLocations = allLocations.filter((location) => location.kind === "internal");
  const selectableLocations = internalLocations.length > 0 ? internalLocations : allLocations;
  const selectedProduct = products.data?.items.find((item) => item.id === productId);
  const isLoading = products.isPending || warehouses.isPending || (usesPartner && partners.isPending);
  const loadError = products.isError || warehouses.isError || (usesPartner && partners.isError);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    create.mutate();
  }

  return (
    <RouteScaffold
      section={`Operations / ${label}`}
      title={`New ${label.toLowerCase()}`}
      description={`Create and schedule a ${label.toLowerCase()} with date & time.`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={kind === "transfers" ? "/moves" : `/operations/${kind}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {kind === "transfers" ? "Back to move history" : `Back to ${kind}`}
        </Link>
      </div>
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading operation form…</p>
      ) : loadError ? (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">Couldn’t load the required inventory data.</p>
          <Button variant="outline" onClick={() => { void products.refetch(); void warehouses.refetch(); if (usesPartner) void partners.refetch(); }}>
            Retry
          </Button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <RoutePanel title="Operation details" description="The server assigns a reference and records the responsible user and schedule timestamp.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {type !== "adjustment" && (
                <Select
                  label={type === "receipt" ? "Supplier" : "Customer"}
                  value={partnerId}
                  onChange={setPartnerId}
                  options={(partners.data?.items ?? []).map((item) => [item.id, item.name] as [string, string])}
                />
              )}
              <Select
                label={type === "receipt" ? "Destination location" : "Source location"}
                value={locationId}
                onChange={setLocationId}
                options={selectableLocations.map((location) => [location.id, `${location.name} · ${location.warehouseName}`] as [string, string])}
              />
              {type !== "adjustment" && (
                <div className="grid min-w-0 gap-1.5 text-sm font-medium">
                  <label htmlFor="schedule-datetime" className="text-sm font-medium">
                    Schedule date &amp; time
                  </label>
                  <Input
                    id="schedule-datetime"
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(event) => setScheduleDateTime(event.target.value)}
                    required
                    className="h-10 bg-background text-sm font-normal"
                  />
                  <div className="flex flex-wrap gap-1.5 text-xs font-normal">
                    <button
                      type="button"
                      onClick={() => setScheduleDateTime(toDateTimeLocalString(new Date()))}
                      className="rounded border border-border px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(9, 0, 0, 0);
                        setScheduleDateTime(toDateTimeLocalString(d));
                      }}
                      className="rounded border border-border px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Tomorrow 09:00
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 2);
                        d.setHours(14, 0, 0, 0);
                        setScheduleDateTime(toDateTimeLocalString(d));
                      }}
                      className="rounded border border-border px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      +2 Days 14:00
                    </button>
                  </div>
                </div>
              )}
              {type === "adjustment" && <Field label="Reason" value={reason} onChange={setReason} required />}
            </div>
          </RoutePanel>
          <div className="mt-5">
            <RoutePanel title="Product lines" description={type === "adjustment" ? "Enter the counted quantity; the server calculates the delta when validated." : "Quantities are validated against stock availability by the server."}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Product"
                  value={productId}
                  onChange={setProductId}
                  options={(products.data?.items ?? []).map((item) => [item.id, `${item.name} · ${item.sku}`] as [string, string])}
                />
                <Field
                  label={type === "adjustment" ? `Counted quantity${selectedProduct ? ` (${selectedProduct.unit})` : ""}` : `Quantity${selectedProduct ? ` (${selectedProduct.unit})` : ""}`}
                  type="number"
                  value={quantity}
                  onChange={setQuantity}
                  required
                  min="0"
                  step="0.001"
                />
                {type === "delivery" && selectedProduct && (
                  <p className="self-end pb-2 text-sm text-muted-foreground">Free to use: {selectedProduct.freeToUse ?? "—"} {selectedProduct.unit}</p>
                )}
              </div>
              {type === "delivery" && selectedProduct && Number(quantity) > Number(selectedProduct.freeToUse ?? 0) && (
                <p role="note" className="mt-4 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-warning">
                  This quantity exceeds free-to-use stock. The operation will remain waiting until covered.
                </p>
              )}
            </RoutePanel>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="min-h-5 text-sm text-muted-foreground" role="status">{message}</p>
            <Button type="submit" disabled={create.isPending || !productId || !locationId || (type !== "adjustment" && !partnerId)}>
              <Save /> {create.isPending ? "Creating…" : `Create ${label.toLowerCase()}`}
            </Button>
          </div>
        </form>
      )}
    </RouteScaffold>
  );
}

function DetailOperationWorkspace({ kind, id }: { kind: OperationKind; id: string }) {
  const type = TYPE[kind];
  const label = LABEL[kind];
  const queryClient = useQueryClient();
  const operation = useQuery({ queryKey: ["operation", id], queryFn: () => stockApi.operation(id), enabled: !!id });
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const action = useMutation({
    mutationFn: (name: "ready" | "validate" | "cancel") => stockApi.operationAction(id, name),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["operation", id], updated);
      await Promise.all(["operations", "dashboard", "moves", "products", "product", "stock"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      setMessage(`Operation ${updated.status}.`);
      showUpdateSuccessToast(label);
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Could not update the operation.");
      showErrorToast(error, `Could not update ${label.toLowerCase()}`);
    },
  });

  const data = operation.data;
  const canEditDraft = data?.status === "draft" && (type === "receipt" || type === "delivery");

  return (
    <RouteScaffold
      section={`Operations / ${label}`}
      title={`${label} ${data?.reference ?? ""}`}
      description="Review the operation, edit draft details, then move it through the stock workflow."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={kind === "transfers" ? "/moves" : `/operations/${kind}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {kind === "transfers" ? "Back to move history" : `Back to ${kind}`}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {canEditDraft && !isEditing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="size-3.5" /> Edit
            </Button>
          )}
          {data && <StatusBadge status={data.status} />}
        </div>
      </div>
      {operation.isPending ? (
        <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading operation details…</p>
      ) : operation.isError || !data ? (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">Couldn’t load the operation details.</p>
          <Button variant="outline" onClick={() => void operation.refetch()}>Retry</Button>
        </div>
      ) : isEditing ? (
        <OperationEditForm
          id={id}
          kind={kind}
          operation={data}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            setMessage("Operation updated.");
            showUpdateSuccessToast(label);
          }}
        />
      ) : (
        <div>
          <RoutePanel title="Operation details" description="The server assigns a reference and records the responsible user and schedule timestamp.">
            <Details operation={data} />
          </RoutePanel>
          <div className="mt-5">
            <RoutePanel title="Product lines" description={data.type === "adjustment" ? "Enter the counted quantity; the server calculates the delta when validated." : "Quantities are validated against stock availability by the server."}>
              <Lines operation={data} />
            </RoutePanel>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="min-h-5 text-sm text-muted-foreground" role="status">{message}</p>
            <div className="flex flex-wrap gap-2">
              {data.status === "draft" || data.status === "waiting" ? (
                <Button type="button" variant="outline" disabled={action.isPending} onClick={() => action.mutate("ready")}>
                  <Check /> {data.status === "draft" ? "Mark as ready" : "Recheck availability"}
                </Button>
              ) : null}
              {data.status === "ready" && (
                <Button type="button" disabled={action.isPending} onClick={() => action.mutate("validate")}>
                  <Check /> Validate
                </Button>
              )}
              {!["done", "canceled"].includes(data.status) && (
                <Button type="button" variant="ghost" disabled={action.isPending} onClick={() => action.mutate("cancel")}>
                  Cancel
                </Button>
              )}
              {data.status === "done" && (
                <span className="self-center text-sm text-success">Validated · stock and ledger updated</span>
              )}
            </div>
          </div>
        </div>
      )}
    </RouteScaffold>
  );
}

function OperationEditForm({
  id,
  kind,
  operation,
  onCancel,
  onSaved,
}: {
  id: string;
  kind: OperationKind;
  operation: Operation;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const type = TYPE[kind];
  const label = LABEL[kind];
  const usesPartner = type === "receipt" || type === "delivery";
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const products = useQuery({ queryKey: ["products", "choices"], queryFn: () => stockApi.products() });
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const partners = useQuery({
    queryKey: ["partners", type === "receipt" ? "supplier" : "customer"],
    queryFn: () => stockApi.partners(type === "receipt" ? "supplier" : "customer"),
    enabled: usesPartner,
  });

  const firstLine = operation.lines?.[0];
  const initialLocationId = type === "receipt"
    ? operation.destinationLocationId ?? ""
    : operation.sourceLocationId ?? "";

  const [partnerId, setPartnerId] = useState(operation.partnerId ?? "");
  const [locationId, setLocationId] = useState(initialLocationId);
  const [scheduleDateTime, setScheduleDateTime] = useState(() =>
    operation.scheduleDate ? toDateTimeLocalString(new Date(operation.scheduleDate)) : toDateTimeLocalString(new Date())
  );
  const [productId, setProductId] = useState(firstLine?.productId ?? "");
  const [quantity, setQuantity] = useState(firstLine?.quantity ?? "");

  const update = useMutation({
    mutationFn: () => stockApi.updateOperation(id, {
      type,
      partnerId: usesPartner ? (partnerId || null) : null,
      sourceLocationId: type === "delivery" ? locationId : null,
      destinationLocationId: type === "receipt" ? locationId : null,
      scheduleDate: new Date(scheduleDateTime).toISOString(),
      lines: [{ productId, quantity }],
    }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["operation", id], updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      onSaved();
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Could not save the operation.");
      showErrorToast(error, "Could not save operation");
    },
  });

  const allLocations = warehouses.data?.items.flatMap((warehouse) =>
    warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []
  ) ?? [];
  const internalLocations = allLocations.filter((location) => location.kind === "internal");
  const selectableLocations = internalLocations.length > 0 ? internalLocations : allLocations;
  const selectedProduct = products.data?.items.find((item) => item.id === productId);
  const isLoading = products.isPending || warehouses.isPending || (usesPartner && partners.isPending);
  const loadError = products.isError || warehouses.isError || (usesPartner && partners.isError);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    update.mutate();
  }

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading edit form…</p>;
  }
  if (loadError) {
    return (
      <div className="grid justify-items-center gap-3 py-12 text-center">
        <p className="text-sm text-destructive">Couldn’t load the required inventory data.</p>
        <Button variant="outline" onClick={() => { void products.refetch(); void warehouses.refetch(); if (usesPartner) void partners.refetch(); }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <RoutePanel title="Edit operation details" description="Update the partner, location, schedule, and line before the operation is ready.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usesPartner && (
            <Select
              label={type === "receipt" ? "Supplier" : "Customer"}
              value={partnerId}
              onChange={setPartnerId}
              options={(partners.data?.items ?? []).map((item) => [item.id, item.name] as [string, string])}
            />
          )}
          <Select
            label={type === "receipt" ? "Destination location" : "Source location"}
            value={locationId}
            onChange={setLocationId}
            options={selectableLocations.map((location) => [location.id, `${location.name} · ${location.warehouseName}`] as [string, string])}
          />
          <div className="grid min-w-0 gap-1.5 text-sm font-medium">
            <label htmlFor="edit-schedule-datetime" className="text-sm font-medium">Schedule date &amp; time</label>
            <Input
              id="edit-schedule-datetime"
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(event) => setScheduleDateTime(event.target.value)}
              required
              className="h-10 bg-background text-sm font-normal"
            />
            <div className="flex flex-wrap gap-1.5 text-xs font-normal">
              <button
                type="button"
                onClick={() => setScheduleDateTime(toDateTimeLocalString(new Date()))}
                className="rounded border border-border px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  setScheduleDateTime(toDateTimeLocalString(d));
                }}
                className="rounded border border-border px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Tomorrow 09:00
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 2);
                  d.setHours(14, 0, 0, 0);
                  setScheduleDateTime(toDateTimeLocalString(d));
                }}
                className="rounded border border-border px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                +2 Days 14:00
              </button>
            </div>
          </div>
        </div>
      </RoutePanel>
      <div className="mt-5">
        <RoutePanel title="Edit product line" description="Quantities are validated against stock availability by the server.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Product"
              value={productId}
              onChange={setProductId}
              options={(products.data?.items ?? []).map((item) => [item.id, `${item.name} · ${item.sku}`] as [string, string])}
            />
            <Field
              label={`Quantity${selectedProduct ? ` (${selectedProduct.unit})` : ""}`}
              type="number"
              value={quantity}
              onChange={setQuantity}
              required
              min="0"
              step="0.001"
            />
            {type === "delivery" && selectedProduct && (
              <p className="self-end pb-2 text-sm text-muted-foreground">Free to use: {selectedProduct.freeToUse ?? "—"} {selectedProduct.unit}</p>
            )}
          </div>
          {type === "delivery" && selectedProduct && Number(quantity) > Number(selectedProduct.freeToUse ?? 0) && (
            <p role="note" className="mt-4 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-warning">
              This quantity exceeds free-to-use stock. The operation will remain waiting until covered.
            </p>
          )}
        </RoutePanel>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="min-h-5 text-sm text-muted-foreground" role="status">{message}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={update.isPending || !productId || !locationId || (usesPartner && !partnerId)}>
            <Save /> {update.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </form>
  );
}

function Details({ operation }: { operation: Operation }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ["Reference", operation.reference],
        ["Contact", operation.partnerName ?? "—"],
        ["From", operation.sourceLocationName ?? "—"],
        ["To", operation.destinationLocationName ?? "—"],
        ["Schedule date & time", formatDateTime(operation.scheduleDate)],
        ["Responsible", operation.createdByName ?? "—"],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Lines({ operation }: { operation: Operation }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="px-3 py-3 font-medium">Product</th>
            <th className="px-3 py-3 font-medium">SKU</th>
            <th className="px-3 py-3 font-medium">Quantity / count</th>
            <th className="px-3 py-3 font-medium">Availability / delta</th>
          </tr>
        </thead>
        <tbody>
          {operation.lines?.map((line) => (
            <tr key={line.id} className="border-b border-border/70">
              <td className="px-3 py-3 text-sm">{line.productName}</td>
              <td className="px-3 py-3 font-mono text-sm">{line.productSku}</td>
              <td className="px-3 py-3 text-sm">{line.countedQuantity ?? line.quantity}</td>
              <td className={`px-3 py-3 text-sm ${line.isShort ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                {line.isShort ? "Insufficient free stock" : line.delta !== undefined && line.delta !== null ? `Delta ${line.delta}` : "—"}
                {line.reason ? ` · ${line.reason}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      <select required value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-normal">
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} min={min} step={step} className="h-10 bg-background text-sm font-normal" />
    </label>
  );
}
