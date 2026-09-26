import type { ReactNode } from "react";
import { WarehouseFooter } from "@/components/warehouse/warehouse-footer";
import { WarehouseHeader } from "@/components/warehouse/warehouse-header";
import { WarehousePanel } from "@/components/warehouse/warehouse-panel";

interface RouteScaffoldProps {
  section: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function RouteScaffold({ section, title, description, children }: RouteScaffoldProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <WarehouseHeader />
      <main className="mx-auto min-h-[calc(100vh-10rem)] max-w-[1520px] px-4 py-5 sm:px-6 lg:py-7">
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Workspace</span>
            <span className="text-border">/</span>
            <span>{section}</span>
          </p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </main>
      <WarehouseFooter />
    </div>
  );
}

interface RoutePanelProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function RoutePanel({ title, description, children }: RoutePanelProps) {
  return (
    <WarehousePanel className="p-5 sm:p-6">
      <div className="mb-5 border-b border-border pb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </WarehousePanel>
  );
}

export function ScaffoldTable({ columns, rows = [] }: { columns: string[]; rows?: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {columns.map((column) => <th key={column} className="px-3 py-3 font-medium">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={`${row[0] ?? "row"}-${rowIndex}`} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
              {columns.map((column, columnIndex) => {
                const value = row[columnIndex] ?? "—";
                const status = ["Done", "Ready", "Draft", "Waiting", "Active", "Internal", "Inbound", "Outbound", "Low stock", "Out of stock"].includes(value);
                const tone = value === "Done" || value === "Active" || value === "Inbound" || value === "Internal"
                  ? "text-success"
                  : value === "Waiting" || value === "Low stock"
                    ? "text-warning"
                    : value === "Out of stock" || value === "Outbound"
                      ? "text-destructive"
                      : "text-foreground";
                return (
                  <td key={column} className={`px-3 py-3 text-sm ${status ? `font-medium ${tone}` : "text-foreground"}`}>
                    {value}
                  </td>
                );
              })}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-muted-foreground">
                No sample records to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ScaffoldForm({ fields, values = [] }: { fields: string[]; values?: string[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field} className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide">{field}</span>
          <input
            defaultValue={values[fields.indexOf(field)] ?? ""}
            placeholder={field}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-primary-500/40 focus:ring-2"
          />
        </label>
      ))}
    </div>
  );
}

export function ScaffoldMetrics({ items }: { items: { label: string; value: string; detail: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value, detail }) => (
        <WarehousePanel key={label} className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </WarehousePanel>
      ))}
    </div>
  );
}
