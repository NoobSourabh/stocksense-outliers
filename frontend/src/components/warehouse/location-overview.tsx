import { Building2 } from "lucide-react";
import { WarehousePanel } from "./warehouse-panel";

const metrics = [["Parent WH", "WH"], ["Sub-locations", "6 Zones"], ["Bay fill rate", "73.5%"], ["Barcoded bins", "124 Units"]];

export function LocationOverview() {
  return <WarehousePanel className="p-5 sm:p-6"><div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-start gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-foreground"><Building2 className="size-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">Location Details</h1><span className="rounded-md border border-success/25 bg-success-bg px-2 py-0.5 font-mono text-xs text-success">● Active Zone</span></div><p className="mt-1 text-sm text-muted-foreground">Physical floor compartment configuration, capacity rules, and sub-tier bay allocations.</p></div></div><dl className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="min-w-28 px-4 first:pl-0 last:pr-0"><dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-nowrap font-mono text-base font-semibold text-foreground">{value}</dd></div>)}</dl></div></WarehousePanel>;
}
