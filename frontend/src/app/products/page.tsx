"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

const PRODUCTS = [
  ["Steel Rods", "STL-ROD-10", "Raw Materials", "₹450 / kg", "137 kg", "137 kg"],
  ["Ergo Chair", "CHR-ERGO-01", "Furniture", "₹3,000 / unit", "7 units", "2 units · Low stock"],
  ["M8 Bolt Pack", "BOLT-M8-100", "Hardware", "₹80 / pack", "0 packs", "0 packs · Out of stock"],
  ["Frame Assembly", "FRAME-A2", "Finished Goods", "₹1,200 / unit", "34 units", "34 units"],
];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const products = useMemo(() => PRODUCTS.filter((product) => `${product[0]} ${product[1]} ${product[2]}`.toLowerCase().includes(search.trim().toLowerCase())), [search]);
  return (
    <RouteScaffold section="Products" title="Products" description="Search the product catalog and review cost, category, and stock availability by location.">
      <RoutePanel title="Product catalog" description="Search products by name or SKU and manage product records.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU, category" aria-label="Search products" className="h-10 pl-9" /></label>
          <Link href="/products/new"><Button><Plus /> New product</Button></Link>
        </div>
        <ScaffoldTable columns={["Product", "SKU", "Category", "Unit cost", "On hand", "Free to use"]} rows={products} />
        {products.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">No products match “{search}”.</p>}
        <div className="mt-3 flex flex-wrap gap-3 text-sm"><Link className="text-primary hover:underline" href="/products/steel-rods">Open Steel Rods</Link><Link className="text-primary hover:underline" href="/products/ergo-chair">Open Ergo Chair</Link></div>
      </RoutePanel>
    </RouteScaffold>
  );
}
