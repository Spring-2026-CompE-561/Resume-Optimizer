from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.app.models.resume import Resume


class ResumeRepository:
    @staticmethod
    def create(db: Session, resume: Resume) -> Resume:
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume

    @staticmethod
    def get_by_id(db: Session, resume_id: int) -> Resume | None:
        return db.query(Resume).filter(Resume.id == resume_id).first()

    @staticmethod
    def get_all_by_user(db: Session, user_id: int) -> list[Resume]:
        return list(
            db.scalars(
                select(Resume)
                .where(Resume.user_id == user_id)
                .order_by(Resume.created_at.desc(), Resume.id.desc())
            ).all()
        )

    @staticmethod
    def get_page_by_user(db: Session, user_id: int, *, offset: int, limit: int) -> list[Resume]:
        return list(
            db.scalars(
                select(Resume)
                .where(Resume.user_id == user_id)
                .order_by(Resume.created_at.desc(), Resume.id.desc())
                .offset(offset)
                .limit(limit)
            ).all()
        )

    @staticmethod
    def count_by_user(db: Session, user_id: int) -> int:
        return db.scalar(select(func.count()).select_from(Resume).where(Resume.user_id == user_id)) or 0

    @staticmethod
    def delete(db: Session, resume: Resume) -> None:
        db.delete(resume)
        db.commit()
