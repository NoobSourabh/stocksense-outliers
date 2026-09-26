"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, Boxes, CalendarClock, RotateCcw, SlidersHorizontal } from "lucide-react";
import { stockApi, type Dashboard } from "@/lib/stock-api";
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
  createdByName?: string;
  responsibleUser?: string | null;
  warehouseId?: string;
  locationId?: string;
  categoryId?: string;
  sourceLocationName?: string | null;
  destinationLocationName?: string | null;
}

type DashboardResponse = Omit<Dashboard, "recentOperations"> & { recentOperations: DashboardOperation[] };

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

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
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
  const href = kind === "receipt" ? "/operations/receipts?status=open" : "/operations/deliveries?status=open";
  return (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <WarehousePanel className="p-5 transition-shadow hover:shadow-m3-2">
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
    </Link>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const activeFilterCount = FILTERS.filter((key) => filters[key]).length;
  const warehouses = useQuery({ queryKey: ["warehouses", "dashboard"], queryFn: () => stockApi.warehouses(true) });
  const categories = useQuery({ queryKey: ["categories", "dashboard"], queryFn: stockApi.categories });
  const availableLocations = warehouses.data?.items.find((warehouse) => warehouse.id === filters.warehouseId)?.locations ?? [];

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ["dashboard", filters],
    queryFn: async () => {
      return stockApi.dashboard(filters);
    },
  });

  function updateFilter(key: keyof DashboardFilters, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "warehouseId") next.delete("locationId");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams.toString());
    FILTERS.forEach((key) => next.delete(key));
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const data = dashboardQuery.data;
  const operations = data?.recentOperations ?? [];

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
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Warehouse
          <select value={filters.warehouseId} onChange={(event) => updateFilter("warehouseId", event.target.value)} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="">All warehouses</option>{warehouses.data?.items.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Location
          <select value={filters.locationId} onChange={(event) => updateFilter("locationId", event.target.value)} disabled={!filters.warehouseId || warehouses.isPending} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">All locations</option>{availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Product category
          <select value={filters.categoryId} onChange={(event) => updateFilter("categoryId", event.target.value)} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="">All categories</option>{categories.data?.items.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>

      {dashboardQuery.isPending ? (
        <div className="space-y-4" aria-label="Loading dashboard">
          <div className="grid gap-4 md:grid-cols-2"><div className="h-36 animate-pulse rounded-xl bg-muted" /><div className="h-36 animate-pulse rounded-xl bg-muted" /></div>
          <div className="grid gap-4 md:grid-cols-3"><div className="h-36 animate-pulse rounded-xl bg-muted" /><div className="h-36 animate-pulse rounded-xl bg-muted" /><div className="h-36 animate-pulse rounded-xl bg-muted" /></div>
        </div>
      ) : dashboardQuery.isError ? (
        <div className="grid justify-items-center gap-3 py-16 text-center">
          <p className="text-sm text-destructive">Couldn’t load dashboard data. Check your connection and try again.</p>
          <Button variant="outline" onClick={() => void dashboardQuery.refetch()}>Retry</Button>
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard kind="receipt" title="Receipts" primary={data.receiptSummary.toReceive} late={data.receiptSummary.late} total={data.receiptSummary.total} />
            <SummaryCard kind="delivery" title="Deliveries" primary={data.deliverySummary.toDeliver} late={data.deliverySummary.late} waiting={data.deliverySummary.waiting} total={data.deliverySummary.total} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MetricCard title="Active products" value={data.activeProductCount} hint="Products in the catalog" icon={Boxes} />
            <MetricCard title="Low / out of stock" value={data.lowStock.length} hint="At or below reorder point" icon={AlertTriangle} tone="amber" />
            <MetricCard title="Scheduled transfers" value={data.scheduledTransfers} hint="Open internal moves" icon={CalendarClock} tone="green" />
          </div>
          <div className="mt-6">
            <RoutePanel title="Low-stock attention" description="Active products at or below their reorder point in the selected stock scope.">
              {data.lowStock.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No products need attention for this stock scope.</p>
              ) : (
                <>
                <div className="grid gap-3 md:hidden">
                  {data.lowStock.map((item) => <article key={item.productId} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3"><Link href={`/products/${item.productId}`} className="font-medium text-primary hover:underline">{item.productName}</Link><span className="shrink-0 text-xs font-medium text-warning">{Number(item.onHand) === 0 ? "Out of stock" : "Low stock"}</span></div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{item.sku}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">On hand</dt><dd className="mt-0.5">{item.onHand} {item.unit}</dd></div><div><dt className="text-xs text-muted-foreground">Reorder point</dt><dd className="mt-0.5">{item.reorderPoint} {item.unit}</dd></div></dl>
                  </article>)}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[560px] text-left">
                    <thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Product", "SKU", "On hand", "Reorder point", "Status"].map((name) => <th key={name} className="px-3 py-3 font-medium">{name}</th>)}</tr></thead>
                    <tbody>{data.lowStock.map((item) => (
                      <tr key={item.productId} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-3.5 text-sm"><Link href={`/products/${item.productId}`} className="font-medium text-primary hover:underline">{item.productName}</Link></td>
                        <td className="px-3 py-3.5 font-mono text-sm text-muted-foreground">{item.sku}</td>
                        <td className="px-3 py-3.5 text-sm tabular-nums">{item.onHand} {item.unit}</td>
                        <td className="px-3 py-3.5 text-sm tabular-nums">{item.reorderPoint} {item.unit}</td>
                        <td className="px-3 py-3.5 text-sm font-medium text-warning">{Number(item.onHand) === 0 ? "Out of stock" : "Low stock"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                </>
              )}
            </RoutePanel>
          </div>
          <div className="mt-6">
            <RoutePanel title="Recent operations" description="The latest receipts, deliveries, transfers, and adjustments matching your filters.">
              {operations.length === 0 ? (
                <div className="grid justify-items-center py-12 text-center">
                  <span className="mb-3 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Activity className="size-5" /></span>
                  <p className="font-medium">No operations found</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeFilterCount > 0 ? "Try adjusting or clearing your filters." : "Operations will appear here as activity is recorded."}</p>
                </div>
              ) : (
                <>
                <div className="grid gap-3 md:hidden">
                  {operations.map((operation) => <Link key={operation.id} href={operationHref(operation)} className="rounded-lg border border-border p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="flex items-start justify-between gap-3"><span className="truncate font-mono text-sm font-medium text-primary">{operation.reference}</span><StatusBadge status={operation.status.charAt(0).toUpperCase() + operation.status.slice(1)} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">{typeLabel(operation.type)} · {formatDate(operation.scheduleDate ?? operation.schedule_date)}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Contact</dt><dd className="truncate">{operation.partner ?? operation.partnerName ?? operation.contactName ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Responsible</dt><dd className="truncate">{operation.createdByName ?? operation.responsibleUser ?? "—"}</dd></div></dl>
                  </Link>)}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[850px] text-left">
                    <thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Reference", "Type", "Contact", "Scheduled", "Status", "Responsible"].map((name) => <th key={name} className="px-3 py-3 font-medium">{name}</th>)}</tr></thead>
                    <tbody>{operations.map((operation) => (
                      <tr key={operation.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-3.5 font-mono text-sm font-medium"><Link className="text-primary hover:underline" href={operationHref(operation)}>{operation.reference}</Link></td>
                        <td className="px-3 py-3.5 text-sm">{typeLabel(operation.type)}</td>
                        <td className="px-3 py-3.5 text-sm text-muted-foreground">{operation.partner ?? operation.partnerName ?? operation.contactName ?? "—"}</td>
                        <td className="px-3 py-3.5 text-sm text-muted-foreground">{formatDate(operation.scheduleDate ?? operation.schedule_date)}</td>
                        <td className="px-3 py-3.5"><StatusBadge status={operation.status.charAt(0).toUpperCase() + operation.status.slice(1)} /></td>
                        <td className="px-3 py-3.5 text-sm text-muted-foreground">{operation.createdByName ?? operation.responsibleUser ?? "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                </>
              )}
            </RoutePanel>
          </div>
        </>
      ) : null}
    </RouteScaffold>
  );
}

function operationHref(operation: DashboardOperation) {
  const path = ({ receipt: "receipts", delivery: "deliveries", transfer: "transfers", adjustment: "adjustments" } as Record<string, string>)[operation.type];
  return path ? `/operations/${path}/${operation.id}` : "/dashboard";
}
