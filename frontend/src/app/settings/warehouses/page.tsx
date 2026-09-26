import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function WarehousesPage() {
  return (
    <RouteScaffold section="Settings" title="Warehouses" description="Configure warehouse identity and address details, then manage the locations held within each warehouse.">
      <RoutePanel title="Warehouse directory" description="Warehouse codes are unique and each warehouse can contain multiple locations.">
        <ScaffoldTable columns={["Name", "Short code", "Address", "Locations", "Actions"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
