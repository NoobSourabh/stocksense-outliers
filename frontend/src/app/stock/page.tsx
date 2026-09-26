"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";

export default function StockPage() {
  const stock = useQuery({ queryKey: ["stock", "availability"], queryFn: async () => {
    const products = await stockApi.products();
    return Promise.all(products.items.map(async (product) => ({ product, details: await stockApi.product(product.id) })));
  } });
  return <RouteScaffold section="Inventory" title="Stock on hand" description="Review physical and free-to-use quantities by product and location.">
    <RoutePanel title="Current stock" description="Free to use is calculated from on-hand stock minus open delivery commitments.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Balances from the inventory service.</p><Link href="/operations/adjustments/new"><Button variant="outline">Record an adjustment</Button></Link></div>
      {stock.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading stock balances…</p> : stock.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load stock balances.</p><Button variant="outline" onClick={() => void stock.refetch()}>Retry</Button></div> : stock.data.flatMap(({ product, details }) => (details.balances ?? []).map((balance) => ({ product, balance }))).length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No stock is recorded in any location.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Product", "SKU", "Location", "Warehouse", "On hand", "Free to use", "Reorder point"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{stock.data.flatMap(({ product, details }) => (details.balances ?? []).map((balance) => <tr key={`${product.id}-${balance.locationId}`} className="border-b border-border/70 last:border-0"><td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/products/${product.id}`}>{product.name}</Link></td><td className="px-3 py-3 font-mono text-sm">{product.sku}</td><td className="px-3 py-3 text-sm">{balance.locationName}</td><td className="px-3 py-3 text-sm">{balance.warehouseName}</td><td className="px-3 py-3 text-sm">{balance.onHand} {product.unit}</td><td className="px-3 py-3 text-sm">{balance.freeToUse} {product.unit}</td><td className="px-3 py-3 text-sm">{product.reorderPoint} {product.unit}</td></tr>))}</tbody></table></div>}
    </RoutePanel>
  </RouteScaffold>;
}
