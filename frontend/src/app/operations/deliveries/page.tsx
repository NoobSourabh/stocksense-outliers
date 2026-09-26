import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function DeliveriesPage() {
  return (
    <RouteScaffold section="Operations" title="Deliveries" description="Manage outgoing orders and see which deliveries are ready, waiting, or complete.">
      <RoutePanel title="Delivery operations" description="Search deliveries by reference or contact; waiting orders identify insufficient free-to-use stock.">
        <ScaffoldTable columns={["Reference", "Contact", "Schedule date", "Status"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
