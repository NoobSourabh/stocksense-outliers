"""
StockSense Backend - Auth dependency.

Extracts the JWT from an HttpOnly cookie or Authorization header,
validates it, and returns the current user.
"""

from fastapi import Cookie, Depends, Header, Request
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User
from app.services.auth_service import get_current_user


async def get_current_user_dep(
    request: Request,
    db: AsyncSession = Depends(get_db),
    authorization: str | None = Header(None),
) -> User:
    """
    FastAPI dependency: extract JWT from cookie or Authorization header,
    decode it, and return the authenticated user.
    """
    token = None

    # Try cookie first
    token = request.cookies.get("access_token")

    # Fall back to Authorization: Bearer <token>
    if not token and authorization:
        scheme, _, credentials = authorization.partition(" ")
        if scheme.lower() == "bearer" and credentials:
            token = credentials

    if not token:
        raise UnauthorizedError("Authentication required")

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token")
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    return await get_current_user(db, user_id)
