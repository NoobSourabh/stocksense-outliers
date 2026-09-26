"""
StockSense Backend - Dashboard service.

Aggregates receipt/delivery summaries, low-stock items, and recent operations
per the v2 blueprint dashboard shape.
"""

from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OperationStatus, OperationType
from app.repositories import (
    get_delivery_summary,
    get_receipt_summary,
    list_low_stock_products,
    list_operations,
)
from app.schemas import (
    DashboardResponse,
    DeliverySummaryResponse,
    LowStockItem,
    OperationSummaryResponse,
    ReceiptSummaryResponse,
)


def _is_late(op) -> bool:
    """Schedule date < now/today and not done/canceled."""
    if op.schedule_date is None:
        return False
    if op.status in (OperationStatus.DONE, OperationStatus.CANCELED):
        return False
    if isinstance(op.schedule_date, datetime):
        sched = op.schedule_date if op.schedule_date.tzinfo else op.schedule_date.replace(tzinfo=timezone.utc)
        return sched < datetime.now(timezone.utc)
    return op.schedule_date < date.today()


async def get_dashboard(db: AsyncSession) -> DashboardResponse:
    """Build the full dashboard payload with receipt/delivery summary cards."""
    # Summary cards
    receipt_data = await get_receipt_summary(db)
    delivery_data = await get_delivery_summary(db)

    receipt_summary = ReceiptSummaryResponse(
        toReceive=receipt_data["to_receive"],
        late=receipt_data["late"],
        total=receipt_data["total"],
    )
    delivery_summary = DeliverySummaryResponse(
        toDeliver=delivery_data["to_deliver"],
        late=delivery_data["late"],
        waiting=delivery_data["waiting"],
        total=delivery_data["total"],
    )

    # Low stock list
    low_stock_items = await list_low_stock_products(db)
    low_stock = [
        LowStockItem(
            productId=str(item["product"].id),
            productName=item["product"].name,
            sku=item["product"].sku,
            onHand=str(item["on_hand"]),
            reorderPoint=str(item["product"].reorder_point),
            unit=item["product"].unit,
        )
        for item in low_stock_items
    ]

    # Recent operations (last 10)
    recent_ops = await list_operations(db, limit=10)
    recent = [
        OperationSummaryResponse(
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
        for op in recent_ops
    ]

    return DashboardResponse(
        receiptSummary=receipt_summary,
        deliverySummary=delivery_summary,
        lowStock=low_stock,
        recentOperations=recent,
    )
