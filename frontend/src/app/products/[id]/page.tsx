import { RoutePanel, RouteScaffold, ScaffoldForm } from "@/components/warehouse/route-scaffold";

export default function ProductDetailPage() {
  return (
    <RouteScaffold section="Products" title="Product details" description="Review and edit product information, stock availability, and reorder settings.">
      <RoutePanel title="Product profile" description="Demo record · Steel Rods">
        <ScaffoldForm fields={["Product name", "SKU", "Category", "Unit of measure", "Cost per unit", "Reorder point"]} values={["Steel Rods", "STL-ROD-10", "Raw Materials", "kg", "₹450", "25 kg"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
