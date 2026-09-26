import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function ReceiptsPage() {
  return (
    <RouteScaffold section="Operations" title="Receipts" description="Track incoming stock from suppliers through draft, ready, and done states.">
      <RoutePanel title="Receipt operations" description="Search receipts by reference or contact; switch between list and status board views.">
        <ScaffoldTable columns={["Reference", "Contact", "Schedule date", "Status"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
