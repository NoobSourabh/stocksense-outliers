import { RoutePanel, RouteScaffold, ScaffoldForm } from "@/components/warehouse/route-scaffold";

export default function ProductDetailPage() {
  return (
    <RouteScaffold section="Products" title="Product details" description="Review and edit product information, stock availability, and reorder settings.">
      <RoutePanel title="Product profile" description="A product record will load here when an item is selected.">
        <ScaffoldForm fields={["Product name", "SKU", "Category", "Unit of measure", "Cost per unit", "Reorder point"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
