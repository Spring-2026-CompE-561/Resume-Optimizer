import logging

from fastapi.testclient import TestClient
from sqlalchemy import inspect

from src.app.api.v1.routes import DOMAIN_ROUTERS
from src.app.core.database import Base, engine
from src.app.main import app


def test_api_v1_routes_are_reachable(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "api": "v1"}


def test_api_v1_registers_expected_domain_routers() -> None:
    assert {router.prefix for router in DOMAIN_ROUTERS} == {
        "/auth",
        "/resumes",
        "/job-postings",
        "/optimize",
    }


def test_api_v1_database_health_route_is_reachable(client: TestClient) -> None:
    response = client.get("/api/v1/health/db")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "up"}


def test_api_v1_database_health_route_returns_503_when_unavailable(
    client: TestClient, monkeypatch
) -> None:
    monkeypatch.setattr("src.app.api.v1.routes.database_core.is_database_healthy", lambda: False)
    response = client.get("/api/v1/health/db")
    assert response.status_code == 503
    assert response.json()["detail"] == "Database is unavailable"


def test_request_logging_middleware_logs_method_path_and_status(
    client: TestClient, caplog
) -> None:
    caplog.set_level(logging.INFO, logger="src.app.main")

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert any(
        record.message == "GET /api/v1/health -> 200" for record in caplog.records
    )


def test_startup_creates_registered_tables() -> None:
    Base.metadata.drop_all(bind=engine)

    with TestClient(app):
        pass

    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    assert {
        "users",
        "refresh_tokens",
        "password_reset_tokens",
        "job_postings",
        "keywords",
        "job_posting_skills",
    }.issubset(table_names)


def test_unknown_routes_return_404(client: TestClient) -> None:
    response = client.get("/api/v1/definitely-not-a-route")
    assert response.status_code == 404
