import pytest
from fastapi import HTTPException

from src.app.core.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from src.app.models import password_reset_token  # noqa: F401
from src.app.models import refresh_token  # noqa: F401
from src.app.models import user  # noqa: F401
from src.app.schemas.auth import LoginRequest, SignupRequest
from src.app.services import auth_service


def test_password_hash_verify_pass(db_session):
    plain = "secret123"
    hashed = get_password_hash(plain)
    assert verify_password(plain, hashed) is True


def test_password_hash_verify_fail(db_session):
    hashed = get_password_hash("secret123")
    assert verify_password("wrong", hashed) is False


def test_token_create_and_verify(db_session):
    token = create_access_token("42")
    payload = verify_token(token)
    assert payload is not None
    assert payload.get("sub") == "42"
    assert payload.get("type") == "access"


def test_token_expired_returns_none(db_session):
    from datetime import timedelta

    token = create_access_token("42", expires_delta=timedelta(seconds=-1))
    payload = verify_token(token)
    assert payload is None


def test_signup_rejects_duplicate_email(db_session):
    data = SignupRequest(email="dup@example.com", password="password123")
    auth_service.create_user_account(db_session, data)
    with pytest.raises(HTTPException) as exc_info:
        auth_service.create_user_account(db_session, data)
    assert exc_info.value.status_code == 409


def test_signup_creates_user_and_returns_tokens(db_session):
    data = SignupRequest(name="Test", email="test@example.com", password="password123")
    resp = auth_service.create_user_account(db_session, data)
    assert resp.user.email == "test@example.com"
    assert resp.user.id is not None
    assert resp.access_token
    assert resp.refresh_token


def test_login_returns_tokens(db_session):
    auth_service.create_user_account(
        db_session,
        SignupRequest(email="login@example.com", password="secret456"),
    )
    resp = auth_service.validate_login(
        db_session,
        LoginRequest(email="login@example.com", password="secret456"),
    )
    assert resp.access_token
    assert resp.refresh_token


def test_login_wrong_password_raises(db_session):
    auth_service.create_user_account(
        db_session,
        SignupRequest(email="wrong@example.com", password="correct1"),
    )
    with pytest.raises(HTTPException) as exc_info:
        auth_service.validate_login(
            db_session,
            LoginRequest(email="wrong@example.com", password="wrong"),
        )
    assert exc_info.value.status_code == 401
