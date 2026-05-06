from unittest.mock import patch

from fastapi.testclient import TestClient

MOCK_SCRAPED = {
    "title": "Software Engineer",
    "company": "Acme Corp",
    "description": "python fastapi docker aws postgresql rest api developer engineer",
    "content_hash": "abc123def456",
}


def _register_and_login(client: TestClient, email: str, password: str = "password123") -> str:
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── CREATE ────────────────────────────────────────────────────────────────────

@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_create_job_posting(mock_scrape, client: TestClient):
    token = _register_and_login(client, "create@example.com")
    resp = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Software Engineer"
    assert data["company"] == "Acme Corp"
    assert isinstance(data["keywords"], list)
    assert isinstance(data["skills"], list)


@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_create_url_job_prefers_provided_title(mock_scrape, client: TestClient):
    token = _register_and_login(client, "url-title@example.com")
    resp = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1", "title": "Staff Backend Engineer"},
        headers=_auth(token),
    )

    assert resp.status_code == 201
    assert resp.json()["title"] == "Staff Backend Engineer"


@patch(
    "src.app.routes.job_postings.scrape_service.scrape_job_posting",
    return_value={
        "title": None,
        "company": None,
        "description": "python fastapi docker aws postgresql rest api developer engineer",
        "content_hash": "abc123def456",
    },
)
def test_create_url_job_generates_title_from_url_when_metadata_missing(mock_scrape, client: TestClient):
    token = _register_and_login(client, "url-fallback@example.com")
    resp = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/jobs/backend-engineer"},
        headers=_auth(token),
    )

    assert resp.status_code == 201
    assert resp.json()["title"] == "Backend Engineer"


@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_create_requires_auth(mock_scrape, client: TestClient):
    resp = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
    )
    assert resp.status_code == 401


def test_create_rejects_invalid_url(client: TestClient):
    token = _register_and_login(client, "badurl@example.com")
    resp = client.post(
        "/api/v1/job-postings",
        json={"source_url": "not-a-url"},
        headers=_auth(token),
    )
    assert resp.status_code == 422


def test_create_url_rejects_manual_fields(client: TestClient):
    token = _register_and_login(client, "mixed-url@example.com")
    resp = client.post(
        "/api/v1/job-postings",
        json={
            "source_url": "https://example.com/job/1",
            "description": "Build Python services, maintain PostgreSQL infrastructure, and improve API reliability.",
        },
        headers=_auth(token),
    )

    assert resp.status_code == 422
    assert "URL entries" in str(resp.json()["detail"])


def test_create_manual_job_description_without_scrape(client: TestClient):
    token = _register_and_login(client, "manual-job@example.com")
    resp = client.post(
        "/api/v1/job-postings",
        json={
            "title": "Platform Engineer",
            "company": "Acme",
            "description": "Build Python services, maintain PostgreSQL infrastructure, and improve API reliability.",
        },
        headers=_auth(token),
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Platform Engineer"
    assert data["company"] == "Acme"
    assert data["source_url"] is None
    assert "python" in [keyword["term"] for keyword in data["keywords"]]


# ── LIST ──────────────────────────────────────────────────────────────────────

@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_list_job_postings(mock_scrape, client: TestClient):
    token = _register_and_login(client, "list@example.com")
    client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token),
    )
    client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/2"},
        headers=_auth(token),
    )
    resp = client.get("/api/v1/job-postings", headers=_auth(token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["pagination"]["total"] == 2
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["limit"] == 10


@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_list_only_returns_own_postings(mock_scrape, client: TestClient):
    token_a = _register_and_login(client, "owner_a@example.com")
    token_b = _register_and_login(client, "owner_b@example.com")

    client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token_a),
    )

    resp = client.get("/api/v1/job-postings", headers=_auth(token_b))
    assert resp.status_code == 200
    assert resp.json()["items"] == []
    assert resp.json()["pagination"]["total"] == 0


@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_list_job_postings_paginates_with_stable_order(mock_scrape, client: TestClient):
    token = _register_and_login(client, "list-page@example.com")
    for index in range(3):
        client.post(
            "/api/v1/job-postings",
            json={"source_url": f"https://example.com/job/{index}"},
            headers=_auth(token),
        )

    resp = client.get("/api/v1/job-postings?page=1&limit=2", headers=_auth(token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["pagination"]["total"] == 3
    assert data["pagination"]["pages"] == 2
    assert data["pagination"]["has_next"] is True
    assert data["items"][0]["id"] > data["items"][1]["id"]


def test_list_job_postings_rejects_unsafe_limit(client: TestClient):
    token = _register_and_login(client, "list-limit@example.com")
    resp = client.get("/api/v1/job-postings?page=1&limit=500", headers=_auth(token))
    assert resp.status_code == 422


# ── GET BY ID ─────────────────────────────────────────────────────────────────

@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_get_job_posting(mock_scrape, client: TestClient):
    token = _register_and_login(client, "get@example.com")
    created = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token),
    ).json()

    resp = client.get(f"/api/v1/job-postings/{created['id']}", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_get_job_posting_wrong_owner(mock_scrape, client: TestClient):
    token_a = _register_and_login(client, "get_a@example.com")
    token_b = _register_and_login(client, "get_b@example.com")

    created = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token_a),
    ).json()

    resp = client.get(f"/api/v1/job-postings/{created['id']}", headers=_auth(token_b))
    assert resp.status_code == 404


def test_get_job_posting_not_found(client: TestClient):
    token = _register_and_login(client, "notfound@example.com")
    resp = client.get("/api/v1/job-postings/99999", headers=_auth(token))
    assert resp.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_delete_job_posting(mock_scrape, client: TestClient):
    token = _register_and_login(client, "delete@example.com")
    created = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token),
    ).json()

    resp = client.delete(f"/api/v1/job-postings/{created['id']}", headers=_auth(token))
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/job-postings/{created['id']}", headers=_auth(token))
    assert resp.status_code == 404


@patch("src.app.routes.job_postings.scrape_service.scrape_job_posting", return_value=MOCK_SCRAPED)
def test_delete_wrong_owner(mock_scrape, client: TestClient):
    token_a = _register_and_login(client, "del_a@example.com")
    token_b = _register_and_login(client, "del_b@example.com")

    created = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token_a),
    ).json()

    resp = client.delete(f"/api/v1/job-postings/{created['id']}", headers=_auth(token_b))
    assert resp.status_code == 404


# ── SCRAPE ERRORS ─────────────────────────────────────────────────────────────

@patch(
    "src.app.routes.job_postings.scrape_service.scrape_job_posting",
    side_effect=__import__("fastapi").HTTPException(status_code=422, detail="Failed to scrape content from the provided URL"),
)
def test_create_returns_422_on_scrape_failure(mock_scrape, client: TestClient):
    token = _register_and_login(client, "scrapefail@example.com")
    resp = client.post(
        "/api/v1/job-postings",
        json={"source_url": "https://example.com/job/1"},
        headers=_auth(token),
    )
    assert resp.status_code == 422
    assert "scrape" in resp.json()["detail"].lower()
