from time import perf_counter

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


def _extract_prioritized_keywords(job_posting) -> list[str]:
    keywords = getattr(job_posting, "keywords", []) or []
    sorted_keywords = sorted(
        keywords,
        key=lambda k: (-float(getattr(k, "significance_score", 0.0)), getattr(k, "term", "")),
    )

    seen = set()
    ordered_terms: list[str] = []

    for keyword in sorted_keywords:
        term = (getattr(keyword, "term", "") or "").strip()
        lowered = term.lower()
        if term and lowered not in seen:
            seen.add(lowered)
            ordered_terms.append(term)

    return ordered_terms


def _normalize_suggestions(raw_suggestions) -> list[str]:
    if isinstance(raw_suggestions, list):
        return [str(item).strip() for item in raw_suggestions if str(item).strip()]

    if isinstance(raw_suggestions, str):
        normalized: list[str] = []
        for line in raw_suggestions.splitlines():
            cleaned = line.strip().lstrip("-").strip()
            if cleaned:
                normalized.append(cleaned)
        return normalized

    return []


def optimize_resume_for_user(
    *,
    db: Session,
    user: User,
    resume_id: int,
    job_posting_id: int,
):
    resume = ResumeRepository.get_by_id(db, resume_id)
    if not resume or resume.user_id != user.id:
        raise resume_not_found_exception

    job_posting = JobPostingRepository.get_by_id(db, job_posting_id)
    if not job_posting or job_posting.owner_id != user.id:
        raise job_posting_not_found_exception

    prioritized_keywords = _extract_prioritized_keywords(job_posting)

    prompt = prompt_builder.build_optimize_prompt(
        resume_text=resume.parsed_text or "",
        job_description=job_posting.description or "",
        prioritized_keywords=prioritized_keywords,
    )

    started = perf_counter()

    try:
        ai_result = ai_client.optimize_resume(
            prompt=prompt,
            resume_text=resume.parsed_text or "",
            prioritized_keywords=prioritized_keywords,
        )
    except ai_client.AIRateLimitError as exc:
        raise ai_rate_limited_exception from exc
    except ai_client.AIProviderError as exc:
        raise ai_optimization_failed_exception from exc
    except Exception as exc:
        raise ai_optimization_failed_exception from exc

    latency_ms = int((perf_counter() - started) * 1000)

    optimized_resume_text = (
        str(ai_result.get("optimized_resume_text", "")).strip()
        or (resume.parsed_text or "").strip()
    )
    suggestions = _normalize_suggestions(ai_result.get("suggestions"))
    provider_name = ai_result.get("provider_name")

    return OptimizationRepository.create(
        db,
        user_id=user.id,
        resume_id=resume.id,
        job_posting_id=job_posting.id,
        optimized_resume_text=optimized_resume_text,
        suggestions=suggestions,
        provider_name=provider_name,
        latency_ms=latency_ms,
    )