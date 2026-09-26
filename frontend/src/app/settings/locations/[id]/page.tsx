"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const warehouse = warehouses.data?.items.find((item) => item.locations.some((location) => location.id === id));
  const location = warehouse?.locations.find((item) => item.id === id);
  return <RouteScaffold section="Settings / Locations" title={location?.name ?? "Location details"} description="View the location code, type, and parent warehouse.">
    <div className="mb-4"><Link href="/settings/locations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to locations</Link></div>
    <RoutePanel title="Location profile" description="Location records are currently read-only in the available API.">
      {warehouses.isPending ? <p role="status" className="py-10 text-sm text-muted-foreground">Loading location…</p> : warehouses.isError ? <div className="grid justify-items-center gap-3 py-10"><p className="text-sm text-destructive">Couldn’t load this location.</p><Button variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button></div> : !location ? <p className="py-10 text-sm text-muted-foreground">This location does not exist or is unavailable.</p> : <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[["Name", location.name], ["Short code", location.code], ["Warehouse", warehouse?.name ?? "—"], ["Location type", location.kind], ["Status", location.isActive ? "Active" : "Inactive"]].map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}</dl>}
    </RoutePanel>
  </RouteScaffold>;
}
