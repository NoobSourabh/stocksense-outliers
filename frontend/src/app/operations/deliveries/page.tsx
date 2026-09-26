import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function DeliveriesPage() {
  return (
    <RouteScaffold section="Operations" title="Deliveries" description="Manage outgoing orders and see which deliveries are ready, waiting, or complete.">
      <RoutePanel title="Delivery operations" description="Search deliveries by reference or contact; waiting orders identify insufficient free-to-use stock.">
        <div className="mb-4 flex justify-end"><Link href="/operations/deliveries/new"><Button>New delivery</Button></Link></div>
        <ScaffoldTable columns={["Reference", "From", "To", "Contact", "Schedule date & time", "Status"]} rows={[
          ["WH/OUT/0002", "Production Rack", "Customer", "Northstar Offices", "2026-09-26 11:00", "Done"],
          ["WH/OUT/0003", "Rack A", "Customer", "Northstar Offices", "2026-09-25 15:45", "Waiting"],
          ["WH/OUT/0004", "Rack A", "Customer", "Northstar Offices", "2026-09-28 16:00", "Ready"],
        ]} />
        <div className="mt-3 flex flex-wrap gap-3 text-sm"><Link className="text-primary hover:underline" href="/operations/deliveries/WH-OUT-0003">Open WH/OUT/0003</Link><Link className="text-primary hover:underline" href="/operations/deliveries/WH-OUT-0004">Open WH/OUT/0004</Link></div>
      </RoutePanel>
    </RouteScaffold>
  );
}
