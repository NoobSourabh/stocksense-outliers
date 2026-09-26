"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

export default function MovesPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);

  const moves = useQuery({
    queryKey: ["moves", search, type],
    queryFn: () => stockApi.moves({ search: search || undefined, type: type || undefined }),
  });

  const rows = useMemo(() => moves.data?.items ?? [], [moves.data]);
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  return (
    <RouteScaffold
      section="Move History"
      title="Move history"
      description="An immutable ledger of stock movements recorded by validated operations."
    >
      <RoutePanel
        title="Stock ledger"
        description="Inbound quantities are green; outbound quantities are red. Each row represents one product line."
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search reference, SKU, or product"
              aria-label="Search ledger"
              className="h-10 pl-9"
            />
          </label>
          <select
            aria-label="Filter by operation type"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(0);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All types</option>
            {["receipt", "delivery", "transfer", "adjustment"].map((kind) => (
              <option key={kind} value={kind}>
                {kind[0].toUpperCase() + kind.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {moves.isPending ? (
          <div className="py-2">
            <SkeletonTable columns={8} rows={6} showSearch={false} showPagination={false} />
          </div>
        ) : moves.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold text-destructive">Failed to load stock ledger</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Unable to retrieve ledger transaction history from the server.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void moves.refetch()}>
              Try Again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No ledger entries found"
            description={
              search || type
                ? "No stock movements match your search criteria or type filter."
                : "No stock movements have occurred yet. Complete an operation to populate the ledger."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {["Reference", "Date", "Product", "From", "To", "Quantity", "Direction", "Actor"].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {visible.map((move) => {
                    const delta = Number(move.signedDelta);
                    const direction = delta > 0 ? "Inbound" : delta < 0 ? "Outbound" : "Internal";
                    return (
                      <tr key={move.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">{move.reference}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(move.occurredAt)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium text-foreground">{move.productName}</span>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">{move.productSku}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{move.fromLocationName ?? "Supplier / opening"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{move.toLocationName ?? "Customer / external"}</td>
                        <td
                          className={`px-4 py-3 font-mono text-sm font-semibold ${
                            direction === "Inbound"
                              ? "text-success"
                              : direction === "Outbound"
                              ? "text-destructive"
                              : "text-foreground"
                          }`}
                        >
                          {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
                          {move.quantity}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${
                            direction === "Inbound"
                              ? "text-success"
                              : direction === "Outbound"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {direction}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{move.actorName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {pages} · {rows.length} movements loaded
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((current) => current + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </RoutePanel>
    </RouteScaffold>
  );
}
