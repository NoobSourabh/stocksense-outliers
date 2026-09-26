import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function ReceiptsPage() {
  return (
    <RouteScaffold section="Operations" title="Receipts" description="Track incoming stock from suppliers through draft, ready, and done states.">
      <RoutePanel title="Receipt operations" description="Search receipts by reference or contact; switch between list and status board views.">
        <div className="mb-4 flex justify-end"><Link href="/operations/receipts/new"><Button>New receipt</Button></Link></div>
        <ScaffoldTable columns={["Reference", "From", "To", "Contact", "Schedule date & time", "Status"]} rows={[
          ["WH/IN/0001", "Vendor", "Receiving Bay", "Apex Metals", "2026-09-26 10:00", "Done"],
          ["WH/IN/0005", "Vendor", "Rack A", "Apex Metals", "2026-09-27 14:30", "Ready"],
          ["WH/IN/0006", "Vendor", "Receiving Bay", "Northstar Offices", "2026-09-25 09:15", "Draft"],
        ]} />
        <div className="mt-3 flex flex-wrap gap-3 text-sm"><Link className="text-primary hover:underline" href="/operations/receipts/WH-IN-0001">Open WH/IN/0001</Link><Link className="text-primary hover:underline" href="/operations/receipts/WH-IN-0005">Open WH/IN/0005</Link></div>
      </RoutePanel>
    </RouteScaffold>
  );
}
