import { Suspense } from "react";
import { SkeletonDashboard } from "@/components/skeleton-page";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6"><SkeletonDashboard /></div>}>
      <DashboardClient />
    </Suspense>
  );
}
