# SOUR-006/007/008 Frontend Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the frontend-only pieces of SOUR-006 (product initial stock), SOUR-007 (receipt draft editing), and SOUR-008 (delivery draft editing), acknowledging backend blockers.

**Architecture:** Extend the existing form components and API types so the UI sends the payloads the backend contract expects, while keeping the current create/detail flows intact. Draft editing reuses the same controls as creation and calls the existing `updateOperation` PATCH client.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, TanStack Query, existing `stock-api.ts` client, shared UI kit (`Button`, `Input`, `RoutePanel`, etc.).

---

## Task 1: SOUR-006 — Product initial stock field

**Files:**
- Modify: `frontend/src/lib/stock-api.ts:12`
- Modify: `frontend/src/app/products/new/page.tsx`

- [ ] **Step 1: Fix ProductInput type**

Change `initialStock?: string` to:

```typescript
export interface ProductInput {
  name: string;
  sku: string;
  categoryId: string;
  unit: string;
  unitCost: string;
  reorderPoint: string;
  initialStock?: { locationId: string; quantity: string };
}
```

- [ ] **Step 2: Add location + quantity fields to the new product form**

In `/products/new/page.tsx`:
- Query warehouses (`stockApi.warehouses(true)`) for a location dropdown.
- Add state: `const [initialStockLocationId, setInitialStockLocationId] = useState("");` and `const [initialStockQuantity, setInitialStockQuantity] = useState("");`.
- Build the payload in `create.mutationFn`:

```typescript
const initialStock = initialStockQuantity.trim()
  ? { locationId: initialStockLocationId, quantity: initialStockQuantity.trim() }
  : undefined;
stockApi.createProduct({ name: name.trim(), sku: sku.trim(), categoryId, unit: unit.trim(), unitCost, reorderPoint, initialStock });
```

- Render the fields after the existing grid, in a new section titled "Initial stock (optional)".
- Disable submit until a location is selected when a quantity is entered (or omit validation and let the server reject an empty location).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/stock-api.ts frontend/src/app/products/new/page.tsx
git commit -m "feat(products): collect optional initial stock location and quantity (SOUR-006)"
```

---

## Task 2: SOUR-007/008 — Draft operation detail editing

**Files:**
- Modify: `frontend/src/components/warehouse/operation-workspace.tsx`

- [ ] **Step 1: Add edit state and mutation helpers**

In `DetailOperationWorkspace`:
- Add `const [isEditing, setIsEditing] = useState(false);`.
- Add state for editable fields: `partnerId`, `locationId`, `scheduleDateTime`, `quantity`, `productId`.
- Initialize these from `operation.data` when entering edit mode.
- Add an `updateOperation` mutation that calls `stockApi.updateOperation(id, { ... })`.

- [ ] **Step 2: Build the PATCH payload**

For receipts:
```typescript
{
  type,
  partnerId: partnerId || null,
  destinationLocationId: locationId,
  scheduleDate: new Date(scheduleDateTime).toISOString(),
  lines: [{ productId, quantity }]
}
```

For deliveries:
```typescript
{
  type,
  partnerId: partnerId || null,
  sourceLocationId: locationId,
  scheduleDate: new Date(scheduleDateTime).toISOString(),
  lines: [{ productId, quantity }]
}
```

- [ ] **Step 3: Render edit controls when `isEditing`**

Replace the read-only `Details` and `Lines` panels with the same select/field controls used in `NewOperationWorkspace` (partner, location, schedule date, product, quantity).
- Use the same `Select` and `Field` helpers.
- Show the free-to-use warning for deliveries when quantity exceeds available stock.
- Disable save while mutation is pending or required fields are empty.

- [ ] **Step 4: Add Edit/Cancel actions**

Show an **Edit** button in the detail header when `status === "draft"`.
When editing, show **Save changes** and **Cancel** buttons.
- On save success: set `isEditing` false, invalidate queries, show success toast.
- On cancel: revert to read-only view.

- [ ] **Step 5: Keep schedule-only edit or replace it**

Decision: Replace the existing schedule-only edit block with the full draft edit mode. The full edit mode includes schedule date, so the dedicated schedule edit block is redundant. Remove `editingSchedule`, `detailSchedule`, and `updateScheduleMutation`.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/warehouse/operation-workspace.tsx
git commit -m "feat(operations): add draft edit mode for receipts and deliveries (SOUR-007/008)"
```

---

## Task 3: Verification and documentation

**Files:**
- Modify: `TASK_MANAGEMENT.md`

- [ ] **Step 1: Run lint/build**

Run:
```bash
cd frontend && npx tsc --noEmit && npm run build
```
Expected: TypeScript clean, build succeeds (or fails only on pre-existing issues).

- [ ] **Step 2: Update task tracker**

In `TASK_MANAGEMENT.md`, update SOUR-006/007/008 notes to:
- SOUR-006: "Frontend complete: initial stock fields collect location + quantity and send correct payload. Remaining: backend posts the adjustment/ledger row."
- SOUR-007/008: "Frontend complete: draft detail editing UI wired to PATCH /operations/{id}. Remaining: backend implements PATCH endpoint."

- [ ] **Step 3: Final commit**

```bash
git add TASK_MANAGEMENT.md
git commit -m "docs: update task tracker for SOUR-006/007/008 frontend completion"
```

---

## Notes / Risks

- `PATCH /operations/{id}` is not documented in `docs/API_CONTRACT.md` and may return 404/405 until Kunal implements it. The UI must surface the error via the existing `showErrorToast` path.
- `initialStock` is documented as `{ locationId, quantity }` but the backend currently only accepts the field without posting a ledger row. The frontend will now send the correct shape.
- The create/edit forms currently support a single line; this matches the existing `NewOperationWorkspace` behavior.
