# StockSense - Round 2 Execution Blueprint

## Clock and fixed cutoffs

Total time: **7.5 hours, 9:00 AM-4:30 PM**.

| Phase | Elapsed | Clock time | Outcome |
|---|---:|---:|---|
| Planning and contract freeze | 0:00-0:45 | 9:00-9:45 | P0 scope, schema, API shapes, seed story frozen |
| Coding | 0:45-4:00 | 9:45-1:00 | P0 vertical slices implemented and merged |
| Integration and QA | 4:00-5:30 | 1:00-2:30 | End-to-end flow stable, responsive, and failure-safe |
| Demo prep and submission | 5:30-7:30 | 2:30-4:30 | Deploy, rehearse, record, upload, final smoke test |

**Scope rule:** no new feature enters P0 after 9:45 AM. At 1:00 PM, all feature coding stops unless it repairs the demo path. P1 work is allowed only when its owner has no open P0 or integration defect. P2 is documented, not built.

**Interpretation:** this is a standalone hackathon app themed/styled after Odoo Inventory (the wireframe copies Odoo's list/kanban/status-pill patterns), not an installable Odoo framework module. The frozen application stack is **Next.js (frontend) + FastAPI (backend) + PostgreSQL (database)**. This is a **RISKY assumption** because an organizer could require an installable Odoo module; confirm it once, immediately. If Odoo-native is mandatory, keep the product scope and domain rules but replace the application stack below.

## 1. Problem understanding

StockSense replaces paper registers, spreadsheets, and disconnected stock records with one system that tells warehouse teams what stock exists, where it is, what is scheduled to move, and why every quantity changed.

### Objective

Maintain trustworthy stock per product and location while supporting four auditable workflows: receipt, delivery, internal transfer, and physical-count adjustment.

### Users and stakeholders

- **Inventory manager:** creates products, monitors KPIs, schedules/validates operations, reviews low stock and ledger history.
- **Warehouse staff:** executes receipts, picking, transfers, and counts with clear validation and minimal typing.
- **Business owner/operations lead:** trusts current stock, exceptions, and auditability.
- **Judges:** need to see a believable end-to-end product, not disconnected screens.

### Expected workflow

1. User signs in and sees operational KPIs and exceptions.
2. User finds or creates a product and checks location-level availability.
3. User creates a receipt, adds supplier/product/quantity, and validates it.
4. Stock increases and a ledger entry appears atomically.
5. User transfers stock between locations without changing the company total.
6. User validates an outgoing delivery; stock decreases without becoming negative.
7. User records a physical count; StockSense posts the difference and records the reason.
8. The dashboard, stock balances, and immutable move history agree.

### Success criteria

- All four stock workflows mutate balances correctly and atomically.
- Every completed movement appears in the ledger with actor, time, source, destination, quantity, and reference.
- The dashboard derives from database data and updates after validation.
- Invalid actions are blocked with plain-language feedback.
- The full demo works on the recording device with no console errors or placeholder content.

### Demo story and payoff

**One-sentence story:** "StockSense turns an incoming batch into traceable, location-aware inventory, then safely moves, ships, and reconciles it from one calm workspace."

**Strongest 90-second payoff:** validate a receipt, transfer part of it, ship part of it, reconcile three damaged units, then open the ledger to prove the exact chain while the dashboard reflects the final totals.

### What the wireframe adds beyond the PDF

The Excalidraw mockup (`StockSense_-_8_hours.excalidraw`) is more specific than the problem statement in several places. These override/extend earlier assumptions and are treated as P0 unless flagged otherwise:

- **Auth fields:** sign-in uses a **Login ID** (not email) plus password; sign-up collects Login ID, Email, and Password + confirm-password. Login ID must be unique, 6-12 characters. Password must contain a lowercase letter, an uppercase letter, a special character, and be 8+ characters. Invalid credentials show the exact copy "Invalid Login Id or Password."
- **Left navigation:** Dashboard, Operations (submenu: Receipt / Delivery / Adjustment), Stock, Move History, Settings (submenu: Warehouse / Locations), plus a profile avatar menu ("My Profile", "Logout"). This is the canonical nav order for the app shell.
- **Dashboard widgets:** a Receipt card ("N to receive", "N late", "N operations") and a Delivery card ("N to deliver", "N late", "N waiting", "N operations") — i.e., counts split by **Late** (schedule date < today), **Waiting** (blocked on stock), and total operations, not just a flat KPI number.
- **List views default, Kanban optional:** Receipts, Deliveries, and Move History land on a list view (Reference, Contact, Schedule Date, Status) with search by reference/contact, and can switch to a Kanban view grouped by status.
- **Reference numbering:** auto-generated, format `<Warehouse>/<IN|OUT>/<auto-increment>` (e.g., `WH/IN/0001`, `WH/OUT/0001`) — warehouse code + direction + a zero-padded incrementing id.
- **Operation detail screens:** show Reference, Receive-From/Delivery-Address, **Schedule Date**, a status pill, a "Responsible" field auto-filled with the logged-in user, an editable product/quantity line table with an "Add New Product" affordance, and action buttons New/Validate/Print/Cancel. The visible action is context-sensitive: **"To Do"** while Draft (advances to Ready), **"Validate"** while Ready (advances to Done). Print is only meaningful once Done.
- **Two different state machines:** Receipts run `Draft -> Ready -> Done` (three states). Deliveries run `Draft -> Waiting -> Ready -> Done` — the extra **Waiting** state exists specifically for "waiting on an out-of-stock product to come in," and a delivery line for an out-of-stock product is flagged/highlighted (mockup calls for the row rendered in red plus an alert) instead of hard-blocking the operation.
- **Move History coloring:** inbound moves render in green, outbound moves in red; a reference with multiple product lines expands into one row per line rather than one collapsed row.
- **Stock/Products list adds cost and reservation columns:** Product, per-unit cost, **On Hand**, **Free to Use** (On Hand minus what is reserved by not-yet-validated deliveries). The mockup explicitly allows updating stock directly from this screen (this is the adjustment entry point, not a hidden backdoor around the ledger).
- **Warehouse settings:** Name, Short Code, Address. **Location settings:** Name, Short Code, parent Warehouse — a warehouse holds many locations (rooms/racks/etc.).
- **Vendor as an implicit location:** the location diagrams show `vendor <-> WH/Stock` (receipts/deliveries) and `WH/Stock1 <-> WH/Stock2` (internal transfer) as the two edges every stock move is drawn between, confirming receipts/deliveries always have one external "virtual" endpoint (a vendor/customer location) and transfers always move between two internal locations.

These wireframe details are folded into the schema, API contract, and functional requirements below. Where they conflict with an earlier "SAFE" assumption (for example, login-by-email-only, or a single three-state machine for every operation type), the wireframe wins because it is the more specific, more recently supplied source.

### Inconsistencies in the wireframe itself — confirm with the team, don't silently resolve

A direct visual read of the canvas (not just the extracted text) surfaces four spots where the wireframe disagrees with itself. None of these change P0 scope, but a teammate should pick the intended answer before it gets baked into code:

1. **Sidebar nav label is inconsistent.** The Dashboard frame's own nav bar reads `Dashboard · Operations · Stock · Move History · Settings`, but every other screen (Receipts, Delivery, Move History, Warehouse, Location) reads `Dashboard · Operations · Products · Move History · Settings` — i.e. "Stock" on one frame, "Products" everywhere else. This blueprint assumes these are **two separate nav items** (a `Products` catalog screen and a `Stock` on-hand/free-to-use screen, per Part 5/8), which is consistent with the rest of the mockup (the Stock screen and a distinct Products create/edit flow are both described), but the author only drew one of the two labels on the Dashboard frame. **Confirm:** is Stock a tab of its own, or did the author mean to write "Products" on the Dashboard frame too?
2. **Leftover Manufacturing-module copy.** The Receipts list frame includes the annotation "Populate all work orders added to manufacturing order," which reads like copy-pasted boilerplate from an Odoo Manufacturing reference and doesn't fit a Receipts screen (which should populate incoming stock receipts, not work orders). Treated as noise and not implemented literally; the adjacent, on-topic annotation ("Allow user to search receipts based on reference & contacts") is the one that's actually followed.
3. **Duplicated frame caption.** The note "This page contains the warehouse details & location" appears twice — once (correctly) above the Warehouse settings frame, and again above the Stock frame at the top-left, where it doesn't describe that screen's contents. Assumed to be a copy-paste leftover from moving boxes around the canvas; the Stock frame's actual behavior is governed by its own "User must be able to update the stock from here" annotation instead.
4. **Delivery's status stepper has a literal question mark in the source:** it reads `Draft > Waiting? > Ready > Done`, suggesting the author was themselves unsure whether Waiting belongs in the delivery lifecycle at all. This blueprint keeps `Waiting` as a real, first-class status (see Part 4/8/11) because it's referenced consistently elsewhere (the Dashboard's delivery card has a dedicated "waiting" counter, and there's a standalone annotation defining what Waiting means), but flag this to the team as the one state-machine detail that's worth a 30-second gut check before Kunal encodes it in the `operation_status` enum.

## 2. Inferred judging rubric

| Criterion | Weight | What earns the score |
|---|---:|---|
| End-to-end completeness | 25% | One uninterrupted, database-backed flow across dashboard, operations, stock, and ledger |
| UX polish and usability | 20% | Consistent visuals, obvious status/action hierarchy, responsive layout, useful empty/loading/error states |
| Correct business logic | 18% | Atomic quantity updates, no negative stock, transfer invariants, adjustment auditability |
| Demo clarity and story | 15% | A rehearsed 90-second problem-to-payoff narrative with no dead clicks |
| Technical quality | 10% | Small readable architecture, explicit API contract, validation, migrations, logs |
| Differentiation | 7% | Live operational timeline, low-stock attention queue, location-aware availability |
| Reliability and deployment | 5% | Fast load, seeded database, incognito-ready deployment, graceful failures |

Prioritization consequence: a working ledger-backed stock loop is worth more than reports, animations, SSO, or advanced forecasting.

## 3. Hidden requirements and assumptions

### Hidden requirements

| Requirement | Priority | Decision |
|---|---:|---|
| Authentication and role checks | P0 | Session/JWT auth; manager-only configuration; authenticated operations |
| Input validation | P0 | Validate on client for UX and server as source of truth |
| Atomic stock updates | P0 | Database transaction wraps validation, balances, operation status, and ledger rows |
| Duplicate prevention | P0 | Unique SKU and operation reference; idempotent validate endpoint |
| Search and filters | P0/P1 | P0 SKU/name search and status filter; richer filters P1 |
| Pagination | P1 | API supports limit/cursor; UI can initially show first page |
| Audit trail | P0 | Immutable stock-move ledger generated only by server validation |
| Loading/empty/error states | P0 | Every demo-path page gets all three |
| Notifications | P0 | In-app low-stock alerts; email/SMS is P2 |
| File/image uploads | P2 | Not needed to prove inventory value |
| Concurrency protection | P0 | Conditional balance update/transaction; reject stale or insufficient stock |
| Rate limiting | P2 | Basic auth throttling only if trivial; no Redis |
| Offline mode | P2 | Explicitly unsupported in hackathon scope |
| Responsive design | P0 | Desktop recording viewport plus usable tablet/mobile layouts |
| Time zones | P1 | Store UTC, display local; no per-user zone settings |

### Assumptions

- **RISKY:** standalone app, not an installable Odoo module. Confirm before coding.
- **SAFE:** one company/tenant for the demo; tenant isolation is out of scope.
- **SAFE:** quantities are non-negative decimals with at most three fractional digits.
- **SAFE:** no lots, serial numbers, expiry dates, or valuation/accounting in P0.
- **SAFE:** a product has one unit of measure; conversions are out of scope.
- **SAFE:** stock operations may contain several lines, but the demo uses one or two.
- **SAFE:** validated operations are immutable; correction is made through a new adjustment (which is also the same "update stock" affordance shown on the Stock screen).
- **RISKY:** OTP password reset may be demonstrated with a server-generated code surfaced in demo/dev mode instead of a paid SMS/email provider. Confirm whether judges require real delivery.
- **SAFE:** negative stock is forbidden.
- **SAFE:** only managers can maintain warehouses, locations, categories, and products; both roles can execute assigned operations.
- **SAFE:** authentication identifies users by a unique **Login ID** (username, 6-12 chars) as shown in the wireframe, with email captured separately at sign-up for password reset; API/DB still key everything on a stable internal user id.
- **SAFE:** receipts use a three-state machine (`draft -> ready -> done`); deliveries use a four-state machine (`draft -> waiting -> ready -> done`) where `waiting` means at least one line's product lacks free-to-use stock. Internal transfers and adjustments reuse the three-state machine.
- **SAFE:** "On Hand" is the physical balance and "Free to Use" is On Hand minus quantity reserved by other ready/waiting deliveries for the same product/location; reservation bookkeeping is P0 because the Waiting state depends on it, but a full reservation ledger (per-line holds with expiry) is P1/P2 — P0 computes free-to-use live from open delivery lines rather than persisting a separate reservation table.
- **SAFE:** product per-unit cost is a display/reference field only; no costing method (FIFO/average) or valuation reporting is computed in P0.
- **RISKY:** the wireframe's "vendor"/"customer" boxes are modeled as pseudo-locations with `kind = 'external'` so receipts/deliveries and transfers share one `StockMove` shape; confirm this reads naturally in the demo UI (labelled as "Supplier"/"Customer" rather than a literal location row).

## 4. Business rules

| Rule | Why | Enforcement |
|---|---|---|
| SKU is unique, trimmed, and case-insensitive | Prevent duplicate identity | DB unique normalized SKU is source of truth; API and form duplicate the check for feedback |
| Warehouse contains locations; balances belong to a product-location pair | Location-aware accuracy | DB foreign keys/unique constraint are source of truth |
| Draft operations do not affect stock | Safe preparation/editing | Backend service is source of truth; UI labels draft clearly |
| Only `ready` operations can be validated | Predictable lifecycle | Backend state machine is source of truth; button visibility is UX-only |
| Validation is idempotent | Double-click/retry must not double-post | DB/status check and transaction are source of truth; button disables while pending |
| Receipt quantity is positive and increases destination balance | Correct inbound stock | Backend transaction and DB checks; form validation mirrors it |
| Delivery quantity is positive and cannot exceed source availability | Prevent impossible stock | Backend conditional update is source of truth; UI displays available quantity |
| Transfer source and destination differ | Avoid meaningless moves | Backend is source of truth; client filters destination choices |
| Transfer decreases source and increases destination by equal quantity | Company total must remain unchanged | Backend transaction is source of truth |
| Adjustment stores counted quantity, previous quantity, delta, and reason | Auditability | Backend calculates delta; ledger persists it; client never submits delta |
| Completed/canceled operations cannot be edited | Preserve audit history | Backend is source of truth; UI renders read-only details |
| Canceling a draft/ready operation does not move stock | Avoid phantom reversal | Backend state transition |
| Low stock means total available stock <= product reorder point | One understandable rule | Backend aggregate/query; UI badge mirrors result |
| Ledger rows cannot be updated/deleted through the API | Audit integrity | No mutation route; repository exposes inserts/reads only |
| Every stock mutation records the authenticated actor and UTC time | Accountability | Backend derives actor; DB timestamp default |
| Reference is server-generated as `<WarehouseCode>/<IN|OUT|INT|ADJ>/<zero-padded sequence>` | Matches Odoo-style traceability shown in the mockup | DB sequence per warehouse+direction; API never accepts a client-supplied reference |
| Delivery lines whose product lacks free-to-use stock at the destination-source location keep the operation in `waiting` instead of failing the request | Mirrors the wireframe's "waiting for out-of-stock product" state | Backend computes free-to-use at `ready`-time; insufficiently-stocked lines are flagged, operation status is set/kept at `waiting` |
| Free-to-use quantity = On Hand − quantity reserved by other non-done, non-canceled deliveries for the same product/location | Prevents promising stock that is already committed elsewhere | Backend query sums open delivery lines at read/ready time; no separate mutable reservation column in P0 |
| Schedule date drives Late/Upcoming grouping: Late when schedule date < today and status not `done`/`canceled`; otherwise Operations/Upcoming | One understandable rule for the dashboard's Late counters | Backend aggregate/query; UI badge mirrors result |

Valid operation transitions: Receipt/Transfer/Adjustment: `draft -> ready -> done`; `draft -> canceled`; `ready -> canceled`. Delivery: `draft -> waiting <-> ready -> done`; `draft -> canceled`; `waiting -> canceled`; `ready -> canceled`. A delivery automatically re-enters `waiting` from `ready` if a subsequent stock change removes its coverage, and automatically clears from `waiting` to `ready` once all lines are coverable. No transition leaves `done` or `canceled`.

## 5. Functional requirements

### P0 - must be done by elapsed 4:00 (1:00 PM)

1. Seeded sign-in (by Login ID) plus sign-up (Login ID, email, password with complexity rules); authenticated app shell, profile menu, and logout.
2. Dashboard with Receipt/Delivery summary cards (to-receive/to-deliver, late, waiting, total operations), low-stock queue, recent operations, and status/type filtering.
3. Product list/search/create/edit with SKU, category, unit, per-unit cost, reorder point, and On Hand / Free-to-Use availability per location.
4. Receipt list (list view, status filter chips), create/detail/"To Do"/validate flow (`draft -> ready -> done`); validating increases destination stock.
5. Delivery list (list view, status filter chips), create/detail/ready/validate flow (`draft -> waiting -> ready -> done`); insufficient stock keeps the line flagged and the operation in `waiting` instead of erroring; validating prevents negative stock and decreases source stock.
6. Internal transfer create/detail/ready/validate flow; total remains constant while location balances change.
7. Stock adjustment create/validate flow, reachable both from a dedicated Adjustment screen and directly from the Stock/Products list, using physical count, calculated delta, and mandatory reason.
8. Move history ledger (list view) with reference, type, product, quantity, from/to locations, actor, and time; inbound rows in green, outbound rows in red; multi-line references expand to one row per line.
9. Shared UI system, responsive navigation (Dashboard, Operations > Receipt/Delivery/Adjustment, Stock, Move History, Settings > Warehouse/Locations, profile menu), confirmation dialogs, toasts, skeletons, empty/error states.
10. Real PostgreSQL database, Alembic migrations, deterministic seed command, and deployed end-to-end API.

### P1 - only after P0 passes the click-path

1. OTP reset flow using short-lived hashed codes; demo delivery adapter.
2. Warehouse/location and category CRUD (Warehouse: Name/Short Code/Address; Location: Name/Short Code/Warehouse).
3. Reordering-rule editing and dedicated alert filters.
4. Rich filters by warehouse, location, category, type, status, and date.
5. Pagination/cursor UI and CSV ledger export.
6. Role distinction between manager and warehouse staff.
7. Operation line editing for multiple products with better keyboard flow.
8. Kanban view toggle for Receipts/Deliveries/Move History, grouped by status (list view remains the default and is the only P0 view).
9. Printable/PDF receipt or delivery slip, enabled once an operation is `done`.

### P2 - cut without hesitation

- Barcode scanning, product images, PWA/offline sync, WebSockets, forecasting, charts beyond a small trend, SSO, email/SMS integrations, purchase/sales-order modules, lots/serials, valuation/accounting, multi-company tenancy, containerized deployment/Docker work beyond the optional local-Postgres fallback, Redis/Celery, and advanced permission matrices.

## 6. User stories and acceptance criteria

### P0 stories

**US-01 - Authentication:** As a team member, I want to sign in with my Login ID, so that inventory actions are attributable to me.

- Sign-up requires a unique Login ID (6-12 characters), a unique email, and a password containing a lowercase letter, an uppercase letter, a special character, and 8+ characters total; the confirm-password field must match.
- Given a valid Login ID/password, when submitted, then the server creates an authenticated session and the dashboard loads.
- Invalid credentials show the single message "Invalid Login Id or Password" and preserve the entered Login ID.
- Protected APIs reject anonymous requests with 401; logout clears the session.

**US-02 - Dashboard:** As an inventory manager, I want a live operational summary, so that I can spot exceptions quickly.

- KPI values are computed from the database and match the underlying lists.
- Type/status filters update the operation list and URL query state.
- Empty, loading, and retryable error states are present.
- After validating an operation, invalidated queries refresh within two seconds.

**US-03 - Products:** As a manager, I want to maintain searchable products, so that operations use consistent stock identities.

- Required fields are name, SKU / Code, category, unit, per-unit cost, and reorder point >= 0.
- Optional initial stock, when provided, creates a single-location adjustment into the default warehouse location so the product enters the system with a real balance and ledger row.
- Duplicate normalized SKU returns 409 and an inline field error.
- Search matches SKU or name; product detail shows total and per-location stock.
- Editing descriptive fields never directly edits stock.

**US-04 - Receipt:** As warehouse staff, I want to receive goods, so that arriving stock becomes available.

- A draft accepts supplier, destination, and one or more positive-quantity lines.
- Marking ready requires complete valid data.
- Validation creates ledger rows and increases balances exactly once.
- The completed receipt is read-only and its reference is visible in recent activity.

**US-05 - Delivery:** As warehouse staff, I want to dispatch goods, so that available stock stays correct.

- Free-to-use availability is shown beside each line; a line whose product lacks free-to-use stock is highlighted (red) with an inline alert.
- Marking ready with any under-covered line sets/keeps the operation at `waiting` instead of returning a hard error; it flips to `ready` automatically once all lines are covered.
- Quantity greater than on-hand stock (not just free-to-use) is rejected on validate with 409 — `waiting` is for a timing gap, not for an impossible request.
- Successful validation decreases the correct source balance and writes ledger rows once.
- A retry of a successful validate request returns the existing completed result without reposting.

**US-06 - Internal transfer:** As warehouse staff, I want to move stock between locations, so that shelving records match reality.

- Source and destination must differ and be valid internal locations.
- Insufficient source stock is rejected.
- Successful validation debits and credits equal amounts in one transaction.
- Product company total before and after the transfer is identical.

**US-07 - Adjustment:** As an inventory manager, I want to record a physical count, so that damaged/missing stock is reconciled transparently.

- The form displays current recorded quantity and accepts counted quantity >= 0.
- Reason is required; the server calculates delta.
- Validation sets the balance to the counted value and records old, new, delta, reason, and actor.
- A zero-delta count may be saved as done for audit but does not create a quantity move.

**US-08 - Ledger:** As an inventory manager, I want immutable move history, so that I can explain every stock change.

- Each non-zero stock mutation creates a row tied to its operation and line.
- Rows show sign/direction unambiguously and can be filtered by SKU/reference/type.
- No update/delete endpoint exists; opening a row links to the source operation.

**US-09 - Quality states:** As any user, I want clear system feedback, so that I never wonder whether an action worked.

- Mutating buttons disable and show progress during requests.
- Success and failure produce accessible toasts; field failures stay inline.
- Destructive/cancel actions require confirmation.
- All P0 pages work at 1440x900 and 390x844 without horizontal overflow.

### P1 stories

**US-10 - Password reset:** As a user, I want to reset a forgotten password with an OTP, so that I can regain access.

- Request response is identical for known/unknown email; code expires in 10 minutes and is single-use.
- Five failed attempts invalidate the code; new password follows server policy.

**US-11 - Configuration:** As a manager, I want to maintain warehouses, locations, categories, and reorder points, so that the system fits operations.

- Codes/names are unique in their scope; referenced records are archived rather than deleted.
- Staff receives 403 for manager-only mutations.

**US-12 - Advanced filtering:** As a manager, I want combinable filters, so that I can isolate operational work.

- Filters compose, are reflected in the URL, can be cleared in one action, and survive refresh.

**US-13 - Pagination/export:** As a manager, I want to browse/export large ledgers, so that history remains usable.

- Cursor navigation does not duplicate/skip rows; export obeys current filters and UTC timestamps.

## 7. Edge-case triage

| Edge case | Priority | Handling |
|---|---:|---|
| Empty database/empty filtered result | P0 | Purposeful illustration/text and one primary action |
| Invalid required fields/zero or negative quantity | P0 | Inline client feedback plus 422 server response |
| Duplicate SKU/reference | P0 | DB constraint and 409 with actionable message |
| Double-click/retried validation | P0 | Idempotent state check in one transaction |
| Delivery/transfer exceeds stock | P0 | Atomic conditional update; 409 with current availability |
| Source equals transfer destination | P0 | 422 and destination excluded in UI |
| Network failure/timeout | P0 | Preserve draft form, retry action, no optimistic stock mutation |
| Expired session | P0 | 401 interceptor sends user to sign-in with return path |
| Permission failure | P0 | 403 page/toast; hide unavailable controls but enforce on API |
| Concurrent deliveries for same stock | P0 | Transaction/conditional update lets one succeed and one receive 409 |
| Stale dashboard after mutation | P0 | Invalidate dashboard/products/operations/ledger queries |
| Cancel completed operation | P0 | Reject; corrections use a new adjustment |
| Zero-delta physical count | P1 | Complete audit event without stock-move row |
| Very large dataset | P1 | Indexed server filtering and cursor pagination |
| Decimal precision/UOM mismatch | P1 | Decimal(14,3); one UOM per product; reject excess precision |
| Browser refresh mid-draft | P1 | Draft already persisted; unsaved form warning if cheap |
| Delete product with history | P1 | Archive only |
| Offline edits | P2 | Show offline banner and block mutations |
| File/image failure | P2 | Feature omitted |

## 8. Domain model

| Entity | Important attributes | Relationships/constraints | Lifecycle/ownership |
|---|---|---|---|
| User | id, login_id, name, email, password_hash, role, is_active | unique login_id (6-12 chars); unique lower(email); role manager/staff | active/inactive; manager-managed |
| PasswordResetOTP | id, user_id, code_hash, expires_at, attempts, used_at | one active code per user | issued -> used/expired/invalidated |
| Category | id, name, code, is_active | unique code | active/archived; manager-owned |
| Warehouse | id, name, code, address, is_active | unique code; has locations | active/archived; manager-owned |
| Location | id, warehouse_id, name, code, kind, is_active | unique (warehouse, code); `kind` includes `internal` and `external` (vendor/customer) | active/archived; manager-owned |
| Partner | id, name, kind | supplier/customer/both | P0 seed/read; optional create |
| Product | id, name, normalized_sku, category_id, unit, unit_cost, reorder_point, is_active | unique normalized_sku | active/archived; manager-owned |
| StockBalance | product_id, location_id, on_hand_quantity, version, updated_at | unique pair; on_hand_quantity >= 0; free-to-use is derived, not stored | server-owned materialized balance |
| StockOperation | id, reference, type, status, partner_id, source_location_id, destination_location_id, schedule_date, note, created_by, validated_by, timestamps | unique reference; type receipt/delivery/transfer/adjustment | receipt/transfer/adjustment: `draft -> ready -> done/canceled`; delivery: `draft -> waiting <-> ready -> done`, `-> canceled` |
| OperationLine | id, operation_id, product_id, quantity, counted_quantity, previous_quantity, delta, reason, is_short (computed) | positive planned qty; adjustment count >= 0 | editable with draft; frozen after done |
| StockMove | id, operation_id, line_id, product_id, from_location_id, to_location_id, quantity, signed_delta, actor_id, occurred_at, reason | append-only; indexed for ledger | created atomically on validation |

For receipts, `from_location_id` is the vendor/external location and destination is an internal location. For deliveries, source is an internal location and `to_location_id` is the customer/external location. Transfers set both to internal locations. Adjustments set one affected location; signed delta expresses the change. `schedule_date` drives the Late/Waiting/Operations grouping shown on the dashboard and list views; it is required on receipts/deliveries and optional (defaults to creation date) on transfers/adjustments.

## 9. Technology stack decision

### Chosen stack

- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS; TanStack Query for server state; React Hook Form + Zod for forms/validation; Lucide icons. Next.js is used purely as the SPA/SSR frontend shell — no business logic lives in Next.js API routes or Server Actions; every mutation and every piece of derived stock data comes from the FastAPI backend over `fetch`. A handful of routes (dashboard, product detail) can use React Server Components for the first paint, but all writes and all authenticated reads still go through FastAPI so there is exactly one source of truth for business rules.
- **Backend:** Python 3.12 + FastAPI + SQLAlchemy 2 (async) + Alembic + Pydantic 2.
- **Database:** PostgreSQL 16. A single managed/hosted instance (Neon, Supabase, or Railway Postgres — whichever the team already has a free account on) is preferred over local Docker Postgres so every teammate points at the same schema and seed from minute one and nobody loses time to a local Postgres install; `docker compose up db` is the fallback if the network/API keys for a hosted instance are not ready in time.
- **Auth:** signed JWT in an HttpOnly, SameSite=Lax cookie; bcrypt/Argon2 password hashing; server-enforced password complexity (lower+upper+special+8 chars) and unique Login ID (6-12 chars) matching the wireframe's sign-up rules.
- **Testing:** Pytest for stock services/API; Vitest/Testing Library for key components; Playwright or a manual scripted smoke test for the click-path.
- **Development:** two hot-reload commands (`next dev`, `uvicorn --reload`) plus a root script/Make target for setup, migrate, seed, and run. Local Postgres is the only piece that may use Docker; frontend and backend run natively.

| Need | Default choice | Escalate to | Trigger condition | StockSense decision |
|---|---|---|---|---|
| Relational integrity | PostgreSQL | — | already required by the brief | PostgreSQL; one hosted instance, transactional rules, and `NUMERIC` types fit |
| Flexible documents | Relational tables/JSON note only | MongoDB | genuinely variable schemas with weak relations | No escalation; inventory is strongly relational |
| Realtime updates | Query invalidation/polling | WebSockets | judges see simultaneous live collaboration | No escalation; same-user refresh proves the value |
| Background jobs | Inline/async email adapter | Celery + Redis | >2-3s jobs with retry/queueing | No escalation |
| Cache/rate limiting | In-process | Redis | multiple instances or real load test | No escalation |
| Files/images | Omit/local | S3-compatible | persistent uploads are judged | No escalation; omit from scope |
| Auth | Cookie JWT/session | OAuth | SSO explicitly required | Simple auth; no OAuth |

No escalation trigger beyond the mandated Postgres swap is present. Next.js + FastAPI + Postgres, boringly wired together, is the fastest path to a coherent demo.

## 10. Database design

### ER diagram

```text
User 1---* StockOperation *---0..1 Partner
  |              |
  |              *---* OperationLine *---1 Product *---1 Category
  |                         |                 |
  |                         |                 *---* StockBalance *---1 Location *---1 Warehouse
  |                         |
  *---* StockMove *---------+
              |  from/to
              +------------------------------- Location
```

### SQL-shaped schema (PostgreSQL)

All primary keys are `UUID DEFAULT gen_random_uuid()` (the `pgcrypto` extension is enabled by the first migration). Status/type/kind columns use Postgres `ENUM` types (`CREATE TYPE ...`) rather than free-text CHECKs, so invalid values are rejected at the type level. Timestamps are `TIMESTAMPTZ`.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('manager', 'staff');
CREATE TYPE partner_kind AS ENUM ('supplier', 'customer', 'both');
CREATE TYPE location_kind AS ENUM ('internal', 'external');
CREATE TYPE operation_type AS ENUM ('receipt', 'delivery', 'transfer', 'adjustment');
CREATE TYPE operation_status AS ENUM ('draft', 'waiting', 'ready', 'done', 'canceled');

users(id UUID PK, login_id VARCHAR(12) UNIQUE, name, email_ci UNIQUE,
      password_hash, role user_role, is_active, created_at TIMESTAMPTZ,
      CHECK (char_length(login_id) BETWEEN 6 AND 12))
password_reset_otps(id UUID PK, user_id FK, code_hash, expires_at TIMESTAMPTZ,
                    attempts, used_at, created_at)
categories(id UUID PK, code UNIQUE, name, is_active)
warehouses(id UUID PK, code UNIQUE, name, address, is_active)
locations(id UUID PK, warehouse_id FK RESTRICT, code, name, kind location_kind,
          is_active, UNIQUE(warehouse_id, code))
partners(id UUID PK, name, kind partner_kind, is_active)
products(id UUID PK, sku_ci UNIQUE, name, category_id FK RESTRICT, unit,
         unit_cost NUMERIC(14,2) CHECK(unit_cost >= 0),
         reorder_point NUMERIC(14,3) CHECK(reorder_point >= 0), is_active,
         created_at, updated_at)
stock_balances(product_id FK RESTRICT, location_id FK RESTRICT,
               on_hand_quantity NUMERIC(14,3) CHECK(on_hand_quantity >= 0),
               version INT DEFAULT 0, updated_at,
               PRIMARY KEY(product_id, location_id))
stock_operations(id UUID PK, reference UNIQUE, type operation_type,
                 status operation_status, partner_id FK SET NULL,
                 source_location_id FK RESTRICT, destination_location_id FK RESTRICT,
                 schedule_date DATE, note,
                 created_by FK RESTRICT, validated_by FK RESTRICT NULL,
                 created_at, updated_at, validated_at, canceled_at)
operation_lines(id UUID PK, operation_id FK CASCADE, product_id FK RESTRICT,
                quantity NUMERIC(14,3), counted_quantity NUMERIC(14,3),
                previous_quantity NUMERIC(14,3), delta NUMERIC(14,3), reason,
                UNIQUE(operation_id, product_id))
stock_moves(id UUID PK, operation_id FK RESTRICT, line_id FK RESTRICT,
            product_id FK RESTRICT, from_location_id FK RESTRICT NULL,
            to_location_id FK RESTRICT NULL, quantity NUMERIC(14,3) CHECK(quantity > 0),
            signed_delta NUMERIC(14,3), actor_id FK RESTRICT, reason, occurred_at)
```

`reference_sequences(warehouse_id FK, direction TEXT CHECK(direction IN ('IN','OUT','INT','ADJ')), next_value INT DEFAULT 1, PRIMARY KEY(warehouse_id, direction))` backs the `WH/IN/0001`-style reference generator: the service increments this row inside the same transaction that creates the operation (`SELECT ... FOR UPDATE` to avoid duplicate references under concurrent creates), then formats `{warehouse.code}/{direction}/{next_value:04d}`.

Free-to-use stock is **not** a stored column. It is computed as `on_hand_quantity - COALESCE(reserved, 0)`, where `reserved` sums `operation_lines.quantity` for that product/location across all `delivery` operations in `waiting` or `ready` status. This keeps `stock_balances` as the single physically-mutated table and avoids a second column that could drift out of sync.

### Indexes and cascades

- `products(sku_ci)`, `products(name)`, `products(category_id, is_active)`.
- `stock_operations(status, type, created_at DESC)`, `stock_operations(schedule_date)`, source/destination location indexes.
- `stock_moves(product_id, occurred_at DESC)`, `stock_moves(operation_id)`, `stock_moves(actor_id)`.
- `stock_balances(location_id, product_id)` in addition to the primary key.
- `operation_lines(product_id, operation_id)` partial index `WHERE operation_id IN (SELECT id FROM stock_operations WHERE type='delivery' AND status IN ('waiting','ready'))`-equivalent, or simply computed in the query — used for the free-to-use reservation lookup.
- Cascade only draft operation lines when a draft operation is deleted internally; expose cancel, not delete, in the API.
- Restrict deletion of referenced configuration/product records; archive them instead.
- Connection pooling via SQLAlchemy's async engine (`asyncpg` driver) with a small pool size (5-10) sized for one demo instance; `sslmode=require` when the host is a managed provider.

## 11. API contract

Base path: `/api/v1`. JSON uses camelCase externally and typed models internally. Timestamps are ISO-8601 UTC. Decimal quantities are JSON strings to avoid floating-point ambiguity.

Common success list shape:

```json
{"items": [], "nextCursor": null, "total": 0}
```

Common error shape:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Only 17 kg is available in Production Rack.",
    "fieldErrors": {"lines.0.quantity": "Must be 17 or less"},
    "requestId": "req_..."
  }
}
```

Standard errors: 400 malformed request, 401 unauthenticated, 403 forbidden, 404 missing, 409 conflict/state/stock/duplicate, 422 validation, 500 unexpected. All authenticated routes require the session cookie.

### Authentication

| Method and URL | Purpose/auth | Request -> response | Validation/success/errors |
|---|---|---|---|
| `POST /auth/signup` | Create account; public | `{loginId,name,email,password,confirmPassword}` -> `{user}` | 201; loginId unique 6-12 chars, email unique, password matches complexity rule (lower+upper+special+8 chars) and equals confirmPassword; 409 loginId/email exists; sets cookie |
| `POST /auth/login` | Sign in; public | `{loginId,password}` -> `{user}` | 200 and cookie; 401 with message "Invalid Login Id or Password" |
| `POST /auth/logout` | End session | none -> `{ok:true}` | 200; clears cookie |
| `GET /auth/me` | Current actor | none -> `{user}` | 200 or 401 |
| `POST /auth/password-reset/request` | P1 issue OTP; public | `{email}` -> `{ok:true}` | Always 202; throttle; no account enumeration |
| `POST /auth/password-reset/confirm` | P1 reset password | `{email,otp,newPassword}` -> `{ok:true}` | 200; 400/422 invalid or expired code |

### Dashboard and reference data

| Method and URL | Purpose/auth | Request -> response | Validation/success/errors |
|---|---|---|---|
| `GET /dashboard` | KPI snapshot | query `type,status,warehouseId,locationId,categoryId` -> `{receiptSummary:{toReceive,late,total},deliverySummary:{toDeliver,late,waiting,total},lowStock,recentOperations}` | 200; invalid UUID/filter 422 |
| `GET /categories` | Product categories | search query -> list | 200 |
| `POST /categories` | P1 create category; manager | `{code,name}` -> category | 201; 409 duplicate |
| `GET /warehouses` | Warehouses and locations | `includeLocations=true` -> list | 200 |
| `POST /warehouses` | P1 create; manager | `{code,name,address}` -> warehouse | 201; 409 duplicate |
| `POST /warehouses/{id}/locations` | P1 create location; manager | `{code,name,kind}` -> location | 201; 404 warehouse; 409 duplicate |
| `GET /partners` | Supplier/customer choices | query `kind,search` -> list | 200 |

### Products and balances

| Method and URL | Purpose/auth | Request -> response | Validation/success/errors |
|---|---|---|---|
| `GET /products` | Search/filter products | `search,categoryId,stockState,cursor,limit` -> product summary list (`{...,unitCost,onHand,freeToUse}`) | 200; limit 1-100 |
| `POST /products` | Create; manager | `{name,sku,categoryId,unit,unitCost,reorderPoint,initialStock?}` -> product detail | 201; 409 SKU; 422 invalid fields; optional initial stock becomes adjustment |
| `GET /products/{id}` | Product plus balances | none -> `{product,balances,onHandTotal,freeToUseTotal}` | 200 or 404 |
| `PATCH /products/{id}` | Edit metadata; manager | partial metadata (including `unitCost`) -> product | 200; 409 SKU; 422 invalid; on-hand stock not accepted here (use adjustment) |
| `GET /products/{id}/availability` | Location stock | optional warehouse -> `{onHandTotal,freeToUseTotal,locations:[{locationId,onHand,freeToUse}]}` | 200 or 404 |

### Operations

Operation create request:

```json
{
  "type": "receipt",
  "partnerId": "uuid-or-null",
  "sourceLocationId": null,
  "destinationLocationId": "uuid",
  "scheduleDate": "2026-09-27",
  "note": "PO-8821",
  "lines": [{"productId": "uuid", "quantity": "100.000"}]
}
```

Adjustment line uses `{productId, countedQuantity, reason}`. The server derives valid location fields by type; receipts/deliveries also require `scheduleDate`. Each response includes a computed `isLate` (`scheduleDate < today` and status not `done`/`canceled`) and, for delivery lines, `isShort` (free-to-use at the source location is less than the requested quantity).

| Method and URL | Purpose/auth | Request -> response | Validation/success/errors |
|---|---|---|---|
| `GET /operations` | Filter operation queue | `type,status,warehouseId,locationId,search,cursor,limit` -> summaries with `isLate` | 200; 422 bad filters |
| `POST /operations` | Create draft | operation request -> detail | 201; quantity/count/location/scheduleDate rules; reference generated server-side (`WH/IN/0001` style) |
| `GET /operations/{id}` | Full detail | none -> operation with lines | 200 or 404 |
| `PATCH /operations/{id}` | Edit draft | editable header/lines -> detail | 200; 409 unless draft; 422 invalid |
| `POST /operations/{id}/ready` | Move toward executable | none -> detail | 200; receipt/transfer/adjustment: 409 if insufficient stock, 422 incomplete; delivery: **never 409 for stock** — sets status to `ready` if every line is covered, else `waiting`, and returns 200 either way with `isShort` flags on the short lines |
| `POST /operations/{id}/validate` | Atomically post stock | optional `{expectedUpdatedAt}` -> detail with moves | 200; 409 wrong status (must be `ready`)/stale/insufficient on-hand stock; retry on done returns 200 unchanged |
| `POST /operations/{id}/cancel` | Cancel draft/waiting/ready | `{reason?}` -> detail | 200; 409 if done/canceled |

Server validation behavior:

- Receipt: increment destination balance; create one positive inbound move per line.
- Delivery: conditional decrement source; create one outbound move per line. A background/on-read recheck also flips a `ready` delivery back to `waiting` if a concurrent operation consumes the stock it was counting on, and flips a `waiting` delivery to `ready` once every line is covered again (checked opportunistically on `GET /operations/{id}` and via the `/ready` endpoint, not by a scheduled job).
- Transfer: conditional decrement source and increment destination in the same transaction; create one move with both locations.
- Adjustment: read current balance, store previous/count/delta, set counted balance, and create a signed move only if delta != 0.

### Ledger

| Method and URL | Purpose/auth | Request -> response | Validation/success/errors |
|---|---|---|---|
| `GET /moves` | Immutable ledger | `search,productId,type,locationId,from,to,cursor,limit` -> move list | 200; indexed filters |
| `GET /moves/{id}` | Ledger detail | none -> move with source operation | 200 or 404 |
| `GET /moves/export.csv` | P1 filtered export | same filters -> CSV stream | 200; cap row count; 422 invalid range |
| `GET /operations/{id}/print` | P1 printable slip | none -> PDF/HTML stream | 200; 409 unless status is `done`; 404 missing |

The frontend starts against checked-in MSW/mock fixtures matching these exact shapes. Contract changes require a brief team sync and fixture/schema update in the same commit.

## 12. System architecture

### Frontend pages (Next.js App Router paths)

- `/login`, `/signup`, `/forgot-password` (P1) — outside the authenticated layout.
- `/dashboard` — default redirect target after login.
- `/products`, `/products/new`, `/products/[id]`.
- `/operations/receipts`, `/operations/deliveries`, `/operations/adjustments` (list views; each supports `?status=`), `/operations/[type]/new`, `/operations/[type]/[id]`.
- `/moves`.
- `/settings/warehouses` (P1), `/settings/locations` (P1), `/profile`.

The route grouping mirrors the wireframe's left nav directly: `Operations` is a parent nav item with three children (Receipt/Delivery/Adjustment) rather than one generic `/operations?type=` page, since the wireframe treats them as visually distinct list screens (different columns for delivery's "Delivery Address" vs receipt's "Receive From").

### Frontend structure

```text
frontend/
  app/
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (auth)/forgot-password/page.tsx      # P1
    (app)/layout.tsx                     # AppShell: sidebar nav + profile menu
    (app)/dashboard/page.tsx
    (app)/products/page.tsx
    (app)/products/new/page.tsx
    (app)/products/[id]/page.tsx
    (app)/operations/receipts/page.tsx
    (app)/operations/receipts/new/page.tsx
    (app)/operations/receipts/[id]/page.tsx
    (app)/operations/deliveries/...      # mirrors receipts
    (app)/operations/adjustments/...     # mirrors receipts
    (app)/moves/page.tsx
    (app)/settings/warehouses/page.tsx   # P1
    (app)/settings/locations/page.tsx    # P1
    (app)/profile/page.tsx
    layout.tsx                           # root layout: fonts, Query/Auth providers
  components/ui/       Button, Input, Select, Dialog, Toast, Skeleton, Badge, StatusPill
  components/layout/   Sidebar, MobileNav, PageHeader, ProfileMenu
  features/auth/
  features/dashboard/
  features/products/
  features/operations/
  features/moves/
  lib/api/             fetch client (attaches cookie, base URL from env), shared types, error mapping
  lib/format/          quantities, dates, references
  mocks/               MSW handlers and contract fixtures, used in dev until the real API is ready
```

Keep server state in TanStack Query (`'use client'` components) and local form state in React Hook Form; Next.js Server Components are used only for pages that just need an initial read (e.g., the dashboard's first paint) and still call the FastAPI base URL server-side rather than reimplementing any query. Avoid a global client-state library. Every route owns its loading (`loading.tsx` where useful), error (`error.tsx`), empty, and content states. Desktop uses a left rail matching the wireframe's icon+label sidebar; mobile uses a compact top bar and sheet navigation. Tables collapse into cards below the tablet breakpoint.

### Navigation

Desktop uses a **top navigation bar** for operational pages plus a collapsible **left sidebar** for management and profile actions. Mobile collapses both into a top bar + sheet menu.

**Top navigation bar**

```text
[Dashboard] | [Operations ▼] | [Products] | [Stock] | [Move History] | [Settings ▼] | A
```

- **Dashboard** — landing page that displays current statistics.
- **Operations** dropdown — submenu: Receipt, Delivery, Adjustment
  - Receipt → `/operations/receipts`
  - Delivery → `/operations/deliveries`
  - Adjustment → `/operations/adjustments`
- **Products** — product list and create/edit (`/products`).
- **Stock** — list available stock (`/stock`).
- **Move History** — display the history of in/out stocks (`/moves`).
- **Settings** dropdown — submenu: Warehouse, Locations
  - Warehouse → `/settings/warehouses`
  - Locations → `/settings/locations`
- Right side: user avatar (`A`) opens the profile menu.

**Left sidebar**

```text
Profile Menu
├── My Profile
└── Logout
```

- **Profile Menu** — My Profile (P1 password change) and Logout.

**Navigation by module**

1. **Products** — create/update products, view stock availability per location, manage categories and reorder points.
2. **Operations**
   - **Receipts** — list/detail for WH/IN operations.
   - **Delivery Orders** — list/detail for WH/OUT operations.
   - **Inventory Adjustment** — single-location count reconciliation.
   - **Move History** — immutable ledger of stock moves.
3. **Dashboard** — operational snapshot.
4. **Settings** — Warehouse and Location CRUD.
5. **Profile Menu** — My Profile and Logout.



### Dashboard UI skeleton

Page route: `/dashboard`.

```text
+-----------------------------------------------------------------------------+
|  Dashboard | Operations ▼ | Products | Stock | Move History | Settings ▼ | A |
+-----------------------------------------------------------------------------+
|  Operations ▼  Status ▼  Warehouse ▼  Location ▼  Category ▼  [Clear filters] |
+-----------------------------------------------------------------------------+
|  +-----------------------+    +-----------------------+                     |
|  | Receipt               |    | Delivery              |                     |
|  | [  4 to receive  ]    |    | [  4 to deliver  ]    |                     |
|  | 1 Late · 6 operations |    | 1 Late · 2 waiting · 6|                     |
|  +-----------------------+    +-----------------------+                     |
|  +-----------------------+    +-----------------------+    +----------------+|
|  | Total Products        |    | Low / Out of Stock    |    | Scheduled      ||
|  |       42              |    |         3             |    | Transfers   2  ||
|  | in stock              |    | items need attention  |    | internal moves ||
|  +-----------------------+    +-----------------------+    +----------------+|
+-----------------------------------------------------------------------------+
|  Recent operations list / table                                             |
+-----------------------------------------------------------------------------+
```

**Dynamic filter bar**
- Document type: Receipts / Delivery / Internal / Adjustments
- Status: Draft / Waiting / Ready / Done / Canceled
- Warehouse and Location dropdowns (location filtered by warehouse)
- Product category dropdown
- Clear filters action

**Operation summary cards** (from `GET /dashboard` `receiptSummary` / `deliverySummary`)
- **Receipt card**: "N to receive", "N late", "N operations"
- **Delivery card**: "N to deliver", "N late", "N waiting", "N operations"
- Clicking a primary metric navigates to the relevant operation list with status pre-selected.

**KPI cards (second row)**
- **Total Products in Stock**
- **Low Stock / Out of Stock Items**
- **Internal Transfers Scheduled**

**Status logic**
- **Late:** `schedule_date < today` and status not `done`/`canceled`
- **Operations/Upcoming:** `schedule_date >= today` and status not `done`/`canceled`
- **Waiting:** delivery blocked on insufficient free-to-use stock

**Recent operations section**
- Table/card list obeying the filter bar.
- Columns: reference, type, partner/contact, scheduled date, status badge, responsible user.



### Stock page UI skeleton

Page route: `/stock`.

```text
+-----------------------------------------------------------------------------+
| Stock                                                    [🔍 search/filter] |
+-----------------------------------------------------------------------------+
| Warehouse: [Main Warehouse ▼]  Location: [All Locations ▼]   [Update Stock]  |
+-----------------------------------------------------------------------------+
|  Product      | per unit cost | On hand | Free to Use | Actions             |
|  Desk         | 3000 Rs       | 50      | 45          | [Update]            |
|  Table        | 3000 Rs       | 50      | 50          | [Update]            |
+-----------------------------------------------------------------------------+
```

- **Free to Use** is computed as `on_hand − reserved` where reserved is the sum of open delivery lines in `waiting` or `ready` for the same product/location.
- Row-level **Update** and header **Update Stock** open an adjustment form pre-filled with the current location and quantity.
- On save, the backend creates an `adjustment` operation and validates it, updating the balance and ledger.



### Receipts page UI skeleton

Page routes: `/operations/receipts` (list), `/operations/receipts/new` (create), `/operations/receipts/[id]` (detail).

**Receipts list view (default)**

```text
+-----------------------------------------------------------------------------+
| Reciepts                                          [🔍] [≡ list] [▦ kanban] |
| [+ NEW]                                                                     |
+-----------------------------------------------------------------------------+
|  Reference    | From    | To         | Contact       | Schedule date | Status |
|  WH/IN/0001   | vendor  | WH/Stock1  | Azure Interior| 12/1/2026     | Ready  |
|  WH/IN/0002   | vendor  | WH/Stock1  | Azure Interior| 12/1/2026     | Ready  |
+-----------------------------------------------------------------------------+
```

- NEW → `/operations/receipts/new`
- Search by reference or contact; list/kanban toggle (kanban is P1)
- Reference format: `<WarehouseCode>/IN/<ID>`
- Clicking a row opens `/operations/receipts/[id]`

**Receipt create / detail view**

```text
+-----------------------------------------------------------------------------+
| [New]                                            Receipt        WH/IN/0001  |
|                                                                             |
|  Receive From   [Azure Interior ▼]        Schedule Date [2026-09-26]        |
|                                                                             |
|       Draft  >  Ready  >  Done                                              |
|                                                                             |
|  [Mark as Ready]  [Print]  [Cancel]                                         |
+-----------------------------------------------------------------------------+
|  Responsible: [Auto-filled current user]                                    |
|                                                                             |
|  Products                                                                   |
|  Product            Quantity                                                |
|  [DESK001] Desk     6                                                       |
|  [+ New Product]                                                            |
+-----------------------------------------------------------------------------+
```

**State-dependent action buttons**

| Current status | Primary action | Secondary actions |
| -------------- | -------------- | ----------------- |
| `draft`        | **Mark as Ready** | **Cancel** |
| `ready`        | **Validate** | **Cancel** |
| `done`         | read-only | **Print** |
| `canceled`     | read-only | — |

Validation increases destination stock once and writes one positive inbound move per line.



### Delivery Orders page UI skeleton

Page routes: `/operations/deliveries` (list), `/operations/deliveries/new` (create), `/operations/deliveries/[id]` (detail).

**Delivery list view (default)**

```text
+-----------------------------------------------------------------------------+
| Delivery                                          [🔍] [≡ list] [▦ kanban] |
| [+ NEW]                                                                     |
+-----------------------------------------------------------------------------+
|  Reference    | From       | To     | Contact       | Schedule date | Status |
|  WH/OUT/0001  | WH/Stock1  | vendor | Azure Interior|               | Ready  |
|  WH/OUT/0002  | WH/Stock1  | vendor | Azure Interior|               | Ready  |
+-----------------------------------------------------------------------------+
```

- NEW → `/operations/deliveries/new`
- Search by reference or contact; list/kanban toggle (kanban is P1)
- Reference format: `<WarehouseCode>/OUT/<ID>`

**Delivery create / detail view**

```text
+-----------------------------------------------------------------------------+
| [New]                                           Delivery      WH/OUT/0001   |
|                                                                             |
|  Delivery Address [Azure Interior ▼]      Schedule Date [2026-09-26]        |
|  Responsible    [Auto-filled user ▼]      Operation type [Delivery ▼]       |
|                                                                             |
|       Draft  >  Waiting  >  Ready  >  Done                                  |
|                                                                             |
|  [Pick / Pack → Ready]  [Print]  [Cancel]                                   |
+-----------------------------------------------------------------------------+
|  Products                                                                   |
|  Product            Quantity    Available                                   |
|  [DESK001] Desk     6           8                                           |
|  New Product                                                                |
|  Add New product                                                            |
+-----------------------------------------------------------------------------+
```

**Status definitions**
- **Draft** — initial state; lines editable.
- **Waiting** — one or more lines lack free-to-use stock; cannot validate.
- **Ready** — all lines covered; can validate.
- **Done** — posted; read-only.

**Red-line alert**: any line whose quantity exceeds free-to-use is highlighted red with an inline alert.

**State-dependent action buttons**

| Current status | Primary action | Secondary actions |
| -------------- | -------------- | ----------------- |
| `draft`        | **Pick / Pack → Ready** — returns 200 and sets `ready` or `waiting` with `isShort` flags | **Cancel** |
| `waiting`      | **Retry / Check Availability** — flips to `ready` once covered | **Cancel** |
| `ready`        | **Validate** | **Cancel** |
| `done`         | read-only | **Print** |
| `canceled`     | read-only | — |



### Move History page UI skeleton

Page route: `/moves`.

```text
+-----------------------------------------------------------------------------+
| Move History                                      [🔍] [≡ list] [▦ kanban] |
| [+ NEW]                                                                     |
+-----------------------------------------------------------------------------+
|  Reference    | Date       | Contact       | From      | To        | Qty | Status |
|  WH/IN/0001   | 12/1/2001  | Azure Interior| vendor    | WH/Stock1 | 100 | Done   |
|  WH/OUT/0002  | 12/1/2001  | Azure Interior| WH/Stock1 | vendor    |  20 | Done   |
|  WH/OUT/0002  | 12/1/2001  | Azure Interior| WH/Stock1 | vendor    |  10 | Done   |
+-----------------------------------------------------------------------------+
```

- NEW → `/operations/adjustments/new` for a manual stock correction.
- Search by reference/contact; filter by type, product, location, date range.
- **Color coding**: incoming moves green, outgoing moves red.
- **Row splitting**: one row per operation line, even if the same reference has multiple products.
- Clicking a row links to the source operation detail.



### Inventory flow example

```text
Step 1: Receive goods from vendor
         Receive 100 kg Steel
         Stock: +100

Step 2: Move to production rack
         Internal transfer: Main Store → Production Rack
         Total stock unchanged, location updated

Step 3: Deliver finished goods
         Deliver 20 steel
         Stock: -20

Step 4: Adjust damaged items
         3 kg steel damaged
         Stock: -3

Result: Everything logged in the Stock Ledger
```

This four-step story is the backbone of the demo: every operation mutates balances atomically and leaves an immutable ledger row.



### Settings — Warehouse page UI skeleton

Page route: `/settings/warehouses`.

**Warehouse list**

```text
+-----------------------------------------------------------------------------+
| Warehouses                                                    [+ New Warehouse]|
+-----------------------------------------------------------------------------+
|  Name              | Short Code | Address           | Locations | Actions    |
|  Main Warehouse    | WH         | 123 Industrial Rd | 3         | [Edit]     |
|  Secondary Warehouse| SW        | 456 Dockside Ave  | 1         | [Edit]     |
+-----------------------------------------------------------------------------+
```

**Warehouse create / edit form**

```text
+-----------------------------------------------------------------------------+
| Warehouse                                                                   |
|                                                                             |
|  Name:        [________________]                                            |
|  Short Code:  [________]                                                    |
|  Address:     [________________]                                            |
|                                                                             |
|  [Save]  [Cancel]                                                           |
+-----------------------------------------------------------------------------+
```

Short code is unique and used as the `<WarehouseCode>` segment in operation references.



### Settings — Location page UI skeleton

Page route: `/settings/locations`.

**Location list**

```text
+-----------------------------------------------------------------------------+
| Locations                                                      [+ New Location]|
+-----------------------------------------------------------------------------+
|  Name              | Short Code | Warehouse    | Kind      | Actions        |
|  Receiving Bay     | RB         | Main (WH)    | internal  | [Edit]         |
|  Rack A            | RA         | Main (WH)    | internal  | [Edit]         |
+-----------------------------------------------------------------------------+
```

**Location create / edit form**

```text
+-----------------------------------------------------------------------------+
| location                                                                    |
|                                                                             |
|  Name:        [________________]                                            |
|  Short Code:  [________]                                                    |
|  Warehouse:   [WH ▼]                                                        |
|  Kind:        [internal ▼]                                                  |
|                                                                             |
|  [Save]  [Cancel]                                                           |
+-----------------------------------------------------------------------------+
```

- A location belongs to one warehouse and represents rooms/racks/shelves within it.
- `kind` values: `internal` (default), `external` (vendor/customer pseudo-location).
- Short code is unique within the warehouse.



### Backend structure

```text
backend/app/
  main.py
  core/                config, security, logging, errors
  db/                  async session, base, migrations helpers (asyncpg engine)
  models/              SQLAlchemy tables
  schemas/             request/response models
  api/                 auth, dashboard, products, operations, moves, config
  services/            auth_service, stock_service, dashboard_service, reference_service
  repositories/        thin database queries only
  seed/                 deterministic demo scenario
backend/alembic/        Postgres migrations (env.py reads DATABASE_URL)
backend/tests/
  unit/                 stock-rule tests
  integration/          API and transaction tests
```

Routers parse/authenticate, services enforce business rules and transactions, repositories query/persist, and models hold relational constraints. `stock_service.validate_operation()` is the only code path allowed to mutate `StockBalance` or create `StockMove` rows; `reference_service.next_reference()` is the only code path allowed to increment `reference_sequences`.

### Cross-cutting behavior

- Request ID in response/error logs; structured logs without secrets/passwords.
- Central exception mapping to the common error envelope.
- CORS restricted to the Next.js frontend origin(s) (local dev port + deployed domain); secure cookie enabled in production, with `SameSite=None; Secure` if frontend and backend end up on different top-level domains in deployment.
- Environment values validated at startup; `.env.example` contains no secrets. Frontend reads `NEXT_PUBLIC_API_BASE_URL`; backend reads `DATABASE_URL` (Postgres connection string), `JWT_SECRET`, and `CORS_ORIGINS`.
- Health route checks API and database (`SELECT 1` against Postgres).
- Accessibility: semantic labels, keyboard-visible focus, status not conveyed by color alone (the wireframe's green/red move rows also get a text direction indicator), dialogs trap focus.

## 13. Git collaboration plan

### Branches

- Sourabh: `feature/sourabh/<topic>`.
- Kunal: `feature/kunal/<topic>`.
- Hardik: `feature/hardik/<topic>`.
- Fixes: `bugfix/hardik/<topic>`; urgent demo fixes: `hotfix/kunal/<topic>` when backend-owned.

Commits use `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, or `chore:` in lowercase imperative form, for example `feat(operations): validate internal transfer`.

### Workflow

```bash
git checkout main && git pull origin main
git checkout -b feature/<owner>/<topic>
git fetch origin
git rebase origin/main
git status
git add .
git commit -m "feat(scope): message"
git push -u origin feature/<owner>/<topic>
```

Open PR, get review from someone other than the author, squash-merge, and delete the branch. Never force-push a shared branch or `main`. Hardik reviews frontend PRs by default. Pull/rebase from `main` at least hourly.

### Contract discipline and integration checkpoints

- `docs/api-contract.md` and shared JSON fixtures are frozen at 9:45 AM.
- Any contract change is posted to the three-person chat before coding and merges backend + fixture updates together.
- Integration checkpoints: approximately elapsed 2:00 (11:00 AM), 3:30 (12:30 PM), and 5:00 (2:00 PM).
- At each checkpoint: merge to `main`, migrate/seed cleanly, start both apps, and run the 90-second path once.

## 14. Parallel development plan

| Time | Sourabh | Kunal | Hardik | Deliverable/checkpoint | Biggest risk -> mitigation |
|---|---|---|---|---|---|
| 9:00-9:45 | Map routes and demo path | Freeze schema/API/stock rules | Define tokens, states, QA checklist | Contract, wire path, seed scenario frozen | Scope churn -> lock P0 and request shapes |
| 9:45-10:30 | App shell, auth screens, dashboard against MSW | Project setup, DB/models/migration, auth | UI primitives, form/table/card states | Both apps boot; frontend uses contract fixtures | Setup drag -> omit optional libraries |
| 10:30-11:00 | Dashboard + product list/detail | Product APIs, seed/config queries | Product form and responsive shell | **Checkpoint 1:** sign-in -> dashboard -> product works on main | API mismatch -> compare one real response to fixture |
| 11:00-12:00 | Receipt and delivery screens | Transactional receipt/delivery services/endpoints | Operation line editor, dialogs, error/loading states | Inbound/outbound vertical slices merged | Negative/double stock -> focused service tests first |
| 12:00-12:30 | Transfer/adjustment screens | Transfer/adjustment validation and ledger | Move-history UI and filter components | **Checkpoint 2:** full four-step stock story runs | Parallel merge collisions -> feature folders and small PRs |
| 12:30-1:00 | Dashboard refresh and detail polish | Dashboard aggregation, indexes, health | Mobile/tablet pass and toast/empty/error polish | P0 feature freeze; all stock rules database-backed | Feature spill -> cut all P1 immediately |
| 1:00-2:00 | Fix integration gaps; keyboard/a11y pass | Clean migration/seed, concurrency/idempotency tests | Lead click-path bug bash; console/network audit | **Checkpoint 3 at 2:00:** clean clone/run and stable story | Hidden state bugs -> reset seed before every smoke run |
| 2:00-2:30 | Visual polish only | Deployment/config/log fixes | Cross-browser/responsive regression | Release candidate tagged; no open P0 defect | Late refactor -> forbid unless it fixes demo failure |
| 2:30-3:15 | Deploy frontend and verify incognito | Deploy API/DB and verify seed/health | Draft narration, capture backup screenshots | Public link works; final data staged | Deploy failure -> keep known local-recording fallback |
| 3:15-3:45 | Demo operator | Observe logs and hotfix only if fatal | Narrate/time; record final video | Two rehearsals then final recording <= 90s | Human timing -> fixed clicks and narration cues |
| 3:45-4:15 | README/screenshots/submission fields | Final API/schema docs and repo check | Video upload and link verification | Submission package complete | Upload delay -> start upload early, retain local copy |
| 4:15-4:30 | Incognito smoke test | Clean-seed smoke test | Checklist owner, final submit | Link/video/repo re-opened and confirmed | Last-minute change -> freeze except broken links |

Nobody waits: frontend uses MSW fixtures from minute 45; backend returns the frozen shapes; Hardik builds states/components against the same fixtures.

## 15. Coding guidelines

- TypeScript strict mode; Python type hints on public functions.
- Components and types use `PascalCase`; functions/variables `camelCase`; Python `snake_case`; constants `UPPER_SNAKE_CASE` only when truly constant.
- Feature code stays in its feature folder; only proven cross-feature primitives enter shared UI/lib.
- Keep route handlers thin; never place stock arithmetic in routers or React. Next.js Server Components and Route Handlers are not an exception: no business logic, validation, or database access in the frontend project — it only calls FastAPI.
- Mark client components explicitly (`'use client'`) only where interactivity/hooks require it; default to Server Components for static layout to keep the frontend fast without extra effort.
- Use decimal-safe helpers; do not use binary floats for quantities.
- Every backend mutation validates auth, role, state, references, and domain rules.
- Surface expected failures as typed 4xx errors; log unexpected failures once with request ID.
- Never catch and silently ignore. UI errors state what failed and offer the next action.
- Read config from environment with startup validation. Commit `.env.example`, never `.env` or secrets.
- Prefer small functions, explicit names, and one transaction boundary over clever abstractions.
- Add tests first for the four quantity invariants, idempotency, and insufficient stock; UI snapshot coverage is secondary.
- No raw hardcoded inventory dataset in shipped UI; demo data comes from the database seed command.

## 16. Quality checklist

### Product/UI

- [ ] One visual system: typography, spacing, borders, radii, status colors, and button hierarchy.
- [ ] Desktop recording viewport and 390px mobile viewport have no overflow or clipped actions.
- [ ] All fields have labels; focus is visible; dialogs and menus are keyboard reachable.
- [ ] Every P0 query has skeleton/loading, empty, error/retry, and success states.
- [ ] Every mutation has disabled/pending state plus success/error feedback.
- [ ] Status text accompanies status color; numbers and units align consistently.
- [ ] No lorem ipsum, placeholder counts, dead buttons, broken routes, or console errors.

### Domain/API

- [ ] Receipt +100 changes the correct location and company total by +100 exactly once.
- [ ] Transfer 40 changes source -40 and destination +40 while total is unchanged.
- [ ] Delivery 20 changes source and total -20; overship is blocked.
- [ ] Adjustment from 40 to 37 records delta -3 and the reason.
- [ ] Ledger and dashboard agree with balances after every validation.
- [ ] Duplicate SKU, repeated validate, invalid status, anonymous access, and permission failures are tested.
- [ ] Migration from empty DB and deterministic seed both succeed.
- [ ] API errors use the documented envelope; secrets/passwords never enter logs.

### Demo/release

- [ ] Fresh seed produces the expected named records and timestamps.
- [ ] Public app works in incognito with API health green.
- [ ] No visible network errors, slow first action, or unhandled exceptions.
- [ ] 90-second walkthrough rehearsed twice and recorded once cleanly.
- [ ] Video uploaded and playable; repository and deployment links open.

## 17. Lightweight documentation

The README should contain only:

1. Product pitch and a screenshot/GIF.
2. Exact prerequisites and one-command local setup.
3. Environment variables from `.env.example`.
4. Run, migrate, seed, and test commands.
5. The small architecture diagram from this blueprint.
6. API summary linking to `/docs` and the contract file.
7. Database overview and four stock invariants.
8. Demo credentials, deployed URL, video URL, and known deliberate scope cuts.

Do not spend hackathon time on ADRs, exhaustive code comments, or generated prose that judges will not use.

## 18. Demo data and 90-second script

### Deterministic seed

Users:

- Login ID `mayaops` / `maya@stocksense.demo` - Inventory Manager.
- Login ID `arjunwh` / `arjun@stocksense.demo` - Warehouse Staff.

Locations:

- Main Warehouse / Receiving Bay.
- Main Warehouse / Rack A.
- Main Warehouse / Production Rack.
- Secondary Warehouse / Rack B.

Products before the demo (unit cost is illustrative, in Rs, for the Stock screen's cost column):

- `STL-ROD-10` Steel Rods, kg, ₹450/kg, reorder point 25: 60 kg in Rack A.
- `CHR-ERGO-01` Ergo Chair, units, ₹3,000/unit, reorder point 8: 7 in Rack A (low-stock badge).
- `BOLT-M8-100` M8 Bolt Pack, packs, ₹80/pack, reorder point 10: 0 (out-of-stock badge).
- `FRAME-A2` Frame Assembly, units, ₹1,200/unit, reorder point 12: 34 in Production Rack.

Seed one delivery deliberately left in `waiting` (requesting more Ergo Chairs than are free-to-use) so the dashboard's "waiting" counter and the red-flagged line are visible without extra clicks.

Partners: Apex Metals (supplier) and Northstar Offices (customer). Seed several done and pending records with recent timestamps so the dashboard and history feel lived-in.

Demo operation references are server-generated but visually stable in the prepared seed/run: receipt from Apex Metals for 100 kg Steel Rods into Receiving Bay; transfer 40 kg to Production Rack; delivery 20 kg from Production Rack; adjustment counted 17 kg with reason "3 kg damaged during cutting". Starting Production Rack steel is 0 and Rack A already holds 60 kg, so the final location totals are Receiving Bay 60 kg, Rack A 60 kg, Production Rack 17 kg, and company total 137 kg after the full story.

### 90-second narrated click path

| Time | Click/action | Narration |
|---:|---|---|
| 0-10s | Sign in; dashboard opens | "StockSense replaces scattered registers with one live view of stock, exceptions, and today's work." |
| 10-22s | Point to low-stock and pending KPIs; open prepared receipt | "Maya can see what needs attention immediately. A hundred kilos of steel just arrived from Apex Metals." |
| 22-34s | Validate receipt; show success and updated availability | "One validation posts the stock and its audit entry together—no spreadsheet reconciliation later." |
| 34-47s | Open prepared internal transfer; validate | "Forty kilos move to Production Rack. Company stock is unchanged, but the location is now accurate." |
| 47-60s | Open delivery; validate 20 kg | "Shipping twenty kilos checks availability before posting, so StockSense cannot promise stock that does not exist." |
| 60-72s | Open adjustment; enter/confirm 17 and damage reason; validate | "The physical count finds three damaged kilos. We reconcile the count and require a reason instead of silently editing a number." |
| 72-85s | Open ledger filtered to `STL-ROD-10` | "Every change is now traceable: who did it, when, where it came from, where it went, and why." |
| 85-90s | Return to dashboard/final balance | "StockSense gives the team one trustworthy answer to: what do we have, where is it, and what changed?" |

Keep all four operations prepared in `ready` state before recording. Never type long records live. Use the same seeded database for rehearsal and reset it before the final recording.

## 19. Final 30-minute checklist

- [ ] All branches are merged, reviewed, deleted, and `main` is green.
- [ ] Clean clone/setup, migration, seed, API tests, and frontend build succeed.
- [ ] No TODO/FIXME, placeholder copy/data, console error, or failing request is visible.
- [ ] Auth, validation, loading, error, empty, confirmation, and toast states work on the demo path.
- [ ] Dashboard, balances, operation details, and ledger agree after the full flow.
- [ ] README, `.env.example`, API summary, demo credentials, deployment URL, and video URL are present.
- [ ] Public deployment opens in incognito; health endpoint and seeded login work.
- [ ] Final video is uploaded, playable, and tells the same 90-second story.
- [ ] Repository is clean and contains meaningful commits from Sourabh, Kunal, and Hardik.
- [ ] Submission form is complete; links are reopened after submission.

## Immediate start order

1. Confirm the standalone-app assumption with the organizer, and have one teammate spend 30 seconds resolving the four wireframe inconsistencies flagged in Part 1 (Stock vs Products nav label, the Waiting-state question mark).
2. Provision one shared PostgreSQL instance (hosted free tier preferred; `DATABASE_URL` shared with the team immediately) and freeze `docs/api-contract.md` from Part 11 and the seed scenario from Part 18.
3. Kunal scaffolds Next.js/FastAPI/Postgres project skeleton, Alembic setup, auth, and seed while Sourabh boots the app shell against mock fixtures and Hardik builds the UI/state kit.
4. Merge the first real sign-in -> dashboard -> product slice by 11:00 AM.

### STATE CHECKPOINT

Elapsed: 0h 45m of 7.5h

Done:

- Parsed the complete StockSense problem statement.
- Inferred and froze the Round 2 scoring strategy.
- Defined P0/P1/P2, domain rules, schema, API contract, architecture, ownership, QA gates, seed story, and demo script.

In progress: organizer confirmation that this is a standalone app, owner: team lead

Next up (priority order):

- Scaffold backend database/auth/seed and frontend app shell/mock API in parallel.
- Merge the first authenticated dashboard/product slice.
- Implement and test the four stock validation flows.

Blocked on: nothing for scaffolding; Odoo-native confirmation could change the implementation stack

Risks flagged: Odoo-native requirement and real OTP-delivery requirement
