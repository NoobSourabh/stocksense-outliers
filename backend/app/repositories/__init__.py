"""
StockSense Backend - Repository layer.

Thin database query functions. No business logic here — that belongs in services.
All IDs are uuid.UUID (PostgreSQL native UUID columns).
"""

import base64
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import case, func, or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload, selectinload

from app.models import (
    Category,
    Location,
    LocationKind,
    OperationLine,
    OperationStatus,
    OperationType,
    Partner,
    PartnerKind,
    Product,
    ReferenceSequence,
    StockBalance,
    StockMove,
    StockOperation,
    User,
    Warehouse,
)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

async def get_user_by_login_id(db: AsyncSession, login_id: str) -> User | None:
    """Find a user by login_id (case-insensitive)."""
    result = await db.execute(
        select(User).where(func.lower(User.login_id) == login_id.lower())
    )
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Find a user by email (case-insensitive)."""
    result = await db.execute(
        select(User).where(func.lower(User.email) == email.lower())
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: User) -> User:
    db.add(user)
    await db.flush()
    return user


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

async def list_categories(db: AsyncSession, search: str | None = None) -> list[Category]:
    stmt = select(Category).where(Category.is_active == True).order_by(Category.name)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            (Category.name.ilike(pattern)) | (Category.code.ilike(pattern))
        )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_category_by_code(db: AsyncSession, code: str) -> Category | None:
    result = await db.execute(
        select(Category).where(func.lower(Category.code) == code.strip().lower())
    )
    return result.scalar_one_or_none()


async def get_category_by_id(db: AsyncSession, category_id: uuid.UUID) -> Category | None:
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    return result.scalar_one_or_none()


async def create_category(db: AsyncSession, category: Category) -> Category:
    db.add(category)
    await db.flush()
    return category


# ---------------------------------------------------------------------------
# Warehouses & Locations
# ---------------------------------------------------------------------------

async def list_warehouses(
    db: AsyncSession, include_locations: bool = False, search: str | None = None
) -> list[Warehouse]:
    stmt = select(Warehouse).where(Warehouse.is_active == True).order_by(Warehouse.name)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where((Warehouse.name.ilike(pattern)) | (Warehouse.code.ilike(pattern)))
    if include_locations:
        stmt = stmt.options(selectinload(Warehouse.locations))
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def get_warehouse_by_id(db: AsyncSession, warehouse_id: uuid.UUID) -> Warehouse | None:
    result = await db.execute(
        select(Warehouse).options(selectinload(Warehouse.locations)).where(Warehouse.id == warehouse_id)
    )
    return result.scalar_one_or_none()


async def get_warehouse_by_code(db: AsyncSession, code: str) -> Warehouse | None:
    result = await db.execute(
        select(Warehouse).where(func.lower(Warehouse.code) == code.strip().lower())
    )
    return result.scalar_one_or_none()


async def create_warehouse(db: AsyncSession, warehouse: Warehouse) -> Warehouse:
    db.add(warehouse)
    await db.flush()
    return warehouse


async def get_location_by_id(db: AsyncSession, location_id: uuid.UUID) -> Location | None:
    result = await db.execute(
        select(Location).options(joinedload(Location.warehouse)).where(Location.id == location_id)
    )
    return result.scalar_one_or_none()


async def get_location_by_warehouse_and_code(
    db: AsyncSession, warehouse_id: uuid.UUID, code: str
) -> Location | None:
    result = await db.execute(
        select(Location).where(
            Location.warehouse_id == warehouse_id,
            func.lower(Location.code) == code.strip().lower(),
        )
    )
    return result.scalar_one_or_none()


async def create_location(db: AsyncSession, location: Location) -> Location:
    db.add(location)
    await db.flush()
    return location


async def list_locations(
    db: AsyncSession, warehouse_id: uuid.UUID | None = None
) -> list[Location]:
    stmt = (
        select(Location)
        .options(joinedload(Location.warehouse))
        .where(Location.is_active == True)
        .order_by(Location.name)
    )
    if warehouse_id:
        stmt = stmt.where(Location.warehouse_id == warehouse_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Partners
# ---------------------------------------------------------------------------

async def list_partners(
    db: AsyncSession, kind: str | None = None, search: str | None = None
) -> list[Partner]:
    stmt = select(Partner).where(Partner.is_active == True).order_by(Partner.name)
    if kind:
        clean_kind = kind.strip().lower()
        if clean_kind == "supplier":
            stmt = stmt.where(Partner.kind.in_([PartnerKind.SUPPLIER, PartnerKind.BOTH]))
        elif clean_kind == "customer":
            stmt = stmt.where(Partner.kind.in_([PartnerKind.CUSTOMER, PartnerKind.BOTH]))
        elif clean_kind == "both":
            stmt = stmt.where(Partner.kind == PartnerKind.BOTH)
    if search:
        stmt = stmt.where(Partner.name.ilike(f"%{search.strip()}%"))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_partner(db: AsyncSession, partner: Partner) -> Partner:
    db.add(partner)
    await db.flush()
    return partner


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

async def list_products(db: AsyncSession, search: str | None = None, category_id: str | None = None) -> list[Product]:
    stmt = select(Product).where(Product.is_active == True).order_by(Product.name)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (Product.name.ilike(pattern)) | (Product.sku.ilike(pattern))
        )
    if category_id:
        stmt = stmt.where(Product.category_id == uuid.UUID(category_id))
    stmt = stmt.options(joinedload(Product.category))
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def get_product_by_id(db: AsyncSession, product_id: uuid.UUID) -> Product | None:
    result = await db.execute(
        select(Product)
        .options(
            joinedload(Product.category),
            selectinload(Product.balances).joinedload(StockBalance.location).joinedload(Location.warehouse),
        )
        .where(Product.id == product_id)
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def get_product_by_sku(db: AsyncSession, sku: str) -> Product | None:
    result = await db.execute(
        select(Product).where(func.lower(Product.sku) == sku.strip().lower())
    )
    return result.scalar_one_or_none()


async def create_product(db: AsyncSession, product: Product) -> Product:
    db.add(product)
    await db.flush()
    return product


async def get_total_on_hand(db: AsyncSession, product_id: uuid.UUID) -> Decimal:
    """Sum all on_hand balances for a product across locations."""
    result = await db.execute(
        select(func.coalesce(func.sum(StockBalance.on_hand_quantity), 0)).where(
            StockBalance.product_id == product_id
        )
    )
    return Decimal(str(result.scalar_one()))


async def get_total_free_to_use(
    db: AsyncSession,
    product_id: uuid.UUID,
    exclude_operation_id: uuid.UUID | None = None,
) -> Decimal:
    """
    Free-to-use = on_hand - reserved by open deliveries (waiting/ready status).
    Reserved = sum of operation_lines.quantity for delivery ops in waiting/ready.
    Optionally excludes a specific operation (e.g. the operation being evaluated).
    """
    on_hand = await get_total_on_hand(db, product_id)

    # Sum reserved quantity from open delivery lines
    stmt = (
        select(func.coalesce(func.sum(OperationLine.quantity), 0))
        .join(StockOperation, OperationLine.operation_id == StockOperation.id)
        .where(
            OperationLine.product_id == product_id,
            StockOperation.type == OperationType.DELIVERY,
            StockOperation.status.in_([OperationStatus.WAITING, OperationStatus.READY]),
        )
    )
    if exclude_operation_id:
        stmt = stmt.where(StockOperation.id != exclude_operation_id)
    reserved_result = await db.execute(stmt)
    reserved = Decimal(str(reserved_result.scalar_one()))
    free = on_hand - reserved
    return max(free, Decimal("0"))


async def get_free_to_use_at_location(
    db: AsyncSession,
    product_id: uuid.UUID,
    location_id: uuid.UUID,
    exclude_operation_id: uuid.UUID | None = None,
) -> Decimal:
    """
    Free-to-use for a specific product at a specific location.
    Optionally excludes a specific operation (e.g. the operation being evaluated).
    """
    balance = await get_balance(db, product_id, location_id)
    on_hand = balance.on_hand_quantity if balance else Decimal("0")

    stmt = (
        select(func.coalesce(func.sum(OperationLine.quantity), 0))
        .join(StockOperation, OperationLine.operation_id == StockOperation.id)
        .where(
            OperationLine.product_id == product_id,
            StockOperation.source_location_id == location_id,
            StockOperation.type == OperationType.DELIVERY,
            StockOperation.status.in_([OperationStatus.WAITING, OperationStatus.READY]),
        )
    )
    if exclude_operation_id:
        stmt = stmt.where(StockOperation.id != exclude_operation_id)
    reserved_result = await db.execute(stmt)
    reserved = Decimal(str(reserved_result.scalar_one()))
    return max(on_hand - reserved, Decimal("0"))


# ---------------------------------------------------------------------------
# Stock Balances
# ---------------------------------------------------------------------------

async def get_balance(db: AsyncSession, product_id: uuid.UUID, location_id: uuid.UUID) -> StockBalance | None:
    result = await db.execute(
        select(StockBalance).where(
            StockBalance.product_id == product_id,
            StockBalance.location_id == location_id,
        )
    )
    return result.scalar_one_or_none()


async def upsert_balance(
    db: AsyncSession,
    product_id: uuid.UUID,
    location_id: uuid.UUID,
    quantity_delta: Decimal,
    set_quantity: Decimal | None = None,
) -> StockBalance:
    """
    Atomically update a stock balance.
    If set_quantity is provided, sets the balance to that value (for adjustments).
    Otherwise, adds quantity_delta to the existing balance.
    """
    balance = await get_balance(db, product_id, location_id)
    if balance is None:
        new_qty = set_quantity if set_quantity is not None else quantity_delta
        if new_qty < 0:
            raise ValueError(f"Cannot set negative balance: {new_qty}")
        balance = StockBalance(
            product_id=product_id,
            location_id=location_id,
            on_hand_quantity=new_qty,
            version=1,
        )
        db.add(balance)
    else:
        if set_quantity is not None:
            if set_quantity < 0:
                raise ValueError(f"Cannot set negative balance: {set_quantity}")
            balance.on_hand_quantity = set_quantity
        else:
            new_qty = balance.on_hand_quantity + quantity_delta
            if new_qty < 0:
                raise ValueError(
                    f"Insufficient stock: available {balance.on_hand_quantity}, requested {abs(quantity_delta)}"
                )
            balance.on_hand_quantity = new_qty
        balance.version += 1
        balance.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return balance


# ---------------------------------------------------------------------------
# Reference sequences (WH/IN/0001 style)
# ---------------------------------------------------------------------------

async def next_reference(db: AsyncSession, warehouse_id: uuid.UUID, direction: str) -> str:
    """
    Atomically increment and return the next reference like WH/IN/0001.
    Uses SELECT ... FOR UPDATE to prevent duplicate references.
    """
    # Get warehouse code
    wh = await get_warehouse_by_id(db, warehouse_id)
    if not wh:
        raise ValueError(f"Warehouse {warehouse_id} not found")

    # Try to get existing sequence row with lock
    result = await db.execute(
        select(ReferenceSequence)
        .where(
            ReferenceSequence.warehouse_id == warehouse_id,
            ReferenceSequence.direction == direction,
        )
        .with_for_update()
    )
    seq = result.scalar_one_or_none()

    if seq is None:
        seq = ReferenceSequence(
            warehouse_id=warehouse_id,
            direction=direction,
            next_value=1,
        )
        db.add(seq)
        await db.flush()

    current = seq.next_value
    seq.next_value = current + 1
    await db.flush()

    return f"{wh.code}/{direction}/{current:04d}"


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

def encode_cursor(dt: datetime, record_id: uuid.UUID) -> str:
    iso = dt.isoformat()
    raw = f"{iso}|{str(record_id)}"
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("utf-8")


def decode_cursor(cursor_str: str) -> tuple[datetime, uuid.UUID] | None:
    try:
        raw = base64.urlsafe_b64decode(cursor_str.encode("utf-8")).decode("utf-8")
        dt_str, id_str = raw.split("|", 1)
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt, uuid.UUID(id_str)
    except Exception:
        return None


def _build_operation_filters(
    op_type: str | None = None,
    status: str | None = None,
    warehouse_id: uuid.UUID | None = None,
    search: str | None = None,
):
    where_clauses = []
    joins = []
    if op_type:
        where_clauses.append(StockOperation.type == op_type)
    if status:
        where_clauses.append(StockOperation.status == status)
    if warehouse_id:
        src_loc = aliased(Location)
        dst_loc = aliased(Location)
        joins.append((src_loc, StockOperation.source_location_id == src_loc.id))
        joins.append((dst_loc, StockOperation.destination_location_id == dst_loc.id))
        where_clauses.append((src_loc.warehouse_id == warehouse_id) | (dst_loc.warehouse_id == warehouse_id))
    if search:
        pattern = f"%{search.strip()}%"
        where_clauses.append(
            or_(
                StockOperation.reference.ilike(pattern),
                StockOperation.partner.has(Partner.name.ilike(pattern)),
            )
        )
    return where_clauses, joins


async def count_operations(
    db: AsyncSession,
    op_type: str | None = None,
    status: str | None = None,
    warehouse_id: uuid.UUID | None = None,
    search: str | None = None,
) -> int:
    where_clauses, joins = _build_operation_filters(op_type, status, warehouse_id, search)
    count_stmt = select(func.count(StockOperation.id.distinct()))
    for j_target, j_on in joins:
        count_stmt = count_stmt.outerjoin(j_target, j_on)
    if where_clauses:
        count_stmt = count_stmt.where(*where_clauses)
    result = await db.execute(count_stmt)
    return int(result.scalar_one() or 0)


async def list_operations(
    db: AsyncSession,
    op_type: str | None = None,
    status: str | None = None,
    warehouse_id: uuid.UUID | None = None,
    search: str | None = None,
    cursor: str | None = None,
    limit: int = 50,
) -> tuple[list[StockOperation], int, str | None]:
    where_clauses, joins = _build_operation_filters(op_type, status, warehouse_id, search)
    total = await count_operations(db, op_type, status, warehouse_id, search)

    stmt = (
        select(StockOperation)
        .options(
            joinedload(StockOperation.creator),
            joinedload(StockOperation.partner),
            joinedload(StockOperation.source_location),
            joinedload(StockOperation.destination_location),
            selectinload(StockOperation.lines),
        )
    )
    for j_target, j_on in joins:
        stmt = stmt.outerjoin(j_target, j_on)
    if where_clauses:
        stmt = stmt.where(*where_clauses)

    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            c_dt, c_id = decoded
            stmt = stmt.where(
                or_(
                    StockOperation.created_at < c_dt,
                    (StockOperation.created_at == c_dt) & (StockOperation.id < c_id),
                )
            )

    stmt = stmt.order_by(StockOperation.created_at.desc(), StockOperation.id.desc()).limit(limit + 1)
    result = await db.execute(stmt)
    rows = list(result.scalars().unique().all())

    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = encode_cursor(rows[-1].created_at, rows[-1].id)

    return rows, total, next_cursor


def _dashboard_operation_filters(
    op_type: OperationType | None = None,
    status: OperationStatus | None = None,
    warehouse_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
):
    filters = []
    if op_type:
        filters.append(StockOperation.type == op_type)
    if status:
        filters.append(StockOperation.status == status)
    if location_id:
        filters.append(
            (StockOperation.source_location_id == location_id)
            | (StockOperation.destination_location_id == location_id)
        )
    if warehouse_id:
        filters.append(
            select(Location.id)
            .where(
                Location.warehouse_id == warehouse_id,
                Location.id.in_((StockOperation.source_location_id, StockOperation.destination_location_id)),
            )
            .exists()
        )
    if category_id:
        filters.append(
            select(OperationLine.id)
            .join(Product, OperationLine.product_id == Product.id)
            .where(
                OperationLine.operation_id == StockOperation.id,
                Product.category_id == category_id,
            )
            .exists()
        )
    return filters


async def count_dashboard_operations(
    db: AsyncSession,
    op_type: OperationType | None = None,
    status: OperationStatus | None = None,
    warehouse_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
) -> dict[str, dict[str, int]]:
    filters = _dashboard_operation_filters(op_type, status, warehouse_id, location_id, category_id)
    terminal = StockOperation.status.in_([OperationStatus.DONE, OperationStatus.CANCELED])
    result = await db.execute(
        select(
            StockOperation.type,
            func.count(StockOperation.id),
            func.sum(case((~terminal, 1), else_=0)),
            func.sum(case((~terminal & (StockOperation.schedule_date < date.today()), 1), else_=0)),
            func.sum(case((StockOperation.status == OperationStatus.WAITING, 1), else_=0)),
        )
        .where(*filters)
        .group_by(StockOperation.type)
    )
    counts: dict[str, dict[str, int]] = {}
    for row_type, total, open_count, late, waiting in result.all():
        counts[row_type.value] = {
            "total": int(total or 0),
            "open": int(open_count or 0),
            "late": int(late or 0),
            "waiting": int(waiting or 0),
        }
    return counts


async def list_dashboard_operations(
    db: AsyncSession,
    op_type: OperationType | None = None,
    status: OperationStatus | None = None,
    warehouse_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    limit: int = 10,
) -> list[StockOperation]:
    filters = _dashboard_operation_filters(op_type, status, warehouse_id, location_id, category_id)
    result = await db.execute(
        select(StockOperation)
        .options(
            joinedload(StockOperation.creator),
            joinedload(StockOperation.partner),
            joinedload(StockOperation.source_location),
            joinedload(StockOperation.destination_location),
            selectinload(StockOperation.lines),
        )
        .where(*filters)
        .order_by(StockOperation.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().unique().all())


async def get_operation_by_id(db: AsyncSession, operation_id: uuid.UUID) -> StockOperation | None:
    result = await db.execute(
        select(StockOperation)
        .options(
            joinedload(StockOperation.creator),
            joinedload(StockOperation.validator),
            joinedload(StockOperation.partner),
            joinedload(StockOperation.source_location).joinedload(Location.warehouse),
            joinedload(StockOperation.destination_location).joinedload(Location.warehouse),
            selectinload(StockOperation.lines).joinedload(OperationLine.product),
            selectinload(StockOperation.moves),
        )
        .where(StockOperation.id == operation_id)
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def create_operation(db: AsyncSession, operation: StockOperation) -> StockOperation:
    db.add(operation)
    await db.flush()
    return operation


# ---------------------------------------------------------------------------
# Stock Moves (Ledger — insert/read only)
# ---------------------------------------------------------------------------

async def create_move(db: AsyncSession, move: StockMove) -> StockMove:
    db.add(move)
    await db.flush()
    return move


def _build_move_filters(
    product_id: str | None = None,
    location_id: str | None = None,
    op_type: str | None = None,
    search: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
):
    where_clauses = []
    joins = []
    if product_id:
        where_clauses.append(StockMove.product_id == uuid.UUID(product_id))
    if location_id:
        location_uuid = uuid.UUID(location_id)
        where_clauses.append(
            or_(StockMove.from_location_id == location_uuid, StockMove.to_location_id == location_uuid)
        )
    if op_type:
        joins.append((StockOperation, StockMove.operation_id == StockOperation.id))
        where_clauses.append(StockOperation.type == op_type)
    if from_date:
        where_clauses.append(StockMove.occurred_at >= datetime.combine(from_date, datetime.min.time(), tzinfo=timezone.utc))
    if to_date:
        where_clauses.append(
            StockMove.occurred_at
            < datetime.combine(to_date + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        )
    if search:
        pattern = f"%{search.strip()}%"
        where_clauses.append(
            or_(
                StockMove.operation.has(
                    or_(
                        StockOperation.reference.ilike(pattern),
                        StockOperation.partner.has(Partner.name.ilike(pattern)),
                    )
                ),
                StockMove.product.has(Product.name.ilike(pattern)),
                StockMove.product.has(Product.sku.ilike(pattern)),
            )
        )
    return where_clauses, joins


async def count_moves(
    db: AsyncSession,
    product_id: str | None = None,
    location_id: str | None = None,
    op_type: str | None = None,
    search: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
) -> int:
    where_clauses, joins = _build_move_filters(
        product_id=product_id,
        location_id=location_id,
        op_type=op_type,
        search=search,
        from_date=from_date,
        to_date=to_date,
    )
    count_stmt = select(func.count(StockMove.id.distinct()))
    for j_target, j_on in joins:
        count_stmt = count_stmt.join(j_target, j_on)
    if where_clauses:
        count_stmt = count_stmt.where(*where_clauses)
    result = await db.execute(count_stmt)
    return int(result.scalar_one() or 0)


async def list_moves(
    db: AsyncSession,
    product_id: str | None = None,
    location_id: str | None = None,
    op_type: str | None = None,
    search: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    cursor: str | None = None,
    limit: int = 50,
) -> tuple[list[StockMove], int, str | None]:
    where_clauses, joins = _build_move_filters(
        product_id=product_id,
        location_id=location_id,
        op_type=op_type,
        search=search,
        from_date=from_date,
        to_date=to_date,
    )
    total = await count_moves(
        db,
        product_id=product_id,
        location_id=location_id,
        op_type=op_type,
        search=search,
        from_date=from_date,
        to_date=to_date,
    )

    stmt = (
        select(StockMove)
        .options(
            joinedload(StockMove.operation).joinedload(StockOperation.partner),
            joinedload(StockMove.product),
            joinedload(StockMove.from_location),
            joinedload(StockMove.to_location),
            joinedload(StockMove.actor),
        )
    )
    for j_target, j_on in joins:
        stmt = stmt.join(j_target, j_on)
    if where_clauses:
        stmt = stmt.where(*where_clauses)

    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            c_dt, c_id = decoded
            if c_dt.tzinfo is None:
                c_dt = c_dt.replace(tzinfo=timezone.utc)
            stmt = stmt.where(
                or_(
                    StockMove.occurred_at < c_dt,
                    (StockMove.occurred_at == c_dt) & (StockMove.id < c_id),
                )
            )

    stmt = stmt.order_by(StockMove.occurred_at.desc(), StockMove.id.desc()).limit(limit + 1)
    result = await db.execute(stmt)
    rows = list(result.scalars().unique().all())

    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = encode_cursor(rows[-1].occurred_at, rows[-1].id)

    return rows, total, next_cursor


# ---------------------------------------------------------------------------
# Dashboard aggregations
# ---------------------------------------------------------------------------

async def count_active_products(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_active == True)
    )
    return result.scalar_one()


async def count_active_locations(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(Location).where(
            Location.is_active == True,
            Location.kind == "internal",
        )
    )
    return result.scalar_one()


async def get_receipt_summary(db: AsyncSession) -> dict:
    """Receipt summary: to_receive (not done/canceled), late, total."""
    now = datetime.now(timezone.utc)

    # Total non-terminal receipts
    total_result = await db.execute(
        select(func.count()).select_from(StockOperation).where(
            StockOperation.type == OperationType.RECEIPT,
            StockOperation.status.notin_([OperationStatus.DONE, OperationStatus.CANCELED]),
        )
    )
    total = total_result.scalar_one()

    # Late: schedule_date < now and not done/canceled
    late_result = await db.execute(
        select(func.count()).select_from(StockOperation).where(
            StockOperation.type == OperationType.RECEIPT,
            StockOperation.status.notin_([OperationStatus.DONE, OperationStatus.CANCELED]),
            StockOperation.schedule_date < now,
            StockOperation.schedule_date.isnot(None),
        )
    )
    late = late_result.scalar_one()

    return {"to_receive": total, "late": late, "total": total}


async def get_delivery_summary(db: AsyncSession) -> dict:
    """Delivery summary: to_deliver, late, waiting, total."""
    now = datetime.now(timezone.utc)

    total_result = await db.execute(
        select(func.count()).select_from(StockOperation).where(
            StockOperation.type == OperationType.DELIVERY,
            StockOperation.status.notin_([OperationStatus.DONE, OperationStatus.CANCELED]),
        )
    )
    total = total_result.scalar_one()

    late_result = await db.execute(
        select(func.count()).select_from(StockOperation).where(
            StockOperation.type == OperationType.DELIVERY,
            StockOperation.status.notin_([OperationStatus.DONE, OperationStatus.CANCELED]),
            StockOperation.schedule_date < now,
            StockOperation.schedule_date.isnot(None),
        )
    )
    late = late_result.scalar_one()

    waiting_result = await db.execute(
        select(func.count()).select_from(StockOperation).where(
            StockOperation.type == OperationType.DELIVERY,
            StockOperation.status == OperationStatus.WAITING,
        )
    )
    waiting = waiting_result.scalar_one()

    return {"to_deliver": total, "late": late, "waiting": waiting, "total": total}


async def count_active_dashboard_products(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_active == True)
    )
    return int(result.scalar_one())


async def list_low_stock_products(
    db: AsyncSession,
    warehouse_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
) -> list[dict]:
    """Return the complete low-stock queue at the selected stock scope."""
    balance_sub = (
        select(
            StockBalance.product_id,
            func.coalesce(func.sum(StockBalance.on_hand_quantity), 0).label("total_qty"),
        )
        .join(Location, Location.id == StockBalance.location_id)
        .group_by(StockBalance.product_id)
    )
    if warehouse_id:
        balance_sub = balance_sub.where(Location.warehouse_id == warehouse_id)
    if location_id:
        balance_sub = balance_sub.where(StockBalance.location_id == location_id)
    balance_sub = balance_sub.subquery()

    stmt = (
        select(Product, balance_sub.c.total_qty)
        .outerjoin(balance_sub, Product.id == balance_sub.c.product_id)
        .where(
            Product.is_active == True,
            func.coalesce(balance_sub.c.total_qty, 0) <= Product.reorder_point,
        )
        .order_by(func.coalesce(balance_sub.c.total_qty, 0).asc())
    )
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "product": row[0],
            "on_hand": Decimal(str(row[1])) if row[1] is not None else Decimal("0"),
        }
        for row in rows
    ]
