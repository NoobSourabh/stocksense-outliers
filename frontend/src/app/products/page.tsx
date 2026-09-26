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
  const [categoryId, setCategoryId] = useState("");
  const [stockState, setStockState] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const products = useQuery({ queryKey: ["products", debouncedSearch, categoryId], queryFn: () => stockApi.products(debouncedSearch, categoryId || undefined) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: stockApi.categories });
  const rows = products.data?.items.filter((product) => {
    const onHand = Number(product.onHandTotal ?? product.onHand ?? 0);
    const reorderPoint = Number(product.reorderPoint ?? 0);
    if (stockState === "out") return onHand === 0;
    if (stockState === "low") return onHand > 0 && onHand <= reorderPoint;
    if (stockState === "healthy") return onHand > reorderPoint;
    return true;
  }) ?? [];

  return <RouteScaffold section="Products" title="Products" description="Search the product catalog and review cost, reorder point, and stock availability.">
    <RoutePanel title="Product catalog" description="Filter products by name, SKU, category, or stock level.">
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(160px,220px)_minmax(150px,190px)_auto] sm:items-center">
        <label className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" aria-label="Search products" className="h-10 pl-9" />
        </label>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="Filter products by category" className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All categories</option>{categories.data?.items.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select value={stockState} onChange={(event) => setStockState(event.target.value)} aria-label="Filter products by stock level" className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="healthy">Above reorder point</option>
        </select>
        <Link href="/products/new" className="sm:justify-self-end"><Button className="w-full sm:w-auto"><Plus /> New product</Button></Link>
      </div>
      {products.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading products…</p>
        : products.isError ? <div className="grid justify-items-center gap-3 py-12 text-center"><p className="text-sm text-destructive">Couldn’t load products.</p><Button variant="outline" onClick={() => void products.refetch()}>Retry</Button></div>
          : rows.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No products match the selected filters.</p>
            : <>
              <div className="space-y-3 md:hidden">{rows.map((product: Product) => <ProductCard key={product.id} product={product} />)}</div>
              <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Product", "SKU", "Category", "Unit cost", "On hand", "Free to use", "Reorder point", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{rows.map((product: Product) => <tr key={product.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50"><td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/products/${product.id}`}>{product.name}</Link></td><td className="px-3 py-3 font-mono text-sm">{product.sku}</td><td className="px-3 py-3 text-sm">{product.categoryName}</td><td className="px-3 py-3 text-sm">₹{product.unitCost} / {product.unit}</td><td className="px-3 py-3 text-sm">{product.onHandTotal ?? product.onHand ?? "0"} {product.unit}</td><td className="px-3 py-3 text-sm">{product.freeToUseTotal ?? product.freeToUse ?? "0"} {product.unit}</td><td className="px-3 py-3 text-sm">{product.reorderPoint} {product.unit}</td><td className="px-3 py-3"><StatusBadge status={product.isActive ? "Active" : "Inactive"} /></td></tr>)}</tbody></table></div>
            </>}
    </RoutePanel>
  </RouteScaffold>;
}

function ProductCard({ product }: { product: Product }) {
  return <article className="rounded-lg border border-border p-4">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link className="font-medium text-primary hover:underline" href={`/products/${product.id}`}>{product.name}</Link><p className="mt-1 font-mono text-xs text-muted-foreground">{product.sku}</p></div><StatusBadge status={product.isActive ? "Active" : "Inactive"} /></div>
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><Metric label="Category" value={product.categoryName} /><Metric label="Unit cost" value={`₹${product.unitCost} / ${product.unit}`} /><Metric label="On hand" value={`${product.onHandTotal ?? product.onHand ?? "0"} ${product.unit}`} /><Metric label="Free to use" value={`${product.freeToUseTotal ?? product.freeToUse ?? "0"} ${product.unit}`} /><Metric label="Reorder point" value={`${product.reorderPoint} ${product.unit}`} /></dl>
  </article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words">{value}</dd></div>;
}
