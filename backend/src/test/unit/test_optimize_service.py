import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch

from src.app.services import optimize_service
from src.app.services.ai_client import AIRateLimitError, AIProviderError


def make_fake_resume(user_id=7):
    resume = MagicMock()
    resume.id = 1
    resume.user_id = user_id
    resume.parsed_text = "Built Python APIs using FastAPI."
    return resume


def make_fake_job_posting(owner_id=7):
    job = MagicMock()
    job.id = 2
    job.owner_id = owner_id
    job.description = "Looking for Python and FastAPI experience."
    job.keywords = []
    return job


def make_fake_user(user_id=7):
    user = MagicMock()
    user.id = user_id
    return user


def test_service_normalizes_string_suggestions():
    fake_user = make_fake_user()
    fake_resume = make_fake_resume()
    fake_job = make_fake_job_posting()

    with patch("src.app.repository.resume_repository.ResumeRepository.get_by_id", return_value=fake_resume), \
         patch("src.app.repository.job_posting_repository.JobPostingRepository.get_by_id", return_value=fake_job), \
         patch("src.app.services.ai_client.optimize_resume", return_value={
             "optimized_resume_text": "Optimized text",
             "suggestions": "- Add metrics\n- Highlight FastAPI",
             "provider_name": "test",
         }), \
         patch("src.app.repository.optimization_repository.OptimizationRepository.create") as mock_create:

        mock_create.return_value = MagicMock(id=99)
        optimize_service.optimize_resume_for_user(
            db=None,
            user=fake_user,
            resume_id=1,
            job_posting_id=2,
        )

        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["suggestions"] == ["Add metrics", "Highlight FastAPI"]


def test_service_raises_429_on_rate_limit():
    fake_user = make_fake_user()
    fake_resume = make_fake_resume()
    fake_job = make_fake_job_posting()

    with patch("src.app.repository.resume_repository.ResumeRepository.get_by_id", return_value=fake_resume), \
         patch("src.app.repository.job_posting_repository.JobPostingRepository.get_by_id", return_value=fake_job), \
         patch("src.app.services.ai_client.optimize_resume", side_effect=AIRateLimitError("rate limited")):

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

    with patch("src.app.repository.resume_repository.ResumeRepository.get_by_id", return_value=fake_resume), \
         patch("src.app.repository.job_posting_repository.JobPostingRepository.get_by_id", return_value=fake_job), \
         patch("src.app.services.ai_client.optimize_resume", side_effect=AIProviderError("failed")):

        with pytest.raises(HTTPException) as exc:
            optimize_service.optimize_resume_for_user(
                db=None,
                user=fake_user,
                resume_id=1,
                job_posting_id=2,
            )

        assert exc.value.status_code == 422