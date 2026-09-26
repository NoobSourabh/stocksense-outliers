import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function MovesPage() {
  return (
    <RouteScaffold section="Move History" title="Move history" description="An immutable ledger of stock movements with source, destination, quantity, and operation reference.">
      <RoutePanel title="Stock ledger" description="Filter movements by reference, product, type, location, and date range.">
        <ScaffoldTable columns={["Reference", "Date", "Product", "From", "To", "Quantity", "Direction"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
