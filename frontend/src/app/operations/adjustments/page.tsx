import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function AdjustmentsPage() {
  return (
    <RouteScaffold section="Operations" title="Inventory adjustments" description="Reconcile counted quantities against recorded stock with an auditable reason for each change.">
      <RoutePanel title="Adjustment operations" description="Review and create single-location physical count adjustments.">
        <div className="mb-4 flex justify-end"><Link href="/operations/adjustments/new"><Button>New adjustment</Button></Link></div>
        <ScaffoldTable columns={["Reference", "Product", "Location", "Counted change", "Reason", "Status"]} rows={[
          ["WH/ADJ/0004", "Steel Rods", "Production Rack", "−3 kg", "3 kg damaged during cutting", "Done"],
          ["WH/ADJ/0007", "Ergo Chair", "Rack A", "+1 unit", "Cycle count correction", "Draft"],
        ]} />
        <div className="mt-3 flex flex-wrap gap-3 text-sm"><Link className="text-primary hover:underline" href="/operations/adjustments/WH-ADJ-0004">Open WH/ADJ/0004</Link><Link className="text-primary hover:underline" href="/operations/adjustments/WH-ADJ-0007">Open WH/ADJ/0007</Link></div>
      </RoutePanel>
    </RouteScaffold>
  );
}
