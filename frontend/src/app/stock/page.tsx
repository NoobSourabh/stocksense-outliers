"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, SlidersHorizontal } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";

export default function StockPage() {
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

  const flatBalances =
    stock.data?.flatMap(({ product, details }) =>
      (details.balances ?? []).map((balance) => ({ product, balance }))
    ) ?? [];

  return (
    <RouteScaffold
      section="Inventory"
      title="Stock on hand"
      description="Review physical and free-to-use quantities by product and location."
    >
      <RoutePanel
        title="Current stock"
        description="Free to use is calculated from on-hand stock minus open delivery commitments."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Synchronized with warehouse ledger and active operation reservations.
          </p>
          <Link href="/operations/adjustments/new">
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="size-3.5" />
              Record an adjustment
            </Button>
          </Link>
        </div>

        {stock.isPending ? (
          <div className="py-2">
            <SkeletonTable columns={7} rows={6} showSearch={false} showPagination={false} />
          </div>
        ) : stock.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold text-destructive">Failed to load stock balances</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Unable to aggregate stock availability across warehouse locations.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void stock.refetch()}>
              Try Again
            </Button>
          </div>
        ) : flatBalances.length === 0 ? (
          <EmptyState
            title="No stock records found"
            description="No inventory balances are currently registered across your warehouses."
            action={
              <Link href="/operations/receipts/new">
                <Button size="sm">Receive Initial Inventory</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Product", "SKU", "Location", "Warehouse", "On hand", "Free to use", "Reorder point"].map(
                    (heading) => (
                      <th key={heading} className="px-4 py-3 font-medium">
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {flatBalances.map(({ product, balance }) => (
                  <tr
                    key={`${product.id}-${balance.locationId}`}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 text-sm">
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={`/products/${product.id}`}
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{balance.locationName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{balance.warehouseName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">
                      {balance.onHand} <span className="text-xs font-normal text-muted-foreground">{product.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary">
                      {balance.freeToUse} <span className="text-xs font-normal text-muted-foreground">{product.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {product.reorderPoint} <span className="text-xs">{product.unit}</span>
                    </td>
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
