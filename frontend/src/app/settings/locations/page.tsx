import Link from "next/link";
import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function LocationsPage() {
  return (
    <RouteScaffold section="Settings" title="Locations" description="Manage rooms, racks, and shelves and link each location to its parent warehouse.">
      <RoutePanel title="Location directory" description="Review location names, short codes, parent warehouses, and status.">
        <ScaffoldTable columns={["Name", "Short code", "Warehouse", "Type", "Status", "Actions"]} rows={[
          ["Receiving Bay", "RB", "Main Warehouse (WH)", "Internal", "Active", "Edit"],
          ["Rack A", "RA", "Main Warehouse (WH)", "Internal", "Active", "Edit"],
          ["Production Rack", "PR", "Main Warehouse (WH)", "Internal", "Active", "Edit"],
          ["Rack B", "RB", "Secondary Warehouse (SW)", "Internal", "Active", "Edit"],
        ]} />
        <div className="mt-3 flex flex-wrap gap-3 text-sm"><Link className="text-primary hover:underline" href="/settings/locations/receiving-bay">Open Receiving Bay</Link><Link className="text-primary hover:underline" href="/settings/locations/rack-a">Open Rack A</Link></div>
      </RoutePanel>
    </RouteScaffold>
  );
}
