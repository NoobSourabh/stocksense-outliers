# StockSense Responsive Regression Report (HAR-009)

**Date**: Saturday, September 26, 2026  
**Auditor**: Hardik (UI Kit + QA / Testing)  
**Viewports Tested**:
- **Mobile**: `390px × 844px` (iPhone 12/13/14/15/16 standard viewport)
- **Tablet**: `768px × 1024px` (iPad Portrait)
- **Desktop**: `1440px × 900px` (MacBook / Standard Desktop)

---

## 1. Executive Summary

| Category | Status | Notes |
| :--- | :---: | :--- |
| **P0 Navigation & Shell** | ✅ Pass | Shared `WarehouseHeader` includes mobile hamburger navigation, responsive logo text, and accessible theme toggle. |
| **Data Tables & Overflow** | ✅ Pass | All data tables across `/operations/*`, `/stock`, `/moves`, `/settings/*` are wrapped in `overflow-x-auto` with sticky / min-width guarantees. No layout breaking or viewport blowing on 390px. |
| **Forms & Creation Workspaces** | ✅ Pass | Dynamic grid layouts switch from single column (`sm:max-w-none`) on mobile to `sm:grid-cols-2 lg:grid-cols-3` on desktop. |
| **Touch Targets & Accessibility** | ✅ Pass | Form controls and action buttons maintain ≥ 40–44px minimum touch height with visible focus rings. |

---

## 2. Route-by-Route Verification Matrix

### 2.1 `/login` (Authentication)
- **390px (Mobile)**: Clean centered card layout with 16px horizontal margins. Input fields (`loginId`, `password`) fill 100% width. Action buttons use full width for one-thumb submission.
- **768px (Tablet)**: Card constrained to `max-w-md` centered vertically and horizontally.
- **1440px (Desktop)**: Focused card with subtle drop shadow and dark mode border contrast.

### 2.2 `/dashboard` (Executive KPI & Operations)
- **390px (Mobile)**: KPI metric cards stack in 1 column (`grid-cols-1`). Quick filter pills scroll horizontally. Table displays reference, status badge, and line counts.
- **768px (Tablet)**: KPI cards display in 2 columns (`grid-cols-2`). Operations table displays with comfortable padding.
- **1440px (Desktop)**: 4-column KPI grid with secondary trend indicators and dual-section split with quick-actions.

### 2.3 `/products` & `/products/[id]`
- **390px (Mobile)**: Search bar spans full width; product cards/rows show SKU in font-mono with direct link to details. Detail view stacks stock availability per location.
- **768px (Tablet)**: Two-column attributes and location cards.
- **1440px (Desktop)**: Full table view with SKU, category, on-hand, free-to-use, and location distribution breakdown.

### 2.4 `/operations/deliveries` & `/operations/deliveries/[id]`
- **390px (Mobile)**: Dual view switch (List vs. Kanban). Kanban cards stack cleanly; detail view groups Order Lines, Delivery Timeline, and Stock Availability check with responsive Action Bar floating at bottom or top.
- **768px (Tablet)**: 2-column Kanban boards with touch drag-scroll support.
- **1440px (Desktop)**: Full enterprise delivery cockpit: dual-panel order summary, live stock simulation, customer info, and line item fulfillment.

### 2.5 `/operations/receipts` & `/operations/receipts/[id]`
- **390px (Mobile)**: Header action buttons stack; search input expands full width; table horizontally scrollable with sticky status indicator.
- **768px (Tablet)**: Filter toolbar inline; 6-column tabular layout.
- **1440px (Desktop)**: Full receipts management cockpit with supplier links, expected delivery date, and warehouse bay tags.

### 2.6 `/operations/adjustments` & `/operations/adjustments/new`
- **390px (Mobile)**: Adjustment reason and physical count inputs occupy full mobile screen width. Counted quantity auto-calculates server delta.
- **768px (Tablet)**: 2-column input grid for product selection and location selector.
- **1440px (Desktop)**: Clean 3-column input configuration with live theoretical vs. counted delta preview.

### 2.7 `/stock` (Inventory Balances & Free-to-Use)
- **390px (Mobile)**: Horizontal scroll container prevents viewport overflow. Key quantities (On Hand, Free to Use) rendered in bold with legible units.
- **768px (Tablet)**: 7-column table with warehouse tags.
- **1440px (Desktop)**: Comprehensive inventory grid showing reorder points, low-stock indicators, and location codes.

### 2.8 `/moves` (Immutable Audit Ledger)
- **390px (Mobile)**: Search and operation type filter collapse to vertical stack. Ledger table scrolls smoothly horizontally; pagination controls align with touch buttons. Inbound (+) and Outbound (−) badges remain distinct.
- **768px (Tablet)**: Filters displayed inline; pagination aligned between summary text and navigation buttons.
- **1440px (Desktop)**: Full 8-column audit ledger with actor name, timestamp, and location trail.

### 2.9 `/settings/warehouses` & `/settings/locations`
- **390px (Mobile)**: Directory tables scroll with padded touch cells; active/inactive badge renders cleanly.
- **768px (Tablet)**: Tabular layout fills width with clear typography.
- **1440px (Desktop)**: Enterprise settings directory with location count indicators and quick links.

---

## 3. Regression Verdict

- **Total Routes Audited**: 12
- **Critical Responsive Defects**: 0
- **Minor Viewport Observations Addressed**:
  - Upgraded table containers to include `overflow-x-auto rounded-lg border border-border`.
  - Upgraded loading placeholders to responsive `SkeletonTable` and `SkeletonForm`.
  - Ensured empty states adapt to narrow containers with centered CTA buttons.

**Sign-off**: Verified for production demo.
