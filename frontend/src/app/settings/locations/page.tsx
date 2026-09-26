"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";
import { showCreateSuccessToast, showErrorToast } from "@/lib/toast-utils";

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const warehouseId =
    selectedWarehouseId || (warehouses.data?.items.length === 1 ? warehouses.data.items[0].id : "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("internal");
  const create = useMutation({
    mutationFn: () => stockApi.createLocation(warehouseId, { code: code.trim(), name: name.trim(), kind }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
        queryClient.invalidateQueries({ queryKey: ["locations"] }),
      ]);
      setCode("");
      setName("");
      setKind("internal");
      showCreateSuccessToast("Location");
    },
    onError: (error) => showErrorToast(error, "Could not create location"),
  });
  const locations = warehouses.data?.items.flatMap((warehouse) =>
    (warehouse.locations ?? []).map((location) => ({ ...location, warehouseName: warehouse.name, warehouseCode: warehouse.code }))
  ) ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate();
  }

  function resetForm() {
    setCode("");
    setName("");
    setKind("internal");
    if ((warehouses.data?.items.length ?? 0) !== 1) setSelectedWarehouseId("");
  }

  return <RouteScaffold section="Settings" title="Location" description="Organize warehouse space into rooms, racks, and shelves." hideHeading>
    <form onSubmit={submit}>
      <RoutePanel title="Location" description="A warehouse can contain multiple storage locations, rooms, racks, and shelves.">
        {warehouses.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <p className="text-sm text-destructive">Couldn’t load warehouses for the location form.</p>
            <Button type="button" variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button>
          </div>
        ) : warehouses.data?.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Create a warehouse before adding locations. <Link href="/settings/warehouses" className="text-primary hover:underline">Go to warehouses</Link></p>
        ) : (
          <>
            <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1.5 text-sm font-medium">Name
                <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} pattern=".*\\S.*" title="Enter a name with at least one non-space character." className="h-10 bg-background text-sm font-normal" />
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-medium">Short Code
                <Input value={code} onChange={(event) => setCode(event.target.value)} required maxLength={50} pattern=".*\\S.*" title="Enter a code with at least one non-space character." className="h-10 bg-background text-sm font-normal" />
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-medium">Warehouse
                <select required value={warehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)} disabled={warehouses.isPending || !warehouses.data?.items.length} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-60">
                  <option value="">Select warehouse</option>{warehouses.data?.items.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}
                </select>
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm font-medium">Kind
                <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-normal"><option value="internal">Internal</option><option value="external">External</option></select>
              </label>
            </div>
            <div className="mt-5 flex gap-2"><Button type="submit" disabled={create.isPending || warehouses.isPending || !warehouseId}>{create.isPending ? "Saving…" : "Save"}</Button><Button type="button" variant="outline" onClick={resetForm} disabled={create.isPending}>Cancel</Button></div>
          </>
        )}
      </RoutePanel>
    </form>
    <div className="mt-5">
      <RoutePanel title="Locations" description="Every location belongs to one warehouse.">
        {warehouses.isPending ? (
          <div className="py-2"><SkeletonTable columns={5} rows={6} showSearch={false} showPagination={false} /></div>
        ) : warehouses.isError ? (
          <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load locations.</p><Button variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button></div>
        ) : locations.length === 0 ? (
          <EmptyState title="No locations configured" description="Create a location above to make it available for stock operations." />
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left">
            <thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Name", "Short Code", "Warehouse", "Kind", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead>
            <tbody>{locations.map((location) => <tr key={location.id} className="border-b border-border/70 last:border-0">
              <td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/settings/locations/${location.id}`}>{location.name}</Link></td>
              <td className="px-3 py-3 font-mono text-sm">{location.code}</td><td className="px-3 py-3 text-sm">{location.warehouseName} <span className="font-mono text-muted-foreground">({location.warehouseCode})</span></td><td className="px-3 py-3 text-sm">{location.kind}</td><td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/settings/locations/${location.id}`}>View</Link></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </RoutePanel>
    </div>
  </RouteScaffold>;
}
