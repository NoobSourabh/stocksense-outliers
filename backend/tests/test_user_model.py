"""
Tests for KUN-008: User model, security, and hashing logic.
"""

import uuid
import pytest
from app.models import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas import SignupRequest
from pydantic import ValidationError


def test_user_model_attributes():
    """Verify User ORM model definition and column constraints."""
    user = User(
        id=uuid.uuid4(),
        login_id="test_user",
        name="Test User",
        email="test@stocksense.demo",
        password_hash=hash_password("Password123!"),
        role=UserRole.MANAGER,
        is_active=True,
    )
    assert user.login_id == "test_user"
    assert user.name == "Test User"
    assert user.email == "test@stocksense.demo"
    assert user.role == UserRole.MANAGER
    assert user.is_active is True
    assert verify_password("Password123!", user.password_hash)


def test_password_hashing():
    """Verify bcrypt hashing and verification."""
    raw = "SecureSecret!2026"
    hashed = hash_password(raw)
    assert hashed != raw
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_flow():
    """Verify JWT access token generation and payload decoding."""
    subject = str(uuid.uuid4())
    claims = {"role": "manager", "name": "Maya Patel", "login_id": "maya_p"}
    token = create_access_token(subject, claims)

    decoded = decode_access_token(token)
    assert decoded["sub"] == subject
    assert decoded["role"] == "manager"
    assert decoded["login_id"] == "maya_p"
    assert "exp" in decoded


def test_login_id_validation_length():
    """Verify loginId constraints (6-12 chars, alphanumeric + underscore)."""
    # Valid loginId
    req = SignupRequest(
        loginId="arjun_v",
        name="Arjun Verma",
        email="arjun@example.com",
        password="ValidPass123!",
        confirmPassword="ValidPass123!",
    )
    assert req.login_id == "arjun_v"

    # Too short (< 6 chars)
    with pytest.raises(ValidationError):
        SignupRequest(
            loginId="short",
            name="Short User",
            email="short@example.com",
            password="ValidPass123!",
            confirmPassword="ValidPass123!",
        )

    # Too long (> 12 chars)
    with pytest.raises(ValidationError):
        SignupRequest(
            loginId="this_is_too_long_id",
            name="Long User",
            email="long@example.com",
            password="ValidPass123!",
            confirmPassword="ValidPass123!",
        )

    # Invalid characters (spaces, special symbols)
    with pytest.raises(ValidationError):
        SignupRequest(
            loginId="arjun@verma",
            name="Invalid User",
            email="invalid@example.com",
            password="ValidPass123!",
            confirmPassword="ValidPass123!",
        )


def test_password_complexity_rules():
    """Verify password rules: min 8, lower, upper, special."""
    # Missing uppercase
    with pytest.raises(ValidationError):
        SignupRequest(
            loginId="user_valid",
            name="User Valid",
            email="user@example.com",
            password="password123!",
            confirmPassword="password123!",
        )

    # Missing lowercase
    with pytest.raises(ValidationError):
        SignupRequest(
            loginId="user_valid",
            name="User Valid",
            email="user@example.com",
            password="PASSWORD123!",
            confirmPassword="PASSWORD123!",
        )

    # Missing special char
    with pytest.raises(ValidationError):
        SignupRequest(
            loginId="user_valid",
            name="User Valid",
            email="user@example.com",
            password="Password1234",
            confirmPassword="Password1234",
        )

    # Mismatched confirmation
    with pytest.raises(ValidationError):
        SignupRequest(
            loginId="user_valid",
            name="User Valid",
            email="user@example.com",
            password="Password123!",
            confirmPassword="DifferentPassword123!",
        )
