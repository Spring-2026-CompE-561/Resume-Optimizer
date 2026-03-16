from fastapi.testclient import TestClient
from sqlalchemy import inspect

from src.app.core.database import Base, engine
from src.app.main import on_startup


def test_api_v1_routes_are_reachable(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "api": "v1"}


def test_startup_creates_registered_tables() -> None:
    Base.metadata.drop_all(bind=engine)
    on_startup()

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
