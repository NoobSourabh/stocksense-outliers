import { RoutePanel, RouteScaffold, ScaffoldTable } from "@/components/warehouse/route-scaffold";

export default function ProductsPage() {
  return (
    <RouteScaffold section="Products" title="Products" description="Search the product catalog and review cost, category, and stock availability by location.">
      <RoutePanel title="Product catalog" description="Search products by name or SKU and manage product records.">
        <ScaffoldTable columns={["Product", "SKU", "Category", "Unit cost", "On hand", "Free to use"]} />
      </RoutePanel>
    </RouteScaffold>
  );
}
