import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function AdjustmentsPage() {
  return (
    <RouteScaffold section="Operations" title="Inventory adjustments" description="Reconcile counted quantities against recorded stock with an auditable reason for each change.">
      <RoutePanel title="Adjustment operations" description="Review and create single-location physical count adjustments.">
        <ScaffoldTable columns={["Reference", "Location", "Created by", "Date", "Status"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
