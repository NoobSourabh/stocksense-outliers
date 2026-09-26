"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, AlertCircle } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";

const CONFIG = {
  receipts: { type: "receipt", title: "Receipts", description: "Track incoming stock from suppliers through draft, ready, and done states." },
  deliveries: { type: "delivery", title: "Deliveries", description: "Manage outgoing orders and see which deliveries are ready, waiting, or complete." },
  adjustments: { type: "adjustment", title: "Inventory adjustments", description: "Reconcile counted quantities against recorded stock with an auditable reason." },
} as const;

export function OperationList({ kind }: { kind: keyof typeof CONFIG }) {
  const config = CONFIG[kind];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const operations = useQuery({
    queryKey: ["operations", config.type, search, status],
    queryFn: () => stockApi.operations({ type: config.type, search: search || undefined, status: status || undefined }),
  });

  return (
    <RouteScaffold section="Operations" title={config.title} description={config.description}>
      <RoutePanel title={`${config.title} operations`} description="Search by reference or contact and review each operation's current state.">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Reference or contact"
              aria-label="Search operations"
              className="h-10 pl-9"
            />
          </label>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All statuses</option>
            {["draft", "waiting", "ready", "done", "canceled"].map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
          <Link href={`/operations/${kind}/new`}>
            <Button>
              <Plus className="size-4" /> New {kind === "adjustments" ? "adjustment" : kind.slice(0, -1)}
            </Button>
          </Link>
        </div>

        {operations.isPending ? (
          <div className="py-2">
            <SkeletonTable columns={6} rows={5} showSearch={false} showPagination={false} />
          </div>
        ) : operations.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold text-destructive">Failed to load {config.title.toLowerCase()}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              We couldn't connect to the inventory service. Check your connection or API server status.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void operations.refetch()}>
              Try Again
            </Button>
          </div>
        ) : operations.data.items.length === 0 ? (
          <EmptyState
            title={`No ${config.title.toLowerCase()} found`}
            description={
              search || status
                ? "No operations match the selected search or status filters. Try clearing your search parameters."
                : `No ${config.title.toLowerCase()} records exist yet in the inventory database.`
            }
            action={
              <Link href={`/operations/${kind}/new`}>
                <Button size="sm">
                  <Plus className="size-4" /> Create First {kind === "adjustments" ? "Adjustment" : "Operation"}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Reference", "Contact", "Schedule date", "Lines", "Status", "Responsible"].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {operations.data.items.map((operation: Operation) => (
                  <tr key={operation.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-sm">
                      <Link className="font-medium text-primary hover:underline" href={`/operations/${kind}/${operation.id}`}>
                        {operation.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{operation.partnerName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{operation.scheduleDate ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{operation.lineCount ?? operation.lines?.length ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={operation.status[0]?.toUpperCase() + operation.status.slice(1)} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{operation.createdByName ?? "—"}</td>
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
