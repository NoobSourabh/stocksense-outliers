"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { ApiError } from "@/lib/api";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showCreateSuccessToast, showErrorToast } from "@/lib/toast-utils";

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: stockApi.categories });
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState("0");
  const [reorderPoint, setReorderPoint] = useState("0");
  const [initialStockLocationId, setInitialStockLocationId] = useState("");
  const [initialStockQuantity, setInitialStockQuantity] = useState("");
  const [message, setMessage] = useState("");

  const allLocations = warehouses.data?.items.flatMap((warehouse) =>
    warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []
  ) ?? [];
  const internalLocations = allLocations.filter((location) => location.kind === "internal");
  const selectableLocations = internalLocations.length > 0 ? internalLocations : allLocations;

  const create = useMutation({
    mutationFn: () => stockApi.createProduct({
      name: name.trim(),
      sku: sku.trim(),
      categoryId,
      unit: unit.trim(),
      unitCost,
      reorderPoint,
      initialStock: initialStockQuantity.trim()
        ? { locationId: initialStockLocationId, quantity: initialStockQuantity.trim() }
        : undefined,
    }),
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      showCreateSuccessToast("Product");
      router.replace(`/products/${product.id}`);
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Could not create the product.");
      showErrorToast(error, "Could not create product");
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    create.mutate();
  }
  return <RouteScaffold section="Products" title="New product" description="Create a product record for the inventory catalog.">
    <div className="mb-4"><Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to products</Link></div>
    <form onSubmit={submit}><RoutePanel title="Product details" description="SKU values are normalized and checked by the server.">
      {(categories.isPending || warehouses.isPending) ? <p role="status" className="py-6 text-sm text-muted-foreground">Loading form data…</p> : (categories.isError || warehouses.isError) ? <p className="py-6 text-sm text-destructive">Couldn’t load form data. Refresh and try again.</p> : <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Product name" value={name} onChange={setName} required />
          <Field label="SKU" value={sku} onChange={setSku} required />
          <label className="grid gap-1.5 text-sm font-medium">Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal"><option value="">Select category</option>{categories.data?.items.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <Field label="Unit of measure" value={unit} onChange={setUnit} placeholder="e.g. units, kg" required />
          <Field label="Cost per unit" value={unitCost} onChange={setUnitCost} type="number" min="0" step="0.01" required />
          <Field label={`Reorder point${unit ? ` (${unit})` : ""}`} value={reorderPoint} onChange={setReorderPoint} type="number" min="0" step="0.001" required />
        </div>
        <div className="mt-5 grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Initial stock location
            <select value={initialStockLocationId} onChange={(event) => setInitialStockLocationId(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal">
              <option value="">None</option>
              {selectableLocations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.warehouseName}</option>)}
            </select>
          </label>
          <Field label={`Initial stock quantity${unit ? ` (${unit})` : ""}`} value={initialStockQuantity} onChange={setInitialStockQuantity} type="number" min="0" step="0.001" />
        </div>
      </>}
      {message && <p role="alert" className="mt-4 text-sm text-destructive">{message}</p>}
      <div className="mt-5 flex justify-end"><Button type="submit" disabled={create.isPending || categories.isPending || categories.isError || warehouses.isPending || warehouses.isError || !categoryId}><Save /> {create.isPending ? "Creating…" : "Create product"}</Button></div>
    </RoutePanel></form>
  </RouteScaffold>;
}

function Field({ label, value, onChange, type = "text", placeholder, min, step, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; min?: string; step?: string; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} min={min} step={step} required={required} className="h-10 bg-background text-sm font-normal" /></label>;
}
