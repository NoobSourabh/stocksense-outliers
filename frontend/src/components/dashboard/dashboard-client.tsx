"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, CalendarClock, CircleHelp, RotateCcw, SlidersHorizontal } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { WarehousePanel } from "@/components/warehouse/warehouse-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

type OperationType = "receipt" | "delivery" | "transfer" | "adjustment";
type OperationStatus = "draft" | "waiting" | "ready" | "done" | "canceled";

interface DashboardFilters {
  type: string;
  status: string;
  warehouseId: string;
  locationId: string;
  categoryId: string;
}

interface DashboardOperation {
  id: string;
  reference: string;
  type: OperationType | string;
  partner?: string | null;
  partnerName?: string | null;
  contactName?: string | null;
  scheduleDate?: string | null;
  schedule_date?: string | null;
  status: OperationStatus | string;
  responsibleUser?: string | null;
  warehouseId?: string;
  locationId?: string;
  categoryId?: string;
}

interface DashboardResponse {
  receiptSummary: { toReceive: number; late: number; total: number };
  deliverySummary: { toDeliver: number; late: number; waiting: number; total: number };
  lowStock: number | { count?: number; total?: number; items?: unknown[] };
  scheduledTransfers?: number | { count?: number; total?: number };
  recentOperations: DashboardOperation[];
}

const DEMO_DASHBOARD: DashboardResponse = {
  receiptSummary: { toReceive: 8, late: 2, total: 14 },
  deliverySummary: { toDeliver: 11, late: 1, waiting: 3, total: 18 },
  lowStock: { count: 4 },
  scheduledTransfers: 3,
  recentOperations: [
    { id: "demo-1", reference: "WH/OUT/0248", type: "delivery", partnerName: "Northstar Offices", scheduleDate: "2026-09-26T11:00:00Z", status: "ready", warehouseId: "WH-01", locationId: "LOC-A1", categoryId: "CAT-FURN" },
    { id: "demo-2", reference: "WH/IN/0247", type: "receipt", partnerName: "Apex Metals", scheduleDate: "2026-09-25T14:30:00Z", status: "waiting", warehouseId: "WH-01", locationId: "LOC-A1", categoryId: "CAT-METAL" },
    { id: "demo-3", reference: "WH/TR/0246", type: "transfer", partnerName: "Main → Overflow", scheduleDate: "2026-09-27T09:15:00Z", status: "ready", warehouseId: "WH-01", locationId: "LOC-B2", categoryId: "CAT-FURN" },
    { id: "demo-4", reference: "WH/OUT/0245", type: "delivery", partnerName: "Harbor Design Co.", scheduleDate: "2026-09-24T16:00:00Z", status: "done", warehouseId: "WH-02", locationId: "LOC-C3", categoryId: "CAT-FURN" },
    { id: "demo-5", reference: "WH/ADJ/0244", type: "adjustment", partnerName: "Cycle count", scheduleDate: "2026-09-24T17:45:00Z", status: "done", warehouseId: "WH-01", locationId: "LOC-A1", categoryId: "CAT-TOOLS" },
  ],
};

const FILTERS: (keyof DashboardFilters)[] = ["type", "status", "warehouseId", "locationId", "categoryId"];

function readFilters(params: URLSearchParams): DashboardFilters {
  return {
    type: params.get("type") ?? "",
    status: params.get("status") ?? "",
    warehouseId: params.get("warehouseId") ?? "",
    locationId: params.get("locationId") ?? "",
    categoryId: params.get("categoryId") ?? "",
  };
}

function countOf(value: DashboardResponse["lowStock"] | DashboardResponse["scheduledTransfers"] | undefined): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    if (value.count !== undefined) return value.count;
    if (value.total !== undefined) return value.total;
    return "items" in value && Array.isArray(value.items) ? value.items.length : 0;
  }
  return 0;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(fallback.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(fallback);
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function typeLabel(type: string): string {
  return ({ receipt: "Receipt", delivery: "Delivery", transfer: "Transfer", adjustment: "Adjustment" } as Record<string, string>)[type] ?? type;
}

function MetricCard({ title, value, hint, icon: Icon, tone = "blue" }: { title: string; value: number | string; hint: string; icon: typeof Activity; tone?: "blue" | "amber" | "green" }) {
  const tones = {
    blue: "bg-primary/10 text-primary",
    amber: "bg-warning-bg text-warning",
    green: "bg-success-bg text-success",
  };
  return (
    <WarehousePanel className="p-5 transition-shadow hover:shadow-m3-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}><Icon className="size-5" /></span>
      </div>
    </WarehousePanel>
  );
}

function SummaryCard({ kind, title, primary, late, total, waiting }: { kind: "receipt" | "delivery"; title: string; primary: number; late: number; total: number; waiting?: number }) {
  const Icon = kind === "receipt" ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <WarehousePanel className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>{title}</div>
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{primary}<span className="ml-2 text-sm font-normal text-muted-foreground">to {kind === "receipt" ? "receive" : "deliver"}</span></p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className={late ? "font-medium text-warning" : ""}>{late} late</span>
        {waiting !== undefined && <span className={waiting ? "font-medium text-destructive" : ""}>{waiting} waiting</span>}
        <span>{total} operations</span>
      </div>
    </WarehousePanel>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const activeFilterCount = FILTERS.filter((key) => filters[key]).length;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => {
      const query = new URLSearchParams();
      FILTERS.forEach((key) => { if (filters[key]) query.set(key, filters[key]); });
      return apiFetch<DashboardResponse>(`/dashboard${query.size ? `?${query.toString()}` : ""}`, { auth: true });
    },
  });

  function updateFilter(key: keyof DashboardFilters, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams.toString());
    FILTERS.forEach((key) => next.delete(key));
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const isDemo = !dashboardQuery.data && dashboardQuery.isError;
  const data = dashboardQuery.data ?? (isDemo ? DEMO_DASHBOARD : undefined);
  const operations = data?.recentOperations.filter((operation) => {
    if (!isDemo) return true;
    return (!filters.type || operation.type === filters.type)
      && (!filters.status || operation.status === filters.status)
      && (!filters.warehouseId || operation.warehouseId === filters.warehouseId)
      && (!filters.locationId || operation.locationId === filters.locationId)
      && (!filters.categoryId || operation.categoryId === filters.categoryId);
  }) ?? [];

  return (
    <RouteScaffold section="Dashboard" title="Operations overview" description="A live view of incoming and outgoing work, stock exceptions, and scheduled transfers.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><SlidersHorizontal className="size-4" /><span>Filter operations</span>{activeFilterCount > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{activeFilterCount} active</span>}</div>
        <Button variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0} className="text-muted-foreground"><RotateCcw /> Clear filters</Button>
      </div>
      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Operation type
          <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="">All types</option><option value="receipt">Receipt</option><option value="delivery">Delivery</option><option value="transfer">Transfer</option><option value="adjustment">Adjustment</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Status
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="">All statuses</option><option value="draft">Draft</option><option value="waiting">Waiting</option><option value="ready">Ready</option><option value="done">Done</option><option value="canceled">Canceled</option>
          </select>
        </label>
        {(["warehouseId", "locationId", "categoryId"] as const).map((key) => (
          <label key={key} className="grid gap-1.5 text-xs font-medium text-muted-foreground">{key === "warehouseId" ? "Warehouse ID" : key === "locationId" ? "Location ID" : "Category ID"}
            <input value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)} placeholder="Any" className="h-9 min-w-0 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/50" />
          </label>
        ))}
      </div>

      {dashboardQuery.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard"><div className="h-36 animate-pulse rounded-xl bg-muted" /><div className="h-36 animate-pulse rounded-xl bg-muted" /><div className="h-36 animate-pulse rounded-xl bg-muted" /><div className="h-36 animate-pulse rounded-xl bg-muted" /></div>
      ) : data ? (
        <>
          {isDemo && <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-bg/50 px-4 py-3 text-sm"><span className="flex items-center gap-2 text-foreground"><CircleHelp className="size-4 shrink-0 text-warning" /><span><strong>Sample data</strong><span className="text-muted-foreground"> · Live dashboard data isn’t available yet.</span></span></span><Button variant="outline" size="sm" onClick={() => void dashboardQuery.refetch()}>Retry connection</Button></div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard kind="receipt" title="Receipts" primary={data.receiptSummary.toReceive} late={data.receiptSummary.late} total={data.receiptSummary.total} />
            <SummaryCard kind="delivery" title="Deliveries" primary={data.deliverySummary.toDeliver} late={data.deliverySummary.late} waiting={data.deliverySummary.waiting} total={data.deliverySummary.total} />
            <MetricCard title="Low stock items" value={countOf(data.lowStock)} hint="At or below reorder point" icon={AlertTriangle} tone="amber" />
            <MetricCard title="Scheduled transfers" value={data.scheduledTransfers === undefined ? "—" : countOf(data.scheduledTransfers)} hint="Internal moves in progress" icon={CalendarClock} tone="green" />
          </div>
          <div className="mt-6">
            <RoutePanel title="Recent operations" description="The latest receipts, deliveries, transfers, and adjustments matching your filters.">
              {operations.length === 0 ? (
                <div className="grid justify-items-center py-12 text-center"><span className="mb-3 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Activity className="size-5" /></span><p className="font-medium">No operations found</p><p className="mt-1 text-sm text-muted-foreground">Try adjusting or clearing your filters.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Reference", "Type", "Contact", "Scheduled date & time", "Status"].map((name) => <th key={name} className="px-3 py-3 font-medium">{name}</th>)}</tr></thead>
                    <tbody>{operations.map((operation) => (
                      <tr key={operation.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-3.5 font-mono text-sm font-medium">{operation.reference}</td>
                        <td className="px-3 py-3.5 text-sm">{typeLabel(operation.type)}</td>
                        <td className="px-3 py-3.5 text-sm text-muted-foreground">{operation.partner ?? operation.partnerName ?? operation.contactName ?? "—"}</td>
                        <td className="px-3 py-3.5 text-sm text-muted-foreground">{formatDateTime(operation.scheduleDate ?? operation.schedule_date)}</td>
                        <td className="px-3 py-3.5"><StatusBadge status={operation.status.charAt(0).toUpperCase() + operation.status.slice(1)} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </RoutePanel>
          </div>
        </>
      ) : null}
    </RouteScaffold>
  );
}
