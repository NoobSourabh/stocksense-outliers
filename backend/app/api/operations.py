"""
StockSense Backend - Operations API routes.

GET /operations, POST /operations, GET /operations/{id}, PATCH /operations/{id},
POST /operations/{id}/ready, POST /operations/{id}/validate, POST /operations/{id}/cancel
"""

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.core.errors import NotFoundError
from app.db.session import get_db
from app.models import OperationStatus, OperationType, User
from app.repositories import get_free_to_use_at_location, get_operation_by_id, list_operations
from app.schemas import (
    OperationCancelRequest,
    OperationCreateRequest,
    OperationDetailResponse,
    OperationLineResponse,
    OperationSummaryResponse,
    OperationUpdateRequest,
    PaginatedResponse,
)
from app.services.stock_service import (
    cancel_operation,
    create_stock_operation,
    mark_ready,
    update_operation,
    validate_operation,
)

router = APIRouter(prefix="/operations", tags=["operations"])


def _is_late(op) -> bool:
    if op.schedule_date is None:
        return False
    if op.status in (OperationStatus.DONE, OperationStatus.CANCELED):
        return False
    now = datetime.now(timezone.utc)
    if isinstance(op.schedule_date, datetime):
        sched = op.schedule_date if op.schedule_date.tzinfo else op.schedule_date.replace(tzinfo=timezone.utc)
        return sched < now
    return op.schedule_date < date.today()


def _summary_response(op) -> OperationSummaryResponse:
    return OperationSummaryResponse(
        id=str(op.id),
        reference=op.reference,
        type=op.type.value,
        status=op.status.value,
        partnerName=op.partner.name if op.partner else None,
        sourceLocationName=op.source_location.name if op.source_location else None,
        destinationLocationName=op.destination_location.name if op.destination_location else None,
        scheduleDate=op.schedule_date,
        createdByName=op.creator.name,
        createdAt=op.created_at,
        lineCount=len(op.lines),
        isLate=_is_late(op),
    )


async def _detail_response(op, db: AsyncSession | None = None) -> OperationDetailResponse:
    lines = []
    for line in op.lines:
        is_short = False
        if (
            db is not None
            and op.type == OperationType.DELIVERY
            and op.source_location_id
            and op.status in (OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY)
        ):
            free = await get_free_to_use_at_location(db, line.product_id, op.source_location_id, exclude_operation_id=op.id)
            is_short = line.quantity > free

        lines.append(
            OperationLineResponse(
                id=str(line.id),
                productId=str(line.product_id),
                productName=line.product.name if line.product else "",
                productSku=line.product.sku if line.product else "",
                quantity=str(line.quantity),
                countedQuantity=str(line.counted_quantity) if line.counted_quantity is not None else None,
                previousQuantity=str(line.previous_quantity) if line.previous_quantity is not None else None,
                delta=str(line.delta) if line.delta is not None else None,
                reason=line.reason,
                isShort=is_short,
            )
        )

    return OperationDetailResponse(
        id=str(op.id),
        reference=op.reference,
        type=op.type.value,
        status=op.status.value,
        partnerId=str(op.partner_id) if op.partner_id else None,
        partnerName=op.partner.name if op.partner else None,
        sourceLocationId=str(op.source_location_id) if op.source_location_id else None,
        sourceLocationName=op.source_location.name if op.source_location else None,
        destinationLocationId=str(op.destination_location_id) if op.destination_location_id else None,
        destinationLocationName=op.destination_location.name if op.destination_location else None,
        scheduleDate=op.schedule_date,
        note=op.note,
        createdBy=str(op.created_by),
        createdByName=op.creator.name,
        validatedBy=str(op.validated_by) if op.validated_by else None,
        validatedByName=op.validator.name if op.validator else None,
        createdAt=op.created_at,
        updatedAt=op.updated_at,
        validatedAt=op.validated_at,
        canceledAt=op.canceled_at,
        isLate=_is_late(op),
        lines=lines,
    )


@router.get("")
async def list_operations_route(
    type: str | None = Query(None),
    status: str | None = Query(None),
    warehouse_id: uuid.UUID | None = Query(None, alias="warehouseId"),
    search: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    ops, total, next_cursor = await list_operations(
        db,
        op_type=type,
        status=status,
        warehouse_id=warehouse_id,
        search=search,
        cursor=cursor,
        limit=limit,
    )
    items = [_summary_response(op) for op in ops]
    return PaginatedResponse(items=items, total=total, next_cursor=next_cursor)


@router.post("", status_code=201)
async def create_operation_route(
    body: OperationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> OperationDetailResponse:
    lines = [
        {
            "product_id": line.product_id,
            "quantity": line.quantity,
            "counted_quantity": line.counted_quantity,
            "reason": line.reason,
        }
        for line in body.lines
    ]
    op = await create_stock_operation(
        db,
        user_id=current_user.id,
        op_type=body.type,
        partner_id=body.partner_id,
        source_location_id=body.source_location_id,
        destination_location_id=body.destination_location_id,
        schedule_date=body.schedule_date,
        note=body.note,
        lines=lines,
    )
    # Reload with full relationships
    op = await get_operation_by_id(db, op.id)
    return await _detail_response(op, db)


@router.get("/{operation_id}")
async def get_operation_route(
    operation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> OperationDetailResponse:
    op = await get_operation_by_id(db, operation_id)
    if not op:
        raise NotFoundError("Operation", str(operation_id))
    return await _detail_response(op, db)


@router.patch("/{operation_id}")
async def update_operation_route(
    operation_id: uuid.UUID,
    body: OperationUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> OperationDetailResponse:
    lines = None
    if body.lines is not None:
        lines = [
            {
                "product_id": line.product_id,
                "quantity": line.quantity,
                "counted_quantity": line.counted_quantity,
                "reason": line.reason,
            }
            for line in body.lines
        ]
    op = await update_operation(
        db,
        operation_id=operation_id,
        partner_id=body.partner_id,
        source_location_id=body.source_location_id,
        destination_location_id=body.destination_location_id,
        schedule_date=body.schedule_date,
        note=body.note,
        lines=lines,
    )
    op = await get_operation_by_id(db, op.id)
    return await _detail_response(op, db)


@router.post("/{operation_id}/ready")
async def ready_route(
    operation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> OperationDetailResponse:
    op = await mark_ready(db, operation_id)
    op = await get_operation_by_id(db, op.id)
    return await _detail_response(op, db)


@router.post("/{operation_id}/validate")
async def validate_route(
    operation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> OperationDetailResponse:
    op = await validate_operation(db, operation_id, current_user.id)
    op = await get_operation_by_id(db, op.id)
    return await _detail_response(op, db)


@router.post("/{operation_id}/cancel")
async def cancel_route(
    operation_id: uuid.UUID,
    body: OperationCancelRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> OperationDetailResponse:
    reason = body.reason if body else None
    op = await cancel_operation(db, operation_id, reason=reason)
    op = await get_operation_by_id(db, op.id)
    return await _detail_response(op, db)
