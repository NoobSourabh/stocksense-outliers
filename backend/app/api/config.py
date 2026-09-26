"""
StockSense Backend - Reference data API routes.

GET /categories, POST /categories (KUN-011)
GET /warehouses, POST /warehouses, POST /warehouses/{id}/locations, GET /locations (KUN-012)
GET /partners, POST /partners (KUN-013)
"""

import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.session import get_db
from app.models import (
    Category,
    Location,
    LocationKind,
    Partner,
    PartnerKind,
    User,
    UserRole,
    Warehouse,
)
from app.repositories import (
    create_category,
    create_location,
    create_partner,
    create_warehouse,
    get_category_by_code,
    get_location_by_id,
    get_location_by_warehouse_and_code,
    get_warehouse_by_code,
    get_warehouse_by_id,
    list_categories,
    list_locations,
    list_partners,
    list_warehouses,
)
from app.schemas import (
    CategoryCreateRequest,
    CategoryResponse,
    LocationCreateRequest,
    LocationResponse,
    PaginatedResponse,
    PartnerCreateRequest,
    PartnerResponse,
    WarehouseCreateRequest,
    WarehouseResponse,
)

router = APIRouter(tags=["config"])


# ---------------------------------------------------------------------------
# Categories (KUN-011)
# ---------------------------------------------------------------------------

@router.get("/categories")
async def list_categories_route(
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    categories = await list_categories(db, search=search)
    items = [
        CategoryResponse(id=str(c.id), code=c.code, name=c.name, isActive=c.is_active)
        for c in categories
    ]
    return PaginatedResponse(items=items, total=len(items))


@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category_route(
    body: CategoryCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> CategoryResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can create categories")

    normalized_code = body.code.strip().upper()
    existing = await get_category_by_code(db, normalized_code)
    if existing:
        raise ConflictError(
            code="DUPLICATE_CATEGORY_CODE",
            message=f"Category with code '{normalized_code}' already exists",
        )

    cat = Category(
        code=normalized_code,
        name=body.name.strip(),
        is_active=True,
    )
    await create_category(db, cat)
    await db.commit()
    await db.refresh(cat)

    return CategoryResponse(
        id=str(cat.id),
        code=cat.code,
        name=cat.name,
        isActive=cat.is_active,
    )


# ---------------------------------------------------------------------------
# Warehouses & Locations (KUN-012)
# ---------------------------------------------------------------------------

@router.get("/warehouses")
async def list_warehouses_route(
    include_locations: bool = Query(True, alias="includeLocations"),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    warehouses = await list_warehouses(db, include_locations=include_locations, search=search)
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
                if loc.is_active
            ]
        items.append(
            WarehouseResponse(
                id=str(w.id),
                code=w.code,
                name=w.name,
                address=w.address,
                isActive=w.is_active,
                locations=locations,
            )
        )
    return PaginatedResponse(items=items, total=len(items))


@router.post("/warehouses", status_code=status.HTTP_201_CREATED)
async def create_warehouse_route(
    body: WarehouseCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> WarehouseResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can create warehouses")

    normalized_code = body.code.strip().upper()
    existing = await get_warehouse_by_code(db, normalized_code)
    if existing:
        raise ConflictError(
            code="DUPLICATE_WAREHOUSE_CODE",
            message=f"Warehouse with code '{normalized_code}' already exists",
        )

    warehouse = Warehouse(
        code=normalized_code,
        name=body.name.strip(),
        address=body.address.strip() if body.address else None,
        is_active=True,
    )
    await create_warehouse(db, warehouse)
    await db.commit()
    await db.refresh(warehouse)

    return WarehouseResponse(
        id=str(warehouse.id),
        code=warehouse.code,
        name=warehouse.name,
        address=warehouse.address,
        isActive=warehouse.is_active,
        locations=[],
    )


@router.get("/warehouses/{id}")
async def get_warehouse_route(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> WarehouseResponse:
    w = await get_warehouse_by_id(db, id)
    if not w:
        raise NotFoundError("Warehouse", str(id))

    locations = [
        LocationResponse(
            id=str(loc.id),
            warehouseId=str(loc.warehouse_id),
            code=loc.code,
            name=loc.name,
            kind=loc.kind.value,
            isActive=loc.is_active,
        )
        for loc in (w.locations or [])
        if loc.is_active
    ]
    return WarehouseResponse(
        id=str(w.id),
        code=w.code,
        name=w.name,
        address=w.address,
        isActive=w.is_active,
        locations=locations,
    )


@router.post("/warehouses/{id}/locations", status_code=status.HTTP_201_CREATED)
async def create_location_route(
    id: uuid.UUID,
    body: LocationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> LocationResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can create locations")

    warehouse = await get_warehouse_by_id(db, id)
    if not warehouse:
        raise NotFoundError("Warehouse", str(id))

    normalized_code = body.code.strip().upper()
    existing = await get_location_by_warehouse_and_code(db, id, normalized_code)
    if existing:
        raise ConflictError(
            code="DUPLICATE_LOCATION_CODE",
            message=f"Location with code '{normalized_code}' already exists in warehouse '{warehouse.code}'",
        )

    clean_kind = body.kind.strip().lower()
    try:
        loc_kind = LocationKind(clean_kind)
    except ValueError:
        raise ValidationError(
            f"Invalid location kind '{body.kind}'. Allowed values: internal, external"
        )

    loc = Location(
        warehouse_id=id,
        code=normalized_code,
        name=body.name.strip(),
        kind=loc_kind,
        is_active=True,
    )
    await create_location(db, loc)
    await db.commit()
    await db.refresh(loc)

    return LocationResponse(
        id=str(loc.id),
        warehouseId=str(loc.warehouse_id),
        code=loc.code,
        name=loc.name,
        kind=loc.kind.value,
        isActive=loc.is_active,
    )


@router.get("/locations")
async def list_locations_route(
    warehouse_id: uuid.UUID | None = Query(None, alias="warehouseId"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    locations = await list_locations(db, warehouse_id=warehouse_id)
    items = [
        LocationResponse(
            id=str(loc.id),
            warehouseId=str(loc.warehouse_id),
            code=loc.code,
            name=loc.name,
            kind=loc.kind.value,
            isActive=loc.is_active,
        )
        for loc in locations
    ]
    return PaginatedResponse(items=items, total=len(items))


@router.get("/locations/{id}")
async def get_location_route(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> LocationResponse:
    loc = await get_location_by_id(db, id)
    if not loc:
        raise NotFoundError("Location", str(id))

    return LocationResponse(
        id=str(loc.id),
        warehouseId=str(loc.warehouse_id),
        code=loc.code,
        name=loc.name,
        kind=loc.kind.value,
        isActive=loc.is_active,
    )


# ---------------------------------------------------------------------------
# Partners (KUN-013)
# ---------------------------------------------------------------------------

@router.get("/partners")
async def list_partners_route(
    kind: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    partners = await list_partners(db, kind=kind, search=search)
    items = [
        PartnerResponse(
            id=str(p.id),
            name=p.name,
            kind=p.kind.value,
            isActive=p.is_active,
        )
        for p in partners
    ]
    return PaginatedResponse(items=items, total=len(items))


@router.post("/partners", status_code=status.HTTP_201_CREATED)
async def create_partner_route(
    body: PartnerCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PartnerResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can create partners")

    clean_kind = body.kind.strip().lower()
    try:
        partner_kind = PartnerKind(clean_kind)
    except ValueError:
        raise ValidationError(
            f"Invalid partner kind '{body.kind}'. Allowed values: supplier, customer, both"
        )

    partner = Partner(
        name=body.name.strip(),
        kind=partner_kind,
        is_active=True,
    )
    await create_partner(db, partner)
    await db.commit()
    await db.refresh(partner)

    return PartnerResponse(
        id=str(partner.id),
        name=partner.name,
        kind=partner.kind.value,
        isActive=partner.is_active,
    )

