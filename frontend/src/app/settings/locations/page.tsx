"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";

export default function LocationsPage() {
  const warehouses = useQuery({
    queryKey: ["warehouses", true],
    queryFn: () => stockApi.warehouses(true),
  });

  const locations =
    warehouses.data?.items.flatMap((warehouse) =>
      warehouse.locations.map((location) => ({
        ...location,
        warehouseName: warehouse.name,
      }))
    ) ?? [];

  return (
    <RouteScaffold
      section="Settings"
      title="Locations"
      description="Review rooms, racks, and shelves associated with each warehouse."
    >
      <RoutePanel title="Location directory" description="Select a location to view its details.">
        {warehouses.isPending ? (
          <div className="py-2">
            <SkeletonTable columns={5} rows={5} showSearch={false} showPagination={false} />
          </div>
        ) : warehouses.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold text-destructive">Failed to load locations</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Could not retrieve warehouse and location data from the server.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void warehouses.refetch()}>
              Try Again
            </Button>
          </div>
        ) : locations.length === 0 ? (
          <EmptyState
            title="No locations configured"
            description="No storage racks, rooms, or shelves have been registered in any warehouse."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Name", "Short code", "Warehouse", "Type", "Status"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {locations.map((location) => (
                  <tr key={location.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={`/settings/locations/${location.id}`}
                      >
                        {location.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{location.code}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{location.warehouseName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{location.kind}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={location.isActive ? "default" : "secondary"}>
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RoutePanel>
    </RouteScaffold>
  );
}
