import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function LocationsPage() {
  return (
    <RouteScaffold section="Settings" title="Locations" description="Manage rooms, racks, and shelves and link each location to its parent warehouse.">
      <RoutePanel title="Location directory" description="Review location names, short codes, parent warehouses, and status.">
        <ScaffoldTable columns={["Name", "Short code", "Warehouse", "Type", "Status", "Actions"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
