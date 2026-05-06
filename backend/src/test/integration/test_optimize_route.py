from pathlib import Path

from fastapi.testclient import TestClient

from src.app.models.job_posting import JobPosting
from src.app.models.keyword import Keyword
from src.app.models.optimization_run import OptimizationRun
from src.app.models.resume import Resume
from src.app.schemas.optimize import OptimizedResumeDocument, ResumeSection


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


def _seed_resume_and_job(db_session, user_id: int) -> tuple[Resume, JobPosting]:
    resume = Resume(
        user_id=user_id,
        file_name="resume.pdf",
        mime_type="application/pdf",
        storage_path="storage/resume.pdf",
        parsed_text="Jane Doe\njane@example.com\nBuilt Python APIs using FastAPI and Docker.",
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
    return resume, job_posting


def _fake_document() -> OptimizedResumeDocument:
    return OptimizedResumeDocument(
        candidate_name="Jane Doe",
        headline="Backend Engineer",
        contact_line="jane@example.com",
        summary="Optimized summary",
        skills=["Python", "FastAPI"],
        sections=[ResumeSection(title="Experience", lines=["Built FastAPI services."])],
        suggestions=["Add metrics", "Highlight FastAPI"],
    )


def test_optimize_happy_path(client: TestClient, db_session, monkeypatch, tmp_path):
    user_id, token = _register_and_get_token(client, "opt1@example.com")
    resume, job_posting = _seed_resume_and_job(db_session, user_id)
    pdf_path = tmp_path / "optimized.pdf"
    pdf_path.write_bytes(b"%PDF-1.4\n%stub\n")

    monkeypatch.setattr(
        "src.app.services.ai_client.optimize_resume",
        lambda **kwargs: {
            "document": _fake_document(),
            "suggestions": ["Add metrics", "Highlight FastAPI"],
            "provider_name": "stubbed-test-provider",
            "latency_ms": 25,
        },
    )
    monkeypatch.setattr(
        "src.app.services.storage_service.StorageService.new_optimization_artifact_paths",
        lambda: (tmp_path, tmp_path / "optimized.tex", pdf_path),
    )

    response = client.post(
        "/api/v1/optimize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "resume_id": resume.id,
            "job_posting_id": job_posting.id,
            "customization_notes": "Keep it concise.",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user_id"] == user_id
    assert body["resume_id"] == resume.id
    assert body["job_posting_id"] == job_posting.id
    assert body["latex_content"].startswith("\\documentclass")
    assert body["pdf_download_url"] == f"/api/v1/optimize/{body['id']}/pdf"
    assert body["suggestions"] == ["Add metrics", "Highlight FastAPI"]
    assert body["job_keywords"] == ["Python", "FastAPI"]
    assert body["customization_notes"] == "Keep it concise."

    list_response = client.get("/api/v1/optimize", headers={"Authorization": f"Bearer {token}"})
    assert list_response.status_code == 200
    listed = list_response.json()
    assert len(listed["items"]) == 1
    assert listed["pagination"]["total"] == 1
    assert listed["pagination"]["page"] == 1
    assert listed["pagination"]["limit"] == 10


def test_list_optimization_runs_paginates_with_stable_order(client: TestClient, db_session):
    user_id, token = _register_and_get_token(client, "opt-list-page@example.com")

    for index in range(3):
        db_session.add(
            OptimizationRun(
                user_id=user_id,
                resume_id=None,
                job_posting_id=None,
                optimized_resume_text=f"Optimized text {index}",
                latex_content="\\documentclass{article}",
                suggestions=[],
                job_keywords=[],
                customization_notes=None,
                resume_plaintext_snapshot="Resume",
                job_description_snapshot="Job",
                target_job_title=f"Backend Engineer {index}",
                target_company="Acme",
                pdf_path=None,
                provider_name="local",
                latency_ms=0,
            )
        )
    db_session.commit()

    first_page = client.get(
        "/api/v1/optimize?page=1&limit=2",
        headers={"Authorization": f"Bearer {token}"},
    )
    second_page = client.get(
        "/api/v1/optimize?page=2&limit=2",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert first_page.status_code == 200
    assert second_page.status_code == 200
    assert len(first_page.json()["items"]) == 2
    assert len(second_page.json()["items"]) == 1
    assert first_page.json()["pagination"]["total"] == 3
    assert first_page.json()["pagination"]["pages"] == 2
    assert first_page.json()["pagination"]["has_next"] is True
    assert second_page.json()["pagination"]["has_previous"] is True
    assert first_page.json()["items"][0]["id"] > first_page.json()["items"][1]["id"]


def test_list_optimization_runs_rejects_unsafe_limit(client: TestClient):
    _, token = _register_and_get_token(client, "opt-list-limit@example.com")
    response = client.get(
        "/api/v1/optimize?page=1&limit=500",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422


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
    resume, job_posting = _seed_resume_and_job(db_session, user_id)

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


def test_regenerate_and_download_pdf(client: TestClient, db_session, monkeypatch, tmp_path):
    user_id, token = _register_and_get_token(client, "opt5@example.com")
    resume, job_posting = _seed_resume_and_job(db_session, user_id)
    pdf_path = tmp_path / "optimized.pdf"
    pdf_path.write_bytes(b"%PDF-1.4\n%stub\n")

    monkeypatch.setattr(
        "src.app.services.ai_client.optimize_resume",
        lambda **kwargs: {
            "document": _fake_document(),
            "suggestions": ["Add metrics"],
            "provider_name": "stubbed-test-provider",
            "latency_ms": 30,
        },
    )
    monkeypatch.setattr(
        "src.app.services.storage_service.StorageService.new_optimization_artifact_paths",
        lambda: (tmp_path, tmp_path / "optimized.tex", pdf_path),
    )

    created = client.post(
        "/api/v1/optimize",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "resume_id": resume.id,
            "job_posting_id": job_posting.id,
        },
    ).json()

    regenerate = client.post(
        f"/api/v1/optimize/{created['id']}/regenerate",
        headers={"Authorization": f"Bearer {token}"},
        json={"customization_notes": "Focus on backend systems."},
    )
    assert regenerate.status_code == 201
    assert regenerate.json()["customization_notes"] == "Focus on backend systems."

    pdf_response = client.get(
        f"/api/v1/optimize/{created['id']}/pdf",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"] == "application/pdf"
    assert pdf_response.content.startswith(b"%PDF")


def test_get_optimization_run_wrong_owner_returns_404(client: TestClient, db_session):
    owner_id, owner_token = _register_and_get_token(client, "owner@example.com")
    _, other_token = _register_and_get_token(client, "other@example.com")

    run = OptimizationRun(
        user_id=owner_id,
        resume_id=None,
        job_posting_id=None,
        optimized_resume_text="Optimized text",
        latex_content="\\documentclass{article}",
        suggestions=["Add metrics"],
        job_keywords=["Python"],
        customization_notes=None,
        resume_plaintext_snapshot="Resume",
        job_description_snapshot="Job",
        target_job_title="Backend Engineer",
        target_company="Acme",
        pdf_path=str(Path("storage/optimized/demo/resume.pdf")),
        provider_name="local",
        latency_ms=0,
    )
    db_session.add(run)
    db_session.commit()
    db_session.refresh(run)

    response = client.get(
        f"/api/v1/optimize/{run.id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 404
