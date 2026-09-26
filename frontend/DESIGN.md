# Design System Specification (DESIGN.md)

Comprehensive design tokens, typography, spacing, elevation, and component specifications for the frontend design system.

---

## 1. Design Philosophy & Guidelines

- **Visual Style**: Clean, modern, high-contrast, data-dense interface (**Shadcn Base-Nova / Material Design 3** pattern).
- **Core Principle**: Clear visual hierarchy, generous readable type scale, comfortable scanning for data tables and cards, and seamless Light/Dark mode transitions.
- **Responsiveness**: Responsive grid system with automatic mobile transformations (e.g. data tables elegantly collapsing to structured mobile cards).

---

## 2. Color System & Design Tokens

The color system uses Tailwind CSS v4 `@theme` tokens and semantic CSS custom properties supporting both Light and Dark modes.

### 2.1 Brand Palette (Primary Blue)

| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--color-primary-50` | `#eff6ff` | Hover states, active navigation background, subtle badge tint |
| `--color-primary-100` | `#dbeafe` | Light chip background, container highlights |
| `--color-primary-200` | `#bfdbfe` | Decorative borders, light progress tracks |
| `--color-primary-300` | `#93c5fd` | Dark mode active accent foreground, secondary badges |
| `--color-primary-400` | `#60a5fa` | Dark mode focus ring, dark mode charts |
| `--color-primary-500` | `#3b82f6` | Light mode focus ring, interactive highlights |
| `--color-primary-600` | `#2563eb` | **Core Brand Primary** (Buttons, primary links, active indicators) |
| `--color-primary-700` | `#1d4ed8` | Active navigation text, button pressed/hover state |
| `--color-primary-800` | `#1e40af` | High-contrast accents |
| `--color-primary-900` | `#1e3a8a` | Container text on tinted light containers |

### 2.2 Semantic Surface & Container Tokens

| Token | Hex Value | Role |
| :--- | :--- | :--- |
| `--color-surface-container-lowest` | `#ffffff` | Elevated cards, modal dialogs |
| `--color-surface-container-low` | `#f8fafc` | Default page background |
| `--color-surface-container` | `#f1f5f9` | Table headers, secondary cards, section fills |
| `--color-surface-container-high` | `#e2e8f0` | Dividers, container borders |
| `--color-surface-container-highest` | `#cbd5e1` | Strong borders, inactive tracks |
| `--color-primary-container` | `#dbeafe` | Primary contextual callout container |
| `--color-on-primary-container` | `#1e3a8a` | Text inside primary contextual callout |
| `--color-secondary-container` | `#dae2fd` | Secondary pill/chip container |
| `--color-on-secondary-container` | `#1e293b` | Text inside secondary container |

### 2.3 Status & Feedback Colors

| State | Primary Hex | Background Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `#059669` (Emerald 600) | `#d1fae5` (Emerald 100) | Completed tasks, successful transactions, active status |
| **Warning** | `#d97706` (Amber 600) | `#fef3c7` (Amber 100) | Pending approval, alerts, warnings, draft states |
| **Info** | `#2563eb` (Blue 600) | `#dbeafe` (Blue 100) | Informational callouts, active indicators |
| **Destructive** | `#dc2626` (Red 600) | `#fee2e2` (Red 100) | Errors, overdue notices, destructive delete actions |

### 2.4 Semantic Theme Tokens (Light vs. Dark)

| Semantic Token | Light Mode (`:root`) | Dark Mode (`.dark`) | Description |
| :--- | :--- | :--- | :--- |
| `--background` | `#f8fafc` (Slate 50) | `#1e293b` (Slate 800) | Base viewport canvas |
| `--foreground` | `#0f172a` (Slate 900) | `#f1f5f9` (Slate 100) | Default body text |
| `--card` | `#ffffff` | `#0f172a` (Slate 900) | Surface containers, card panels |
| `--card-foreground` | `#0f172a` | `#f1f5f9` | Text inside cards |
| `--popover` | `#ffffff` | `#0f172a` | Dropdowns, tooltips, dialogs |
| `--popover-foreground` | `#0f172a` | `#f1f5f9` | Text in popovers |
| `--primary` | `#2563eb` | `#2563eb` | Core brand color |
| `--primary-foreground`| `#ffffff` | `#ffffff` | Text on brand buttons |
| `--secondary` | `#f1f5f9` | `#334155` | Secondary action fills |
| `--secondary-foreground`| `#0f172a` | `#f1f5f9` | Text on secondary actions |
| `--muted` | `#f8fafc` | `#1e293b` | Hover states, subtle rows |
| `--muted-foreground` | `#64748b` | `#94a3b8` | Subtitle, captions, helper text |
| `--accent` | `#eff6ff` | `rgba(30, 58, 138, 0.3)` | Selected menu row background |
| `--accent-foreground` | `#1d4ed8` | `#93c5fd` | Selected menu row text/icon |
| `--border` | `#e2e8f0` | `#334155` | Standard structural borders |
| `--input` | `#e2e8f0` | `#334155` | Form input borders |
| `--ring` | `#3b82f6` | `#60a5fa` | Accessibility focus ring |
| `--sidebar` | `#ffffff` | `#0f172a` | Navigation drawer background |
| `--sidebar-border` | `#e2e8f0` | `#334155` | Sidebar separation border |

---

## 3. Typography Scale & Hierarchy

The typography scale is intentionally enlarged (~120% standard) to improve readability for data grids, amounts, and dense layouts.

### 3.1 Font Families
- **Body & Headings (`--font-sans`, `--font-heading`)**: `Geist` (loaded via `next/font/google`), fallback: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Code & Numeric (`--font-mono`)**: `Geist Mono` (loaded via `next/font/google`), fallback: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`
- **Optimization**: Zero layout shift (CLS: 0), automated font subsetting, self-hosted via Next.js compiler.

### 3.2 Type Scale

| Utility | Rem Size | Pixel Equiv. | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | `0.9375rem` | `15px` | `1.25rem` (20px) | Badges, metadata tags, micro-labels |
| `text-sm` | `1.0625rem` | `17px` | `1.5rem` (24px) | Table cells, descriptions, form input values |
| `text-base` | `1.1875rem` | `19px` | `1.75rem` (28px) | **Default Body Text**, standard paragraphs |
| `text-lg` | `1.375rem` | `22px` | `1.875rem` (30px) | Section subheadings, card titles (large) |
| `text-xl` | `1.625rem` | `26px` | `2.125rem` (34px) | Card headers, modal titles |
| `text-2xl` | `2.000rem` | `32px` | `2.5rem` (40px) | Page headers, KPI metric values |
| `text-3xl` | `2.375rem` | `38px` | `2.875rem` (46px) | Hero secondary, section titles |
| `text-4xl` | `2.875rem` | `46px` | `3.375rem` (54px) | Large hero headings |
| `text-5xl` | `3.500rem` | `56px` | `4.0rem` (64px) | Large display numbers |
| `text-6xl` | `4.250rem` | `68px` | `1.0` | Impact display |

---

## 4. Spacing, Radii & Layout Tokens

### 4.1 Border Radii
- **Base Radius (`--radius`)**: `0.5rem` (8px)
- **Small (`--radius-sm`)**: `calc(var(--radius) * 0.6)` (~`4.8px`) — chips, inner tags
- **Medium (`--radius-md`)**: `calc(var(--radius) * 0.8)` (~`6.4px`) — buttons, inputs
- **Large (`--radius-lg`)**: `var(--radius)` (`8px`) — popovers, dropdown menus
- **Extra Large (`--radius-xl`)**: `calc(var(--radius) * 1.4)` (~`11.2px`) — cards, dialog containers
- **2XL (`--radius-2xl`)**: `calc(var(--radius) * 1.8)` (~`14.4px`) — modal window wrappers
- **3XL / 4XL**: `calc(var(--radius) * 2.2 / 2.6)` — display visual frames

### 4.2 Card Spacing Tokens
- Default card spacing: `--spacing(4)` (`1rem` / `16px`)
- Compact card spacing (`size="sm"`): `--spacing(3)` (`0.75rem` / `12px`)

---

## 5. Shadows & Elevation (Material Design 3 Scale)

| Elevation Level | CSS Shadow Value | Usage |
| :--- | :--- | :--- |
| **`--shadow-m3-1`** | `0 1px 3px 1px rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)` | Subtle resting cards, table container borders |
| **`--shadow-m3-2`** | `0 2px 6px 2px rgba(60,64,67,0.08), 0 1px 2px 0 rgba(60,64,67,0.12)` | Hovered cards, floating toolbars, dropdowns |
| **`--shadow-m3-3`** | `0 4px 12px 0 rgba(60,64,67,0.10), 0 1px 3px 0 rgba(60,64,67,0.12)` | Modal dialogs, major overlay sheets |

---

## 6. Predefined Component Usage

### 6.1 Cards (`src/components/ui/card.tsx`)
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ExampleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Subtext or supporting description.</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">Options</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Main card body text or embedded components.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  );
}
```

### 6.2 Data Tables (`src/components/data-table.tsx`)
```tsx
import { DataTable, type DataTableColumn } from "@/components/data-table";

interface User {
  id: string;
  name: string;
  role: string;
}

const columns: DataTableColumn<User>[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role", sortable: true },
];

export function UserList({ users }: { users: User[] }) {
  return (
    <DataTable
      columns={columns}
      data={users}
      searchPlaceholder="Search users..."
      pageSize={10}
      onRowClick={(row) => console.log(row)}
    />
  );
}
```

### 6.3 KPI Metrics (`src/components/kpi-card.tsx`)
```tsx
import { KpiCard } from "@/components/kpi-card";
import { TrendingUp } from "lucide-react";

export function Metric() {
  return (
    <KpiCard
      title="Active Sessions"
      value="2,410"
      subtitle="+8.4% vs last week"
      icon={TrendingUp}
    />
  );
}
```
