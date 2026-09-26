"""
StockSense Backend - Dashboard API route.

GET /dashboard - KPIs, low-stock queue, recent operations.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.db.session import get_db
from app.models import User
from app.schemas import DashboardResponse
from app.services.dashboard_service import get_dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
async def dashboard_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> DashboardResponse:
    return await get_dashboard(db)
