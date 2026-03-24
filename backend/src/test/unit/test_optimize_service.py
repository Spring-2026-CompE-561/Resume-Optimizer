from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.app.services import ai_client, optimize_service


def test_service_normalizes_string_suggestions(monkeypatch):
    fake_user = SimpleNamespace(id=7)
    fake_resume = SimpleNamespace(id=1, user_id=7, parsed_text="Resume text")
    fake_job_posting = SimpleNamespace(
        id=2,
        owner_id=7,
        description="Job description",
        keywords=[
            SimpleNamespace(term="FastAPI", significance_score=0.9),
            SimpleNamespace(term="Python", significance_score=0.8),
        ],
    )

    monkeypatch.setattr(
        "src.app.repository.resume_repository.ResumeRepository.get_by_id",
        lambda db, resume_id: fake_resume,
    )
    monkeypatch.setattr(
        "src.app.repository.job_posting_repository.JobPostingRepository.get_by_id",
        lambda db, job_posting_id: fake_job_posting,
    )
    monkeypatch.setattr(
        "src.app.services.ai_client.optimize_resume",
        lambda **kwargs: {
            "optimized_resume_text": "Optimized text",
            "suggestions": "- Add metrics\n- Emphasize FastAPI",
            "provider_name": "stub-provider",
        },
    )

    captured = {}

    def fake_create(db, **kwargs):
        captured.update(kwargs)
        return SimpleNamespace(id=99, created_at=None, **kwargs)

    monkeypatch.setattr(
        "src.app.repository.optimization_repository.OptimizationRepository.create",
        fake_create,
    )

    result = optimize_service.optimize_resume_for_user(
        db=None,
        user=fake_user,
        resume_id=1,
        job_posting_id=2,
    )

    assert result.id == 99
    assert captured["suggestions"] == ["Add metrics", "Emphasize FastAPI"]
    assert captured["provider_name"] == "stub-provider"


def test_service_maps_rate_limit_exception(monkeypatch):
    fake_user = SimpleNamespace(id=7)
    fake_resume = SimpleNamespace(id=1, user_id=7, parsed_text="Resume text")
    fake_job_posting = SimpleNamespace(
        id=2,
        owner_id=7,
        description="Job description",
        keywords=[],
    )

    monkeypatch.setattr(
        "src.app.repository.resume_repository.ResumeRepository.get_by_id",
        lambda db, resume_id: fake_resume,
    )
    monkeypatch.setattr(
        "src.app.repository.job_posting_repository.JobPostingRepository.get_by_id",
        lambda db, job_posting_id: fake_job_posting,
    )

    def raise_rate_limit(**kwargs):
        raise ai_client.AIRateLimitError("rate limited")

    monkeypatch.setattr("src.app.services.ai_client.optimize_resume", raise_rate_limit)

    with pytest.raises(HTTPException) as exc:
        optimize_service.optimize_resume_for_user(
            db=None,
            user=fake_user,
            resume_id=1,
            job_posting_id=2,
        )

    assert exc.value.status_code == 429
    assert "rate limit" in exc.value.detail.lower()


def test_service_maps_generic_provider_failure(monkeypatch):
    fake_user = SimpleNamespace(id=7)
    fake_resume = SimpleNamespace(id=1, user_id=7, parsed_text="Resume text")
    fake_job_posting = SimpleNamespace(
        id=2,
        owner_id=7,
        description="Job description",
        keywords=[],
    )

    monkeypatch.setattr(
        "src.app.repository.resume_repository.ResumeRepository.get_by_id",
        lambda db, resume_id: fake_resume,
    )
    monkeypatch.setattr(
        "src.app.repository.job_posting_repository.JobPostingRepository.get_by_id",
        lambda db, job_posting_id: fake_job_posting,
    )

    def raise_failure(**kwargs):
        raise ai_client.AIProviderError("provider failed")

    monkeypatch.setattr("src.app.services.ai_client.optimize_resume", raise_failure)

    with pytest.raises(HTTPException) as exc:
        optimize_service.optimize_resume_for_user(
            db=None,
            user=fake_user,
            resume_id=1,
            job_posting_id=2,
        )

    assert exc.value.status_code == 422
    assert "optimization failed" in exc.value.detail.lower()