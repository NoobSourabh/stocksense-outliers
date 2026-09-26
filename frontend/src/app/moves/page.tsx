"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;
export default function MovesPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const moves = useQuery({ queryKey: ["moves", search, type], queryFn: () => stockApi.moves({ search: search || undefined, type: type || undefined }) });
  const rows = useMemo(() => moves.data?.items ?? [], [moves.data]);
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  return <RouteScaffold section="Move History" title="Move history" description="An immutable ledger of stock movements recorded by validated operations.">
    <RoutePanel title="Stock ledger" description="Inbound quantities are green; outbound quantities are red. Each row represents one product line.">
      <div className="mb-4 flex flex-wrap gap-3"><label className="relative min-w-0 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search reference, SKU, or product" aria-label="Search ledger" className="h-10 pl-9" /></label><select aria-label="Filter by operation type" value={type} onChange={(event) => { setType(event.target.value); setPage(0); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All types</option>{["receipt", "delivery", "transfer", "adjustment"].map((kind) => <option key={kind} value={kind}>{kind[0].toUpperCase() + kind.slice(1)}</option>)}</select></div>
      {moves.isPending ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading stock movements…</p>
        : moves.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load the stock ledger.</p><Button variant="outline" onClick={() => void moves.refetch()}>Retry</Button></div>
          : rows.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No ledger entries match these filters.</p>
            : <><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Reference", "Date", "Product", "From", "To", "Quantity", "Direction", "Actor"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{visible.map((move) => { const delta = Number(move.signedDelta); const direction = delta > 0 ? "Inbound" : delta < 0 ? "Outbound" : "Internal"; return <tr key={move.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-3 font-mono text-sm">{move.reference}</td><td className="px-3 py-3 text-sm">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(move.occurredAt))}</td><td className="px-3 py-3 text-sm"><span className="font-medium">{move.productName}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{move.productSku}</span></td><td className="px-3 py-3 text-sm">{move.fromLocationName ?? "Supplier / opening"}</td><td className="px-3 py-3 text-sm">{move.toLocationName ?? "Customer / external"}</td><td className={`px-3 py-3 font-mono text-sm font-medium ${direction === "Inbound" ? "text-success" : direction === "Outbound" ? "text-destructive" : "text-foreground"}`}>{delta > 0 ? "+" : delta < 0 ? "−" : "±"}{move.quantity}</td><td className={`px-3 py-3 text-sm font-medium ${direction === "Inbound" ? "text-success" : direction === "Outbound" ? "text-destructive" : "text-muted-foreground"}`}>{direction}</td><td className="px-3 py-3 text-sm">{move.actorName}</td></tr>; })}</tbody></table></div><div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">Page {page + 1} of {pages} · {rows.length} movements loaded</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div></>}
    </RoutePanel>
  </RouteScaffold>;
}
