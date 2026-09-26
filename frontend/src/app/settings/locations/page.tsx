"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";

export default function LocationsPage() {
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const locations = warehouses.data?.items.flatMap((warehouse) => warehouse.locations?.map((location) => ({ ...location, warehouseName: warehouse.name })) ?? []) ?? [];
  return <RouteScaffold section="Settings" title="Locations" description="Review rooms, racks, and shelves associated with each warehouse.">
    <RoutePanel title="Location directory" description="Select a location to view its details.">
      {warehouses.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading locations…</p> : warehouses.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load locations.</p><Button variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button></div> : locations.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No locations have been configured.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Name", "Short code", "Warehouse", "Type", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{locations.map((location) => <tr key={location.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-3 text-sm"><Link className="font-medium text-primary hover:underline" href={`/settings/locations/${location.id}`}>{location.name}</Link></td><td className="px-3 py-3 font-mono text-sm">{location.code}</td><td className="px-3 py-3 text-sm">{location.warehouseName}</td><td className="px-3 py-3 text-sm">{location.kind}</td><td className="px-3 py-3 text-sm">{location.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>}
    </RoutePanel>
  </RouteScaffold>;
}
