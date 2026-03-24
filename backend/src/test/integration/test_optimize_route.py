from fastapi.testclient import TestClient

from src.app.models.job_posting import JobPosting
from src.app.models.keyword import Keyword
from src.app.models.resume import Resume


def _register_and_get_token(client: TestClient, email: str) -> tuple[int, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "John",
            "email": email,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    return data["user"]["id"], data["access_token"]


def test_optimize_happy_path(client: TestClient, db_session, monkeypatch):
    user_id, token = _register_and_get_token(client, "opt1@example.com")

    resume = Resume(
        user_id=user_id,
        file_name="resume.pdf",
        mime_type="application/pdf",
        storage_path="storage/resume.pdf",
        parsed_text="Built Python APIs using FastAPI and Docker.",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    job_posting = JobPosting(
        owner_id=user_id,
        source_url="https://example.com/job",
        content_hash="abc123",
        title="Backend Engineer",
        company="Acme",
        description="Need Python, FastAPI, and Docker experience.",
    )
    db_session.add(job_posting)
    db_session.commit()
    db_session.refresh(job_posting)

    db_session.add(
        Keyword(
            job_posting_id=job_posting.id,
            term="Python",
            category="skill",
            significance_score=0.9,
        )
    )
    db_session.add(
        Keyword(
            job_posting_id=job_posting.id,
            term="FastAPI",
            category="skill",
            significance_score=0.8,
        )
    )
    db_session.commit()

    monkeypatch.setattr(
        "src.app.services.ai_client.optimize_resume",
        lambda **kwargs: {
            "optimized_resume_text": "Optimized resume text",
            "suggestions": ["Add metrics", "Highlight FastAPI"],
            "provider_name": "stubbed-test-provider",
        },
    )

    response = client.post(
        "/api/v1/optimize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "resume_id": resume.id,
            "job_posting_id": job_posting.id,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user_id"] == user_id
    assert body["resume_id"] == resume.id
    assert body["job_posting_id"] == job_posting.id
    assert body["optimized_resume_text"] == "Optimized resume text"
    assert body["suggestions"] == ["Add metrics", "Highlight FastAPI"]


def test_optimize_missing_resume_returns_404(client: TestClient, db_session):
    user_id, token = _register_and_get_token(client, "opt2@example.com")

    job_posting = JobPosting(
        owner_id=user_id,
        source_url="https://example.com/job2",
        content_hash="hash2",
        title="Backend Engineer",
        company="Acme",
        description="Need Python experience.",
    )
    db_session.add(job_posting)
    db_session.commit()
    db_session.refresh(job_posting)

    response = client.post(
        "/api/v1/optimize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "resume_id": 999999,
            "job_posting_id": job_posting.id,
        },
    )

    assert response.status_code == 404
    assert "resume not found" in response.json()["detail"].lower()


def test_optimize_missing_job_posting_returns_404(client: TestClient, db_session):
    user_id, token = _register_and_get_token(client, "opt3@example.com")

    resume = Resume(
        user_id=user_id,
        file_name="resume.pdf",
        mime_type="application/pdf",
        storage_path="storage/resume2.pdf",
        parsed_text="Built APIs with Python.",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    response = client.post(
        "/api/v1/optimize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "resume_id": resume.id,
            "job_posting_id": 999999,
        },
    )

    assert response.status_code == 404
    assert "job posting not found" in response.json()["detail"].lower()


def test_optimize_rate_limit_response_shape(client: TestClient, db_session, monkeypatch):
    user_id, token = _register_and_get_token(client, "opt4@example.com")

    resume = Resume(
        user_id=user_id,
        file_name="resume.pdf",
        mime_type="application/pdf",
        storage_path="storage/resume3.pdf",
        parsed_text="Built APIs with Python.",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    job_posting = JobPosting(
        owner_id=user_id,
        source_url="https://example.com/job4",
        content_hash="hash4",
        title="Engineer",
        company="Acme",
        description="Need Python.",
    )
    db_session.add(job_posting)
    db_session.commit()
    db_session.refresh(job_posting)

    from src.app.services.ai_client import AIRateLimitError

    def raise_rate_limit(**kwargs):
        raise AIRateLimitError("rate limited")

    monkeypatch.setattr("src.app.services.ai_client.optimize_resume", raise_rate_limit)

    response = client.post(
        "/api/v1/optimize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "resume_id": resume.id,
            "job_posting_id": job_posting.id,
        },
    )

    assert response.status_code == 429
    assert response.json() == {
        "detail": "AI provider rate limit exceeded, please try again later"
    }