"""
Tests for KUN-024: Cursor pagination and accurate totals for /operations, /moves, and /products.
"""

import uuid
from datetime import datetime, timezone
import pytest
import httpx

from app.main import app
from app.repositories import decode_cursor, encode_cursor


def test_cursor_encoding_and_decoding():
    record_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    token = encode_cursor(now, record_id)
    assert isinstance(token, str)

    decoded = decode_cursor(token)
    assert decoded is not None
    dt, rec_id = decoded
    assert rec_id == record_id
    assert dt == now

    # Invalid cursor returns None
    assert decode_cursor("invalid-base64") is None


@pytest.mark.asyncio
async def test_pagination_endpoints():
    transport = httpx.ASGITransport(app=app)
    rand = uuid.uuid4().hex[:6]
    login_id = f"pgn_{rand}"
    password = "Password123!"

    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Signup and login
        res_signup = await client.post(
            "/api/v1/auth/signup",
            json={
                "loginId": login_id,
                "name": "Pagination User",
                "email": f"{login_id}@stocksense.demo",
                "password": password,
                "confirmPassword": password,
            },
        )
        assert res_signup.status_code == 201

        login_res = await client.post(
            "/api/v1/auth/login",
            json={"loginId": login_id, "password": password},
        )
        assert login_res.status_code == 200

        # Test GET /operations pagination with small limit
        res_ops = await client.get("/api/v1/operations?limit=1")
        assert res_ops.status_code == 200
        data_ops = res_ops.json()
        assert "items" in data_ops
        assert "total" in data_ops
        assert "nextCursor" in data_ops
        assert isinstance(data_ops["total"], int)

        if data_ops["total"] > 1:
            assert data_ops["nextCursor"] is not None
            # Fetch next page using cursor
            res_ops_page2 = await client.get(f"/api/v1/operations?limit=1&cursor={data_ops['nextCursor']}")
            assert res_ops_page2.status_code == 200
            data_ops_page2 = res_ops_page2.json()
            assert len(data_ops_page2["items"]) <= 1
            if len(data_ops_page2["items"]) > 0 and len(data_ops["items"]) > 0:
                assert data_ops_page2["items"][0]["id"] != data_ops["items"][0]["id"]

        # Test GET /moves pagination with small limit
        res_moves = await client.get("/api/v1/moves?limit=1")
        assert res_moves.status_code == 200
        data_moves = res_moves.json()
        assert "items" in data_moves
        assert "total" in data_moves
        assert "nextCursor" in data_moves
        assert isinstance(data_moves["total"], int)

        if data_moves["total"] > 1:
            assert data_moves["nextCursor"] is not None
            res_moves_page2 = await client.get(f"/api/v1/moves?limit=1&cursor={data_moves['nextCursor']}")
            assert res_moves_page2.status_code == 200
            data_moves_page2 = res_moves_page2.json()
            assert len(data_moves_page2["items"]) <= 1
            if len(data_moves_page2["items"]) > 0 and len(data_moves["items"]) > 0:
                assert data_moves_page2["items"][0]["id"] != data_moves["items"][0]["id"]

        # Test GET /products pagination with small limit
        res_prods = await client.get("/api/v1/products?limit=1")
        assert res_prods.status_code == 200
        data_prods = res_prods.json()
        assert "items" in data_prods
        assert "total" in data_prods
        assert isinstance(data_prods["total"], int)
        if data_prods["total"] > 1:
            assert data_prods["nextCursor"] is not None
            res_prods_page2 = await client.get(f"/api/v1/products?limit=1&cursor={data_prods['nextCursor']}")
            assert res_prods_page2.status_code == 200
            data_prods_page2 = res_prods_page2.json()
            if len(data_prods_page2["items"]) > 0 and len(data_prods["items"]) > 0:
                assert data_prods_page2["items"][0]["id"] != data_prods["items"][0]["id"]
