"""
StockSense Backend - Deterministic database seed for PostgreSQL.

Creates the exact demo scenario from v2 blueprint:
- 2 users (Maya: manager, Arjun: staff) with valid login_ids and complex passwords
- 2 warehouses with addresses
- 5 locations (internal racks, production, plus external locations for supplier/customer)
- Reference sequences initialized for WH-MAIN and WH-SEC
- 3 categories
- 4 products with unit_cost and initial stock balances
- 2 partners (supplier, customer)
- Seed operations:
  - 1 completed receipt (WH/IN/0001) + ledger entry
  - 1 completed delivery (WH/OUT/0001) + ledger entry
  - 1 ready receipt (WH/IN/0002)
  - 1 ready/waiting delivery (WH/OUT/0002)
  - 1 ready transfer (WH/INT/0001)
  - 1 ready adjustment (WH/ADJ/0001)

Run: python -m app.seed.seed_db
"""

import asyncio
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import async_session_factory, engine
from app.models import (
    Category,
    Location,
    LocationKind,
    OperationLine,
    OperationStatus,
    OperationType,
    Partner,
    PartnerKind,
    Product,
    ReferenceSequence,
    StockBalance,
    StockMove,
    StockOperation,
    User,
    UserRole,
    Warehouse,
)

# Stable UUIDs for reproducibility
MAYA_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
ARJUN_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")

WH_MAIN_ID = uuid.UUID("10000000-0000-0000-0000-000000000001")
WH_SEC_ID = uuid.UUID("10000000-0000-0000-0000-000000000002")

LOC_RACK_A_ID = uuid.UUID("20000000-0000-0000-0000-000000000001")
LOC_PROD_ID = uuid.UUID("20000000-0000-0000-0000-000000000002")
LOC_EXT_SUP_ID = uuid.UUID("20000000-0000-0000-0000-000000000003")
LOC_RACK_B_ID = uuid.UUID("20000000-0000-0000-0000-000000000004")
LOC_EXT_CUST_ID = uuid.UUID("20000000-0000-0000-0000-000000000005")

CAT_RAW_ID = uuid.UUID("30000000-0000-0000-0000-000000000001")
CAT_FURN_ID = uuid.UUID("30000000-0000-0000-0000-000000000002")
CAT_HW_ID = uuid.UUID("30000000-0000-0000-0000-000000000003")

PROD_STEEL_ID = uuid.UUID("40000000-0000-0000-0000-000000000001")
PROD_CHAIR_ID = uuid.UUID("40000000-0000-0000-0000-000000000002")
PROD_BOLT_ID = uuid.UUID("40000000-0000-0000-0000-000000000003")
PROD_FRAME_ID = uuid.UUID("40000000-0000-0000-0000-000000000004")

PARTNER_APEX_ID = uuid.UUID("50000000-0000-0000-0000-000000000001")
PARTNER_NORTHSTAR_ID = uuid.UUID("50000000-0000-0000-0000-000000000002")


async def seed(db: AsyncSession):
    """Populate the database with the deterministic v2 demo dataset."""
    now = datetime.now(timezone.utc)
    today = date.today()
    yesterday = now - timedelta(hours=24)
    two_days_ago = now - timedelta(hours=48)

    # 1. Users & Warehouses (top-level entities)
    maya = User(
        id=MAYA_ID,
        login_id="mayasharma",
        name="Maya Sharma",
        email="maya@stocksense.demo",
        password_hash=hash_password("StockSense@123"),
        role=UserRole.MANAGER,
        created_at=two_days_ago,
    )
    arjun = User(
        id=ARJUN_ID,
        login_id="arjunpatel",
        name="Arjun Patel",
        email="arjun@stocksense.demo",
        password_hash=hash_password("StockSense@123"),
        role=UserRole.STAFF,
        created_at=two_days_ago,
    )
    wh_main = Warehouse(
        id=WH_MAIN_ID,
        code="WH-MAIN",
        name="Main Warehouse",
        address="Building 4, Industrial Area, Sector 62",
    )
    wh_sec = Warehouse(
        id=WH_SEC_ID,
        code="WH-SEC",
        name="Secondary Warehouse",
        address="Plot 12, Logistics Park, Phase 2",
    )
    db.add_all([maya, arjun, wh_main, wh_sec])
    await db.flush()

    # 2. Locations, ReferenceSequences, Categories, Partners (depend on warehouses)
    loc_rack_a = Location(
        id=LOC_RACK_A_ID,
        warehouse_id=WH_MAIN_ID,
        code="RACK-A",
        name="Rack A",
        kind=LocationKind.INTERNAL,
    )
    loc_prod = Location(
        id=LOC_PROD_ID,
        warehouse_id=WH_MAIN_ID,
        code="PROD-RACK",
        name="Production Rack",
        kind=LocationKind.INTERNAL,
    )
    loc_ext_sup = Location(
        id=LOC_EXT_SUP_ID,
        warehouse_id=WH_MAIN_ID,
        code="EXT-SUP",
        name="Supplier Vendor Location",
        kind=LocationKind.EXTERNAL,
    )
    loc_rack_b = Location(
        id=LOC_RACK_B_ID,
        warehouse_id=WH_SEC_ID,
        code="RACK-B",
        name="Rack B",
        kind=LocationKind.INTERNAL,
    )
    loc_ext_cust = Location(
        id=LOC_EXT_CUST_ID,
        warehouse_id=WH_SEC_ID,
        code="EXT-CUST",
        name="Customer Delivery Location",
        kind=LocationKind.EXTERNAL,
    )
    db.add_all([loc_rack_a, loc_prod, loc_ext_sup, loc_rack_b, loc_ext_cust])

    sequences = [
        ReferenceSequence(warehouse_id=WH_MAIN_ID, direction="IN", next_value=3),
        ReferenceSequence(warehouse_id=WH_MAIN_ID, direction="OUT", next_value=3),
        ReferenceSequence(warehouse_id=WH_MAIN_ID, direction="INT", next_value=2),
        ReferenceSequence(warehouse_id=WH_MAIN_ID, direction="ADJ", next_value=2),
        ReferenceSequence(warehouse_id=WH_SEC_ID, direction="IN", next_value=1),
        ReferenceSequence(warehouse_id=WH_SEC_ID, direction="OUT", next_value=1),
        ReferenceSequence(warehouse_id=WH_SEC_ID, direction="INT", next_value=1),
        ReferenceSequence(warehouse_id=WH_SEC_ID, direction="ADJ", next_value=1),
    ]
    db.add_all(sequences)

    cat_raw = Category(id=CAT_RAW_ID, code="RAW", name="Raw Materials")
    cat_furniture = Category(id=CAT_FURN_ID, code="FURN", name="Furniture")
    cat_hardware = Category(id=CAT_HW_ID, code="HW", name="Hardware")
    db.add_all([cat_raw, cat_furniture, cat_hardware])

    apex = Partner(id=PARTNER_APEX_ID, name="Apex Metals", kind=PartnerKind.SUPPLIER)
    northstar = Partner(id=PARTNER_NORTHSTAR_ID, name="Northstar Offices", kind=PartnerKind.CUSTOMER)
    db.add_all([apex, northstar])
    await db.flush()

    # 3. Products (depend on categories)
    steel = Product(
        id=PROD_STEEL_ID,
        name="Steel Rods",
        sku="STL-ROD-10",
        category_id=CAT_RAW_ID,
        unit="kg",
        unit_cost=Decimal("45.00"),
        reorder_point=Decimal("25"),
        created_at=two_days_ago,
    )
    chair = Product(
        id=PROD_CHAIR_ID,
        name="Ergo Chair",
        sku="CHR-ERGO-01",
        category_id=CAT_FURN_ID,
        unit="units",
        unit_cost=Decimal("150.00"),
        reorder_point=Decimal("8"),
        created_at=two_days_ago,
    )
    bolt = Product(
        id=PROD_BOLT_ID,
        name="M8 Bolt Pack",
        sku="BOLT-M8-100",
        category_id=CAT_HW_ID,
        unit="packs",
        unit_cost=Decimal("12.50"),
        reorder_point=Decimal("10"),
        created_at=two_days_ago,
    )
    frame = Product(
        id=PROD_FRAME_ID,
        name="Frame Assembly",
        sku="FRAME-A2",
        category_id=CAT_HW_ID,
        unit="units",
        unit_cost=Decimal("85.00"),
        reorder_point=Decimal("12"),
        created_at=two_days_ago,
    )
    db.add_all([steel, chair, bolt, frame])
    await db.flush()

    # 4. Stock Balances (depend on products and locations)
    db.add_all([
        StockBalance(product_id=PROD_STEEL_ID, location_id=LOC_RACK_A_ID, on_hand_quantity=Decimal("60")),
        StockBalance(product_id=PROD_CHAIR_ID, location_id=LOC_RACK_A_ID, on_hand_quantity=Decimal("7")),
        # Bolt is out of stock (0)
        StockBalance(product_id=PROD_FRAME_ID, location_id=LOC_PROD_ID, on_hand_quantity=Decimal("34")),
    ])
    await db.flush()

    # 5. Stock Operations (depend on users, partners, locations)
    hist_receipt_id = uuid.UUID("60000000-0000-0000-0000-000000000001")
    hist_receipt = StockOperation(
        id=hist_receipt_id,
        reference="WH/IN/0001",
        type=OperationType.RECEIPT,
        status=OperationStatus.DONE,
        partner_id=PARTNER_APEX_ID,
        destination_location_id=LOC_RACK_A_ID,
        schedule_date=today - timedelta(days=1),
        created_by=MAYA_ID,
        validated_by=MAYA_ID,
        created_at=yesterday,
        validated_at=yesterday,
        updated_at=yesterday,
    )

    hist_delivery_id = uuid.UUID("60000000-0000-0000-0000-000000000002")
    hist_delivery = StockOperation(
        id=hist_delivery_id,
        reference="WH/OUT/0001",
        type=OperationType.DELIVERY,
        status=OperationStatus.DONE,
        partner_id=PARTNER_NORTHSTAR_ID,
        source_location_id=LOC_RACK_A_ID,
        destination_location_id=LOC_EXT_CUST_ID,
        schedule_date=today - timedelta(days=1),
        created_by=ARJUN_ID,
        validated_by=MAYA_ID,
        created_at=yesterday - timedelta(hours=2),
        validated_at=yesterday,
        updated_at=yesterday,
    )

    pending_receipt_id = uuid.UUID("60000000-0000-0000-0000-000000000003")
    pending_receipt = StockOperation(
        id=pending_receipt_id,
        reference="WH/IN/0002",
        type=OperationType.RECEIPT,
        status=OperationStatus.READY,
        partner_id=PARTNER_APEX_ID,
        destination_location_id=LOC_RACK_A_ID,
        schedule_date=today,
        note="PO-8821 — 100 kg Steel Rods from Apex Metals",
        created_by=MAYA_ID,
        created_at=now - timedelta(hours=1),
        updated_at=now - timedelta(minutes=30),
    )

    pending_transfer_id = uuid.UUID("60000000-0000-0000-0000-000000000004")
    pending_transfer = StockOperation(
        id=pending_transfer_id,
        reference="WH/INT/0001",
        type=OperationType.TRANSFER,
        status=OperationStatus.READY,
        source_location_id=LOC_RACK_A_ID,
        destination_location_id=LOC_PROD_ID,
        schedule_date=today,
        note="Move steel to production rack",
        created_by=MAYA_ID,
        created_at=now - timedelta(minutes=45),
        updated_at=now - timedelta(minutes=20),
    )

    pending_delivery_id = uuid.UUID("60000000-0000-0000-0000-000000000005")
    pending_delivery = StockOperation(
        id=pending_delivery_id,
        reference="WH/OUT/0002",
        type=OperationType.DELIVERY,
        status=OperationStatus.READY,
        partner_id=PARTNER_NORTHSTAR_ID,
        source_location_id=LOC_PROD_ID,
        destination_location_id=LOC_EXT_CUST_ID,
        schedule_date=today + timedelta(days=1),
        note="Ship 20 kg steel to Northstar Offices",
        created_by=ARJUN_ID,
        created_at=now - timedelta(minutes=30),
        updated_at=now - timedelta(minutes=15),
    )

    pending_adj_id = uuid.UUID("60000000-0000-0000-0000-000000000006")
    pending_adj = StockOperation(
        id=pending_adj_id,
        reference="WH/ADJ/0001",
        type=OperationType.ADJUSTMENT,
        status=OperationStatus.READY,
        source_location_id=LOC_PROD_ID,
        schedule_date=today,
        note="Physical count — steel rods in production",
        created_by=MAYA_ID,
        created_at=now - timedelta(minutes=15),
        updated_at=now - timedelta(minutes=10),
    )

    db.add_all([hist_receipt, hist_delivery, pending_receipt, pending_transfer, pending_delivery, pending_adj])
    await db.flush()

    # 6. Operation Lines (depend on operations and products)
    hist_receipt_line_id = uuid.UUID("70000000-0000-0000-0000-000000000001")
    hist_receipt_line = OperationLine(
        id=hist_receipt_line_id,
        operation_id=hist_receipt_id,
        product_id=PROD_CHAIR_ID,
        quantity=Decimal("15"),
    )
    hist_delivery_line_id = uuid.UUID("70000000-0000-0000-0000-000000000002")
    hist_delivery_line = OperationLine(
        id=hist_delivery_line_id,
        operation_id=hist_delivery_id,
        product_id=PROD_FRAME_ID,
        quantity=Decimal("5"),
    )
    pending_receipt_line = OperationLine(
        id=uuid.UUID("70000000-0000-0000-0000-000000000003"),
        operation_id=pending_receipt_id,
        product_id=PROD_STEEL_ID,
        quantity=Decimal("100"),
    )
    pending_transfer_line = OperationLine(
        id=uuid.UUID("70000000-0000-0000-0000-000000000004"),
        operation_id=pending_transfer_id,
        product_id=PROD_STEEL_ID,
        quantity=Decimal("40"),
    )
    pending_delivery_line = OperationLine(
        id=uuid.UUID("70000000-0000-0000-0000-000000000005"),
        operation_id=pending_delivery_id,
        product_id=PROD_STEEL_ID,
        quantity=Decimal("20"),
    )
    pending_adj_line = OperationLine(
        id=uuid.UUID("70000000-0000-0000-0000-000000000006"),
        operation_id=pending_adj_id,
        product_id=PROD_STEEL_ID,
        quantity=Decimal("0"),
        counted_quantity=Decimal("17"),
        previous_quantity=Decimal("20"),
        delta=Decimal("-3"),
        reason="3 kg damaged during cutting",
    )
    db.add_all([
        hist_receipt_line,
        hist_delivery_line,
        pending_receipt_line,
        pending_transfer_line,
        pending_delivery_line,
        pending_adj_line,
    ])
    await db.flush()

    # 7. Stock Moves / Ledger (depend on operations, lines, products, locations, users)
    db.add(StockMove(
        id=uuid.UUID("80000000-0000-0000-0000-000000000001"),
        operation_id=hist_receipt_id,
        line_id=hist_receipt_line_id,
        product_id=PROD_CHAIR_ID,
        to_location_id=LOC_RACK_A_ID,
        quantity=Decimal("15"),
        signed_delta=Decimal("15"),
        actor_id=MAYA_ID,
        occurred_at=yesterday,
    ))
    db.add(StockMove(
        id=uuid.UUID("80000000-0000-0000-0000-000000000002"),
        operation_id=hist_delivery_id,
        line_id=hist_delivery_line_id,
        product_id=PROD_FRAME_ID,
        from_location_id=LOC_RACK_A_ID,
        to_location_id=LOC_EXT_CUST_ID,
        quantity=Decimal("5"),
        signed_delta=Decimal("-5"),
        actor_id=MAYA_ID,
        occurred_at=yesterday,
    ))
    await db.flush()

    print("[OK] Database seeded successfully with v2 demo data.")


async def main():
    """Truncate tables and seed."""
    async with engine.begin() as conn:
        await conn.execute(text("""
            TRUNCATE TABLE 
                stock_moves,
                operation_lines,
                stock_operations,
                stock_balances,
                reference_sequences,
                products,
                locations,
                warehouses,
                categories,
                partners,
                password_reset_otps,
                users
            CASCADE;
        """))
        print("[OK] Tables truncated.")

    async with async_session_factory() as db:
        await seed(db)
        await db.commit()
        print("[OK] Seed committed successfully.")


if __name__ == "__main__":
    asyncio.run(main())
