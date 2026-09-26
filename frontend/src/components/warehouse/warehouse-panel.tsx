import type { ReactNode } from "react";
import { cn } from "cn";

interface WarehousePanelProps { children: ReactNode; className?: string; }

/** A shared elevated surface for the warehouse workspace. */
export function WarehousePanel({ children, className }: WarehousePanelProps) {
  return <section className={cn("rounded-xl border border-border bg-card shadow-m3-1", className)}>{children}</section>;
}
