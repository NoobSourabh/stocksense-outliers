"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";

export default function WarehousesPage() {
  const warehouses = useQuery({
    queryKey: ["warehouses", true],
    queryFn: () => stockApi.warehouses(true),
  });

  return (
    <RouteScaffold
      section="Settings"
      title="Warehouses"
      description="Review warehouse identities, addresses, and associated stock locations."
    >
      <RoutePanel
        title="Warehouse directory"
        description="Warehouse codes and location memberships are managed by the inventory service."
      >
        {warehouses.isPending ? (
          <div className="py-2">
            <SkeletonTable columns={5} rows={4} showSearch={false} showPagination={false} />
          </div>
        ) : warehouses.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold text-destructive">Failed to load warehouses</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Unable to connect to the warehouse configuration service.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void warehouses.refetch()}>
              Try Again
            </Button>
          </div>
        ) : warehouses.data.items.length === 0 ? (
          <EmptyState
            title="No warehouses configured"
            description="No warehouse facilities have been set up in the system."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Name", "Short code", "Address", "Locations", "Status"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {warehouses.data.items.map((warehouse) => (
                  <tr key={warehouse.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{warehouse.name}</td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{warehouse.code}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{warehouse.address ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="font-mono font-medium text-foreground">{warehouse.locations.length}</span> locations
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                        {warehouse.isActive ? "Active" : "Inactive"}
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
