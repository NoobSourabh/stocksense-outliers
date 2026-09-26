# StockSense Shared UI Kit & Component Library

Welcome to the StockSense UI kit. This design system provides high-performance, accessible, and theme-aware primitives built on top of **Tailwind CSS v4**, **Base UI**, and **Lucide React**.

---

## Table of Contents

- [Primitives (`@/components/ui/*`)](#primitives-componentsui)
  - [Button](#button)
  - [Input](#input)
  - [Badge](#badge)
  - [Card](#card)
  - [Label](#label)
  - [Separator](#separator)
  - [Skeleton](#skeleton)
  - [TablePagination](#tablepagination)
  - [Tooltip](#tooltip)
- [Shared Composite Components (`@/components/*`)](#shared-composite-components-components)
  - [DataTable](#datatable)
  - [KpiCard](#kpicard)
  - [StatusBadge](#statusbadge)
  - [EmptyState](#emptystate)
  - [LoadingSpinner](#loadingspinner)
  - [SkeletonTable / SkeletonForm / SkeletonKpiCard](#skeleton-variants)
- [Design Tokens & Theming](#design-tokens--theming)

---

## Primitives (`@/components/ui/*`)

### Button

Base UI wrapper with full variant and size support, ring focus states, and icon alignment.

```tsx
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight, Trash2 } from "lucide-react"

// Variants: default | outline | secondary | ghost | destructive | link
// Sizes: xs | sm | default | lg | icon | icon-xs | icon-sm | icon-lg

<Button variant="default" size="default">
  <Plus className="size-4" />
  New Operation
</Button>

<Button variant="outline" size="sm">
  Cancel
</Button>

<Button variant="destructive" size="sm">
  <Trash2 className="size-4" />
  Delete
</Button>

<Button variant="ghost" size="icon" aria-label="Next page">
  <ArrowRight className="size-4" />
</Button>
```

---

### Input

Accessible text input supporting native validation states, placeholder styling, and focus rings.

```tsx
import { Input } from "@/components/ui/input"

<Input
  type="text"
  placeholder="Search SKU or name..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="h-10 pl-9"
/>

<Input
  type="number"
  min="0"
  step="1"
  placeholder="0"
  aria-invalid={hasError}
/>
```

---

### Badge

Compact pill tag for states, categories, and inventory metrics.

```tsx
import { Badge } from "@/components/ui/badge"

// Variants: default | secondary | destructive | outline | ghost | link

<Badge variant="default">Verified</Badge>
<Badge variant="secondary">Supplier</Badge>
<Badge variant="destructive">Out of Stock</Badge>
<Badge variant="outline">SKU-4910</Badge>
```

---

### Card

Structured surface container with composable slots.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

<Card size="default">
  <CardHeader>
    <CardTitle>Warehouse Storage Capacity</CardTitle>
    <CardDescription>Zone A - Ambient Racks</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold font-mono">84.2%</p>
    <p className="text-xs text-muted-foreground mt-1">1,420 of 1,680 bins occupied</p>
  </CardContent>
  <CardFooter className="flex justify-end gap-2 border-t pt-3">
    <Button variant="outline" size="sm">Inspect Zone</Button>
  </CardFooter>
</Card>
```

---

### Label

Accessible form label styled with muted text and subtle contrast.

```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<div className="space-y-1.5">
  <Label htmlFor="sku-input">Product SKU</Label>
  <Input id="sku-input" placeholder="e.g. ELEC-001" />
</div>
```

---

### Separator

Semantic hairline divider supporting horizontal or vertical orientation.

```tsx
import { Separator } from "@/components/ui/separator"

<div className="flex items-center gap-4">
  <span>Warehouse WH-MAIN</span>
  <Separator orientation="vertical" className="h-4" />
  <span>Zone B</span>
</div>

<Separator className="my-6" />
```

---

### Skeleton

Pulsing placeholder primitive with tailored convenience variants (`SkeletonText`, `SkeletonButton`, `SkeletonAvatar`).

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonButton,
  SkeletonAvatar
} from "@/components/ui/skeleton"

// Generic rectangular placeholder
<Skeleton className="h-10 w-full rounded-md" />

// Multi-line simulated text
<SkeletonText lines={3} />

// Button or pill placeholder
<SkeletonButton width={120} />
<SkeletonAvatar size={40} />
```

---

### TablePagination

Pagination controls designed for data tables with item counts, page jumping, and per-page limits.

```tsx
import { TablePagination } from "@/components/ui/table-pagination"

<TablePagination
  page={currentPage}
  pageSize={pageSize}
  totalItems={totalItems}
  onPageChange={(newPage) => setCurrentPage(newPage)}
  onPageSizeChange={(newSize) => setPageSize(newSize)}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

---

### Tooltip

Accessible hover and focus tooltips using Base UI Tooltip primitives.

```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

<Tooltip>
  <TooltipTrigger render={<Button variant="ghost" size="icon" />}>
    <HelpCircle className="size-4" />
  </TooltipTrigger>
  <TooltipContent>
    Free-to-use = On-hand minus quantities reserved by pending outgoing shipments.
  </TooltipContent>
</Tooltip>
```

---

## Shared Composite Components (`@/components/*`)

### DataTable

Generic table component with sorting, multi-column search, pagination, and empty/loading states.

```tsx
import { DataTable } from "@/components/data-table"
import type { Column } from "@/components/data-table"

interface StockRecord {
  id: string
  sku: string
  name: string
  onHand: number
}

const columns: Column<StockRecord>[] = [
  { key: "sku", header: "SKU", className: "font-mono" },
  { key: "name", header: "Product Name" },
  { key: "onHand", header: "On Hand", render: (row) => row.onHand.toLocaleString() },
]

<DataTable
  data={records}
  columns={columns}
  keyExtractor={(r) => r.id}
  searchPlaceholder="Search products..."
  searchColumn="name"
/>
```

---

### KpiCard

Displays metrics, trends, and change percentages with iconography.

```tsx
import { KpiCard } from "@/components/kpi-card"
import { Package, TrendingUp, AlertTriangle } from "lucide-react"

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <KpiCard
    title="Total Active SKUs"
    value="1,428"
    icon={<Package className="size-5 text-primary" />}
    change={{ value: "+12% this month", trend: "up" }}
  />
  <KpiCard
    title="Low Stock Alerts"
    value="14"
    icon={<AlertTriangle className="size-5 text-amber-500" />}
    change={{ value: "4 critical", trend: "down" }}
  />
</div>
```

---

### StatusBadge

Consistent badge color-mapping for warehouse inventory states: `draft`, `waiting`, `ready`, `done`, `canceled`, `in`, `out`.

```tsx
import { StatusBadge } from "@/components/status-badge"

<StatusBadge status="Draft" />
<StatusBadge status="Waiting" />
<StatusBadge status="Ready" />
<StatusBadge status="Done" />
<StatusBadge status="Canceled" />
```

---

### EmptyState

Clean, consistent empty placeholder when query results return empty.

```tsx
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

<EmptyState
  title="No operations found"
  description="No receipts match your search filters or status criteria."
  action={
    <Link href="/operations/receipts/new">
      <Button size="sm">
        <Plus className="size-4" />
        Create First Receipt
      </Button>
    </Link>
  }
/>
```

---

### LoadingSpinner

Centered or inline indicator for active asynchronous operations.

```tsx
import { LoadingSpinner } from "@/components/loading-spinner"

<LoadingSpinner message="Reconciling ledger entries..." />
```

---

### Skeleton Variants

Tailored loading placeholders matching specific screen structures:

- `<SkeletonTable columns={5} rows={6} />`
- `<SkeletonForm />`
- `<SkeletonKpiCard />`
- `<SkeletonPage />`

```tsx
import { SkeletonTable } from "@/components/skeleton-table"
import { SkeletonForm } from "@/components/skeleton-form"

if (query.isPending) {
  return <SkeletonTable columns={6} rows={8} />
}
```

---

## Design Tokens & Theming

- **Theme Provider**: Supports dynamic `dark`, `light`, and `system` modes via `next-themes` (`@/components/theme-provider`).
- **Color Palettes**: Uses OKLCH CSS variables for tokens (`--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`).
- **Responsive Breakpoints**:
  - `sm`: `640px` (Tablets / large phones)
  - `md`: `768px` (Tablets landscape)
  - `lg`: `1024px` (Desktops / Laptops)
  - `xl`: `1280px` (Wide desktops)
- **Interactive Rules**: All interactive elements meet 44px min tap targets on touch displays or provide clear keyboard focus rings (`focus-visible:ring-ring`).
