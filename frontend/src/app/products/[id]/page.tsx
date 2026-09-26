"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { ApiError } from "@/lib/api";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const product = useQuery({ queryKey: ["product", id], queryFn: () => stockApi.product(id), enabled: !!id });
  const categories = useQuery({ queryKey: ["categories"], queryFn: stockApi.categories });

  return (
    <RouteScaffold section="Products" title={product.data?.name ?? "Product details"} description="Edit product data and review availability by warehouse location.">
      <div className="mb-4">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to products
        </Link>
      </div>
      {product.isPending ? (
        <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading product…</p>
      ) : product.isError ? (
        <div className="grid justify-items-center gap-3 py-12">
          <p className="text-sm text-destructive">Couldn’t load this product.</p>
          <Button variant="outline" onClick={() => void product.refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <ProductEditForm
            key={product.data.id}
            id={id}
            product={product.data}
            categories={categories.data?.items ?? []}
            categoriesLoading={categories.isPending}
          />
          <div className="mt-5">
            <RoutePanel title="Availability by location" description={`Total on hand: ${product.data.onHandTotal ?? "0"} ${product.data.unit} · Free to use: ${product.data.freeToUseTotal ?? "0"} ${product.data.unit}`}>
              {(product.data.balances?.length ?? 0) === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No stock is recorded for this product yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left">
                    <thead>
                      <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-3 py-3 font-medium">Warehouse</th>
                        <th className="px-3 py-3 font-medium">Location</th>
                        <th className="px-3 py-3 font-medium">On hand</th>
                        <th className="px-3 py-3 font-medium">Free to use</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.data.balances?.map((balance) => (
                        <tr key={balance.locationId} className="border-b border-border/70">
                          <td className="px-3 py-3 text-sm">{balance.warehouseName}</td>
                          <td className="px-3 py-3 text-sm">{balance.locationName}</td>
                          <td className="px-3 py-3 text-sm">{balance.onHand} {product.data.unit}</td>
                          <td className="px-3 py-3 text-sm">{balance.freeToUse} {product.data.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </RoutePanel>
          </div>
        </>
      )}
    </RouteScaffold>
  );
}

function ProductEditForm({
  id,
  product,
  categories,
  categoriesLoading,
}: {
  id: string;
  product: NonNullable<ReturnType<typeof stockApi.product> extends Promise<infer T> ? T : never>;
  categories: { id: string; name: string }[];
  categoriesLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [unit, setUnit] = useState(product.unit);
  const [unitCost, setUnitCost] = useState(product.unitCost);
  const [reorderPoint, setReorderPoint] = useState(product.reorderPoint);
  const [message, setMessage] = useState("");

  const update = useMutation({
    mutationFn: () => stockApi.updateProduct(id, { name: name.trim(), sku: sku.trim(), categoryId, unit: unit.trim(), unitCost, reorderPoint }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["product", id], data);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setMessage("Product saved.");
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Could not save the product."),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    update.mutate();
  }

  return (
    <form onSubmit={submit}>
      <RoutePanel title="Product profile" description={`${product.sku} · ${product.categoryName}`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Product name" value={name} onChange={setName} required />
          <Field label="SKU" value={sku} onChange={setSku} required />
          <label className="grid gap-1.5 text-sm font-medium">
            Category
            <select
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Unit of measure" value={unit} onChange={setUnit} required />
          <Field label="Cost per unit" value={unitCost} onChange={setUnitCost} type="number" min="0" step="0.01" required />
          <Field label={`Reorder point (${unit})`} value={reorderPoint} onChange={setReorderPoint} type="number" min="0" step="0.001" required />
        </div>
        {message && <p role="status" className={`mt-4 text-sm ${update.isError ? "text-destructive" : "text-success"}`}>{message}</p>}
        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={update.isPending || categoriesLoading || !categoryId}>
            <Save /> {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </RoutePanel>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", min, step, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<Input type={type} value={value} onChange={(event) => onChange(event.target.value)} min={min} step={step} required={required} className="h-10 bg-background text-sm font-normal" /></label>;
}
