"""
StockSense Backend - Moves (Ledger) API routes.

GET /moves - Immutable audit ledger.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.db.session import get_db
from app.models import User
from app.repositories import list_moves
from app.schemas import PaginatedResponse, StockMoveResponse

router = APIRouter(prefix="/moves", tags=["moves"])


@router.get("")
async def list_moves_route(
    product_id: str | None = Query(None, alias="productId"),
    location_id: str | None = Query(None, alias="locationId"),
    type: str | None = Query(None),
    search: str | None = Query(None),
    from_date: date | None = Query(None, alias="fromDate"),
    to_date: date | None = Query(None, alias="toDate"),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    moves, total, next_cursor = await list_moves(
        db,
        product_id=product_id,
        location_id=location_id,
        op_type=type,
        search=search,
        from_date=from_date,
        to_date=to_date,
        cursor=cursor,
        limit=limit,
    )
    items = [
        StockMoveResponse(
            id=str(m.id),
            operationId=str(m.operation_id),
            reference=m.operation.reference if m.operation else "",
            type=m.operation.type.value if m.operation else "",
            status=m.operation.status.value if m.operation else "done",
            productId=str(m.product_id),
            productName=m.product.name if m.product else "",
            productSku=m.product.sku if m.product else "",
            partnerName=m.operation.partner.name if m.operation and m.operation.partner else None,
            fromLocationName=m.from_location.name if m.from_location else None,
            toLocationName=m.to_location.name if m.to_location else None,
            quantity=str(m.quantity),
            signedDelta=str(m.signed_delta),
            actorName=m.actor.name if m.actor else "",
            reason=m.reason,
            occurredAt=m.occurred_at,
        )
        for m in moves
    ]
    return PaginatedResponse(items=items, total=total, next_cursor=next_cursor)
