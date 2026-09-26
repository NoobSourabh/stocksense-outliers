"""
StockSense Backend - Pydantic request/response schemas.

Uses camelCase aliases for JSON serialization per the API contract.
Decimal quantities are serialized as strings to avoid floating-point ambiguity.
"""

import re
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Base config
# ---------------------------------------------------------------------------

class CamelModel(BaseModel):
    """Base model with camelCase JSON aliases and common config."""
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


# ---------------------------------------------------------------------------
# Auth — login_id based per wireframe
# ---------------------------------------------------------------------------

class SignupRequest(CamelModel):
    login_id: str = Field(..., alias="loginId", min_length=6, max_length=12)
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., alias="confirmPassword")

    @field_validator("login_id")
    @classmethod
    def validate_login_id(cls, v: str) -> str:
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError("Login ID must contain only alphanumeric characters and underscores")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;\']', v):
            raise ValueError("Password must contain a special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        password = info.data.get("password")
        if password and v != password:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(CamelModel):
    login_id: str = Field(..., alias="loginId")
    password: str


class UserResponse(CamelModel):
    id: str
    login_id: str = Field(alias="loginId")
    name: str
    email: str
    role: str
    is_active: bool = Field(alias="isActive")


class AuthResponse(CamelModel):
    user: UserResponse
    token: str | None = None


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

class CategoryResponse(CamelModel):
    id: str
    code: str
    name: str
    is_active: bool = Field(alias="isActive")


class CategoryCreateRequest(CamelModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)


# ---------------------------------------------------------------------------
# Warehouses & Locations
# ---------------------------------------------------------------------------

class LocationResponse(CamelModel):
    id: str
    warehouse_id: str = Field(alias="warehouseId")
    code: str
    name: str
    kind: str
    is_active: bool = Field(alias="isActive")


class LocationCreateRequest(CamelModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    kind: str = "internal"


class WarehouseResponse(CamelModel):
    id: str
    code: str
    name: str
    address: str | None = None
    is_active: bool = Field(alias="isActive")
    locations: list[LocationResponse] = []


class WarehouseCreateRequest(CamelModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = None


# ---------------------------------------------------------------------------
# Partners
# ---------------------------------------------------------------------------

class PartnerResponse(CamelModel):
    id: str
    name: str
    kind: str
    is_active: bool = Field(alias="isActive")


class PartnerCreateRequest(CamelModel):
    name: str = Field(..., min_length=1, max_length=255)
    kind: str = "supplier"


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

class ProductCreateRequest(CamelModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    category_id: str = Field(alias="categoryId")
    unit: str = Field(..., min_length=1, max_length=50)
    unit_cost: str = Field(alias="unitCost", default="0")
    reorder_point: str = Field(alias="reorderPoint", default="0")
    initial_stock: str | None = Field(None, alias="initialStock")

    @field_validator("reorder_point")
    @classmethod
    def validate_reorder_point(cls, v: str) -> str:
        d = Decimal(v)
        if d < 0:
            raise ValueError("Reorder point must be >= 0")
        return v

    @field_validator("unit_cost")
    @classmethod
    def validate_unit_cost(cls, v: str) -> str:
        d = Decimal(v)
        if d < 0:
            raise ValueError("Unit cost must be >= 0")
        return v


class ProductUpdateRequest(CamelModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=100)
    category_id: str | None = Field(None, alias="categoryId")
    unit: str | None = Field(None, min_length=1, max_length=50)
    unit_cost: str | None = Field(None, alias="unitCost")
    reorder_point: str | None = Field(None, alias="reorderPoint")


class BalanceResponse(CamelModel):
    location_id: str = Field(alias="locationId")
    location_name: str = Field(alias="locationName")
    warehouse_name: str = Field(alias="warehouseName")
    on_hand: str = Field(alias="onHand")
    free_to_use: str = Field(alias="freeToUse")


class ProductSummaryResponse(CamelModel):
    id: str
    name: str
    sku: str
    category_name: str = Field(alias="categoryName")
    unit: str
    unit_cost: str = Field(alias="unitCost")
    reorder_point: str = Field(alias="reorderPoint")
    on_hand: str = Field(alias="onHand")
    free_to_use: str = Field(alias="freeToUse")
    is_active: bool = Field(alias="isActive")


class ProductDetailResponse(CamelModel):
    id: str
    name: str
    sku: str
    category_id: str = Field(alias="categoryId")
    category_name: str = Field(alias="categoryName")
    unit: str
    unit_cost: str = Field(alias="unitCost")
    reorder_point: str = Field(alias="reorderPoint")
    on_hand_total: str = Field(alias="onHandTotal")
    free_to_use_total: str = Field(alias="freeToUseTotal")
    is_active: bool = Field(alias="isActive")
    balances: list[BalanceResponse] = []


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

class OperationLineRequest(CamelModel):
    product_id: str = Field(alias="productId")
    quantity: str = "0"
    # Adjustment-specific
    counted_quantity: str | None = Field(None, alias="countedQuantity")
    reason: str | None = None


class OperationCreateRequest(CamelModel):
    type: str
    partner_id: str | None = Field(None, alias="partnerId")
    source_location_id: str | None = Field(None, alias="sourceLocationId")
    destination_location_id: str | None = Field(None, alias="destinationLocationId")
    schedule_date: date | None = Field(None, alias="scheduleDate")
    note: str | None = None
    lines: list[OperationLineRequest] = Field(..., min_length=1)


class OperationLineResponse(CamelModel):
    id: str
    product_id: str = Field(alias="productId")
    product_name: str = Field(alias="productName")
    product_sku: str = Field(alias="productSku")
    partner_name: str | None = Field(None, alias="partnerName")
    quantity: str
    counted_quantity: str | None = Field(None, alias="countedQuantity")
    previous_quantity: str | None = Field(None, alias="previousQuantity")
    delta: str | None = None
    reason: str | None = None
    is_short: bool = Field(False, alias="isShort")


class OperationSummaryResponse(CamelModel):
    id: str
    reference: str
    type: str
    status: str
    partner_name: str | None = Field(None, alias="partnerName")
    source_location_name: str | None = Field(None, alias="sourceLocationName")
    destination_location_name: str | None = Field(None, alias="destinationLocationName")
    schedule_date: date | None = Field(None, alias="scheduleDate")
    created_by_name: str = Field(alias="createdByName")
    created_at: datetime = Field(alias="createdAt")
    line_count: int = Field(alias="lineCount")
    is_late: bool = Field(False, alias="isLate")


class OperationDetailResponse(CamelModel):
    id: str
    reference: str
    type: str
    status: str
    partner_id: str | None = Field(None, alias="partnerId")
    partner_name: str | None = Field(None, alias="partnerName")
    source_location_id: str | None = Field(None, alias="sourceLocationId")
    source_location_name: str | None = Field(None, alias="sourceLocationName")
    destination_location_id: str | None = Field(None, alias="destinationLocationId")
    destination_location_name: str | None = Field(None, alias="destinationLocationName")
    schedule_date: date | None = Field(None, alias="scheduleDate")
    note: str | None = None
    created_by: str = Field(alias="createdBy")
    created_by_name: str = Field(alias="createdByName")
    validated_by: str | None = Field(None, alias="validatedBy")
    validated_by_name: str | None = Field(None, alias="validatedByName")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    validated_at: datetime | None = Field(None, alias="validatedAt")
    canceled_at: datetime | None = Field(None, alias="canceledAt")
    is_late: bool = Field(False, alias="isLate")
    lines: list[OperationLineResponse] = []


# ---------------------------------------------------------------------------
# StockMove (Ledger)
# ---------------------------------------------------------------------------

class StockMoveResponse(CamelModel):
    id: str
    operation_id: str = Field(alias="operationId")
    reference: str
    type: str
    product_id: str = Field(alias="productId")
    product_name: str = Field(alias="productName")
    product_sku: str = Field(alias="productSku")
    from_location_name: str | None = Field(None, alias="fromLocationName")
    to_location_name: str | None = Field(None, alias="toLocationName")
    quantity: str
    signed_delta: str = Field(alias="signedDelta")
    actor_name: str = Field(alias="actorName")
    reason: str | None = None
    occurred_at: datetime = Field(alias="occurredAt")


# ---------------------------------------------------------------------------
# Dashboard — v2 blueprint shape
# ---------------------------------------------------------------------------

class ReceiptSummaryResponse(CamelModel):
    to_receive: int = Field(alias="toReceive")
    late: int
    total: int


class DeliverySummaryResponse(CamelModel):
    to_deliver: int = Field(alias="toDeliver")
    late: int
    waiting: int
    total: int


class LowStockItem(CamelModel):
    product_id: str = Field(alias="productId")
    product_name: str = Field(alias="productName")
    sku: str
    on_hand: str = Field(alias="onHand")
    reorder_point: str = Field(alias="reorderPoint")
    unit: str


class DashboardResponse(CamelModel):
    receipt_summary: ReceiptSummaryResponse = Field(alias="receiptSummary")
    delivery_summary: DeliverySummaryResponse = Field(alias="deliverySummary")
    low_stock: list[LowStockItem] = Field(alias="lowStock")
    recent_operations: list[OperationSummaryResponse] = Field(alias="recentOperations")
    active_product_count: int = Field(alias="activeProductCount")
    scheduled_transfers: int = Field(alias="scheduledTransfers")


# ---------------------------------------------------------------------------
# Paginated list wrapper
# ---------------------------------------------------------------------------

class PaginatedResponse(CamelModel):
    items: list = []
    next_cursor: str | None = Field(None, alias="nextCursor")
    total: int = 0
