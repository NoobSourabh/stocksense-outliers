"""
StockSense Backend - SQLAlchemy ORM models.

Full v2 blueprint schema: 11 tables for PostgreSQL 16.
UUID primary keys, ENUM types, NUMERIC(14,x), TIMESTAMPTZ.
"""

import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid() -> uuid.UUID:
    """Generate a new UUID4."""
    return uuid.uuid4()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Enums (match Postgres ENUM types from blueprint §10)
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    MANAGER = "manager"
    STAFF = "staff"


class PartnerKind(str, enum.Enum):
    SUPPLIER = "supplier"
    CUSTOMER = "customer"
    BOTH = "both"


class LocationKind(str, enum.Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"


class OperationType(str, enum.Enum):
    RECEIPT = "receipt"
    DELIVERY = "delivery"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"


class OperationStatus(str, enum.Enum):
    DRAFT = "draft"
    WAITING = "waiting"
    READY = "ready"
    DONE = "done"
    CANCELED = "canceled"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("char_length(login_id) BETWEEN 6 AND 12", name="ck_user_login_id_length"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    login_id: Mapped[str] = mapped_column(String(12), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=lambda x: [e.value for e in x], create_constraint=False),
        nullable=False,
        default=UserRole.STAFF,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    created_operations: Mapped[list["StockOperation"]] = relationship(
        back_populates="creator", foreign_keys="StockOperation.created_by"
    )
    validated_operations: Mapped[list["StockOperation"]] = relationship(
        back_populates="validator", foreign_keys="StockOperation.validated_by"
    )


# ---------------------------------------------------------------------------
# PasswordResetOTP (P1 — schema ready)
# ---------------------------------------------------------------------------

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[list["Product"]] = relationship(back_populates="category")


# ---------------------------------------------------------------------------
# Warehouse & Location
# ---------------------------------------------------------------------------

class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    locations: Mapped[list["Location"]] = relationship(back_populates="warehouse")


class Location(Base):
    __tablename__ = "locations"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "code", name="uq_location_warehouse_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[LocationKind] = mapped_column(
        Enum(LocationKind, name="location_kind", values_callable=lambda x: [e.value for e in x], create_constraint=False),
        nullable=False,
        default=LocationKind.INTERNAL,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    warehouse: Mapped["Warehouse"] = relationship(back_populates="locations")


# ---------------------------------------------------------------------------
# Partner
# ---------------------------------------------------------------------------

class Partner(Base):
    __tablename__ = "partners"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[PartnerKind] = mapped_column(
        Enum(PartnerKind, name="partner_kind", values_callable=lambda x: [e.value for e in x], create_constraint=False),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("reorder_point >= 0", name="ck_product_reorder_point"),
        CheckConstraint("unit_cost >= 0", name="ck_product_unit_cost"),
        Index("ix_products_category_active", "category_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, comment="Normalized uppercase SKU")
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    reorder_point: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False, default=Decimal("0"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    category: Mapped["Category"] = relationship(back_populates="products")
    balances: Mapped[list["StockBalance"]] = relationship(back_populates="product")


# ---------------------------------------------------------------------------
# StockBalance
# ---------------------------------------------------------------------------

class StockBalance(Base):
    __tablename__ = "stock_balances"
    __table_args__ = (
        CheckConstraint("on_hand_quantity >= 0", name="ck_balance_on_hand"),
        Index("ix_balance_location_product", "location_id", "product_id"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), primary_key=True
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("locations.id", ondelete="RESTRICT"), primary_key=True
    )
    on_hand_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False, default=Decimal("0"))
    version: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    product: Mapped["Product"] = relationship(back_populates="balances")
    location: Mapped["Location"] = relationship()


# ---------------------------------------------------------------------------
# StockOperation
# ---------------------------------------------------------------------------

class StockOperation(Base):
    __tablename__ = "stock_operations"
    __table_args__ = (
        Index("ix_operations_status_type_created", "status", "type", "created_at"),
        Index("ix_operations_schedule_date", "schedule_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    reference: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    type: Mapped[OperationType] = mapped_column(
        Enum(OperationType, name="operation_type", values_callable=lambda x: [e.value for e in x], create_constraint=False),
        nullable=False,
    )
    status: Mapped[OperationStatus] = mapped_column(
        Enum(OperationStatus, name="operation_status", values_callable=lambda x: [e.value for e in x], create_constraint=False),
        nullable=False,
        default=OperationStatus.DRAFT,
    )
    partner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("partners.id", ondelete="SET NULL"), nullable=True)
    source_location_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locations.id", ondelete="RESTRICT"), nullable=True)
    destination_location_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locations.id", ondelete="RESTRICT"), nullable=True)
    schedule_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    validated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator: Mapped["User"] = relationship(back_populates="created_operations", foreign_keys=[created_by])
    validator: Mapped["User | None"] = relationship(back_populates="validated_operations", foreign_keys=[validated_by])
    partner: Mapped["Partner | None"] = relationship()
    source_location: Mapped["Location | None"] = relationship(foreign_keys=[source_location_id])
    destination_location: Mapped["Location | None"] = relationship(foreign_keys=[destination_location_id])
    lines: Mapped[list["OperationLine"]] = relationship(back_populates="operation", cascade="all, delete-orphan")
    moves: Mapped[list["StockMove"]] = relationship(back_populates="operation")


# ---------------------------------------------------------------------------
# OperationLine
# ---------------------------------------------------------------------------

class OperationLine(Base):
    __tablename__ = "operation_lines"
    __table_args__ = (
        UniqueConstraint("operation_id", "product_id", name="uq_line_operation_product"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    operation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stock_operations.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False, default=Decimal("0"))
    # Adjustment-specific fields
    counted_quantity: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    previous_quantity: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    delta: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    operation: Mapped["StockOperation"] = relationship(back_populates="lines")
    product: Mapped["Product"] = relationship()


# ---------------------------------------------------------------------------
# StockMove (immutable ledger)
# ---------------------------------------------------------------------------

class StockMove(Base):
    __tablename__ = "stock_moves"
    __table_args__ = (
        Index("ix_moves_product_occurred", "product_id", "occurred_at"),
        Index("ix_moves_operation", "operation_id"),
        Index("ix_moves_actor", "actor_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    operation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stock_operations.id", ondelete="RESTRICT"), nullable=False)
    line_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("operation_lines.id", ondelete="RESTRICT"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    from_location_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locations.id", ondelete="RESTRICT"), nullable=True)
    to_location_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("locations.id", ondelete="RESTRICT"), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    signed_delta: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    operation: Mapped["StockOperation"] = relationship(back_populates="moves")
    line: Mapped["OperationLine"] = relationship()
    product: Mapped["Product"] = relationship()
    from_location: Mapped["Location | None"] = relationship(foreign_keys=[from_location_id])
    to_location: Mapped["Location | None"] = relationship(foreign_keys=[to_location_id])
    actor: Mapped["User"] = relationship()


# ---------------------------------------------------------------------------
# ReferenceSequence — backs WH/IN/0001-style auto-increment
# ---------------------------------------------------------------------------

class ReferenceSequence(Base):
    """
    Per-warehouse, per-direction auto-increment counter.
    SELECT ... FOR UPDATE inside the operation-create transaction
    to guarantee unique references under concurrency.
    """
    __tablename__ = "reference_sequences"

    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("warehouses.id", ondelete="CASCADE"), primary_key=True
    )
    direction: Mapped[str] = mapped_column(
        String(3), primary_key=True,
        comment="IN, OUT, INT, or ADJ"
    )
    next_value: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
