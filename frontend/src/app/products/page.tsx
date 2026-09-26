"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { stockApi, type Product } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const products = useQuery({ queryKey: ["products", debouncedSearch], queryFn: () => stockApi.products(debouncedSearch) });
  return <RouteScaffold section="Products" title="Products" description="Search the product catalog and review cost, category, and stock availability.">
    <RoutePanel title="Product catalog" description="Search products by name or SKU and manage product records.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><label className="relative min-w-0 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" aria-label="Search products" className="h-10 pl-9" /></label><Link href="/products/new"><Button><Plus /> New product</Button></Link></div>
      {products.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading products…</p>
        : products.isError ? <div className="grid justify-items-center gap-3 py-12 text-center"><p className="text-sm text-destructive">Couldn’t load products.</p><Button variant="outline" onClick={() => void products.refetch()}>Retry</Button></div>
          : products.data.items.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No products found{search ? ` for “${search}”` : ""}.</p>
            : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Product", "SKU", "Category", "Unit cost", "On hand", "Free to use", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{products.data.items.map((product: Product) => <tr key={product.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50"><td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/products/${product.id}`}>{product.name}</Link></td><td className="px-3 py-3 font-mono text-sm">{product.sku}</td><td className="px-3 py-3 text-sm">{product.categoryName}</td><td className="px-3 py-3 text-sm">₹{product.unitCost} / {product.unit}</td><td className="px-3 py-3 text-sm">{product.onHand} {product.unit}</td><td className="px-3 py-3 text-sm">{product.freeToUse} {product.unit}</td><td className="px-3 py-3"><StatusBadge status={product.isActive ? "Active" : "Inactive"} /></td></tr>)}</tbody></table></div>}
    </RoutePanel>
  </RouteScaffold>;
}
