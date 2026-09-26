"""
StockSense Backend - Reference data API routes.

GET /categories, GET /warehouses, GET /partners
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.db.session import get_db
from app.models import User
from app.repositories import list_categories, list_partners, list_warehouses
from app.schemas import (
    CategoryResponse,
    LocationResponse,
    PaginatedResponse,
    PartnerResponse,
    WarehouseResponse,
)

router = APIRouter(tags=["config"])


@router.get("/categories")
async def list_categories_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    categories = await list_categories(db)
    items = [
        CategoryResponse(id=str(c.id), code=c.code, name=c.name, isActive=c.is_active)
        for c in categories
    ]
    return PaginatedResponse(items=items, total=len(items))


@router.get("/warehouses")
async def list_warehouses_route(
    include_locations: bool = Query(False, alias="includeLocations"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    warehouses = await list_warehouses(db, include_locations=include_locations)
    items = []
    for w in warehouses:
        locations = []
        if include_locations and w.locations:
            locations = [
                LocationResponse(
                    id=str(loc.id),
                    warehouseId=str(loc.warehouse_id),
                    code=loc.code,
                    name=loc.name,
                    kind=loc.kind.value,
                    isActive=loc.is_active,
                )
                for loc in w.locations
            ]
        items.append(
            WarehouseResponse(
                id=str(w.id), code=w.code, name=w.name,
                address=w.address, isActive=w.is_active,
                locations=locations,
            )
        )
    return PaginatedResponse(items=items, total=len(items))


@router.get("/partners")
async def list_partners_route(
    kind: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    partners = await list_partners(db, kind=kind, search=search)
    items = [
        PartnerResponse(id=str(p.id), name=p.name, kind=p.kind.value, isActive=p.is_active)
        for p in partners
    ]
    return PaginatedResponse(items=items, total=len(items))
