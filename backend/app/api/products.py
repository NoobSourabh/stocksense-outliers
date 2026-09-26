"""
StockSense Backend - Products API routes.

GET /products, POST /products, GET /products/{id}, PATCH /products/{id},
GET /products/{id}/availability
"""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.db.session import get_db
from app.models import Product, User, UserRole
from app.repositories import (
    create_product,
    get_free_to_use_at_location,
    get_product_by_id,
    get_product_by_sku,
    get_total_free_to_use,
    get_total_on_hand,
    list_products,
)
from app.schemas import (
    BalanceResponse,
    PaginatedResponse,
    ProductCreateRequest,
    ProductDetailResponse,
    ProductSummaryResponse,
    ProductUpdateRequest,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products_route(
    search: str | None = Query(None),
    category_id: str | None = Query(None, alias="categoryId"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    products = await list_products(db, search=search, category_id=category_id)
    items = []
    for p in products:
        on_hand = await get_total_on_hand(db, p.id)
        free = await get_total_free_to_use(db, p.id)
        items.append(
            ProductSummaryResponse(
                id=str(p.id),
                name=p.name,
                sku=p.sku,
                categoryName=p.category.name if p.category else "",
                unit=p.unit,
                unitCost=str(p.unit_cost),
                reorderPoint=str(p.reorder_point),
                onHand=str(on_hand),
                freeToUse=str(free),
                isActive=p.is_active,
            )
        )
    return PaginatedResponse(items=items, total=len(items))


@router.post("", status_code=201)
async def create_product_route(
    body: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> ProductDetailResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can create products")

    # Check duplicate SKU
    existing = await get_product_by_sku(db, body.sku)
    if existing:
        raise ConflictError("DUPLICATE_SKU", f"SKU '{body.sku}' already exists", {"sku": "Already in use"})

    product = Product(
        name=body.name,
        sku=body.sku.strip().upper(),
        category_id=uuid.UUID(body.category_id),
        unit=body.unit,
        unit_cost=Decimal(body.unit_cost),
        reorder_point=Decimal(body.reorder_point),
    )
    await create_product(db, product)

    # Reload with relationships
    product = await get_product_by_id(db, product.id)
    return await _product_detail_response(db, product)


@router.get("/{product_id}")
async def get_product_route(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> ProductDetailResponse:
    product = await get_product_by_id(db, uuid.UUID(product_id))
    if not product:
        raise NotFoundError("Product", product_id)
    return await _product_detail_response(db, product)


@router.patch("/{product_id}")
async def update_product_route(
    product_id: str,
    body: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> ProductDetailResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can edit products")

    product = await get_product_by_id(db, uuid.UUID(product_id))
    if not product:
        raise NotFoundError("Product", product_id)

    if body.sku is not None:
        normalized = body.sku.strip().upper()
        existing = await get_product_by_sku(db, normalized)
        if existing and existing.id != product.id:
            raise ConflictError("DUPLICATE_SKU", f"SKU '{body.sku}' already exists", {"sku": "Already in use"})
        product.sku = normalized

    if body.name is not None:
        product.name = body.name
    if body.category_id is not None:
        product.category_id = uuid.UUID(body.category_id)
    if body.unit is not None:
        product.unit = body.unit
    if body.unit_cost is not None:
        product.unit_cost = Decimal(body.unit_cost)
    if body.reorder_point is not None:
        product.reorder_point = Decimal(body.reorder_point)

    await db.flush()

    product = await get_product_by_id(db, product.id)
    return await _product_detail_response(db, product)


@router.get("/{product_id}/availability")
async def get_availability_route(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> dict:
    product = await get_product_by_id(db, uuid.UUID(product_id))
    if not product:
        raise NotFoundError("Product", product_id)

    on_hand_total = await get_total_on_hand(db, product.id)
    free_total = await get_total_free_to_use(db, product.id)

    locations = []
    for b in (product.balances or []):
        if b.on_hand_quantity > 0:
            free = await get_free_to_use_at_location(db, product.id, b.location_id)
            locations.append({
                "locationId": str(b.location_id),
                "locationName": b.location.name if b.location else "",
                "warehouseName": b.location.warehouse.name if b.location and b.location.warehouse else "",
                "onHand": str(b.on_hand_quantity),
                "freeToUse": str(free),
            })

    return {
        "onHandTotal": str(on_hand_total),
        "freeToUseTotal": str(free_total),
        "locations": locations,
    }


async def _product_detail_response(db: AsyncSession, product: Product) -> ProductDetailResponse:
    on_hand_total = await get_total_on_hand(db, product.id)
    free_total = await get_total_free_to_use(db, product.id)

    balances = []
    for b in (product.balances or []):
        if b.on_hand_quantity > 0:
            free = await get_free_to_use_at_location(db, product.id, b.location_id)
            balances.append(
                BalanceResponse(
                    locationId=str(b.location_id),
                    locationName=b.location.name if b.location else "",
                    warehouseName=b.location.warehouse.name if b.location and b.location.warehouse else "",
                    onHand=str(b.on_hand_quantity),
                    freeToUse=str(free),
                )
            )

    return ProductDetailResponse(
        id=str(product.id),
        name=product.name,
        sku=product.sku,
        categoryId=str(product.category_id),
        categoryName=product.category.name if product.category else "",
        unit=product.unit,
        unitCost=str(product.unit_cost),
        reorderPoint=str(product.reorder_point),
        onHandTotal=str(on_hand_total),
        freeToUseTotal=str(free_total),
        isActive=product.is_active,
        balances=balances,
    )
