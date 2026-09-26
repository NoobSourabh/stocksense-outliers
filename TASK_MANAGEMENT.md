# Task Management — Odoo Hackathon Final Round

> 7.5-hour build · 9:00 AM – 4:30 PM  
> Roles locked: **Sourabh** = frontend lead/pages · **Kunal** = backend/auth/db/infra · **Hardik** = UI kit + QA/testing

---

## Current State Snapshot (as of 1:31 PM, main branch)

- **Frontend scaffold is live**: Next.js 16 + React 19 + Tailwind v4 + Base UI/Shadcn dependencies installed; `npm run dev` works.
- **Shared UI kit exists**: Button, Input, Badge, Card, Label, Separator, Skeleton, Tooltip, TablePagination, plus shared components (DataTable, KpiCard, StatusBadge, EmptyState, LoadingSpinner, Toasts, Theme, Query providers, skeleton variants).
- **Auth page at** `/login`: Login/signup/logout use the backend's HttpOnly cookie session; `/auth/me` protects app routes. Password field controlled-state warning fixed.
- **Backend core is live**: FastAPI + asyncpg + SQLAlchemy 2 + PostgreSQL connected (local dev + Neon-ready). Alembic migrations up to head, seed data present. Dev server at `http://localhost:8000`.
- **Single Source of Truth API Contract**: `docs/API_CONTRACT.md` extracted and frozen per `v2blueprint.md` Part 11.
- **Auth & Session System verified**: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` with bcrypt, HttpOnly cookies (`SameSite=Lax`), and Bearer token fallback. Auth test suite passing.
- **Inventory pages use FastAPI**: product search/create/edit/availability, operations list/create/transitions, stock balances, ledger, profile, and warehouse/location reads.
- **Dashboard is live**: `/dashboard` supplies summary cards and `/operations` supplies URL-filtered recent operations; demo fallback remains for service failures.
- **Warehouse location UI at** `/settings/locations/[id]`; `/` redirects to `/login`.
- **Shared nav in** `WarehouseHeader`: links Dashboard, Operations, Products, Stock, Move History, Settings. `/stock` serves an inventory availability view.
- **API client connected**: `lib/api.ts` defaults to `http://localhost:8000` in dev, routes through `/api/v1`, forwards the auth cookie, and calls available FastAPI endpoints.
- **Operation routes present**: receipt, delivery, and adjustment lists and detail/create flows are wired to FastAPI; ready/validate/cancel actions update server state; `PATCH /operations/{id}` allows draft modifications.
- **Backend contract complete for P0**: `PATCH /operations/{id}` implemented; product `initialStock` creates automatic adjustment and ledger moves; cursor pagination with accurate `total` and `nextCursor` implemented on `/operations`, `/moves`, and `/products`.
- **Status key**: `[x]` done · `[-]` in progress / partial · `[ ]` not started · **BLOCKER** = must fix before demo.
- **Task codes**: `SOUR-xxx` = Sourabh · `KUN-xxx` = Kunal · `HAR-xxx` = Hardik · `SHR-xxx` = shared.

---



## Team Roster


| Member      | Primary lane                                                                                  | Must not do                                      |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Sourabh** | React/Next.js pages, routing, API integration, demo click-path, responsive layouts            | Backend logic, database models, deployment       |
| **Kunal**   | Python API, business logic, auth, database schema/migrations, seed data, deployment           | UI components, frontend pages, visual QA         |
| **Hardik**  | Shared UI kit, loading/empty/error states, component quality, QA/bug bash, demo testing/video | Backend endpoints, DB design, infra provisioning |


---



## Sourabh — Frontend Lead / Pages



### Completed ✅

- [x] **SOUR-001 · Frontend scaffold boot** — confirm `npm run dev` runs and dependencies install cleanly
  - *Test:* `cd frontend && npm install && npm run dev` boots in < 30 s.
- [x] **SOUR-002 · Auth UI page** — sign-in / sign-up at `/login` with Login ID, email, password complexity rules, error notice, responsive layout
  - *Test:* Form validates on client; mobile and desktop layouts render.
  - *Note:* Originally at `/`; moved to `/login` when warehouse UI took `/`.



### In Progress 🔄

- [x] **SOUR-003 · Route scaffolding** — P0 route shells and operation detail/new routes are present
  - *Done:* `/dashboard`, `/products`, `/products/new`, `/products/[id]`, `/operations/receipts`, `/operations/deliveries`, `/operations/adjustments`, `/moves`, `/settings/warehouses`, `/settings/locations`, `/profile`
  - *Done:* operation `new` + `[id]` routes (×3 types); `/` redirects to `/login`; `/stock` route resolves; location detail moved to `/settings/locations/[id]`.
  - *Test:* `next dev` serves every P0 route without 404; nav links all resolve.
- [x] **SOUR-004 · Wire auth page to real API** — login/signup/logout/me use the API's HttpOnly cookie session
  - *Test:* Sign in with demo credentials navigates to `/dashboard`; 401 redirects to `/login`.
- [x] **SOUR-005 · Dashboard page** — live `/dashboard` summaries and `/operations` filters, with demo fallback on dashboard failure
  - *Remaining:* none for available backend contract; demo fallback remains for unavailable service.
  - *Test:* KPIs match backend `/dashboard`; filters update URL query state and operation list.
- [-] **SOUR-006 · Products page** — live search/list, create/edit, and per-location availability
  - *Remaining:* initial-stock posting; backend accepts the field but currently does not post an adjustment/ledger row.
- [-] **SOUR-007 · Receipts page** — live list/create/detail/ready/validate/cancel workflow
  - *Remaining:* editing draft details; backend has no operation PATCH endpoint.
- [-] **SOUR-008 · Deliveries page** — live list/create/detail, server-calculated waiting/ready, validate/cancel, and under-covered line warning
  - *Remaining:* editing draft details; backend has no operation PATCH endpoint.
- [x] **SOUR-009 · Adjustments page** — live physical count/reason flow; server calculates the delta and posts the ledger move.
- [-] **SOUR-010 · Move history / ledger page** — live ledger rows with inbound/outbound colors, filters, and local paging
  - *Remaining:* server pagination beyond the 50-row API limit.
- [-] **SOUR-011 · Settings pages (P1)** — live warehouse/location directories and location detail
  - *Remaining:* wire create forms for warehouses (`POST /warehouses`) and locations (`POST /warehouses/{id}/locations`); API client methods already exist.
  - *Blocked on:* nothing — backend write endpoints are live.



### Todo 📋

- [-] **SOUR-012 · Responsive + demo click-path polish** — responsive grids and horizontally scrollable tables are in place; visual review remains
  - *Test:* Open every P0 page at both widths; all actions reachable.
- [x] **SOUR-013 · Remove console.logs, TODOs, placeholder copy** before feature freeze
  - *Test:* `grep -R "TODO\|FIXME\|console.log\|lorem ipsum" frontend/src/app frontend/src/components` returns nothing demo-facing.
- [x] **SOUR-014 · Auth guard + redirect logic** — unauthenticated users → `/login`; authenticated `/login` → `/dashboard`; protect app routes
  - *Test:* Direct visit to `/dashboard` without session redirects to `/login`.
- [x] **SOUR-015 · Replace raw inputs with UI kit on auth page** — use `Button`, `Input`, `Card`, `Label` from `@/components/ui/*` (HAR-006 overlap)
  - *Test:* `/login` imports kit components; no raw `<button>`/`<input>` for primary controls.



### Sourabh — Expanded next steps (priority order)

| # | Task | Est. | Can start now? | Depends on |
| --- | --- | --- | --- | --- |
| 1 | **Finish SOUR-003 gaps** — add 6 operation sub-routes, redirect `/` → `/login`, and provide `/stock` | Done | ✅ | — |
| 2 | **Move location UI** — relocate warehouse detail to `/settings/locations/[id]` | Done | ✅ | — |
| 3 | **SOUR-014 auth guard** — verify session with `/auth/me` and redirect by auth state | Done | ✅ | — |
| 4 | **SOUR-004 wire login** — login/signup/logout with cookie session and redirect | Done | ✅ | — |
| 5 | **SOUR-015 kit-ify auth** — use shared `Button`/`Input`/`Card`/`Label` controls | Done | ✅ | — |
| 6 | **Operation detail flows** — create/detail routes with live server transitions | Done | ✅ | Draft editing requires an API PATCH endpoint |
| 7 | **Products CRUD** — live search, create, edit, and location availability | Done | ✅ | Initial stock posting requires backend support |
| 8 | **Wire dashboard live** — query dashboard and filtered operations; retain fallback | Done | ✅ | — |
| 9 | **Wire products/operations/moves** — query/mutation hooks for available endpoints | Done | ✅ | Missing backend writes/pagination noted above |
| 10 | **SOUR-011 settings forms** — add warehouse + location create UI using `stockApi.createWarehouse` / `createLocation` | 45–60 min | ✅ Yes | — |
| 11 | **SOUR-012 responsive pass** — visually inspect every route at 390px and 1440px | Open | Needs visual review | — |
| 12 | **SOUR-013 cleanup** — remove debug markers and unused scaffold placeholders | Done | ✅ | — |

---



## Kunal — Backend / Auth / Database / Infra



### Completed ✅

- [x] **KUN-001 · Stack decision** — locked Next.js frontend + FastAPI backend + PostgreSQL database per `v2blueprint.md`
- [x] **KUN-002 · Problem analysis** — re-read problem statement, flagged constraints and risky assumptions (Odoo-native vs standalone)
- [x] **KUN-003 · Create `feature/kunal/backend-core` branch** — branched from `main`, active working branch
- [x] **KUN-004 · Scaffold FastAPI project** — `backend/` folder scaffolded with `main.py`, `core/`, `db/`, `models/`, `schemas/`, `api/`, `services/`, `repositories/`, `seed/` matching v2 blueprint
- [x] **KUN-005 · Set up PostgreSQL + Alembic** — async SQLAlchemy 2 + asyncpg against Neon PostgreSQL, Alembic migrations initialized and upgraded to head, seed data verified
- [x] **KUN-006 · Create `.env.example`** — list `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` with fake values
- [x] **KUN-007 · Extract `docs/API_CONTRACT.md`** — comprehensive API contract extracted from `v2blueprint.md` Part 11, serving as frozen contract for team integration
- [x] **KUN-008 · User model + migrations** — `users` table created with UUID PK, unique `login_id` (6-12 chars check constraint), unique `email` (lowercased), `password_hash`, `role` enum (`manager`, `staff`), and `is_active`
  - *Test:* `tests/test_user_model.py` verifies model attributes, loginId length rules, and password complexity validation.
- [x] **KUN-009 · Auth endpoints** — `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` with cookie + Bearer token support
  - *Test:* `tests/test_auth_api.py` verifies 201 signup + cookie, 409 conflict, 401 on bad password with exact message "Invalid Login Id or Password", and 200 on logout clearing cookie.
- [x] **KUN-010 · Password hashing + JWT/session cookies** — bcrypt hashing with salt, signed JWTs with expiration, HttpOnly cookie with `SameSite=Lax`
  - *Test:* Verified in `tests/test_auth_api.py` and `tests/test_user_model.py`. All 6 tests passing.
- [x] **KUN-011 · Categories endpoint** — `GET /categories?search=`, `POST /categories` (P1 create) with manager RBAC, uppercase code normalization, and 409 conflict validation
  - *Test:* `tests/test_reference_api.py` verifies list, search query filtering, manager 201 creation, 403 on staff attempt, and 409 duplicate code conflict.
- [x] **KUN-012 · Warehouses + locations endpoints** — `GET /warehouses?includeLocations=true`, `POST /warehouses`, `GET /warehouses/{id}`, `POST /warehouses/{id}/locations`, `GET /locations`, `GET /locations/{id}`
  - *Test:* `tests/test_reference_api.py` verifies list with nested locations, search, warehouse creation with unique code, 404 on missing warehouse, location creation with unique code per warehouse, 403 on staff attempt, and 409 on duplicate code.
- [x] **KUN-013 · Partners endpoint** — `GET /partners?kind=&search=`, `POST /partners` with manager RBAC and kind validation
  - *Test:* `tests/test_reference_api.py` verifies partner list, kind filtering (supplier/customer including both), search query filtering, 201 creation, and 422 on invalid kind.
- [x] **KUN-014 · Products CRUD** — `GET /products`, `POST /products`, `GET /products/{id}`, `PATCH /products/{id}`, `GET /products/{id}/availability`
  - *Test:* `tests/test_products_and_operations_api.py` verifies manager 201 creation, 403 on staff attempt, 409 on duplicate SKU, initial stock creation via adjustment move, GET with search/category/stockState filtering, PATCH updates, and location availability.
- [x] **KUN-015 · StockBalance model + free-to-use calculation** — unique `(product_id, location_id)`, `on_hand_quantity >= 0`
  - *Test:* `tests/test_products_and_operations_api.py` verifies free-to-use = on_hand − reserved by waiting/ready deliveries, unreserved draft deliveries, cumulative reservations, and reservation release upon delivery cancellation.
- [x] **KUN-016 · Operations CRUD + state machine** — `GET /operations`, `POST /operations`, `GET /operations/{id}`, `PATCH /operations/{id}`, `POST /operations/{id}/ready`, `POST /operations/{id}/validate`, `POST /operations/{id}/cancel`
  - *Test:* `tests/test_products_and_operations_api.py` verifies receipt/transfer/adjustment draft → ready → done, delivery draft → waiting ↔ ready → done with short quantity detection, cancellation from draft/waiting/ready, 409 conflict when editing or canceling done operations, and idempotent validate.
- [x] **KUN-017 · Reference generator** — `WH/IN/0001`, `WH/OUT/0001`, `WH/INT/0001`, `WH/ADJ/0001` per warehouse+direction sequence
  - *Test:* Verified in `tests/test_products_and_operations_api.py` for all 4 operation types.
- [x] **KUN-018 · Stock validation service** — atomic receipt/delivery/transfer/adjustment posting, no negative stock, idempotent validate
  - *Test:* Verified in `tests/test_products_and_operations_api.py`.

- [x] **KUN-019 · Ledger / moves endpoint** — `GET /moves` immutable audit ledger with cursor pagination and accurate total counts
  - *Test:* `tests/test_pagination_api.py` verifies items, total, and nextCursor.
- [x] **KUN-020 · Dashboard aggregation endpoint** — `GET /dashboard` live with summaries, low stock, and recent operations
  - *Test:* KPIs match underlying lists; verified in dashboard service tests.
- [x] **KUN-024 · Dashboard filter, aggregate and pagination support** — cursor pagination and accurate total counts for `/operations`, `/moves`, and `/products`
  - *Test:* `tests/test_pagination_api.py` verifies cursor encoding/decoding and multi-page traversals across operations, moves, and products.

### In Progress 🔄

- [-] **KUN-023 · Deploy backend** — prepare production deployment config / env vars

### Todo 📋

#### Seed + deploy

- [x] **KUN-021 · Deterministic seed script** — demo users Maya/Arjun, warehouses/locations, products with starting balances, waiting delivery
- [x] **KUN-022 · Health endpoint** — `GET /health` returns API + DB status
- [ ] **KUN-023 · Deploy backend** — Railway/Render with Postgres and env vars
  - *Test:* Public health endpoint returns 200; frontend points to deployed URL.

---



## Hardik — UI Kit / QA / Testing



### Completed ✅

- [x] **HAR-001 · GitHub repo setup** — repo created, collaborators added, `main` branch protected
- [x] **HAR-002 · Shared UI kit components** — Button, Input, Badge, Card, Label, Separator, Skeleton, Tooltip, TablePagination
  - *Test:* Each component imports and renders without errors.
- [x] **HAR-003 · Shared feature components** — DataTable, KpiCard, StatusBadge, EmptyState, LoadingSpinner, Toast provider, Theme provider, Query provider, skeleton variants
  - *Test:* App providers wrap the root layout without runtime errors.
- [x] **HAR-004 · Theme + responsive foundation** — dark/light mode toggle; responsive breakpoints active
  - *Test:* Toggle theme in auth page; resize window to 390px and 1440px.



### In Progress 🔄

- [x] **HAR-005 · Stock inventory design branch** — warehouse/location UI on `main`; auth at `/login`; location detail at `/settings/locations/[id]`; `/stock` nav resolved.
- [x] **HAR-006 · Wire UI kit into Sourabh's pages** — dashboard + route scaffolds use kit; auth page uses `Button`/`Input`/`Card`/`Label` (SOUR-015 done).



### Todo 📋

- [ ] **HAR-007 · Usage documentation** — add examples for kit components in `frontend/components/ui/README.md` or a lightweight story page
  - *Test:* A new page can be built using only the README examples.
- [ ] **HAR-008 · Loading/empty/error states on every P0 screen** — ensure each query has Skeleton, EmptyState, and ErrorState
  - *Test:* Every `useQuery` in the app renders all three states.
- [ ] **HAR-009 · Responsive regression pass** — test every P0 page at 390px, 768px, 1440px
  - *Test:* No horizontal overflow; all primary actions reachable without zoom.
  - *Can start:* pair with Sourabh on SOUR-012 responsive pass.
- [ ] **HAR-010 · Quality Checklist sweep after Sprint 1 merge** — run the checklist on every finished flow
  - *Test:* Log bugs by severity; block merges that fail checklist.
  - *Blocked on:* Sprint 1 completion.
- [ ] **HAR-011 · Bug-bash test script** — write the demo-path test script for Phase 08
  - *Test:* Script covers login → dashboard → receipt → transfer → delivery → adjustment → ledger.
  - *Blocked on:* full P0 implementation.
- [ ] **HAR-012 · Final video recording** — drive the click-path while narrator talks; record max 2 takes
  - *Test:* Video under required length, clear audio, no notifications, cursor visible.
  - *Blocked on:* demo-ready app.

---



## Shared / Cross-Cutting



### Done ✅

- [x] **SHR-001 · Problem selected: StockSense**
- [x] **SHR-002 ·** `v2blueprint.md` **created** with full P0/P1/P2 scope, domain model, API contract, architecture, seed scenario
- [x] **SHR-003 · Frontend project scaffolded and running**
- [x] **SHR-004 · Git repo initialized with origin remote**



### Todo 📋

- [x] **SHR-005 · Extract** `docs/API_CONTRACT.md` from `v2blueprint.md` Part 11
  - *Owner:* Kunal
  - *Test:* Single source-of-truth contract file exists.
- [ ] **SHR-006 · Create shared scratch doc** for Idea Document sections 1–11
  - *Owner:* Hardik
  - *Test:* All teammates can edit it.
- [ ] **SHR-007 · Set fixed integration checkpoints**
  - Checkpoint 1: ~11:00 — first full-stack slice proven
  - Checkpoint 2: ~12:30 — P0 feature freeze
  - Checkpoint 3: ~14:00 — clean clone/run + stable demo story
- [ ] **SHR-008 · Final 30-minute checklist before submission**
  - All branches merged, no open PRs
  - No console errors or visible TODOs
  - README updated
  - `.env.example` present, no secrets
  - Commits from all three teammates
  - Video uploaded/linked, deployed link tested incognito

---



## P0 Feature Dependency Chain

```text
1. Kunal: backend scaffold + auth endpoints (KUN-003–KUN-010)
        ↓
2. Sourabh: wire auth page + create route shells (SOUR-003–SOUR-004)
        ↓
3. Sourabh + Hardik: dashboard/products/operations pages using kit components (SOUR-005–SOUR-010 + HAR-006–HAR-009)
        ↓
4. Kunal: products/operations/ledger endpoints land (KUN-011–KUN-020)
        ↓
5. Sourabh: wire remaining pages to real API (SOUR-005–SOUR-010)
        ↓
6. Kunal: seed script + dashboard aggregation (KUN-020–KUN-021)
        ↓
7. Hardik: QA checklist sweep + bug bash (HAR-010–HAR-011)
        ↓
8. All: demo script + video recording + submission (HAR-012 + SHR-008)
```

---



## Active Blockers

*None! All backend blockers for P0 operations, initial stock posting, and cursor-based pagination are resolved and verified.*

---

*Last updated: Saturday, Sep 26, 2026 · 1:58 PM*
*Sourabh next up: **SOUR-011** — wire settings create forms (warehouses + locations).*
*Kunal next up: **KUN-023** — backend deployment configuration (Render/Railway).*
*Hardik next up: **HAR-009** responsive regression (pair with SOUR-012).*
