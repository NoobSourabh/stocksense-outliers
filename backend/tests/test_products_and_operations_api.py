"""
Tests for KUN-014, KUN-015, and KUN-016:
- KUN-014: Products CRUD (GET /products, POST /products, GET /products/{id}, PATCH /products/{id}, GET /products/{id}/availability)
- KUN-015: StockBalance model & free-to-use calculation
- KUN-016: Operations CRUD + state machine (draft -> waiting <-> ready -> done, cancel, patch, idempotent validate)
"""

import uuid
from decimal import Decimal
import pytest
import httpx

from app.db.session import async_session_factory
from app.main import app
from app.models import (
    Category,
    Location,
    LocationKind,
    OperationStatus,
    OperationType,
    Partner,
    PartnerKind,
    Product,
    StockBalance,
    StockMove,
    StockOperation,
    User,
    UserRole,
    Warehouse,
)
from sqlalchemy import select, update


@pytest.mark.asyncio
async def test_products_and_operations_end_to_end():
    transport = httpx.ASGITransport(app=app)
    rand = uuid.uuid4().hex[:6]
    mgr_login = f"mgr_{rand}"
    stf_login = f"stf_{rand}"
    password = "Password123!"

    # 1. Sign up users
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        res_mgr = await client.post(
            "/api/v1/auth/signup",
            json={
                "loginId": mgr_login,
                "name": "Manager KUN",
                "email": f"{mgr_login}@stocksense.demo",
                "password": password,
                "confirmPassword": password,
            },
        )
        assert res_mgr.status_code == 201
        mgr_id = uuid.UUID(res_mgr.json()["user"]["id"])

        res_stf = await client.post(
            "/api/v1/auth/signup",
            json={
                "loginId": stf_login,
                "name": "Staff KUN",
                "email": f"{stf_login}@stocksense.demo",
                "password": password,
                "confirmPassword": password,
            },
        )
        assert res_stf.status_code == 201
        stf_id = uuid.UUID(res_stf.json()["user"]["id"])

    # Ensure explicit DB roles
    async with async_session_factory() as session:
        await session.execute(update(User).where(User.id == mgr_id).values(role=UserRole.MANAGER))
        await session.execute(update(User).where(User.id == stf_id).values(role=UserRole.STAFF))
        await session.commit()

    mgr_client = httpx.AsyncClient(transport=transport, base_url="http://test")
    stf_client = httpx.AsyncClient(transport=transport, base_url="http://test")
    await mgr_client.post("/api/v1/auth/login", json={"loginId": mgr_login, "password": password})
    await stf_client.post("/api/v1/auth/login", json={"loginId": stf_login, "password": password})

    # Set up prerequisite reference data (Warehouse, Location, Category, Partner)
    wh_code = f"W{rand[:3].upper()}"
    res_wh = await mgr_client.post(
        "/api/v1/warehouses",
        json={"code": wh_code, "name": f"Warehouse {wh_code}", "address": "Main Hub"},
    )
    assert res_wh.status_code == 201
    wh_id = res_wh.json()["id"]

    res_loc1 = await mgr_client.post(
        f"/api/v1/warehouses/{wh_id}/locations",
        json={"code": "STK1", "name": "Stock Shelf 1", "kind": "internal"},
    )
    assert res_loc1.status_code == 201
    loc1_id = res_loc1.json()["id"]

    res_loc2 = await mgr_client.post(
        f"/api/v1/warehouses/{wh_id}/locations",
        json={"code": "STK2", "name": "Stock Shelf 2", "kind": "internal"},
    )
    assert res_loc2.status_code == 201
    loc2_id = res_loc2.json()["id"]

    res_cat = await mgr_client.post(
        "/api/v1/categories",
        json={"code": f"CAT_{rand}".upper(), "name": "Industrial Components"},
    )
    assert res_cat.status_code == 201
    cat_id = res_cat.json()["id"]

    res_partner = await mgr_client.post(
        "/api/v1/partners",
        json={"name": f"Supplier {rand}", "kind": "both"},
    )
    assert res_partner.status_code == 201
    partner_id = res_partner.json()["id"]

    # =======================================================================
    # KUN-014: Products CRUD Tests
    # =======================================================================
    sku_1 = f"SKU-{rand.upper()}-01"
    sku_2 = f"SKU-{rand.upper()}-02"

    # Staff attempt to create product -> 403 Forbidden
    res = await stf_client.post(
        "/api/v1/products",
        json={
            "name": "Steel Bolt M8",
            "sku": sku_1,
            "categoryId": cat_id,
            "unit": "piece",
            "unitCost": "2.50",
            "reorderPoint": "20.000",
        },
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"

    # Manager creates product without initial stock -> 201 Created
    res = await mgr_client.post(
        "/api/v1/products",
        json={
            "name": "Steel Bolt M8",
            "sku": sku_1,
            "categoryId": cat_id,
            "unit": "piece",
            "unitCost": "2.50",
            "reorderPoint": "20.000",
        },
    )
    assert res.status_code == 201
    prod1_data = res.json()
    prod1_id = prod1_data["id"]
    assert prod1_data["sku"] == sku_1
    assert prod1_data["name"] == "Steel Bolt M8"
    assert prod1_data["onHandTotal"] == "0"
    assert prod1_data["freeToUseTotal"] == "0"

    # Duplicate SKU returns 409 Conflict
    res_dup = await mgr_client.post(
        "/api/v1/products",
        json={
            "name": "Another Bolt",
            "sku": sku_1.lower(),  # tests case normalization
            "categoryId": cat_id,
            "unit": "piece",
        },
    )
    assert res_dup.status_code == 409
    assert res_dup.json()["error"]["code"] == "DUPLICATE_SKU"

    # Manager creates product WITH initial stock -> 201 Created, sets balance and ledger row
    res = await mgr_client.post(
        "/api/v1/products",
        json={
            "name": "Copper Wire 5mm",
            "sku": sku_2,
            "categoryId": cat_id,
            "unit": "meter",
            "unitCost": "15.00",
            "reorderPoint": "50.000",
            "initialStock": {
                "locationId": loc1_id,
                "quantity": "100.000",
            },
        },
    )
    assert res.status_code == 201
    prod2_data = res.json()
    prod2_id = prod2_data["id"]
    assert Decimal(prod2_data["onHandTotal"]) == Decimal("100.000")
    assert Decimal(prod2_data["freeToUseTotal"]) == Decimal("100.000")
    assert len(prod2_data["balances"]) == 1
    assert prod2_data["balances"][0]["locationId"] == loc1_id
    assert Decimal(prod2_data["balances"][0]["onHand"]) == Decimal("100.000")

    # Verify initial stock created a StockMove row in DB
    async with async_session_factory() as session:
        moves_res = await session.execute(
            select(StockMove).where(StockMove.product_id == uuid.UUID(prod2_id))
        )
        moves = list(moves_res.scalars().all())
        assert len(moves) == 1
        assert moves[0].quantity == Decimal("100.000")
        assert moves[0].signed_delta == Decimal("100.000")
        assert moves[0].reason == "Initial stock"

    # GET /products (list with search and category filter)
    res_list = await mgr_client.get(f"/api/v1/products?search={sku_2}&categoryId={cat_id}")
    assert res_list.status_code == 200
    list_json = res_list.json()
    assert list_json["total"] >= 1
    assert any(p["sku"] == sku_2 for p in list_json["items"])

    # GET /products with stockState=in_stock and stockState=out_of_stock
    res_in_stock = await mgr_client.get("/api/v1/products?stockState=in_stock")
    assert res_in_stock.status_code == 200
    assert any(p["sku"] == sku_2 for p in res_in_stock.json()["items"])
    assert all(Decimal(p["onHand"]) > 0 for p in res_in_stock.json()["items"])

    res_out_of_stock = await mgr_client.get("/api/v1/products?stockState=out_of_stock")
    assert res_out_of_stock.status_code == 200
    assert any(p["sku"] == sku_1 for p in res_out_of_stock.json()["items"])

    # GET /products/{id}
    res_get = await mgr_client.get(f"/api/v1/products/{prod2_id}")
    assert res_get.status_code == 200
    assert res_get.json()["sku"] == sku_2
    assert res_get.json()["category"]["name"] == "Industrial Components"

    # GET /products/non-existent-id -> 404
    res_404 = await mgr_client.get(f"/api/v1/products/{uuid.uuid4()}")
    assert res_404.status_code == 404

    # PATCH /products/{id} as staff -> 403 Forbidden
    res_patch_stf = await stf_client.patch(
        f"/api/v1/products/{prod1_id}",
        json={"name": "Attempt by staff"},
    )
    assert res_patch_stf.status_code == 403

    # PATCH /products/{id} as manager -> updates fields
    res_patch = await mgr_client.patch(
        f"/api/v1/products/{prod1_id}",
        json={
            "name": "Steel Bolt M8 High Tensile",
            "unitCost": "3.25",
            "reorderPoint": "30.000",
        },
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["name"] == "Steel Bolt M8 High Tensile"
    assert res_patch.json()["unitCost"] == "3.25"
    assert res_patch.json()["reorderPoint"] == "30.000"

    # GET /products/{id}/availability
    res_avail = await mgr_client.get(f"/api/v1/products/{prod2_id}/availability?warehouseId={wh_id}")
    assert res_avail.status_code == 200
    avail_json = res_avail.json()
    assert Decimal(avail_json["onHandTotal"]) == Decimal("100.000")
    assert Decimal(avail_json["freeToUseTotal"]) == Decimal("100.000")
    assert len(avail_json["locations"]) == 1
    assert avail_json["locations"][0]["locationCode"] == "STK1"

    # =======================================================================
    # KUN-015: StockBalance Model & Free-to-Use Calculation Tests
    # =======================================================================
    # Currently prod2 has 100 on hand at loc1. Free-to-use is 100.
    # Create a draft delivery for 40 units
    res_deliv1 = await mgr_client.post(
        "/api/v1/operations",
        json={
            "type": "delivery",
            "partnerId": partner_id,
            "sourceLocationId": loc1_id,
            "scheduleDate": "2026-10-01",
            "note": "Delivery 1",
            "lines": [{"productId": prod2_id, "quantity": "40.000"}],
        },
    )
    assert res_deliv1.status_code == 201
    deliv1_id = res_deliv1.json()["id"]
    assert res_deliv1.json()["status"] == "draft"

    # In draft state, stock is NOT reserved yet
    res_avail_draft = await mgr_client.get(f"/api/v1/products/{prod2_id}/availability")
    assert Decimal(res_avail_draft.json()["freeToUseTotal"]) == Decimal("100.000")

    # Mark delivery 1 ready -> sufficient stock exists (100 >= 40) -> status becomes READY
    res_ready1 = await mgr_client.post(f"/api/v1/operations/{deliv1_id}/ready")
    assert res_ready1.status_code == 200
    assert res_ready1.json()["status"] == "ready"

    # Now 40 is reserved: free-to-use must be 100 - 40 = 60!
    res_avail_ready = await mgr_client.get(f"/api/v1/products/{prod2_id}/availability")
    assert Decimal(res_avail_ready.json()["onHandTotal"]) == Decimal("100.000")
    assert Decimal(res_avail_ready.json()["freeToUseTotal"]) == Decimal("60.000")

    # Create a second delivery for 80 units
    res_deliv2 = await mgr_client.post(
        "/api/v1/operations",
        json={
            "type": "delivery",
            "partnerId": partner_id,
            "sourceLocationId": loc1_id,
            "scheduleDate": "2026-10-02",
            "note": "Delivery 2",
            "lines": [{"productId": prod2_id, "quantity": "80.000"}],
        },
    )
    assert res_deliv2.status_code == 201
    deliv2_id = res_deliv2.json()["id"]

    # Mark delivery 2 ready -> free-to-use is 60, but requested is 80 -> status becomes WAITING!
    res_ready2 = await mgr_client.post(f"/api/v1/operations/{deliv2_id}/ready")
    assert res_ready2.status_code == 200
    assert res_ready2.json()["status"] == "waiting"
    assert res_ready2.json()["lines"][0]["isShort"] is True

    # Cancel delivery 1 -> status becomes canceled
    res_cancel1 = await mgr_client.post(f"/api/v1/operations/{deliv1_id}/cancel")
    assert res_cancel1.status_code == 200
    assert res_cancel1.json()["status"] == "canceled"

    # Canceling delivery 1 released its 40 units reservation!
    # Delivery 2 (80 units) is in waiting.
    # Re-evaluating delivery 2 with ready should now succeed because free-to-use is 100 >= 80!
    res_ready2_again = await mgr_client.post(f"/api/v1/operations/{deliv2_id}/ready")
    assert res_ready2_again.status_code == 200
    assert res_ready2_again.json()["status"] == "ready"
    assert res_ready2_again.json()["lines"][0]["isShort"] is False

    # Free-to-use now is 100 - 80 = 20
    res_avail_after = await mgr_client.get(f"/api/v1/products/{prod2_id}/availability")
    assert Decimal(res_avail_after.json()["freeToUseTotal"]) == Decimal("20.000")

    # Clean up delivery 2
    await mgr_client.post(f"/api/v1/operations/{deliv2_id}/cancel")

    # =======================================================================
    # KUN-016: Operations CRUD + State Machine Tests
    # =======================================================================

    # 1. Reference sequence format check
    res_rec = await mgr_client.post(
        "/api/v1/operations",
        json={
            "type": "receipt",
            "partnerId": partner_id,
            "destinationLocationId": loc1_id,
            "scheduleDate": "2026-10-05",
            "note": "Incoming batch",
            "lines": [{"productId": prod1_id, "quantity": "50.000"}],
        },
    )
    assert res_rec.status_code == 201
    rec_data = res_rec.json()
    rec_id = rec_data["id"]
    # Reference format: WH/IN/0001
    assert "/IN/" in rec_data["reference"]
    assert rec_data["status"] == "draft"

    # 2. Cannot validate an operation directly from draft -> 409 Conflict
    res_bad_val = await mgr_client.post(f"/api/v1/operations/{rec_id}/validate")
    assert res_bad_val.status_code == 409
    assert res_bad_val.json()["error"]["code"] == "INVALID_STATE"

    # 3. PATCH /operations/{id} while in draft
    res_patch_op = await mgr_client.patch(
        f"/api/v1/operations/{rec_id}",
        json={"note": "Updated PO-9988"},
    )
    assert res_patch_op.status_code == 200
    assert res_patch_op.json()["note"] == "Updated PO-9988"

    # 4. State transition: draft -> ready
    res_rec_ready = await mgr_client.post(f"/api/v1/operations/{rec_id}/ready")
    assert res_rec_ready.status_code == 200
    assert res_rec_ready.json()["status"] == "ready"

    # 5. State transition: ready -> validate (done)
    res_rec_val = await mgr_client.post(f"/api/v1/operations/{rec_id}/validate")
    assert res_rec_val.status_code == 200
    assert res_rec_val.json()["status"] == "done"

    # Check on-hand increased for prod1
    res_prod1_check = await mgr_client.get(f"/api/v1/products/{prod1_id}")
    assert Decimal(res_prod1_check.json()["onHandTotal"]) == Decimal("50.000")

    # 6. Idempotent validate: calling validate on already done operation returns 200 without double-adding
    res_rec_val_idemp = await mgr_client.post(f"/api/v1/operations/{rec_id}/validate")
    assert res_rec_val_idemp.status_code == 200
    assert res_rec_val_idemp.json()["status"] == "done"
    res_prod1_check2 = await mgr_client.get(f"/api/v1/products/{prod1_id}")
    assert Decimal(res_prod1_check2.json()["onHandTotal"]) == Decimal("50.000")

    # 7. Cannot cancel a done operation -> 409 Conflict
    res_cancel_done = await mgr_client.post(f"/api/v1/operations/{rec_id}/cancel")
    assert res_cancel_done.status_code == 409
    assert res_cancel_done.json()["error"]["code"] == "INVALID_STATE"

    # 8. Cannot PATCH a done operation -> 409 Conflict
    res_patch_done = await mgr_client.patch(
        f"/api/v1/operations/{rec_id}",
        json={"note": "Cannot edit"},
    )
    assert res_patch_done.status_code == 409
    assert res_patch_done.json()["error"]["code"] == "INVALID_STATE"

    # 9. Transfer operation: move 20 units from loc1 to loc2
    res_tr = await mgr_client.post(
        "/api/v1/operations",
        json={
            "type": "transfer",
            "sourceLocationId": loc1_id,
            "destinationLocationId": loc2_id,
            "scheduleDate": "2026-10-06",
            "lines": [{"productId": prod1_id, "quantity": "20.000"}],
        },
    )
    assert res_tr.status_code == 201
    tr_id = res_tr.json()["id"]
    assert "/INT/" in res_tr.json()["reference"]

    await mgr_client.post(f"/api/v1/operations/{tr_id}/ready")
    res_tr_val = await mgr_client.post(f"/api/v1/operations/{tr_id}/validate")
    assert res_tr_val.status_code == 200
    assert res_tr_val.json()["status"] == "done"

    # Verify balances: loc1 = 30, loc2 = 20, total = 50
    res_prod1_avail = await mgr_client.get(f"/api/v1/products/{prod1_id}/availability")
    assert Decimal(res_prod1_avail.json()["onHandTotal"]) == Decimal("50.000")
    loc_map = {l["locationId"]: Decimal(l["onHand"]) for l in res_prod1_avail.json()["locations"]}
    assert loc_map[loc1_id] == Decimal("30.000")
    assert loc_map[loc2_id] == Decimal("20.000")

    # 10. Adjustment operation: physical count adjustment on loc2 from 20 to 18
    res_adj = await mgr_client.post(
        "/api/v1/operations",
        json={
            "type": "adjustment",
            "destinationLocationId": loc2_id,
            "lines": [
                {
                    "productId": prod1_id,
                    "countedQuantity": "18.000",
                    "reason": "Damaged items scrapped",
                }
            ],
        },
    )
    assert res_adj.status_code == 201
    adj_id = res_adj.json()["id"]
    assert "/ADJ/" in res_adj.json()["reference"]

    await mgr_client.post(f"/api/v1/operations/{adj_id}/ready")
    res_adj_val = await mgr_client.post(f"/api/v1/operations/{adj_id}/validate")
    assert res_adj_val.status_code == 200
    assert res_adj_val.json()["status"] == "done"

    # Check updated balances
    res_prod1_avail2 = await mgr_client.get(f"/api/v1/products/{prod1_id}/availability")
    assert Decimal(res_prod1_avail2.json()["onHandTotal"]) == Decimal("48.000")
    loc_map2 = {l["locationId"]: Decimal(l["onHand"]) for l in res_prod1_avail2.json()["locations"]}
    assert loc_map2[loc2_id] == Decimal("18.000")

    # 11. GET /operations filtering
    res_ops_list = await mgr_client.get(f"/api/v1/operations?type=receipt&warehouseId={wh_id}")
    assert res_ops_list.status_code == 200
    assert all(op["type"] == "receipt" for op in res_ops_list.json()["items"])
