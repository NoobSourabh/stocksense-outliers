"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Columns3, List, Plus, Search } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";

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

export function OperationList({ kind }: { kind: keyof typeof CONFIG }) {
  return (
    <Suspense fallback={
      <RouteScaffold section="Operations" title={CONFIG[kind].title} description={CONFIG[kind].description} hideHeading={kind === "receipts"}>
        <RoutePanel title={kind === "receipts" ? undefined : `${CONFIG[kind].title} operations`}>
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
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState(initialStatus);

  const operations = useQuery({
    queryKey: ["operations", config.type, debouncedSearch, status],
    queryFn: async () => {
      if (status !== "open") return stockApi.operations({ type: config.type, search: debouncedSearch || undefined, status: status || undefined });
      const pages = await Promise.all(OPEN_STATUSES[kind].map((openStatus) => stockApi.operations({ type: config.type, search: debouncedSearch || undefined, status: openStatus })));
      const items = pages.flatMap((page) => page.items).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return { items, total: pages.reduce((total, page) => total + page.total, 0) };
    },
  });

  return (
    <RouteScaffold section="Operations" title={config.title} description={kind === "receipts" ? "Incoming stock and supplier deliveries." : config.description} hideHeading={kind === "receipts"}>
      <RoutePanel title={kind === "receipts" ? undefined : `${config.title} operations`} description={kind === "receipts" ? undefined : "Search by reference or contact and review each operation's current state."}>
        {kind === "receipts" && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <h2 className="text-lg font-semibold tracking-tight">Receipts</h2>
          <div className="flex items-center gap-2">
            <label className="relative w-44 sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference or contact" aria-label="Search receipts by reference or contact" className="h-9 pl-9" />
            </label>
            <div className="flex items-center rounded-md border border-border p-0.5" role="group" aria-label="Receipt view">
              <Button type="button" size="icon" variant={view === "list" ? "secondary" : "ghost"} aria-label="List view" aria-pressed={view === "list"} title="List view" onClick={() => setView("list")} className="size-8"><List className="size-4" /></Button>
              <Button type="button" size="icon" variant={view === "kanban" ? "secondary" : "ghost"} aria-label="Kanban view" aria-pressed={view === "kanban"} title="Kanban view" onClick={() => setView("kanban")} className="size-8"><Columns3 className="size-4" /></Button>
            </div>
            <Link href="/operations/receipts/new">
              <Button size="sm"><Plus /> New</Button>
            </Link>
          </div>
        </div>}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {kind !== "receipts" && <>
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
            <Button><Plus /> New {kind === "adjustments" ? "adjustment" : kind.slice(0, -1)}</Button>
          </Link>
          </>}
          {kind === "receipts" && <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter receipts by status" className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {[{ value: "", label: "All statuses" }, { value: "open", label: "Open" }, ...STATUSES.receipts.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))].map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
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
            {kind === "receipts" && view === "kanban" ? (
              <ReceiptKanban operations={operations.data.items} />
            ) : <div className="hidden overflow-x-auto md:block">
              <table className={`w-full text-left ${kind === "receipts" ? "min-w-[760px]" : "min-w-[1050px]"}`}>
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {(kind === "receipts" ? ["Reference", "From", "To", "Contact", "Schedule date", "Status"] : ["Reference", "Contact", "Source", "Destination", "Schedule date", "Lines", "Status", "Responsible"]).map((label) => (
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
            <div className={`${kind === "receipts" && view === "kanban" ? "hidden" : "grid gap-3 md:hidden"}`}>
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

function ReceiptKanban({ operations }: { operations: Operation[] }) {
  const statuses = ["draft", "ready", "done", "canceled"];
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Receipts grouped by status">
    {statuses.map((status) => {
      const items = operations.filter((operation) => operation.status === status);
      return <section key={status} className="min-w-0 rounded-lg bg-muted/60 p-3" aria-label={`${status} receipts`}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold capitalize">{status}</h3>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
        </div>
        <div className="grid gap-2">
          {items.length === 0 ? <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">No receipts</p> : items.map((operation) => <Link key={operation.id} href={`/operations/receipts/${operation.id}`} className="rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-start justify-between gap-2"><span className="font-mono text-sm font-medium text-primary">{operation.reference}</span><StatusBadge status={operation.status} /></div>
            <p className="mt-2 truncate text-sm font-medium">{operation.partnerName ?? "Vendor"}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">To {operation.destinationLocationName ?? "—"}</p>
            <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(operation.scheduleDate).split(",")[0]}</p>
          </Link>)}
        </div>
      </section>;
    })}
  </div>;
}

function ListField({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="truncate">{value}</dd></div>;
}
