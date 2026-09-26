"""
StockSense Backend - Dashboard API route.

GET /dashboard - KPIs, low-stock queue, recent operations.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.db.session import get_db
from app.models import OperationStatus, OperationType, User
from app.schemas import DashboardResponse
from app.services.dashboard_service import get_dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
async def dashboard_route(
    type: OperationType | None = Query(None),
    status: OperationStatus | None = Query(None),
    warehouse_id: uuid.UUID | None = Query(None, alias="warehouseId"),
    location_id: uuid.UUID | None = Query(None, alias="locationId"),
    category_id: uuid.UUID | None = Query(None, alias="categoryId"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> DashboardResponse:
    return await get_dashboard(
        db,
        op_type=type,
        status=status,
        warehouse_id=warehouse_id,
        location_id=location_id,
        category_id=category_id,
    )
