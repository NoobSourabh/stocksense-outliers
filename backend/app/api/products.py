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
    CategoryBrief,
    PaginatedResponse,
    ProductAvailabilityResponse,
    ProductCreateRequest,
    ProductDetailResponse,
    ProductSummaryResponse,
    ProductUpdateRequest,
)
from app.services.stock_service import (
    create_stock_operation,
    mark_ready,
    validate_operation,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products_route(
    search: str | None = Query(None),
    category_id: str | None = Query(None, alias="categoryId"),
    stock_state: str | None = Query(None, alias="stockState"),
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> PaginatedResponse:
    products = await list_products(db, search=search, category_id=category_id)
    items = []
    for p in products:
        on_hand = await get_total_on_hand(db, p.id)
        free = await get_total_free_to_use(db, p.id)

        # Filter by stockState if requested
        if stock_state:
            clean_state = stock_state.strip().lower()
            if clean_state == "out_of_stock" and on_hand > Decimal("0"):
                continue
            elif clean_state == "low_stock" and not (Decimal("0") < on_hand <= p.reorder_point):
                continue
            elif clean_state == "in_stock" and on_hand <= Decimal("0"):
                continue

        category_brief = (
            CategoryBrief(
                id=str(p.category.id),
                code=p.category.code,
                name=p.category.name,
            )
            if p.category
            else None
        )

        items.append(
            ProductSummaryResponse(
                id=str(p.id),
                name=p.name,
                sku=p.sku,
                category=category_brief,
                categoryName=p.category.name if p.category else "",
                unit=p.unit,
                unitCost=str(p.unit_cost),
                reorderPoint=str(p.reorder_point),
                onHand=str(on_hand),
                freeToUse=str(free),
                isActive=p.is_active,
            )
        )

    # Apply limit
    limited_items = items[:limit]
    return PaginatedResponse(items=limited_items, total=len(items))


@router.post("", status_code=201)
async def create_product_route(
    body: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> ProductDetailResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can create products")

    # Check duplicate SKU
    normalized_sku = body.sku.strip().upper()
    existing = await get_product_by_sku(db, normalized_sku)
    if existing:
        raise ConflictError("DUPLICATE_SKU", f"SKU '{body.sku}' already exists", {"sku": "Already in use"})

    product = Product(
        name=body.name,
        sku=normalized_sku,
        category_id=uuid.UUID(body.category_id),
        unit=body.unit,
        unit_cost=Decimal(body.unit_cost),
        reorder_point=Decimal(body.reorder_point),
    )
    await create_product(db, product)
    product_id = product.id

    # Optional initial stock via an automatic adjustment move
    if body.initial_stock and Decimal(body.initial_stock.quantity) > Decimal("0"):
        op = await create_stock_operation(
            db,
            user_id=current_user.id,
            op_type="adjustment",
            partner_id=None,
            source_location_id=None,
            destination_location_id=body.initial_stock.location_id,
            schedule_date=None,
            note="Initial stock",
            lines=[
                {
                    "product_id": str(product_id),
                    "quantity": body.initial_stock.quantity,
                    "counted_quantity": body.initial_stock.quantity,
                    "reason": "Initial stock",
                }
            ],
        )
        await mark_ready(db, op.id)
        await validate_operation(db, op.id, current_user.id)

    product = await get_product_by_id(db, product_id)
    return await _product_detail_response(db, product)


@router.get("/{product_id}")
async def get_product_route(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> ProductDetailResponse:
    product = await get_product_by_id(db, product_id)
    if not product:
        raise NotFoundError("Product", str(product_id))
    return await _product_detail_response(db, product)


@router.patch("/{product_id}")
async def update_product_route(
    product_id: uuid.UUID,
    body: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> ProductDetailResponse:
    if current_user.role != UserRole.MANAGER:
        raise ForbiddenError("Only managers can edit products")

    product = await get_product_by_id(db, product_id)
    if not product:
        raise NotFoundError("Product", str(product_id))

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

    product = await get_product_by_id(db, product_id)
    return await _product_detail_response(db, product)


@router.get("/{product_id}/availability")
async def get_availability_route(
    product_id: uuid.UUID,
    warehouse_id: uuid.UUID | None = Query(None, alias="warehouseId"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
) -> ProductAvailabilityResponse:
    product = await get_product_by_id(db, product_id)
    if not product:
        raise NotFoundError("Product", str(product_id))

    on_hand_total = await get_total_on_hand(db, product.id)
    free_total = await get_total_free_to_use(db, product.id)

    locations = []
    for b in (product.balances or []):
        if warehouse_id and b.location and b.location.warehouse_id != warehouse_id:
            continue
        if b.on_hand_quantity > Decimal("0"):
            free = await get_free_to_use_at_location(db, product.id, b.location_id)
            locations.append(
                BalanceResponse(
                    locationId=str(b.location_id),
                    locationCode=b.location.code if b.location else "",
                    locationName=b.location.name if b.location else "",
                    warehouseName=b.location.warehouse.name if b.location and b.location.warehouse else "",
                    onHand=str(b.on_hand_quantity),
                    freeToUse=str(free),
                )
            )

    return ProductAvailabilityResponse(
        onHandTotal=str(on_hand_total),
        freeToUseTotal=str(free_total),
        locations=locations,
    )


async def _product_detail_response(db: AsyncSession, product: Product) -> ProductDetailResponse:
    on_hand_total = await get_total_on_hand(db, product.id)
    free_total = await get_total_free_to_use(db, product.id)

    balances = []
    for b in (product.balances or []):
        if b.on_hand_quantity > Decimal("0"):
            free = await get_free_to_use_at_location(db, product.id, b.location_id)
            balances.append(
                BalanceResponse(
                    locationId=str(b.location_id),
                    locationCode=b.location.code if b.location else "",
                    locationName=b.location.name if b.location else "",
                    warehouseName=b.location.warehouse.name if b.location and b.location.warehouse else "",
                    onHand=str(b.on_hand_quantity),
                    freeToUse=str(free),
                )
            )

    category_brief = (
        CategoryBrief(
            id=str(product.category.id),
            code=product.category.code,
            name=product.category.name,
        )
        if product.category
        else None
    )

    return ProductDetailResponse(
        id=str(product.id),
        name=product.name,
        sku=product.sku,
        categoryId=str(product.category_id),
        category=category_brief,
        categoryName=product.category.name if product.category else "",
        unit=product.unit,
        unitCost=str(product.unit_cost),
        reorderPoint=str(product.reorder_point),
        onHandTotal=str(on_hand_total),
        freeToUseTotal=str(free_total),
        isActive=product.is_active,
        balances=balances,
    )
