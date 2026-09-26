# Task Management — Odoo Hackathon Final Round

> 7.5-hour build · 9:00 AM – 4:30 PM  
> Roles locked: **Sourabh** = frontend lead/pages · **Kunal** = backend/auth/db/infra · **Hardik** = UI kit + QA/testing

---

## Current State Snapshot (as of 10:45 AM, main branch)

- **Frontend scaffold is live**: Next.js 16 + React 19 + Tailwind v4 + Base UI/Shadcn dependencies installed; `npm run dev` works.
- **Shared UI kit exists**: Button, Input, Badge, Card, Label, Separator, Skeleton, Tooltip, TablePagination, plus shared components (DataTable, KpiCard, StatusBadge, EmptyState, LoadingSpinner, Toasts, Theme, Query providers, skeleton variants).
- **Auth page built at `/`**: Sign-in / sign-up form with Login ID (6–12 chars), email, password complexity rules, error notice, theme toggle, responsive layout. **Not yet wired to a real backend** — it only shows toasts and local state.
- **No backend folder exists yet**: Kunal needs to scaffold FastAPI/Postgres/backend core immediately.
- **No `docs/API_CONTRACT.md` exists yet**: contract is only inside `v2blueprint.md`.
- **Hardik has a WIP design branch** (`origin/feat/design-hardik`) with a stock-inventory page replacing the auth page; not merged to `main`.
- **Status key**: `[x]` done · `[-]` in progress / partial · `[ ]` not started · **BLOCKER** = must fix before demo.
- **Task codes**: `SOUR-xxx` = Sourabh · `KUN-xxx` = Kunal · `HAR-xxx` = Hardik · `SHR-xxx` = shared.

---

## Team Roster

| Member | Primary lane | Must not do |
|---|---|---|
| **Sourabh** | React/Next.js pages, routing, API integration, demo click-path, responsive layouts | Backend logic, database models, deployment |
| **Kunal** | Python API, business logic, auth, database schema/migrations, seed data, deployment | UI components, frontend pages, visual QA |
| **Hardik** | Shared UI kit, loading/empty/error states, component quality, QA/bug bash, demo testing/video | Backend endpoints, DB design, infra provisioning |

---

## Sourabh — Frontend Lead / Pages

### Completed ✅

- [x] **SOUR-001 · Frontend scaffold boot** — confirm `npm run dev` runs and dependencies install cleanly
  - *Test:* `cd frontend && npm install && npm run dev` boots in < 30 s.
- [x] **SOUR-002 · Auth UI page** — build sign-in / sign-up page at `/` with Login ID, email, password complexity rules, error notice, theme toggle, responsive layout
  - *Test:* Form validates on client; error notice shows "Invalid Login Id or Password"; mobile and desktop layouts render.

### In Progress 🔄

- [-] **SOUR-003 · Route scaffolding** — create route shells for `/dashboard`, `/products`, `/products/new`, `/products/[id]`, `/operations/receipts`, `/operations/deliveries`, `/operations/adjustments`, `/moves`, `/settings/warehouses`, `/settings/locations`, `/profile`
  - *Test:* `next dev` serves every route without 404.
  - *Blocked on:* agreed page structure from `v2blueprint.md`.
- [-] **SOUR-004 · Wire auth page to real API** — replace local toasts with calls to `/auth/login`, `/auth/signup`, `/auth/me`, `/auth/logout`
  - *Test:* Sign in with demo credentials navigates to `/dashboard`; 401 redirects to `/login`.
  - *Blocked on:* Kunal's auth endpoints (KUN-006–KUN-008).

### Todo 📋

- [ ] **SOUR-005 · Dashboard page** — KPI cards (receipt/delivery summaries, low stock, scheduled transfers), recent operations list, filter bar
  - *Test:* KPIs match backend `/dashboard`; filters update URL query state and operation list.
  - *Blocked on:* Kunal's `/dashboard` endpoint (KUN-017).
- [ ] **SOUR-006 · Products page** — list/search/create/edit with SKU, category, unit, cost, reorder point; show On Hand / Free-to-Use per location
  - *Test:* Create product → appears in list → detail shows per-location stock.
  - *Blocked on:* Kunal's `/products` CRUD endpoints (KUN-011–KUN-012).
- [ ] **SOUR-007 · Receipts page** — list view with search/filter, create/detail view, "Mark as Ready", validate flow
  - *Test:* Validate receipt increases destination stock and creates ledger row.
  - *Blocked on:* Kunal's `/operations` receipt endpoints (KUN-013–KUN-016).
- [ ] **SOUR-008 · Deliveries page** — list view, create/detail, "Pick/Pack → Ready", validate flow, red-flag under-covered lines
  - *Test:* Insufficient free-to-use stock keeps line red and operation in `waiting`; validation decrements source stock.
  - *Blocked on:* Kunal's delivery endpoints + free-to-use calculation (KUN-012–KUN-016).
- [ ] **SOUR-009 · Adjustments page** — physical count form with reason, calculated delta, validate flow reachable from stock list
  - *Test:* Count update sets balance and records old/new/delta/reason in ledger.
  - *Blocked on:* Kunal's adjustment endpoints (KUN-013–KUN-016).
- [ ] **SOUR-010 · Move history / ledger page** — list view with reference, type, product, quantity, from/to, actor, time; inbound green, outbound red
  - *Test:* Every validated operation appears here as one row per line.
  - *Blocked on:* Kunal's `/moves` ledger endpoint (KUN-016).
- [ ] **SOUR-011 · Settings pages (P1)** — warehouse and location CRUD
  - *Test:* Create/edit warehouse and location; short codes unique in scope.
  - *Blocked on:* Kunal's `/warehouses` and `/locations` endpoints (KUN-009–KUN-010).
- [ ] **SOUR-012 · Responsive + demo click-path polish** — ensure all P0 pages work at 390px and 1440px; no overflow
  - *Test:* Open every P0 page at both widths; all actions reachable.
- [ ] **SOUR-013 · Remove console.logs, TODOs, placeholder copy** before feature freeze
  - *Test:* `grep -R "TODO\|FIXME\|console.log\|lorem ipsum" frontend/src/app frontend/src/components` returns nothing demo-facing.

---

## Kunal — Backend / Auth / Database / Infra

### Completed ✅

- [x] **KUN-001 · Stack decision** — locked Next.js frontend + FastAPI backend + PostgreSQL database per `v2blueprint.md`
- [x] **KUN-002 · Problem analysis** — re-read problem statement, flagged constraints and risky assumptions (Odoo-native vs standalone)

### In Progress 🔄

_None — backend work has not started. KUN-003 should move to In Progress immediately._

### Todo 📋

#### Must start now (next 60 minutes)

- [ ] **KUN-003 · Create `feature/kunal/backend-core` branch**
  - *Test:* Branch pushed to origin; PR opened from `main` later.
- [ ] **KUN-004 · Scaffold FastAPI project** — `backend/` folder with `main.py`, `core/`, `db/`, `models/`, `schemas/`, `api/`, `services/`, `repositories/`, `seed/`
  - *Test:* `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload` starts without errors.
- [ ] **KUN-005 · Set up PostgreSQL + Alembic** — async SQLAlchemy 2 base, migrations, `DATABASE_URL` from env
  - *Test:* `alembic upgrade head` runs against a fresh Postgres DB; `SELECT 1` from app returns 1.
- [ ] **KUN-006 · Create `.env.example`** — list `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` with fake values
  - *Test:* No real secrets in repo; teammates can copy to `.env` and run locally.
- [ ] **KUN-007 · Extract `docs/API_CONTRACT.md`** from `v2blueprint.md` Part 11
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

- [-] **HAR-005 · Stock inventory design branch** — `origin/feat/design-hardik` has a stock-inventory page replacing the auth page; needs reconciliation with `main`
  - *Test:* Decide whether to merge as a separate route or keep auth page and add inventory as `/stock` or `/products`.
  - *Blocked on:* team decision + Sourabh's route plan (SOUR-003).
- [-] **HAR-006 · Wire UI kit into Sourabh's pages** — replace ad-hoc markup in auth page and future pages with kit components
  - *Test:* `frontend/src/app/page.tsx` uses `Button`, `Input`, `Card` from kit instead of raw `<button>`/`<input>`.
  - *Blocked on:* Sourabh's route shells (SOUR-003).

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
- [x] **SHR-002 · `v2blueprint.md` created** with full P0/P1/P2 scope, domain model, API contract, architecture, seed scenario
- [x] **SHR-003 · Frontend project scaffolded and running**
- [x] **SHR-004 · Git repo initialized with origin remote**

### Todo 📋

- [ ] **SHR-005 · Extract `docs/API_CONTRACT.md`** from `v2blueprint.md` Part 11
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

1. **No backend exists** — Kunal must start `feature/kunal/backend-core` (KUN-003) immediately.
2. **No `docs/API_CONTRACT.md`** — extract from `v2blueprint.md` (KUN-007 / SHR-005) before frontend/backend integration.
3. **Auth page not wired to API** — waiting on Kunal's auth endpoints (KUN-008–KUN-010).
4. **Hardik's design branch not reconciled** — decide whether the stock-inventory page replaces `/` or becomes `/stock`/`/products` (HAR-005).

---

_Last updated: Saturday, Sep 26, 2026, 10:45 AM_  
_Next actions:_
_1. Kunal: start KUN-003 and scaffold FastAPI + PostgreSQL + Alembic + auth endpoints._
_2. Sourabh: start SOUR-003 and add P0 route shells._
_3. Anyone with 5 minutes: complete KUN-007 / SHR-005 and extract `docs/API_CONTRACT.md`._
