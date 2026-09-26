"""
StockSense Backend - Auth API routes.

POST /auth/signup (login_id), POST /auth/login (login_id), POST /auth/logout, GET /auth/me
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_dep
from app.core.config import get_settings
from app.db.session import get_db
from app.models import User
from app.schemas import AuthResponse, LoginRequest, SignupRequest, UserResponse
from app.services.auth_service import login, signup

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookie(response: Response, token: str) -> None:
    """Set the JWT as an HttpOnly, SameSite=Lax cookie."""
    settings = get_settings()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=not settings.debug,
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        loginId=user.login_id,
        name=user.name,
        email=user.email,
        role=user.role.value,
        isActive=user.is_active,
    )


@router.post("/signup", status_code=201)
async def signup_route(
    body: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    user, token = await signup(db, body.login_id, body.name, body.email, body.password)
    _set_cookie(response, token)
    return AuthResponse(user=_user_response(user))


@router.post("/login")
async def login_route(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    user, token = await login(db, body.login_id, body.password)
    _set_cookie(response, token)
    return AuthResponse(user=_user_response(user))


@router.post("/logout")
async def logout_route(response: Response) -> dict:
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@router.get("/me")
async def me_route(
    current_user: User = Depends(get_current_user_dep),
) -> AuthResponse:
    return AuthResponse(user=_user_response(current_user))
