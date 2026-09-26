"use client";

import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/stock-api";
import { RoutePanel, RouteScaffold } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: stockApi.me, retry: false });
  const user = session.data?.user;
  return <RouteScaffold section="Profile" title="My profile" description="Account information for the signed-in warehouse user.">
    <RoutePanel title="Account details" description="Identity and access role returned by the authentication service.">
      {session.isPending ? <p role="status" className="py-10 text-sm text-muted-foreground">Loading account…</p> : session.isError ? <div className="grid justify-items-center gap-3 py-10"><p className="text-sm text-destructive">Couldn’t load your profile.</p><Button variant="outline" onClick={() => void session.refetch()}>Retry</Button></div> : <dl className="grid gap-5 sm:grid-cols-2">{[["Name", user?.name], ["Login ID", user?.loginId], ["Email", user?.email], ["Role", user?.role], ["Account status", user?.isActive ? "Active" : "Inactive"]].map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value ?? "—"}</dd></div>)}</dl>}
    </RoutePanel>
  </RouteScaffold>;
}
