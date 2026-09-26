"""
Tests for KUN-011, KUN-012, KUN-013: Reference Data Endpoints.
- KUN-011: Categories (GET /categories, POST /categories)
- KUN-012: Warehouses & Locations (GET /warehouses, POST /warehouses, POST /warehouses/{id}/locations, GET /locations)
- KUN-013: Partners (GET /partners, POST /partners)
"""

import uuid
import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_reference_data_endpoints():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a Manager user and a Staff user for RBAC tests
        rand = uuid.uuid4().hex[:6]
        manager_login = f"mgr_{rand}"
        staff_login = f"stf_{rand}"
        password = "Password123!"

        # Sign up manager using a clean client
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as mgr_client:
            res_mgr = await mgr_client.post(
                "/api/v1/auth/signup",
                json={
                    "loginId": manager_login,
                    "name": "Manager User",
                    "email": f"{manager_login}@stocksense.demo",
                    "password": password,
                    "confirmPassword": password,
                },
            )
            assert res_mgr.status_code == 201
            mgr_user = res_mgr.json()["user"]

        # Ensure manager user has MANAGER role in DB for tests
        from app.db.session import async_session_factory
        from app.models import User, UserRole
        from sqlalchemy import update
        async with async_session_factory() as session:
            await session.execute(
                update(User).where(User.id == uuid.UUID(mgr_user["id"])).values(role=UserRole.MANAGER)
            )
            await session.commit()

        # Sign up staff user using a separate client
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as stf_signup_client:
            res_stf = await stf_signup_client.post(
                "/api/v1/auth/signup",
                json={
                    "loginId": staff_login,
                    "name": "Staff User",
                    "email": f"{staff_login}@stocksense.demo",
                    "password": password,
                    "confirmPassword": password,
                },
            )
            assert res_stf.status_code == 201
            stf_user = res_stf.json()["user"]

        # Ensure staff user has STAFF role in DB
        async with async_session_factory() as session:
            await session.execute(
                update(User).where(User.id == uuid.UUID(stf_user["id"])).values(role=UserRole.STAFF)
            )
            await session.commit()

        # Create authenticated clients for manager and staff
        mgr_client = httpx.AsyncClient(transport=transport, base_url="http://test")
        stf_client = httpx.AsyncClient(transport=transport, base_url="http://test")
        
        # Log in each to get proper session cookies
        await mgr_client.post("/api/v1/auth/login", json={"loginId": manager_login, "password": password})
        await stf_client.post("/api/v1/auth/login", json={"loginId": staff_login, "password": password})

        # -------------------------------------------------------------------
        # KUN-011: Categories Endpoint
        # -------------------------------------------------------------------

        # GET /categories
        res = await mgr_client.get("/api/v1/categories")
        assert res.status_code == 200
        cat_data = res.json()
        assert "items" in cat_data
        assert "total" in cat_data
        assert isinstance(cat_data["items"], list)

        # POST /categories as staff -> 403 Forbidden
        cat_code = f"CAT_{rand}".upper()
        res = await stf_client.post(
            "/api/v1/categories",
            json={"code": cat_code, "name": "Packaging Material"},
        )
        assert res.status_code == 403
        assert res.json()["error"]["code"] == "FORBIDDEN"

        # POST /categories as manager -> 201 Created
        res = await mgr_client.post(
            "/api/v1/categories",
            json={"code": cat_code, "name": "Packaging Material"},
        )
        assert res.status_code == 201
        created_cat = res.json()
        assert created_cat["code"] == cat_code
        assert created_cat["name"] == "Packaging Material"
        assert created_cat["isActive"] is True

        # Duplicate category code -> 409 Conflict
        res = await mgr_client.post(
            "/api/v1/categories",
            json={"code": cat_code, "name": "Duplicate Category"},
        )
        assert res.status_code == 409
        assert res.json()["error"]["code"] == "DUPLICATE_CATEGORY_CODE"

        # GET /categories with search
        res = await mgr_client.get(f"/api/v1/categories?search={cat_code.lower()}")
        assert res.status_code == 200
        search_data = res.json()
        assert any(c["code"] == cat_code for c in search_data["items"])

        # -------------------------------------------------------------------
        # KUN-012: Warehouses & Locations Endpoints
        # -------------------------------------------------------------------

        # GET /warehouses (default includes locations)
        res = await mgr_client.get("/api/v1/warehouses")
        assert res.status_code == 200
        wh_data = res.json()
        assert "items" in wh_data
        assert isinstance(wh_data["items"], list)

        # POST /warehouses as staff -> 403 Forbidden
        wh_code = f"WH_{rand}".upper()
        res = await stf_client.post(
            "/api/v1/warehouses",
            json={"code": wh_code, "name": "Regional Hub", "address": "Plot 5, Sector 12"},
        )
        assert res.status_code == 403

        # POST /warehouses as manager -> 201 Created
        res = await mgr_client.post(
            "/api/v1/warehouses",
            json={"code": wh_code, "name": "Regional Hub", "address": "Plot 5, Sector 12"},
        )
        assert res.status_code == 201
        created_wh = res.json()
        assert created_wh["code"] == wh_code
        assert created_wh["name"] == "Regional Hub"
        assert created_wh["address"] == "Plot 5, Sector 12"
        wh_id = created_wh["id"]

        # Duplicate warehouse code -> 409 Conflict
        res = await mgr_client.post(
            "/api/v1/warehouses",
            json={"code": wh_code, "name": "Duplicate Hub"},
        )
        assert res.status_code == 409
        assert res.json()["error"]["code"] == "DUPLICATE_WAREHOUSE_CODE"

        # GET /warehouses/{id}
        res = await mgr_client.get(f"/api/v1/warehouses/{wh_id}")
        assert res.status_code == 200
        assert res.json()["id"] == wh_id
        assert res.json()["code"] == wh_code

        # GET /warehouses/{invalid_id} -> 404
        fake_uuid = str(uuid.uuid4())
        res = await mgr_client.get(f"/api/v1/warehouses/{fake_uuid}")
        assert res.status_code == 404

        # POST /warehouses/{id}/locations as staff -> 403 Forbidden
        loc_code = f"LOC_{rand}".upper()
        res = await stf_client.post(
            f"/api/v1/warehouses/{wh_id}/locations",
            json={"code": loc_code, "name": "Aisle 1", "kind": "internal"},
        )
        assert res.status_code == 403

        # POST /warehouses/{id}/locations as manager -> 201 Created
        res = await mgr_client.post(
            f"/api/v1/warehouses/{wh_id}/locations",
            json={"code": loc_code, "name": "Aisle 1", "kind": "internal"},
        )
        assert res.status_code == 201
        created_loc = res.json()
        assert created_loc["code"] == loc_code
        assert created_loc["name"] == "Aisle 1"
        assert created_loc["kind"] == "internal"
        assert created_loc["warehouseId"] == wh_id
        loc_id = created_loc["id"]

        # Duplicate location code in same warehouse -> 409 Conflict
        res = await mgr_client.post(
            f"/api/v1/warehouses/{wh_id}/locations",
            json={"code": loc_code, "name": "Duplicate Aisle 1", "kind": "internal"},
        )
        assert res.status_code == 409
        assert res.json()["error"]["code"] == "DUPLICATE_LOCATION_CODE"

        # Create location on non-existent warehouse -> 404 Not Found
        res = await mgr_client.post(
            f"/api/v1/warehouses/{fake_uuid}/locations",
            json={"code": "X99", "name": "Ghost", "kind": "internal"},
        )
        assert res.status_code == 404

        # GET /locations
        res = await mgr_client.get(f"/api/v1/locations?warehouseId={wh_id}")
        assert res.status_code == 200
        locs_data = res.json()
        assert any(l["id"] == loc_id for l in locs_data["items"])

        # GET /locations/{id}
        res = await mgr_client.get(f"/api/v1/locations/{loc_id}")
        assert res.status_code == 200
        assert res.json()["id"] == loc_id

        # -------------------------------------------------------------------
        # KUN-013: Partners Endpoint
        # -------------------------------------------------------------------

        # GET /partners
        res = await mgr_client.get("/api/v1/partners")
        assert res.status_code == 200
        assert "items" in res.json()

        # POST /partners as staff -> 403 Forbidden
        partner_name = f"Partner_{rand}"
        res = await stf_client.post(
            "/api/v1/partners",
            json={"name": partner_name, "kind": "supplier"},
        )
        assert res.status_code == 403

        # POST /partners as manager -> 201 Created
        res = await mgr_client.post(
            "/api/v1/partners",
            json={"name": partner_name, "kind": "supplier"},
        )
        assert res.status_code == 201
        created_partner = res.json()
        assert created_partner["name"] == partner_name
        assert created_partner["kind"] == "supplier"
        assert created_partner["isActive"] is True

        # POST /partners with invalid kind -> 422
        res = await mgr_client.post(
            "/api/v1/partners",
            json={"name": "Bad Partner", "kind": "invalid_kind"},
        )
        assert res.status_code == 422

        # GET /partners with filter kind=supplier
        res = await mgr_client.get("/api/v1/partners?kind=supplier")
        assert res.status_code == 200
        suppliers = res.json()["items"]
        assert all(p["kind"] in ("supplier", "both") for p in suppliers)
        assert any(p["name"] == partner_name for p in suppliers)

        # GET /partners with search
        res = await mgr_client.get(f"/api/v1/partners?search={partner_name}")
        assert res.status_code == 200
        search_res = res.json()["items"]
        assert len(search_res) == 1
        assert search_res[0]["name"] == partner_name

        await mgr_client.aclose()
        await stf_client.aclose()
