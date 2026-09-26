# StockSense Demo & Bug-Bash Test Script (HAR-011)

**Target Demo Path**:  
$$\text{Login} \longrightarrow \text{Dashboard} \longrightarrow \text{Receipt (IN)} \longrightarrow \text{Transfer (INT)} \longrightarrow \text{Delivery (OUT)} \longrightarrow \text{Adjustment (ADJ)} \longrightarrow \text{Ledger / Moves}$$

**Target Duration**: 3 – 4 minutes  
**Presenter Persona**: Maya (Warehouse Operations Manager)  
**Demo Credentials**:
- **Login ID**: `maya`
- **Password**: `StaffPass123!` (or seeded demo credentials)
- **Role**: Warehouse Manager (full read/write permissions)

---

## Stage 1: Authentication & Access Control

1. **Navigate to**: `http://localhost:3000/`
   - *Expected Behavior*: Automatic 307 redirect to `/login` due to auth session guard.
2. **Action**:

    Login ID: mayasharma
 Password: StockSense@123
   - Click **Sign In**.
3. **Verification**:
   - Authentication cookie (`stock_session`) is set as `HttpOnly; SameSite=Lax`.
   - Browser smoothly redirects to `/dashboard`.
   - Header shows logged-in user with role badge `Manager` and warehouse identity.

---

## Stage 2: Dashboard & Real-Time Operational Overview

1. **Review KPIs**:
   - Verify 4 primary KPI cards:
     - **Incoming Receipts** (e.g., `2 Scheduled / 1 Ready`)
     - **Outgoing Deliveries** (e.g., `1 Waiting / 1 Ready`)
     - **Total SKUs Tracked**
     - **Low Stock / Reorder Warnings**
2. **Review Recent Operations**:
   - Click status quick-filter pills (`All`, `Ready`, `Waiting`, `Done`).
   - Notice instant URL search-param sync and filtered operation rows.
3. **Talking Point**:
   > *"StockSense gives operators a real-time pulse of their warehouse floor, distinguishing between what is physically on hand versus what is free to commit."*

---

## Stage 3: Inbound Stock Receipt (`WH/IN`)

1. **Navigate to**: `/operations/receipts`
2. **Action**:
   - Click **New Receipt** (or navigate to `/operations/receipts/new`).
   - Select Supplier: `Apex Industrial Supply`.
   - Destination Location: `Rack A - Main Warehouse` (or internal rack).
   - Select Product: `Steel Rods (STL-ROD-10)`.
   - Set Quantity: `50` units.
   - Click **Create Receipt**.
3. **State Transition**:
   - Server assigns unique reference sequence: `WH/IN/0002` (or next sequence).
   - Initial state: `Draft`.
   - Click **Mark as Ready** $\to$ status transitions to `Ready`.
   - Click **Validate** $\to$ status transitions to `Done`.
4. **Verification**:
   - Toast notification confirms validation.
   - Balance in `Rack A - Main Warehouse` increments by `+50` units.

---

## Stage 4: Internal Warehouse Transfer (`WH/INT`)

1. **Navigate to**: `/operations/transfers` or operations workspace.
2. **Action**:
   - Move `20` units of `STL-ROD-10` from `Rack A - Main Warehouse` to `Rack B - Secondary Warehouse` (Pick Zone).
   - Specify Source Location: `Rack A - Main Warehouse`.
   - Destination Location: `Rack B - Secondary Warehouse`.
   - Click **Validate**.
3. **Verification**:
   - Sequence generated: `WH/INT/0001`.
   - Total company on-hand balance remains unchanged (net delta 0).
   - Bin `Rack A - Main Warehouse` decreases by `20`; Bin `Rack B - Secondary Warehouse` increases by `20`.

---

## Stage 5: Outbound Customer Delivery (`WH/OUT`)

1. **Navigate to**: `/operations/deliveries`
2. **Action**:
   - Click **New Delivery** (or select pending order `WH/OUT/0002`).
   - Destination Customer: `Northstar Offices`.
   - Source Location: `Rack B - Secondary Warehouse`.
   - Product: `STL-ROD-10`.
   - Set Quantity: `15` units.
3. **Free-to-Use & Reservation Demonstration**:
   - Note the **Free-to-Use** calculation:
     $$\text{Free-to-Use} = \text{On-Hand (20)} - \text{Open Reservations (0)} = 20$$
   - Change quantity to `30` units $\to$ Banner alerts: *"Quantity exceeds free-to-use stock (20 units available). Order will enter Waiting state."*
   - Set quantity back to `15` units $\to$ Warning clears.
4. **Validation**:
   - Click **Mark as Ready** $\to$ transitions to `Ready`.
   - Click **Validate** $\to$ transitions to `Done`.
   - Stock in `Rack B - Secondary Warehouse` is decremented to `5` units.

---

## Stage 6: Physical Inventory Count & Adjustment (`WH/ADJ`)

1. **Navigate to**: `/operations/adjustments`
2. **Scenario**:
   - Floor worker conducts a physical cycle count in `Rack B - Secondary Warehouse` and finds `4` steel rods instead of recorded `5` (1 damaged/lost).
3. **Action**:
   - Click **New Adjustment** (`/operations/adjustments/new`).
   - Location: `Rack B - Secondary Warehouse`.
   - Product: `STL-ROD-10`.
   - Counted Quantity: `4`.
   - Reason: `Annual cycle count — 1 unit damaged in bin`.
   - Click **Create Adjustment**.
4. **Validation**:
   - Reference generated: `WH/ADJ/0001`.
   - Click **Validate**.
   - Server automatically calculates signed delta: `−1` unit.
   - On-hand stock is reconciled to exactly `4` units.

---

## Stage 7: Immutable Audit Ledger & Move History (`/moves`)

1. **Navigate to**: `/moves`
2. **Demonstrate Audit Trail**:
   - Point out the sequential ledger entries resulting from the entire demo session:
     1. `WH/IN/0002` $\to$ `+50` units (Inbound, Green, Apex Supply $\to$ Rack A)
     2. `WH/INT/0001` $\to$ `−20` units (Rack A) & `+20` units (Rack B)
     3. `WH/OUT/0002` $\to$ `−15` units (Outbound, Red, Rack B $\to$ Customer)
     4. `WH/ADJ/0001` $\to$ `−1` unit (Outbound / Loss, Rack B)
3. **Ledger Controls**:
   - Filter by **Type** (`Receipt`, `Delivery`, `Adjustment`).
   - Search by SKU: `STL-ROD-10`.
   - Show immutable details: Exact Timestamp, Actor (`Maya`), Source, and Destination.
4. **Final Closing Statement**:
   > *"Every single physical movement in StockSense is backed by an immutable ledger row. No negative stock, zero hidden discrepancies, and full audit compliance from day one."*

---

## 8. Test Execution Checklist

- [x] Verified login credentials and auth cookies.
- [x] Verified sequence auto-generation (`WH/IN`, `WH/OUT`, `WH/INT`, `WH/ADJ`).
- [x] Verified Free-to-Use calculation prevents over-commitment.
- [x] Verified cycle count delta computation on backend.
- [x] Verified ledger reflects all 4 transaction directions with accurate timestamps and actor stamps.
