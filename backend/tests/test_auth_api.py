"""
Tests for KUN-009 & KUN-010: Auth Endpoints & Session Management.
"""

import uuid
import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_auth_full_flow():
    """Verify signup, login, session cookies, /auth/me, and logout."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unauthenticated /auth/me should fail with 401
        res = await client.get("/api/v1/auth/me")
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "UNAUTHORIZED"

        # Generate unique credentials for the test run
        suffix = uuid.uuid4().hex[:5]
        login_id = f"usr_{suffix}"  # 9 chars, valid
        email = f"user_{suffix}@stocksense.demo"
        password = "Password123!"

        # 2. Signup
        signup_payload = {
            "loginId": login_id,
            "name": "Integration Tester",
            "email": email,
            "password": password,
            "confirmPassword": password,
        }
        res = await client.post("/api/v1/auth/signup", json=signup_payload)
        assert res.status_code == 201
        data = res.json()
        assert data["user"]["loginId"] == login_id
        assert data["user"]["email"] == email
        assert "password" not in data["user"]
        assert "token" in data
        # Check that access_token cookie was set
        assert "access_token" in res.cookies

        token = data["token"]

        # 3. Duplicate signup should return 409 Conflict
        res = await client.post("/api/v1/auth/signup", json=signup_payload)
        assert res.status_code == 409
        assert res.json()["error"]["code"] == "LOGIN_ID_EXISTS"

        # 4. GET /auth/me with session cookie
        res = await client.get("/api/v1/auth/me")
        assert res.status_code == 200
        assert res.json()["user"]["loginId"] == login_id

        # 5. GET /auth/me with Authorization Bearer header (no cookie)
        clean_client = httpx.AsyncClient(transport=transport, base_url="http://test")
        res = await clean_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        assert res.json()["user"]["loginId"] == login_id

        # 6. Login with wrong password -> 401 "Invalid Login Id or Password"
        res = await client.post(
            "/api/v1/auth/login",
            json={"loginId": login_id, "password": "WrongPassword!"}
        )
        assert res.status_code == 401
        assert res.json()["error"]["message"] == "Invalid Login Id or Password"

        # 7. Login with non-existent loginId -> 401 "Invalid Login Id or Password"
        res = await client.post(
            "/api/v1/auth/login",
            json={"loginId": "non_existent_id", "password": password}
        )
        assert res.status_code == 401
        assert res.json()["error"]["message"] == "Invalid Login Id or Password"

        # 8. Successful login
        res = await client.post(
            "/api/v1/auth/login",
            json={"loginId": login_id, "password": password}
        )
        assert res.status_code == 200
        assert res.json()["user"]["loginId"] == login_id
        assert "access_token" in res.cookies

        # 9. Logout
        res = await client.post("/api/v1/auth/logout")
        assert res.status_code == 200
        assert res.json() == {"ok": True}
        # Cookie cleared
        cookie_val = res.cookies.get("access_token")
        assert cookie_val is None or cookie_val == ""
