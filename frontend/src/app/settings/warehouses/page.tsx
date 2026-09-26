"use client";

import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";

export default function WarehousesPage() {
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  return <RouteScaffold section="Settings" title="Warehouses" description="Review warehouse identities, addresses, and associated stock locations.">
    <RoutePanel title="Warehouse directory" description="Warehouse codes and location memberships are managed by the inventory service.">
      {warehouses.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading warehouses…</p> : warehouses.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load warehouses.</p><Button variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button></div> : warehouses.data.items.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No warehouses have been configured.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Name", "Short code", "Address", "Locations", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{warehouses.data.items.map((warehouse) => <tr key={warehouse.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-3 text-sm font-medium">{warehouse.name}</td><td className="px-3 py-3 font-mono text-sm">{warehouse.code}</td><td className="px-3 py-3 text-sm">{warehouse.address ?? "—"}</td><td className="px-3 py-3 text-sm">{warehouse.locations.length}</td><td className="px-3 py-3 text-sm">{warehouse.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>}
    </RoutePanel>
  </RouteScaffold>;
}
