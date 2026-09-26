"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { stockApi, type Product } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StockPage() {
  const [search, setSearch] = useState("");
  const stock = useQuery({
    queryKey: ["stock", "availability"],
    queryFn: async () => {
      const products = await stockApi.products();
      const results = await Promise.allSettled(
        products.items.map(async (product) => {
          const details = await stockApi.product(product.id);
          return { product, details };
        })
      );
      return results
        .filter((r): r is PromiseFulfilledResult<{ product: Product; details: Product }> => r.status === "fulfilled")
        .map((r) => r.value);
    },
  });

  const allRows = useMemo(() => {
    if (!stock.data) return [];
    return stock.data.flatMap(({ product, details }) =>
      (details.balances ?? []).map((balance) => ({ product, balance }))
    );
  }, [stock.data]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      ({ product, balance }) =>
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        balance.locationName.toLowerCase().includes(q) ||
        balance.warehouseName.toLowerCase().includes(q)
    );
  }, [allRows, search]);

  return (
    <RouteScaffold section="Inventory" title="Stock on hand" description="Review physical and free-to-use quantities by product and location.">
      <RoutePanel title="Current stock" description="Free to use is calculated from on-hand stock minus open delivery commitments.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU, or location"
              aria-label="Filter stock"
              className="h-10 pl-9"
            />
          </label>
          <Link href="/operations/adjustments/new">
            <Button variant="outline">Record an adjustment</Button>
          </Link>
        </div>
        {stock.isPending ? (
          <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading stock balances…</p>
        ) : stock.isError ? (
          <div className="grid justify-items-center gap-3 py-12">
            <p className="text-sm text-destructive">Couldn’t load stock balances.</p>
            <Button variant="outline" onClick={() => void stock.refetch()}>Retry</Button>
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {allRows.length === 0 ? "No stock is recorded in any location." : `No stock matches “${search}”.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Product", "SKU", "Location", "Warehouse", "On hand", "Free to use", "Reorder point"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ product, balance }) => (
                  <tr key={`${product.id}-${balance.locationId}`} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                    <td className="px-3 py-3 text-sm">
                      <Link className="font-medium text-primary hover:underline" href={`/products/${product.id}`}>{product.name}</Link>
                    </td>
                    <td className="px-3 py-3 font-mono text-sm">{product.sku}</td>
                    <td className="px-3 py-3 text-sm">{balance.locationName}</td>
                    <td className="px-3 py-3 text-sm">{balance.warehouseName}</td>
                    <td className="px-3 py-3 text-sm font-mono font-medium">{balance.onHand} {product.unit}</td>
                    <td className="px-3 py-3 text-sm font-mono font-medium">{balance.freeToUse} {product.unit}</td>
                    <td className="px-3 py-3 text-sm font-mono text-muted-foreground">{product.reorderPoint} {product.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RoutePanel>
    </RouteScaffold>
  );
}
