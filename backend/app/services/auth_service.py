"""
StockSense Backend - Auth service.

Handles user signup (with login_id), login (by login_id), and current-user retrieval.
Password complexity: lowercase + uppercase + special + 8 chars (enforced by schema validator).
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User, UserRole
from app.repositories import create_user, get_user_by_email, get_user_by_id, get_user_by_login_id


async def signup(
    db: AsyncSession,
    login_id: str,
    name: str,
    email: str,
    password: str,
) -> tuple[User, str]:
    """
    Register a new user with login_id. Returns (user, jwt_token).
    Raises ConflictError if login_id or email already exists.
    """
    # Check duplicate login_id
    existing_login = await get_user_by_login_id(db, login_id)
    if existing_login:
        raise ConflictError(
            "LOGIN_ID_EXISTS",
            "An account with this Login ID already exists",
            {"loginId": "Login ID already in use"},
        )

    # Check duplicate email
    existing_email = await get_user_by_email(db, email)
    if existing_email:
        raise ConflictError(
            "EMAIL_EXISTS",
            "An account with this email already exists",
            {"email": "Email already in use"},
        )

    user = User(
        login_id=login_id.strip(),
        name=name,
        email=email.lower().strip(),
        password_hash=hash_password(password),
        role=UserRole.MANAGER,  # First user is manager by default
    )
    await create_user(db, user)
    token = create_access_token(
        str(user.id),
        {"role": user.role.value, "name": user.name, "login_id": user.login_id},
    )
    return user, token


async def login(db: AsyncSession, login_id: str, password: str) -> tuple[User, str]:
    """
    Authenticate by login_id. Returns (user, jwt_token).
    Raises UnauthorizedError with the wireframe's exact message on bad credentials.
    """
    user = await get_user_by_login_id(db, login_id)
    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid Login Id or Password")
    if not user.is_active:
        raise UnauthorizedError("Account is deactivated")

    token = create_access_token(
        str(user.id),
        {"role": user.role.value, "name": user.name, "login_id": user.login_id},
    )
    return user, token


async def get_current_user(db: AsyncSession, user_id: str) -> User:
    """Fetch user by id or raise UnauthorizedError."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise UnauthorizedError("Invalid or expired session")
    user = await get_user_by_id(db, uid)
    if not user or not user.is_active:
        raise UnauthorizedError("Invalid or expired session")
    return user
