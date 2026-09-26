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
