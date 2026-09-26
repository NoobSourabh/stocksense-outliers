"use client";

import Link from "next/link";
import { Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, KeyboardSensor, PointerSensor, type DragEndEvent, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Columns3, GripVertical, List, Plus, Search } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";
import { showErrorToast, showInfoToast } from "@/lib/toast-utils";

const CONFIG = {
  receipts: { type: "receipt", title: "Receipts", description: "Track incoming stock from suppliers through draft, ready, and done states." },
  deliveries: { type: "delivery", title: "Deliveries", description: "Manage outgoing orders and see which deliveries are ready, waiting, or complete." },
  adjustments: { type: "adjustment", title: "Inventory adjustments", description: "Reconcile counted quantities against recorded stock with an auditable reason." },
  transfers: { type: "transfer", title: "Internal transfers", description: "Move stock between different storage locations within your warehouses." },
} as const;

const OPEN_STATUSES = {
  receipts: ["draft", "ready"],
  deliveries: ["draft", "waiting", "ready"],
  adjustments: ["draft", "ready"],
  transfers: ["draft", "ready"],
} as const;

const STATUSES = {
  receipts: ["draft", "ready", "done", "canceled"],
  deliveries: ["draft", "waiting", "ready", "done", "canceled"],
  adjustments: ["draft", "ready", "done", "canceled"],
  transfers: ["draft", "ready", "done", "canceled"],
} as const;

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

function getDropAction(currentStatus: string, targetStatus: string, type: string): "ready" | "validate" | "cancel" | null {
  if (currentStatus === targetStatus) return null;
  if (targetStatus === "canceled") {
    if (["draft", "waiting", "ready"].includes(currentStatus)) return "cancel";
    return null;
  }
  if (targetStatus === "ready") {
    if (currentStatus === "draft" || (type === "delivery" && currentStatus === "waiting")) return "ready";
    return null;
  }
  if (targetStatus === "done") {
    if (currentStatus === "ready") return "validate";
    return null;
  }
  return null;
}

export function OperationList({ kind }: { kind: keyof typeof CONFIG }) {
  const compactList = kind === "receipts" || kind === "deliveries";
  return (
    <Suspense fallback={
      <RouteScaffold section="Operations" title={CONFIG[kind].title} description={CONFIG[kind].description} hideHeading={compactList}>
        <RoutePanel title={compactList ? undefined : `${CONFIG[kind].title} operations`}>
          <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading operations…</p>
        </RoutePanel>
      </RouteScaffold>
    }>
      <OperationListContentWrapper kind={kind} />
    </Suspense>
  );
}

function OperationListContentWrapper({ kind }: { kind: keyof typeof CONFIG }) {
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get("status") ?? "";
  const validStatuses: readonly string[] = STATUSES[kind];
  const statusParam = requestedStatus === "open" || validStatuses.includes(requestedStatus) ? requestedStatus : "";
  return <OperationListContent key={`${kind}-${statusParam}`} kind={kind} initialStatus={statusParam} />;
}

function OperationListContent({ kind, initialStatus }: { kind: keyof typeof CONFIG; initialStatus: string }) {
  const config = CONFIG[kind];
  const compactList = kind === "receipts" || kind === "deliveries";
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState(initialStatus);
  const queryClient = useQueryClient();

  const operations = useQuery({
    queryKey: ["operations", config.type, debouncedSearch, status],
    queryFn: async () => {
      if (status !== "open") return stockApi.operations({ type: config.type, search: debouncedSearch || undefined, status: status || undefined });
      const pages = await Promise.all(OPEN_STATUSES[kind].map((openStatus) => stockApi.operations({ type: config.type, search: debouncedSearch || undefined, status: openStatus })));
      const items = pages.flatMap((page) => page.items).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return { items, total: pages.reduce((total, page) => total + page.total, 0) };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ operationId, targetStatus }: { operationId: string; targetStatus: string }) => {
      const operation = operations.data?.items.find((item) => item.id === operationId);
      if (!operation) throw new Error("Operation not found");
      const action = getDropAction(operation.status, targetStatus, config.type);
      if (!action) throw new Error(`Cannot move ${config.type} from ${operation.status} to ${targetStatus}`);
      return stockApi.operationAction(operationId, action);
    },
    onSuccess: (updatedOperation, { targetStatus }) => {
      void queryClient.invalidateQueries({ queryKey: ["operations", config.type] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["moves"] });
      if (updatedOperation.status !== targetStatus) {
        const reason = updatedOperation.status === "waiting"
          ? "This delivery is waiting because there isn’t enough available stock."
          : `The server saved it as ${updatedOperation.status}.`;
        showInfoToast(reason, { title: "Status updated" });
      }
    },
    onError: (error) => showErrorToast(error, "Could not move operation"),
  });

  return (
    <RouteScaffold section="Operations" title={config.title} description={config.description} hideHeading={compactList}>
      <RoutePanel title={compactList ? undefined : `${config.title} operations`} description={compactList ? undefined : "Search by reference or contact and review each operation's current state."}>
        {compactList && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Link href={`/operations/${kind}/new`}><Button size="sm"><Plus /> New</Button></Link>
            <h2 className="text-lg font-semibold tracking-tight">{config.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative w-44 sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference or contact" aria-label={`Search ${config.title.toLowerCase()} by reference or contact`} className="h-9 pl-9" />
            </label>
            <div className="flex items-center rounded-md border border-border p-0.5" role="group" aria-label={`${config.title} view`}>
              <Button type="button" size="icon" variant={view === "list" ? "secondary" : "ghost"} aria-label="List view" aria-pressed={view === "list"} title="List view" onClick={() => setView("list")} className="size-8"><List className="size-4" /></Button>
              <Button type="button" size="icon" variant={view === "kanban" ? "secondary" : "ghost"} aria-label="Kanban view" aria-pressed={view === "kanban"} title="Kanban view" onClick={() => setView("kanban")} className="size-8"><Columns3 className="size-4" /></Button>
            </div>
          </div>
        </div>}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {!compactList && <>
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference or contact" aria-label="Search operations" className="h-10 pl-9" />
          </label>
          <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="Filter by status">
            {[{ value: "", label: "All" }, { value: "open", label: "Open" }, ...STATUSES[kind].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))].map((filter) => (
              <Button key={filter.value || "all"} type="button" size="sm" variant={status === filter.value ? "secondary" : "outline"} aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)}>
                {filter.label}
              </Button>
            ))}
          </div>
          <Link href={`/operations/${kind}/new`}>
            <Button><Plus /> New {kind === "adjustments" ? "adjustment" : "transfer"}</Button>
          </Link>
          </>}
          {compactList && <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={`Filter ${config.title.toLowerCase()} by status`} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {[{ value: "", label: "All statuses" }, { value: "open", label: "Open" }, ...STATUSES[kind].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))].map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
            </select>
          </label>}
        </div>
        {operations.isPending ? (
          <div className="py-2"><SkeletonTable columns={8} rows={6} showSearch={false} showPagination={false} /></div>
        ) : operations.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold text-destructive">Failed to load {config.title.toLowerCase()}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              We couldn&apos;t connect to the inventory service. Check your connection or API server status.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void operations.refetch()}>
              Try Again
            </Button>
          </div>
        ) : operations.data.items.length === 0 ? (
          <EmptyState title={`No ${config.title.toLowerCase()} found`} description="No operations match these filters. Create one or adjust your search and status filters." />
        ) : (
          <>
            {compactList && view === "kanban" ? (
              <OperationKanban operations={operations.data.items} kind={kind} onDrop={(operationId, targetStatus) => void updateStatus.mutate({ operationId, targetStatus })} />
            ) : <div className="hidden overflow-x-auto md:block">
              <table className={`w-full text-left ${compactList ? "min-w-[760px]" : "min-w-[1050px]"}`}>
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {(kind === "receipts" || kind === "deliveries" ? ["Reference", "From", "To", "Contact", "Schedule date", "Status"] : ["Reference", "Contact", "Source", "Destination", "Schedule date", "Lines", "Status", "Responsible"]).map((label) => (
                      <th key={label} className="px-3 py-3 font-medium">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operations.data.items.map((operation: Operation) => (
                    <tr key={operation.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-3 font-mono text-sm">
                        <Link className="font-medium text-primary hover:underline" href={`/operations/${kind}/${operation.id}`}>{operation.reference}</Link>
                      </td>
                      {kind === "receipts" ? <>
                        <td className="px-3 py-3 text-sm">Vendor</td>
                        <td className="px-3 py-3 text-sm">{operation.destinationLocationName ?? "—"}</td>
                        <td className="px-3 py-3 text-sm text-primary">{operation.partnerName ?? "—"}</td>
                        <td className="px-3 py-3 text-sm">{formatDateTime(operation.scheduleDate).split(",")[0]}</td>
                        <td className="px-3 py-3"><StatusBadge status={operation.status} /></td>
                      </> : kind === "deliveries" ? <>
                        <td className="px-3 py-3 text-sm">{operation.sourceLocationName ?? "—"}</td>
                        <td className="px-3 py-3 text-sm">Customer</td>
                        <td className="px-3 py-3 text-sm text-primary">{operation.partnerName ?? "—"}</td>
                        <td className="px-3 py-3 text-sm">{formatDateTime(operation.scheduleDate).split(",")[0]}</td>
                        <td className="px-3 py-3"><StatusBadge status={operation.status} /></td>
                      </> : <>
                        <td className="px-3 py-3 text-sm">{operation.partnerName ?? "—"}</td>
                        <td className="px-3 py-3 text-sm">{operation.sourceLocationName ?? "—"}</td>
                        <td className="px-3 py-3 text-sm">{operation.destinationLocationName ?? "—"}</td>
                        <td className="px-3 py-3 text-sm">{formatDateTime(operation.scheduleDate)}</td>
                        <td className="px-3 py-3 text-sm">{operation.lineCount ?? operation.lines?.length ?? "—"}</td>
                        <td className="px-3 py-3"><StatusBadge status={operation.status} /></td>
                        <td className="px-3 py-3 text-sm">{operation.createdByName ?? "—"}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
            <div className={`${compactList && view === "kanban" ? "hidden" : "grid gap-3 md:hidden"}`}>
              {operations.data.items.map((operation: Operation) => (
                <Link key={operation.id} href={`/operations/${kind}/${operation.id}`} className="rounded-lg border border-border p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span className="truncate font-mono text-sm font-medium text-primary">{operation.reference}</span>
                    <StatusBadge status={operation.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {kind === "receipts" ? <>
                      <ListField label="From" value="Vendor" />
                      <ListField label="To" value={operation.destinationLocationName ?? "—"} />
                      <ListField label="Contact" value={operation.partnerName ?? "—"} />
                      <ListField label="Schedule date" value={formatDateTime(operation.scheduleDate).split(",")[0]} />
                    </> : kind === "deliveries" ? <>
                      <ListField label="From" value={operation.sourceLocationName ?? "—"} />
                      <ListField label="To" value="Customer" />
                      <ListField label="Contact" value={operation.partnerName ?? "—"} />
                      <ListField label="Schedule date" value={formatDateTime(operation.scheduleDate).split(",")[0]} />
                    </> : <>
                      <ListField label="Contact" value={operation.partnerName ?? "—"} />
                      <ListField label="Schedule date" value={formatDateTime(operation.scheduleDate)} />
                      <ListField label="Source" value={operation.sourceLocationName ?? "—"} />
                      <ListField label="Destination" value={operation.destinationLocationName ?? "—"} />
                      <ListField label="Lines" value={String(operation.lineCount ?? operation.lines?.length ?? "—")} />
                      <ListField label="Responsible" value={operation.createdByName ?? "—"} />
                    </>}
                  </dl>
                </Link>
              ))}
            </div>
          </>
        )}
      </RoutePanel>
    </RouteScaffold>
  );
}

function OperationKanban({ operations, kind, onDrop }: { operations: Operation[]; kind: "receipts" | "deliveries"; onDrop: (operationId: string, targetStatus: string) => void }) {
  const statuses = STATUSES[kind];
  const title = CONFIG[kind].title;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const operation = active.data.current?.operation as Operation | undefined;
    const targetStatus = String(over.id);
    if (!operation || operation.status === targetStatus) return;
    onDrop(operation.id, targetStatus);
  }
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto pb-2" aria-label={`${title} grouped by status`}>
        {statuses.map((status) => {
          const items = operations.filter((operation) => operation.status === status);
          return <KanbanColumn key={status} status={status} count={items.length}>
            {items.length === 0 ? <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">No {kind}</p> : items.map((operation) => <KanbanCard key={operation.id} operation={operation} kind={kind} />)}
          </KanbanColumn>;
        })}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ status, count, children }: { status: string; count: number; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: status, data: { status } });
  return <section ref={setNodeRef} className={`w-56 shrink-0 rounded-lg p-3 transition-colors ${isOver ? "bg-primary/10 ring-2 ring-primary/30" : "bg-muted/60"}`} aria-label={`${status} column`}>
    <div className="mb-3 flex items-center justify-between px-1">
      <h3 className="text-sm font-semibold capitalize">{status}</h3>
      <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
    </div>
    <div className="grid gap-2">
      {children}
    </div>
  </section>;
}

function KanbanCard({ operation, kind }: { operation: Operation; kind: "receipts" | "deliveries" }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: operation.id,
    data: { operation },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={`relative rounded-md border border-border bg-card transition-colors hover:border-primary/40 hover:bg-accent/40 ${isDragging ? "opacity-40 shadow-lg" : ""}`}>
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...listeners}
        {...attributes}
        aria-label={`Drag ${operation.reference}`}
        title="Drag to change status"
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab touch-none text-muted-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GripVertical className="size-4" />
      </button>
      <Link href={`/operations/${kind}/${operation.id}`} className="block p-3 pl-6" onPointerDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-2"><span className="font-mono text-sm font-medium text-primary">{operation.reference}</span><StatusBadge status={operation.status} /></div>
        <p className="mt-2 truncate text-sm font-medium">{operation.partnerName ?? (kind === "receipts" ? "Vendor" : "Customer")}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{kind === "receipts" ? `To ${operation.destinationLocationName ?? "—"}` : `${operation.sourceLocationName ?? "—"} → Customer`}</p>
        <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(operation.scheduleDate).split(",")[0]}</p>
      </Link>
    </div>
  );
}

function ListField({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="truncate">{value}</dd></div>;
}
