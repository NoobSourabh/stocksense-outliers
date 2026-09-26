"use client";

import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WarehousePanel } from "./warehouse-panel";

type StorageRow = { name: string; detail: string; ref: string; type: string; capacity: string; occupancy: number };
const initialRows: StorageRow[] = [
  { name: "Room A / Pallet Bay 01", detail: "Aisle A1 • Level 1–4", ref: "WH/STK1/BAY-01", type: "Pallet Racks", capacity: "120 Pallets", occupancy: 85 },
  { name: "Room A / Pallet Bay 02", detail: "Aisle A2 • Level 1–4", ref: "WH/STK1/BAY-02", type: "Pallet Racks", capacity: "120 Pallets", occupancy: 40 },
  { name: "Room B / Component Bin R01-S01", detail: "Small Parts Drawers 01–18", ref: "WH/STK1/BIN-R01", type: "Small Bin", capacity: "450 Units", occupancy: 22 },
  { name: "Climate Sub-Cell C-04", detail: "Regulated 18°C • Moisture Monitored", ref: "WH/STK1/CLM-04", type: "Climate Room", capacity: "60 Pallets", occupancy: 94 },
];

function Occupancy({ value }: { value: number }) {
  const color = value >= 90 ? "bg-destructive" : value >= 70 ? "bg-warning" : "bg-success";
  return <div className="flex min-w-32 items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div><span className={`font-mono text-xs ${value >= 90 ? "text-destructive" : "text-muted-foreground"}`}>{value}%</span></div>;
}

export function LocationHierarchy() {
  const [rows, setRows] = useState(initialRows);
  const addRow = () => setRows((current) => [...current, { name: "New storage bay", detail: "Configure aisle and level", ref: "WH/STK1/NEW-01", type: "Staging", capacity: "0 Units", occupancy: 0 }]);
  return <WarehousePanel className="p-5 sm:p-6"><div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">Hierarchy: Sub-Locations &amp; Storage Bins</h2><span className="rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">Wireframe Note</span></div><p className="mt-1 max-w-xl text-sm text-muted-foreground">“This holds the multiple locations of warehouse, rooms etc..” Configured sub-sectors inside WH/Stock1.</p></div><Button type="button" variant="secondary" size="sm" onClick={addRow}><Plus /> Add Sub-Location</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead><tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><th className="px-3 py-3 font-medium">Sub-location / room</th><th className="px-3 py-3 font-medium">Short ref</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium">Capacity</th><th className="px-3 py-3 font-medium">Occupancy</th><th className="px-3 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.ref}-${index}`} className="group border-b border-border/70 last:border-0 hover:bg-muted/60"><td className="px-3 py-3"><p className="text-sm font-medium">{row.name}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{row.detail}</p></td><td className="px-3 py-3 font-mono text-xs">{row.ref}</td><td className="px-3 py-3"><span className="rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{row.type}</span></td><td className="px-3 py-3 font-mono text-xs">{row.capacity}</td><td className="px-3 py-3"><Occupancy value={row.occupancy} /></td><td className="px-3 py-3"><div className="flex justify-end gap-1"><button className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Edit ${row.name}`}><Pencil className="size-3.5" /></button><button onClick={() => setRows((current) => current.filter((_, i) => i !== index))} className="rounded p-1 text-muted-foreground hover:bg-destructive-bg hover:text-destructive" aria-label={`Remove ${row.name}`}><Trash2 className="size-3.5" /></button></div></td></tr>)}</tbody></table></div><div className="mt-3 flex flex-col gap-2 border-t border-border pt-4 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Showing {rows.length} of 6 active sub-locations mapped under WH/Stock1</span><button className="flex items-center gap-0.5 font-sans font-medium text-primary hover:text-primary-700">Expand all bins <ChevronRight className="size-3.5" /></button></div></WarehousePanel>;
}
