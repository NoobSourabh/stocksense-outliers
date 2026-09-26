"use client";

import { useState } from "react";
import { LocationHierarchy } from "@/components/warehouse/location-hierarchy";
import { LocationOverview } from "@/components/warehouse/location-overview";
import { LocationProfile } from "@/components/warehouse/location-profile";
import { LocationSidebar, WarehouseMetrics } from "@/components/warehouse/location-sidebar";
import { WarehouseFooter } from "@/components/warehouse/warehouse-footer";
import { WarehouseHeader } from "@/components/warehouse/warehouse-header";

export default function WarehouseLocationPage() {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <WarehouseHeader onSave={() => setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))} />
      <main className="mx-auto max-w-[1520px] px-4 py-5 sm:px-6 lg:py-7">
        {savedAt && <div role="status" className="mb-4 flex items-center justify-between rounded-lg border border-success/20 bg-success-bg px-4 py-3 text-sm text-success"><span>Location changes saved successfully.</span><span className="font-mono text-xs">Saved {savedAt}</span></div>}
        <LocationOverview />
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8"><LocationProfile /><LocationHierarchy /></div>
          <aside className="space-y-6 lg:col-span-4"><LocationSidebar /></aside>
        </div>
        <WarehouseMetrics />
      </main>
      <WarehouseFooter />
    </div>
  );
}
