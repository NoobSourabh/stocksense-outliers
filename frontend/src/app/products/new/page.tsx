import { RoutePanel, RouteScaffold, ScaffoldForm } from "@/components/warehouse/route-scaffold";

export default function NewProductPage() {
  return (
    <RouteScaffold section="Products" title="New product" description="Create a catalog item with its SKU, unit, category, cost, and reorder point.">
      <RoutePanel title="Product details" description="Product data and stock settings will be managed here.">
        <ScaffoldForm fields={["Product name", "SKU", "Category", "Unit of measure", "Cost per unit", "Reorder point"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
