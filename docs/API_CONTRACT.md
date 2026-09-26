# StockSense API Contract (v2)

> **Single Source of Truth** for frontend-backend integration  
> Derived from `v2blueprint.md` Part 11 · Version 0.1.0  
> Base path: `/api/v1`

---

## 1. Overview & Protocol Standards

- **Base URL**: `http://localhost:8000/api/v1` (local) or configured via `NEXT_PUBLIC_API_BASE_URL`.
- **CORS**: Configured to allow frontend origins (e.g. `http://localhost:3000`) with credentials enabled.
- **Data Serialization**:
  - Request/Response JSON uses **`camelCase`** field names.
  - Internal backend models use `snake_case`.
  - Timestamps are formatted as ISO-8601 UTC strings: `YYYY-MM-DDTHH:mm:ssZ`.
  - Quantities and amounts (`Numeric(14, 3)`) are serialized as strings (e.g. `"100.000"`, `"17.500"`) to avoid IEEE-754 floating point precision loss.
- **Authentication**:
  - Primary: HttpOnly session cookie `access_token` (`SameSite=Lax`, `Path=/`, `Max-Age=28800`).
  - Secondary fallback: `Authorization: Bearer <jwt_token>` header.
  - Responses for signup/login return both the `user` object and the raw `token` string for clients that store tokens in memory/storage.

---

## 2. Response Formats

### Standard List Envelope

Endpoints returning collections use:

```json
{
  "items": [ ... ],
  "nextCursor": null,
  "total": 42
}
```

### Standard Error Envelope

All error responses (4xx, 5xx) conform to:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Only 17 kg is available in Production Rack.",
    "fieldErrors": {
      "lines.0.quantity": "Must be 17 or less"
    },
    "requestId": "req_01HP..."
  }
}
```

### Standard HTTP Status Codes

| Code | Meaning | Use Case |
|---|---|---|
| `200 OK` | Success | Successful GET, PUT, PATCH, or non-creation POST |
| `201 Created` | Created | Resource successfully created (signup, create operation, create product) |
| `202 Accepted` | Accepted | Request accepted for processing (e.g. password reset OTP requested) |
| `400 Bad Request` | Malformed | Request syntax error or invalid parameter structure |
| `401 Unauthorized` | Unauthenticated | Missing, expired, or invalid session token |
| `403 Forbidden` | Access Denied | Authenticated user lacks required role (e.g. staff trying manager action) |
| `404 Not Found` | Resource Missing | Specified ID does not exist |
| `409 Conflict` | Business Conflict | Duplicate unique key (SKU, login ID, email) or invalid state transition |
| `422 Unprocessable` | Validation Error | Request body fails field-level schema validation |
| `500 Server Error` | Unexpected | Internal unhandled server exception |

---

## 3. Endpoints

### 3.1 Authentication

#### `POST /auth/signup`
Create a new user account. First registered user automatically receives the `manager` role; subsequent users default to `staff`.

- **Auth**: Public
- **Request Body**:
  ```json
  {
    "loginId": "arjun_v",
    "name": "Arjun Verma",
    "email": "arjun@stocksense.demo",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }
  ```
- **Validation Rules**:
  - `loginId`: 6 to 12 alphanumeric characters or underscores (`^[a-zA-Z0-9_]{6,12}$`).
  - `password`: Min 8 characters, at least 1 lowercase letter, 1 uppercase letter, 1 special character.
  - `confirmPassword`: Must match `password` exactly.
  - `email`: Valid email format.
- **Success (201 Created)**:
  - Sets HttpOnly cookie `access_token`.
  - Body:
    ```json
    {
      "user": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "loginId": "arjun_v",
        "name": "Arjun Verma",
        "email": "arjun@stocksense.demo",
        "role": "manager",
        "isActive": true
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
    ```
- **Errors**:
  - `409 Conflict`: `code: "LOGIN_ID_EXISTS"` or `code: "EMAIL_EXISTS"`.
  - `422 Unprocessable`: Password complexity failed or passwords do not match.

#### `POST /auth/login`
Sign in with Login ID and password.

- **Auth**: Public
- **Request Body**:
  ```json
  {
    "loginId": "arjun_v",
    "password": "Password123!"
  }
  ```
- **Success (200 OK)**:
  - Sets HttpOnly cookie `access_token`.
  - Body:
    ```json
    {
      "user": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "loginId": "arjun_v",
        "name": "Arjun Verma",
        "email": "arjun@stocksense.demo",
        "role": "manager",
        "isActive": true
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
    ```
- **Errors**:
  - `401 Unauthorized`: `message: "Invalid Login Id or Password"`.

#### `POST /auth/logout`
Terminates the current session.

- **Auth**: Public / Authenticated
- **Success (200 OK)**:
  - Clears `access_token` cookie.
  ```json
  {
    "ok": true
  }
  ```

#### `GET /auth/me`
Retrieve currently logged-in user profile.

- **Auth**: Authenticated (Cookie or Bearer token)
- **Success (200 OK)**:
  ```json
  {
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "loginId": "arjun_v",
      "name": "Arjun Verma",
      "email": "arjun@stocksense.demo",
      "role": "manager",
      "isActive": true
    }
  }
  ```
- **Errors**:
  - `401 Unauthorized`: Session invalid or expired.

---

### 3.2 Reference Data & Settings

#### `GET /categories`
List product categories.
- **Query Params**: `search` (optional string)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "code": "RAW",
      "name": "Raw Materials",
      "isActive": true
    }
  ]
  ```

#### `GET /warehouses`
List warehouses, optionally including child locations.
- **Query Params**: `includeLocations` (boolean, default: `true`)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "code": "WH",
      "name": "Main Warehouse",
      "address": "Building 4, Sector 18",
      "isActive": true,
      "locations": [
        {
          "id": "uuid",
          "warehouseId": "uuid",
          "code": "STOCK",
          "name": "Central Stock",
          "kind": "internal",
          "isActive": true
        }
      ]
    }
  ]
  ```

#### `GET /partners`
List suppliers and customers for operation assignment.
- **Query Params**: `kind` (`supplier` | `customer` | `both`), `search` (string)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "name": "Apex Fabricators",
      "kind": "supplier",
      "isActive": true
    }
  ]
  ```

---

### 3.3 Products & Inventory Balances

#### `GET /products`
Search and filter products with stock summaries.
- **Query Params**:
  - `search`: string (matches SKU or Name)
  - `categoryId`: UUID
  - `stockState`: `in_stock` | `low_stock` | `out_of_stock`
  - `cursor`: pagination cursor
  - `limit`: integer (1-100, default 50)
- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "Steel Tube 20mm",
        "sku": "RAW-STL-001",
        "category": { "id": "uuid", "code": "RAW", "name": "Raw Materials" },
        "unit": "meter",
        "unitCost": "12.500",
        "reorderPoint": "50.000",
        "onHand": "120.000",
        "freeToUse": "95.000",
        "isActive": true
      }
    ],
    "nextCursor": null,
    "total": 1
  }
  ```

#### `POST /products`
Create a new product. Optionally seed initial stock via an automatic adjustment move.
- **Auth**: Manager role
- **Request Body**:
  ```json
  {
    "name": "Steel Tube 20mm",
    "sku": "RAW-STL-001",
    "categoryId": "uuid",
    "unit": "meter",
    "unitCost": "12.500",
    "reorderPoint": "50.000",
    "initialStock": {
      "locationId": "uuid",
      "quantity": "100.000"
    }
  }
  ```
- **Response (201 Created)**: Created product object.
- **Errors**:
  - `409 Conflict`: SKU already exists.

#### `GET /products/{id}`
Product details with per-location stock balances.
- **Response (200 OK)**:
  ```json
  {
    "product": { ... },
    "balances": [
      {
        "locationId": "uuid",
        "locationName": "Central Stock",
        "onHand": "120.000",
        "freeToUse": "95.000"
      }
    ],
    "onHandTotal": "120.000",
    "freeToUseTotal": "95.000"
  }
  ```

#### `GET /products/{id}/availability`
Location-level availability calculation.
- **Query Params**: `warehouseId` (optional UUID)
- **Response (200 OK)**:
  ```json
  {
    "onHandTotal": "120.000",
    "freeToUseTotal": "95.000",
    "locations": [
      {
        "locationId": "uuid",
        "locationCode": "STOCK",
        "locationName": "Central Stock",
        "onHand": "120.000",
        "freeToUse": "95.000"
      }
    ]
  }
  ```

---

### 3.4 Operations

Supported types: `receipt`, `delivery`, `transfer`, `adjustment`.  
State machine:
- Receipts / Transfers / Adjustments: `draft` -> `ready` -> `done` (or `canceled`)
- Deliveries: `draft` -> `waiting` <-> `ready` -> `done` (or `canceled`)

#### `GET /operations`
List and filter warehouse operations.
- **Query Params**:
  - `type`: `receipt` | `delivery` | `transfer` | `adjustment`
  - `status`: `draft` | `waiting` | `ready` | `done` | `canceled`
  - `warehouseId`: UUID
  - `search`: string (matches reference, partner name, note)
  - `limit`: integer
- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "reference": "WH/IN/0001",
        "type": "receipt",
        "status": "ready",
        "scheduleDate": "2026-09-27",
        "partner": { "id": "uuid", "name": "Apex Fabricators" },
        "sourceLocation": null,
        "destinationLocation": { "id": "uuid", "name": "Central Stock" },
        "isLate": false,
        "createdAt": "2026-09-26T10:00:00Z"
      }
    ],
    "total": 1
  }
  ```

#### `POST /operations`
Create an operation in `draft` status.
- **Request Body (Receipt / Delivery / Transfer)**:
  ```json
  {
    "type": "receipt",
    "partnerId": "uuid-or-null",
    "sourceLocationId": null,
    "destinationLocationId": "uuid",
    "scheduleDate": "2026-09-27",
    "note": "PO-8821",
    "lines": [
      {
        "productId": "uuid",
        "quantity": "100.000"
      }
    ]
  }
  ```
- **Request Body (Adjustment)**:
  ```json
  {
    "type": "adjustment",
    "destinationLocationId": "uuid",
    "note": "Annual audit",
    "lines": [
      {
        "productId": "uuid",
        "countedQuantity": "48.000",
        "reason": "Scrap damaged units"
      }
    ]
  }
  ```
- **Response (201 Created)**: Operation detail object with auto-generated reference (e.g. `WH/IN/0001`).

#### `GET /operations/{id}`
Full detail of an operation including line items and availability flags (`isShort` on delivery lines).

#### `POST /operations/{id}/ready`
Mark operation ready for execution.
- For Deliveries: checks stock availability. If all lines have sufficient `freeToUse`, status becomes `ready`. If any line is short, status becomes `waiting` and affected lines have `isShort: true`. Returns 200 in both cases.
- For Receipts / Transfers / Adjustments: moves status from `draft` to `ready`.

#### `POST /operations/{id}/validate`
Atomically execute and post the operation.
- Mutates `StockBalance` records.
- Creates immutable `StockMove` ledger entries.
- Updates operation status to `done`.
- Idempotent: Calling `/validate` on an already `done` operation returns the existing operation without double-posting.
- **Errors**:
  - `409 Conflict`: Insufficient on-hand stock or invalid state transition.

#### `POST /operations/{id}/cancel`
Cancel an operation in `draft`, `waiting`, or `ready` state.
- **Response (200 OK)**: Status updated to `canceled`.
- **Errors**:
  - `409 Conflict`: Operations in `done` state cannot be canceled.

---

### 3.5 Stock Ledger / Moves

#### `GET /moves`
Immutable audit log of all stock movements.
- **Query Params**:
  - `productId`: UUID
  - `type`: `receipt` | `delivery` | `transfer` | `adjustment`
  - `locationId`: UUID
  - `from`: ISO date/timestamp
  - `to`: ISO date/timestamp
  - `limit`: integer
- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "reference": "WH/IN/0001",
        "operationType": "receipt",
        "product": {
          "id": "uuid",
          "sku": "RAW-STL-001",
          "name": "Steel Tube 20mm"
        },
        "sourceLocation": null,
        "destinationLocation": { "id": "uuid", "name": "Central Stock" },
        "quantity": "100.000",
        "unit": "meter",
        "createdAt": "2026-09-26T11:00:00Z"
      }
    ],
    "total": 1
  }
  ```

---

### 3.6 Dashboard Aggregations

#### `GET /dashboard`
Provides consolidated operational metrics for KPI cards, delivery/receipt summaries, low stock warnings, and recent activity.
- **Query Params**: `warehouseId` (optional UUID)
- **Response (200 OK)**:
  ```json
  {
    "receiptSummary": {
      "toReceive": 3,
      "late": 1,
      "total": 12
    },
    "deliverySummary": {
      "toDeliver": 5,
      "waiting": 2,
      "late": 0,
      "total": 18
    },
    "lowStock": [
      {
        "productId": "uuid",
        "name": "Steel Tube 20mm",
        "sku": "RAW-STL-001",
        "onHand": "12.000",
        "reorderPoint": "50.000",
        "unit": "meter"
      }
    ],
    "recentOperations": [ ... ]
  }
  ```

---

### 3.7 System Health

#### `GET /health` and `GET /api/health`
- **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "database": "connected"
  }
  ```
