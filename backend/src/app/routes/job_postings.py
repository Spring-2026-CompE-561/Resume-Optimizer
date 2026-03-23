from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUser
from src.app.exceptions.job_posting_exceptions import job_posting_not_found_exception
from src.app.models.user import User
from src.app.repository.job_posting_repository import JobPostingRepository
from src.app.schemas.job_posting import JobPostingCreate, JobPostingOut
from src.app.services import keyword_service, scrape_service

api_router = APIRouter(prefix="/job-postings", tags=["job-postings"])


@api_router.post("", response_model=JobPostingOut, status_code=201)
def create_job_posting(
    data: JobPostingCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> JobPostingOut:
    url = str(data.source_url)
    scraped = scrape_service.scrape_job_posting(url)

    job_posting = JobPostingRepository.create(
        db,
        owner_id=user.id,
        source_url=url,
        content_hash=scraped["content_hash"],
        title=scraped["title"],
        company=scraped["company"],
        description=scraped["description"],
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
