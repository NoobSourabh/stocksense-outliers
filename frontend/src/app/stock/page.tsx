"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { stockApi, type Balance, type Product } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type StockRow = { product: Product; balance: Balance };

export default function StockPage() {
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const stock = useQuery({
    queryKey: ["stock", "availability"],
    queryFn: async () => {
      const products = await stockApi.products();
      return Promise.all(
        products.items.map(async (product) => ({
          product,
          details: await stockApi.product(product.id),
        }))
      );
    },
  });

  const allRows = useMemo(() => stock.data?.flatMap(({ product, details }) =>
    (details.balances ?? []).map((balance) => ({ product, balance }))
  ) ?? [], [stock.data]);
  const availableLocations = useMemo(() => {
    return warehouses.data?.items
      .filter((warehouse) => !warehouseId || warehouse.id === warehouseId)
      .flatMap((warehouse) => warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []) ?? [];
  }, [warehouses.data, warehouseId]);
  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allRows.filter(({ product, balance }) =>
      (!q || product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q) || balance.locationName.toLowerCase().includes(q) || balance.warehouseName.toLowerCase().includes(q)) &&
      (!warehouseId || availableLocations.some((location) => location.id === balance.locationId)) &&
      (!locationId || balance.locationId === locationId)
    );
  }, [allRows, availableLocations, debouncedSearch, locationId, warehouseId]);

  const headerHref = adjustmentHref(filteredRows.length === 1 ? filteredRows[0] : undefined, locationId);

  return (
    <RouteScaffold section="Inventory" title="Stock on hand" description="Review physical and free-to-use quantities by product and location.">
      <RoutePanel title="Current stock" description="Free to use is calculated from on-hand stock minus open delivery commitments.">
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(170px,220px)_minmax(170px,220px)_auto] sm:items-center">
          <label className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, or location" aria-label="Search stock" className="h-10 pl-9" />
          </label>
          <select aria-label="Filter stock by warehouse" value={warehouseId} onChange={(event) => { setWarehouseId(event.target.value); setLocationId(""); }} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All warehouses</option>{warehouses.data?.items.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
          </select>
          <select aria-label="Filter stock by location" value={locationId} onChange={(event) => setLocationId(event.target.value)} disabled={warehouses.isPending} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60">
            <option value="">All locations</option>{availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.warehouseName}</option>)}
          </select>
          <Link href={headerHref} className="sm:justify-self-end"><Button variant="outline" className="w-full sm:w-auto">Update stock</Button></Link>
        </div>
        {stock.isPending || warehouses.isPending ? (
          <div className="py-2"><SkeletonTable columns={9} rows={6} showSearch={false} showPagination={false} /></div>
        ) : stock.isError || warehouses.isError ? (
          <div className="grid justify-items-center gap-3 py-12">
            <p className="text-sm text-destructive">Couldn’t load stock balances and locations.</p>
            <Button variant="outline" onClick={() => { void stock.refetch(); void warehouses.refetch(); }}>Retry</Button>
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState title={allRows.length === 0 ? "No stock recorded" : "No matching stock"} description={allRows.length === 0 ? "Stock balances will appear here after stock is received or adjusted." : "No stock matches the selected search and location filters."} />
        ) : (
          <>
            <div className="space-y-3 md:hidden">{filteredRows.map((row) => <StockCard key={`${row.product.id}-${row.balance.locationId}`} row={row} />)}</div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left">
                <thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Product", "SKU", "Location", "Warehouse", "Unit cost", "On hand", "Free to use", "Reorder point", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead>
                <tbody>{filteredRows.map(({ product, balance }) => <tr key={`${product.id}-${balance.locationId}`} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                  <td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/products/${product.id}`}>{product.name}</Link></td>
                  <td className="px-3 py-3 font-mono text-sm">{product.sku}</td>
                  <td className="px-3 py-3 text-sm">{balance.locationName}</td>
                  <td className="px-3 py-3 text-sm">{balance.warehouseName}</td>
                  <td className="px-3 py-3 text-sm">₹{product.unitCost} / {product.unit}</td>
                  <td className="px-3 py-3 font-mono text-sm font-medium">{balance.onHand} {product.unit}</td>
                  <td className="px-3 py-3 font-mono text-sm font-medium">{balance.freeToUse} {product.unit}</td>
                  <td className="px-3 py-3 font-mono text-sm text-muted-foreground">{product.reorderPoint} {product.unit}</td>
                  <td className="px-3 py-3"><Link href={adjustmentHref({ product, balance })}><Button size="sm" variant="outline">Update</Button></Link></td>
                </tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </RoutePanel>
    </RouteScaffold>
  );
}

function adjustmentHref(row?: StockRow, fallbackLocationId = "") {
  const params = new URLSearchParams();
  if (row) {
    params.set("productId", row.product.id);
    params.set("locationId", row.balance.locationId);
    params.set("countedQuantity", row.balance.onHand);
  } else if (fallbackLocationId) {
    params.set("locationId", fallbackLocationId);
  }
  const query = params.toString();
  return `/operations/adjustments/new${query ? `?${query}` : ""}`;
}

function StockCard({ row }: { row: StockRow }) {
  const { product, balance } = row;
  return <article className="rounded-lg border border-border p-4">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link className="font-medium text-primary hover:underline" href={`/products/${product.id}`}>{product.name}</Link><p className="mt-1 font-mono text-xs text-muted-foreground">{product.sku}</p></div><Link href={adjustmentHref(row)}><Button size="sm" variant="outline">Update</Button></Link></div>
    <p className="mt-2 text-xs text-muted-foreground">{balance.locationName} · {balance.warehouseName}</p>
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><Metric label="Unit cost" value={`₹${product.unitCost} / ${product.unit}`} /><Metric label="Reorder point" value={`${product.reorderPoint} ${product.unit}`} /><Metric label="On hand" value={`${balance.onHand} ${product.unit}`} /><Metric label="Free to use" value={`${balance.freeToUse} ${product.unit}`} /></dl>
  </article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words font-mono">{value}</dd></div>;
}
