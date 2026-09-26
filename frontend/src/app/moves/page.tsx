import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function MovesPage() {
  return (
    <RouteScaffold section="Move History" title="Move history" description="An immutable ledger of stock movements with source, destination, quantity, and operation reference.">
      <RoutePanel title="Stock ledger" description="Filter movements by reference, product, type, location, and date range.">
        <ScaffoldTable columns={["Reference", "Date", "Product", "From", "To", "Quantity", "Direction"]} rows={[
          ["WH/IN/0001", "2026-09-24", "Steel Rods", "Apex Metals", "Receiving Bay", "+100 kg", "Inbound"],
          ["WH/INT/0002", "2026-09-24", "Steel Rods", "Receiving Bay", "Production Rack", "40 kg", "Internal"],
          ["WH/OUT/0002", "2026-09-25", "Steel Rods", "Production Rack", "Northstar Offices", "−20 kg", "Outbound"],
          ["WH/ADJ/0004", "2026-09-25", "Steel Rods", "Production Rack", "—", "−3 kg", "Outbound"],
        ]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
