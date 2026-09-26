"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Columns3, List, Plus, Search, SlidersHorizontal } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { StatusBadge } from "@/components/status-badge";

const PAGE_SIZE = 20;
const OPERATION_PATH: Record<string, string> = {
  receipt: "receipts",
  delivery: "deliveries",
  transfer: "transfers",
  adjustment: "adjustments",
};

export default function MovesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [type, setType] = useState("");
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "kanban">("list");
  const products = useQuery({ queryKey: ["products", "move-filters"], queryFn: () => stockApi.products() });
  const warehouses = useQuery({ queryKey: ["warehouses", true, "move-filters"], queryFn: () => stockApi.warehouses(true) });
  const moves = useQuery({
    queryKey: ["moves", debouncedSearch, type, productId, locationId, fromDate, toDate, cursors[page]],
    queryFn: () => stockApi.moves({
      search: debouncedSearch || undefined,
      type: type || undefined,
      productId: productId || undefined,
      locationId: locationId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      cursor: cursors[page],
      limit: PAGE_SIZE,
    }),
  });
  const rows = useMemo(() => moves.data?.items ?? [], [moves.data]);
  const visible = rows;
  const locations = warehouses.data?.items.flatMap((warehouse) => warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []) ?? [];
  const filtersChanged = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(0); setCursors([]); };

  return <RouteScaffold section="Move History" title="Move History" description="Inventory movements by reference, product, and location." hideHeading>
    <RoutePanel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <details className="group relative">
            <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 marker:hidden [&::-webkit-details-marker]:hidden"><Plus className="size-4" /> New</summary>
            <div className="absolute left-0 top-full z-30 mt-1 grid min-w-44 rounded-lg border border-border bg-popover p-1 shadow-m3-2">
              <Link href="/operations/receipts/new" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">New receipt</Link>
              <Link href="/operations/deliveries/new" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">New delivery</Link>
              <Link href="/operations/transfers/new" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">New transfer</Link>
              <Link href="/operations/adjustments/new" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">New adjustment</Link>
            </div>
          </details>
          <h2 className="text-lg font-semibold tracking-tight">Move History</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative w-52 sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); setCursors([]); }} placeholder="Reference or contact" aria-label="Search moves by reference or contact" className="h-9 pl-9" />
          </label>
          <div className="flex items-center rounded-md border border-border p-0.5" role="group" aria-label="Move history view">
            <Button type="button" size="icon" variant={view === "list" ? "secondary" : "ghost"} aria-label="List view" aria-pressed={view === "list"} title="List view" onClick={() => setView("list")} className="size-8"><List className="size-4" /></Button>
            <Button type="button" size="icon" variant={view === "kanban" ? "secondary" : "ghost"} aria-label="Kanban view" aria-pressed={view === "kanban"} title="Kanban view" onClick={() => setView("kanban")} className="size-8"><Columns3 className="size-4" /></Button>
          </div>
        </div>
      </div>
      <details className="mb-4 rounded-lg border border-border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground marker:hidden [&::-webkit-details-marker]:hidden"><SlidersHorizontal className="size-4" /> Filters</summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2 xl:grid-cols-3">
          <FilterSelect label="Operation type" value={type} onChange={filtersChanged(setType)}>
            <option value="">All types</option>{["receipt", "delivery", "transfer", "adjustment"].map((kind) => <option key={kind} value={kind}>{capitalize(kind)}</option>)}
          </FilterSelect>
          <FilterSelect label="Product" value={productId} onChange={filtersChanged(setProductId)}>
            <option value="">All products</option>{(products.data?.items ?? []).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
          </FilterSelect>
          <FilterSelect label="Location" value={locationId} onChange={filtersChanged(setLocationId)}>
            <option value="">All locations</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.warehouseName}</option>)}
          </FilterSelect>
          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">From date<Input aria-label="From date" type="date" value={fromDate} onChange={(event) => filtersChanged(setFromDate)(event.target.value)} className="h-10 text-sm text-foreground" /></label>
          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">To date<Input aria-label="To date" type="date" value={toDate} onChange={(event) => filtersChanged(setToDate)(event.target.value)} className="h-10 text-sm text-foreground" /></label>
        </div>
      </details>
      {moves.isPending ? <div className="py-2"><SkeletonTable columns={7} rows={6} showSearch={false} showPagination={false} /></div>
        : moves.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load the stock ledger.</p><Button variant="outline" onClick={() => void moves.refetch()}>Retry</Button></div>
          : rows.length === 0 ? <EmptyState title="No ledger entries found" description={debouncedSearch || type || productId || locationId || fromDate || toDate ? "No stock movements match these filters." : "Stock movements will appear after an operation is validated."} />
          : <>
            {view === "kanban" ? <MoveKanban moves={rows} /> : <>
              <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Reference", "Date", "Contact", "From", "To", "Quantity", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>
                {visible.map((move) => <MoveTableRow key={move.id} move={move} />)}
              </tbody></table></div>
              <div className="grid gap-3 md:hidden">{visible.map((move) => <MoveCard key={move.id} move={move} />)}</div>
            </>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Page {page + 1} · {moves.data?.total ?? 0} movements</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={!moves.data?.nextCursor} onClick={() => { const nextCursor = moves.data?.nextCursor; if (nextCursor) { setCursors((current) => [...current.slice(0, page + 1), nextCursor]); setPage((current) => current + 1); } }}>Next</Button></div></div>
          </>}
    </RoutePanel>
  </RouteScaffold>;
}

function MoveTableRow({ move }: { move: Awaited<ReturnType<typeof stockApi.moves>>["items"][number] }) {
  const direction = getDirection(move.signedDelta);
  const endpoints = getEndpoints(move);
  return <tr className={`border-b border-border/70 last:border-0 ${direction.rowTone}`}>
    <td className="px-3 py-3 text-sm"><div className="font-mono"><OperationLink move={move} /></div><div className="mt-1 truncate text-xs text-muted-foreground">[{move.productSku}] {move.productName}</div></td>
    <td className="px-3 py-3 text-sm">{formatDate(move.occurredAt)}</td>
    <td className="px-3 py-3 text-sm">{move.partnerName ?? "—"}</td>
    <td className="px-3 py-3 text-sm">{endpoints.from}</td>
    <td className="px-3 py-3 text-sm">{endpoints.to}</td>
    <td className={`px-3 py-3 font-mono text-sm font-medium ${direction.color}`}>{direction.sign}{move.quantity}</td>
    <td className="px-3 py-3"><StatusBadge status={move.status} /></td>
  </tr>;
}

function MoveCard({ move }: { move: Awaited<ReturnType<typeof stockApi.moves>>["items"][number] }) {
  const direction = getDirection(move.signedDelta);
  const endpoints = getEndpoints(move);
  return <article className="rounded-lg border border-border p-4">
    <div className="flex items-start justify-between gap-3"><div><OperationLink move={move}/><p className="mt-1 text-xs text-muted-foreground">[{move.productSku}] {move.productName}</p></div><span className={`shrink-0 text-sm font-semibold ${direction.color}`}>{direction.sign}{move.quantity}</span></div>
    <div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{formatDate(move.occurredAt)} · {direction.label}</p><StatusBadge status={move.status} /></div>
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm"><MoveField label="Contact" value={move.partnerName ?? "—"} /><MoveField label="From" value={endpoints.from} /><MoveField label="To" value={endpoints.to} /></dl>
  </article>;
}

function MoveKanban({ moves }: { moves: Awaited<ReturnType<typeof stockApi.moves>>["items"] }) {
  const statuses = ["draft", "waiting", "ready", "done", "canceled"];
  return <div className="flex items-start gap-4 overflow-x-auto pb-2" aria-label="Stock movements grouped by operation status">
    {statuses.map((status) => {
      const items = moves.filter((move) => move.status.toLowerCase() === status);
      return <section key={status} className="w-56 shrink-0 rounded-lg bg-muted/60 p-3" aria-label={`${capitalize(status)} movements`}>
        <div className="mb-3 flex items-center justify-between px-1"><h3 className="text-sm font-semibold">{capitalize(status)}</h3><span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span></div>
        <div className="grid gap-2">{items.length === 0 ? <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">No movements</p> : items.map((move) => <MoveCard key={move.id} move={move} />)}</div>
      </section>;
    })}
  </div>;
}

function OperationLink({ move }: { move: Awaited<ReturnType<typeof stockApi.moves>>["items"][number] }) {
  const path = OPERATION_PATH[move.type];
  return path ? <Link className="font-medium text-primary hover:underline" href={`/operations/${path}/${move.operationId}`}>{move.reference}</Link> : <span>{move.reference}</span>;
}

function MoveField({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="truncate" title={value}>{value}</dd></div>;
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">{label}<select aria-label={`Filter by ${label.toLowerCase()}`} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground">{children}</select></label>;
}

function getDirection(signedDelta: string) {
  const delta = Number(signedDelta);
  return delta > 0
    ? { label: "Inbound", sign: "+", color: "text-success", rowTone: "border-l-2 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/15" }
    : delta < 0
    ? { label: "Outbound", sign: "−", color: "text-destructive", rowTone: "border-l-2 border-l-red-500 bg-red-50/40 dark:bg-red-950/15" }
    : { label: "Internal", sign: "±", color: "text-foreground", rowTone: "border-l-2 border-l-border" };
}

function getEndpoints(move: Awaited<ReturnType<typeof stockApi.moves>>["items"][number]) {
  return {
    from: move.fromLocationName ?? (move.type === "receipt" ? "Vendor" : move.type === "adjustment" ? "Adjustment" : "Customer"),
    to: move.toLocationName ?? (move.type === "delivery" ? "Customer" : move.type === "adjustment" ? "Adjustment" : "Vendor"),
  };
}

function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }
