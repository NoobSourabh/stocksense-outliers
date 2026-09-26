import Link from "next/link";
import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";
import { Button } from "@/components/ui/button";

export default function StockPage() {
  return (
    <RouteScaffold section="Inventory" title="Stock on hand" description="Review physical and available quantities by product. Free to use reflects open delivery reservations.">
      <RoutePanel title="Current stock" description="Sample inventory while the stock balance API is being connected.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Availability is shown per product in the demo warehouse.</p>
          <Link href="/products"><Button variant="outline" size="sm">Open product catalog</Button></Link>
        </div>
        <ScaffoldTable columns={["Product", "SKU", "Location", "On hand", "Free to use", "Reorder point"]} rows={[
          ["Steel Rods", "STL-ROD-10", "Receiving Bay", "137 kg", "137 kg", "25 kg"],
          ["Ergo Chair", "CHR-ERGO-01", "Rack A", "7 units", "2 units", "10 units"],
          ["M8 Bolt Pack", "BOLT-M8-100", "Production Rack", "0 packs", "0 packs", "20 packs"],
          ["Frame Assembly", "FRAME-A2", "Rack B", "34 units", "34 units", "12 units"],
        ]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
