"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const CONFIG = {
  receipts: { type: "receipt", title: "Receipts", description: "Track incoming stock from suppliers through draft, ready, and done states." },
  deliveries: { type: "delivery", title: "Deliveries", description: "Manage outgoing orders and see which deliveries are ready, waiting, or complete." },
  adjustments: { type: "adjustment", title: "Inventory adjustments", description: "Reconcile counted quantities against recorded stock with an auditable reason." },
} as const;

const OPEN_STATUSES = {
  receipts: ["draft", "ready"],
  deliveries: ["draft", "waiting", "ready"],
  adjustments: ["draft", "ready"],
} as const;

export function OperationList({ kind }: { kind: keyof typeof CONFIG }) {
  return (
    <Suspense fallback={
      <RouteScaffold section="Operations" title={CONFIG[kind].title} description={CONFIG[kind].description}>
        <RoutePanel title={`${CONFIG[kind].title} operations`}>
          <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading operations…</p>
        </RoutePanel>
      </RouteScaffold>
    }>
      <OperationListContentWrapper kind={kind} />
    </Suspense>
  );
}

function OperationListContentWrapper({ kind }: { kind: keyof typeof CONFIG }) {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") ?? "";
  return <OperationListContent key={`${kind}-${statusParam}`} kind={kind} initialStatus={statusParam} />;
}

function OperationListContent({ kind, initialStatus }: { kind: keyof typeof CONFIG; initialStatus: string }) {
  const config = CONFIG[kind];
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState(initialStatus);

  const operations = useQuery({
    queryKey: ["operations", config.type, debouncedSearch, status],
    queryFn: async () => {
      if (status !== "open") return stockApi.operations({ type: config.type, search: debouncedSearch || undefined, status: status || undefined });
      const pages = await Promise.all(OPEN_STATUSES[kind].map((openStatus) => stockApi.operations({ type: config.type, search: debouncedSearch || undefined, status: openStatus })));
      const items = pages.flatMap((page) => page.items).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return { items, total: pages.reduce((total, page) => total + page.total, 0) };
    },
  });

  return (
    <RouteScaffold section="Operations" title={config.title} description={config.description}>
      <RoutePanel title={`${config.title} operations`} description="Search by reference or contact and review each operation's current state.">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference or contact" aria-label="Search operations" className="h-10 pl-9" />
          </label>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            {["draft", "waiting", "ready", "done", "canceled"].map((value) => (
              <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>
            ))}
          </select>
          <Link href={`/operations/${kind}/new`}>
            <Button><Plus /> New {kind === "adjustments" ? "adjustment" : kind.slice(0, -1)}</Button>
          </Link>
        </div>
        {operations.isPending ? (
          <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading {config.title.toLowerCase()}…</p>
        ) : operations.isError ? (
          <div className="grid justify-items-center gap-3 py-12 text-center">
            <p className="text-sm text-destructive">Couldn’t load operations. Check your connection and try again.</p>
            <Button variant="outline" onClick={() => void operations.refetch()}>Retry</Button>
          </div>
        ) : operations.data.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No operations match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Reference", "Contact", "Schedule date", "Lines", "Status", "Responsible"].map((label) => (
                    <th key={label} className="px-3 py-3 font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operations.data.items.map((operation: Operation) => (
                  <tr key={operation.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                    <td className="px-3 py-3 font-mono text-sm">
                      <Link className="font-medium text-primary hover:underline" href={`/operations/${kind}/${operation.id}`}>{operation.reference}</Link>
                    </td>
                    <td className="px-3 py-3 text-sm">{operation.partnerName ?? "—"}</td>
                    <td className="px-3 py-3 text-sm">{operation.scheduleDate ?? "—"}</td>
                    <td className="px-3 py-3 text-sm">{operation.lineCount ?? operation.lines?.length ?? "—"}</td>
                    <td className="px-3 py-3"><StatusBadge status={operation.status} /></td>
                    <td className="px-3 py-3 text-sm">{operation.createdByName ?? "—"}</td>
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
