"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showCreateSuccessToast, showErrorToast } from "@/lib/toast-utils";

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const [warehouseId, setWarehouseId] = useState("");
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
      showCreateSuccessToast("Location");
    },
    onError: (error) => showErrorToast(error, "Could not create location"),
  });
  const locations = warehouses.data?.items.flatMap((warehouse) => warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []) ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate();
  }

  return <RouteScaffold section="Settings" title="Locations" description="Review rooms, racks, and shelves associated with each warehouse.">
    <form onSubmit={submit}>
      <RoutePanel title="Create location" description="Add an internal or external location within a warehouse.">
        {warehouses.isError ? <div className="flex flex-wrap items-center justify-between gap-3 py-2"><p className="text-sm text-destructive">Couldn’t load warehouses for the location form.</p><Button type="button" variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button></div> : warehouses.data?.items.length === 0 ? <p className="text-sm text-muted-foreground">Create a warehouse before adding locations. <Link href="/settings/warehouses" className="text-primary hover:underline">Go to warehouses</Link></p> : <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1.5 text-sm font-medium">Warehouse<select required value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} disabled={warehouses.isPending || !warehouses.data?.items.length} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-60"><option value="">Select warehouse</option>{warehouses.data?.items.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-medium">Short code<Input value={code} onChange={(event) => setCode(event.target.value)} required maxLength={50} pattern=".*\\S.*" title="Enter a code with at least one non-space character." className="h-10 bg-background text-sm font-normal" /></label>
            <label className="grid gap-1.5 text-sm font-medium">Location name<Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} pattern=".*\\S.*" title="Enter a name with at least one non-space character." className="h-10 bg-background text-sm font-normal" /></label>
            <label className="grid gap-1.5 text-sm font-medium">Type<select value={kind} onChange={(event) => setKind(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal"><option value="internal">Internal</option><option value="external">External</option></select></label>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" disabled={create.isPending || warehouses.isPending || !warehouseId}>{create.isPending ? "Creating…" : "Create location"}</Button></div>
        </>}
      </RoutePanel>
    </form>
    <RoutePanel title="Location directory" description="Select a location to view its details.">
      {warehouses.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading locations…</p> : warehouses.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load locations.</p><Button variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button></div> : locations.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No locations have been configured.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Name", "Short code", "Warehouse", "Type", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{locations.map((location) => <tr key={location.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/settings/locations/${location.id}`}>{location.name}</Link></td><td className="px-3 py-3 font-mono text-sm">{location.code}</td><td className="px-3 py-3 text-sm">{location.warehouseName}</td><td className="px-3 py-3 text-sm">{location.kind}</td><td className="px-3 py-3 text-sm">{location.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>}
    </RoutePanel>
  </RouteScaffold>;
}
