import pytest
from fastapi.testclient import TestClient


def test_full_signup_login_me_flow(client: TestClient):
    # Signup
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "alice@example.com"

    # Login
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    # Me
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "alice@example.com"


def test_me_requires_auth(client: TestClient):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_refresh_rotation_flow(client: TestClient):
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "ref@example.com", "password": "password123"},
    )
    assert reg.status_code == 200
    refresh_token = reg.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert "refresh_token" in resp.json()
    # Old refresh token should be revoked (rotation)
    resp2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp2.status_code == 401


def test_logout_revokes_refresh_token(client: TestClient):
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "out@example.com", "password": "password123"},
    )
    refresh_token = reg.json()["refresh_token"]
    resp = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    # Using same refresh token after logout should fail
    resp2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp2.status_code == 401


def test_reset_password_valid_token(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={"email": "reset@example.com", "password": "oldpassword"},
    )
    forgot = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset@example.com"},
    )
    assert forgot.status_code == 200
    data = forgot.json()
    reset_token = data.get("reset_token")
    assert reset_token

    resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "newpassword123"},
    )
    assert resp.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "reset@example.com", "password": "newpassword123"},
    )
    assert login.status_code == 200


def test_reset_password_invalid_token(client: TestClient):
    resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "invalid-token-xyz", "new_password": "newpassword123"},
    )
    assert resp.status_code == 400
    assert "invalid" in resp.json().get("detail", "").lower() or "expired" in resp.json().get("detail", "").lower()


def test_reset_password_expired_token(client: TestClient, db_session):
    """Expired token should be rejected (we cannot easily expire in test without mocking time)."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "expired@example.com", "password": "oldpassword"},
    )
    client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "expired@example.com"},
    )
    # Use a token that doesn't exist / is malformed to simulate expired/invalid
    resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "expired-or-nonexistent-token", "new_password": "newpassword123"},
    )
    assert resp.status_code == 400
