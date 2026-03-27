from io import BytesIO
from unittest.mock import patch

from fastapi.testclient import TestClient


def _register_and_login(client: TestClient, email: str, password: str = "password123") -> str:
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _pdf_file(content: bytes = b"fake pdf bytes") -> dict:
    return {
        "file": ("resume.pdf", BytesIO(content), "application/pdf"),
    }


def test_upload_resume_requires_auth(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/resumes",
        files=_pdf_file(),
    )
    assert resp.status_code == 401


@patch("src.app.routes.resumes.ResumeSkillService.extract_skills", return_value=[])
@patch("src.app.routes.resumes.ResumeParseService.parse_file", return_value="John Doe Python FastAPI")
def test_upload_list_get_delete_resume_happy_path(mock_parse, mock_skills, client: TestClient) -> None:
    token = _register_and_login(client, "resume_happy@example.com")

    upload_resp = client.post(
        "/api/v1/resumes",
        files=_pdf_file(),
        headers=_auth(token),
    )
    assert upload_resp.status_code in (200, 201)

    created = upload_resp.json()
    assert created["file_name"] == "resume.pdf"
    assert created["mime_type"] == "application/pdf"
    assert created["user_id"] > 0
    assert "id" in created

    list_resp = client.get("/api/v1/resumes", headers=_auth(token))
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    resume_id = created["id"]

    get_resp = client.get(f"/api/v1/resumes/{resume_id}", headers=_auth(token))
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == resume_id

    delete_resp = client.delete(f"/api/v1/resumes/{resume_id}", headers=_auth(token))
    assert delete_resp.status_code == 200

    get_after_delete_resp = client.get(f"/api/v1/resumes/{resume_id}", headers=_auth(token))
    assert get_after_delete_resp.status_code == 404


@patch("src.app.routes.resumes.ResumeSkillService.extract_skills", return_value=[])
@patch("src.app.routes.resumes.ResumeParseService.parse_file", return_value="John Doe Python FastAPI")
def test_list_only_returns_own_resumes(mock_parse, mock_skills, client: TestClient) -> None:
    token_a = _register_and_login(client, "resume_owner_a@example.com")
    token_b = _register_and_login(client, "resume_owner_b@example.com")

    create_resp = client.post(
        "/api/v1/resumes",
        files=_pdf_file(),
        headers=_auth(token_a),
    )
    assert create_resp.status_code in (200, 201)

    list_resp = client.get("/api/v1/resumes", headers=_auth(token_b))
    assert list_resp.status_code == 200
    assert list_resp.json() == []


@patch("src.app.routes.resumes.ResumeSkillService.extract_skills", return_value=[])
@patch("src.app.routes.resumes.ResumeParseService.parse_file", return_value="John Doe Python FastAPI")
def test_get_resume_wrong_owner(mock_parse, mock_skills, client: TestClient) -> None:
    token_a = _register_and_login(client, "resume_get_a@example.com")
    token_b = _register_and_login(client, "resume_get_b@example.com")

    created = client.post(
        "/api/v1/resumes",
        files=_pdf_file(),
        headers=_auth(token_a),
    ).json()

    resp = client.get(f"/api/v1/resumes/{created['id']}", headers=_auth(token_b))
    assert resp.status_code == 404


@patch("src.app.routes.resumes.ResumeSkillService.extract_skills", return_value=[])
@patch("src.app.routes.resumes.ResumeParseService.parse_file", return_value="John Doe Python FastAPI")
def test_delete_resume_wrong_owner(mock_parse, mock_skills, client: TestClient) -> None:
    token_a = _register_and_login(client, "resume_del_a@example.com")
    token_b = _register_and_login(client, "resume_del_b@example.com")

    created = client.post(
        "/api/v1/resumes",
        files=_pdf_file(),
        headers=_auth(token_a),
    ).json()

    resp = client.delete(f"/api/v1/resumes/{created['id']}", headers=_auth(token_b))
    assert resp.status_code == 404


def test_upload_rejects_oversized_file(client: TestClient) -> None:
    token = _register_and_login(client, "resume_big@example.com")

    oversized_content = b"a" * (5 * 1024 * 1024 + 1)
    resp = client.post(
        "/api/v1/resumes",
        files={
            "file": (
                "large_resume.pdf",
                BytesIO(oversized_content),
                "application/pdf",
            )
        },
        headers=_auth(token),
    )

    assert resp.status_code == 413