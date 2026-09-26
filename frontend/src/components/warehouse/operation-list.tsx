"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { stockApi, type Operation } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";

const CONFIG = {
  receipts: { type: "receipt", title: "Receipts", description: "Track incoming stock from suppliers through draft, ready, and done states." },
  deliveries: { type: "delivery", title: "Deliveries", description: "Manage outgoing orders and see which deliveries are ready, waiting, or complete." },
  adjustments: { type: "adjustment", title: "Inventory adjustments", description: "Reconcile counted quantities against recorded stock with an auditable reason." },
} as const;

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(fallback.getTime())
      ? value
      : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(fallback);
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function OperationList({ kind }: { kind: keyof typeof CONFIG }) {
  const config = CONFIG[kind];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const operations = useQuery({ queryKey: ["operations", config.type, search, status], queryFn: () => stockApi.operations({ type: config.type, search: search || undefined, status: status || undefined }) });
  return <RouteScaffold section="Operations" title={config.title} description={config.description}>
    <RoutePanel title={`${config.title} operations`} description="Search by reference or contact and review each operation's current state.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference or contact" aria-label="Search operations" className="h-10 pl-9" /></label>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All statuses</option>{["draft", "waiting", "ready", "done", "canceled"].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select>
        <Link href={`/operations/${kind}/new`}><Button><Plus /> New {kind === "adjustments" ? "adjustment" : kind.slice(0, -1)}</Button></Link>
      </div>
      {operations.isPending ? <p className="py-12 text-center text-sm text-muted-foreground" role="status">Loading {config.title.toLowerCase()}…</p>
        : operations.isError ? <div className="grid justify-items-center gap-3 py-12 text-center"><p className="text-sm text-destructive">Couldn’t load operations. Check your connection and try again.</p><Button variant="outline" onClick={() => void operations.refetch()}>Retry</Button></div>
          : operations.data.items.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No operations match these filters.</p>
            : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Reference", "Contact", "Schedule date & time", "Lines", "Status", "Responsible"].map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{operations.data.items.map((operation: Operation) => <tr key={operation.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50"><td className="px-3 py-3 font-mono text-sm"><Link className="font-medium text-primary hover:underline" href={`/operations/${kind}/${operation.id}`}>{operation.reference}</Link></td><td className="px-3 py-3 text-sm">{operation.partnerName ?? "—"}</td><td className="px-3 py-3 text-sm">{formatDateTime(operation.scheduleDate)}</td><td className="px-3 py-3 text-sm">{operation.lineCount ?? operation.lines?.length ?? "—"}</td><td className="px-3 py-3"><StatusBadge status={operation.status[0]?.toUpperCase() + operation.status.slice(1)} /></td><td className="px-3 py-3 text-sm">{operation.createdByName ?? "—"}</td></tr>)}</tbody></table></div>}
    </RoutePanel>
  </RouteScaffold>;
}
