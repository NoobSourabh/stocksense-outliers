"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showCreateSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { SkeletonTable } from "@/components/skeleton-table";
import { EmptyState } from "@/components/empty-state";

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const warehouses = useQuery({ queryKey: ["warehouses", true], queryFn: () => stockApi.warehouses(true) });
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const create = useMutation({
    mutationFn: () => stockApi.createWarehouse({ code: code.trim(), name: name.trim(), address: address.trim() || null }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
        queryClient.invalidateQueries({ queryKey: ["locations"] }),
      ]);
      setCode("");
      setName("");
      setAddress("");
      showCreateSuccessToast("Warehouse");
    },
    onError: (error) => showErrorToast(error, "Could not create warehouse"),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate();
  }

  function resetForm() {
    setName("");
    setCode("");
    setAddress("");
  }

  return <RouteScaffold section="Settings" title="Warehouse" description="Warehouse details and associated locations." hideHeading>
    <form onSubmit={submit}>
      <RoutePanel title="Warehouse" description="Manage warehouse details and the locations held within it.">
        <div className="grid max-w-xl gap-4">
          <label className="grid gap-1.5 text-sm font-medium">Name<Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} pattern=".*\\S.*" title="Enter a name with at least one non-space character." className="h-10 bg-background text-sm font-normal" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Short Code<Input value={code} onChange={(event) => setCode(event.target.value)} required maxLength={50} pattern=".*\\S.*" title="Enter a code with at least one non-space character." className="h-10 bg-background text-sm font-normal" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Address<Input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={500} className="h-10 bg-background text-sm font-normal" /></label>
        </div>
        <div className="mt-5 flex gap-2"><Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Save"}</Button><Button type="button" variant="outline" onClick={resetForm} disabled={create.isPending}>Cancel</Button></div>
      </RoutePanel>
    </form>
    <div className="mt-5"><RoutePanel title="Warehouses and locations" description="Each row shows the warehouse address and its configured location count.">
      {warehouses.isPending ? <div className="py-2"><SkeletonTable columns={5} rows={6} showSearch={false} showPagination={false} /></div> : warehouses.isError ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-destructive">Couldn’t load warehouses.</p><Button variant="outline" onClick={() => void warehouses.refetch()}>Retry</Button></div> : warehouses.data.items.length === 0 ? <EmptyState title="No warehouses configured" description="Create a warehouse above to begin setting up stock locations." /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{["Name", "Short code", "Address", "Locations", "Status"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{warehouses.data.items.map((warehouse) => <tr key={warehouse.id} className="border-b border-border/70 last:border-0"><td className="px-3 py-3 text-sm font-medium">{warehouse.name}</td><td className="px-3 py-3 font-mono text-sm">{warehouse.code}</td><td className="px-3 py-3 text-sm">{warehouse.address ?? "—"}</td><td className="px-3 py-3 text-sm">{warehouse.locations?.length ?? 0}</td><td className="px-3 py-3 text-sm">{warehouse.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>}
    </RoutePanel></div>
  </RouteScaffold>;
}
