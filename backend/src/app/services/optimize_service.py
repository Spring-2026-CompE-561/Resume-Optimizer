from sqlalchemy.orm import Session

from src.app.exceptions.job_posting_exceptions import job_posting_not_found_exception
from src.app.exceptions.optimize_exceptions import (
    ai_optimization_failed_exception,
    ai_rate_limited_exception,
)
from src.app.exceptions.resume_exceptions import resume_not_found_exception
from src.app.models.user import User
from src.app.repository.job_posting_repository import JobPostingRepository
from src.app.repository.optimization_repository import OptimizationRepository
from src.app.repository.resume_repository import ResumeRepository
from src.app.services import ai_client, prompt_builder


def get_keywords_from_job_posting(job_posting):
    keywords = getattr(job_posting, "keywords", []) or []
    result = []
    seen = set()
    for keyword in keywords:
        term = getattr(keyword, "term", "").strip()
        if term and term.lower() not in seen:
            seen.add(term.lower())
            result.append(term)
    return result


def parse_suggestions(raw):
    if isinstance(raw, list):
        return [str(item).strip() for item in raw if str(item).strip()]
    if isinstance(raw, str):
        result = []
        for line in raw.splitlines():
            cleaned = line.strip().lstrip("-").strip()
            if cleaned:
                result.append(cleaned)
        return result
    return []


def optimize_resume_for_user(*, db: Session, user: User, resume_id: int, job_posting_id: int):
    resume = ResumeRepository.get_by_id(db, resume_id)
    if not resume or resume.user_id != user.id:
        raise resume_not_found_exception

    job_posting = JobPostingRepository.get_by_id(db, job_posting_id)
    if not job_posting or job_posting.owner_id != user.id:
        raise job_posting_not_found_exception

    keywords = get_keywords_from_job_posting(job_posting)

    prompt = prompt_builder.build_optimize_prompt(
        resume_text=resume.parsed_text or "",
        job_description=job_posting.description or "",
        prioritized_keywords=keywords,
    )

    try:
        ai_result = ai_client.optimize_resume(
            prompt=prompt,
            resume_text=resume.parsed_text or "",
            prioritized_keywords=keywords,
        )
    except ai_client.AIRateLimitError:
        raise ai_rate_limited_exception
    except Exception:
        raise ai_optimization_failed_exception

    optimized_text = ai_result.get("optimized_resume_text", "").strip()
    suggestions = parse_suggestions(ai_result.get("suggestions"))
    provider_name = ai_result.get("provider_name")

    return OptimizationRepository.create(
        db,
        user_id=user.id,
        resume_id=resume.id,
        job_posting_id=job_posting.id,
        optimized_resume_text=optimized_text,
        suggestions=suggestions,
        provider_name=provider_name,
        latency_ms=None,
    )