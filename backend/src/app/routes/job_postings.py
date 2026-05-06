import hashlib
import re
from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUser
from src.app.exceptions.job_posting_exceptions import job_posting_not_found_exception
from src.app.repository.job_posting_repository import JobPostingRepository
from src.app.schemas.job_posting import JobPostingCreate, JobPostingOut
from src.app.services import keyword_service, scrape_service

api_router = APIRouter(prefix="/job-postings", tags=["job-postings"])

_GENERIC_URL_TITLE_PARTS = {
    "career",
    "careers",
    "job",
    "jobs",
    "opening",
    "openings",
    "position",
    "positions",
    "role",
    "roles",
}


def _title_from_url(url: str) -> str:
    parsed = urlparse(url)
    path_parts = [unquote(part) for part in parsed.path.split("/") if part]
    candidate = next(
        (
            part
            for part in reversed(path_parts)
            if re.search(r"[a-zA-Z]", part) and part.lower() not in _GENERIC_URL_TITLE_PARTS
        ),
        parsed.netloc.removeprefix("www."),
    )
    candidate = re.sub(r"\.[a-zA-Z0-9]+$", "", candidate)
    candidate = re.sub(r"[-_+]+", " ", candidate)
    candidate = re.sub(r"\s+", " ", candidate).strip()
    return candidate.title() if candidate else "Imported Job Posting"


@api_router.post("", response_model=JobPostingOut, status_code=201)
def create_job_posting(
    data: JobPostingCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> JobPostingOut:
    url = str(data.source_url) if data.source_url else None
    provided_title = data.title.strip() if data.title else None

    if url:
        scraped = scrape_service.scrape_job_posting(url)
        description = scraped["description"]
        title = provided_title or scraped["title"] or _title_from_url(url)
        company = scraped["company"]
        content_hash = scraped["content_hash"]
    else:
        description = data.description.strip()
        title = provided_title or "Custom Job Description"
        company = data.company.strip() if data.company else None
        content_hash = hashlib.sha256(
            "::".join(
                [
                    "",
                    title or "",
                    company or "",
                    description,
                ]
            ).encode("utf-8")
        ).hexdigest()

    job_posting = JobPostingRepository.create(
        db,
        owner_id=user.id,
        source_url=url,
        content_hash=content_hash,
        title=title,
        company=company,
        description=description,
    )

    if job_posting.description:
        keyword_service.extract_and_persist_keywords(db, job_posting.id, job_posting.description)
        db.refresh(job_posting)

    return JobPostingOut.model_validate(job_posting)


@api_router.get("", response_model=list[JobPostingOut])
def list_job_postings(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[JobPostingOut]:
    postings = JobPostingRepository.get_all_by_user(db, owner_id=user.id)
    return [JobPostingOut.model_validate(p) for p in postings]


@api_router.get("/{job_posting_id}", response_model=JobPostingOut)
def get_job_posting(
    job_posting_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> JobPostingOut:
    job_posting = JobPostingRepository.get_by_id(db, job_posting_id)
    if not job_posting or job_posting.owner_id != user.id:
        raise job_posting_not_found_exception
    return JobPostingOut.model_validate(job_posting)


@api_router.delete("/{job_posting_id}", status_code=204)
def delete_job_posting(
    job_posting_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    job_posting = JobPostingRepository.get_by_id(db, job_posting_id)
    if not job_posting or job_posting.owner_id != user.id:
        raise job_posting_not_found_exception
    JobPostingRepository.delete(db, job_posting)


router = api_router
