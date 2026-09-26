# Task Management — Odoo Hackathon Final Round

> 7.5-hour build · 9:00 AM – 4:30 PM  
> Roles locked: **Sourabh** = frontend lead/pages · **Kunal** = backend/auth/db/infra · **Hardik** = UI kit + QA/testing

---

## Current State Snapshot (as of 11:25 AM, main branch)

- **Frontend scaffold is live**: Next.js 16 + React 19 + Tailwind v4 + Base UI/Shadcn dependencies installed; `npm run dev` works.
- **Shared UI kit exists**: Button, Input, Badge, Card, Label, Separator, Skeleton, Tooltip, TablePagination, plus shared components (DataTable, KpiCard, StatusBadge, EmptyState, LoadingSpinner, Toasts, Theme, Query providers, skeleton variants).
- **Auth page at** `/login`: Sign-in / sign-up tabs, Login ID (6–12 chars), email, password complexity rules, error notice, responsive layout. **Not yet wired to a real backend** — local validation only.
- **P0 list routes scaffolded**: `/dashboard`, `/products`, `/products/new`, `/products/[id]`, `/operations/receipts|deliveries|adjustments`, `/moves`, `/settings/warehouses`, `/settings/locations`, `/profile` — all render with `RouteScaffold` + mock tables/forms.
- **Dashboard UI built (demo mode)**: KPI cards, URL-synced filter bar, recent operations table; tries `GET /dashboard` and falls back to sample data when backend is down.
- **Warehouse location UI at** `/settings/locations/[id]`; `/` redirects to `/login`.
- **Shared nav in** `WarehouseHeader`: links Dashboard, Operations, Products, Stock, Move History, Settings. `/stock` now serves an inventory availability view.
- **API client ready**: `lib/api.ts` + types/constants exist; dashboard already uses `apiFetch`. Auth wiring (SOUR-004) can start as soon as Kunal lands endpoints.
- **No backend folder exists yet**: Kunal needs to scaffold FastAPI/Postgres/backend core immediately.
- **No** `docs/API_CONTRACT.md` **exists yet**: contract is only inside `v2blueprint.md`.
- **Operation routes present**: receipts, deliveries, and adjustments each have `new` and `[id]` views with demo-local ready/validate/cancel interactions.
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
- [-] **SOUR-004 · Wire auth page to real API** — replace local notices with calls to `/auth/login`, `/auth/signup`, `/auth/me`, `/auth/logout`
  - *Test:* Sign in with demo credentials navigates to `/dashboard`; 401 redirects to `/login`.
  - *Ready:* `lib/api.ts`, types, toast utils exist — only blocked on Kunal's auth endpoints (KUN-008–KUN-010).
- [-] **SOUR-005 · Dashboard page** — UI built with KPI cards, filter bar (URL query sync), recent operations; demo fallback when API unavailable
  - *Remaining:* wire to live `/dashboard` once KUN-020 lands; remove demo banner in production path.
  - *Test:* KPIs match backend `/dashboard`; filters update URL query state and operation list.
- [-] **SOUR-006 · Products page** — list + new + detail scaffold pages with mock `ScaffoldTable` / `ScaffoldForm`
  - *Remaining:* search/filter, real CRUD, per-location On Hand / Free-to-Use from API.
  - *Blocked on:* Kunal's `/products` CRUD endpoints (KUN-014–KUN-015).
- [-] **SOUR-007 · Receipts page** — list scaffold with mock receipt rows
  - *Remaining:* create/detail views, "Mark as Ready", validate flow.
  - *Blocked on:* Kunal's `/operations` receipt endpoints (KUN-016–KUN-018).
- [-] **SOUR-008 · Deliveries page** — list scaffold with mock delivery rows
  - *Remaining:* create/detail, "Pick/Pack → Ready", validate flow, red-flag under-covered lines.
  - *Blocked on:* Kunal's delivery endpoints + free-to-use calculation (KUN-015–KUN-018).
- [-] **SOUR-009 · Adjustments page** — list scaffold with mock adjustment rows
  - *Remaining:* physical count form with reason, calculated delta, validate flow.
  - *Blocked on:* Kunal's adjustment endpoints (KUN-016–KUN-018).
- [-] **SOUR-010 · Move history / ledger page** — list scaffold with mock ledger rows
  - *Remaining:* inbound green / outbound red styling from real data; pagination.
  - *Blocked on:* Kunal's `/moves` ledger endpoint (KUN-019).
- [-] **SOUR-011 · Settings pages (P1)** — warehouse + location list scaffolds with mock tables; location detail UI built at `/` (needs correct route)
  - *Remaining:* CRUD forms wired to API; relocate location detail to `/settings/locations/[id]`.
  - *Blocked on:* Kunal's `/warehouses` and `/locations` endpoints (KUN-012).



### Todo 📋

- [ ] **SOUR-012 · Responsive + demo click-path polish** — ensure all P0 pages work at 390px and 1440px; no overflow
  - *Test:* Open every P0 page at both widths; all actions reachable.
- [ ] **SOUR-013 · Remove console.logs, TODOs, placeholder copy** before feature freeze
  - *Test:* `grep -R "TODO\|FIXME\|console.log\|lorem ipsum" frontend/src/app frontend/src/components` returns nothing demo-facing.
- [ ] **SOUR-014 · Auth guard + redirect logic** — unauthenticated users → `/login`; authenticated `/login` → `/dashboard`; protect `(app)` routes
  - *Test:* Direct visit to `/dashboard` without session redirects to `/login`.
- [ ] **SOUR-015 · Replace raw inputs with UI kit on auth page** — use `Button`, `Input`, `Card`, `Label` from `@/components/ui/*` (HAR-006 overlap)
  - *Test:* `/login` imports kit components; no raw `<button>`/`<input>` for primary controls.



### Sourabh — Expanded next steps (priority order)

| # | Task | Est. | Can start now? | Depends on |
| --- | --- | --- | --- | --- |
| 1 | **Finish SOUR-003 gaps** — add 6 operation sub-routes (`receipts/deliveries/adjustments` × `new` + `[id]`), redirect `/` → `/login`, fix or remove `/stock` nav | 30 min | ✅ Yes | — |
| 2 | **Move location UI** — relocate `/` warehouse page → `/settings/locations/[id]`; keep demo id in URL for now | 15 min | ✅ Yes | — |
| 3 | **SOUR-014 auth guard** — middleware or layout check; redirect unauthenticated users | 20 min | ✅ Yes (cookie check stub OK until backend) | KUN-009 for real session |
| 4 | **SOUR-004 wire login** — `POST /auth/login`, `POST /auth/signup`, store session, redirect to `/dashboard` | 30 min | ⏳ When backend up | KUN-008–KUN-010 |
| 5 | **SOUR-015 kit-ify auth** — swap raw HTML inputs for Hardik's `Button`/`Input`/`Card` | 20 min | ✅ Yes | — |
| 6 | **Operation detail scaffolds** — receipt/delivery/adjustment detail pages with status badges, line table, action buttons (Ready / Validate / Cancel) using mock state | 45 min | ✅ Yes | — |
| 7 | **Products list upgrade** — replace `ScaffoldTable` with `DataTable` + search input + "New product" link | 30 min | ✅ Yes | — |
| 8 | **Wire dashboard live** — flip off demo fallback once `GET /dashboard` returns 200 | 10 min | ⏳ When backend up | KUN-020 |
| 9 | **Wire products/operations/moves** — TanStack Query hooks per page | 2–3 hr | ⏳ When backend up | KUN-014–KUN-019 |
| 10 | **SOUR-012 responsive pass** — 390px + 1440px on every route; fix table overflow | 30 min | After step 1 | — |
| 11 | **SOUR-013 cleanup** — grep sweep before feature freeze @ 12:30 | 15 min | @ 12:15 | — |

---



## Kunal — Backend / Auth / Database / Infra



### Completed ✅

- [x] **KUN-001 · Stack decision** — locked Next.js frontend + FastAPI backend + PostgreSQL database per `v2blueprint.md`
- [x] **KUN-002 · Problem analysis** — re-read problem statement, flagged constraints and risky assumptions (Odoo-native vs standalone)



### In Progress 🔄

*None — backend work has not started. KUN-003 should move to In Progress immediately.*

### Todo 📋



#### Must start now (next 60 minutes)

- [ ] **KUN-003 · Create** `feature/kunal/backend-core` **branch**
  - *Test:* Branch pushed to origin; PR opened from `main` later.
- [ ] **KUN-004 · Scaffold FastAPI project** — `backend/` folder with `main.py`, `core/`, `db/`, `models/`, `schemas/`, `api/`, `services/`, `repositories/`, `seed/`
  - *Test:* `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload` starts without errors.
- [ ] **KUN-005 · Set up PostgreSQL + Alembic** — async SQLAlchemy 2 base, migrations, `DATABASE_URL` from env
  - *Test:* `alembic upgrade head` runs against a fresh Postgres DB; `SELECT 1` from app returns 1.
- [ ] **KUN-006 · Create** `.env.example` — list `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` with fake values
  - *Test:* No real secrets in repo; teammates can copy to `.env` and run locally.
- [ ] **KUN-007 · Extract** `docs/API_CONTRACT.md` from `v2blueprint.md` Part 11
  - *Test:* File exists and covers every P0 endpoint with method, path, auth, request, response, errors.



#### Auth endpoints

- [ ] **KUN-008 · User model + migrations** — `id`, `login_id` (6–12, unique), `name`, `email_ci` (unique), `password_hash`, `role`, `is_active`
  - *Test:* Migration creates table; unique constraints enforced.
- [ ] **KUN-009 · Auth endpoints** — `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
  - *Test:* Signup returns 201 and sets cookie; login returns 200; invalid credentials return 401 with "Invalid Login Id or Password"; `/auth/me` requires auth.
- [ ] **KUN-010 · Password hashing + JWT/session cookies** — bcrypt/Argon2, HttpOnly cookie, `SameSite=Lax`
  - *Test:* Hashed password never returned; cookie set on login, cleared on logout.



#### Reference data endpoints

- [ ] **KUN-011 · Categories endpoint** — `GET /categories` (P1 create)
  - *Test:* Returns list of active categories.
- [ ] **KUN-012 · Warehouses + locations endpoints** — `GET /warehouses?includeLocations=true`, `POST /warehouses` (P1), `POST /warehouses/{id}/locations` (P1)
  - *Test:* List returns warehouses with nested locations; create returns 201 with unique code validation.
- [ ] **KUN-013 · Partners endpoint** — `GET /partners?kind=&search=`
  - *Test:* Returns supplier/customer choices for operation forms.



#### Products + balances

- [ ] **KUN-014 · Products CRUD** — `GET /products`, `POST /products`, `GET /products/{id}`, `PATCH /products/{id}`, `GET /products/{id}/availability`
  - *Test:* Duplicate SKU returns 409; optional initial stock creates adjustment + ledger row.
- [ ] **KUN-015 · StockBalance model + free-to-use calculation** — unique `(product_id, location_id)`, `on_hand_quantity >= 0`
  - *Test:* Free-to-use = on_hand − reserved by waiting/ready deliveries for same product/location.



#### Operations + ledger

- [ ] **KUN-016 · Operations CRUD + state machine** — `GET /operations`, `POST /operations`, `GET /operations/{id}`, `PATCH /operations/{id}`, `POST /operations/{id}/ready`, `POST /operations/{id}/validate`, `POST /operations/{id}/cancel`
  - *Test:* Receipt/transfer/adjustment: draft → ready → done; delivery: draft → waiting ↔ ready → done; cancel allowed from draft/ready/waiting.
- [ ] **KUN-017 · Reference generator** — `WH/IN/0001`, `WH/OUT/0001`, `WH/INT/0001`, `WH/ADJ/0001` per warehouse+direction sequence
  - *Test:* Concurrent creates produce unique references.
- [ ] **KUN-018 · Stock validation service** — atomic receipt/delivery/transfer/adjustment posting, no negative stock, idempotent validate
  - *Test:* Receipt +100 changes correct location exactly once; transfer keeps company total; delivery blocked if overship; retry on done returns unchanged.
- [ ] **KUN-019 · Ledger / moves endpoint** — `GET /moves` immutable list
  - *Test:* Every validated operation creates one `StockMove` row per line; no update/delete endpoint exists.
- [ ] **KUN-020 · Dashboard aggregation endpoint** — `GET /dashboard` with receipt/delivery summaries, low stock, recent operations
  - *Test:* KPIs match underlying lists; isLate computed correctly.



#### Seed + deploy

- [ ] **KUN-021 · Deterministic seed script** — demo users Maya/Arjun, warehouses/locations, products with starting balances, one waiting delivery
  - *Test:* Run seed on empty DB → expected records; reset and rerun → identical data.
- [ ] **KUN-022 · Health endpoint** — `GET /health` returns API + DB status
  - *Test:* Returns 200 when DB connected; useful for deploy checks.
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

- [-] **HAR-005 · Stock inventory design branch** — warehouse/location UI merged to `main` at `/`; auth moved to `/login`. Still need: location detail at `/settings/locations/[id]`, decide `/stock` vs `/products` for nav.
  - *Test:* Nav links resolve; location detail reachable from settings list.
- [-] **HAR-006 · Wire UI kit into Sourabh's pages** — dashboard + route scaffolds use `Button`, `StatusBadge`, `KpiCard`; auth page still uses raw `<button>`/`<input>`.
  - *Test:* `/login` uses kit components; tracked as SOUR-015.



### Todo 📋

- [ ] **HAR-007 · Usage documentation** — add examples for kit components in `frontend/components/ui/README.md` or a lightweight story page
  - *Test:* A new page can be built using only the README examples.
- [ ] **HAR-008 · Loading/empty/error states on every P0 screen** — ensure each query has Skeleton, EmptyState, and ErrorState
  - *Test:* Every `useQuery` in the app renders all three states.
  - *Blocked on:* Sourabh's pages (SOUR-005–SOUR-010) + Kunal's endpoints.
- [ ] **HAR-009 · Responsive regression pass** — test every P0 page at 390px, 768px, 1440px
  - *Test:* No horizontal overflow; all primary actions reachable without zoom.
  - *Blocked on:* Sourabh's pages (SOUR-005–SOUR-010).
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

- [ ] **SHR-005 · Extract** `docs/API_CONTRACT.md` from `v2blueprint.md` Part 11
  - *Owner:* Kunal or Sourabh
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

1. **No backend exists** — Kunal must start `feature/kunal/backend-core` (KUN-003) immediately. Blocks SOUR-004 and all live API wiring.
2. **No** `docs/API_CONTRACT.md` — extract from `v2blueprint.md` (KUN-007 / SHR-005) before frontend/backend integration.
3. **Auth page not wired to API** — waiting on Kunal's auth endpoints (KUN-008–KUN-010). UI + `apiFetch` client are ready.
4. **Route gaps** — 6 operation sub-routes missing; `/stock` 404; `/` still serves location UI instead of redirect (SOUR-003 finish).

---

*Last updated: Saturday, Sep 26, 2026, 11:25 AM*  
*Sourabh next actions (do now, no backend needed):*
*1. Finish SOUR-003 — operation `new`/`[id]` routes, `/` redirect, fix `/stock` nav.*
*2. Move location UI from `/` → `/settings/locations/[id]`.*
*3. SOUR-015 — kit-ify `/login` with Hardik's components.*
*4. Build operation detail scaffolds with Ready/Validate/Cancel buttons (mock state).*
*When Kunal's auth lands (~11:00 checkpoint): SOUR-004 wire login → `/dashboard`.*
