from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from src.app.schemas.optimize import OptimizedResumeDocument, ResumeSection
from src.app.services import optimize_service
from src.app.services.ai_client import AIRateLimitError, AIProviderError


def make_fake_resume(user_id=7):
    resume = MagicMock()
    resume.id = 1
    resume.user_id = user_id
    resume.parsed_text = "Jane Doe\njane@example.com | github.com/jane\nBuilt Python APIs using FastAPI."
    return resume


def make_fake_job_posting(owner_id=7):
    job = MagicMock()
    job.id = 2
    job.owner_id = owner_id
    job.title = "Backend Engineer"
    job.company = "Acme"
    job.description = "Looking for Python and FastAPI experience."
    job.keywords = [MagicMock(term="Python"), MagicMock(term="FastAPI")]
    return job


def make_fake_user(user_id=7):
    user = MagicMock()
    user.id = user_id
    return user


def make_fake_document() -> OptimizedResumeDocument:
    return OptimizedResumeDocument(
        candidate_name="Jane Doe",
        headline="Backend Engineer",
        contact_line="jane@example.com | github.com/jane",
        summary="Optimized summary",
        skills=["Python", "FastAPI"],
        sections=[ResumeSection(title="Experience", lines=["Built APIs with FastAPI."])],
        suggestions=["Add metrics", "Highlight FastAPI"],
    )


def test_service_persists_rendered_artifacts_and_normalized_suggestions():
    fake_user = make_fake_user()
    fake_resume = make_fake_resume()
    fake_job = make_fake_job_posting()
    fake_document = make_fake_document()

    with (
        patch(
            "src.app.repository.resume_repository.ResumeRepository.get_by_id",
            return_value=fake_resume,
        ),
        patch(
            "src.app.repository.job_posting_repository.JobPostingRepository.get_by_id",
            return_value=fake_job,
        ),
        patch(
            "src.app.services.ai_client.optimize_resume",
            return_value={
                "document": fake_document,
                "suggestions": "- Add metrics\n- Highlight FastAPI",
                "provider_name": "local",
                "latency_ms": 17,
            },
        ),
        patch(
            "src.app.services.storage_service.StorageService.new_optimization_artifact_paths",
            return_value=(
                Path("/tmp/run"),
                Path("/tmp/run/resume.tex"),
                Path("/tmp/run/resume.pdf"),
            ),
        ),
        patch(
            "src.app.services.document_render_service.DocumentRenderService.write_latex",
            return_value="\\documentclass{article}",
        ),
        patch("src.app.services.document_render_service.DocumentRenderService.write_pdf"),
        patch(
            "src.app.services.document_render_service.DocumentRenderService.render_plain_text",
            return_value="Jane Doe\nSummary\nOptimized summary",
        ),
        patch("src.app.repository.optimization_repository.OptimizationRepository.create") as mock_create,
    ):
        mock_create.return_value = MagicMock(id=99)
        optimize_service.optimize_resume_for_user(
            db=None,
            user=fake_user,
            resume_id=1,
            job_posting_id=2,
            customization_notes="Keep it metrics-heavy.",
        )

        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["suggestions"] == ["Add metrics", "Highlight FastAPI"]
        assert call_kwargs["latex_content"] == "\\documentclass{article}"
        assert call_kwargs["pdf_path"] == "/tmp/run/resume.pdf"
        assert call_kwargs["job_keywords"] == ["Python", "FastAPI"]
        assert call_kwargs["customization_notes"] == "Keep it metrics-heavy."


def test_service_raises_429_on_rate_limit():
    fake_user = make_fake_user()
    fake_resume = make_fake_resume()
    fake_job = make_fake_job_posting()

    with (
        patch(
            "src.app.repository.resume_repository.ResumeRepository.get_by_id",
            return_value=fake_resume,
        ),
        patch(
            "src.app.repository.job_posting_repository.JobPostingRepository.get_by_id",
            return_value=fake_job,
        ),
        patch(
            "src.app.services.ai_client.optimize_resume",
            side_effect=AIRateLimitError("rate limited"),
        ),
    ):
        with pytest.raises(HTTPException) as exc:
            optimize_service.optimize_resume_for_user(
                db=None,
                user=fake_user,
                resume_id=1,
                job_posting_id=2,
            )

    assert exc.value.status_code == 429


def test_service_raises_422_on_provider_failure():
    fake_user = make_fake_user()
    fake_resume = make_fake_resume()
    fake_job = make_fake_job_posting()

    with (
        patch(
            "src.app.repository.resume_repository.ResumeRepository.get_by_id",
            return_value=fake_resume,
        ),
        patch(
            "src.app.repository.job_posting_repository.JobPostingRepository.get_by_id",
            return_value=fake_job,
        ),
        patch(
            "src.app.services.ai_client.optimize_resume",
            side_effect=AIProviderError("failed"),
        ),
    ):
        with pytest.raises(HTTPException) as exc:
            optimize_service.optimize_resume_for_user(
                db=None,
                user=fake_user,
                resume_id=1,
                job_posting_id=2,
            )

    assert exc.value.status_code == 422


def test_serialize_run_exposes_pdf_download_url():
    run = MagicMock()
    run.id = 14
    run.user_id = 7
    run.resume_id = 1
    run.job_posting_id = 2
    run.optimized_resume_text = "Optimized text"
    run.latex_content = "\\documentclass{article}"
    run.suggestions = ["Add metrics"]
    run.job_keywords = ["Python"]
    run.customization_notes = None
    run.target_job_title = "Backend Engineer"
    run.target_company = "Acme"
    run.provider_name = "local"
    run.latency_ms = 0
    run.pdf_path = "storage/optimized/x/resume.pdf"
    run.created_at = "2026-01-01T00:00:00"

    serialized = optimize_service.serialize_run(run)

    assert serialized.pdf_download_url == "/api/v1/optimize/14/pdf"
