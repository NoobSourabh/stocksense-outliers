"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

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
  const products = useQuery({ queryKey: ["products", "move-filters"], queryFn: () => stockApi.products() });
  const warehouses = useQuery({ queryKey: ["warehouses", true, "move-filters"], queryFn: () => stockApi.warehouses(true) });
  const moves = useQuery({
    queryKey: ["moves", debouncedSearch, type, productId, locationId, fromDate, toDate],
    queryFn: () => stockApi.moves({
      search: debouncedSearch || undefined,
      type: type || undefined,
      productId: productId || undefined,
      locationId: locationId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      limit: 100,
    }),
  });
  const rows = useMemo(() => moves.data?.items ?? [], [moves.data]);
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const locations = warehouses.data?.items.flatMap((warehouse) => warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []) ?? [];
  const filtersChanged = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(0); };

  return <RouteScaffold section="Move History" title="Move history" description="An immutable ledger of stock movements recorded by validated operations.">
    <RoutePanel title="Stock ledger" description="Inbound quantities are green; outbound quantities are red. Each row represents one product line.">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="relative min-w-0 sm:col-span-2 xl:col-span-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search reference, SKU, or product" aria-label="Search ledger" className="h-10 pl-9" />
        </label>
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
        <Link href="/operations/adjustments/new"><Button className="w-full sm:w-auto"><Plus /> New adjustment</Button></Link>
      </div>
      {moves.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading stock movements…</p>
        : moves.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load the stock ledger.</p><Button variant="outline" onClick={() => void moves.refetch()}>Retry</Button></div>
          : rows.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No ledger entries match these filters.</p>
            : <>
              <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1000px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Reference", "Date", "Contact", "Product", "From", "To", "Quantity", "Direction", "Actor"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>
                {visible.map((move) => <MoveTableRow key={move.id} move={move} />)}
              </tbody></table></div>
              <div className="grid gap-3 md:hidden">{visible.map((move) => <MoveCard key={move.id} move={move} />)}</div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Page {page + 1} of {pages} · {rows.length} movements loaded</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>
            </>}
    </RoutePanel>
  </RouteScaffold>;
}

function MoveTableRow({ move }: { move: Awaited<ReturnType<typeof stockApi.moves>>["items"][number] }) {
  const direction = getDirection(move.signedDelta);
  return <tr className="border-b border-border/70 last:border-0">
    <td className="px-3 py-3 font-mono text-sm"><OperationLink move={move} /></td>
    <td className="px-3 py-3 text-sm">{formatDate(move.occurredAt)}</td>
    <td className="px-3 py-3 text-sm">{move.partnerName ?? "—"}</td>
    <td className="px-3 py-3 text-sm"><span className="font-medium">{move.productName}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{move.productSku}</span></td>
    <td className="px-3 py-3 text-sm">{move.fromLocationName ?? "Supplier / opening"}</td>
    <td className="px-3 py-3 text-sm">{move.toLocationName ?? "Customer / external"}</td>
    <td className={`px-3 py-3 font-mono text-sm font-medium ${direction.color}`}>{direction.sign}{move.quantity}</td>
    <td className={`px-3 py-3 text-sm font-medium ${direction.color}`}>{direction.label}</td>
    <td className="px-3 py-3 text-sm">{move.actorName}</td>
  </tr>;
}

function MoveCard({ move }: { move: Awaited<ReturnType<typeof stockApi.moves>>["items"][number] }) {
  const direction = getDirection(move.signedDelta);
  return <article className="rounded-lg border border-border p-4">
    <div className="flex items-start justify-between gap-3"><OperationLink move={move} /><span className={`shrink-0 text-sm font-semibold ${direction.color}`}>{direction.sign}{move.quantity}</span></div>
    <p className="mt-1 text-xs text-muted-foreground">{formatDate(move.occurredAt)} · {direction.label}</p>
    <p className="mt-3 text-sm font-medium">{move.productName}<span className="ml-2 font-mono text-xs text-muted-foreground">{move.productSku}</span></p>
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm"><MoveField label="Contact" value={move.partnerName ?? "—"} /><MoveField label="From" value={move.fromLocationName ?? "Supplier / opening"} /><MoveField label="To" value={move.toLocationName ?? "Customer / external"} /><MoveField label="Actor" value={move.actorName} /><MoveField label="Reason" value={move.reason ?? "—"} /></dl>
  </article>;
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
  return delta > 0 ? { label: "Inbound", sign: "+", color: "text-success" } : delta < 0 ? { label: "Outbound", sign: "−", color: "text-destructive" } : { label: "Internal", sign: "±", color: "text-foreground" };
}

function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }
