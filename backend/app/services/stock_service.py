"""
StockSense Backend - Stock service.

The ONLY code path allowed to mutate StockBalance or create StockMove rows.
Enforces all four stock invariants: receipt, delivery, transfer, adjustment.
Supports the delivery waiting state per v2 blueprint.
"""

import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.models import (
    OperationLine,
    OperationStatus,
    OperationType,
    StockMove,
    StockOperation,
)
from app.repositories import (
    create_move,
    create_operation,
    get_balance,
    get_free_to_use_at_location,
    get_location_by_id,
    get_operation_by_id,
    get_product_by_id,
    get_warehouse_by_id,
    next_reference,
    upsert_balance,
)


# Direction map for reference_sequences
_DIRECTION_MAP = {
    OperationType.RECEIPT: "IN",
    OperationType.DELIVERY: "OUT",
    OperationType.TRANSFER: "INT",
    OperationType.ADJUSTMENT: "ADJ",
}


def _normalize_schedule_datetime(val: datetime | date | None) -> datetime | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    return datetime.combine(val, time(0, 0), tzinfo=timezone.utc)


async def create_stock_operation(
    db: AsyncSession,
    user_id: uuid.UUID,
    op_type: str,
    partner_id: str | None,
    source_location_id: str | None,
    destination_location_id: str | None,
    schedule_date: datetime | date | None,
    note: str | None,
    lines: list[dict],
) -> StockOperation:
    """
    Create a draft stock operation with lines.
    Reference is server-generated as WH/IN/0001 style.
    """
    # Validate operation type
    try:
        op_type_enum = OperationType(op_type)
    except ValueError:
        raise ValidationError(f"Invalid operation type: {op_type}")

    # Parse UUIDs
    src_id = uuid.UUID(source_location_id) if source_location_id else None
    dst_id = uuid.UUID(destination_location_id) if destination_location_id else None
    p_id = uuid.UUID(partner_id) if partner_id else None

    # Validate locations based on type
    if op_type_enum == OperationType.RECEIPT:
        if not dst_id:
            raise ValidationError("Receipt requires a destination location", {"destinationLocationId": "Required"})
        if schedule_date is None:
            raise ValidationError("Receipt requires a schedule date", {"scheduleDate": "Required"})
        src_id = None  # Receipts: from vendor (external) to internal
    elif op_type_enum == OperationType.DELIVERY:
        if not src_id:
            raise ValidationError("Delivery requires a source location", {"sourceLocationId": "Required"})
        if schedule_date is None:
            raise ValidationError("Delivery requires a schedule date", {"scheduleDate": "Required"})
        dst_id = None  # Deliveries: from internal to customer (external)
    elif op_type_enum == OperationType.TRANSFER:
        if not src_id or not dst_id:
            raise ValidationError("Transfer requires both source and destination locations")
        if src_id == dst_id:
            raise ValidationError(
                "Source and destination must differ",
                {"destinationLocationId": "Must differ from source"},
            )
    elif op_type_enum == OperationType.ADJUSTMENT:
        if not src_id and not dst_id:
            raise ValidationError("Adjustment requires at least one location")

    # Validate locations exist and determine warehouse for reference
    warehouse_id = None
    if dst_id:
        loc = await get_location_by_id(db, dst_id)
        if not loc:
            raise NotFoundError("Location", str(dst_id))
        warehouse_id = loc.warehouse_id
    if src_id:
        loc = await get_location_by_id(db, src_id)
        if not loc:
            raise NotFoundError("Location", str(src_id))
        if warehouse_id is None:
            warehouse_id = loc.warehouse_id

    # Generate WH/IN/0001-style reference
    direction = _DIRECTION_MAP[op_type_enum]
    reference = await next_reference(db, warehouse_id, direction)

    # Build operation
    operation = StockOperation(
        reference=reference,
        type=op_type_enum,
        status=OperationStatus.DRAFT,
        partner_id=p_id,
        source_location_id=src_id,
        destination_location_id=dst_id,
        schedule_date=_normalize_schedule_datetime(schedule_date),
        note=note,
        created_by=user_id,
    )

    # Build lines
    for i, line_data in enumerate(lines):
        prod_id = uuid.UUID(line_data["product_id"])
        product = await get_product_by_id(db, prod_id)
        if not product:
            raise NotFoundError("Product", line_data["product_id"])

        qty = Decimal(line_data.get("quantity", "0"))
        counted_qty_str = line_data.get("counted_quantity")
        counted_qty = Decimal(counted_qty_str) if counted_qty_str else None

        if op_type_enum != OperationType.ADJUSTMENT and qty <= 0:
            raise ValidationError(
                "Quantity must be positive",
                {f"lines.{i}.quantity": "Must be > 0"},
            )

        op_line = OperationLine(
            product_id=prod_id,
            quantity=qty,
            counted_quantity=counted_qty,
            reason=line_data.get("reason"),
        )
        operation.lines.append(op_line)

    await create_operation(db, operation)
    return operation


async def mark_ready(db: AsyncSession, operation_id: uuid.UUID) -> StockOperation:
    """
    Transition an operation toward executable state.

    Receipt/Transfer/Adjustment: draft -> ready (checks stock for transfer).
    Delivery: draft -> ready or waiting (based on free-to-use coverage).
              waiting -> ready (recheck coverage).
    """
    op = await get_operation_by_id(db, operation_id)
    if not op:
        raise NotFoundError("Operation", str(operation_id))

    # Delivery can also transition from waiting
    allowed_from = [OperationStatus.DRAFT]
    if op.type == OperationType.DELIVERY:
        allowed_from.append(OperationStatus.WAITING)

    if op.status not in allowed_from:
        raise ConflictError(
            "INVALID_STATE",
            f"Operation is {op.status.value}, expected {' or '.join(s.value for s in allowed_from)}"
        )

    if not op.lines:
        raise ValidationError("Operation must have at least one line")

    now = datetime.now(timezone.utc)

    if op.type == OperationType.DELIVERY:
        # Check free-to-use for each line — never hard error, use waiting
        any_short = False
        for line in op.lines:
            free = await get_free_to_use_at_location(db, line.product_id, op.source_location_id, exclude_operation_id=op.id)
            if line.quantity > free:
                any_short = True
                # is_short is computed at response time, not stored

        if any_short:
            op.status = OperationStatus.WAITING
        else:
            op.status = OperationStatus.READY

    elif op.type == OperationType.TRANSFER:
        # Check source availability
        for line in op.lines:
            balance = await get_balance(db, line.product_id, op.source_location_id)
            available = balance.on_hand_quantity if balance else Decimal("0")
            if line.quantity > available:
                raise ConflictError(
                    "INSUFFICIENT_STOCK",
                    f"Only {available} available for {line.product.sku}",
                    {f"lines.{op.lines.index(line)}.quantity": f"Must be {available} or less"},
                )
        op.status = OperationStatus.READY
    else:
        # Receipt and adjustment go straight to ready
        op.status = OperationStatus.READY

    op.updated_at = now
    await db.flush()
    return op


async def validate_operation(db: AsyncSession, operation_id: uuid.UUID, actor_id: uuid.UUID) -> StockOperation:
    """
    Atomically validate an operation: post stock mutations and create ledger entries.
    This is the ONLY function that may mutate StockBalance or create StockMove.

    Idempotent: if already done, returns the completed operation without reposting.
    """
    op = await get_operation_by_id(db, operation_id)
    if not op:
        raise NotFoundError("Operation", str(operation_id))

    # Idempotent: already done
    if op.status == OperationStatus.DONE:
        return op

    if op.status != OperationStatus.READY:
        raise ConflictError("INVALID_STATE", f"Operation is {op.status.value}, expected ready")

    now = datetime.now(timezone.utc)

    for line in op.lines:
        if op.type == OperationType.RECEIPT:
            # Increase destination balance
            await upsert_balance(db, line.product_id, op.destination_location_id, line.quantity)
            await create_move(db, StockMove(
                operation_id=op.id,
                line_id=line.id,
                product_id=line.product_id,
                from_location_id=None,
                to_location_id=op.destination_location_id,
                quantity=line.quantity,
                signed_delta=line.quantity,
                actor_id=actor_id,
                occurred_at=now,
            ))

        elif op.type == OperationType.DELIVERY:
            # Decrease source balance — check on-hand (not just free-to-use)
            balance = await get_balance(db, line.product_id, op.source_location_id)
            available = balance.on_hand_quantity if balance else Decimal("0")
            if line.quantity > available:
                raise ConflictError(
                    "INSUFFICIENT_STOCK",
                    f"Only {available} available for product {line.product_id}",
                )
            await upsert_balance(db, line.product_id, op.source_location_id, -line.quantity)
            await create_move(db, StockMove(
                operation_id=op.id,
                line_id=line.id,
                product_id=line.product_id,
                from_location_id=op.source_location_id,
                to_location_id=None,
                quantity=line.quantity,
                signed_delta=-line.quantity,
                actor_id=actor_id,
                occurred_at=now,
            ))

        elif op.type == OperationType.TRANSFER:
            # Debit source and credit destination atomically
            balance = await get_balance(db, line.product_id, op.source_location_id)
            available = balance.on_hand_quantity if balance else Decimal("0")
            if line.quantity > available:
                raise ConflictError(
                    "INSUFFICIENT_STOCK",
                    f"Only {available} available at source for product {line.product_id}",
                )
            await upsert_balance(db, line.product_id, op.source_location_id, -line.quantity)
            await upsert_balance(db, line.product_id, op.destination_location_id, line.quantity)
            await create_move(db, StockMove(
                operation_id=op.id,
                line_id=line.id,
                product_id=line.product_id,
                from_location_id=op.source_location_id,
                to_location_id=op.destination_location_id,
                quantity=line.quantity,
                signed_delta=Decimal("0"),  # Net zero for transfers
                actor_id=actor_id,
                occurred_at=now,
            ))

        elif op.type == OperationType.ADJUSTMENT:
            # Read current balance, calculate delta, set to counted value
            location_id = op.source_location_id or op.destination_location_id
            balance = await get_balance(db, line.product_id, location_id)
            previous_qty = balance.on_hand_quantity if balance else Decimal("0")
            counted_qty = line.counted_quantity if line.counted_quantity is not None else line.quantity
            delta = counted_qty - previous_qty

            # Update line with calculated values
            line.previous_quantity = previous_qty
            line.counted_quantity = counted_qty
            line.delta = delta

            # Set balance to counted value
            await upsert_balance(db, line.product_id, location_id, Decimal("0"), set_quantity=counted_qty)

            # Only create a move if delta != 0
            if delta != 0:
                await create_move(db, StockMove(
                    operation_id=op.id,
                    line_id=line.id,
                    product_id=line.product_id,
                    from_location_id=location_id if delta < 0 else None,
                    to_location_id=location_id if delta > 0 else None,
                    quantity=abs(delta),
                    signed_delta=delta,
                    actor_id=actor_id,
                    reason=line.reason,
                    occurred_at=now,
                ))

    # Mark operation done
    op.status = OperationStatus.DONE
    op.validated_by = actor_id
    op.validated_at = now
    op.updated_at = now
    await db.flush()
    return op


async def cancel_operation(db: AsyncSession, operation_id: uuid.UUID, reason: str | None = None) -> StockOperation:
    """
    Cancel a draft, waiting, or ready operation. Done/canceled operations cannot be canceled.
    Canceling never moves stock.
    """
    op = await get_operation_by_id(db, operation_id)
    if not op:
        raise NotFoundError("Operation", str(operation_id))

    if op.status in (OperationStatus.DONE, OperationStatus.CANCELED):
        raise ConflictError("INVALID_STATE", f"Cannot cancel a {op.status.value} operation")

    now = datetime.now(timezone.utc)
    op.status = OperationStatus.CANCELED
    op.canceled_at = now
    op.updated_at = now
    if reason:
        op.note = (op.note or "") + f"\n[Canceled] {reason}"
    await db.flush()
    return op


async def update_operation(
    db: AsyncSession,
    operation_id: uuid.UUID,
    partner_id: str | None = None,
    source_location_id: str | None = None,
    destination_location_id: str | None = None,
    schedule_date: datetime | date | None = None,
    note: str | None = None,
    lines: list[dict] | None = None,
) -> StockOperation:
    """
    Update a draft or waiting operation.
    Done or canceled operations cannot be edited.
    """
    op = await get_operation_by_id(db, operation_id)
    if not op:
        raise NotFoundError("Operation", str(operation_id))

    if op.status in (OperationStatus.DONE, OperationStatus.CANCELED):
        raise ConflictError("INVALID_STATE", f"Cannot edit an operation in {op.status.value} status")

    if partner_id is not None:
        op.partner_id = uuid.UUID(partner_id) if partner_id else None
    if source_location_id is not None:
        src_id = uuid.UUID(source_location_id) if source_location_id else None
        if src_id:
            loc = await get_location_by_id(db, src_id)
            if not loc:
                raise NotFoundError("Location", str(src_id))
        op.source_location_id = src_id
    if destination_location_id is not None:
        dst_id = uuid.UUID(destination_location_id) if destination_location_id else None
        if dst_id:
            loc = await get_location_by_id(db, dst_id)
            if not loc:
                raise NotFoundError("Location", str(dst_id))
        op.destination_location_id = dst_id
    if schedule_date is not None:
        op.schedule_date = _normalize_schedule_datetime(schedule_date)
    if note is not None:
        op.note = note

    if lines is not None:
        op.lines.clear()
        for i, line_data in enumerate(lines):
            prod_id = uuid.UUID(line_data["product_id"])
            product = await get_product_by_id(db, prod_id)
            if not product:
                raise NotFoundError("Product", line_data["product_id"])

            qty = Decimal(line_data.get("quantity", "0"))
            counted_qty_str = line_data.get("counted_quantity")
            counted_qty = Decimal(counted_qty_str) if counted_qty_str else None

            if op.type != OperationType.ADJUSTMENT and qty <= 0:
                raise ValidationError(
                    "Quantity must be positive",
                    {f"lines.{i}.quantity": "Must be > 0"},
                )

            op_line = OperationLine(
                product_id=prod_id,
                quantity=qty,
                counted_quantity=counted_qty,
                reason=line_data.get("reason"),
            )
            op.lines.append(op_line)

    now = datetime.now(timezone.utc)
    op.updated_at = now
    await db.flush()
    return op
