from pathlib import Path

from sqlalchemy.orm import Session

from src.app.exceptions.job_posting_exceptions import job_posting_not_found_exception
from src.app.exceptions.optimize_exceptions import (
    ai_optimization_failed_exception,
    ai_rate_limited_exception,
    optimization_pdf_unavailable_exception,
    optimization_run_not_found_exception,
)
from src.app.exceptions.resume_exceptions import resume_not_found_exception
from src.app.models.optimization_run import OptimizationRun
from src.app.models.user import User
from src.app.repository.job_posting_repository import JobPostingRepository
from src.app.repository.optimization_repository import OptimizationRepository
from src.app.repository.resume_repository import ResumeRepository
from src.app.schemas.optimize import OptimizationRunCollection, OptimizationRunOut
from src.app.schemas.pagination import build_pagination_meta, pagination_offset
from src.app.services import ai_client, prompt_builder
from src.app.services.document_render_service import DocumentRenderService
from src.app.services.storage_service import StorageService


def get_keywords_from_job_posting(job_posting) -> list[str]:
    keywords = getattr(job_posting, "keywords", []) or []
    result = []
    seen = set()
    for keyword in keywords:
        term = getattr(keyword, "term", "").strip()
        lowered = term.lower()
        if term and lowered not in seen:
            seen.add(lowered)
            result.append(term)
    return result


def parse_suggestions(raw) -> list[str]:
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


def _serialize_run(run: OptimizationRun) -> OptimizationRunOut:
    return OptimizationRunOut(
        id=run.id,
        user_id=run.user_id,
        resume_id=run.resume_id,
        job_posting_id=run.job_posting_id,
        optimized_resume_text=run.optimized_resume_text,
        latex_content=run.latex_content,
        suggestions=run.suggestions or [],
        job_keywords=run.job_keywords or [],
        customization_notes=run.customization_notes,
        target_job_title=run.target_job_title,
        target_company=run.target_company,
        provider_name=run.provider_name,
        latency_ms=run.latency_ms,
        pdf_download_url=(
            f"/api/v1/optimize/{run.id}/pdf" if run.pdf_path else None
        ),
        created_at=run.created_at,
    )


def serialize_run(run: OptimizationRun) -> OptimizationRunOut:
    return _serialize_run(run)


def list_runs_for_user(
    *,
    db: Session,
    user: User,
    page: int,
    limit: int,
) -> OptimizationRunCollection:
    total = OptimizationRepository.count_by_user(db, user.id)
    runs = OptimizationRepository.get_page_by_user(
        db,
        user.id,
        offset=pagination_offset(page=page, limit=limit),
        limit=limit,
    )
    return OptimizationRunCollection(
        items=[_serialize_run(run) for run in runs],
        pagination=build_pagination_meta(page=page, limit=limit, total=total),
    )


def get_run_for_user(*, db: Session, user: User, optimization_run_id: int) -> OptimizationRunOut:
    run = OptimizationRepository.get_by_id(db, optimization_run_id)
    if not run or run.user_id != user.id:
        raise optimization_run_not_found_exception
    return _serialize_run(run)


def get_pdf_path_for_user(*, db: Session, user: User, optimization_run_id: int) -> Path:
    run = OptimizationRepository.get_by_id(db, optimization_run_id)
    if not run or run.user_id != user.id:
        raise optimization_run_not_found_exception
    if not run.pdf_path:
        raise optimization_pdf_unavailable_exception
    pdf_path = Path(run.pdf_path)
    if not pdf_path.exists():
        raise optimization_pdf_unavailable_exception
    return pdf_path


def _create_optimization_run(
    *,
    db: Session,
    user: User,
    resume_id: int | None,
    job_posting_id: int | None,
    resume_text: str,
    job_description: str,
    job_keywords: list[str],
    customization_notes: str | None,
    target_job_title: str | None,
    target_company: str | None,
) -> OptimizationRun:
    prompt = prompt_builder.build_optimize_prompt(
        resume_text=resume_text,
        job_description=job_description,
        prioritized_keywords=job_keywords,
        customization_notes=customization_notes,
        target_title=target_job_title,
        target_company=target_company,
    )

    try:
        ai_result = ai_client.optimize_resume(
            prompt=prompt,
            resume_text=resume_text,
            prioritized_keywords=job_keywords,
            customization_notes=customization_notes,
        )
        document = ai_result["document"]
        _, tex_path, pdf_path = StorageService.new_optimization_artifact_paths()
        latex_content = DocumentRenderService.write_latex(document, tex_path)
        DocumentRenderService.write_pdf(document, pdf_path)
    except ai_client.AIRateLimitError:
        raise ai_rate_limited_exception
    except Exception:
        raise ai_optimization_failed_exception

    optimized_text = DocumentRenderService.render_plain_text(document)
    suggestions = parse_suggestions(ai_result.get("suggestions") or document.suggestions)

    return OptimizationRepository.create(
        db,
        user_id=user.id,
        resume_id=resume_id,
        job_posting_id=job_posting_id,
        optimized_resume_text=optimized_text,
        latex_content=latex_content,
        suggestions=suggestions,
        job_keywords=job_keywords,
        customization_notes=(customization_notes or "").strip() or None,
        resume_plaintext_snapshot=resume_text,
        job_description_snapshot=job_description,
        target_job_title=target_job_title,
        target_company=target_company,
        pdf_path=str(pdf_path),
        provider_name=ai_result.get("provider_name"),
        latency_ms=ai_result.get("latency_ms"),
    )


def optimize_resume_for_user(
    *,
    db: Session,
    user: User,
    resume_id: int,
    job_posting_id: int,
    customization_notes: str | None = None,
) -> OptimizationRun:
    resume = ResumeRepository.get_by_id(db, resume_id)
    if not resume or resume.user_id != user.id:
        raise resume_not_found_exception

    job_posting = JobPostingRepository.get_by_id(db, job_posting_id)
    if not job_posting or job_posting.owner_id != user.id:
        raise job_posting_not_found_exception

    return _create_optimization_run(
        db=db,
        user=user,
        resume_id=resume.id,
        job_posting_id=job_posting.id,
        resume_text=resume.parsed_text or "",
        job_description=job_posting.description or "",
        job_keywords=get_keywords_from_job_posting(job_posting),
        customization_notes=customization_notes,
        target_job_title=job_posting.title,
        target_company=job_posting.company,
    )


def regenerate_for_user(
    *,
    db: Session,
    user: User,
    optimization_run_id: int,
    customization_notes: str | None = None,
) -> OptimizationRun:
    run = OptimizationRepository.get_by_id(db, optimization_run_id)
    if not run or run.user_id != user.id:
        raise optimization_run_not_found_exception

    next_notes = customization_notes if customization_notes is not None else run.customization_notes

    return _create_optimization_run(
        db=db,
        user=user,
        resume_id=run.resume_id,
        job_posting_id=run.job_posting_id,
        resume_text=run.resume_plaintext_snapshot,
        job_description=run.job_description_snapshot,
        job_keywords=run.job_keywords or [],
        customization_notes=next_notes,
        target_job_title=run.target_job_title,
        target_company=run.target_company,
    )
