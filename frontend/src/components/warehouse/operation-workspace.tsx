"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock, Edit2, Save } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonForm } from "@/components/skeleton-form";

export type OperationKind = "receipts" | "deliveries" | "adjustments" | "transfers";
const TYPE = { receipts: "receipt", deliveries: "delivery", adjustments: "adjustment", transfers: "transfer" } as const;
const LABEL = { receipts: "Receipt", deliveries: "Delivery", adjustments: "Adjustment", transfers: "Transfer" } as const;

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

function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function OperationWorkspace(props: { kind: OperationKind; mode: "new" | "detail"; id?: string }) {
  return <Suspense fallback={<RouteScaffold section={`Operations / ${LABEL[props.kind]}`} title={`${props.mode === "new" ? "New " : ""}${LABEL[props.kind].toLowerCase()}`} description="Prepare a stock operation."><div className="py-2"><SkeletonForm /></div></RouteScaffold>}>
    <OperationWorkspaceContent {...props} />
  </Suspense>;
}

function OperationWorkspaceContent({ kind, mode, id }: { kind: OperationKind; mode: "new" | "detail"; id?: string }) {
  const searchParams = useSearchParams();
  const type = TYPE[kind];
  const label = LABEL[kind];
  const isTransfer = type === "transfer";
  const usesPartner = type === "receipt" || type === "delivery";
  const router = useRouter();
  const queryClient = useQueryClient();

  const operation = useQuery({
    queryKey: ["operation", id],
    queryFn: () => stockApi.operation(id!),
    enabled: mode === "detail" && !!id,
  });
  const products = useQuery({ queryKey: ["products", "choices"], queryFn: () => stockApi.products() });
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const partners = useQuery({
    queryKey: ["partners", type === "receipt" ? "supplier" : "customer"],
    queryFn: () => stockApi.partners(type === "receipt" ? "supplier" : "customer"),
    enabled: usesPartner,
  });

  const [productId, setProductId] = useState(() => searchParams.get("productId") ?? "");
  const [locationId, setLocationId] = useState(() => searchParams.get("locationId") ?? "");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [scheduleDateTime, setScheduleDateTime] = useState(() => {
    const nextHour = new Date(Date.now() + 3600 * 1000);
    return toDateTimeLocalString(nextHour);
  });
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState("");
  const [message, setMessage] = useState("");

  const create = useMutation({
    mutationFn: () =>
      stockApi.createOperation({
        type,
        partnerId: partnerId || null,
        sourceLocationId: isTransfer ? locationId : type === "delivery" || type === "adjustment" ? locationId : null,
        destinationLocationId: isTransfer ? destinationLocationId : type === "receipt" ? locationId : null,
        scheduleDate: type === "adjustment" ? null : scheduleDateTime ? new Date(scheduleDateTime).toISOString() : null,
        lines: [
          {
            productId,
            quantity: type === "adjustment" ? "0" : quantity,
            ...(type === "adjustment" ? { countedQuantity: quantity, reason } : {}),
          },
        ],
      }),
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      router.replace(`/operations/${kind}/${created.id}`);
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not create the operation."),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (newScheduleIso: string) =>
      stockApi.updateOperation(id!, { scheduleDate: newScheduleIso }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["operation", id], updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setEditingSchedule(false);
      setMessage("Schedule date & time updated successfully.");
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not update the schedule."),
  });

  const action = useMutation({
    mutationFn: (name: "ready" | "validate" | "cancel") => stockApi.operationAction(id!, name),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["operation", id], updated);
      await Promise.all(
        ["operations", "dashboard", "moves", "products", "product", "stock"].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      );
      setMessage(`Operation ${updated.status}.`);
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not update the operation."),
  });

  const allLocations =
    warehouses.data?.items.flatMap((warehouse) =>
      warehouse.locations.map((location) => ({ ...location, warehouseName: warehouse.name }))
    ) ?? [];
  const selectedProduct = products.data?.items.find((item) => item.id === productId);
  const data = operation.data;
  const isLoading =
      mode === "detail"
      ? operation.isPending
      : products.isPending || warehouses.isPending || (usesPartner && partners.isPending);
  const loadError =
      mode === "detail"
      ? operation.isError
      : products.isError || warehouses.isError || (usesPartner && partners.isError);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    create.mutate();
  }

  const canEditSchedule =
    mode === "detail" &&
    data &&
    data.status === "draft" &&
    type !== "adjustment";

  return (
    <RouteScaffold
      section={`Operations / ${label}`}
      title={mode === "new" ? `New ${label.toLowerCase()}` : `${label} ${data?.reference ?? ""}`}
      description={
        mode === "new"
          ? `Create and schedule a ${label.toLowerCase()} with date & time.`
          : "Review the operation, manage schedule date & time, then move it through the stock workflow."
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={isTransfer ? "/moves" : `/operations/${kind}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {isTransfer ? "Back to move history" : `Back to ${kind}`}
        </Link>
        {data && <StatusBadge status={data.status[0]?.toUpperCase() + data.status.slice(1)} />}
      </div>
      {isLoading ? (
        <div className="py-2"><SkeletonForm /></div>
      ) : loadError ? (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">Couldn’t load the required inventory data.</p>
          <Button
            variant="outline"
            onClick={() => {
              void operation.refetch();
              void products.refetch();
              void warehouses.refetch();
              if (usesPartner) void partners.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <RoutePanel
            title="Operation details"
            description="The server assigns a reference and records the responsible user and schedule timestamp."
          >
            {mode === "new" ? (
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
                  label={isTransfer ? "Source location" : type === "receipt" ? "Destination location" : "Source location"}
                  value={locationId}
                  onChange={setLocationId}
                  options={allLocations.filter((location) => location.kind === "internal").map((location) => [location.id, `${location.name} · ${location.warehouseName}`] as [string, string])}
                />
                {isTransfer && <Select
                  label="Destination location"
                  value={destinationLocationId}
                  onChange={setDestinationLocationId}
                  options={allLocations.filter((location) => location.kind === "internal" && location.id !== locationId).map((location) => [location.id, `${location.name} · ${location.warehouseName}`] as [string, string])}
                />}
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
            ) : (
              <div>
                <Details operation={data!} />
                {canEditSchedule && (
                  <div className="mt-4 rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Clock className="size-4 text-primary" />
                        <span>Change schedule date &amp; time</span>
                      </span>
                      {!editingSchedule && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const scheduleDate = operation.data?.scheduleDate;
                            setDetailSchedule(scheduleDate ? toDateTimeLocalString(new Date(scheduleDate)) : "");
                            setEditingSchedule(true);
                          }}
                        >
                          <Edit2 className="size-3.5" /> Edit date &amp; time
                        </Button>
                      )}
                    </div>
                    {editingSchedule && (
                      <div className="mt-3 grid max-w-md gap-2">
                        <Input
                          type="datetime-local"
                          value={detailSchedule}
                          onChange={(e) => setDetailSchedule(e.target.value)}
                          className="h-10 bg-background text-sm font-normal"
                        />
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            disabled={updateScheduleMutation.isPending || !detailSchedule}
                            onClick={() => {
                              const iso = new Date(detailSchedule).toISOString();
                              updateScheduleMutation.mutate(iso);
                            }}
                          >
                            <Save className="size-3.5" />
                            {updateScheduleMutation.isPending ? "Saving…" : "Save date & time"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSchedule(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </RoutePanel>

          <div className="mt-5">
            <RoutePanel
              title="Product lines"
              description={
                type === "adjustment"
                  ? "Enter the counted quantity; the server calculates the delta when validated."
                  : "Quantities are validated against stock availability by the server."
              }
            >
              {mode === "new" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Select
                    label="Product"
                    value={productId}
                    onChange={setProductId}
                    options={(products.data?.items ?? []).map((item) => [item.id, `${item.name} · ${item.sku}`] as [string, string])}
                  />
                  <Field
                    label={
                      type === "adjustment"
                        ? `Counted quantity${selectedProduct ? ` (${selectedProduct.unit})` : ""}`
                        : `Quantity${selectedProduct ? ` (${selectedProduct.unit})` : ""}`
                    }
                    type="number"
                    value={quantity}
                    onChange={setQuantity}
                    required
                    min="0"
                    step="0.001"
                  />
                  {type === "delivery" && selectedProduct && (
                    <p className="self-end pb-2 text-sm text-muted-foreground">
                      Free to use: {selectedProduct.freeToUse ?? "—"} {selectedProduct.unit}
                    </p>
                  )}
                </div>
              ) : (
                <Lines operation={data!} />
              )}
              {type === "delivery" &&
                mode === "new" &&
                selectedProduct &&
                Number(quantity) > Number(selectedProduct.freeToUse ?? 0) && (
                  <p role="note" className="mt-4 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-warning">
                    This quantity exceeds free-to-use stock. The operation will remain waiting until covered.
                  </p>
                )}
            </RoutePanel>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="min-h-5 text-sm text-muted-foreground" role="status">
              {message}
            </p>
            <div className="flex flex-wrap gap-2">
              {mode === "new" ? (
                <Button
                  type="submit"
                  disabled={create.isPending || !productId || !locationId || (usesPartner && !partnerId) || (isTransfer && (!destinationLocationId || destinationLocationId === locationId))}
                >
                  <Save /> {create.isPending ? "Creating…" : `Create ${label.toLowerCase()}`}
                </Button>
              ) : (
                <>
                  {data?.status === "draft" || data?.status === "waiting" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={action.isPending}
                      onClick={() => action.mutate("ready")}
                    >
                      <Check /> {data?.status === "draft" ? "Mark as ready" : "Recheck availability"}
                    </Button>
                  ) : null}
                  {data?.status === "ready" && (
                    <Button type="button" disabled={action.isPending} onClick={() => action.mutate("validate")}>
                      <Check /> Validate
                    </Button>
                  )}
                  {data && !["done", "canceled"].includes(data.status) && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={action.isPending}
                      onClick={() => action.mutate("cancel")}
                    >
                      Cancel
                    </Button>
                  )}
                  {data?.status === "done" && (
                    <span className="self-center text-sm text-success">Validated · stock and ledger updated</span>
                  )}
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </RouteScaffold>
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
          <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
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
              <td
                className={`px-3 py-3 text-sm ${
                  line.isShort ? "font-medium text-destructive" : "text-muted-foreground"
                }`}
              >
                {line.isShort
                  ? "Insufficient free stock"
                  : line.delta !== undefined && line.delta !== null
                  ? `Delta ${line.delta}`
                  : "—"}
                {line.reason ? ` · ${line.reason}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-normal"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
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
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        min={min}
        step={step}
        className="h-10 bg-background text-sm font-normal"
      />
    </label>
  );
}
