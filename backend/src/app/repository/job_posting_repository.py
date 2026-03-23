from sqlalchemy import select
from sqlalchemy.orm import Session

from src.app.models.job_posting import JobPosting


class JobPostingRepository:
    """Static-style methods for job posting CRUD operations."""

    @staticmethod
    def create(
        db: Session,
        owner_id: int,
        source_url: str,
        content_hash: str,
        title: str | None,
        company: str | None,
        description: str | None,
    ) -> JobPosting:
        job_posting = JobPosting(
            owner_id=owner_id,
            source_url=source_url,
            content_hash=content_hash,
            title=title,
            company=company,
            description=description,
        )
        db.add(job_posting)
        db.commit()
        db.refresh(job_posting)
        return job_posting

    @staticmethod
    def get_by_id(db: Session, job_posting_id: int) -> JobPosting | None:
        return db.scalars(
            select(JobPosting).where(JobPosting.id == job_posting_id)
        ).first()

    @staticmethod
    def get_all_by_user(db: Session, owner_id: int) -> list[JobPosting]:
        return list(
            db.scalars(
                select(JobPosting).where(JobPosting.owner_id == owner_id)
            ).all()
        )

    @staticmethod
    def delete(db: Session, job_posting: JobPosting) -> None:
        db.delete(job_posting)
        db.commit()
